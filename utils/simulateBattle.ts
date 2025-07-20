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
  enemyBuildings: any = {},
  yourRace: string = 'dwarf',
  enemyRace: string = 'dwarf'
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
    
    // Record army state at START of round
    const roundStartYourArmy = { ...yourArmy };
    const roundStartEnemyArmy = { ...enemyArmy };
    
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
      enemyBuildings,
      yourRace,
      enemyRace,
      yourKingdomStats.Land || 20,
      enemyKingdomStats.Land || 20,
      yourInitialArmy,
      enemyInitialArmy
    );
    
    // Log round with army state at START of round
    battleLog.push({
      round,
      roundResult,
      yourArmy: roundStartYourArmy,
      enemyArmy: roundStartEnemyArmy
    });
    
    // Update armies for next round
    yourArmy = { ...roundResult.yourArmy };
    enemyArmy = { ...roundResult.enemyArmy };
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

  // End Phase: Apply healing from Medical Centers after battle is complete
  const yourHealing: Record<string, number> = {};
  const enemyHealing: Record<string, number> = {};
  
  // Calculate healing for your army
  if (yourBuildings['Medical Center'] && yourBuildings['Medical Center'] > 0) {
    const medicalCenters = yourBuildings['Medical Center'];
    const healingPercent = 20; // 20% of deaths are healed back
    
    // Check all units that were in the initial army
    for (const [unit, originalCount] of Object.entries(yourInitialArmy)) {
      if (originalCount > 0) {
        const currentCount = yourArmy[unit] || 0;
        const lostInBattle = originalCount - currentCount;
        
        if (lostInBattle > 0) {
          const healed = Math.round(lostInBattle * (healingPercent / 100));
          if (healed > 0) {
            yourHealing[unit] = healed;
            yourArmy[unit] = Math.min(originalCount, currentCount + healed);
          }
        }
      }
    }
  }
  
  // Calculate healing for enemy army
  if (enemyBuildings['Medical Center'] && enemyBuildings['Medical Center'] > 0) {
    const medicalCenters = enemyBuildings['Medical Center'];
    const healingPercent = 20; // 20% of deaths are healed back
    
    // Check all units that were in the initial army
    for (const [unit, originalCount] of Object.entries(enemyInitialArmy)) {
      if (originalCount > 0) {
        const currentCount = enemyArmy[unit] || 0;
        const lostInBattle = originalCount - currentCount;
        
        if (lostInBattle > 0) {
          const healed = Math.round(lostInBattle * (healingPercent / 100));
          if (healed > 0) {
            enemyHealing[unit] = healed;
            enemyArmy[unit] = Math.min(originalCount, currentCount + healed);
          }
        }
      }
    }
  }
  
  // Add End phase to the last round's phase logs if healing occurred
  if (Object.keys(yourHealing).length > 0 || Object.keys(enemyHealing).length > 0) {
    if (battleLog.length > 0) {
      const lastRound = battleLog[battleLog.length - 1];
      lastRound.roundResult.phaseLogs.push({
        phase: 'end',
        yourLosses: {},
        enemyLosses: {},
        yourDamageLog: [],
        enemyDamageLog: [],
        yourArmyAtStart: { ...yourArmy },
        enemyArmyAtStart: { ...enemyArmy },
        yourHealing,
        enemyHealing
      });
    }
  }

  return {
    winner,
    rounds: round - 1,
    finalYourArmy: yourArmy,
    finalEnemyArmy: enemyArmy,
    battleLog
  };
} 