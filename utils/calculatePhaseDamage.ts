import { UNIT_DATA } from '@/data/unitData';
import { Army, TechLevels, StrategyName, PhaseType, Buildings } from '@/types';
import { getEffectiveUnitStats, isMageUnit, isShadowWarriorUnit, isInfantryUnit, isKnightUnit, isPikemanUnit, isMountedUnit, isArcherUnit, isShieldbearerUnit, isSkeletonUnit } from './getEffectiveUnitStats';
import { STRATEGY_DATA } from '@/data/strategyData';

// New Global Tuning Knob
export const GLOBAL_DAMAGE_SCALING_FACTOR = 0.65; // This value perfectly matched your target losses

// UWDA: Unit Weights by race and unit name
export const UNIT_WEIGHTS: Record<string, Record<string, number>> = {
  dwarf: {
    Shieldbearer: 3,
    HammerWheilder: 2,
    AxeMan: 2,
    Runner: 1,
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
    Militia: 2.5,
    Rider: 2,
    RockThrower: 2.5,
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
    SkeletonWarrior: 1.5,
    WraithPikeman: 2,
    Abomination: 2,
    PhantomArcher: 2,
    WraithRider: 1
  }
};

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
    rawDamageAllocatedToStack?: number;
    mitigationAllocatedToStack?: number;
    totalMitigation?: number;
    totalRawDamage?: number;
    maxTotalMitigation?: number;
    preScaledTotalDamage?: number;
    preScaledPikemenDamage?: number;
  };
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
  attackerBuildings: Record<string, number> = {},
  defenderBuildings: Record<string, number> = {},
  attackerRace: string = 'dwarf',
  defenderRace: string = 'dwarf',
  originalDefendingArmy?: Army,
  isBattleDefender: boolean = false,
  doubleRangedDamage: boolean = false
): { losses: Record<string, number>; damageLog: DamageLog[]; rawTotalDamage: number; totalMitigation: number; mitigationPerUnit: Record<string, number>; rawDamagePerUnit: Record<string, number>; maxTotalMitigation: number; preScaledTotalDamage: number; preScaledPikemenDamage: number; } {
  const losses: Record<string, number> = {};
  const damageLog: DamageLog[] = [];
  const mitigationPerUnit: Record<string, number> = {};
  const rawDamagePerUnit: Record<string, number> = {};

  // Pre-calculate raw damage and mitigation pools.
  const { totalDamage, pikemenDamage, preScaledTotalDamage, preScaledPikemenDamage } = calculateRawTotalDamage(attackingArmy, attackerRace, techLevels, attackerStrategy, phaseType, ksDifferenceFactor, defendingArmy, doubleRangedDamage, defenderStrategy);
  
  // Apply Fortification technology effect: reduces attacker damage by 5% when defender has it
  let fortificationReduction = 1.0;
  // Note: techLevels here is the defender's tech levels, not the attacker's
  const hasFortification = (techLevels['Fortification'] || 0) > 0;
  if (hasFortification && isBattleDefender) {
    fortificationReduction = 0.95; // 5% damage reduction
  }
  
  // Apply the fortification reduction to the calculated damage
  const adjustedTotalDamage = totalDamage * fortificationReduction;
  const adjustedPikemenDamage = pikemenDamage * fortificationReduction;
  // Calculate the maximum possible mitigation pool (before capping by total damage)
  let maxTotalMitigation = 0;
  const totalDefenders = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);
  if (phaseType === 'range' && defenderBuildings['Guard Towers']) {
    const towerCount = defenderBuildings['Guard Towers'];
    const potentialMitigationPool = towerCount * 40;
    const perUnitCap = 2;
    const maxMitigationByUnitCap = totalDefenders * perUnitCap;
    maxTotalMitigation += Math.min(potentialMitigationPool, maxMitigationByUnitCap);
  }
  if (phaseType === 'melee' && defenderBuildings['Medical Center']) {
    const centerCount = defenderBuildings['Medical Center'];
    const perCenterPool = isBattleDefender ? 75 : 50;
    const perUnitCap = isBattleDefender ? 2 : 1;
    const potentialMitigationPool = centerCount * perCenterPool;
    const maxMitigationByUnitCap = totalDefenders * perUnitCap;
    maxTotalMitigation += Math.min(potentialMitigationPool, maxMitigationByUnitCap);
  }
  const { totalMitigation, buildingEffectsLog } = calculateTotalMitigation(defendingArmy, defenderBuildings, phaseType, isBattleDefender);

  // Add Fortification effect to building effects log if defender has it and damage was reduced
  if (hasFortification && isBattleDefender && totalDamage > 0) {
    buildingEffectsLog.push('Fortification: Reduces incoming damage by 5%');
  }

  // Add Gnome Far Fighting effect to both sides if active in range phase
  if (doubleRangedDamage && phaseType === 'range') {
    const gffMsg = 'Gnome Far Fighting: Doubles ranged attacks this phase.';
    if (!buildingEffectsLog.includes(gffMsg)) {
      buildingEffectsLog.push(gffMsg);
    }
  }

  // Add Quick Retreat effect if active
  const quickRetreatActive = (attackerStrategy === 'Quick Retreat' || defenderStrategy === 'Quick Retreat');
  if (quickRetreatActive) {
    const qrMsg = 'Quick Retreat: Reduces attack damage by 50% for both armies.';
    if (!buildingEffectsLog.includes(qrMsg)) {
      buildingEffectsLog.push(qrMsg);
    }
  }

  const defenderUnitNames = Object.keys(defendingArmy).filter(u => defendingArmy[u] > 0);
  if (defenderUnitNames.length === 0) return { losses: {}, damageLog: [], rawTotalDamage: adjustedTotalDamage, totalMitigation, mitigationPerUnit: {}, rawDamagePerUnit: {}, maxTotalMitigation, preScaledTotalDamage, preScaledPikemenDamage };
  
  // Now, calculate losses and create the final log entries.
  for (const defenderName of defenderUnitNames) {
      const unitCount = defendingArmy[defenderName];
      if (unitCount <= 0) continue;

      const { rawDamageReceived, finalDamagePerUnit, unitLosses, buildingEffects, unitEffectiveDefense, damageMitigatedByBuildings, rawDamageAllocatedToStack, mitigationAllocatedToStack } = handleInfantryAttack(
          defenderName,
          defenderUnitNames,
          defendingArmy,
          defenderRace,
          techLevels,
          defenderStrategy,
          ksDifferenceFactor,
          adjustedTotalDamage,
          adjustedPikemenDamage,
          attackerStrategy,
          totalMitigation,
          buildingEffectsLog,
          phaseType,
          attackingArmy
      );

      losses[defenderName] = Math.min(unitCount, unitLosses);
      mitigationPerUnit[defenderName] = mitigationAllocatedToStack;
      rawDamagePerUnit[defenderName] = rawDamageAllocatedToStack;

      damageLog.push({
          unitName: defenderName,
          damageReceived: rawDamageReceived,
          damageMitigated: damageMitigatedByBuildings,
          finalDamage: finalDamagePerUnit,
          unitsLost: losses[defenderName],
          buildingEffects: buildingEffects, 
          trueEffectiveDefense: unitEffectiveDefense,
          appliedRedistributionBonus: undefined,
          breakdown: {
              initialShare: rawDamageReceived,
              afterDefenseScaling: rawDamageReceived, // No change in this model
              afterMitigation: finalDamagePerUnit,
              afterImmunity: finalDamagePerUnit, // Combined for simplicity
              final: finalDamagePerUnit,
              mitigationDetails: [],
              unitWeight: UNIT_WEIGHTS[defenderRace.toLowerCase()]?.[defenderName] || 1,
              rawDamageAllocatedToStack,
              mitigationAllocatedToStack,
              totalMitigation,
              totalRawDamage: adjustedTotalDamage,
              maxTotalMitigation,
              preScaledTotalDamage,
              preScaledPikemenDamage
          }
      });
  }

  return { losses, damageLog, rawTotalDamage: adjustedTotalDamage, totalMitigation, mitigationPerUnit, rawDamagePerUnit, maxTotalMitigation, preScaledTotalDamage, preScaledPikemenDamage };
}

function handleInfantryAttack(
    defenderName: string,
    defenderUnitNames: string[],
    defendingArmy: Army,
    defenderRace: string,
    techLevels: TechLevels,
    defenderStrategy: StrategyName | null,
    ksDifferenceFactor: number,
    rawTotalDamage: number,
    pikemenDamage: number,
    attackerStrategy: StrategyName | null,
    totalMitigation: number,
    buildingEffectsLog: string[],
    phaseType: PhaseType,
    attackingArmy: Army
) {
    const { weightedTotals, sumOfAllWeightedTotals } = calculateWeightedTotals(defendingArmy, defenderRace);
    const totalDefenders = defenderUnitNames.reduce((sum, name) => sum + defendingArmy[name], 0);

    let unitEffectiveDefense = getEffectiveUnitStats(defenderName, defenderRace, techLevels, defenderStrategy, false, ksDifferenceFactor, undefined, defendingArmy, attackingArmy).defense;
    let buildingEffects: string[] = [...buildingEffectsLog];

    // Add defender strategy effects to the log
    buildingEffects.push(...getStrategyEffects(defenderName, defenderRace, defenderStrategy, phaseType, false, attackingArmy));

    // Calculate raw damage share before anything else
    const weightRatio = sumOfAllWeightedTotals > 0 ? weightedTotals[defenderName] / sumOfAllWeightedTotals : (1 / defenderUnitNames.length);
    let rawDamageAllocatedToStack = rawTotalDamage * weightRatio;

    // Apply Pikemen bonus vs. mounted units
    if (isMountedUnit(defenderName, defenderRace) && pikemenDamage > 0 && rawTotalDamage > 0) {
        const pikemenDamageRatio = pikemenDamage / rawTotalDamage;
        const damageShareFromPikemen = rawDamageAllocatedToStack * pikemenDamageRatio;
        
        let bonusMultiplier = 2.0; // Base 2x damage vs mounted
        let effectMsg = `Pikemen deal 2x damage vs mounted.`;

        if (attackerStrategy === 'Anti-Cavalry') {
            bonusMultiplier *= 3.5;
            effectMsg = `Pikemen deal 2x damage, multiplied by 3.5x from Anti-Cavalry.`;
        }

        const bonusDamage = damageShareFromPikemen * (bonusMultiplier - 1);
        rawDamageAllocatedToStack += bonusDamage;
        buildingEffects.push(effectMsg);
    }
    
    if (defenderStrategy === 'Infantry Attack') {
        let totalInfantryDefenseLoss = 0;
        const infantryUnits = defenderUnitNames.filter(name => isInfantryUnit(name, defenderRace));
        const nonInfantryUnitCount = defenderUnitNames
            .filter(name => !isInfantryUnit(name, defenderRace))
            .reduce((sum, name) => sum + defendingArmy[name], 0);

        for (const unitName of infantryUnits) {
            const unitCount = defendingArmy[unitName];
            const baseStats = getEffectiveUnitStats(unitName, defenderRace, techLevels, null, false, ksDifferenceFactor, undefined, defendingArmy, attackingArmy);
            totalInfantryDefenseLoss += (baseStats.defense * 0.75) * unitCount;
        }

        if (isInfantryUnit(defenderName, defenderRace)) {
            unitEffectiveDefense *= 0.25;
            // This is now handled by getStrategyEffects, so we can remove the manual push
            // buildingEffects.push(`Infantry Attack Penalty: -75% defense`);
        } else if (nonInfantryUnitCount > 0) {
            const bonusPerUnit = totalInfantryDefenseLoss / nonInfantryUnitCount;
            unitEffectiveDefense += bonusPerUnit;
            // This is now handled by getStrategyEffects
            // buildingEffects.push(`Infantry Attack Bonus: +${bonusPerUnit.toFixed(2)} defense`);
        }
    }

    // Apply mitigation to the raw damage share
    const unitCountRatio = totalDefenders > 0 ? defendingArmy[defenderName] / totalDefenders : 0;
    const mitigationAllocatedToStack = totalMitigation * unitCountRatio;
    let finalDamageToStack = Math.max(0, rawDamageAllocatedToStack - mitigationAllocatedToStack);
    
    // Apply special reductions to the now-mitigated damage
    const { reduction, effects } = applySpecialReductions(defenderName, defenderRace, defenderStrategy, phaseType, defendingArmy, techLevels);
    finalDamageToStack *= (1 - reduction);
    buildingEffects.push(...effects);

    // Remove duplicate effects
    buildingEffects = [...new Set(buildingEffects)];

    const unitLosses = unitEffectiveDefense > 0 ? Math.floor(finalDamageToStack / unitEffectiveDefense) : defendingArmy[defenderName];
    
    return {
        rawDamageReceived: defendingArmy[defenderName] > 0 ? rawDamageAllocatedToStack / defendingArmy[defenderName] : 0,
        finalDamagePerUnit: defendingArmy[defenderName] > 0 ? finalDamageToStack / defendingArmy[defenderName] : 0,
        unitLosses,
        buildingEffects,
        unitEffectiveDefense,
        damageMitigatedByBuildings: defendingArmy[defenderName] > 0 ? mitigationAllocatedToStack / defendingArmy[defenderName] : 0,
        rawDamageAllocatedToStack,
        mitigationAllocatedToStack
    };
}


// Helper functions to break down the main function's logic.

function calculateRawTotalDamage(attackingArmy: Army, attackerRace: string, techLevels: TechLevels, attackerStrategy: StrategyName | null, phaseType: PhaseType, ksDifferenceFactor: number, defendingArmy: Army, doubleRangedDamage: boolean = false, defenderStrategy: StrategyName | null = null): { totalDamage: number; pikemenDamage: number; preScaledTotalDamage: number; preScaledPikemenDamage: number; } {
    let totalDamage = 0;
    let pikemenDamage = 0;
    let preScaledTotalDamage = 0;
    let preScaledPikemenDamage = 0;

    // Quick Retreat: If either army uses Quick Retreat, both armies get 50% attack reduction
    const quickRetreatActive = (attackerStrategy === 'Quick Retreat' || defenderStrategy === 'Quick Retreat');
    const attackReductionFactor = quickRetreatActive ? 0.5 : 1.0;

    for (const [attackerName, attackerCount] of Object.entries(attackingArmy)) {
        if ((attackerCount as number) <= 0) continue;
        const attackerStats = getEffectiveUnitStats(attackerName, attackerRace, techLevels, attackerStrategy, true, ksDifferenceFactor, defenderStrategy, attackingArmy, defendingArmy);
        let attackValue = 0;
        if (phaseType === 'range') attackValue = attackerStats.range;
        else if (phaseType === 'short') {
            attackValue = attackerStats.short;
            // Orc Surrounding: Shadow Warriors deal full damage in short phase
            if (attackerStrategy === 'Orc Surrounding' && isShadowWarriorUnit(attackerName, attackerRace)) {
                attackValue += attackerStats.melee + attackerStats.range;
            }
        }
        else if (phaseType === 'melee') {
            // Prevent ShadowWarrior from attacking in melee if Orc Surrounding is active
            if (attackerStrategy === 'Orc Surrounding' && isShadowWarriorUnit(attackerName, attackerRace)) {
                attackValue = 0;
            } else {
                attackValue = attackerStats.melee;
            }
        }

        // Apply Quick Retreat attack reduction
        attackValue *= attackReductionFactor;

        const currentUnitDamage = (attackerCount as number) * attackValue;
        preScaledTotalDamage += currentUnitDamage;
        if (isPikemanUnit(attackerName, attackerRace)) {
            preScaledPikemenDamage += currentUnitDamage;
        }
        totalDamage += currentUnitDamage;
        if (isPikemanUnit(attackerName, attackerRace)) {
            pikemenDamage += currentUnitDamage;
        }
    }

    // Gnome Far Fighting: Doubles range damage for both sides
    if (phaseType === 'range' && doubleRangedDamage) {
        totalDamage *= 2;
        pikemenDamage *= 2;
        preScaledTotalDamage *= 2;
        preScaledPikemenDamage *= 2;
    }

    // Fortification: Reduces attacker damage by 5% when defender has this technology
    // Note: We need to check if the defender has Fortification technology
    // Since we don't have direct access to defender tech levels here, we'll need to pass it through
    // For now, we'll implement this in the calling function where we have access to defender tech levels
    
    // Save pre-scaled values before scaling
    const preScaleTotal = preScaledTotalDamage;
    const preScalePikemen = preScaledPikemenDamage;

    totalDamage *= GLOBAL_DAMAGE_SCALING_FACTOR;
    pikemenDamage *= GLOBAL_DAMAGE_SCALING_FACTOR;
    // (preScaledTotalDamage and preScaledPikemenDamage remain unscaled)
    
    return { totalDamage, pikemenDamage, preScaledTotalDamage: preScaleTotal, preScaledPikemenDamage: preScalePikemen };
}

function calculateTotalMitigation(defendingArmy: Army, defenderBuildings: Record<string, number>, phaseType: PhaseType, isBattleDefender: boolean): { totalMitigation: number, buildingEffectsLog: string[] } {
    let totalMitigation = 0;
    const buildingEffectsLog: string[] = [];
    const totalDefenders = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);

    if (phaseType === 'range' && defenderBuildings['Guard Towers'] && isBattleDefender) {
        const towerCount = defenderBuildings['Guard Towers'];
        const potentialMitigationPool = towerCount * 40;
        const perUnitCap = 2;
        const maxMitigationByUnitCap = totalDefenders * perUnitCap;
        const totalGTMitigation = Math.min(potentialMitigationPool, maxMitigationByUnitCap);
        if (totalGTMitigation > 0) {
            totalMitigation += totalGTMitigation;
            buildingEffectsLog.push(`Guard Towers reduced total damage by ${totalGTMitigation.toFixed(0)}`);
        }
    }

    if (phaseType === 'melee' && defenderBuildings['Medical Center']) {
        const centerCount = defenderBuildings['Medical Center'];
        const perCenterPool = isBattleDefender ? 75 : 50;
        const perUnitCap = isBattleDefender ? 2 : 1;
        const potentialMitigationPool = centerCount * perCenterPool;
        const maxMitigationByUnitCap = totalDefenders * perUnitCap;
        const totalMCMitigation = Math.min(potentialMitigationPool, maxMitigationByUnitCap);
        if (totalMCMitigation > 0) {
            totalMitigation += totalMCMitigation;
            buildingEffectsLog.push(`Medical Centers reduced total damage by ${totalMCMitigation.toFixed(0)}`);
        }
    }

    return { totalMitigation, buildingEffectsLog };
}

function calculateWeightedTotals(defendingArmy: Army, defenderRace: string): { weightedTotals: Record<string, number>, sumOfAllWeightedTotals: number } {
    const raceKey = defenderRace.toLowerCase();
    const unitWeights = UNIT_WEIGHTS[raceKey] || {};
    const weightedTotals: Record<string, number> = {};
    let sumOfAllWeightedTotals = 0;
    for (const defenderName in defendingArmy) {
        const unitCount = defendingArmy[defenderName];
        const weight = unitWeights[defenderName] || 1;
        const weightedTotal = unitCount * weight;
        weightedTotals[defenderName] = weightedTotal;
        sumOfAllWeightedTotals += weightedTotal;
    }
    return { weightedTotals, sumOfAllWeightedTotals };
}

function applySpecialReductions(defenderName: string, defenderRace: string, defenderStrategy: StrategyName | null, phaseType: PhaseType, defendingArmy: Army, techLevels: TechLevels): { reduction: number, effects: string[] } {
    let reduction = 0;
    const effects: string[] = [];

    // Archer Protection: Infantry absorbs damage for archers
    if (defenderStrategy === 'Archer Protection' && isArcherUnit(defenderName, defenderRace)) {
        const infantryCount = Object.entries(defendingArmy).filter(([name, count]) => isInfantryUnit(name, defenderRace) && count > 0).reduce((sum, [, count]) => sum + count, 0);
        const archerCount = defendingArmy[defenderName] || 0;
        if (infantryCount > 0 && archerCount > 0) {
            reduction = Math.min(1.0, (infantryCount / archerCount) * 0.5); // Example: 50% damage reduction if equal numbers
            effects.push(`Infantry protects archers, reducing damage by ${(reduction * 100).toFixed(0)}%`);
        }
    }

    // Dwarf Shield Line: Reduces enemy long-range attack damage
    if (defenderStrategy === 'Dwarf Shield Line' && phaseType === 'range') {
        const shieldbearerCount = defendingArmy['Shieldbearer'] || 0;
        const totalUnits = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);
        if (totalUnits > 0) {
            const shieldbearerPercentage = shieldbearerCount / totalUnits;
            reduction += Math.min(1.0, 2 * shieldbearerPercentage);
            effects.push(`Dwarf Shield Line reduces ranged damage by ${(reduction * 100).toFixed(0)}%`);
        }
    }

    if (phaseType === 'melee' && isMageUnit(defenderName, defenderRace) && defenderStrategy !== 'Elf Energy Gathering') {
        reduction = 1.0; // 100%
    }
    if (phaseType === 'range' && isSkeletonUnit(defenderName, defenderRace) && defenderStrategy === 'Skeleton Swarm') {
        reduction = 1.0; // 100% - Skeleton units immune to long range damage
        effects.push('Skeleton Swarm: Immune to long range damage');
    }
    if ((phaseType === 'melee' || phaseType === 'short') && isShadowWarriorUnit(defenderName, defenderRace)) {
        // Base hiding: 25% (75% damage reduction)
        let hidingPercentage = 0.25;
        
        if (defenderStrategy === 'Orc Surrounding') {
            // Orc strategy: -25% hiding (0% hiding, 100% damage reduction)
            hidingPercentage = 1;
            effects.push('Orc Surrounding: -25% hiding (0% total)');
        }
        
        // Apply Cloacking technology if available (decreases detection by 15%)
        // This increases hiding by 15% if the defender has the technology
        if (techLevels['Cloacking'] && techLevels['Cloacking'] > 0) {
            hidingPercentage += 0.15;
            effects.push('Cloacking technology: +15% hiding');
        }
        
        const damageReduction = 1.0 - hidingPercentage;
        reduction = damageReduction;
        
        if (hidingPercentage > 0) {
            effects.push(`${(hidingPercentage * 100).toFixed(0)}% hiding (${(damageReduction * 100).toFixed(0)}% damage reduction)`);
        }
    }
    if (phaseType === 'range' && defenderStrategy === 'Dwarf Shield Line') {
        const shieldbearerCount = defendingArmy['Shieldbearer'] || 0;
        const totalArmySize = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);
        if (totalArmySize > 0) {
            const shieldbearerRatio = shieldbearerCount / totalArmySize;
            reduction = Math.min(1.0, shieldbearerRatio * 2);
        }
    }

    if (reduction > 0) {
        // Don't add general damage reduction message for Shadow Warriors since they have their own specific message
        if (!((phaseType === 'melee' || phaseType === 'short') && isShadowWarriorUnit(defenderName, defenderRace))) {
            effects.push(`${(reduction * 100).toFixed(0)}% damage reduction`);
        }
    }

    return { reduction, effects };
}

function getStrategyEffects(unitName: string, race: string, strategy: StrategyName | null, phaseType: PhaseType, isAttacker: boolean, defendingArmy: Army): string[] {
    const effects: string[] = [];
    if (!strategy) return effects;

    const strategyEffects = STRATEGY_DATA[strategy]?.effects;
    if (!strategyEffects) return effects;

    if (strategy === 'Human Charging!' && isKnightUnit(unitName, race)) {
        effects.push(`Charge: +${((strategyEffects.knights_attack_multiplier - 1) * 100).toFixed(0)}% Attack, -${(strategyEffects.knights_defense_reduction_percent * 100).toFixed(0)}% Defense`);
    }
    if (strategy === 'Elf Energy Gathering' && isMageUnit(unitName, race)) {
        effects.push(`Energy Gathering: +${strategyEffects.wizards_defense_increase} Defense, +${((strategyEffects.wizards_close_combat_damage_multiplier - 1) * 100).toFixed(0)}% Melee Damage, +${strategyEffects.wizards_ranged_attack_increase} Ranged Attack`);
    }
    if (strategy === 'Orc Berserker') {
        effects.push(`Berserker: +${strategyEffects.all_units_damage_increase} Damage, Defense /${strategyEffects.all_units_defense_divide_by}`);
    }
    if (strategy === 'Orc Surrounding' && isShadowWarriorUnit(unitName, race)) {
        effects.push(`Surrounding: +${strategyEffects.shadow_warriors_defense_increase} Defense, deals full damage in short phase.`);
    }
    if (strategy === 'Quick Retreat') {
        effects.push(`Quick Retreat: -${((1 - strategyEffects.all_unit_attack_multiplier) * 100).toFixed(0)}% Attack, 40% retreat threshold, 50% chance to lose on victory.`);
    }
    if (strategy === 'Anti-Cavalry') {
        if (isPikemanUnit(unitName, race)) {
            if (isAttacker && Object.keys(defendingArmy).some(unit => isMountedUnit(unit, race))) {
                effects.push(`Anti-Cavalry Bonus: +${((strategyEffects.pikemen_attack_vs_mounted_multiplier - 1) * 100).toFixed(0)}% damage vs. mounted units.`);
            }
        } else {
            effects.push(`Anti-Cavalry Penalty: -${((1 - strategyEffects.all_units_attack_multiplier) * 100).toFixed(0)}% Attack`);
        }
    }
    if (strategy === 'Archer Protection' && isInfantryUnit(unitName, race)) {
        effects.push(`Archer Protection: -${((1 - strategyEffects.infantry_attack_multiplier) * 100).toFixed(0)}% Attack to protect archers.`);
    }
    if (strategy === 'Dwarf Shield Line') {
        if (isShieldbearerUnit(unitName, race)) {
            effects.push(`Shield Line: +${(strategyEffects.shieldbearers_close_combat_damage_increase_percent * 100).toFixed(0)}% Melee Damage`);
        } else if (isInfantryUnit(unitName, race)) {
            effects.push(`Shield Line: -${(strategyEffects.all_units_close_combat_attack_reduction_percent * 100).toFixed(0)}% Melee Attack`);
        }
    }
    if (strategy === 'Gnome Far Fighting' && phaseType === 'range') {
        effects.push('Gnome Far Fighting: Doubles ranged attacks this phase.');
    }
    if (strategy === 'Infantry Attack' && isInfantryUnit(unitName, race)) {
        effects.push(`Infantry Attack Penalty: -${(strategyEffects.infantry_defense_reduction_percent * 100).toFixed(0)}% Defense`);
    } else if (strategy === 'Infantry Attack' && !isInfantryUnit(unitName, race)) {
        effects.push('Infantry Attack Bonus: Receives redistributed defense.');
    }
    if (strategy === 'Skeleton Swarm' && isSkeletonUnit(unitName, race)) {
        effects.push('Skeleton Swarm: Immune to long range damage');
    }
    
    return effects;
}

// New: BattleState and PhaseResult types for UI-driven simulation
export interface BattleState {
  yourArmy: Army;
  enemyArmy: Army;
  yourTechLevels: TechLevels;
  enemyTechLevels: TechLevels;
  yourStrategy: string | null;
  enemyStrategy: string | null;
  yourBuildings: Record<string, number>;
  enemyBuildings: Record<string, number>;
  yourRace: string;
  enemyRace: string;
  yourCasualties: Record<string, number>;
  enemyCasualties: Record<string, number>;
  yourEffects: string[];
  enemyEffects: string[];
}

export interface PhaseResult {
  phase: 'range' | 'short' | 'melee';
  updatedYourArmy: Army;
  updatedEnemyArmy: Army;
  yourLosses: Record<string, number>;
  enemyLosses: Record<string, number>;
  yourEffects: string[];
  enemyEffects: string[];
  yourDamageLog: DamageLog[];
  enemyDamageLog: DamageLog[];
  updatedYourCasualties: Record<string, number>;
  updatedEnemyCasualties: Record<string, number>;
}

export function simulateBattlePhase(
  state: BattleState,
  phase: 'range' | 'short' | 'melee'
): PhaseResult {
  // Your army is being attacked (you are the defender)
  const yourDamageResult = calculatePhaseDamage(
    state.enemyArmy,
    state.yourArmy,
    phase,
    state.yourTechLevels, // FIXED: use defender's tech levels (your army is defending)
    state.enemyStrategy as StrategyName,
    state.yourStrategy as StrategyName,
    state.yourStrategy === 'Infantry Attack' ? 'Infantry Attack' : null,
    1,
    state.enemyBuildings,
    state.yourBuildings,
    state.enemyRace, // pass correct race string
    state.yourRace
  );
  // Enemy army is being attacked (they are the defender)
  const enemyDamageResult = calculatePhaseDamage(
    state.yourArmy,
    state.enemyArmy,
    phase,
    state.enemyTechLevels, // FIXED: use defender's tech levels (enemy army is defending)
    state.yourStrategy as StrategyName,
    state.enemyStrategy as StrategyName,
    state.enemyStrategy === 'Infantry Attack' ? 'Infantry Attack' : null,
    1,
    state.yourBuildings,
    state.enemyBuildings,
    state.yourRace, // pass correct race string
    state.enemyRace
  );

  // Update armies
  const updatedYourArmy: Army = { ...state.yourArmy };
  const updatedEnemyArmy: Army = { ...state.enemyArmy };
  Object.entries(yourDamageResult.losses).forEach(([unit, lost]) => {
    updatedYourArmy[unit] = Math.max(0, (updatedYourArmy[unit] || 0) - lost);
  });
  Object.entries(enemyDamageResult.losses).forEach(([unit, lost]) => {
    updatedEnemyArmy[unit] = Math.max(0, (updatedEnemyArmy[unit] || 0) - lost);
  });

  // Update cumulative casualties
  const updatedYourCasualties: Record<string, number> = { ...state.yourCasualties };
  const updatedEnemyCasualties: Record<string, number> = { ...state.enemyCasualties };
  Object.entries(yourDamageResult.losses).forEach(([unit, lost]) => {
    updatedYourCasualties[unit] = (updatedYourCasualties[unit] || 0) + lost;
  });
  Object.entries(enemyDamageResult.losses).forEach(([unit, lost]) => {
    updatedEnemyCasualties[unit] = (updatedEnemyCasualties[unit] || 0) + lost;
  });

  // Collect effects and remove duplicates
  const yourEffectsLog = yourDamageResult.damageLog.flatMap(log => log.buildingEffects || []);
  const enemyEffectsLog = enemyDamageResult.damageLog.flatMap(log => log.buildingEffects || []);

  // Add attacker strategy effects
  if (state.yourStrategy) {
    for (const unitName of Object.keys(state.yourArmy)) {
      if (state.yourArmy[unitName] > 0) {
        enemyEffectsLog.push(...getStrategyEffects(unitName, state.yourRace, state.yourStrategy as StrategyName, phase, true, state.enemyArmy));
      }
    }
  }
  if (state.enemyStrategy) {
    for (const unitName of Object.keys(state.enemyArmy)) {
      if (state.enemyArmy[unitName] > 0) {
        yourEffectsLog.push(...getStrategyEffects(unitName, state.enemyRace, state.enemyStrategy as StrategyName, phase, true, state.yourArmy));
      }
    }
  }

  const yourEffects = [...new Set(yourEffectsLog)];
  const enemyEffects = [...new Set(enemyEffectsLog)];

  return {
    phase,
    updatedYourArmy,
    updatedEnemyArmy,
    yourLosses: yourDamageResult.losses,
    enemyLosses: enemyDamageResult.losses,
    yourEffects,
    enemyEffects,
    yourDamageLog: yourDamageResult.damageLog,
    enemyDamageLog: enemyDamageResult.damageLog,
    updatedYourCasualties,
    updatedEnemyCasualties
  };
}