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
  let yourArmyState: Army = JSON.parse(JSON.stringify(yourArmy));
  let enemyArmyState: Army = JSON.parse(JSON.stringify(enemyArmy));
  
  // Use initial army state for healing calculations, fallback to current if not provided
  const initialYourArmy = yourInitialArmy || yourArmy;
  const initialEnemyArmy = enemyInitialArmy || enemyArmy;
  const phaseLogs: RoundResult['phaseLogs'] = [];
  const phases: PhaseType[] = ['range', 'short', 'melee'];
  
  // Save the original armies at the start of the round
  const roundStartYourArmy = { ...yourArmyState };
  const roundStartEnemyArmy = { ...enemyArmyState };

  for (const phase of phases) {
    // Record army state at START of this phase
    const phaseStartYourArmy = { ...yourArmyState };
    const phaseStartEnemyArmy = { ...enemyArmyState };
    
    // Both sides attack simultaneously in this phase
    // Calculate losses for each side
    // For yourDamageResult, processedArmyStrategy should be strategyYour (your army's defense strategy)
    // For enemyDamageResult, processedArmyStrategy should be strategyEnemy (enemy army's defense strategy)
    const yourProcessedStrategy = strategyYour === 'Infantry Attack' ? 'Infantry Attack' : null;
    const enemyProcessedStrategy = strategyEnemy === 'Infantry Attack' ? 'Infantry Attack' : null;
    // Determine if your army is defending in this phase
    const youAreDefending = phase === 'melee' ? false : true; // Only defend in melee if you are the defender
    const enemyIsDefending = !youAreDefending;
    const yourDamageResult = calculatePhaseDamage(
      enemyArmyState,
      { ...yourArmyState },
      phase,
      techLevelsEnemy,
      strategyEnemy,
      strategyYour,
      yourProcessedStrategy,
      ksDifferenceFactor,
      enemyBuildings,
      yourBuildings,
      !youAreDefending, // isAttacker: true if you are attacking
      enemyRace,
      yourRace,
      phase === 'melee' ? { ...roundStartYourArmy } : undefined,
      youAreDefending // isDefender: true if you are defending
    );
    const enemyDamageResult = calculatePhaseDamage(
      yourArmyState,
      { ...enemyArmyState },
      phase,
      techLevelsYour,
      strategyYour,
      strategyEnemy,
      enemyProcessedStrategy,
      ksDifferenceFactor,
      yourBuildings,
      enemyBuildings,
      !enemyIsDefending, // isAttacker: true if enemy is attacking
      yourRace,
      enemyRace,
      phase === 'melee' ? { ...roundStartEnemyArmy } : undefined,
      enemyIsDefending // isDefender: true if enemy is defending
    );
    
    // Apply losses to yourArmyState
    for (const [unit, lost] of Object.entries(yourDamageResult.losses)) {
      yourArmyState[unit] = Math.max(0, (yourArmyState[unit] || 0) - lost);
    }
    // Apply losses to enemyArmyState
    for (const [unit, lost] of Object.entries(enemyDamageResult.losses)) {
      enemyArmyState[unit] = Math.max(0, (enemyArmyState[unit] || 0) - lost);
    }
    
    // Log this phase with army state at START of phase
    phaseLogs.push({ 
      phase, 
      yourLosses: yourDamageResult.losses, 
      enemyLosses: enemyDamageResult.losses,
      yourDamageLog: yourDamageResult.damageLog,
      enemyDamageLog: enemyDamageResult.damageLog,
      yourArmyAtStart: phaseStartYourArmy,
      enemyArmyAtStart: phaseStartEnemyArmy
    });
  }



  return {
    yourArmy: yourArmyState,
    enemyArmy: enemyArmyState,
    phaseLogs
  };
} 