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
  // Clone defendingArmy to track losses
  const losses: Record<string, number> = {};
  const damageLog: DamageLog[] = [];
  const defenderUnitNames = Object.keys(defendingArmy).filter(u => defendingArmy[u] > 0);
  if (defenderUnitNames.length === 0) return { losses, damageLog };

  // Track damage per unit
  const damagePerUnit: Record<string, number> = {};
  const buildingEffectsPerUnit: Record<string, string[]> = {};
  
  // Initialize damage tracking
  for (const unit of defenderUnitNames) {
    damagePerUnit[unit] = 0;
    buildingEffectsPerUnit[unit] = [];
  }

  // Calculate total defenders for building effects
  const totalDefenders = defenderUnitNames.reduce((sum, u) => sum + defendingArmy[u], 0);

  // Calculate building effects
  if (phaseType === 'range' && defenderBuildings['Guard Towers']) {
    const towers = defenderBuildings['Guard Towers'] || 0;
    const maxReductionPerUnit = 2;
    const totalReduction = Math.min(towers * 40, totalDefenders * maxReductionPerUnit);
    const reductionPerUnit = totalDefenders > 0 ? totalReduction / totalDefenders : 0;
    
    for (const unit of defenderUnitNames) {
      const unitCount = defendingArmy[unit];
      const unitReduction = reductionPerUnit * unitCount;
      buildingEffectsPerUnit[unit].push(`Guard Towers: -${unitReduction.toFixed(1)} damage (${towers} towers)`);
    }
  }
  
  if (phaseType === 'melee' && defenderBuildings['Medical Center']) {
    const med = defenderBuildings['Medical Center'] || 0;
    const maxReductionPerUnit = isAttacker ? 1 : 2;
    const damagePerCenter = isAttacker ? 50 : 75;
    const totalReduction = Math.min(med * damagePerCenter, totalDefenders * maxReductionPerUnit);
    const reductionPerUnit = totalDefenders > 0 ? totalReduction / totalDefenders : 0;
    
    for (const unit of defenderUnitNames) {
      const unitCount = defendingArmy[unit];
      const unitReduction = reductionPerUnit * unitCount;
      buildingEffectsPerUnit[unit].push(`Medical Center: -${unitReduction.toFixed(1)} damage (${med} centers)`);
    }
  }

  // For each attacking unit type
  for (const [attackerName, attackerCount] of Object.entries(attackingArmy)) {
    if (attackerCount <= 0) continue;
    
    // Get effective stats for this attacker
    const attackerStats = getEffectiveUnitStats(attackerName, attackerRace, techLevels, activeStrategy, true, ksDifferenceFactor);
    
    // Determine attack value for this phase
    let attackValue = 0;
    if (phaseType === 'range') attackValue = attackerStats.range;
    else if (phaseType === 'short') attackValue = attackerStats.short;
    else if (phaseType === 'melee') attackValue = attackerStats.melee;
    if (attackValue <= 0) continue;

    // Calculate total damage from this attacker type
    const totalDamageFromAttacker = attackerCount * attackValue;
    
    // Distribute damage across defending units (weighted by count)
    const totalDefenders = defenderUnitNames.reduce((sum, u) => sum + defendingArmy[u], 0);
    if (totalDefenders === 0) continue;
    
    for (const defenderName of defenderUnitNames) {
      const defenderCount = defendingArmy[defenderName];
      const damageShare = (defenderCount / totalDefenders) * totalDamageFromAttacker;
      damagePerUnit[defenderName] += damageShare;
    }
  }

  // Calculate final losses for each unit
  for (const unit of defenderUnitNames) {
    const totalDamage = damagePerUnit[unit];
    const unitCount = defendingArmy[unit];
    const defenderStats = getEffectiveUnitStats(unit, defenderRace, {}, null, false, ksDifferenceFactor);
    const defenseValue = defenderStats.defense;
    
    // Calculate damage mitigation from buildings
    let damageMitigated = 0;
    if (buildingEffectsPerUnit[unit].length > 0) {
      // Extract mitigation from building effects
      const mitigationMatch = buildingEffectsPerUnit[unit][0].match(/-(\d+\.?\d*) damage/);
      if (mitigationMatch) {
        damageMitigated = parseFloat(mitigationMatch[1]);
      }
    }
    
    const finalDamage = Math.max(0, totalDamage - damageMitigated);
    
    // Calculate units lost based on damage vs defense
    let unitsLost = 0;
    if (finalDamage > 0) {
      // Each unit needs to take damage equal to its defense to be killed
      const damagePerKill = defenseValue;
      unitsLost = Math.floor(finalDamage / damagePerKill);
      unitsLost = Math.min(unitsLost, unitCount); // Can't lose more than we have
    }
    
    losses[unit] = unitsLost;
    
    // Create damage log entry
    damageLog.push({
      unitName: unit,
      damageReceived: Math.round(totalDamage * 100) / 100,
      damageMitigated: Math.round(damageMitigated * 100) / 100,
      finalDamage: Math.round(finalDamage * 100) / 100,
      unitsLost: unitsLost,
      buildingEffects: buildingEffectsPerUnit[unit]
    });
  }

  return { losses, damageLog };
} 