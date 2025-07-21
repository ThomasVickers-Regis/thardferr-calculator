import { getEffectiveUnitStats, TechLevels, StrategyName, isInfantryUnit, isPikemanUnit, isMountedUnit } from './getEffectiveUnitStats';
import { UNIT_DATA } from '../data/unitData';

// UWDA: Unit Weights by race and unit name
export const UNIT_WEIGHTS: Record<string, Record<string, number>> = {
  dwarf: {
    Shieldbearer: 3,
    HammerWheilder: 2,
    AxeMan: 2,
    Runner: 2,
    LightCrossbowman: 2,
    HeavyCrossbowman: 1
  },
  elf: {
    Mage: 1,
    Swordman: 3,
    Lanceman: 3,
    Caragous: 2,
    Archer: 3,
    EliteArcher: 1.5
  },
  gnome: {
    Catapult: 1,
    Infantry: 2,
    Militia: 3,
    Rider: 2,
    RockThrower: 3,
    Balista: 1
  },
  human: {
    Knight: 1,
    Infantry: 3,
    Pikeman: 3,
    HeavyInfantry: 2.5,
    Archer: 2,
    MountedArchers: 1
  },
  orc: {
    ShadowWarrior: 1,
    Rusher: 3,
    Slother: 3,
    WolfMaster: 2,
    Slinger: 2.5,
    AxeThrower: 1.5
  },
  undead: {
    DarkKnight: 1,
    SkeletonWarrior: 3,
    WraithPikeman: 3,
    Abomination: 2,
    PhantomArcher: 3,
    WraithRider: 1
  }
};

export type Army = Record<string, number>;
export type PhaseType = 'range' | 'short' | 'melee';

export interface DamageLog {
  unitName: string;
  damageReceived: number;
  damageMitigated: number;
  finalDamage: number;
  unitsLost: number;
  buildingEffects: string[];
  trueEffectiveDefense?: number;
  appliedRedistributionBonus?: number;
  // Add detailed breakdown for UI clarity
  breakdown?: {
    initialShare: number;
    afterDefenseScaling: number;
    afterMitigation: number;
    afterImmunity: number;
    final: number;
    mitigationDetails: string[];
    unitWeight: number;
  };
}

function isArcherUnit(unitName: string, race?: string) {
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
  originalDefendingArmy?: Army,
  isDefender?: boolean // new optional flag
): { losses: Record<string, number>; damageLog: DamageLog[] } {
  const losses: Record<string, number> = {};
  const damageLog: DamageLog[] = [];
  const defenderUnitNames = Object.keys(defendingArmy).filter(u => defendingArmy[u] > 0);
  if (defenderUnitNames.length === 0) return { losses, damageLog };

  // 1. Calculate total offensive capability for this phase
  let totalOffense = 0;
  for (const [attackerName, attackerCount] of Object.entries(attackingArmy)) {
    if (attackerCount <= 0) continue;
    const attackerStats = getEffectiveUnitStats(attackerName, attackerRace, techLevels, attackerStrategy, true, ksDifferenceFactor);
    let attackValue = 0;
    if (phaseType === 'range') attackValue = attackerStats.range;
    else if (phaseType === 'short') attackValue = attackerStats.short;
    else if (phaseType === 'melee') attackValue = attackerStats.melee;
    // Apply unit-to-unit and strategy bonuses here if needed
    totalOffense += attackerCount * attackValue;
  }

  // 1. Gather base stats and all tech/strategy modifiers for each unit for display
  const baseStatsMap: Record<string, any> = {};
  const techStrategyModifiersMap: Record<string, any> = {};
  for (const defenderName of defenderUnitNames) {
    const baseStats = UNIT_DATA[defenderRace.toLowerCase()]?.[defenderName] || {};
    baseStatsMap[defenderName] = { ...baseStats };
    // Calculate all tech/strategy modifiers for display
    const effectiveStats = getEffectiveUnitStats(defenderName, defenderRace, techLevels, defenderStrategy, false, ksDifferenceFactor);
    techStrategyModifiersMap[defenderName] = {
      defense: (effectiveStats.defense - baseStats.defense),
      melee: (effectiveStats.melee - baseStats.melee),
      short: (effectiveStats.short - baseStats.short),
      range: (effectiveStats.range - baseStats.range)
    };
  }

  // 2. For Infantry Attack, apply 75% defense reduction to all infantry units and sum total defense lost
  let redistributionBonuses: Record<string, number> = {};
  let totalInfantryDefenseLoss = 0;
  let totalNonInfantryCount = 0;
  if (processedArmyStrategy === 'Infantry Attack') {
    // All redistribution logic and debug output only runs if Infantry Attack is active
    for (const defenderName of defenderUnitNames) {
      const count = defendingArmy[defenderName];
      const baseStats = baseStatsMap[defenderName];
      let effectiveDefense = baseStats.defense;
      // Add tech/strategy modifiers (except Infantry Attack reduction)
      effectiveDefense += techStrategyModifiersMap[defenderName].defense;
      const isInf = isInfantryUnit(defenderName, defenderRace);
      if (isInf) {
        const reducedDefense = effectiveDefense * 0.25;
        const loss = (effectiveDefense - reducedDefense) * count;
        totalInfantryDefenseLoss += loss;
        baseStatsMap[defenderName].finalDefense = reducedDefense;
      } else {
        if (count > 0) totalNonInfantryCount += count;
        baseStatsMap[defenderName].finalDefense = effectiveDefense;
      }
    }
    for (const defenderName of defenderUnitNames) {
      if (!isInfantryUnit(defenderName, defenderRace)) {
        const count = defendingArmy[defenderName];
        redistributionBonuses[defenderName] = (count > 0 && totalNonInfantryCount > 0)
          ? (totalInfantryDefenseLoss * (count / totalNonInfantryCount)) / count
          : 0;
        baseStatsMap[defenderName].finalDefense += redistributionBonuses[defenderName];
      }
    }
  } else {
    // If not Infantry Attack, ensure no redistribution bonuses or logs
    for (const defenderName of defenderUnitNames) {
      const baseStats = baseStatsMap[defenderName];
      baseStatsMap[defenderName].finalDefense = baseStats.defense + techStrategyModifiersMap[defenderName].defense;
      redistributionBonuses[defenderName] = 0;
    }
  }

  // Calculate total defensive capability for this phase using finalDefense
  let totalDefense = 0;
  const unitImmunities: Record<string, number> = {};
  for (const defenderName of defenderUnitNames) {
    const defenderCount = defendingArmy[defenderName];
    let immunityPercent = 0;
    if (isMageUnit(defenderName, defenderRace) && phaseType === 'melee') {
      if (defenderStrategy === 'Elf Energy Gathering') {
        immunityPercent = 0;
      } else {
        immunityPercent = 100;
      }
    }
    if (isShadowWarriorUnit(defenderName, defenderRace) && phaseType === 'melee') {
      immunityPercent = defenderStrategy === 'Orc' ? 75 : 80;
    }
    if (isSkeletonUnit(defenderName, defenderRace) && phaseType === 'range') {
      immunityPercent = 100;
    }
    if (defenderStrategy === 'Dwarf Shield Line' && phaseType === 'range') {
      const totalArmySize = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);
      const shieldbearerCount = defendingArmy['Shieldbearer'] || 0;
      if (totalArmySize > 0) {
        const shieldbearerRatio = shieldbearerCount / totalArmySize;
        immunityPercent = Math.min(100, shieldbearerRatio * 200);
      }
    }
    unitImmunities[defenderName] = immunityPercent;
    const effectiveDefense = baseStatsMap[defenderName].finalDefense * (1 - immunityPercent / 100);
    totalDefense += defenderCount * effectiveDefense;
  }

  // 3. Calculate raw total damage BEFORE any mitigation, redistribution, or minimum damage
  let rawTotalDamage = 0;
  if (totalOffense > totalDefense) {
    rawTotalDamage = totalOffense - totalDefense;
  } else {
    const relativeStrength = totalOffense / totalDefense;
    rawTotalDamage = totalOffense * relativeStrength * 1.2;
  }

  // 4. Apply building mitigation (Guard Towers, Medical Centers)
  let buildingDefenseBonus = 0;
  const totalDefenders = defenderUnitNames.reduce((sum, u) => sum + (defendingArmy[u] > 0 ? defendingArmy[u] : 0), 0);
  // Guard Towers (range phase) still use global bonus
  if (phaseType === 'range' && defenderBuildings['Guard Towers'] && defenderBuildings['Guard Towers'] > 0) {
    const towers = defenderBuildings['Guard Towers'] || 0;
    const maxReductionPerUnit = 2;
    const totalReduction = Math.min(towers * 40, totalDefenders * maxReductionPerUnit);
    buildingDefenseBonus = totalDefenders > 0 ? totalReduction / totalDefenders : 0;
  }
  // Medical Center mitigation will be handled per-unit below

  // 5. Apply redistribution/strategy effects (Infantry Attack, Archer Protection)
  // This block is now redundant as the logic is moved to the start of the function
  // if (processedArmyStrategy === 'Infantry Attack') {
  //   // Calculate total defense lost by infantry
  //   const raceKey = defenderRace.toLowerCase();
  //   const armyForRedistribution = originalDefendingArmy || defendingArmy;
  //   let totalInfantryDefenseLoss = 0;
  //   let totalNonInfantryCount = 0;
  //   for (const unit of Object.keys(armyForRedistribution)) {
  //     const count = armyForRedistribution[unit];
  //     const baseStats = UNIT_DATA[raceKey]?.[unit];
  //     if (!baseStats) continue;
  //     if (isInfantryUnit(unit, defenderRace)) {
  //       const effectiveStats = getEffectiveUnitStats(unit, raceKey, techLevels, processedArmyStrategy, false, ksDifferenceFactor);
  //       const loss = (baseStats.defense - effectiveStats.defense) * count;
  //       totalInfantryDefenseLoss += loss;
  //     } else {
  //       if (count > 0) totalNonInfantryCount += count;
  //     }
  //   }
  //   for (const unit of Object.keys(armyForRedistribution)) {
  //     if (!isInfantryUnit(unit, defenderRace)) {
  //       const count = armyForRedistribution[unit];
  //       redistributionBonuses[unit] = (count > 0 && totalNonInfantryCount > 0)
  //         ? (totalInfantryDefenseLoss * (count / totalNonInfantryCount)) / count
  //         : 0;
  //     }
  //   }
  // }

  // 6. Apply minimum damage rule (after all mitigation)
  let postMitigationTotalDamage = 0;
  if (totalOffense > (totalDefense + buildingDefenseBonus)) {
    postMitigationTotalDamage = totalOffense - (totalDefense + buildingDefenseBonus);
  } else {
    const relativeStrength = totalOffense / (totalDefense + buildingDefenseBonus);
    postMitigationTotalDamage = totalOffense * relativeStrength * 1.2;
  }
  // Minimum damage rule removed
  const minimumDamageEnforced = false;
  let postMitigationTotalDamageBeforeMin = postMitigationTotalDamage;

  // --- UWDA Weighted Damage Allocation ---
  // 1. Build weighted unit list for the defending army
  const raceKey = defenderRace.toLowerCase();
  const unitWeights = UNIT_WEIGHTS[raceKey] || {};
  const weightedUnits = defenderUnitNames.map(unit => ({
    name: unit,
    count: defendingArmy[unit],
    weight: unitWeights[unit] || 1,
    defense: baseStatsMap[unit].finalDefense
  })).filter(u => u.count > 0);
  // 2. Sort units by weight descending (fodder first)
  weightedUnits.sort((a, b) => b.weight - a.weight);
  // 3. Compute total weighted count
  const totalWeighted = weightedUnits.reduce((sum, u) => sum + u.count * u.weight, 0);
  // 4. Allocate damage by weighted share
  let remainingDamage = rawTotalDamage;
  const unitDamageAlloc: Record<string, number> = {};
  for (let i = 0; i < weightedUnits.length; i++) {
    const u = weightedUnits[i];
    if (remainingDamage <= 0) {
      unitDamageAlloc[u.name] = 0;
      continue;
    }
    // Share of damage for this unit
    let share = (u.count * u.weight) / totalWeighted;
    // Add random factor ±5–10%
    const rand = 1 + (Math.random() * 0.1 - 0.05);
    share *= rand;
    // Clamp share to [0,1]
    share = Math.max(0, Math.min(1, share));
    let damageForUnit = remainingDamage * share;
    // Overkill/trickle-down: if this unit can't absorb all its share, pass excess to next
    const maxAbsorb = u.count * u.defense;
    if (damageForUnit > maxAbsorb) {
      unitDamageAlloc[u.name] = maxAbsorb;
      remainingDamage -= maxAbsorb;
    } else {
      unitDamageAlloc[u.name] = damageForUnit;
      remainingDamage -= damageForUnit;
    }
  }
  // If any damage remains, trickle down to lowest weight unit
  if (remainingDamage > 0 && weightedUnits.length > 0) {
    const last = weightedUnits[weightedUnits.length - 1];
    unitDamageAlloc[last.name] += remainingDamage;
  }

  // 7. Distribute damage to units and apply all effects
  for (const defenderName of defenderUnitNames) {
    const defenderCount = defendingArmy[defenderName];
    const baseStats = baseStatsMap[defenderName];
    const effectiveDefense = baseStats.finalDefense;
    const immunityPercent = unitImmunities[defenderName] || 0;
    const buildingEffects = [];

    // Add all stat changes and effects to the effects array for display (with green/red text)
    const statChanges: string[] = [];
    const roundEffect = (val: number) => Math.abs(val) < 0.01 ? 0 : Math.round(val * 100) / 100;
    // Track if any stat change is due to KS difference factor only
    const isKSFactor = ksDifferenceFactor !== 1;
    if (roundEffect(techStrategyModifiersMap[defenderName].defense) !== 0) {
      statChanges.push(`${roundEffect(techStrategyModifiersMap[defenderName].defense)} defense${isKSFactor ? ' (KS difference factor)' : ''}`);
    }
    if (roundEffect(techStrategyModifiersMap[defenderName].melee) !== 0) {
      statChanges.push(`${roundEffect(techStrategyModifiersMap[defenderName].melee)} melee${isKSFactor ? ' (KS difference factor)' : ''}`);
    }
    if (roundEffect(techStrategyModifiersMap[defenderName].short) !== 0) {
      statChanges.push(`${roundEffect(techStrategyModifiersMap[defenderName].short)} short${isKSFactor ? ' (KS difference factor)' : ''}`);
    }
    if (roundEffect(techStrategyModifiersMap[defenderName].range) !== 0) {
      statChanges.push(`${roundEffect(techStrategyModifiersMap[defenderName].range)} range${isKSFactor ? ' (KS difference factor)' : ''}`);
    }
    // Only show redistribution effect if Infantry Attack is active and bonus is strictly greater than zero and finite
    if (processedArmyStrategy === 'Infantry Attack' && Number.isFinite(redistributionBonuses[defenderName]) && redistributionBonuses[defenderName] > 0) {
      statChanges.push(`+${redistributionBonuses[defenderName].toFixed(2)} defense redistributed`);
    }
    if (immunityPercent > 0) {
      statChanges.push(`${immunityPercent}% immunity`);
    }
    if (statChanges.length > 0) {
      buildingEffects.push(`${statChanges.join(', ')}`);
    }

    // Calculate per-unit Guard Tower mitigation (range phase, robust, never global)
    let towerMitigation = 0;
    let towerEffectString = '';
    if (phaseType === 'range' && defenderBuildings['Guard Towers'] && defenderBuildings['Guard Towers'] > 0) {
      const towers = defenderBuildings['Guard Towers'] || 0;
      towerMitigation = towers * 2;
      towerEffectString = `Guard Towers: Reduces ranged attacks by 2 per tower (total ${towerMitigation} per unit)`;
    }
    if (towerEffectString) {
      buildingEffects.push(towerEffectString);
    }

    // Calculate per-unit Medical Center mitigation (robust, never global)
    let medMitigation = 0;
    let medEffectString = '';
    if (phaseType === 'melee' && defenderBuildings['Medical Center'] && defenderBuildings['Medical Center'] > 0) {
      const med = defenderBuildings['Medical Center'] || 0;
      if ((typeof isDefender === 'boolean' && isDefender) || (!('isDefender' in arguments) && !isAttacker)) {
        // Defense: 2 per MC (no cap)
        medMitigation = med * 2;
        medEffectString = `Medical Centers: Decreases close combat damages by 2 per Medical Center on defense (total ${medMitigation} per unit)`;
      } else {
        // Attack: 1 per MC (no cap)
        medMitigation = med * 1;
        medEffectString = `Medical Centers: Decreases close combat damages by 1 per Medical Center on attack (total ${medMitigation} per unit)`;
      }
    }
    if (medEffectString) {
      buildingEffects.push(medEffectString);
    }

    // --- Refactored breakdown calculation for consistency ---
    let rawDamageShare = unitDamageAlloc[defenderName] || 0;
    const initialShare = rawDamageShare;
    let mitigationDetails: string[] = [];
    // Step 1: Apply all mitigations (tower, med, building bonus)
    let afterMitigation = rawDamageShare;
    if (towerMitigation > 0) {
      mitigationDetails.push(`Guard Towers: -${towerMitigation.toFixed(2)}`);
      afterMitigation = Math.max(0, afterMitigation - towerMitigation);
    }
    if (medMitigation > 0) {
      mitigationDetails.push(`Medical Centers: -${medMitigation.toFixed(2)}`);
      afterMitigation = Math.max(0, afterMitigation - medMitigation);
    }
    if (buildingDefenseBonus > 0) {
      mitigationDetails.push(`Building bonus: -${buildingDefenseBonus.toFixed(2)}`);
      afterMitigation = Math.max(0, afterMitigation - buildingDefenseBonus);
    }
    // Step 2: Apply immunity
    const afterImmunity = afterMitigation * (1 - immunityPercent / 100);
    // Step 3: Final damage (should match main stat)
    // Calculate post-mitigation damage share (after min)
    const totalDefenders = defenderUnitNames.reduce((sum, u) => sum + (defendingArmy[u] > 0 ? defendingArmy[u] : 0), 0);
    const postMitigationDamageShare = totalDefenders > 0 ? (defenderCount / totalDefenders) * postMitigationTotalDamage : 0;
    const postMitigationEffectiveDamage = postMitigationDamageShare * (1 - immunityPercent / 100);
    const finalDamage = Math.max(0, postMitigationEffectiveDamage);
    // --- End refactor ---

    // Calculate total mitigation (before min), always include medMitigation and towerMitigation
    let totalMitigated = 0 + medMitigation + towerMitigation;
    // Minimum damage rule removed: do not add effect
    // Calculate units lost
    let unitsLost = 0;
    if (finalDamage > 0) {
      const damagePerKill = effectiveDefense;
      const traditionalLosses = Math.floor(finalDamage / damagePerKill);
      const totalArmyDefense = totalDefense + buildingDefenseBonus;
      const damageRatio = postMitigationTotalDamage / totalArmyDefense;
      const proportionalLosses = Math.ceil(defenderCount * damageRatio); // More aggressive, no 0.5 multiplier
      unitsLost = Math.max(traditionalLosses, proportionalLosses);
      if (finalDamage >= damagePerKill * 0.3 && unitsLost === 0 && immunityPercent < 100) {
        unitsLost = 1;
      }
      unitsLost = Math.min(unitsLost, defenderCount);
    }
    losses[defenderName] = unitsLost;
    if (postMitigationTotalDamage > 0 && buildingDefenseBonus > 0 && ((phaseType === 'range' && defenderBuildings['Guard Towers'] && defenderBuildings['Guard Towers'] > 0) || (phaseType === 'melee' && defenderBuildings['Medical Center'] && defenderBuildings['Medical Center'] > 0))) {
      buildingEffects.push(`Building bonus: -${buildingDefenseBonus.toFixed(1)} damage per unit`);
    }
    if (immunityPercent > 0) {
      buildingEffects.push(`${immunityPercent}% immunity applied`);
    }
    damageLog.push({
      unitName: defenderName,
      damageReceived: initialShare, // show initial share before mitigation
      damageMitigated: totalMitigated,
      finalDamage: finalDamage,
      unitsLost: losses[defenderName],
      buildingEffects: buildingEffects,
      trueEffectiveDefense: effectiveDefense,
      appliedRedistributionBonus: (processedArmyStrategy === 'Infantry Attack' && Number.isFinite(redistributionBonuses[defenderName]) && redistributionBonuses[defenderName] > 0) ? redistributionBonuses[defenderName] : undefined,
      breakdown: {
        initialShare,
        afterDefenseScaling: unitDamageAlloc[defenderName] || 0,
        afterMitigation,
        afterImmunity,
        final: finalDamage,
        mitigationDetails,
        unitWeight: unitWeights[defenderName] || 1
      }
    });
  }
  return { losses, damageLog };
} 