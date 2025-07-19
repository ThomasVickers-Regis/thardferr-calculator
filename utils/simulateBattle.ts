import { Army } from './calculatePhaseDamage';
import { TechLevels, StrategyName } from './getEffectiveUnitStats';
import { simulateRound, RoundResult } from './simulateRound';

export interface KingdomStats {
  KS: number; // Kingdom Strength (total attack + defense, or similar)
  [key: string]: any;
}

export interface BattleLogEntry {
  round: number;
  roundResult: RoundResult;
  yourArmy: Army;
  enemyArmy: Army;
}

export interface BattleOutcome {
  winner: 'yourArmy' | 'enemyArmy' | 'draw';
  rounds: number;
  finalYourArmy: Army;
  finalEnemyArmy: Army;
  battleLog: BattleLogEntry[];
}

/**
 * Simulates a full battle between two armies, round by round.
 * @param yourInitialArmy - Your starting army
 * @param enemyInitialArmy - Enemy starting army
 * @param yourKingdomStats - Your kingdom stats (KS, etc.)
 * @param enemyKingdomStats - Enemy kingdom stats (KS, etc.)
 * @param techLevelsYour - Your tech levels
 * @param strategyYour - Your active strategy
 * @param techLevelsEnemy - Enemy tech levels
 * @param strategyEnemy - Enemy active strategy
 * @param maxRounds - Maximum number of rounds
 * @returns BattleOutcome
 */
export function simulateBattle(
  yourInitialArmy: Army,
  enemyInitialArmy: Army,
  yourKingdomStats: KingdomStats,
  enemyKingdomStats: KingdomStats,
  techLevelsYour: TechLevels,
  strategyYour: StrategyName | null,
  techLevelsEnemy: TechLevels,
  strategyEnemy: StrategyName | null,
  maxRounds: number = 20,
  yourBuildings: any = {},
  enemyBuildings: any = {}
): BattleOutcome {
  let yourArmy = { ...yourInitialArmy };
  let enemyArmy = { ...enemyInitialArmy };
  const battleLog: BattleLogEntry[] = [];

  // Calculate KS difference factor (bottomfeeding)
  const attackerKS = yourKingdomStats.KS || 1;
  const defenderKS = enemyKingdomStats.KS || 1;
  let ksDifferenceFactor = 1;
  if (attackerKS > 1.5 * defenderKS) ksDifferenceFactor = 0.8; // Attacker penalty
  else if (attackerKS < 0.75 * defenderKS) ksDifferenceFactor = 1.2; // Attacker buff

  let round = 1;
  let winner: BattleOutcome['winner'] = 'draw';

  while (round <= maxRounds) {
    // Check if either army is eliminated
    const yourAlive = Object.values(yourArmy).some(v => v > 0);
    const enemyAlive = Object.values(enemyArmy).some(v => v > 0);
    if (!yourAlive && !enemyAlive) {
      winner = 'draw';
      break;
    } else if (!yourAlive) {
      winner = 'enemyArmy';
      break;
    } else if (!enemyAlive) {
      winner = 'yourArmy';
      break;
    }
    // Simulate round
    const roundResult = simulateRound(
      yourArmy,
      enemyArmy,
      techLevelsYour,
      strategyYour,
      techLevelsEnemy,
      strategyEnemy,
      ksDifferenceFactor,
      yourBuildings,
      enemyBuildings
    );
    // Update armies
    yourArmy = { ...roundResult.yourArmy };
    enemyArmy = { ...roundResult.enemyArmy };
    // Log round
    battleLog.push({
      round,
      roundResult,
      yourArmy: { ...yourArmy },
      enemyArmy: { ...enemyArmy }
    });
    round++;
  }

  // Final check for winner if maxRounds reached
  if (winner === 'draw') {
    const yourAlive = Object.values(yourArmy).some(v => v > 0);
    const enemyAlive = Object.values(enemyArmy).some(v => v > 0);
    if (yourAlive && !enemyAlive) winner = 'yourArmy';
    else if (!yourAlive && enemyAlive) winner = 'enemyArmy';
    else winner = 'draw';
  }

  return {
    winner,
    rounds: round - 1,
    finalYourArmy: yourArmy,
    finalEnemyArmy: enemyArmy,
    battleLog
  };
} 