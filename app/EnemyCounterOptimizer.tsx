import React, { useState } from 'react';
import { UNIT_DATA } from '../data/unitData';
import { getEffectiveUnitStats } from '../utils/getEffectiveUnitStats';
import { Army, TechLevels, StrategyName, Buildings, KingdomStats } from '@/types';

interface EnemyCounterOptimizerProps {
  yourArmy: Army;
  yourKingdomStats: KingdomStats;
  yourRace: string;
  yourTechLevels: TechLevels;
  yourStrategy: StrategyName | null;
  yourBuildings: Buildings;
  enemyArmy: Army;
  enemyKingdomStats: KingdomStats;
  enemyRace: string;
  enemyTechLevels: TechLevels;
  enemyStrategy: StrategyName | null;
  enemyBuildings: Buildings;
}

const EnemyCounterOptimizer: React.FC<EnemyCounterOptimizerProps> = ({
  yourArmy, yourKingdomStats, yourRace, yourTechLevels, yourStrategy, yourBuildings,
  enemyArmy, enemyKingdomStats, enemyRace, enemyTechLevels, enemyStrategy, enemyBuildings
}) => {
  const [minimized, setMinimized] = useState(true);
  const yourRaceKey = yourRace?.toLowerCase() || 'dwarf';
  const enemyRaceKey = enemyRace?.toLowerCase() || 'dwarf';
  // Get your Guard House capacity from buildings
  const guardHouses = yourBuildings?.['Guard House'] || 0;
  const maxUnits = guardHouses * 40; // 40 units per Guard House
  const currentUnits = Object.values(yourArmy).reduce((sum: number, count: any) => sum + (count || 0), 0);
  const availableSlots = Math.max(0, maxUnits - currentUnits);
  // Analyze enemy army composition
  const enemyAnalysis = Object.entries(enemyArmy).map(([unit, count]) => {
    if (count === 0) return null;
    const baseStats = UNIT_DATA[enemyRaceKey]?.[unit];
    if (!baseStats) return null;
    const countNum = typeof count === 'number' ? count : Number(count);
    const effectiveStats = getEffectiveUnitStats(unit, enemyRaceKey, enemyTechLevels || {}, enemyStrategy || null, false, countNum);
    return {
      unit,
      count: countNum,
      baseStats,
      effectiveStats,
      totalRangeDamage: effectiveStats.range * countNum,
      totalShortDamage: effectiveStats.short * countNum,
      totalMeleeDamage: effectiveStats.melee * countNum,
      totalDefense: effectiveStats.defense * countNum,
      isRangedImmune: unit.includes('Skeleton') || unit.includes('Phantom'),
      isMeleeImmune: unit.includes('Mage'),
      hasGuardTower: enemyKingdomStats.GuardTower > 0
    };
  }).filter(Boolean);
  const enemyPhaseDamage = {
    range: enemyAnalysis.reduce((sum, unit) => sum + (unit?.totalRangeDamage || 0), 0),
    short: enemyAnalysis.reduce((sum, unit) => sum + (unit?.totalShortDamage || 0), 0),
    melee: enemyAnalysis.reduce((sum, unit) => sum + (unit?.totalMeleeDamage || 0), 0)
  };
  const totalEnemyDamage = enemyPhaseDamage.range + enemyPhaseDamage.short + enemyPhaseDamage.melee;
  const enemyRangePercentage = totalEnemyDamage > 0 ? (enemyPhaseDamage.range / totalEnemyDamage) * 100 : 0;
  const enemyMeleePercentage = totalEnemyDamage > 0 ? (enemyPhaseDamage.melee / totalEnemyDamage) * 100 : 0;
  const yourUnits = Object.entries(UNIT_DATA[yourRaceKey] || {}).map(([unit, baseStats]) => {
    const effectiveStats = getEffectiveUnitStats(unit, yourRaceKey, yourTechLevels || {}, yourStrategy || null, true, 1);
    const baseCost = baseStats.base_gold_cost || 0;
    const equipmentCost = baseStats.equipment_gold_cost || 0;
    const totalCost = baseCost + equipmentCost;
    const goldUpkeep48h = (baseStats.upkeep.gold || 0) * 2;
    const foodUpkeep48h = (baseStats.upkeep.food || 0) * 2;
    const totalUpkeep48h = goldUpkeep48h + foodUpkeep48h;
    const damagePerGold = totalCost > 0 ? (effectiveStats.range + effectiveStats.short + effectiveStats.melee) / totalCost : 0;
    const damagePerUpkeep = totalUpkeep48h > 0 ? (effectiveStats.range + effectiveStats.short + effectiveStats.melee) / totalUpkeep48h : 0;
    return {
      unit,
      effectiveStats,
      totalCost,
      totalUpkeep48h,
      damagePerGold,
      damagePerUpkeep,
      rangeDamage: effectiveStats.range,
      shortDamage: effectiveStats.short,
      meleeDamage: effectiveStats.melee,
      defense: effectiveStats.defense
    };
  });
  let counterStrategy = 'balanced';
  let strategyReason = '';
  let rangedStrategy = '';
  let meleeStrategy = '';
  const enemyGuardTowers = enemyBuildings?.['Guard Tower'] || 0;
  const enemyMedicalCenters = enemyBuildings?.['Medical Center'] || 0;
  const enemyCastles = enemyKingdomStats.Castles || 0;
  const yourGuardTowers = yourBuildings?.['Guard Tower'] || 0;
  const yourMedicalCenters = yourBuildings?.['Medical Center'] || 0;
  const yourCastles = yourKingdomStats.Castles || 0;
  const buildingRecommendations = [];
  if (enemyRangePercentage > 40) {
    const enemyRangedDamage = enemyPhaseDamage.range;
    const guardTowersNeeded = Math.ceil(enemyRangedDamage / 100);
    const optimalGuardTowers = Math.min(guardTowersNeeded, 3);
    const additionalGuardTowers = Math.max(0, optimalGuardTowers - yourGuardTowers);
    if (additionalGuardTowers > 0) {
      buildingRecommendations.push(`Build ${additionalGuardTowers} Guard Tower(s) to reduce enemy ranged damage by ~${additionalGuardTowers * 50}%`);
    }
  }
  if (enemyMeleePercentage > 60) {
    const enemyMeleeDamage = enemyPhaseDamage.melee;
    const medicalCentersNeeded = Math.ceil(enemyMeleeDamage / 200);
    const optimalMedicalCenters = Math.min(medicalCentersNeeded, 2);
    const additionalMedicalCenters = Math.max(0, optimalMedicalCenters - yourMedicalCenters);
    if (additionalMedicalCenters > 0) {
      buildingRecommendations.push(`Build ${additionalMedicalCenters} Medical Center(s) to reduce melee damage by ${additionalMedicalCenters * 50}`);
    }
  }
  const calculateRangedRequirements = () => {
    let requirements = [];
    let difficulty = 'Easy';
    if (enemyGuardTowers > 0) {
      requirements.push(`Enemy has ${enemyGuardTowers} Guard Tower(s) - ranged damage reduced by ~50%`);
      difficulty = 'Hard';
    }
    if (enemyAnalysis.some(unit => unit?.isRangedImmune)) {
      requirements.push('Enemy has ranged-immune units');
      difficulty = 'Very Hard';
    }
    if (enemyRangePercentage > 60) {
      requirements.push(`Enemy has ${enemyRangePercentage.toFixed(1)}% ranged damage - you need superior ranged to win`);
      difficulty = difficulty === 'Easy' ? 'Medium' : difficulty;
    }
    if (requirements.length === 0) {
      requirements.push('No ranged defenses detected - ranged units attack first');
      difficulty = 'Easy';
    }
    return { requirements, difficulty };
  };
  const calculateMeleeRequirements = () => {
    let requirements = [];
    let difficulty = 'Easy';
    if (enemyAnalysis.some(unit => unit?.isMeleeImmune)) {
      requirements.push('Enemy has melee-immune units - cannot damage with melee');
      difficulty = 'Impossible';
    }
    if (enemyMedicalCenters > 0) {
      requirements.push(`Enemy has ${enemyMedicalCenters} Medical Center(s) - reduces melee damage by 50 per center`);
      difficulty = difficulty === 'Easy' ? 'Medium' : difficulty;
    }
    if (enemyMeleePercentage > 60) {
      requirements.push(`Enemy has ${enemyMeleePercentage.toFixed(1)}% melee damage - you need superior melee to win`);
      difficulty = difficulty === 'Easy' ? 'Medium' : difficulty;
    }
    if (requirements.length === 0) {
      requirements.push('No melee defenses detected - melee units can engage directly');
      difficulty = 'Easy';
    }
    return { requirements, difficulty };
  };
  const rangedAnalysis = calculateRangedRequirements();
  const meleeAnalysis = calculateMeleeRequirements();
  if (meleeAnalysis.difficulty === 'Impossible') {
    counterStrategy = 'ranged';
    strategyReason = 'Melee strategy impossible due to melee-immune units';
  } else if (rangedAnalysis.difficulty === 'Very Hard' && meleeAnalysis.difficulty !== 'Impossible') {
    counterStrategy = 'melee';
    strategyReason = 'Ranged strategy very difficult, melee more feasible';
  } else if (rangedAnalysis.difficulty === 'Hard' && meleeAnalysis.difficulty === 'Easy') {
    counterStrategy = 'melee';
    strategyReason = 'Melee strategy easier than ranged';
  } else if (rangedAnalysis.difficulty === 'Easy') {
    counterStrategy = 'ranged';
    strategyReason = 'Ranged strategy most feasible - units attack first';
  } else {
    counterStrategy = 'melee';
    strategyReason = 'Melee strategy more feasible than ranged';
  }
  rangedStrategy = `Ranged Strategy (${rangedAnalysis.difficulty}): ${rangedAnalysis.requirements.join(', ')}`;
  meleeStrategy = `Melee Strategy (${meleeAnalysis.difficulty}): ${meleeAnalysis.requirements.join(', ')}`;
  const generateCounterArmy = () => {
    const counterArmy: any = {};
    let remainingSlots = availableSlots;
    let totalCost = 0;
    let totalUpkeep = 0;
    const yourFarms = yourBuildings?.['Farm'] || 0;
    const yourMines = yourBuildings?.['Mine'] || 0;
    const farmIncome = yourFarms * 50;
    const mineIncome = yourMines * 100;
    const totalHourlyIncome = farmIncome + mineIncome;
    const estimatedBudget = totalHourlyIncome * 24;
    let sortedUnits = [...yourUnits];
    if (counterStrategy === 'ranged') {
      sortedUnits = sortedUnits
        .filter(unit => unit.rangeDamage > 0)
        .sort((a, b) => b.damagePerGold - a.damagePerGold);
    } else if (counterStrategy === 'melee') {
      sortedUnits = sortedUnits
        .filter(unit => unit.meleeDamage > 0)
        .sort((a, b) => b.damagePerGold - a.damagePerGold);
    } else {
      sortedUnits = sortedUnits.sort((a, b) => b.damagePerGold - a.damagePerGold);
    }
    sortedUnits.forEach(unit => {
      if (remainingSlots > 0 && totalCost < estimatedBudget) {
        const remainingBudget = estimatedBudget - totalCost;
        const maxAffordable = Math.floor(remainingBudget / unit.totalCost);
        const unitsToAdd = Math.min(remainingSlots, maxAffordable, 25);
        if (unitsToAdd > 0) {
          counterArmy[unit.unit] = unitsToAdd;
          remainingSlots -= unitsToAdd;
          totalCost += unitsToAdd * unit.totalCost;
          totalUpkeep += unitsToAdd * unit.totalUpkeep48h;
        }
      }
    });
    return { counterArmy, totalCost, totalUpkeep, remainingSlots, estimatedBudget };
  };
  const optimalCounter = generateCounterArmy();
  const currentArmyUpkeep = {
    gold: 0,
    food: 0,
    total: 0
  };
  Object.entries(yourArmy).forEach(([unit, count]) => {
    const unitCount = count || 0;
    const baseStats = UNIT_DATA[yourRaceKey]?.[unit];
    if (baseStats) {
      currentArmyUpkeep.gold += (baseStats.upkeep.gold || 0) * unitCount * 2;
      currentArmyUpkeep.food += (baseStats.upkeep.food || 0) * unitCount * 2;
    }
  });
  currentArmyUpkeep.total = currentArmyUpkeep.gold + currentArmyUpkeep.food;
  const calculateBattleOutcome = () => {
    const yourTotalArmy = { ...yourArmy };
    Object.entries(optimalCounter.counterArmy).forEach(([unit, count]) => {
      yourTotalArmy[unit] = (yourTotalArmy[unit] || 0) + (count as number);
    });
    const yourPhaseDamage = { range: 0, short: 0, melee: 0 };
    yourUnits.forEach(unit => {
      const count = yourTotalArmy[unit.unit] || 0;
      yourPhaseDamage.range += unit.rangeDamage * count;
      yourPhaseDamage.short += unit.shortDamage * count;
      yourPhaseDamage.melee += unit.meleeDamage * count;
    });
    const yourTotalDamage = Number(yourPhaseDamage.range) + Number(yourPhaseDamage.short) + Number(yourPhaseDamage.melee);
    return {
      yourDamage: yourTotalDamage,
      enemyDamage: Number(totalEnemyDamage),
      advantage: yourTotalDamage - Number(totalEnemyDamage),
      rangeAdvantage: Number(yourPhaseDamage.range) - Number(enemyPhaseDamage.range),
      meleeAdvantage: Number(yourPhaseDamage.melee) - Number(enemyPhaseDamage.melee)
    };
  };
  const battleOutcome = calculateBattleOutcome();
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Enemy Counter Optimizer</h3>
        <button
          className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600 border border-gray-600"
          onClick={() => setMinimized(m => !m)}
          aria-label={minimized ? 'Expand' : 'Minimize'}
        >
          {minimized ? 'Show' : 'Hide'}
        </button>
      </div>
      {!minimized && (
        <>
          <div className="mb-4 p-3 bg-red-900 rounded">
            <h4 className="font-medium text-red-300 mb-2">Enemy Army & Kingdom Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between">
                  <span>Total Units:</span>
                  <span>{Object.values(enemyArmy).reduce((sum: number, count: any) => sum + (count || 0), 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Damage:</span>
                  <span>{totalEnemyDamage.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ranged Damage:</span>
                  <span>{enemyPhaseDamage.range.toFixed(0)} ({enemyRangePercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span>Melee Damage:</span>
                  <span>{enemyPhaseDamage.melee.toFixed(0)} ({enemyMeleePercentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Guard Towers:</span>
                  <span>{enemyGuardTowers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Centers:</span>
                  <span>{enemyMedicalCenters}</span>
                </div>
                <div className="flex justify-between">
                  <span>Castles:</span>
                  <span>{enemyCastles}</span>
                </div>
                {buildingRecommendations.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-900/30 rounded">
                    <div className="text-yellow-300 font-semibold mb-1">Building Recommendations:</div>
                    {buildingRecommendations.map((rec, index) => (
                      <div key={index} className="text-yellow-200 text-sm">• {rec}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mb-4 p-3 bg-blue-900 rounded">
            <h4 className="font-medium text-blue-300 mb-2">Counter Strategy Analysis</h4>
            <div className="text-sm space-y-2">
              <div className="font-medium text-yellow-300 mb-2">Recommended Strategy: {counterStrategy.toUpperCase()}</div>
              <div className="text-gray-300 mb-2">{strategyReason}</div>
              <div className="grid grid-cols-1 gap-2">
                <div className={`p-2 rounded ${counterStrategy === 'ranged' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                  <div className="font-medium">{rangedStrategy}</div>
                </div>
                <div className={`p-2 rounded ${counterStrategy === 'melee' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
                  <div className="font-medium">{meleeStrategy}</div>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                <div className="font-medium">Strategy Notes:</div>
                <div className="ml-2">• Ranged units attack first in battle</div>
                <div className="ml-2">• Guard Towers reduce ranged damage by ~50%</div>
                <div className="ml-2">• Medical Centers reduce melee damage by 50 per center</div>
                <div className="ml-2">• Some units are immune to specific damage types</div>
              </div>
            </div>
          </div>
          <div className="mb-4 p-3 bg-green-900 rounded">
            <h4 className="font-medium text-green-300 mb-2">Your Kingdom Capacity & Economy</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between">
                  <span>Guard Houses:</span>
                  <span>{guardHouses}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Units:</span>
                  <span>{maxUnits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Units:</span>
                  <span>{currentUnits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Slots:</span>
                  <span className="font-bold text-green-300">{availableSlots}</span>
                </div>
                <div className="flex justify-between">
                  <span>Current 48h Upkeep:</span>
                  <span>{currentArmyUpkeep.total.toFixed(0)} gold</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Farms:</span>
                  <span>{yourBuildings?.['Farm'] || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mines:</span>
                  <span>{yourBuildings?.['Mine'] || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Centers:</span>
                  <span>{yourMedicalCenters}</span>
                </div>
                <div className="flex justify-between">
                  <span>Castles:</span>
                  <span>{yourCastles}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-4 p-3 bg-purple-900 rounded">
            <h4 className="font-medium text-purple-300 mb-2">Recommended Counter Army</h4>
            <div className="text-sm mb-2">
              <div className="flex justify-between">
                <span>Units to Add:</span>
                <span>{Object.values(optimalCounter.counterArmy).reduce((sum: number, count: any) => sum + count, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Cost:</span>
                <span>{optimalCounter.totalCost.toFixed(0)} gold</span>
              </div>
              <div className="flex justify-between">
                <span>New Units 48h Upkeep:</span>
                <span>{optimalCounter.totalUpkeep.toFixed(0)} gold</span>
              </div>
              <div className="flex justify-between">
                <span>Total 48h Upkeep:</span>
                <span>{(currentArmyUpkeep.total + optimalCounter.totalUpkeep).toFixed(0)} gold</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Budget:</span>
                <span>{optimalCounter.estimatedBudget.toFixed(0)} gold</span>
              </div>
              <div className="flex justify-between">
                <span>Budget Used:</span>
                <span>{optimalCounter.estimatedBudget > 0 ? ((optimalCounter.totalCost / optimalCounter.estimatedBudget) * 100).toFixed(1) : '0'}%</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining Slots:</span>
                <span>{optimalCounter.remainingSlots}</span>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {Object.entries(optimalCounter.counterArmy).map(([unit, count]) => 
                `${unit}: ${count}`
              ).join(', ')}
            </div>
          </div>
          <div className="mb-4 p-3 bg-yellow-900 rounded">
            <h4 className="font-medium text-yellow-300 mb-2">Battle Prediction</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between">
                  <span>Your Total Damage:</span>
                  <span className={battleOutcome.advantage > 0 ? 'text-green-300 font-bold' : 'text-red-300'}>{battleOutcome.yourDamage.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enemy Total Damage:</span>
                  <span>{battleOutcome.enemyDamage.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Damage Advantage:</span>
                  <span className={battleOutcome.advantage > 0 ? 'text-green-300 font-bold' : 'text-red-300'}>{battleOutcome.advantage > 0 ? '+' : ''}{battleOutcome.advantage.toFixed(0)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Ranged Advantage:</span>
                  <span className={battleOutcome.rangeAdvantage > 0 ? 'text-green-300' : 'text-red-300'}>{battleOutcome.rangeAdvantage > 0 ? '+' : ''}{battleOutcome.rangeAdvantage.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Melee Advantage:</span>
                  <span className={battleOutcome.meleeAdvantage > 0 ? 'text-green-300' : 'text-red-300'}>{battleOutcome.meleeAdvantage > 0 ? '+' : ''}{battleOutcome.meleeAdvantage.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            <div className="font-medium">Counter Strategy Notes:</div>
            <div className="ml-2">• Ranged units attack first and are prioritized when enemy has weak ranged defense</div>
            <div className="ml-2">• Melee units are recommended against Guard Towers or ranged-immune units</div>
            <div className="ml-2">• Medical Centers reduce incoming melee damage by 50 per center</div>
            <div className="ml-2">• Recommendations factor in your current tech levels and strategy</div>
            <div className="ml-2">• Upkeep costs are calculated for 48 hours</div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnemyCounterOptimizer; 