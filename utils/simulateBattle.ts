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
  finalYourArmyBeforeHealing: Army;
  finalEnemyArmyBeforeHealing: Army;
  battleLog: BattleLogEntry[];
  yourHealing: Record<string, number>;
  enemyHealing: Record<string, number>;
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
  
  // Apply Castle-Based Defense Scaling (from changelog)
  // "Castle Based Defense Scaling, the more castles you have the fewer men you have to defend it (always at least 70%)"
  const enemyCastles = enemyBuildings['Castle'] || 0;
  

  
  if (enemyCastles > 0) {
    // Calculate garrison efficiency based on castle count
    // More castles = lower efficiency, but always at least 70%
    let garrisonEfficiency = 1.0;
    if (enemyCastles >= 10) {
      garrisonEfficiency = 0.70; // 70% minimum as per changelog
    } else if (enemyCastles >= 5) {
      garrisonEfficiency = 0.75; // 75% for medium castle count
    } else if (enemyCastles >= 2) {
      garrisonEfficiency = 0.80; // 80% for low castle count
    } else if (enemyCastles === 1) {
      garrisonEfficiency = 0.90; // 90% for single castle (less aggressive scaling)
    }
    
    // Apply garrison efficiency to all units
    for (const [unit, count] of Object.entries(enemyArmy)) {
      const originalCount = count;
      enemyArmy[unit] = Math.floor(count * garrisonEfficiency);
    }
  }
  
  // Store the scaled enemy army as the "initial" army for retreat calculations
  const enemyInitialArmyForRetreat = { ...enemyArmy };
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
    const yourRetreatThreshold = strategyYour === 'Quick Retreat' ? 35 : 17.5;
    const enemyRetreatThreshold = strategyEnemy === 'Quick Retreat' ? 35 : 17.5;
    
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
    if (strategyYour === 'Quick Retreat' || strategyEnemy === 'Quick Retreat') {
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
    const yourTotalUnits = Object.values(yourArmy).reduce((sum, v) => sum + v, 0);
    const enemyTotalUnits = Object.values(enemyArmy).reduce((sum, v) => sum + v, 0);
    const yourInitialTotal = Object.values(yourInitialArmy).reduce((sum, v) => sum + v, 0);
    const enemyInitialTotal = Object.values(enemyInitialArmyForRetreat).reduce((sum, v) => sum + v, 0);
    
    const yourRemainingPercent = yourInitialTotal > 0 ? (yourTotalUnits / yourInitialTotal) * 100 : 0;
    const enemyRemainingPercent = enemyInitialTotal > 0 ? (enemyTotalUnits / enemyInitialTotal) * 100 : 0;
    

    
    // Determine retreat thresholds based on strategies
    const yourRetreatThreshold = strategyYour === 'Quick Retreat' ? 35 : 17.5;
    const enemyRetreatThreshold = strategyEnemy === 'Quick Retreat' ? 35 : 17.5;
    
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

  // Determine winner
  const yourArmyTotal = Object.values(yourArmy).reduce((a, b) => a + b, 0);
  const enemyArmyTotal = Object.values(enemyArmy).reduce((a, b) => a + b, 0);
  const winner = yourArmyTotal > enemyArmyTotal ? 'yourArmy' : 'enemyArmy';

  // End-of-battle healing
  const calculateHealing = (army: Army, buildings: any, land: number, battleLog: any[], isYourArmy: boolean) => {
      const healing: Record<string, number> = {};
      if (buildings['Medical Center'] && land > 0) {
          const mcRatio = buildings['Medical Center'] / land;
          const healingPercent = mcRatio >= 1 ? 0.20 : (mcRatio >= 0.5 ? 0.10 : 0);
          if (healingPercent > 0) {
              const lossKey = isYourArmy ? 'yourLosses' : 'enemyLosses';
              for (const unitName in army) {
                  const losses = battleLog.reduce((acc, log: any) => acc + (log.roundResult[lossKey][unitName] || 0), 0);
                  const healedCount = Math.floor(losses * healingPercent);
                  if (healedCount > 0) {
                      healing[unitName] = healedCount;
                  }
              }
          }
      }
      return healing;
  };

  const yourHealed: Record<string, number> = calculateHealing(yourArmy, yourBuildings, yourBuildings.Land || 20, battleLog, true); 
  const enemyHealed: Record<string, number> = calculateHealing(enemyArmy, enemyBuildings, enemyBuildings.Land || 20, battleLog, false);
  
  for(const unit in yourHealed) {
      if(yourArmy[unit]) yourArmy[unit] += yourHealed[unit];
  }
  for(const unit in enemyHealed) {
      if(enemyArmy[unit]) enemyArmy[unit] += enemyHealed[unit];
  }


  return {
    winner,
    rounds: round - 1,
    finalYourArmy: yourArmy,
    finalEnemyArmy: enemyArmy,
    finalYourArmyBeforeHealing: yourArmyBeforeHealing,
    finalEnemyArmyBeforeHealing: enemyArmyBeforeHealing,
    battleLog,
    yourHealing: yourHealed,
    enemyHealing: enemyHealed,
  };
} 