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
  const buildingEffectsLog: string[] = [];
  const totalDefenders = defenderUnitNames.reduce((sum, name) => sum + defendingArmy[name], 0);

  // Guard Tower Mitigation: A total damage pool is calculated, then distributed across all units,
  // with a per-unit cap ensuring no single unit can mitigate more than its limit.
  if (phaseType === 'range' && defenderBuildings['Guard Towers']) {
      const towerCount = defenderBuildings['Guard Towers'];
      const potentialMitigationPool = towerCount * 40;
      const perUnitCap = 2;
      
      const maxMitigationByUnitCap = totalDefenders * perUnitCap;
      const totalGTMitigation = Math.min(potentialMitigationPool, maxMitigationByUnitCap);

      if (totalGTMitigation > 0) {
        mitigation += totalGTMitigation;
        buildingEffectsLog.push(`Guard Towers reduced total damage by ${totalGTMitigation.toFixed(0)}`);
      }
  }
  
  // Medical Center Mitigation: Works similarly to Guard Towers, but the values depend on
  // whether the defending army is the one attacking in the overall battle.
  if (phaseType === 'melee' && defenderBuildings['Medical Center']) {
      const centerCount = defenderBuildings['Medical Center'];
      // isAttacker: true = 'on attack' rules (50 pool / 1 cap)
      // isAttacker: false = 'on defense' rules (75 pool / 2 cap)
      const perCenterPool = isAttacker ? 50 : 75;
      const perUnitCap = isAttacker ? 1 : 2;
      
      const potentialMitigationPool = centerCount * perCenterPool;
      const maxMitigationByUnitCap = totalDefenders * perUnitCap;
      const totalMCMitigation = Math.min(potentialMitigationPool, maxMitigationByUnitCap);

      if (totalMCMitigation > 0) {
        mitigation += totalMCMitigation;
        buildingEffectsLog.push(`Medical Centers reduced total damage by ${totalMCMitigation.toFixed(0)}`);
      }
  }

  const mitigationPerUnit = totalDefenders > 0 ? mitigation / totalDefenders : 0;
  const postMitigatedOffense = Math.max(0, rawTotalDamage - mitigation);

  // If there's no offense, there are no losses, but we should still log the state.
  if (postMitigatedOffense <= 0) {
      defenderUnitNames.forEach(unitName => {
          losses[unitName] = 0;
          const effectiveStats = getEffectiveUnitStats(unitName, defenderRace, techLevels, defenderStrategy, false, ksDifferenceFactor);
          damageLog.push({
              unitName: unitName,
              damageReceived: 0,
              damageMitigated: mitigationPerUnit,
              finalDamage: 0,
              unitsLost: 0,
              buildingEffects: buildingEffectsLog,
              trueEffectiveDefense: effectiveStats.defense,
              appliedRedistributionBonus: undefined,
              breakdown: {
                  initialShare: 0,
                  afterDefenseScaling: 0,
                  afterMitigation: 0,
                  afterImmunity: 0,
                  final: 0,
                  mitigationDetails: [],
                  unitWeight: UNIT_WEIGHTS[defenderRace.toLowerCase()]?.[unitName] || 1
              }
          });
      });
      return { losses, damageLog };
  }

  // 3. Distribute damage based on unit weights and apply immunities
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

      let unitEffectiveDefense = getEffectiveUnitStats(defenderName, defenderRace, techLevels, defenderStrategy, false, ksDifferenceFactor).defense;

      // Apply Immunities and Damage Reductions
      let damageReduction = 0;
      const buildingEffects: string[] = [...buildingEffectsLog];
      
      if (phaseType === 'melee' && isMageUnit(defenderName, defenderRace) && defenderStrategy !== 'Elf Energy Gathering') {
          damageReduction = 1.0; // 100%
      }
      if (phaseType === 'range' && defenderName.includes('Skeleton')) {
          damageReduction = 1.0; // 100%
      }
      if (phaseType === 'melee' && isShadowWarriorUnit(defenderName, defenderRace)) {
          damageReduction = defenderStrategy === 'Orc' ? 0.75 : 0.80;
      }
      if (phaseType === 'range' && defenderStrategy === 'Dwarf Shield Line') {
          const shieldbearerCount = defendingArmy['Shieldbearer'] || 0;
          const totalArmySize = Object.values(defendingArmy).reduce((sum, count) => sum + count, 0);
          if (totalArmySize > 0) {
              const shieldbearerRatio = shieldbearerCount / totalArmySize;
              damageReduction = Math.min(1.0, shieldbearerRatio * 2);
          }
      }
      
      if (damageReduction > 0) {
        buildingEffects.push(`${(damageReduction * 100).toFixed(0)}% damage reduction`);
      }
      
      const weightRatio = sumOfAllWeightedTotals > 0 
          ? weightedTotals[defenderName] / sumOfAllWeightedTotals
          : (1 / defenderUnitNames.length);
      
      let damageAllocatedToStack = postMitigatedOffense * weightRatio;
      damageAllocatedToStack *= (1 - damageReduction);

      const unitLosses = unitEffectiveDefense > 0 
          ? Math.floor(damageAllocatedToStack / unitEffectiveDefense)
          : unitCount;

      losses[defenderName] = Math.min(unitCount, unitLosses);

      const damagePerUnit = unitCount > 0 ? damageAllocatedToStack / unitCount : 0;
      damageLog.push({
          unitName: defenderName,
          damageReceived: damagePerUnit,
          damageMitigated: mitigationPerUnit, 
          finalDamage: damagePerUnit,
          unitsLost: losses[defenderName],
          buildingEffects: buildingEffects, 
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