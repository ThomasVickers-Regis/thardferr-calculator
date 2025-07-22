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

  // 1. Calculate rawTotalDamage (sum of all attacker unit attack for the phase)
  let rawTotalDamage = 0;
  for (const [attackerName, attackerCount] of Object.entries(attackingArmy)) {
    if (attackerCount <= 0) continue;
    const attackerStats = getEffectiveUnitStats(attackerName, attackerRace, techLevels, attackerStrategy, true, ksDifferenceFactor);
    let attackValue = 0;
    if (phaseType === 'range') attackValue = attackerStats.range;
    else if (phaseType === 'short') attackValue = attackerStats.short;
    else if (phaseType === 'melee') attackValue = attackerStats.melee;
    rawTotalDamage += attackerCount * attackValue;
  }

  // 2. Apply global mitigation from buildings, etc.
  let mitigation = 0;
  if (phaseType === 'range' && defenderBuildings['Guard Towers']) {
    mitigation += defenderBuildings['Guard Towers'] * 10; // Example value, adjust as needed
  }
  if (phaseType === 'melee' && defenderBuildings['Medical Center']) {
    mitigation += defenderBuildings['Medical Center'] * 10; // Example value, adjust as needed
  }
  const postMitigatedOffense = Math.max(0, rawTotalDamage - mitigation);

  // If there's no offense, there are no losses.
  if (postMitigatedOffense <= 0) {
      defenderUnitNames.forEach(unitName => {
          losses[unitName] = 0;
      });
      return { losses, damageLog };
  }

  // 3. Distribute damage based on unit weights
  const raceKey = defenderRace.toLowerCase();
  const unitWeights = UNIT_WEIGHTS[raceKey] || {};
  
  const weightedTotals: Record<string, number> = {};
  let sumOfAllWeightedTotals = 0;

  for (const defenderName of defenderUnitNames) {
      const unitCount = defendingArmy[defenderName];
      const weight = unitWeights[defenderName] || 1; // Default weight is 1
      const weightedTotal = unitCount * weight;
      weightedTotals[defenderName] = weightedTotal;
      sumOfAllWeightedTotals += weightedTotal;
  }

  // 4. Calculate losses for each unit stack independently
  for (const defenderName of defenderUnitNames) {
      const unitCount = defendingArmy[defenderName];
      if (unitCount <= 0) continue;

      // Get this unit's effective defense
      const effectiveStats = getEffectiveUnitStats(defenderName, defenderRace, techLevels, defenderStrategy, false, ksDifferenceFactor);
      const unitEffectiveDefense = effectiveStats.defense;

      // If sum of weights is 0, can't divide. Just distribute damage evenly.
      const weightRatio = sumOfAllWeightedTotals > 0 
          ? weightedTotals[defenderName] / sumOfAllWeightedTotals
          : (1 / defenderUnitNames.length);
      
      const damageAllocatedToStack = postMitigatedOffense * weightRatio;

      // A unit is lost if its health (effectiveDefense) is depleted.
      const unitLosses = unitEffectiveDefense > 0 
          ? Math.floor(damageAllocatedToStack / unitEffectiveDefense)
          : unitCount; // If defense is 0, all units are lost to any damage

      // Ensure losses don't exceed the number of units
      losses[defenderName] = Math.min(unitCount, unitLosses);

      // Log the details for the UI
      const damagePerUnit = unitCount > 0 ? damageAllocatedToStack / unitCount : 0;
      damageLog.push({
          unitName: defenderName,
          damageReceived: damagePerUnit,
          damageMitigated: mitigation, // This was global mitigation
          finalDamage: damagePerUnit,
          unitsLost: losses[defenderName],
          buildingEffects: [], // Populate as needed
          trueEffectiveDefense: unitEffectiveDefense,
          appliedRedistributionBonus: undefined,
          breakdown: {
              initialShare: (rawTotalDamage * weightRatio) / unitCount,
              afterDefenseScaling: damagePerUnit,
              afterMitigation: damagePerUnit,
              afterImmunity: damagePerUnit,
              final: damagePerUnit,
              mitigationDetails: [],
              unitWeight: unitWeights[defenderName] || 1
          }
      });
  }

  return { losses, damageLog };
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