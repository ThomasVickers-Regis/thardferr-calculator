import { getEffectiveUnitStats, TechLevels, StrategyName, isInfantryUnit, isPikemanUnit, isMountedUnit } from './getEffectiveUnitStats';
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
  trueEffectiveDefense?: number; // For UI display of real defense used
  appliedRedistributionBonus?: number; // For UI display of redistribution bonus
}

function isArcherUnit(unitName: string, race?: string) {
  // Optionally, you can add a flag in unitData for archers in the future
  return unitName.toLowerCase().includes('archer');
}
function isSwordmanUnit(unitName: string, race?: string) {
  return unitName.toLowerCase().includes('swordman');
}
function isShieldbearerUnit(unitName: string, race?: string) {
  return unitName.toLowerCase().includes('shieldbearer');
}
function isShadowWarriorUnit(unitName: string, race?: string) {
  return unitName.toLowerCase().includes('shadow warrior');
}
function isMageUnit(unitName: string, race?: string) {
  return unitName.toLowerCase().includes('mage');
}
function isSkeletonUnit(unitName: string, race?: string) {
  return unitName.toLowerCase().includes('skeleton');
}

export function calculatePhaseDamage(
  attackingArmy: Army,
  defendingArmy: Army,
  phaseType: PhaseType,
  techLevels: TechLevels,
  attackerStrategy: StrategyName | null,
  defenderStrategy: StrategyName | null,
  processedArmyStrategy: StrategyName | null,
  ksDifferenceFactor: number = 1,
  attackerBuildings: any = {},
  defenderBuildings: any = {},
  isAttacker: boolean = false,
  attackerRace: string = 'dwarf',
  defenderRace: string = 'dwarf',
  originalDefendingArmy?: Army
): { losses: Record<string, number>; damageLog: DamageLog[] } {
  const losses: Record<string, number> = {};
  const damageLog: DamageLog[] = [];
  const defenderUnitNames = Object.keys(defendingArmy).filter(u => defendingArmy[u] > 0);
  if (defenderUnitNames.length === 0) return { losses, damageLog };

  // Calculate total offensive capability for this phase
  let totalOffense = 0;
  for (const [attackerName, attackerCount] of Object.entries(attackingArmy)) {
    if (attackerCount <= 0) continue;
    const attackerStats = getEffectiveUnitStats(attackerName, attackerRace, techLevels, attackerStrategy, true, ksDifferenceFactor);
    
    let attackValue = 0;
    if (phaseType === 'range') attackValue = attackerStats.range;
    else if (phaseType === 'short') attackValue = attackerStats.short;
    else if (phaseType === 'melee') attackValue = attackerStats.melee;
    
    // Apply unit-to-unit combat bonuses (Anti-Cavalry strategy)
    if (attackerStrategy === 'Anti-Cavalry' && phaseType === 'melee') {
      // Check if this is a pikeman unit attacking mounted units
      if (isPikemanUnit(attackerName, attackerRace)) {
        // Check if defender has mounted units (units with horses)
        const hasMountedUnits = defenderUnitNames.some(unit => 
          isMountedUnit(unit, defenderRace)
        );
        if (hasMountedUnits) {
          attackValue *= 3.5; // Pikemen get 3.5x damage vs mounted units
        }
      }
    }
    
    // Apply Archer Protection strategy (archer damage reduction by infantry attack)
    if (attackerStrategy === 'Archer Protection' && phaseType === 'range') {
      if (isArcherUnit(attackerName, attackerRace)) {
        // Check if defender has infantry units that could protect archers
        const hasInfantry = defenderUnitNames.some(unit => 
          isInfantryUnit(unit, defenderRace)
        );
        if (hasInfantry) {
          // Reduce archer damage when infantry is present (simplified implementation)
          attackValue *= 0.8; // 20% reduction
        }
      }
    }
    
    // Apply Gnome Far Fighting strategy (doubles long range attacks for both sides)
    if ((attackerStrategy === 'Gnome Far Fighting' || defenderStrategy === 'Gnome Far Fighting') && 
        (phaseType === 'range' || phaseType === 'short')) {
      attackValue *= 2;
    }
    
    // Apply Orc Surrounding strategy (Shadow Warriors deal damage in short phase)
    if (attackerStrategy === 'Orc Surrounding' && phaseType === 'short' && 
        isShadowWarriorUnit(attackerName, attackerRace)) {
      // Shadow Warriors get their full melee damage in short phase
      attackValue = attackerStats.melee;
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
    
    // Mage: Invulnerable to melee phase (unless Elf Energy Gathering strategy is active)
    if (isMageUnit(defenderName, defenderRace) && phaseType === 'melee') {
      if (defenderStrategy === 'Elf Energy Gathering') {
        // Mages lose melee immunity but get +2 defense in melee
        immunityPercent = 0;
        defenseValue += 2;
      } else {
        immunityPercent = 100;
      }
    }
    
    // Orc Shadow Warrior: 80% immunity in melee, 75% with Orc strategy
    if (isShadowWarriorUnit(defenderName, defenderRace) && phaseType === 'melee') {
      immunityPercent = defenderStrategy === 'Orc' ? 75 : 80;
    }
    
    // Undead Legion Skeleton: Immunity to long range (range phase)
    if (isSkeletonUnit(defenderName, defenderRace) && phaseType === 'range') {
      immunityPercent = 100;
    }
    
    // Dwarf Shield Line: Immunity to long range based on shieldbearer ratio
    if (defenderStrategy === 'Dwarf Shield Line' && phaseType === 'range') {
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
  // Only count living units (count > 0) for mitigation division
  const totalDefenders = defenderUnitNames.reduce((sum, u) => sum + (defendingArmy[u] > 0 ? defendingArmy[u] : 0), 0);
  

  
  if (phaseType === 'range' && defenderBuildings['Guard Towers'] && defenderBuildings['Guard Towers'] > 0) {
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

  // Apply strategy redistribution effects
  let redistributionBonus = 0;
  
  // Archer Protection: Infantry attack loss redistributed as defense to archers
  if (defenderStrategy === 'Archer Protection' && phaseType === 'range') {
    const infantryUnits = defenderUnitNames.filter(unit => 
      isInfantryUnit(unit, defenderRace) ||
      isSwordmanUnit(unit, defenderRace) ||
      isPikemanUnit(unit, defenderRace) ||
      isShieldbearerUnit(unit, defenderRace)
    );
    
    let totalInfantryAttackLoss = 0;
    for (const infantryUnit of infantryUnits) {
      const infantryCount = defendingArmy[infantryUnit];
      const infantryStats = getEffectiveUnitStats(infantryUnit, defenderRace, {}, null, false, ksDifferenceFactor);
      // Calculate the attack loss (50% of normal attack)
      totalInfantryAttackLoss += infantryCount * (infantryStats.melee * 0.5);
    }
    
    // Redistribute as defense to archers
    const archerUnits = defenderUnitNames.filter(unit => 
      isArcherUnit(unit, defenderRace)
    );
    
    if (archerUnits.length > 0) {
      const totalArchers = archerUnits.reduce((sum, unit) => sum + defendingArmy[unit], 0);
      if (totalArchers > 0) {
        redistributionBonus = totalInfantryAttackLoss / totalArchers;
      }
    }
  }
  
  // Infantry Attack: Infantry defense loss redistributed as defense to other units
  let redistributionBonuses: Record<string, number> = {};
  if (processedArmyStrategy === 'Infantry Attack') {
    const raceKey = defenderRace.toLowerCase();
    const armyForRedistribution = originalDefendingArmy || defendingArmy;
    let totalInfantryDefenseLoss = 0;
    // Only count non-infantry units with count > 0
    let totalNonInfantryCount = 0;
    for (const unit of Object.keys(armyForRedistribution)) {
      const count = armyForRedistribution[unit];
      const baseStats = UNIT_DATA[raceKey]?.[unit];
      if (!baseStats) continue;
      if (isInfantryUnit(unit, defenderRace)) {
        const effectiveStats = getEffectiveUnitStats(unit, raceKey, techLevels, processedArmyStrategy, false, ksDifferenceFactor);
        const loss = (baseStats.defense - effectiveStats.defense) * count;
        totalInfantryDefenseLoss += loss;
      } else {
        if (count > 0) totalNonInfantryCount += count;
      }
    }
    for (const unit of Object.keys(armyForRedistribution)) {
      if (!isInfantryUnit(unit, defenderRace)) {
        const count = armyForRedistribution[unit];
        // Each unit gets a share proportional to its count
        redistributionBonuses[unit] = (count > 0 && totalNonInfantryCount > 0)
          ? (totalInfantryDefenseLoss * (count / totalNonInfantryCount)) / count
          : 0;
      }
    }
  }
  

  
  // Distribute damage across defending units (weighted by count) - use old working approach
  
  for (const defenderName of defenderUnitNames) {
    const defenderCount = defendingArmy[defenderName];
    const defenderStats = getEffectiveUnitStats(defenderName, defenderRace, {}, null, false, ksDifferenceFactor);
    let effectiveDefense = defenderStats.defense;
    const immunityPercent = unitImmunities[defenderName] || 0;

    // Only show building effects if damage was actually received
    const buildingEffects = [];

    // Apply Infantry Attack redistribution bonus to non-infantry units
    let redistributionMitigation = 0;
    let appliedRedistributionBonus = 0;
    if (processedArmyStrategy === 'Infantry Attack' && !isInfantryUnit(defenderName, defenderRace)) {
      const beforeRedistribution = effectiveDefense;
      const bonus = redistributionBonuses[defenderName] || 0;
      effectiveDefense += bonus;
      appliedRedistributionBonus = bonus;
      redistributionMitigation = bonus * defenderCount; // Total mitigation from redistribution
      // Add a log entry for the redistributed defense bonus
      buildingEffects.push(`Infantry Attack: +${bonus.toFixed(2)} defense redistributed from infantry`);
    }

    // Apply immunity to defense calculation
    effectiveDefense = effectiveDefense * (1 - immunityPercent / 100);

    // Calculate raw damage share BEFORE mitigation (i.e., before buildingDefenseBonus is applied)
    // To do this, we need to recalculate what the unit's share would have been if totalDamage was based on totalOffense - totalDefense (no buildingDefenseBonus)
    let rawTotalDamage = 0;
    if (totalOffense > totalDefense) {
      rawTotalDamage = totalOffense - totalDefense;
    } else {
      const relativeStrength = totalOffense / totalDefense;
      rawTotalDamage = totalOffense * relativeStrength * 1.2;
    }
    const rawDamageShare = totalDefenders > 0 ? (defenderCount / totalDefenders) * rawTotalDamage : 0;
    // Apply immunity to raw damage
    const rawEffectiveDamage = rawDamageShare * (1 - immunityPercent / 100);

    // Calculate damage share for this unit (after mitigation)
    const damageShare = totalDefenders > 0 ? (defenderCount / totalDefenders) * totalDamage : 0;
    // Apply immunity to damage
    const effectiveDamage = damageShare * (1 - immunityPercent / 100);

    // Calculate units lost using a hybrid approach
    let unitsLost = 0;
    if (effectiveDamage > 0) {
      // Method 1: Traditional damage/defense per unit
      const damagePerKill = effectiveDefense;
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

    // Only show building effects if damage was actually received
    if (totalDamage > 0 && buildingDefenseBonus > 0 && ((phaseType === 'range' && defenderBuildings['Guard Towers'] && defenderBuildings['Guard Towers'] > 0) || (phaseType === 'melee' && defenderBuildings['Medical Center'] && defenderBuildings['Medical Center'] > 0))) {
      buildingEffects.push(`Building bonus: -${buildingDefenseBonus.toFixed(1)} damage per unit`);
    }
    if (immunityPercent > 0) {
      buildingEffects.push(`${immunityPercent}% immunity applied`);
    }

    damageLog.push({
      unitName: defenderName,
      damageReceived: rawEffectiveDamage,
      damageMitigated: Math.max(0, rawEffectiveDamage - effectiveDamage),
      finalDamage: effectiveDamage,
      unitsLost: losses[defenderName],
      buildingEffects: buildingEffects, // keep the property name for compatibility
      trueEffectiveDefense: effectiveDefense,
      appliedRedistributionBonus: appliedRedistributionBonus
    });
  }

  return { losses, damageLog };
} 