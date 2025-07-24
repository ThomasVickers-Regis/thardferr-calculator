import { Army, TechLevels, StrategyName, Buildings, PhaseType, RoundResult } from '@/types';
import { calculatePhaseDamage, DamageLog } from './calculatePhaseDamage';

export function simulateRound(
  yourArmy: Army,
  enemyArmy: Army,
  techLevelsYour: TechLevels,
  yourStrategy: StrategyName | null,
  techLevelsEnemy: TechLevels,
  enemyStrategy: StrategyName | null,
  ksDifferenceFactor: number,
  yourBuildings: Buildings,
  enemyBuildings: Buildings,
  yourRace: string,
  enemyRace: string,
  yourLand: number,
  enemyLand: number,
  yourInitialArmy: Army,
  enemyInitialArmy: Army,
  isYourArmyTheDefender: boolean
): RoundResult {
  const phaseLogs: any[] = [];
  const armyBeforeRound = { yourArmy: { ...yourArmy }, enemyArmy: { ...enemyArmy } };

  ['range', 'short', 'melee'].forEach(phase => {
    const yourArmyAtStart = { ...yourArmy };
    const enemyArmyAtStart = { ...enemyArmy };

    const doubleRangedDamage = (yourStrategy === 'Gnome Far Fighting' || enemyStrategy === 'Gnome Far Fighting');

    // Your army is attacked
    const yourDamageResult = calculatePhaseDamage(
      enemyArmyAtStart,
      yourArmyAtStart,
      phase as PhaseType,
      techLevelsEnemy,
      enemyStrategy,
      yourStrategy,
      yourStrategy === 'Infantry Attack' ? 'Infantry Attack' : null,
      ksDifferenceFactor,
      enemyBuildings,
      yourBuildings,
      enemyRace,
      yourRace,
      undefined,
      isYourArmyTheDefender,
      doubleRangedDamage
    );

    // Enemy army is attacked
    const enemyDamageResult = calculatePhaseDamage(
      yourArmyAtStart,
      enemyArmyAtStart,
      phase as PhaseType,
      techLevelsYour,
      yourStrategy,
      enemyStrategy,
      enemyStrategy === 'Infantry Attack' ? 'Infantry Attack' : null,
      ksDifferenceFactor,
      yourBuildings,
      enemyBuildings,
      yourRace,
      enemyRace,
      undefined,
      !isYourArmyTheDefender,
      doubleRangedDamage
    );

    const yourLosses = yourDamageResult.losses;
    for (const unit in yourLosses) {
      yourArmy[unit] = Math.max(0, (yourArmy[unit] || 0) - yourLosses[unit]);
    }

    const enemyLosses = enemyDamageResult.losses;
    for (const unit in enemyLosses) {
      enemyArmy[unit] = Math.max(0, (enemyArmy[unit] || 0) - enemyLosses[unit]);
    }

    phaseLogs.push({
      phase,
      yourArmyAtStart,
      enemyArmyAtStart,
      yourLosses,
      enemyLosses,
      yourDamageLog: yourDamageResult.damageLog,
      enemyDamageLog: enemyDamageResult.damageLog,
    });
  });

  return {
    yourArmy,
    enemyArmy,
    yourLosses: Object.entries(armyBeforeRound.yourArmy).reduce((acc, [unit, count]) => {
      acc[unit] = count - (yourArmy[unit] || 0);
      return acc;
    }, {} as Record<string, number>),
    enemyLosses: Object.entries(armyBeforeRound.enemyArmy).reduce((acc, [unit, count]) => {
      acc[unit] = count - (enemyArmy[unit] || 0);
      return acc;
    }, {} as Record<string, number>),
    phaseLogs,
  };
} 