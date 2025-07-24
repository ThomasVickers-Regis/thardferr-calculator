import { Army, TechLevels, StrategyName, Buildings, RoundResult, BattleOutcome, BattleLogEntry, KingdomStats } from '@/types';
import { simulateRound } from './simulateRound';
import { UNIT_DATA } from '@/data/unitData';

function getCastlePenalty(castles: number): number {
    if (castles <= 1) return 1.0;
    if (castles >= 2 && castles <= 9) return 0.8;
    if (castles >= 10 && castles <= 19) return 0.75;
    if (castles >= 20) return 0.7;
    return 1.0;
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
  yourStrategy: StrategyName | null,
  techLevelsEnemy: TechLevels,
  enemyStrategy: StrategyName | null,
  maxRounds: number = 20,
  yourBuildings: Buildings = {},
  enemyBuildings: Buildings = {},
  yourRace: string = 'dwarf',
  enemyRace: string = 'dwarf'
): BattleOutcome {
    let yourArmy = { ...yourInitialArmy };
  let enemyArmy = { ...enemyInitialArmy };

  // Store the original enemy army for retreat calculations before applying any penalties
  const enemyInitialArmyForRetreat = { ...enemyArmy };

  // Apply castle penalty to the defending (enemy) army
  const castleCount = enemyBuildings['Castle'] || 0;
  if (castleCount > 1) {
      const penalty = getCastlePenalty(castleCount);
      for (const unit in enemyArmy) {
          enemyArmy[unit] = Math.floor(enemyArmy[unit] * penalty);
      }
  }
  const scaledEnemyArmy = { ...enemyArmy }; // Capture the post-penalty army

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
    // Check if either army should retreat (lost 20% of total strength, or 40% for Quick Retreat)
    const yourTotalUnits = Object.values(yourArmy).reduce((sum, v) => sum + v, 0);
    const enemyTotalUnits = Object.values(enemyArmy).reduce((sum, v) => sum + v, 0);
    const yourInitialTotal = Object.values(yourInitialArmy).reduce((sum, v) => sum + v, 0);
    const enemyInitialTotal = Object.values(enemyInitialArmyForRetreat).reduce((sum, v) => sum + v, 0);
    
    const yourRemainingPercent = yourInitialTotal > 0 ? (yourTotalUnits / yourInitialTotal) * 100 : 0;
    const enemyRemainingPercent = enemyInitialTotal > 0 ? (enemyTotalUnits / enemyInitialTotal) * 100 : 0;
    
    // Determine retreat thresholds based on strategies
    const yourRetreatThreshold = yourStrategy === 'Quick Retreat' ? 35 : 20;
    const enemyRetreatThreshold = enemyStrategy === 'Quick Retreat' ? 35 : 20;
    
    // Check for retreat conditions
    if (yourRemainingPercent < yourRetreatThreshold && enemyRemainingPercent < enemyRetreatThreshold) {
      winner = 'draw';
      break;
    } else if (yourRemainingPercent < yourRetreatThreshold) {
      winner = 'enemyArmy';
      break;
    } else if (enemyRemainingPercent < enemyRetreatThreshold) {
      winner = 'yourArmy';
      break;
    }
    
    // Quick Retreat victory conditions
    if (yourStrategy === 'Quick Retreat' || enemyStrategy === 'Quick Retreat') {
      const yourCasualties = yourInitialTotal > 0 ? ((yourInitialTotal - yourTotalUnits) / yourInitialTotal) * 100 : 0;
      const enemyCasualties = enemyInitialTotal > 0 ? ((enemyInitialTotal - enemyTotalUnits) / enemyInitialTotal) * 100 : 0;
      
      // Attacker wins if they cause ≥35% casualties AND suffer less % casualties than defender
      if (yourCasualties >= 35 && yourCasualties < enemyCasualties) {
        winner = 'yourArmy';
        break;
      } else if (enemyCasualties >= 35 && enemyCasualties < yourCasualties) {
        winner = 'enemyArmy';
        break;
      }
    }
    
    // Fallback: Check if either army is completely eliminated
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
      yourStrategy,
      techLevelsEnemy,
      enemyStrategy,
      ksDifferenceFactor,
      yourBuildings,
      enemyBuildings,
      yourRace,
      enemyRace,
      Number(yourKingdomStats.Land || 20),
      Number(enemyKingdomStats.Land || 20),
      yourInitialArmy,
      enemyInitialArmy,
      false // isYourArmyTheDefender
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
    const yourTotalUnits = Object.values(yourArmy).reduce((sum, v) => sum + v, 0);
    const enemyTotalUnits = Object.values(enemyArmy).reduce((sum, v) => sum + v, 0);
    const yourInitialTotal = Object.values(yourInitialArmy).reduce((sum, v) => sum + v, 0);
    const enemyInitialTotal = Object.values(enemyInitialArmyForRetreat).reduce((sum, v) => sum + v, 0);
    
    const yourRemainingPercent = yourInitialTotal > 0 ? (yourTotalUnits / yourInitialTotal) * 100 : 0;
    const enemyRemainingPercent = enemyInitialTotal > 0 ? (enemyTotalUnits / enemyInitialTotal) * 100 : 0;
    

    
    // Determine retreat thresholds based on strategies (final check)
    const yourRetreatThreshold = yourStrategy === 'Quick Retreat' ? 35 : 20;
    const enemyRetreatThreshold = enemyStrategy === 'Quick Retreat' ? 35 : 20;
    
    // Check for retreat conditions
    if (yourRemainingPercent < yourRetreatThreshold && enemyRemainingPercent < enemyRetreatThreshold) {
      winner = 'draw';
    } else if (yourRemainingPercent < yourRetreatThreshold) {
      winner = 'enemyArmy';
    } else if (enemyRemainingPercent < enemyRetreatThreshold) {
      winner = 'yourArmy';
    } else {
      // Fallback: Check if either army is completely eliminated
      const yourAlive = Object.values(yourArmy).some(v => v > 0);
      const enemyAlive = Object.values(enemyArmy).some(v => v > 0);
      if (yourAlive && !enemyAlive) {
        winner = 'yourArmy';
      } else if (!yourAlive && enemyAlive) {
        winner = 'enemyArmy';
      } else {
        // Both armies are alive (or both dead) - this should be a draw
        winner = 'draw';
      }
    }
  }

  // Store army state before healing for casualty calculations
  const yourArmyBeforeHealing = { ...yourArmy };
  const enemyArmyBeforeHealing = { ...enemyArmy };
  
  // End Phase: Apply healing from Medical Centers after battle is complete
  const yourHealing: Record<string, number> = {};
  const enemyHealing: Record<string, number> = {};
  
  // Your army healing
  const yourLand = Number(yourKingdomStats.Land || 0);
  if (yourBuildings['Medical Center'] && yourLand > 0) {
    const healingPercent = (yourBuildings['Medical Center'] / yourLand) >= 1 ? 0.20 : 
                           (yourBuildings['Medical Center'] / yourLand) >= 0.5 ? 0.10 : 0;

    if (healingPercent > 0) {
      for (const [unit, originalCount] of Object.entries(yourInitialArmy)) {
        const currentCount = yourArmy[unit] || 0;
        const losses = originalCount - currentCount;
        if (losses > 0) {
          const healed = Math.floor(losses * healingPercent);
          if (healed > 0) {
            yourHealing[unit] = healed;
            yourArmy[unit] += healed;
          }
        }
      }
    }
  }

  // Enemy army healing
  const enemyLand = Number(enemyKingdomStats.Land || 0);
  if (enemyBuildings['Medical Center'] && enemyLand > 0) {
    const healingPercent = (enemyBuildings['Medical Center'] / enemyLand) >= 1 ? 0.20 : 
                           (enemyBuildings['Medical Center'] / enemyLand) >= 0.5 ? 0.10 : 0;

    if (healingPercent > 0) {
      for (const [unit, originalCount] of Object.entries(enemyInitialArmy)) {
        const currentCount = enemyArmy[unit] || 0;
        const losses = originalCount - currentCount;
        if (losses > 0) {
          const healed = Math.floor(losses * healingPercent);
          if (healed > 0) {
            enemyHealing[unit] = healed;
            enemyArmy[unit] += healed;
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
    finalYourArmyBeforeHealing: yourArmyBeforeHealing,
    finalEnemyArmyBeforeHealing: enemyArmyBeforeHealing,
    battleLog,
    yourHealing,
    enemyHealing,
    scaledEnemyArmy,
    scaledYourArmy: yourInitialArmy // For consistency, though your army is not scaled
  };
} 