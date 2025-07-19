import { Army, PhaseType, calculatePhaseDamage } from './calculatePhaseDamage';
import { TechLevels, StrategyName } from './getEffectiveUnitStats';

export interface RoundResult {
  yourArmy: Army;
  enemyArmy: Army;
  phaseLogs: Array<{
    phase: PhaseType;
    yourLosses: Record<string, number>;
    enemyLosses: Record<string, number>;
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
  enemyBuildings: any = {}
): RoundResult {
  // Deep clone armies to avoid mutating input
  let yourArmyState: Army = JSON.parse(JSON.stringify(yourArmy));
  let enemyArmyState: Army = JSON.parse(JSON.stringify(enemyArmy));
  const phaseLogs: RoundResult['phaseLogs'] = [];
  const phases: PhaseType[] = ['range', 'short', 'melee'];

  for (const phase of phases) {
    // Both sides attack simultaneously in this phase
    // Calculate losses for each side
    const yourLosses = calculatePhaseDamage(
      enemyArmyState,
      { ...yourArmyState },
      phase,
      techLevelsEnemy,
      strategyEnemy,
      ksDifferenceFactor,
      enemyBuildings,
      yourBuildings,
      false // enemy is attacker
    );
    const enemyLosses = calculatePhaseDamage(
      yourArmyState,
      { ...enemyArmyState },
      phase,
      techLevelsYour,
      strategyYour,
      ksDifferenceFactor,
      yourBuildings,
      enemyBuildings,
      true // your side is attacker
    );
    // Apply losses to yourArmyState
    for (const [unit, lost] of Object.entries(yourLosses)) {
      yourArmyState[unit] = Math.max(0, (yourArmyState[unit] || 0) - lost);
    }
    // Apply losses to enemyArmyState
    for (const [unit, lost] of Object.entries(enemyLosses)) {
      enemyArmyState[unit] = Math.max(0, (enemyArmyState[unit] || 0) - lost);
    }
    // Log this phase
    phaseLogs.push({ phase, yourLosses, enemyLosses });
  }

  return {
    yourArmy: yourArmyState,
    enemyArmy: enemyArmyState,
    phaseLogs
  };
} 