import React from 'react';
import UnitDetail from './UnitDetail';
import { getEffectiveUnitStats } from '../utils/getEffectiveUnitStats';
import { UNIT_DATA } from '../data/unitData';
import { STRATEGY_DATA } from '../data/strategyData';
import { Army, TechLevels, StrategyName, Buildings, KingdomStats, BattleOutcome } from '@/types';

const formatNumber = (value: any, decimalPlaces = 2) => {
    const num = Number(value);
    if (isNaN(num)) {
        return (0).toFixed(decimalPlaces);
    }
    return num.toFixed(decimalPlaces);
};

// HealingDisplay: renders healing for a side in the end phase
const HealingDisplay = ({ side, healing }: { side: 'your' | 'enemy'; healing: Record<string, number> }) => (
  <div className="bg-gray-800 p-4 rounded">
    <div className={`text-green-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg`}>{side === 'your' ? 'Your Army Healing:' : 'Enemy Army Healing:'}</div>
    <div className="space-y-3 text-sm">
      {healing && Object.keys(healing).length > 0 ? (
        Object.entries(healing).map(([unit, healed]) => (
          <div key={unit} className="bg-gray-700 p-3 rounded border border-green-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-200 font-bold">{unit}</span>
              <span className="text-green-400 font-bold text-lg">+{healed}</span>
            </div>
            <div className="text-green-300 text-xs mt-1">
              Medical Centers healed {healed} units
            </div>
          </div>
        ))
      ) : (
        <div className="text-gray-400 text-center py-4">No healing applied</div>
      )}
    </div>
  </div>
);

// PhaseStats: renders attack, defense, modifiers, and building effects for a side in a phase
const PhaseStats = ({ stats, side }: { stats: any; side: 'your' | 'enemy' }) => (
  <div className="bg-gray-700 p-3 rounded">
    <div className="text-gray-300 font-medium mb-2">Army Stats:</div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="capitalize">Attack: <span className={`font-bold ${side === 'your' ? 'text-blue-400' : 'text-red-400'}`}>{isNaN(stats.attack) ? '0.00' : formatNumber(stats.attack)}</span></div>
      <div>Defense: <span className={`font-bold ${side === 'your' ? 'text-blue-400' : 'text-red-400'}`}>{isNaN(stats.defense) ? '0.00' : formatNumber(stats.defense)}</span></div>
    </div>
    {stats.modifiers && stats.modifiers.length > 0 && (
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-xs text-yellow-300">Modifiers:</div>
        {stats.modifiers.map((mod: string, i: number) => (
          <div key={i} className="text-xs text-gray-300">• {mod}</div>
        ))}
      </div>
    )}
    {stats.buildingEffects && stats.buildingEffects.length > 0 && (
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-xs text-green-300">Building Effects:</div>
        {stats.buildingEffects.map((effect: string, i: number) => (
          <div key={i} className="text-xs text-gray-300">• {effect}</div>
        ))}
      </div>
    )}
  </div>
);

// ArmySideSection: renders one side's stats, units, losses, damage, etc.
const ArmySideSection = ({
  side,
  phaseLog,
  entry,
  race,
  techLevels,
  strategy,
  originalArmy,
  buildings,
  isAttacker,
  phase,
  damageLogKey,
  lossesKey,
  armyKey,
}: any) => {
  const armyAtStart = phaseLog[armyKey] || entry[armyKey];
  return (
    <div className="bg-gray-800 p-4 rounded">
      <div className={`font-medium mb-3 border-b border-gray-600 pb-2 text-lg ${side === 'your' ? 'text-blue-300' : 'text-red-300'}`}>{side === 'your' ? 'Your Army Details' : 'Enemy Army Details'}</div>
      <div className="space-y-3 text-sm">
        {(Object.entries(armyAtStart).filter(([_, v]: [string, any]) => v > 0)).map(([unit, count]) => {
          const stats = getEffectiveUnitStats(unit, race, techLevels, strategy, isAttacker, 1);
          const baseStats = UNIT_DATA[race.toLowerCase()]?.[unit];
          const lost = phaseLog[lossesKey][unit] || 0;
          const survived = (count as number) - lost;
          const damageEntry = (phaseLog[damageLogKey] || []).find((d: any) => d.unitName === unit);
          return (
            <UnitDetail
              key={unit}
              unitName={unit}
              count={count as number}
              survived={survived}
              lost={lost}
              stats={stats}
              baseStats={baseStats}
              damageEntry={damageEntry}
              side={side}
              phase={phaseLog.phase}
            />
          );
        })}
      </div>
    </div>
  );
};

// BattlePhase: renders a single phase in a round
const calculatePhaseStats = (army: any, race: string, techLevels: any = {}, strategy: any = null, isAttacker: boolean = true, phase: string, buildings: any = {}) => {
  let totalAttack = 0;
  let totalDefense = 0;
  let range = 0, short = 0, melee = 0;
  const modifiers: string[] = [];
  const buildingEffects: string[] = [];
  for (const [unit, count] of Object.entries(army || {})) {
    const unitCount = count as number;
    if (unitCount > 0) {
      const effectiveStats = getEffectiveUnitStats(unit, race, techLevels, strategy, isAttacker, 1);
      // Only include units that can attack in this phase
      if (phase === 'range' && effectiveStats.range > 0) {
        totalAttack += effectiveStats.range * unitCount;
      } else if (phase === 'short' && effectiveStats.short > 0) {
        totalAttack += effectiveStats.short * unitCount;
      } else if (phase === 'melee' && effectiveStats.melee > 0) {
        totalAttack += effectiveStats.melee * unitCount;
      }
      // Always sum defense for all units
      totalDefense += effectiveStats.defense * unitCount;
      range += effectiveStats.range * unitCount;
      short += effectiveStats.short * unitCount;
      melee += effectiveStats.melee * unitCount;
    }
  }
  return {
    attack: Math.round(totalAttack * 100) / 100,
    defense: Math.round(totalDefense * 100) / 100,
    range: Math.round(range * 100) / 100,
    short: Math.round(short * 100) / 100,
    melee: Math.round(melee * 100) / 100,
    modifiers,
    buildingEffects
  };
};

const BattlePhase = ({
  phaseLog,
  entry,
  yourProps,
  enemyProps,
  originalYourArmy,
  originalEnemyArmy,
  battleLog,
  phase,
  winner,
  battleOutcome,
}: any) => {
  // Calculate phase stats for each side
  const yourPhaseStats = calculatePhaseStats(
    phaseLog.yourArmyAtStart || entry.yourArmy || {},
    yourProps.race,
    yourProps.techLevels,
    yourProps.strategy,
    true, // isAttacker: true for your army
    phaseLog.phase,
    yourProps.buildings
  );
  const enemyPhaseStats = calculatePhaseStats(
    phaseLog.enemyArmyAtStart || entry.enemyArmy || {},
    enemyProps.race,
    enemyProps.techLevels,
    enemyProps.strategy,
    true, // isAttacker: true for enemy army
    phaseLog.phase,
    enemyProps.buildings
  );
  // Calculate casualties for both sides (comparing initial to final army)
  const calculateCasualties = (initialArmy: any, finalArmy: any) => {
    const casualties: Record<string, number> = {};
    for (const [unit, initialCount] of Object.entries(initialArmy || {})) {
      const finalCount = finalArmy[unit] || 0;
      const lost = (initialCount as number) - finalCount;
      if (lost > 0) {
        casualties[unit] = lost;
      }
    }
    return casualties;
  };
  // Use the final, post-healing army state for the summary.
  const yourFinalCasualties = calculateCasualties(originalYourArmy, battleOutcome.finalYourArmy);
  const enemyFinalCasualties = calculateCasualties(originalEnemyArmy, battleOutcome.finalEnemyArmyBeforeHealing);
  // Simulate land gain/loss based on battle outcome (attacker perspective)
  const calculateLandGainLoss = () => {
    if (winner === 'yourArmy') {
      const defenderLand = 20; // Should come from enemy kingdom stats
      const landGained = Math.floor(defenderLand * (0.05 + Math.random() * 0.1));
      const castlesGained = Math.random() < 0.2 ? 1 : 0;
      return { land: landGained, castles: castlesGained, peasants: Math.floor(Math.random() * 2000) + 1000 };
    } else {
      return { land: 0, castles: 0, peasants: Math.floor(Math.random() * 1000) + 500 };
    }
  };
  const landResults = calculateLandGainLoss();
  // Simulate building gains from conquered territory (only happens to attacker)
  const simulateBuildingGains = () => {
    if (winner !== 'yourArmy') return {};
    const landGained = landResults.land;
    if (landGained <= 0) return {};
    const buildingRatios = {
      'House': 2.0, 'Farm': 0.5, 'Forge': 0.5, 'Guard House': 0.5, 'Guard Tower': 0.5, 'Market': 0.5,
      'Medical Center': 0.0, 'Mill': 0.5, 'Mine': 0.5, 'School': 0.5, 'Training Center': 0.25, 'Advanced Training Center': 0.25
    };
    const gained: Record<string, number> = {};
    Object.entries(buildingRatios).forEach(([building, ratio]) => {
      const baseCount = Math.floor(landGained * ratio);
      const variation = Math.random() * 0.4 - 0.2;
      const finalCount = Math.max(0, Math.floor(baseCount * (1 + variation)));
      if (finalCount > 0) gained[building] = finalCount;
    });
    return gained;
  };
  const buildingGains = simulateBuildingGains();
  // Format casualties for display
  const formatCasualties = (casualties: Record<string, number>) => {
    return Object.entries(casualties)
      .map(([unit, count]) => `${count} ${unit}`)
      .join(', ');
  };
  // Aggregate total losses for both sides across all rounds/phases
  const aggregateLosses = (key: 'yourLosses' | 'enemyLosses') => {
    const total: Record<string, number> = {};
    Object.entries(battleLog).forEach(([entryIdx, entry]: [string, any]) => {
      Object.entries(entry.roundResult.phaseLogs).forEach(([pIdx, phaseLog]: [string, any]) => {
        Object.entries(phaseLog[key] || {}).forEach(([unit, lost]) => {
          total[unit] = (total[unit] || 0) + (lost as number);
        });
      });
    });
    return total;
  };
  const yourTotalLosses = aggregateLosses('yourLosses');
  const enemyTotalLosses = aggregateLosses('enemyLosses');

  return (
    <div className="mb-4 p-3 bg-gray-700 rounded border border-gray-600">
      <div className="font-bold text-purple-200 capitalize mb-4 text-center bg-gray-600 p-3 rounded text-xl border border-purple-400 shadow-lg">{phaseLog.phase === 'end' ? 'End Phase' : `${phaseLog.phase} Phase`}</div>
      {/* End Phase Healing Display */}
      {phaseLog.phase === 'end' ? (
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealingDisplay side="your" healing={phaseLog.yourHealing} />
          <HealingDisplay side="enemy" healing={phaseLog.enemyHealing} />
        </div>
      ) : (
        <>
          {/* Phase Summary (replace with Army Analysis blocks) */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your Army Analysis */}
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-blue-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg">Your Army Analysis:</div>
              <div className="space-y-3 text-sm">
                {/* Army Stats */}
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-300 font-medium mb-2">Army Stats:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="capitalize">{phaseLog.phase}: <span className="font-bold text-blue-400">{isNaN(yourPhaseStats.attack) ? '0.00' : formatNumber(yourPhaseStats.attack)}</span></div>
                    <div>Defense: <span className="font-bold text-blue-400">{isNaN(yourPhaseStats.defense) ? '0.00' : formatNumber(yourPhaseStats.defense)}</span></div>
                  </div>
                  {yourPhaseStats.modifiers.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-xs text-yellow-300">Modifiers:</div>
                      {yourPhaseStats.modifiers.map((mod: string, i: number) => (
                        <div key={i} className="text-xs text-gray-300">• {mod}</div>
                      ))}
                    </div>
                  )}
                  {yourPhaseStats.buildingEffects.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-xs text-green-300">Building Effects:</div>
                      {yourPhaseStats.buildingEffects.map((effect: string, i: number) => (
                        <div key={i} className="text-xs text-gray-300">• {effect}</div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-blue-300 font-bold mt-2">• Global: All battle damage is reduced by 0.65× for game balance.</div>
                </div>
                
                {/* Condensed Unit Summary */}
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-300 font-medium mb-2">Unit Summary:</div>
                  <div className="space-y-1 text-xs">
                    {Object.entries(phaseLog.yourArmyAtStart || entry.yourArmy || {})
                      .filter(([_, v]) => (v as number) > 0)
                      .map(([unit, count]) => {
                        const stats = getEffectiveUnitStats(unit, yourProps.race, yourProps.techLevels, yourProps.strategy, true, 1);
                        let attackValue = 0;
                        if (phaseLog.phase === 'range') attackValue = stats.range;
                        else if (phaseLog.phase === 'short') attackValue = stats.short;
                        else if (phaseLog.phase === 'melee') attackValue = stats.melee;
                        const totalDamage = (count as number) * attackValue;
                        const lost = phaseLog.yourLosses[unit] || 0;
                        const survived = (count as number) - lost;
                        return (
                          <div key={unit} className="flex justify-between items-center bg-gray-750 p-1 rounded">
                            <div className="flex-1">
                              <div className="text-gray-200 font-medium">{unit}</div>
                              <div className="text-gray-400 text-xs">{count as number} → {survived} ({lost > 0 ? `-${lost}` : '0'})</div>
                            </div>
                            <div className="text-right">
                              <div className="text-blue-400 font-bold">{isNaN(attackValue) ? '0.00' : formatNumber(attackValue)}</div>
                              <div className="text-gray-400 text-xs">{isNaN(totalDamage) ? '0' : formatNumber(totalDamage, 0)}</div>
                            </div>
                          </div>
                        );
                      }).filter((x): x is React.JSX.Element => x !== null)}
                  </div>
                </div>
                {/* Attackers */}
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-300 font-medium mb-2">{phaseLog.phase} Attackers:</div>
                  <div className="space-y-1 text-xs">
                    {Object.entries(phaseLog.yourArmyAtStart || entry.yourArmy || {})
                      .filter(([unit, count]) => {
                        const stats = getEffectiveUnitStats(unit, yourProps.race, yourProps.techLevels, yourProps.strategy, true, 1);
                        if (phaseLog.phase === 'range') return stats.range > 0 && (count as number) > 0;
                        if (phaseLog.phase === 'short') return stats.short > 0 && (count as number) > 0;
                        if (phaseLog.phase === 'melee') return stats.melee > 0 && (count as number) > 0;
                        return false;
                      })
                      .map(([unit, count]) => {
                        const stats = getEffectiveUnitStats(unit, yourProps.race, yourProps.techLevels, yourProps.strategy, true, 1);
                        let attackValue = 0;
                        if (phaseLog.phase === 'range') attackValue = stats.range;
                        else if (phaseLog.phase === 'short') attackValue = stats.short;
                        else if (phaseLog.phase === 'melee') attackValue = stats.melee;
                        return (
                          <div key={unit} className="flex justify-between items-center">
                            <span className="text-gray-300">{unit}</span>
                            <span className="font-bold text-blue-400">{count as number} × {isNaN(attackValue) ? '0.00' : formatNumber(attackValue)} = {isNaN((count as number) * attackValue) ? '0.00' : formatNumber((count as number) * attackValue)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
            {/* Enemy Army Analysis (same structure, red colors) */}
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-red-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg">Enemy Army Analysis:</div>
              <div className="space-y-3 text-sm">
                {/* Army Stats */}
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-300 font-medium mb-2">Army Stats:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="capitalize">{phaseLog.phase}: <span className="font-bold text-red-400">{isNaN(enemyPhaseStats.attack) ? '0.00' : formatNumber(enemyPhaseStats.attack)}</span></div>
                    <div>Defense: <span className="font-bold text-red-400">{isNaN(enemyPhaseStats.defense) ? '0.00' : formatNumber(enemyPhaseStats.defense)}</span></div>
                  </div>
                  {enemyPhaseStats.modifiers.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-xs text-yellow-300">Modifiers:</div>
                      {enemyPhaseStats.modifiers.map((mod: string, i: number) => (
                        <div key={i} className="text-xs text-gray-300">• {mod}</div>
                      ))}
                    </div>
                  )}
                  {enemyPhaseStats.buildingEffects.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                      <div className="text-xs text-green-300">Building Effects:</div>
                      {enemyPhaseStats.buildingEffects.map((effect: string, i: number) => (
                        <div key={i} className="text-xs text-gray-300">• {effect}</div>
                      ))}
                    </div>
                  )}
                  {/* Castle scaling note */}
                  {battleLog[0]?.enemyArmy && (() => {
                    const originalTotal = (Object.values(originalEnemyArmy).map(Number) as number[]).reduce((sum, count) => sum + count, 0);
                    const scaledTotal = (Object.values(battleLog[0].enemyArmy).map(Number) as number[]).reduce((sum, count) => sum + count, 0);
                    if (originalTotal > 0 && scaledTotal < originalTotal) {
                      const efficiency = Math.round((scaledTotal / originalTotal) * 100);
                      return (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <div className="text-xs text-orange-300 font-bold">Castle Scaling Active:</div>
                          <div className="text-xs text-gray-300">• {efficiency}% of army defending (castle-based scaling applied)</div>
                          <div className="text-xs text-gray-300">• Enemy army reduced from {originalTotal} to {scaledTotal} units</div>
                          <div className="text-xs text-gray-300">• Unit counts shown are AFTER castle scaling</div>
                          <div className="text-xs text-yellow-300 font-bold">• Original: {Object.entries(originalEnemyArmy).map(([unit, count]) => `${count} ${unit}`).join(', ')}</div>
                          <div className="text-xs text-red-300 font-bold">• Scaled: {Object.entries(battleLog[0].enemyArmy).map(([unit, count]) => `${count} ${unit}`).join(', ')}</div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {/* Global damage reduction note */}
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <div className="text-xs text-blue-300 font-bold">• Global: All battle damage is reduced by 0.65× for game balance.</div>
                  </div>
                </div>
                
                {/* Condensed Unit Summary */}
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-300 font-medium mb-2">Unit Summary:</div>
                  <div className="space-y-1 text-xs">
                    {Object.entries(phaseLog.enemyArmyAtStart || entry.enemyArmy || {})
                      .filter(([_, v]) => (v as number) > 0)
                      .map(([unit, count]) => {
                        const stats = getEffectiveUnitStats(unit, enemyProps.race, enemyProps.techLevels, enemyProps.strategy, true, 1);
                        let attackValue = 0;
                        if (phaseLog.phase === 'range') attackValue = stats.range;
                        else if (phaseLog.phase === 'short') attackValue = stats.short;
                        else if (phaseLog.phase === 'melee') attackValue = stats.melee;
                        const totalDamage = (count as number) * attackValue;
                        const lost = phaseLog.enemyLosses[unit] || 0;
                        const survived = (count as number) - lost;
                        return (
                          <div key={unit} className="flex justify-between items-center bg-gray-750 p-1 rounded">
                            <div className="flex-1">
                              <div className="text-gray-200 font-medium">{unit}</div>
                              <div className="text-gray-400 text-xs">{count as number} → {survived} ({lost > 0 ? `-${lost}` : '0'})</div>
                            </div>
                            <div className="text-right">
                              <div className="text-red-400 font-bold">{isNaN(attackValue) ? '0.00' : formatNumber(attackValue)}</div>
                              <div className="text-gray-400 text-xs">{isNaN(totalDamage) ? '0' : formatNumber(totalDamage, 0)}</div>
                            </div>
                          </div>
                        );
                      }).filter((x): x is React.JSX.Element => x !== null)}
                  </div>
                </div>
                {/* Attackers */}
                <div className="bg-gray-700 p-3 rounded">
                  <div className="text-gray-300 font-medium mb-2">{phaseLog.phase} Attackers:</div>
                  <div className="space-y-1 text-xs">
                    {Object.entries(phaseLog.enemyArmyAtStart || entry.enemyArmy || {})
                      .filter(([unit, count]) => {
                        const stats = getEffectiveUnitStats(unit, enemyProps.race, enemyProps.techLevels, enemyProps.strategy, true, 1);
                        if (phaseLog.phase === 'range') return stats.range > 0 && (count as number) > 0;
                        if (phaseLog.phase === 'short') return stats.short > 0 && (count as number) > 0;
                        if (phaseLog.phase === 'melee') return stats.melee > 0 && (count as number) > 0;
                        return false;
                      })
                      .map(([unit, count]) => {
                        const stats = getEffectiveUnitStats(unit, enemyProps.race, enemyProps.techLevels, enemyProps.strategy, true, 1);
                        let attackValue = 0;
                        if (phaseLog.phase === 'range') attackValue = stats.range;
                        else if (phaseLog.phase === 'short') attackValue = stats.short;
                        else if (phaseLog.phase === 'melee') attackValue = stats.melee;
                        return (
                          <div key={unit} className="flex justify-between items-center">
                            <span className="text-gray-300">{unit}</span>
                            <span className="font-bold text-red-400">{count as number} × {isNaN(attackValue) ? '0.00' : formatNumber(attackValue)} = {isNaN((count as number) * attackValue) ? '0.00' : formatNumber((count as number) * attackValue)}</span>
                          </div>
                        );
                      }).filter((x): x is React.JSX.Element => x !== null)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detailed Army Status - Skip for End phase */}
          {phaseLog.phase !== 'end' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Your Army Details */}
              <div className="bg-gray-800 p-4 rounded">
                <div className="font-medium text-blue-300 mb-3 border-b border-gray-600 pb-2 text-lg">Your Army Details</div>
                <div className="space-y-3 text-sm">
                  {Object.entries(phaseLog.yourArmyAtStart || entry.yourArmy || {})
                    .filter(([_, v]) => (v as number) > 0)
                    .map(([unit, count]) => {
                      const stats = getEffectiveUnitStats(unit, yourProps.race, yourProps.techLevels, yourProps.strategy, true, 1);
                      const baseStats = UNIT_DATA[yourProps.race.toLowerCase()]?.[unit];
                      const lost = phaseLog.yourLosses[unit] || 0;
                      const survived = (count as number) - lost;
                      const damageEntry = (phaseLog.yourDamageLog || []).find((d: any) => d.unitName === unit);
                      
                      return (
                        <UnitDetail
                          key={unit}
                          unitName={unit}
                          count={count as number}
                          survived={survived}
                          lost={lost}
                          stats={stats}
                          baseStats={baseStats}
                          damageEntry={damageEntry}
                          side={"your"}
                          phase={phaseLog.phase}
                        />
                      );
                    }).filter((x): x is React.JSX.Element => x !== null)}
                </div>
              </div>

              {/* Enemy Army Details */}
              <div className="bg-gray-800 p-4 rounded">
                <div className="font-medium text-red-300 mb-3 border-b border-gray-600 pb-2 text-lg">
                  Enemy Army Details
                  {battleLog[0]?.enemyArmy && (() => {
                    const originalTotal = (Object.values(originalEnemyArmy).map(Number) as number[]).reduce((sum, count) => sum + count, 0);
                    const scaledTotal = (Object.values(battleLog[0].enemyArmy).map(Number) as number[]).reduce((sum, count) => sum + count, 0);
                    if (originalTotal > 0 && scaledTotal < originalTotal) {
                      const efficiency = Math.round((scaledTotal / originalTotal) * 100);
                      return <span className="text-xs text-orange-300 ml-2">({efficiency}% castle scaling)</span>;
                    }
                    return null;
                  })()}
                </div>
                <div className="space-y-3 text-sm">
                  {Object.entries(phaseLog.enemyArmyAtStart || entry.enemyArmy || {})
                    .filter(([_, v]) => (v as number) > 0)
                    .map(([unit, count]) => {
                      const stats = getEffectiveUnitStats(unit, enemyProps.race, enemyProps.techLevels, enemyProps.strategy, true, 1);
                      const baseStats = UNIT_DATA[enemyProps.race.toLowerCase()]?.[unit];
                      const lost = phaseLog.enemyLosses[unit] || 0;
                      // Use the count at the start of the phase for all calculations
                      const phaseStartCount = (phaseLog.enemyArmyAtStart && phaseLog.enemyArmyAtStart[unit] !== undefined)
                        ? phaseLog.enemyArmyAtStart[unit]
                        : (count as number);
                      const survived = phaseStartCount - lost;
                      const damageEntry = (phaseLog.enemyDamageLog || []).find((d: any) => d.unitName === unit);
                      return (
                        <UnitDetail
                          key={unit}
                          unitName={unit}
                          count={phaseStartCount}
                          survived={survived}
                          lost={lost}
                          stats={stats}
                          baseStats={baseStats}
                          damageEntry={damageEntry}
                          side={"enemy"}
                          phase={phaseLog.phase}
                        />
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// BattleRound: renders a single round
const BattleRound = ({
  entry,
  idx,
  yourProps,
  enemyProps,
  originalYourArmy,
  originalEnemyArmy,
  battleLog,
  winner,
  battleOutcome,
}: any) => (
  <div key={idx} className="mb-4 p-3 border-b border-gray-700 last:border-b-0 bg-gray-750">
    <div className="font-bold mb-3 text-lg text-center bg-gray-600 p-2 rounded">Round {entry.round}</div>
    {(entry.roundResult.phaseLogs || []).map((phaseLog: any, pIdxNum: number) => (
      <BattlePhase
        key={pIdxNum}
        phaseLog={phaseLog}
        entry={entry}
        yourProps={yourProps}
        enemyProps={enemyProps}
        originalYourArmy={originalYourArmy}
        originalEnemyArmy={originalEnemyArmy}
        battleLog={battleLog}
        phase={phaseLog.phase}
        winner={winner}
        battleOutcome={battleOutcome}
      />
    ))}
  </div>
);

interface BattleReportProps {
  battleOutcome: BattleOutcome | null;
  yourTechLevels: TechLevels;
  yourStrategy: StrategyName | null;
  enemyTechLevels: TechLevels;
  enemyStrategy: StrategyName | null;
  yourRace: string;
  enemyRace: string;
  originalYourArmy: Army;
  originalEnemyArmy: Army;
  yourBuildings?: Buildings;
  enemyBuildings?: Buildings;
  yourKingdomStats?: KingdomStats;
  enemyKingdomStats?: KingdomStats;
}

const BattleReport: React.FC<BattleReportProps> = ({
  battleOutcome,
  yourTechLevels,
  yourStrategy,
  enemyTechLevels,
  enemyStrategy,
  yourRace,
  enemyRace,
  originalYourArmy,
  originalEnemyArmy,
  yourBuildings = {},
  enemyBuildings = {},
  yourKingdomStats = {},
  enemyKingdomStats = {},
}) => {
  if (!battleOutcome || !battleOutcome.battleLog) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg mb-4 text-center text-gray-400">
        Run a simulation to see the battle log and outcome here.
      </div>
    );
  }
  const { winner, rounds, finalYourArmy, finalEnemyArmy, battleLog } = battleOutcome;

  // Calculate land and building losses dynamically
  const calculateLandAndBuildingLosses = () => {
    if (winner !== 'yourArmy') {
      return {
        landLost: 0,
        castlesLost: 0,
        peasantsLost: 0,
        buildingsLost: {},
      };
    }

    // Determine loss percentage based on how close the battle was
    const yourInitialStrength = Object.values(originalYourArmy).reduce((sum: number, count: any) => sum + count, 0);
    const enemyInitialStrength = Object.values(originalEnemyArmy).reduce((sum: number, count: any) => sum + count, 0);
    const yourFinalStrength = Object.values(finalYourArmy).reduce((sum: number, count: any) => sum + count, 0);
    const enemyFinalStrength = Object.values(finalEnemyArmy).reduce((sum: number, count: any) => sum + count, 0);

    const yourLossRatio = yourFinalStrength / yourInitialStrength;
    const enemyLossRatio = enemyFinalStrength / enemyInitialStrength;

    let lossPercentage = 0;
    if (enemyLossRatio <= 0.1) { // Crushing victory
      lossPercentage = 0.30;
    } else if (enemyLossRatio <= 0.5) { // Solid victory
      lossPercentage = 0.20;
    } else { // Close victory
      lossPercentage = 0.10;
    }

    // Apply loss percentage to defender's assets
    const landLost = Math.floor(((enemyKingdomStats as KingdomStats)?.Land || 0) * lossPercentage);
    const castlesLost = Math.floor(((enemyKingdomStats as KingdomStats)?.Castles || 0) * lossPercentage);
    const peasantsLost = Math.floor(((enemyKingdomStats as KingdomStats)?.Peasants || 0) * lossPercentage);

    const buildingsLost: Record<string, number> = {};
    for (const [building, count] of Object.entries((enemyBuildings as Buildings) || {})) {
      if (building !== 'Land' && building !== 'Castle' && building !== 'Peasants') {
        buildingsLost[building] = Math.floor((count as number) * lossPercentage);
      }
    }

    return { landLost, castlesLost, peasantsLost, buildingsLost };
  };

  const { landLost, castlesLost, peasantsLost, buildingsLost } = calculateLandAndBuildingLosses();
  // Calculate total and phase-by-phase damage for both sides
  const totalDamage = { your: 0, enemy: 0 };
  const phaseDamage = { your: { range: 0, short: 0, melee: 0 }, enemy: { range: 0, short: 0, melee: 0 } };
  Object.entries(battleLog).forEach(([entryIdx, entry]: [string, any]) => {
    Object.entries(entry.roundResult.phaseLogs).forEach(([pIdx, phaseLog]: [string, any]) => {
      if (['range', 'short', 'melee'].includes(phaseLog.phase)) {
        // Calculate your side
        const yourStats = calculatePhaseStats(
          entry.yourArmy,
          yourRace,
          yourTechLevels,
          yourStrategy,
          true,
          phaseLog.phase,
          yourBuildings
        );
        phaseDamage.your[phaseLog.phase as 'range' | 'short' | 'melee'] += yourStats.attack;
        totalDamage.your += yourStats.attack;
        // Calculate enemy side
        const enemyStats = calculatePhaseStats(
          entry.enemyArmy,
          enemyRace,
          enemyTechLevels,
          enemyStrategy,
          true,
          phaseLog.phase,
          enemyBuildings
        );
        phaseDamage.enemy[phaseLog.phase as 'range' | 'short' | 'melee'] += enemyStats.attack;
        totalDamage.enemy += enemyStats.attack;
      }
    });
  });
  const damageAdvantage = totalDamage.your - totalDamage.enemy;
  // Calculate casualties for both sides (comparing initial to final army)
  const calculateCasualties = (initialArmy: any, finalArmy: any) => {
    const casualties: Record<string, number> = {};
    for (const [unit, initialCount] of Object.entries(initialArmy || {})) {
      const finalCount = finalArmy[unit] || 0;
      const lost = (initialCount as number) - finalCount;
      if (lost > 0) {
        casualties[unit] = lost;
      }
    }
    return casualties;
  };
  // Use the final, post-healing army state for the summary.
  const yourFinalCasualties = calculateCasualties(originalYourArmy, finalYourArmy);
  const enemyFinalCasualties = calculateCasualties(originalEnemyArmy, finalEnemyArmy);
  // Simulate land gain/loss based on battle outcome (attacker perspective)
  const calculateLandGainLoss = () => {
    if (winner === 'yourArmy') {
      const defenderLand = 20; // Should come from enemy kingdom stats
      const landGained = Math.floor(defenderLand * (0.05 + Math.random() * 0.1));
      const castlesGained = Math.random() < 0.2 ? 1 : 0;
      return { land: landGained, castles: castlesGained, peasants: Math.floor(Math.random() * 2000) + 1000 };
    } else {
      return { land: 0, castles: 0, peasants: Math.floor(Math.random() * 1000) + 500 };
    }
  };
  const landResults = calculateLandGainLoss();
  // Simulate building gains from conquered territory (only happens to attacker)
  const simulateBuildingGains = () => {
    if (winner !== 'yourArmy') return {};
    const landGained = landResults.land;
    if (landGained <= 0) return {};
    const buildingRatios = {
      'House': 2.0, 'Farm': 0.5, 'Forge': 0.5, 'Guard House': 0.5, 'Guard Tower': 0.5, 'Market': 0.5,
      'Medical Center': 0.0, 'Mill': 0.5, 'Mine': 0.5, 'School': 0.5, 'Training Center': 0.25, 'Advanced Training Center': 0.25
    };
    const gained: Record<string, number> = {};
    Object.entries(buildingRatios).forEach(([building, ratio]) => {
      const baseCount = Math.floor(landGained * ratio);
      const variation = Math.random() * 0.4 - 0.2;
      const finalCount = Math.max(0, Math.floor(baseCount * (1 + variation)));
      if (finalCount > 0) gained[building] = finalCount;
    });
    return gained;
  };
  const buildingGains = simulateBuildingGains();
  // Format casualties for display
  const formatCasualties = (casualties: Record<string, number>) => {
    return Object.entries(casualties)
      .map(([unit, count]) => `${count} ${unit}`)
      .join(', ');
  };
  // Aggregate total losses for both sides across all rounds/phases
  const aggregateLosses = (key: 'yourLosses' | 'enemyLosses') => {
    const total: Record<string, number> = {};
    Object.entries(battleLog).forEach(([entryIdx, entry]: [string, any]) => {
      Object.entries(entry.roundResult.phaseLogs).forEach(([pIdx, phaseLog]: [string, any]) => {
        Object.entries(phaseLog[key] || {}).forEach(([unit, lost]) => {
          total[unit] = (total[unit] || 0) + (lost as number);
        });
      });
    });
    return total;
  };
  const yourTotalLosses = aggregateLosses('yourLosses');
  const enemyTotalLosses = aggregateLosses('enemyLosses');

  return (
    <div className="p-6 bg-gray-800 rounded-lg mb-6">
      <h3 className="text-2xl font-semibold mb-6 text-center">Battle Report</h3>
      {/* Battle Outcome Header */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        {winner === 'yourArmy' ? (
          <div className="text-green-400 font-bold text-center">
            My Lord, our troops fought bravely making the great difference in battle between you and our enemies!
          </div>
        ) : (
          <div className="text-red-400 font-bold text-center">
            My Lord, my Lord, we were invaded! Enemies are upon us. They took everything what they could, our troops were unable to defend our kingdom.
          </div>
        )}
      </div>
      {/* Land Results */}
      {landLost > 0 && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="text-green-400">
            <div className="font-bold">We won {castlesLost} Castle(s) surrounded by {landLost} lands.</div>
            <div className="text-sm mt-1">In this lands also lived {peasantsLost.toLocaleString()} people who are grateful to join our Kingdom.</div>
          </div>
        </div>
      )}
      {/* Building Gains */}
      {Object.keys(buildingsLost).length > 0 && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="text-green-400 font-bold">In this lands are also constructed :</div>
          <div className="text-sm mt-1">
            {[
              'Advanced Training Center', 'Training Center', 'Farm', 'House', 'Forge', 
              'Guard House', 'Guard Tower', 'Market', 'Medical Center', 'Mill', 'Mine', 'School'
            ].map(building => {
              const count = buildingsLost[building] || 0;
              return `${count} ${building}`;
            }).join(' , ')}
          </div>
        </div>
      )}
      {/* Casualties */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-red-400 font-bold">But we lost:</div>
            <div className="text-sm mt-1">
              {Object.keys(yourFinalCasualties).length > 0
                ? Object.entries(yourFinalCasualties)
                    .map(([unit, loss]) => `${loss} ${unit}`)
                    .join(', ')
                : 'No units lost'}
            </div>
          </div>
          <div>
            <div className="text-green-400 font-bold">We managed to kill:</div>
            <div className="text-sm mt-1">
              {Object.keys(enemyFinalCasualties).length > 0
                ? Object.entries(enemyFinalCasualties)
                    .map(([unit, loss]) => `${loss} ${unit}`)
                    .join(', ')
                : 'No enemy units killed'}
            </div>
          </div>
        </div>
      </div>
      {/* Battle Statistics */}
      <div className="mb-4 p-3 bg-gray-700 rounded">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-bold">Winner:</span>{' '}
            <span className={winner === 'yourArmy' ? 'text-green-400' : 'text-red-400'}>
              {winner === 'yourArmy' ? 'Your Army' : 'Enemy Army'}
            </span>
          </div>
          <div>
            <span className="font-bold">Rounds:</span> {rounds}
          </div>
        </div>
      </div>
      {/* Round-by-Round Details */}
      <div>
        <h4 className="font-semibold mb-2">Detailed Battle Log</h4>
        <div className="max-h-[800px] overflow-y-auto border border-gray-700 rounded">
          {Object.entries(battleOutcome.battleLog).map(([idx, entry]: [string, any], entryIdx: number) => (
            <BattleRound
              key={entryIdx}
              entry={entry}
              idx={entryIdx}
              yourProps={{ race: yourRace, techLevels: yourTechLevels, strategy: yourStrategy, originalArmy: originalYourArmy, buildings: yourBuildings }}
              enemyProps={{ race: enemyRace, techLevels: enemyTechLevels, strategy: enemyStrategy, originalArmy: originalEnemyArmy, buildings: enemyBuildings }}
              originalYourArmy={originalYourArmy}
              originalEnemyArmy={originalEnemyArmy}
              battleLog={battleOutcome.battleLog}
              winner={winner}
              battleOutcome={battleOutcome}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BattleReport; 