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

  // Pre-calculate raw damage and mitigation pools.
  const rawTotalDamage = calculateRawTotalDamage(attackingArmy, attackerRace, techLevels, attackerStrategy, phaseType, ksDifferenceFactor);
  const { totalMitigation, buildingEffectsLog } = calculateTotalMitigation(defendingArmy, defenderBuildings, phaseType, isAttacker);

  const defenderUnitNames = Object.keys(defendingArmy).filter(u => defendingArmy[u] > 0);
  if (defenderUnitNames.length === 0) return { losses: {}, damageLog: [] };
  
  // Now, calculate losses and create the final log entries.
  for (const defenderName of defenderUnitNames) {
      const unitCount = defendingArmy[defenderName];
      if (unitCount <= 0) continue;

      let { rawDamageReceived, finalDamagePerUnit, unitLosses, buildingEffects, unitEffectiveDefense } = handleInfantryAttack(
          defenderName,
          defenderUnitNames,
          defendingArmy,
          defenderRace,
          techLevels,
          defenderStrategy,
          ksDifferenceFactor,
          rawTotalDamage,
          totalMitigation,
          buildingEffectsLog,
          phaseType,
          isAttacker
      );

      losses[defenderName] = Math.min(unitCount, unitLosses);
      const mitigatedDamage = rawDamageReceived - finalDamagePerUnit;

      damageLog.push({
          unitName: defenderName,
          damageReceived: rawDamageReceived,
          damageMitigated: mitigatedDamage, 
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
              unitWeight: UNIT_WEIGHTS[defenderRace.toLowerCase()]?.[defenderName] || 1
          }
      });
  }

  return { losses, damageLog };
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
    totalMitigation: number,
    buildingEffectsLog: string[],
    phaseType: PhaseType,
    isAttacker: boolean
) {
    const { weightedTotals, sumOfAllWeightedTotals } = calculateWeightedTotals(defendingArmy, defenderRace);
    const totalDefenders = defenderUnitNames.reduce((sum, name) => sum + defendingArmy[name], 0);

    let unitEffectiveDefense = getEffectiveUnitStats(defenderName, defenderRace, techLevels, defenderStrategy, false, ksDifferenceFactor).defense;
    const buildingEffects: string[] = [...buildingEffectsLog];

    // Calculate raw damage share before anything else
    const weightRatio = sumOfAllWeightedTotals > 0 ? weightedTotals[defenderName] / sumOfAllWeightedTotals : (1 / defenderUnitNames.length);
    const rawDamageAllocatedToStack = rawTotalDamage * weightRatio;

    if (defenderStrategy === 'Infantry Attack') {
        let totalInfantryDefenseLoss = 0;
        const infantryUnits = defenderUnitNames.filter(name => isInfantryUnit(name, defenderRace));
        const nonInfantryUnitCount = defenderUnitNames
            .filter(name => !isInfantryUnit(name, defenderRace))
            .reduce((sum, name) => sum + defendingArmy[name], 0);

        for (const unitName of infantryUnits) {
            const unitCount = defendingArmy[unitName];
            const baseStats = getEffectiveUnitStats(unitName, defenderRace, techLevels, null, false, ksDifferenceFactor);
            totalInfantryDefenseLoss += (baseStats.defense * 0.75) * unitCount;
        }

        if (isInfantryUnit(defenderName, defenderRace)) {
            unitEffectiveDefense *= 0.25;
            buildingEffects.push(`Infantry Attack Penalty: -75% defense`);
        } else if (nonInfantryUnitCount > 0) {
            const bonusPerUnit = totalInfantryDefenseLoss / nonInfantryUnitCount;
            unitEffectiveDefense += bonusPerUnit;
            buildingEffects.push(`Infantry Attack Bonus: +${bonusPerUnit.toFixed(2)} defense`);
        }
    }

    // Apply mitigation to the raw damage share
    const unitCountRatio = totalDefenders > 0 ? defendingArmy[defenderName] / totalDefenders : 0;
    const mitigationAllocatedToStack = totalMitigation * unitCountRatio;
    let finalDamageToStack = Math.max(0, rawDamageAllocatedToStack - mitigationAllocatedToStack);
    
    // Apply special reductions to the now-mitigated damage
    const { reduction, effects } = applySpecialReductions(defenderName, defenderRace, defenderStrategy, phaseType, defendingArmy);
    finalDamageToStack *= (1 - reduction);
    buildingEffects.push(...effects);

    const unitLosses = unitEffectiveDefense > 0 ? Math.floor(finalDamageToStack / unitEffectiveDefense) : defendingArmy[defenderName];
    
    return {
        rawDamageReceived: defendingArmy[defenderName] > 0 ? rawDamageAllocatedToStack / defendingArmy[defenderName] : 0,
        finalDamagePerUnit: defendingArmy[defenderName] > 0 ? finalDamageToStack / defendingArmy[defenderName] : 0,
        unitLosses,
        buildingEffects,
        unitEffectiveDefense,
    };
}


// Helper functions to break down the main function's logic.

function calculateRawTotalDamage(attackingArmy: Army, attackerRace: string, techLevels: TechLevels, attackerStrategy: StrategyName | null, phaseType: PhaseType, ksDifferenceFactor: number): number {
    let totalDamage = 0;
    for (const [attackerName, attackerCount] of Object.entries(attackingArmy)) {
        if (attackerCount <= 0) continue;
        const attackerStats = getEffectiveUnitStats(attackerName, attackerRace, techLevels, attackerStrategy, true, ksDifferenceFactor);
        let attackValue = 0;
        if (phaseType === 'range') attackValue = attackerStats.range;
        else if (phaseType === 'short') attackValue = attackerStats.short;
        else if (phaseType === 'melee') attackValue = attackerStats.melee;
        totalDamage += attackerCount * attackValue;
    }
    return totalDamage;
}

function calculateTotalMitigation(defendingArmy: Army, defenderBuildings: any, phaseType: PhaseType, isAttacker: boolean): { totalMitigation: number, buildingEffectsLog: string[] } {
    let totalMitigation = 0;
    const buildingEffectsLog: string[] = [];
    const totalDefenders = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);

    if (phaseType === 'range' && defenderBuildings['Guard Towers']) {
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
        const perCenterPool = isAttacker ? 50 : 75;
        const perUnitCap = isAttacker ? 1 : 2;
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

function applySpecialReductions(defenderName: string, defenderRace: string, defenderStrategy: StrategyName | null, phaseType: PhaseType, defendingArmy: Army): { reduction: number, effects: string[] } {
    let reduction = 0;
    const effects: string[] = [];

    if (phaseType === 'melee' && isMageUnit(defenderName, defenderRace) && defenderStrategy !== 'Elf Energy Gathering') {
        reduction = 1.0; // 100%
    }
    if (phaseType === 'range' && defenderName.includes('Skeleton')) {
        reduction = 1.0; // 100%
    }
    if (phaseType === 'melee' && isShadowWarriorUnit(defenderName, defenderRace)) {
        reduction = defenderStrategy === 'Orc' ? 0.75 : 0.80;
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
        effects.push(`${(reduction * 100).toFixed(0)}% damage reduction`);
    }

    return { reduction, effects };
}

// New: BattleState and PhaseResult types for UI-driven simulation
export interface BattleState {
  yourArmy: Army;
  enemyArmy: Army;
  yourTechLevels: any;
  enemyTechLevels: any;
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
  yourDamageLog: any[];
  enemyDamageLog: any[];
  updatedYourCasualties: Record<string, number>;
  updatedEnemyCasualties: Record<string, number>;
}

export function simulateBattlePhase(
  state: BattleState,
  phase: 'range' | 'short' | 'melee'
): PhaseResult {
  // Calculate damage for this phase (your army defends, then enemy army defends)
  const yourDamageResult = calculatePhaseDamage(
    state.enemyArmy,
    state.yourArmy,
    phase,
    state.enemyTechLevels,
    state.enemyStrategy,
    state.yourStrategy,
    state.yourStrategy === 'Infantry Attack' ? 'Infantry Attack' : null,
    1,
    state.enemyBuildings,
    state.yourBuildings,
    true,
    state.enemyRace,
    state.yourRace
  );
  const enemyDamageResult = calculatePhaseDamage(
    state.yourArmy,
    state.enemyArmy,
    phase,
    state.yourTechLevels,
    state.yourStrategy,
    state.enemyStrategy,
    state.enemyStrategy === 'Infantry Attack' ? 'Infantry Attack' : null,
    1,
    state.yourBuildings,
    state.enemyBuildings,
    true,
    state.yourRace,
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

  // Collect effects (for now, just concatenate per-unit effects)
  const yourEffects = yourDamageResult.damageLog.flatMap(log => log.buildingEffects || []);
  const enemyEffects = enemyDamageResult.damageLog.flatMap(log => log.buildingEffects || []);

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