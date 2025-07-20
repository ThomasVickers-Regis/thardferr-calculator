import { getEffectiveUnitStats, TechLevels, StrategyName } from './getEffectiveUnitStats';
import { UNIT_DATA } from '../data/unitData';

export type Army = Record<string, number>; // { "Elf Archer": 10, ... }
export type PhaseType = 'range' | 'short' | 'melee';

/**
 * Calculates losses for the defending army in a given phase.
 * @param attackingArmy - Object of attacking units and their counts
 * @param defendingArmy - Object of defending units and their counts
 * @param phaseType - 'range', 'short', or 'melee'
 * @param techLevels - Tech levels for the attacker
 * @param activeStrategy - Active strategy for the attacker
 * @param ksDifferenceFactor - Multiplier/divisor for bottomfeeding
 * @returns Object of losses for the defending army: { UnitName: numLost }
 */
export interface DamageLog {
  unitName: string;
  damageReceived: number;
  damageMitigated: number;
  finalDamage: number;
  unitsLost: number;
  buildingEffects: string[];
}

export function calculatePhaseDamage(
  attackingArmy: Army,
  defendingArmy: Army,
  phaseType: PhaseType,
  techLevels: TechLevels,
  activeStrategy: StrategyName | null,
  ksDifferenceFactor: number = 1,
  attackerBuildings: any = {},
  defenderBuildings: any = {},
  isAttacker: boolean = false,
  attackerRace: string = 'dwarf',
  defenderRace: string = 'dwarf'
): { losses: Record<string, number>; damageLog: DamageLog[] } {
  const losses: Record<string, number> = {};
  const damageLog: DamageLog[] = [];
  const defenderUnitNames = Object.keys(defendingArmy).filter(u => defendingArmy[u] > 0);
  if (defenderUnitNames.length === 0) return { losses, damageLog };

  // Calculate total offensive capability for this phase
  let totalOffense = 0;
  for (const [attackerName, attackerCount] of Object.entries(attackingArmy)) {
    if (attackerCount <= 0) continue;
    const attackerStats = getEffectiveUnitStats(attackerName, attackerRace, techLevels, activeStrategy, true, ksDifferenceFactor);
    
    let attackValue = 0;
    if (phaseType === 'range') attackValue = attackerStats.range;
    else if (phaseType === 'short') attackValue = attackerStats.short;
    else if (phaseType === 'melee') attackValue = attackerStats.melee;
    
    // Apply unit-to-unit combat bonuses (Anti-Cavalry strategy)
    if (activeStrategy === 'Anti-Cavalry' && phaseType === 'melee') {
      // Check if this is a pikeman unit attacking mounted units
      if (attackerName.toLowerCase().includes('pikeman')) {
        // Check if defender has mounted units (units with horses)
        const hasMountedUnits = defenderUnitNames.some(unit => 
          unit.toLowerCase().includes('knight') || 
          unit.toLowerCase().includes('caragous') || 
          unit.toLowerCase().includes('rider') ||
          unit.toLowerCase().includes('mounted')
        );
        if (hasMountedUnits) {
          attackValue *= 3.5; // Pikemen get 3.5x damage vs mounted units
        }
      }
    }
    
    totalOffense += attackerCount * attackValue;
  }

  // Calculate total defensive capability for this phase
  let totalDefense = 0;
  const unitImmunities: Record<string, number> = {}; // Track immunities for damage distribution
  
  for (const defenderName of defenderUnitNames) {
    const defenderCount = defendingArmy[defenderName];
    const defenderStats = getEffectiveUnitStats(defenderName, defenderRace, {}, null, false, ksDifferenceFactor);
    
    let defenseValue = defenderStats.defense;
    // For ranged phases, use ranged defense (same as defense for now)
    // For melee phase, use melee defense (same as defense for now)
    
    // Apply unit-specific immunities and resistances
    let immunityPercent = 0;
    
    // Mage: Invulnerable to melee phase
    if (defenderName.toLowerCase().includes('mage') && phaseType === 'melee') {
      immunityPercent = 100;
    }
    
    // Orc Shadow Warrior: 80% immunity in melee, 75% with Orc strategy
    if (defenderName.toLowerCase().includes('shadow warrior') && phaseType === 'melee') {
      immunityPercent = activeStrategy === 'Orc' ? 75 : 80;
    }
    
    // Undead Legion Skeleton: Immunity to long range (range phase)
    if (defenderName.toLowerCase().includes('skeleton') && phaseType === 'range') {
      immunityPercent = 100;
    }
    
    // Dwarf Shield Line: Immunity to long range based on shieldbearer ratio
    if (activeStrategy === 'Shield Line' && phaseType === 'range') {
      const totalArmySize = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);
      const shieldbearerCount = defendingArmy['Shieldbearer'] || 0;
      if (totalArmySize > 0) {
        const shieldbearerRatio = shieldbearerCount / totalArmySize;
        immunityPercent = Math.min(100, shieldbearerRatio * 200); // Times 2 as specified
      }
    }
    
    // Apply immunity to defense calculation
    const effectiveDefense = defenseValue * (1 - immunityPercent / 100);
    totalDefense += defenderCount * effectiveDefense;
    
    // Store immunity for damage distribution
    unitImmunities[defenderName] = immunityPercent;
  }

  // Calculate building bonuses (distributed per unit)
  let buildingDefenseBonus = 0;
  const totalDefenders = defenderUnitNames.reduce((sum, u) => sum + defendingArmy[u], 0);
  
  if (phaseType === 'range' && defenderBuildings['Guard Towers']) {
    const towers = defenderBuildings['Guard Towers'] || 0;
    // Distribute tower defense across all units (max 2 damage reduction per unit)
    const maxReductionPerUnit = 2;
    const totalReduction = Math.min(towers * 40, totalDefenders * maxReductionPerUnit);
    buildingDefenseBonus = totalDefenders > 0 ? totalReduction / totalDefenders : 0;
  }
  if (phaseType === 'melee' && defenderBuildings['Medical Center']) {
    const med = defenderBuildings['Medical Center'] || 0;
    const maxReductionPerUnit = isAttacker ? 1 : 2;
    const damagePerCenter = isAttacker ? 50 : 75;
    const totalReduction = Math.min(med * damagePerCenter, totalDefenders * maxReductionPerUnit);
    buildingDefenseBonus = totalDefenders > 0 ? totalReduction / totalDefenders : 0;
  }

  // Calculate total damage with more balanced formula
  // Use a hybrid approach: when offense > defense, use offense - defense
  // When offense < defense, use a smaller percentage of offense
  let totalDamage = 0;
  if (totalOffense > (totalDefense + buildingDefenseBonus)) {
    // Attacker is stronger - use the difference
    totalDamage = totalOffense - (totalDefense + buildingDefenseBonus);
  } else {
    // Attacker is weaker - use a much more generous percentage of offense
    const relativeStrength = totalOffense / (totalDefense + buildingDefenseBonus);
    totalDamage = totalOffense * relativeStrength * 1.2; // Increased to 1.2 for much more generous combat
  }
  
  // Ensure minimum damage for very weak attackers (at least 25% of their offense)
  const minimumDamage = totalOffense * 0.25;
  if (totalDamage < minimumDamage && totalOffense > 0) {
    totalDamage = minimumDamage;
  }
  

  
  // Distribute damage across defending units (weighted by count) - use old working approach
  
  for (const defenderName of defenderUnitNames) {
    const defenderCount = defendingArmy[defenderName];
    const defenderStats = getEffectiveUnitStats(defenderName, defenderRace, {}, null, false, ksDifferenceFactor);
    const immunityPercent = unitImmunities[defenderName] || 0;
    
    // Calculate damage share for this unit
    const damageShare = totalDefenders > 0 ? (defenderCount / totalDefenders) * totalDamage : 0;
    
    // Apply immunity to damage
    const effectiveDamage = damageShare * (1 - immunityPercent / 100);
    
      // Calculate units lost using a hybrid approach
  let unitsLost = 0;
  if (effectiveDamage > 0) {
    // Method 1: Traditional damage/defense per unit
    const damagePerKill = defenderStats.defense;
    const traditionalLosses = Math.floor(effectiveDamage / damagePerKill);
    
    // Method 2: Proportional casualties based on damage ratio
    const totalArmyDefense = totalDefense + buildingDefenseBonus;
    const damageRatio = totalDamage / totalArmyDefense;
    const proportionalLosses = Math.floor(defenderCount * damageRatio * 0.5); // 50% of proportional
    
    // Use the higher of the two methods
    unitsLost = Math.max(traditionalLosses, proportionalLosses);
    
    // Ensure at least 1 unit dies if there's significant damage (unless immunity prevents it)
    if (effectiveDamage >= damagePerKill * 0.3 && unitsLost === 0 && immunityPercent < 100) {
      unitsLost = 1;
    }
    
    unitsLost = Math.min(unitsLost, defenderCount); // Can't lose more than we have
  }
    
    losses[defenderName] = unitsLost;
    

    
    // Create damage log entry with immunity info
    const totalArmySize = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);
    
    // Only show building effects if damage was actually received
    const buildingEffects = [];
    if (totalDamage > 0 && buildingDefenseBonus > 0) {
      buildingEffects.push(`Building bonus: -${buildingDefenseBonus.toFixed(1)} damage per unit`);
    }
    if (immunityPercent > 0) {
      buildingEffects.push(`${immunityPercent}% immunity applied`);
    }
    
    damageLog.push({
      unitName: defenderName,
      damageReceived: damageShare,
      damageMitigated: totalDamage > 0 ? (buildingDefenseBonus * defenderCount) + (damageShare - effectiveDamage) : 0,
      finalDamage: effectiveDamage,
      unitsLost: losses[defenderName],
      buildingEffects: buildingEffects
    });
  }

  return { losses, damageLog };
} 