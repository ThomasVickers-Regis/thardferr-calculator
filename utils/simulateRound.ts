import { Army, PhaseType, calculatePhaseDamage } from './calculatePhaseDamage';
import { TechLevels, StrategyName } from './getEffectiveUnitStats';

import { DamageLog } from './calculatePhaseDamage';

export interface RoundResult {
  yourArmy: Army;
  enemyArmy: Army;
  phaseLogs: Array<{
    phase: PhaseType | 'end';
    yourLosses: Record<string, number>;
    enemyLosses: Record<string, number>;
    yourDamageLog: DamageLog[];
    enemyDamageLog: DamageLog[];
    yourArmyAtStart: Army;
    enemyArmyAtStart: Army;
    yourHealing?: Record<string, number>;
    enemyHealing?: Record<string, number>;
  }>;
}

/**
 * Simulates a single round of battle (all three phases) between two armies.
 * @param yourArmy - Your army composition (unit counts)
 * @param enemyArmy - Enemy army composition (unit counts)
 * @param techLevelsYour - Your tech levels
 * @param strategyYour - Your active strategy
 * @param techLevelsEnemy - Enemy tech levels
 * @param strategyEnemy - Enemy active strategy
 * @param ksDifferenceFactor - KS difference multiplier/divisor
 * @returns Updated armies and a log of losses per phase
 */
export function simulateRound(
  yourArmy: Army,
  enemyArmy: Army,
  techLevelsYour: TechLevels,
  strategyYour: StrategyName | null,
  techLevelsEnemy: TechLevels,
  strategyEnemy: StrategyName | null,
  ksDifferenceFactor: number = 1,
  yourBuildings: any = {},
  enemyBuildings: any = {},
  yourRace: string = 'dwarf',
  enemyRace: string = 'dwarf',
  yourLand: number = 20,
  enemyLand: number = 20,
  yourInitialArmy?: Army,
  enemyInitialArmy?: Army
): RoundResult {
  // Deep clone armies to avoid mutating input
  let currentYourArmy = { ...yourArmy };
  let currentEnemyArmy = { ...enemyArmy };
  const phaseLogs = [];

  for (const phase of ['range', 'short', 'melee'] as const) {
    const yourArmyAtStart = { ...currentYourArmy };
    const enemyArmyAtStart = { ...currentEnemyArmy };

    // Calculate damage for both sides based on their state at the start of the phase
    const yourDamageResult = calculatePhaseDamage(
      enemyArmyAtStart,
      yourArmyAtStart,
      phase,
      techLevelsEnemy,
      strategyEnemy,
      strategyYour,
      strategyYour === 'Infantry Attack' ? 'Infantry Attack' : null,
      1,
      enemyBuildings,
      yourBuildings,
      false, // isAttacker flag
      enemyRace,
      yourRace
    );

    const enemyDamageResult = calculatePhaseDamage(
      yourArmyAtStart,
      enemyArmyAtStart,
      phase,
      techLevelsYour,
      strategyYour,
      strategyEnemy,
      strategyEnemy === 'Infantry Attack' ? 'Infantry Attack' : null,
      1,
      yourBuildings,
      enemyBuildings,
      true, // isAttacker flag
      yourRace,
      enemyRace
    );

    // Apply losses to the current army states for the next phase
    const yourLosses = yourDamageResult.losses;
    for (const unit in yourLosses) {
      currentYourArmy[unit] = Math.max(0, (currentYourArmy[unit] || 0) - yourLosses[unit]);
    }

    const enemyLosses = enemyDamageResult.losses;
    for (const unit in enemyLosses) {
      currentEnemyArmy[unit] = Math.max(0, (currentEnemyArmy[unit] || 0) - enemyLosses[unit]);
    }

    phaseLogs.push({
      phase,
      yourArmyAtStart,
      enemyArmyAtStart,
      yourLosses,
      enemyLosses,
      yourDamageLog: yourDamageResult.damageLog,
      enemyDamageLog: enemyDamageResult.damageLog
    });
  }

  return {
    yourArmy: currentYourArmy,
    enemyArmy: currentEnemyArmy,
    phaseLogs
  };
} 