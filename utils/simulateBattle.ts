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
 * Simulates a battle between two armies in a single round with three phases.
 * @param yourInitialArmy - Your starting army
 * @param enemyInitialArmy - Enemy starting army
 * @param yourKingdomStats - Your kingdom stats (KS, etc.)
 * @param enemyKingdomStats - Enemy kingdom stats (KS, etc.)
 * @param techLevelsYour - Your tech levels
 * @param strategyYour - Your active strategy
 * @param techLevelsEnemy - Enemy tech levels
 * @param strategyEnemy - Enemy active strategy
 * @param yourBuildings - Your buildings
 * @param enemyBuildings - Enemy buildings
 * @param yourRace - Your race
 * @param enemyRace - Enemy race
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
  yourBuildings: Buildings = {},
  enemyBuildings: Buildings = {},
  yourRace: string = 'dwarf',
  enemyRace: string = 'dwarf'
): BattleOutcome {
    let yourArmy = { ...yourInitialArmy };
    let enemyArmy = { ...enemyInitialArmy };

    const scaledYourArmy = { ...yourArmy };
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
    // if (attackerKS > 1.5 * defenderKS) ksDifferenceFactor = 0.8; // Attacker penalty
    // else if (attackerKS < 0.75 * defenderKS) ksDifferenceFactor = 1.2; // Attacker buff

    // Simulate a single round with three phases
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

    // Log the single round
    battleLog.push({
        round: 1,
        roundResult,
        yourArmy: { ...yourInitialArmy },
        enemyArmy: { ...enemyInitialArmy }
    });

    // Update armies for final state
    yourArmy = { ...roundResult.yourArmy };
    enemyArmy = { ...roundResult.enemyArmy };

    // Determine winner based on remaining units and casualties
    const yourTotalUnits = Object.values(yourArmy).reduce((sum, v) => sum + v, 0);
    const enemyTotalUnits = Object.values(enemyArmy).reduce((sum, v) => sum + v, 0);
    const yourInitialTotal = Object.values(yourInitialArmy).reduce((sum, v) => sum + v, 0);
    const enemyInitialTotal = Object.values(enemyInitialArmyForRetreat).reduce((sum, v) => sum + v, 0);
    
    const yourCasualties = yourInitialTotal - yourTotalUnits;
    const enemyCasualties = enemyInitialTotal - enemyTotalUnits;
    const yourCasualtyPercentage = yourInitialTotal > 0 ? (yourCasualties / yourInitialTotal) * 100 : 0;
    const enemyCasualtyPercentage = enemyInitialTotal > 0 ? (enemyCasualties / enemyInitialTotal) * 100 : 0;

    let winner: BattleOutcome['winner'] = 'draw';

    // Determine winner based on casualty percentages and remaining units
    if (yourCasualtyPercentage >= 100 && enemyCasualtyPercentage >= 100) {
        // Both armies completely destroyed - defender wins in draw
        winner = 'enemyArmy';
    } else if (yourCasualtyPercentage >= 100) {
        // Your army completely destroyed
        winner = 'enemyArmy';
    } else if (enemyCasualtyPercentage >= 100) {
        // Enemy army completely destroyed
        winner = 'yourArmy';
    } else if (yourTotalUnits === 0 && enemyTotalUnits === 0) {
        // Both armies have no units remaining - defender wins in draw
        winner = 'enemyArmy';
    } else if (yourTotalUnits === 0) {
        // Your army has no units remaining
        winner = 'enemyArmy';
    } else if (enemyTotalUnits === 0) {
        // Enemy army has no units remaining
        winner = 'yourArmy';
    } else {
        // Both armies have units remaining - determine winner by casualty percentage
        if (yourCasualtyPercentage < enemyCasualtyPercentage) {
            winner = 'yourArmy';
        } else if (enemyCasualtyPercentage < yourCasualtyPercentage) {
            winner = 'enemyArmy';
        } else {
            // Equal casualty percentages - determine by remaining units
            if (yourTotalUnits > enemyTotalUnits) {
                winner = 'yourArmy';
            } else if (enemyTotalUnits > yourTotalUnits) {
                winner = 'enemyArmy';
            } else {
                // Equal casualty percentages and equal remaining units - defender wins in draw
                winner = 'enemyArmy';
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
            for (const [unit, originalCount] of Object.entries(scaledYourArmy)) {
                const currentCount = yourArmy[unit] || 0;
                const losses = (originalCount as number) - currentCount;
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
            for (const [unit, originalCount] of Object.entries(scaledEnemyArmy)) {
                const currentCount = enemyArmy[unit] || 0;
                const losses = (originalCount as number) - currentCount;
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
    
    // Add End phase to the round's phase logs if healing occurred
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
        rounds: 1,
        finalYourArmy: yourArmy,
        finalEnemyArmy: enemyArmy,
        finalYourArmyBeforeHealing: yourArmyBeforeHealing,
        finalEnemyArmyBeforeHealing: enemyArmyBeforeHealing,
        battleLog,
        yourHealing,
        enemyHealing,
        scaledEnemyArmy,
        scaledYourArmy
    };
} 