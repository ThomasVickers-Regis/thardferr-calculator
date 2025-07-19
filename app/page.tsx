"use client";
import React, { useState, useEffect } from 'react';
import { simulateBattle, BattleOutcome, KingdomStats } from '../utils/simulateBattle';
import { Army } from '../utils/calculatePhaseDamage';
import { TechLevels, StrategyName } from '../utils/getEffectiveUnitStats';
import '../app/globals.css';
import { UNIT_DATA } from '../data/unitData';
import { TECHNOLOGY_DATA } from '../data/technologyData';
import { STRATEGY_DATA } from '../data/strategyData';
import { getArmyTotalInitialGoldCost, getArmyTEGC } from '../utils/economicHelpers';
import { getEffectiveUnitStats } from '../utils/getEffectiveUnitStats';
import { getUnitEfficiencyRatios } from '../utils/economicHelpers';
import { BUILDING_DATA } from '../data/buildingData';

// List of available races
const RACES = ["Dwarf", "Elf", "Gnome", "Human", "Orc", "Undead"];

// Helper: map race to units (based on unit names)
const getUnitsForRace = (race: string) => {
  const lower = race.toLowerCase();
  return Object.entries(UNIT_DATA)
    .filter(([unit]) => unit.toLowerCase().startsWith(lower))
    .map(([unit]) => unit);
};

// ArmyInput component: allows user to set quantities for all unit types
const ArmyInput = ({ armyName, army, setArmy, units }: { armyName: string; army: Army; setArmy: (a: Army) => void; units: string[] }) => {
  // Handler for changing unit count
  const handleChange = (unit: string, value: string) => {
    const count = Math.max(0, parseInt(value) || 0);
    setArmy({ ...army, [unit]: count });
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">{armyName} Composition</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left">Unit</th>
              <th className="p-2 text-left">Melee</th>
              <th className="p-2 text-left">Short</th>
              <th className="p-2 text-left">Range</th>
              <th className="p-2 text-left">Defense</th>
              <th className="p-2 text-left">Count</th>
            </tr>
          </thead>
          <tbody>
            {units.map(unit => {
              const stats = UNIT_DATA[unit];
              return (
                <tr key={unit} className="even:bg-gray-700">
                  <td className="p-2 font-medium" title={unit}>{unit}</td>
                  <td className="p-2">{stats.melee}</td>
                  <td className="p-2">{stats.short}</td>
                  <td className="p-2">{stats.range}</td>
                  <td className="p-2">{stats.defense}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      className="w-20 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={army[unit] || ''}
                      onChange={e => handleChange(unit, e.target.value)}
                      title={`Set number of ${unit}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">Set a unit's count to 0 to remove it from your army.</p>
    </div>
  );
};
// Utility: Calculate KS (Kingdom Strength) based on army and buildings
function calculateKS(army: Army, buildings: any) {
  // Simple: sum of all unit attack + defense
  let ks = 0;
  for (const [unit, count] of Object.entries(army)) {
    if (count > 0 && UNIT_DATA[unit]) {
      const stats = UNIT_DATA[unit];
      ks += (stats.melee + stats.short + stats.range + stats.defense) * count;
    }
  }
  // Add building bonuses (example values, adjust as needed)
  if (buildings) {
    ks += (buildings['Castle'] || 0) * 50;
    ks += (buildings['House'] || 0) * 2;
    ks += (buildings['Training Center'] || 0) * 10;
    ks += (buildings['Advanced Training Center'] || 0) * 20;
    ks += (buildings['Guard House'] || 0) * 5;
    ks += (buildings['Medical Center'] || 0) * 5;
    // Add more building effects as needed
  }
  return Math.round(ks);
}
// KingdomStatsInput component: allows user to set kingdom stats, tech levels, and strategy
const KingdomStatsInput = ({ kingdomName, stats, setStats, techLevels, setTechLevels, strategy, setStrategy }: any) => {
  // Handler for stat changes
  const handleStatChange = (field: string, value: string) => {
    setStats({ ...stats, [field]: parseInt(value) || 0 });
  };
  // Handler for tech level changes
  const handleTechChange = (tech: string, value: string) => {
    setTechLevels({ ...techLevels, [tech]: parseInt(value) || 0 });
  };
  // Handler for strategy change
  const handleStrategyChange = (value: string) => {
    setStrategy(value || null);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">{kingdomName} Stats</h3>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="land">Land</label>
          <input
            id="land"
            type="number"
            min={0}
            className="w-full p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={stats.Land || ''}
            onChange={e => handleStatChange('Land', e.target.value)}
            title="Total land owned by this kingdom"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="castles">Castles</label>
          <input
            id="castles"
            type="number"
            min={0}
            className="w-full p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={stats.Castles || ''}
            onChange={e => handleStatChange('Castles', e.target.value)}
            title="Number of castles"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="population">Population</label>
          <input
            id="population"
            type="number"
            min={0}
            className="w-full p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={stats.Population || ''}
            onChange={e => handleStatChange('Population', e.target.value)}
            title="Total population"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="ks">Kingdom Strength (KS)</label>
          <input
            id="ks"
            type="number"
            min={0}
            className="w-full p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={stats.KS || ''}
            readOnly
            title="Kingdom Strength (KS) is auto-calculated from army and buildings"
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Technologies</label>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(TECHNOLOGY_DATA).map(([tech, data]) => (
            <div key={tech} className="flex items-center gap-2">
              <span className="w-40" title={data.description}>{tech}</span>
              <select
                className="p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={techLevels[tech] || 0}
                onChange={e => handleTechChange(tech, e.target.value)}
                title={`Set level for ${tech}`}
              >
                <option value={0}>0</option>
                {Object.keys(data.levels).map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Strategy</label>
        <select
          className="w-full p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={strategy || ''}
          onChange={e => handleStrategyChange(e.target.value)}
          title="Select a strategy"
        >
          <option value="">None</option>
          {Object.entries(STRATEGY_DATA).map(([strat, data]) => (
            <option key={strat} value={strat}>{strat}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
const BattleSimulationDisplay = ({ battleOutcome }: { battleOutcome: BattleOutcome | null }) => {
  if (!battleOutcome) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg mb-4 text-center text-gray-400">
        Run a simulation to see the battle log and outcome here.
      </div>
    );
  }

  const { winner, rounds, finalYourArmy, finalEnemyArmy, battleLog } = battleOutcome;

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Battle Simulation Results</h3>
      <div className="mb-2">
        <span className="font-bold">Winner:</span>{' '}
        <span className={winner === 'yourArmy' ? 'text-green-400' : winner === 'enemyArmy' ? 'text-red-400' : 'text-yellow-400'}>
          {winner === 'yourArmy' ? 'Your Army' : winner === 'enemyArmy' ? 'Enemy Army' : 'Draw'}
        </span>
        <span className="ml-4 font-bold">Rounds:</span> {rounds}
      </div>
      <div className="mb-4">
        <h4 className="font-semibold mb-1">Final Armies</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Your Army:</span>
            <ul className="ml-2 text-xs">
              {Object.entries(finalYourArmy).filter(([_, v]) => v > 0).length === 0 ? (
                <li className="text-gray-500">None remaining</li>
              ) : (
                Object.entries(finalYourArmy).filter(([_, v]) => v > 0).map(([unit, count]) => (
                  <li key={unit}>{unit}: {count}</li>
                ))
              )}
            </ul>
          </div>
          <div>
            <span className="font-medium">Enemy Army:</span>
            <ul className="ml-2 text-xs">
              {Object.entries(finalEnemyArmy).filter(([_, v]) => v > 0).length === 0 ? (
                <li className="text-gray-500">None remaining</li>
              ) : (
                Object.entries(finalEnemyArmy).filter(([_, v]) => v > 0).map(([unit, count]) => (
                  <li key={unit}>{unit}: {count}</li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
      <div>
        <h4 className="font-semibold mb-2">Battle Log</h4>
        <div className="max-h-64 overflow-y-auto border border-gray-700 rounded">
          {battleLog.map((entry, idx) => (
            <div key={idx} className="mb-4 p-2 border-b border-gray-700 last:border-b-0">
              <div className="font-bold mb-1">Round {entry.round}</div>
              {entry.roundResult.phaseLogs.map((phaseLog, pIdx) => (
                <div key={pIdx} className="mb-2">
                  <div className="font-semibold text-purple-300 capitalize">{phaseLog.phase} Phase</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Your Losses:</span>
                      <ul className="ml-2">
                        {Object.entries(phaseLog.yourLosses).length === 0 ? (
                          <li className="text-gray-500">None</li>
                        ) : (
                          Object.entries(phaseLog.yourLosses).map(([unit, lost]) => (
                            <li key={unit}>{unit}: {lost}</li>
                          ))
                        )}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium">Enemy Losses:</span>
                      <ul className="ml-2">
                        {Object.entries(phaseLog.enemyLosses).length === 0 ? (
                          <li className="text-gray-500">None</li>
                        ) : (
                          Object.entries(phaseLog.enemyLosses).map(([unit, lost]) => (
                            <li key={unit}>{unit}: {lost}</li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
// EconomicSummary component: shows total cost, upkeep, and TEGC for an army
const EconomicSummary = ({ army, kingdomStats }: { army: Army; kingdomStats: KingdomStats }) => {
  // Calculate total initial gold cost and TEGC
  const totalInitialGold = getArmyTotalInitialGoldCost(army);
  const totalTEGC = getArmyTEGC(army);
  // Calculate total upkeep for 48 hours
  let totalGoldUpkeep = 0;
  let totalFoodUpkeep = 0;
  for (const [unit, count] of Object.entries(army)) {
    if (count > 0) {
      const unitData = UNIT_DATA[unit];
      if (unitData) {
        totalGoldUpkeep += (unitData.upkeep.gold * 2) * count;
        totalFoodUpkeep += (unitData.upkeep.food * 2) * count;
      }
    }
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Economic Summary</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium" title="Sum of all unit base and equipment costs">Total Initial Gold Cost:</span>
          <span className="ml-2">{totalInitialGold.toLocaleString()} gold</span>
        </div>
        <div>
          <span className="font-medium" title="Total Effective Gold Cost for 48 hours (includes upkeep)">TEGC (48h):</span>
          <span className="ml-2">{totalTEGC.toLocaleString()} gold</span>
        </div>
        <div>
          <span className="font-medium" title="Total gold upkeep for 48 hours">Upkeep (Gold, 48h):</span>
          <span className="ml-2">{totalGoldUpkeep.toLocaleString()} gold</span>
        </div>
        <div>
          <span className="font-medium" title="Total food upkeep for 48 hours">Upkeep (Food, 48h):</span>
          <span className="ml-2">{totalFoodUpkeep.toLocaleString()} food</span>
        </div>
      </div>
    </div>
  );
};
// UnitEfficiencyTable component: shows efficiency ratios for all units
const UnitEfficiencyTable = ({ techLevels, strategy }: { techLevels: any; strategy: any }) => {
  // Calculate efficiency for all units
  const unitRows = Object.entries(UNIT_DATA).map(([unit, stats]) => {
    const effectiveStats = getEffectiveUnitStats(unit, techLevels, strategy, true, 1);
    const ratios = getUnitEfficiencyRatios(unit, effectiveStats);
    return {
      unit,
      ...ratios,
      effectiveStats
    };
  });

  // Find top 3 performers for each ratio (lowest is best)
  const getTopIndices = (key: 'goldPerAttack' | 'goldPerDefense' | 'goldPerRanged') => {
    return unitRows
      .filter(row => row[key] !== null && row[key] !== Infinity)
      .sort((a, b) => (a[key] ?? Infinity) - (b[key] ?? Infinity))
      .slice(0, 3)
      .map(row => row.unit);
  };
  const topAttack = getTopIndices('goldPerAttack');
  const topDefense = getTopIndices('goldPerDefense');
  const topRanged = getTopIndices('goldPerRanged');

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Unit Efficiency Table</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left">Unit</th>
              <th className="p-2 text-left" title="TEGC / Effective Melee">Gold/Attack</th>
              <th className="p-2 text-left" title="TEGC / Effective Defense">Gold/Defense</th>
              <th className="p-2 text-left" title="TEGC / Effective Ranged">Gold/Ranged</th>
              <th className="p-2 text-left">Effective Melee</th>
              <th className="p-2 text-left">Effective Short</th>
              <th className="p-2 text-left">Effective Ranged</th>
              <th className="p-2 text-left">Effective Defense</th>
            </tr>
          </thead>
          <tbody>
            {unitRows.map(row => (
              <tr key={row.unit} className="even:bg-gray-700">
                <td className="p-2 font-medium" title={row.unit}>{row.unit}</td>
                <td className={`p-2 ${topAttack.includes(row.unit) ? 'bg-green-900 text-green-300 font-bold' : ''}`}>{row.goldPerAttack !== null ? row.goldPerAttack.toFixed(1) : 'N/A'}</td>
                <td className={`p-2 ${topDefense.includes(row.unit) ? 'bg-blue-900 text-blue-300 font-bold' : ''}`}>{row.goldPerDefense !== null ? row.goldPerDefense.toFixed(1) : 'N/A'}</td>
                <td className={`p-2 ${topRanged.includes(row.unit) ? 'bg-purple-900 text-purple-300 font-bold' : ''}`}>{row.goldPerRanged !== null ? row.goldPerRanged.toFixed(1) : 'N/A'}</td>
                <td className="p-2">{row.effectiveStats.melee.toFixed(2)}</td>
                <td className="p-2">{row.effectiveStats.short.toFixed(2)}</td>
                <td className="p-2">{row.effectiveStats.range.toFixed(2)}</td>
                <td className="p-2">{row.effectiveStats.defense.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">Lower values are better. Top 3 units in each column are highlighted.</p>
    </div>
  );
};

// BuildingTable component: shows and edits building counts for a kingdom
const BuildingTable = ({ buildings, setBuildings, land, castles, race, population }: any) => {
  // List of building keys (order: Castle, House, ATC, TC, then others)
  const buildingOrder = [
    'Castle',
    'House',
    'Advanced Training Center',
    'Training Center',
    ...Object.keys(BUILDING_DATA).filter(
      b => !['Castle', 'House', 'Advanced Training Center', 'Training Center'].includes(b)
    )
  ];

  // State for ratios and manual overrides
  const [ratios, setRatios] = React.useState<any>({});
  const [manualOverride, setManualOverride] = React.useState<any>({});

  // Max buildings allowed (excluding Castle)
  const maxBuildings = (land || 0) * 10;

  // Calculate counts from ratios and land
  const autoCounts: any = {};
  buildingOrder.forEach(b => {
    autoCounts[b] = Math.floor((ratios[b] ?? getDefaultRatio(b)) * (land || 0));
  });

  // Helper: get default ratio for a building
  function getDefaultRatio(b: string) {
    if (b === 'Castle') return 1 / (land || 20);
    if (b === 'House') return 20 / (land || 20);
    if (b === 'Advanced Training Center') return 5 / (land || 20);
    if (b === 'Training Center') return 5 / (land || 20);
    if (b === 'Medical Center' || b === 'Guard House') return 0;
    return 10 / (land || 20);
  }

  // On land/race change, update counts from ratios unless manually overridden
  React.useEffect(() => {
    const newBuildings: any = {};
    // Set all buildings (manual or auto)
    buildingOrder.forEach(b => {
      if (manualOverride[b]) {
        newBuildings[b] = buildings[b] || 0;
      } else {
        newBuildings[b] = autoCounts[b];
      }
    });
    // Only sum non-castle buildings for the cap
    const nonCastleOrder = buildingOrder.filter(b => b !== 'Castle');
    let nonCastleUsed = 0;
    nonCastleOrder.forEach(b => {
      nonCastleUsed += newBuildings[b];
    });
    // If over max, reduce Med Center and Guard House first, then others (but only non-castle buildings)
    if (nonCastleUsed > maxBuildings) {
      let over = nonCastleUsed - maxBuildings;
      const reduceOrder = ['Medical Center', 'Guard House', ...nonCastleOrder.filter(b => !['Medical Center', 'Guard House'].includes(b))];
      for (const b of reduceOrder) {
        const canReduce = Math.min(newBuildings[b], over);
        newBuildings[b] -= canReduce;
        over -= canReduce;
        if (over <= 0) break;
      }
    }
    setBuildings(newBuildings);
    // eslint-disable-next-line
  }, [land, castles, race, ratios]);

  // Handler for changing ratio
  const handleRatioChange = (b: string, value: string) => {
    let ratio = Math.max(0, Math.round((parseFloat(value) || 0) * 100) / 100);
    if (b === 'Castle') {
      // Cap castle ratio to max possible castles per land
      const maxCastles = Math.floor((land || 0) / 7) + 1;
      const maxCastleRatio = land ? maxCastles / land : 0;
      if (ratio > maxCastleRatio) ratio = maxCastleRatio;
      setRatios({ ...ratios, [b]: ratio });
      setBuildings({ ...buildings, [b]: Math.floor(ratio * (land || 0)) });
      setManualOverride({ ...manualOverride, [b]: false });
      return;
    }
    // Exclude Castle from ratio sum
    const otherRatios = (Object.entries(ratios) as [string, number | string][])
      .filter(([key]) => key !== 'Castle' && key !== b)
      .reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : parseFloat(v as string) || 0), 0);
    // Cap so sum (excluding Castle) does not exceed 10
    if (otherRatios + ratio > 10) {
      ratio = Math.max(0, 10 - otherRatios);
    }
    // Calculate the new count for this building
    let newCount = Math.floor(ratio * (land || 0));
    // Calculate what the new total would be
    const otherCounts = Object.entries(buildings)
      .filter(([key]) => key !== 'Castle' && key !== b)
      .reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : 0), 0);
    // Cap so total non-castle buildings does not exceed maxBuildings
    if (otherCounts + newCount > maxBuildings) {
      newCount = Math.max(0, maxBuildings - otherCounts);
      ratio = Math.round((newCount / (land || 1)) * 100) / 100;
    }
    setRatios({ ...ratios, [b]: ratio });
    setBuildings({ ...buildings, [b]: newCount });
    setManualOverride({ ...manualOverride, [b]: false });
  };
  // Handler for changing count (special logic for Castle)
  const handleCountChange = (b: string, value: string) => {
    let count = Math.max(0, parseInt(value) || 0);
    if (b === 'Castle') {
      // Cap castles to castleCap
      if (count > castleCap) count = castleCap;
    } else {
      // Prevent going over max for non-castle buildings
      const otherCounts = Object.entries(buildings)
        .filter(([key]) => key !== 'Castle' && key !== b)
        .reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : 0), 0);
      if (otherCounts + count > maxBuildings) count = Math.max(0, maxBuildings - otherCounts);
    }
    setBuildings({ ...buildings, [b]: count });
    setManualOverride({ ...manualOverride, [b]: true });
    // Update ratio to match
    setRatios({ ...ratios, [b]: Math.round((count / (land || 1)) * 100) / 100 });
  };

  // Calculate max castles
  const maxCastles = Math.floor((land || 0) / 7) + 1;
  const currentCastles = buildings['Castle'] || 0;
  // Calculate total non-castle buildings used
  const nonCastleBuildingsUsed = Object.entries(buildings)
    .filter(([key]) => key !== 'Castle')
    .reduce((sum: number, [_, v]) => sum + (typeof v === 'number' ? v : 0), 0);
  // Calculate max castles allowed by land
  const maxCastlesByLand = Math.floor((land || 0) / 7) + 1;
  const castleCap = Math.min(maxCastlesByLand, maxCastles);
  // Calculate total buildings used (excluding Castle)
  const buildingsUsed = nonCastleBuildingsUsed;
  // Calculate total ratio (excluding Castle)
  const ratioSum = buildingOrder
    .filter(b => b !== 'Castle')
    .reduce((sum, b) => {
      const val = ratios[b] !== undefined ? ratios[b] : getDefaultRatio(b);
      return sum + (typeof val === 'number' ? val : parseFloat(val as string) || 0);
    }, 0);
  const overMax = ratioSum > 10;

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Buildings</h3>
      <p className="text-sm text-purple-300 mb-2">Your builders will work the best they can in order to build {Math.floor((population && population['Building']) ? population['Building'] / 150 : 0)} buildings per day.</p>
      <div className="mb-2 text-sm">
        <span className={overMax ? 'text-red-400 font-bold' : ''}>
          Buildings (excluding Castles): {buildingsUsed} / {maxBuildings} (Ratio total: {ratioSum.toFixed(2)} / 10)
        </span>
        {overMax && <span className="text-red-400 ml-2">Ratio total cannot exceed 10 (excluding Castle).</span>}
        <br />
        <span>Castles: {currentCastles} / {maxCastles} (up to {castleCap} allowed by land)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left">Building</th>
              <th className="p-2 text-left">Ratio</th>
              <th className="p-2 text-left">Count</th>
            </tr>
          </thead>
          <tbody>
            {buildingOrder.map(b => {
              let maxRatio = 10;
              if (b === 'Castle') {
                maxRatio = land ? (Math.floor((land || 0) / 7) + 1) / land : 0;
              } else {
                // For non-castle, cap ratio so that sum of all non-castle ratios <= 10 and count <= available slots
                const otherRatios = (Object.entries(ratios) as [string, number | string][])
                  .filter(([key]) => key !== 'Castle' && key !== b)
                  .reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : parseFloat(v as string) || 0), 0);
                const otherCounts = Object.entries(buildings)
                  .filter(([key]) => key !== 'Castle' && key !== b)
                  .reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : 0), 0);
                const maxByRatio = 10 - otherRatios;
                const maxByCount = land ? (maxBuildings - otherCounts) / land : 0;
                maxRatio = Math.min(maxByRatio, maxByCount);
                if (maxRatio < 0) maxRatio = 0;
              }
              return (
                <tr key={b} className="even:bg-gray-700">
                  <td className="p-2 font-medium" title={b}>{b}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      max={maxRatio}
                      step={0.01}
                      className="w-20 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={ratios[b] !== undefined ? ratios[b] : getDefaultRatio(b)}
                      onChange={e => handleRatioChange(b, e.target.value)}
                      title={`Set ratio for ${b} (buildings per land)`}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      className="w-20 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={buildings && buildings[b] !== undefined ? buildings[b] : ''}
                      onChange={e => handleCountChange(b, e.target.value)}
                      title={`Set number of ${b}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">You cannot exceed 10 buildings per land (excluding Castle). Castles do not count toward the building cap. Max castles: floor(land / 7) + 1. Ratios are buildings per land (e.g., 2.00 = 2 per land).</p>
    </div>
  );
};

// Scaffold for PopulationAssignment component
const JOBS = [
  { key: 'Mine', label: 'Mine' },
  { key: 'Lumber', label: 'Lumber' },
  { key: 'Agriculture', label: 'Agriculture' },
  { key: 'Building', label: 'Building' },
  { key: 'Training', label: 'Training' },
  { key: 'Blacksmithing', label: 'Blacksmithing' },
  { key: 'Exploration', label: 'Exploration' },
];
// Add index signature to JOB_EFFICIENCY
type JobEfficiency = {
  [key: string]: { optimal: number; max: number; building: string };
};
const JOB_EFFICIENCY: JobEfficiency = {
  Mine: { optimal: 100, max: 200, building: 'Mine' },
  Lumber: { optimal: 85, max: 170, building: 'Mill' },
  Agriculture: { optimal: 60, max: 100, building: 'Farm' },
  Blacksmithing: { optimal: 80, max: 160, building: 'Forge' },
};
// Weapon data by race
const WEAPON_DATA_BY_RACE: Record<string, Array<{ name: string; iron: number; wood: number; gold: number }>> = {
  Elf: [
    { name: 'Horse', iron: 1, wood: 0, gold: 300 },
    { name: 'Sword', iron: 4, wood: 1, gold: 25 },
    { name: 'Lance', iron: 1, wood: 3, gold: 20 },
    { name: 'Bow', iron: 0, wood: 4, gold: 40 },
    { name: 'Caragous Armor', iron: 7, wood: 1, gold: 200 },
    { name: 'Light Armor', iron: 4, wood: 0, gold: 100 },
  ],
  Dwarf: [
    { name: 'Poney', iron: 0, wood: 0, gold: 150 },
    { name: 'Axe', iron: 2, wood: 1, gold: 15 },
    { name: 'Hammer', iron: 2, wood: 1, gold: 10 },
    { name: 'Crossbow', iron: 0, wood: 3, gold: 30 },
    { name: 'Plate Armor', iron: 6, wood: 0, gold: 175 },
    { name: 'Chainmail', iron: 3, wood: 0, gold: 125 },
  ],
  Gnome: [
    { name: 'Poney', iron: 1, wood: 0, gold: 250 },
    { name: 'Plank and Nails', iron: 1, wood: 15, gold: 70 },
    { name: 'Spear', iron: 2, wood: 3, gold: 10 },
    { name: 'Sling', iron: 1, wood: 1, gold: 15 },
    { name: 'Chainmail', iron: 6, wood: 0, gold: 175 },
    { name: 'Leather Armor', iron: 2, wood: 1, gold: 125 },
  ],
  Human: [
    { name: 'Horse', iron: 1, wood: 0, gold: 350 },
    { name: 'Sword', iron: 3, wood: 0, gold: 15 },
    { name: 'Spear', iron: 2, wood: 3, gold: 5 },
    { name: 'Bow', iron: 0, wood: 3, gold: 10 },
    { name: 'Plate Armor', iron: 7, wood: 0, gold: 200 },
    { name: 'Light Armor', iron: 3, wood: 0, gold: 125 },
  ],
  Orc: [
    { name: 'Wolf', iron: 0, wood: 0, gold: 50 },
    { name: 'Axe', iron: 2, wood: 1, gold: 20 },
    { name: 'Spear', iron: 1, wood: 3, gold: 10 },
    { name: 'Sling', iron: 1, wood: 1, gold: 5 },
    { name: 'Enforced Leather Armor', iron: 2, wood: 1, gold: 125 },
    { name: 'Leather Armor', iron: 1, wood: 1, gold: 100 },
  ],
};

// ProjectedWeaponsSummary component
const ProjectedWeaponsSummary = ({ race, blacksmithingEfficiency, population, buildings }: { race: string; blacksmithingEfficiency: number; population: any; buildings: any }) => {
  const weapons = WEAPON_DATA_BY_RACE[race] || [];
  const forges = typeof buildings['Forge'] === 'number' ? buildings['Forge'] : parseInt(buildings['Forge'] || '0', 10) || 0;
  const assigned = population['Blacksmithing'] || 0;
  let perForge = forges > 0 ? assigned / forges : 0;
  let outputPerForge = 0;
  if (perForge <= 80) {
    outputPerForge = (perForge / 80) * 1.5;
  } else if (perForge >= 160) {
    outputPerForge = 3;
  } else {
    const t = (perForge - 80) / (160 - 80);
    outputPerForge = (1 - t) * 1.5 + t * 3;
  }
  const totalProduced = forges > 0 ? Math.floor(forges * outputPerForge) : 0;
  const summary = weapons.map(w => `${totalProduced} ${w.name}`).join(', ');
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Armory Production</h3>
      <span>
        If your blacksmiths go to work right away, they will be able to build: {summary} per day.
      </span>
    </div>
  );
};

// Update PopulationAssignment for Training, Building, Blacksmithing
const PopulationAssignment = ({ population, setPopulation, buildings, totalPop }: any) => {
  // Calculate optimal/max per job
  const getJobMax = (job: string) => {
    if (job === 'Training' || job === 'Exploration') return totalPop;
    if (job === 'Building') return (buildings['Building'] || 0) * 150;
    if (job === 'Blacksmithing') return (buildings['Forge'] || 0) * 160;
    if (job === 'Agriculture') return (buildings['Farm'] || 0) * 120;
    const eff = JOB_EFFICIENCY[job];
    if (!eff) return 0;
    return (buildings[eff.building] || 0) * eff.max;
  };
  const getJobOptimal = (job: string) => {
    if (job === 'Training' || job === 'Exploration') return 0;
    if (job === 'Building') return (buildings['Building'] || 0) * 150;
    if (job === 'Blacksmithing') return (buildings['Forge'] || 0) * 80;
    if (job === 'Agriculture') return (buildings['Farm'] || 0) * 60;
    const eff = JOB_EFFICIENCY[job];
    if (!eff) return 0;
    return (buildings[eff.building] || 0) * eff.optimal;
  };
  // Number of buildings for each job
  const getBuildings = (job: string) => {
    if (job === 'Training') return 1;
    if (job === 'Building') return buildings['Building'] || 0;
    if (job === 'Blacksmithing') return buildings['Forge'] || 0;
    const eff = JOB_EFFICIENCY[job];
    if (!eff) return 0;
    return buildings[eff.building] || 0;
  };
  // Efficiency per job (whole number)
  const getEfficiency = (job: string) => {
    const b = getBuildings(job);
    if (job === 'Training' || job === 'Exploration') return population[job] || 0;
    if (!b) return 0;
    if (job === 'Building') return Math.floor((population['Building'] || 0) / 150);
    if (job === 'Blacksmithing') return Math.floor((population[job] || 0) / b);
    return Math.floor((population[job] || 0) / b);
  };
  // Handler for assignment change
  const handleAssignmentChange = (job: string, value: string) => {
    let val = Math.max(0, parseInt(value) || 0);
    // Prevent over-assignment
    const newTotal = totalAssigned - (population[job] || 0) + val;
    if (newTotal > totalPop) val -= (newTotal - totalPop);
    // Prevent over max for job
    if (getJobMax(job) && val > getJobMax(job)) val = getJobMax(job);
    setPopulation({ ...population, [job]: val });
  };
  // Handler for efficiency change (for Building, update assigned population immediately and always clamp)
  const handleEfficiencyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '') val = '0';
    const maxEff = Math.floor(totalPop / 150);
    let eff = Math.max(0, Math.floor(Number(val) || 0));
    if (eff > maxEff) eff = maxEff;
    // Calculate the population needed for this efficiency
    let assigned = eff * 150;
    // Calculate available population for Building
    const otherAssigned = totalAssigned - (population['Building'] || 0);
    if (otherAssigned + assigned > totalPop) {
      // Not enough population for this efficiency, clamp to max possible
      eff = Math.floor((totalPop - otherAssigned) / 150);
      assigned = eff * 150;
    }
    setPopulation({ ...population, Building: assigned });
  };
  // Handler for efficiency change for other jobs
  const handleEfficiencyChange = (job: string, value: string) => {
    if (job === 'Building') return; // handled separately
    let eff = Math.max(0, parseInt(value) || 0);
    let val = 0;
    if (job === 'Training' || job === 'Exploration') val = eff;
    else if (job === 'Blacksmithing') {
      const b = getBuildings(job);
      val = b * eff;
    } else {
      const b = getBuildings(job);
      val = b * eff;
    }
    // Prevent over-assignment
    const newTotal = totalAssigned - (population[job] || 0) + val;
    if (newTotal > totalPop) val -= (newTotal - totalPop);
    // Prevent over max for job
    if (getJobMax(job) && val > getJobMax(job)) val = getJobMax(job);
    setPopulation({ ...population, [job]: val });
  };
  // Total assigned
  const totalAssigned = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Population Assignment</h3>
      <div className="mb-2 text-sm">
        <span>Total Assigned: {totalAssigned} / {totalPop}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left">Job</th>
              <th className="p-2 text-left">Optimal</th>
              <th className="p-2 text-left">Max</th>
              <th className="p-2 text-left">Assigned</th>
              <th className="p-2 text-left">Efficiency (per building)</th>
            </tr>
          </thead>
          <tbody>
            {JOBS.map(job => (
              <tr key={job.key} className="even:bg-gray-700">
                <td className="p-2 font-medium">{job.label}</td>
                <td className="p-2">{getJobOptimal(job.key)}</td>
                <td className="p-2">{getJobMax(job.key)}</td>
                <td className="p-2">
                  <input
                    type="number"
                    min={0}
                    className="w-20 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={population[job.key] !== undefined ? population[job.key] : 0}
                    onChange={e => handleAssignmentChange(job.key, e.target.value)}
                    title={`Assign population to ${job.label}`}
                  />
                </td>
                <td className="p-2">
                  {job.key === 'Building' ? (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="w-20 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={Math.min(Math.floor((population['Building'] || 0) / 150), Math.floor(totalPop / 150))}
                      onChange={handleEfficiencyInputChange}
                      title={`Set efficiency for ${job.label}`}
                      max={Math.floor(totalPop / 150)}
                    />
                  ) : (
                    <input
                      type="number"
                      min={0}
                      className="w-20 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={getEfficiency(job.key)}
                      onChange={e => handleEfficiencyChange(job.key, e.target.value)}
                      title={`Set efficiency for ${job.label}`}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">Both Assigned and Efficiency are editable and kept in sync. Efficiency = assigned / buildings (rounded down). Blacksmithing: assigned/forges, Building: assigned/150, Training: 1:1.</p>
    </div>
  );
};

const ProjectedProduction = ({ population, buildings, army, land, race }: any) => {
  // Helper: get number from buildings
  const get = (b: string) => typeof buildings[b] === 'number' ? buildings[b] : parseInt(buildings[b] || '0', 10) || 0;
  // Calculate max available population from buildings (for gold and upkeep)
  let maxPop = 0;
  for (const [b, count] of Object.entries(buildings)) {
    const n = typeof count === 'number' ? count : parseInt(count as string) || 0;
    if (b === 'House') maxPop += n * 100;
    else if (b === 'Castle') maxPop += n * 10;
    else maxPop += n * 10;
  }
  const totalPop = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);

  // --- Resource Output with Efficiency Interpolation ---
  // Mine: 100 optimal (5 iron), 200 max (8.5 iron)
  const mines = get('Mine');
  const minePop = population['Mine'] || 0;
  const mineOpt = 100, mineMax = 200, mineBase = 5, minePeak = 8.5;
  let ironProd = 0;
  if (mines > 0) {
    const perMine = minePop / mines;
    if (perMine <= mineOpt) {
      ironProd = mines * (perMine / mineOpt) * mineBase;
    } else if (perMine >= mineMax) {
      ironProd = mines * minePeak;
    } else {
      // Linear interpolation between base and peak
      const t = (perMine - mineOpt) / (mineMax - mineOpt);
      ironProd = mines * ((1 - t) * mineBase + t * minePeak);
    }
    ironProd = Math.round(ironProd);
  }

  // Lumber: 85 optimal (5 wood, 6 for elf), 170 max (9.5 wood, 10.5 for elf)
  const mills = get('Mill');
  const lumberPop = population['Lumber'] || 0;
  const lumberOpt = 85, lumberMax = 170;
  const lumberBase = race === 'Elf' ? 6 : 5;
  const lumberPeak = race === 'Elf' ? 10.5 : 9.5;
  let woodProd = 0;
  if (mills > 0) {
    const perMill = lumberPop / mills;
    if (perMill <= lumberOpt) {
      woodProd = mills * (perMill / lumberOpt) * lumberBase;
    } else if (perMill >= lumberMax) {
      woodProd = mills * lumberPeak;
    } else {
      const t = (perMill - lumberOpt) / (lumberMax - lumberOpt);
      woodProd = mills * ((1 - t) * lumberBase + t * lumberPeak);
    }
    woodProd = Math.round(woodProd);
  }

  // Agriculture: 60 optimal (100 food), 120 max (145 food)
  const farms = get('Farm');
  const agriPop = population['Agriculture'] || 0;
  const agriOpt = 60, agriMax = 120, agriBase = 100, agriPeak = 145;
  let foodProd = 0;
  if (farms > 0) {
    const perFarm = agriPop / farms;
    if (perFarm <= agriOpt) {
      foodProd = farms * (perFarm / agriOpt) * agriBase;
    } else if (perFarm >= agriMax) {
      foodProd = farms * agriPeak;
    } else {
      const t = (perFarm - agriOpt) / (agriMax - agriOpt);
      foodProd = farms * ((1 - t) * agriBase + t * agriPeak);
    }
    foodProd = Math.round(foodProd);
  }

  // Gold: min(markets, land) × (maxPop / land) × 1.25
  const markets = get('Market');
  const goldProd = Math.round(Math.min(markets, land || 1) * (maxPop / (land || 1)) * 1.25);
  // Food upkeep: 1 per 6 people + units' food upkeep (use maxPop, not assigned)
  const foodUpkeepPop = Math.ceil(maxPop / 6);
  let foodUpkeepUnits = 0;
  let goldUpkeepUnits = 0;
  for (const [unit, count] of Object.entries(army)) {
    const n = typeof count === 'number' ? count : parseInt(count as string) || 0;
    if (n > 0 && UNIT_DATA[unit]) {
      foodUpkeepUnits += UNIT_DATA[unit].upkeep.food * n;
      goldUpkeepUnits += UNIT_DATA[unit].upkeep.gold * n;
    }
  }
  const foodUpkeep = foodUpkeepPop + foodUpkeepUnits;
  // Gold upkeep: sum of units' gold upkeep
  const goldUpkeep = goldUpkeepUnits;
  // Net per day
  const netFood = foodProd - foodUpkeep;
  const netGold = goldProd - goldUpkeep;
  // Table rows
  const rows = [
    { resource: 'Gold', prod: goldProd, upkeep: goldUpkeep, net: netGold },
    { resource: 'Iron', prod: ironProd, upkeep: 0, net: ironProd },
    { resource: 'Wood', prod: woodProd, upkeep: 0, net: woodProd },
    { resource: 'Food', prod: foodProd, upkeep: foodUpkeep, net: netFood },
  ];
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Projected Production</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left">Resource</th>
              <th className="p-2 text-left">Prod</th>
              <th className="p-2 text-left">Upkeep</th>
              <th className="p-2 text-left">Net/D</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.resource} className="even:bg-gray-700">
                <td className="p-2 font-medium">{row.resource}</td>
                <td className="p-2">{row.prod}</td>
                <td className="p-2">{row.upkeep}</td>
                <td className="p-2">{row.net}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function MainApp() {
  // State for both armies
  const [yourArmy, setYourArmy] = useState<Army>({});
  const [enemyArmy, setEnemyArmy] = useState<Army>({});
  // State for kingdom stats (set default Land: 20, Castles: 1)
  const [yourKingdomStats, setYourKingdomStats] = useState<KingdomStats>({ KS: 100, Land: 20, Castles: 1 });
  const [enemyKingdomStats, setEnemyKingdomStats] = useState<KingdomStats>({ KS: 100, Land: 20, Castles: 1 });
  // State for tech levels and strategies
  const [yourTechLevels, setYourTechLevels] = useState<TechLevels>({});
  const [enemyTechLevels, setEnemyTechLevels] = useState<TechLevels>({});
  const [yourStrategy, setYourStrategy] = useState<StrategyName | null>(null);
  const [enemyStrategy, setEnemyStrategy] = useState<StrategyName | null>(null);
  // State for battle outcome
  const [battleOutcome, setBattleOutcome] = useState<BattleOutcome | null>(null);
  // Add race state for each kingdom
  const [yourRace, setYourRace] = useState<string>(RACES[0]);
  const [enemyRace, setEnemyRace] = useState<string>(RACES[0]);
  // Add building state for each kingdom
  const [yourBuildings, setYourBuildings] = useState<any>({});
  const [enemyBuildings, setEnemyBuildings] = useState<any>({});
  // Add population state for each kingdom
  const [yourPopulation, setYourPopulation] = useState<any>({});
  const [enemyPopulation, setEnemyPopulation] = useState<any>({});

  // Handler for simulating the battle
  const handleSimulateBattle = () => {
    const outcome = simulateBattle(
      yourArmy,
      enemyArmy,
      yourKingdomStats,
      enemyKingdomStats,
      yourTechLevels,
      yourStrategy,
      enemyTechLevels,
      enemyStrategy,
      20 // maxRounds
    );
    setBattleOutcome(outcome);
  };

  // Auto-calculate KS for your kingdom
  useEffect(() => {
    const newKS = calculateKS(yourArmy, yourBuildings);
    if (yourKingdomStats.KS !== newKS) {
      setYourKingdomStats({ ...yourKingdomStats, KS: newKS });
    }
    // eslint-disable-next-line
  }, [yourArmy, yourBuildings]);
  // Auto-calculate KS for enemy kingdom
  useEffect(() => {
    const newKS = calculateKS(enemyArmy, enemyBuildings);
    if (enemyKingdomStats.KS !== newKS) {
      setEnemyKingdomStats({ ...enemyKingdomStats, KS: newKS });
    }
    // eslint-disable-next-line
  }, [enemyArmy, enemyBuildings]);

  // Calculate total population for each kingdom
  const calcTotalPop = (buildings: any) => {
    let total = 0;
    for (const [b, count] of Object.entries(buildings)) {
      const n = typeof count === 'number' ? count : parseInt(count as string) || 0;
      if (b === 'House') total += n * 100;
      else if (b === 'Castle') total += n * 10;
      else total += n * 10;
    }
    return total;
  };
  const yourTotalPop = calcTotalPop(yourBuildings);
  const enemyTotalPop = calcTotalPop(enemyBuildings);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 font-sans p-4 flex flex-col items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-5xl rounded-2xl bg-gray-900 shadow-lg p-6 mt-8">
        <h1 className="text-3xl font-bold text-center mb-8">Thardferr Battle Calculator</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Army</h2>
            {/* Race selector for your kingdom */}
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Race</label>
              <select
                className="w-full p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={yourRace}
                onChange={e => setYourRace(e.target.value)}
                title="Select your kingdom's race"
              >
                {RACES.map(race => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            </div>
            {/* Move KingdomStatsInput above ArmyInput */}
            <KingdomStatsInput kingdomName="Your Kingdom" stats={yourKingdomStats} setStats={setYourKingdomStats} techLevels={yourTechLevels} setTechLevels={setYourTechLevels} strategy={yourStrategy} setStrategy={setYourStrategy} />
            <ArmyInput
              armyName="Your Army"
              army={yourArmy}
              setArmy={setYourArmy}
              units={getUnitsForRace(yourRace)}
            />
            <PopulationAssignment
              population={yourPopulation}
              setPopulation={setYourPopulation}
              buildings={yourBuildings}
              totalPop={yourTotalPop}
            />
            <ProjectedProduction
              population={yourPopulation}
              buildings={yourBuildings}
              army={yourArmy}
              land={yourKingdomStats.Land}
              race={yourRace}
            />
            <ProjectedWeaponsSummary
              race={yourRace}
              blacksmithingEfficiency={Math.floor((yourPopulation['Blacksmithing'] || 0) / 30)}
              population={yourPopulation}
              buildings={yourBuildings}
            />
            {/* Add BuildingTable below ArmyInput */}
            <BuildingTable
              buildings={yourBuildings}
              setBuildings={setYourBuildings}
              land={yourKingdomStats.Land}
              castles={yourKingdomStats.Castles}
              race={yourRace}
              population={yourPopulation}
            />
            <EconomicSummary army={yourArmy} kingdomStats={yourKingdomStats} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Enemy Army</h2>
            {/* Race selector for enemy kingdom */}
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Race</label>
              <select
                className="w-full p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={enemyRace}
                onChange={e => setEnemyRace(e.target.value)}
                title="Select enemy kingdom's race"
              >
                {RACES.map(race => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            </div>
            {/* Move KingdomStatsInput above ArmyInput */}
            <KingdomStatsInput kingdomName="Enemy Kingdom" stats={enemyKingdomStats} setStats={setEnemyKingdomStats} techLevels={enemyTechLevels} setTechLevels={setEnemyTechLevels} strategy={enemyStrategy} setStrategy={setEnemyStrategy} />
            <ArmyInput
              armyName="Enemy Army"
              army={enemyArmy}
              setArmy={setEnemyArmy}
              units={getUnitsForRace(enemyRace)}
            />
            <PopulationAssignment
              population={enemyPopulation}
              setPopulation={setEnemyPopulation}
              buildings={enemyBuildings}
              totalPop={enemyTotalPop}
            />
            <ProjectedProduction
              population={enemyPopulation}
              buildings={enemyBuildings}
              army={enemyArmy}
              land={enemyKingdomStats.Land}
              race={enemyRace}
            />
            <ProjectedWeaponsSummary
              race={enemyRace}
              blacksmithingEfficiency={Math.floor((enemyPopulation['Blacksmithing'] || 0) / 30)}
              population={enemyPopulation}
              buildings={enemyBuildings}
            />
            {/* Add BuildingTable below ArmyInput */}
            <BuildingTable
              buildings={enemyBuildings}
              setBuildings={setEnemyBuildings}
              land={enemyKingdomStats.Land}
              castles={enemyKingdomStats.Castles}
              race={enemyRace}
              population={enemyPopulation}
            />
            <EconomicSummary army={enemyArmy} kingdomStats={enemyKingdomStats} />
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <button
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            onClick={handleSimulateBattle}
          >
            Simulate Battle
          </button>
        </div>
        <BattleSimulationDisplay battleOutcome={battleOutcome} />
        <UnitEfficiencyTable techLevels={yourTechLevels} strategy={yourStrategy} />
      </div>
    </main>
  );
}
