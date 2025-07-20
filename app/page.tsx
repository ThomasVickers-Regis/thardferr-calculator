"use client";
import React, { useState, useEffect } from 'react';
import { simulateBattle, BattleOutcome, KingdomStats } from '../utils/simulateBattle';
import { Army } from '../utils/calculatePhaseDamage';
import { TechLevels, StrategyName } from '../utils/getEffectiveUnitStats';
import '../app/globals.css';
import { UNIT_DATA } from '../data/unitData';
import { TECHNOLOGY_DATA, TECHNOLOGY_TREES, RACE_UNIQUE_TECHS } from '../data/technologyData';
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
  return Object.keys(UNIT_DATA[lower] || {});
};

// Add getDefaultArmy above MainApp
const getDefaultArmy = (race: string) => {
  const lower = race.toLowerCase();
  const units = getUnitsForRace(lower);
  const army: Army = {};
  // Get TC and ATC units for this race
  const tcUnits = Object.keys(BUILDING_DATA['Training Center']?.unit_production?.[lower] || {});
  const atcUnits = Object.keys(BUILDING_DATA['Advanced Training Center']?.unit_production?.[lower] || {});
  units.forEach(unit => {
    if (tcUnits.includes(unit)) {
      army[unit] = 10;
    } else if (atcUnits.includes(unit)) {
      army[unit] = 0;
    } else {
      army[unit] = 10; // fallback for any other units
    }
  });
  return army;
};

// ArmyInput component: allows user to set quantities for all unit types
const ArmyInput = ({ armyName, army, setArmy, units, buildings, race, techLevels }: { armyName: string; army: Army; setArmy: (a: Army) => void; units: string[]; buildings?: any; race?: string; techLevels?: any }) => {
  // Ensure race is lowercase and defined
  const raceKey = race?.toLowerCase() || 'dwarf';
  
  // Handler for changing unit count
  const handleChange = (unit: string, value: string) => {
    const count = Math.max(0, parseInt(value) || 0);
    setArmy({ ...army, [unit]: count });
  };
  // Unit production estimate summary (if buildings and race are provided)
  const getUnitProductionSummary = () => {
    if (!buildings || !race) return '';
    const unitCounts: Record<string, number> = {};
    const tc = buildings['Training Center'] || 0;
    const atc = buildings['Advanced Training Center'] || 0;
    const castle = buildings['Castle'] || 0;
    const tcProd = BUILDING_DATA['Training Center']?.unit_production?.[raceKey] || {};
    for (const [unit, v] of Object.entries(tcProd)) {
      unitCounts[unit] = Math.floor(tc / v.per_building) * v.per_day;
    }
    const atcProd = BUILDING_DATA['Advanced Training Center']?.unit_production?.[raceKey] || {};
    for (const [unit, v] of Object.entries(atcProd)) {
      unitCounts[unit] = (unitCounts[unit] || 0) + Math.floor(atc / v.per_building) * v.per_day;
    }
    for (const unit of Object.keys({ ...tcProd, ...atcProd })) {
      unitCounts[unit] = (unitCounts[unit] || 0) + castle;
    }
    const summary = Object.entries(unitCounts)
      .filter(([_, n]) => n > 0)
      .map(([unit, n]) => `${n} ${unit}`)
      .join(', ');
    return summary ? `You can currently train ${summary} per day.` : '';
  };

  // Melee tech bonus display
  const sharperBladesLevel = techLevels?.['Sharper Blades'] || 0;
  const sharperBladesBonus = sharperBladesLevel > 0 ? `+${sharperBladesLevel} melee to all blade units` : '';

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">{armyName} Composition</h3>
      {sharperBladesLevel > 0 && (
        <p className="text-xs text-green-300 mb-1">Sharper Blades: {sharperBladesBonus}</p>
      )}
      {buildings && race && (
        <p className="text-sm text-purple-300 mb-2">{getUnitProductionSummary()}</p>
      )}
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
              const stats = UNIT_DATA[raceKey]?.[unit];
              if (!stats) return null; // Skip if unit not found for this race
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
                      value={army[unit] !== undefined ? army[unit] : 0}
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
function calculateKS(army: Army, buildings: any, population: any, techLevels: any, strategy: any, race: string) {
  const raceKey = race?.toLowerCase() || 'dwarf';
  let ks = 0;
  // Units: 2.5 KS per unit
  for (const [unit, count] of Object.entries(army)) {
    const unitCount = typeof count === 'number' ? count : parseInt(String(count)) || 0;
    if (unitCount > 0 && UNIT_DATA[raceKey]?.[unit]) {
      ks += 2.5 * unitCount;
    }
  }
  // Buildings: 3 KS per building (except Castles)
  if (buildings) {
    for (const [b, count] of Object.entries(buildings)) {
      if (b === 'Castle') continue;
      ks += 3 * (typeof count === 'number' ? count : 0);
    }
    // Castles: 1500 KS each
    ks += (buildings['Castle'] || 0) * 1500;
  }
  // Tech levels: 1000 KS per level
  if (techLevels) {
    for (const lvl of Object.values(techLevels)) {
      ks += 1000 * (typeof lvl === 'number' ? lvl : parseInt(lvl as string) || 0);
    }
  }
  // No population bonus for now
  return Math.round(ks);
}

// KingdomStatsInput component: allows user to set kingdom stats, tech levels, and strategy
const KingdomStatsInput = ({ kingdomName, stats, setStats, techLevels, setTechLevels, strategy, setStrategy, calculatedPopulation, race }: any) => {
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
            value={calculatedPopulation}
            readOnly
            title="Total population (auto-calculated from buildings)"
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
        {/* Render combat techs (flat stat upgrades) */}
        <div className="mb-2">
          <div className="font-semibold text-purple-300 mb-1">Combat Technologies</div>
          <table className="min-w-full text-xs mb-2">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-1 text-left">Name</th>
                <th className="p-1 text-left">Effect</th>
                <th className="p-1 text-left">Level</th>
                <th className="p-1 text-left">Max</th>
              </tr>
            </thead>
            <tbody>
              {['Sharper Blades', 'Tougher Light Armor', 'Tougher Caragous Armor', 'Improve Bow Range'].map(tech => {
                const data = TECHNOLOGY_DATA[tech];
                if (!data) return null;
                const maxLevel = typeof data.maxLevel === 'number' ? data.maxLevel : (Object.keys(data.levels).length || 1);
                const currentLevel = techLevels[tech] || 0;
                return (
                  <tr key={tech} className="even:bg-gray-700">
                    <td className="p-1 font-medium">{tech}</td>
                    <td className="p-1">{data.description}</td>
                    <td className="p-1">
                      <input
                        type="number"
                        min={0}
                        max={maxLevel}
                        className="w-12 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={currentLevel}
                        onChange={e => setTechLevels({ ...techLevels, [tech]: Math.max(0, Math.min(Number(e.target.value), maxLevel || 1)) })}
                        title={`Set level for ${tech}`}
                      />
                    </td>
                    <td className="p-1">{maxLevel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Render technology trees */}
        {Object.entries(TECHNOLOGY_TREES).map(([treeName, techs]) => (
          <div key={treeName} className="mb-2">
            <div className="font-semibold text-purple-300 mb-1">{treeName.replace('Tree', 'Tree ')}</div>
            <table className="min-w-full text-xs mb-2">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-1 text-left">Name</th>
                  <th className="p-1 text-left">Effect</th>
                  <th className="p-1 text-left">Level</th>
                  <th className="p-1 text-left">Cost</th>
                  <th className="p-1 text-left">Research Time</th>
                </tr>
              </thead>
              <tbody>
                {techs.map((tech, idx) => {
                  const prevTech = techs[idx - 1];
                  const canResearch = idx === 0 || (prevTech && (techLevels[prevTech.name] || 0) >= 1);
                  const isMultiLevel = tech.maxLevel && tech.maxLevel > 1;
                  const currentLevel = techLevels[tech.name] || 0;
                  return (
                    <tr key={tech.name} className="even:bg-gray-700">
                      <td className="p-1 font-medium">{tech.name}</td>
                      <td className="p-1">{tech.effect}</td>
                      <td className="p-1">
                        {isMultiLevel ? (
                          <input
                            type="number"
                            min={0}
                            max={tech.maxLevel}
                            className="w-12 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={currentLevel}
                            onChange={e => {
                              const val = Math.max(0, Math.min(Number(e.target.value), tech.maxLevel || 1));
                              setTechLevels({ ...techLevels, [tech.name]: val });
                            }}
                            disabled={!canResearch}
                            title={`Set level for ${tech.name}`}
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={currentLevel >= 1}
                            onChange={e => setTechLevels({ ...techLevels, [tech.name]: e.target.checked ? 1 : 0 })}
                            disabled={!canResearch}
                            title={`Research ${tech.name}`}
                          />
                        )}
                        {isMultiLevel && ` / ${tech.maxLevel}`}
                      </td>
                      <td className="p-1">{tech.cost.toLocaleString()}</td>
                      <td className="p-1">{tech.researchTime}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {/* Render race-unique tech */}
        {race && RACE_UNIQUE_TECHS[race] && (
          <div className="mb-2">
            <div className="font-semibold text-purple-300 mb-1">Unique Technology</div>
            <div className="bg-gray-700 rounded p-2">
              <div className="font-medium">{RACE_UNIQUE_TECHS[race].name}</div>
              <div className="text-xs">{RACE_UNIQUE_TECHS[race].effect}</div>
            </div>
          </div>
        )}
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

const BattleSimulationDisplay = ({ battleOutcome, yourTechLevels, yourStrategy, enemyTechLevels, enemyStrategy, yourRace, enemyRace, originalYourArmy, originalEnemyArmy }: { 
  battleOutcome: BattleOutcome | null;
  yourTechLevels: any;
  yourStrategy: any;
  enemyTechLevels: any;
  enemyStrategy: any;
  yourRace: string;
  enemyRace: string;
  originalYourArmy: Army;
  originalEnemyArmy: Army;
}) => {
  if (!battleOutcome) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg mb-4 text-center text-gray-400">
        Run a simulation to see the battle log and outcome here.
      </div>
    );
  }

  const { winner, rounds, finalYourArmy, finalEnemyArmy, battleLog } = battleOutcome;

  // Calculate casualties for both sides (comparing initial to final army)
  const calculateCasualties = (initialArmy: any, finalArmy: any) => {
    const casualties: Record<string, number> = {};
    for (const [unit, initialCount] of Object.entries(initialArmy)) {
      const finalCount = finalArmy[unit] || 0;
      const lost = (initialCount as number) - finalCount;
      // Show all units, even with 0 losses
      casualties[unit] = lost;
    }
    return casualties;
  };

  // Calculate phase-specific stats for an army
  const calculatePhaseStats = (army: any, race: string, techLevels: any = {}, strategy: any = null, isAttacker: boolean = true, phase: string) => {
    let totalAttack = 0;
    let totalDefense = 0;
    const modifiers: string[] = [];
    const buildingEffects: string[] = [];

    for (const [unit, count] of Object.entries(army)) {
      const unitCount = count as number;
      if (unitCount > 0) {
        const effectiveStats = getEffectiveUnitStats(unit, race, techLevels, strategy, isAttacker, 1);
        
        // Only count relevant stats for this phase
        if (phase === 'range') {
          totalAttack += effectiveStats.range * unitCount;
        } else if (phase === 'short') {
          totalAttack += effectiveStats.short * unitCount;
        } else if (phase === 'melee') {
          totalAttack += effectiveStats.melee * unitCount;
        }
        
        totalDefense += effectiveStats.defense * unitCount;
      }
    }

    // Add phase-specific tech/strategy modifiers
    if (phase === 'melee' && techLevels['Sharper Blades Structure'] > 0) {
      const level = techLevels['Sharper Blades Structure'];
      const percent = TECHNOLOGY_DATA['Sharper Blades Structure'].levels[String(level)]?.damage_increase_percent || 0;
      modifiers.push(`Sharper Blades +${Math.round(percent * 100)}% melee`);
    }
    
    if ((phase === 'range' || phase === 'short') && techLevels['Improved Range Structure'] > 0) {
      const level = techLevels['Improved Range Structure'];
      const percent = TECHNOLOGY_DATA['Improved Range Structure'].levels[String(level)]?.damage_increase_percent || 0;
      modifiers.push(`Improved Range +${Math.round(percent * 100)}% ${phase}`);
    }
    
    if (techLevels['Hardening'] > 0) {
      const level = techLevels['Hardening'];
      const percent = TECHNOLOGY_DATA['Hardening'].levels[String(level)]?.defense_increase_percent || 0;
      modifiers.push(`Hardening +${Math.round(percent * 100)}% defense`);
    }

    // Add strategy effects
    if (strategy) {
      if (strategy === 'Archer Protection' && phase === 'melee') {
        modifiers.push('Archer Protection: Infantry -50% melee');
      }
      if (strategy === 'Infantry Attack' && phase === 'melee') {
        modifiers.push('Infantry Attack: Infantry +150% melee');
      }
      if (strategy === 'Quick Retreat') {
        modifiers.push('Quick Retreat: All attacks -50%');
      }
      if (strategy === 'Anti-Cavalry' && phase === 'melee') {
        modifiers.push('Anti-Cavalry: Pikemen +250% vs mounted');
      }
      if (strategy === 'Dwarf Shield Line' && phase === 'melee') {
        modifiers.push('Dwarf Shield Line: Shieldbearers +100% melee');
      }
      if (strategy === 'Elf Energy Gathering' && (phase === 'melee' || phase === 'range')) {
        modifiers.push('Elf Energy Gathering: Mages +100% melee, +4 range');
      }
      if (strategy === 'Gnome Far Fighting' && (phase === 'range' || phase === 'short')) {
        modifiers.push('Gnome Far Fighting: Range/Short attacks doubled');
      }
      if (strategy === 'Human Charging!' && phase === 'melee') {
        modifiers.push('Human Charging!: Knights +50% melee');
      }
      if (strategy === 'Orc Surrounding' && phase === 'short') {
        modifiers.push('Orc Surrounding: Shadow Warriors in short phase');
      }
      if (strategy === 'Orc Berserker') {
        modifiers.push('Orc Berserker: +3 all attacks, -50% defense');
      }
    }

    // Add building effects
    if (phase === 'range') {
      buildingEffects.push('Guard Towers: Reduces ranged attacks by 40 damages per tower (max 2 damages per unit)');
    }
    if (phase === 'melee') {
      buildingEffects.push('Medical Centers: Decreases close combat damages by 50 per center on attack (max 1 damage per unit), 75 per center on defense (max 2 damages per unit)');
    }

    return {
      attack: Math.round(totalAttack * 100) / 100,
      defense: Math.round(totalDefense * 100) / 100,
      modifiers,
      buildingEffects
    };
  };

  // Use original armies for display (before any scaling was applied)
  const initialYourArmy = originalYourArmy;
  const initialEnemyArmy = originalEnemyArmy;

  // Simulate land gain/loss based on battle outcome (attacker perspective)
  const calculateLandGainLoss = () => {
    if (winner === 'yourArmy') {
      // Attacker wins - gain land (5-15% of defender's land)
      const defenderLand = 20; // This should come from enemy kingdom stats - hardcoded for now
      const landGained = Math.floor(defenderLand * (0.05 + Math.random() * 0.1)); // 5-15%
      const castlesGained = Math.random() < 0.2 ? 1 : 0; // 20% chance for castle
      return { land: landGained, castles: castlesGained, peasants: Math.floor(Math.random() * 2000) + 1000 };
    } else {
      // Defender wins - attacker gains nothing, defender loses nothing
      return { land: 0, castles: 0, peasants: Math.floor(Math.random() * 1000) + 500 };
    }
  };

  // Simulate building gains from conquered territory (only happens to attacker)
  const simulateBuildingGains = () => {
    if (winner !== 'yourArmy') return {}; // Only attacker gains buildings
    
    // Calculate building density based on land gained
    const landGained = landResults.land;
    if (landGained <= 0) return {};
    
    // Base building ratios per land (based on actual enemy kingdom: 20 land, 40 houses = 2.0 ratio)
    const buildingRatios = {
      'House': 2.0, // 2.0 houses per land (40 houses / 20 land)
      'Farm': 0.5,  // 0.5 farms per land (10 farms / 20 land)
      'Forge': 0.5, // 0.5 forges per land (10 forges / 20 land)
      'Guard House': 0.5, // 0.5 guard houses per land (10 guard houses / 20 land)
      'Guard Tower': 0.5, // 0.5 guard towers per land (10 guard towers / 20 land)
      'Market': 0.5, // 0.5 markets per land (10 markets / 20 land)
      'Medical Center': 0.0, // 0.0 medical centers per land (0 medical centers / 20 land)
      'Mill': 0.5, // 0.5 mills per land (10 mills / 20 land)
      'Mine': 0.5, // 0.5 mines per land (10 mines / 20 land)
      'School': 0.5, // 0.5 schools per land (10 schools / 20 land)
      'Training Center': 0.25, // 0.25 training centers per land (5 training centers / 20 land)
      'Advanced Training Center': 0.25 // 0.25 advanced training centers per land (5 advanced training centers / 20 land)
    };
    
    const gained: Record<string, number> = {};
    
    Object.entries(buildingRatios).forEach(([building, ratio]) => {
      const baseCount = Math.floor(landGained * ratio);
      // Add some randomness (±20%)
      const variation = Math.random() * 0.4 - 0.2; // -20% to +20%
      const finalCount = Math.max(0, Math.floor(baseCount * (1 + variation)));
      
      if (finalCount > 0) {
        gained[building] = finalCount;
      }
    });
    
    return gained;
  };

  const yourCasualties = calculateCasualties(originalYourArmy, finalYourArmy);
  
  // For enemy casualties, use the scaled army as the starting point (not the original)
  const enemyCasualties = battleLog.length > 0 
    ? calculateCasualties(battleLog[0].enemyArmy, finalEnemyArmy)  // Use scaled army from first round
    : calculateCasualties(originalEnemyArmy, finalEnemyArmy);      // Fallback to original if no battle log
  const landResults = calculateLandGainLoss();
  const buildingGains = simulateBuildingGains();

  // Format casualties for display
  const formatCasualties = (casualties: Record<string, number>) => {
    return Object.entries(casualties)
      .map(([unit, count]) => `${count} ${unit}`)
      .join(', ');
  };

  // Format building destruction
  const formatBuildingDestruction = (buildings: Record<string, number>) => {
    return Object.entries(buildings)
      .map(([building, count]) => `${count} ${building}`)
      .join(', ');
  };

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
      {landResults.land > 0 && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="text-green-400">
            <div className="font-bold">We won {landResults.castles} Castle(s) surrounded by {landResults.land} lands.</div>
            <div className="text-sm mt-1">In this lands also lived {landResults.peasants.toLocaleString()} people who are grateful to join our Kingdom.</div>
          </div>
        </div>
      )}

      {/* Building Gains */}
      {Object.keys(buildingGains).length > 0 && (
        <div className="mb-4 p-3 bg-gray-700 rounded">
          <div className="text-green-400 font-bold">In this lands are also constructed :</div>
          <div className="text-sm mt-1">
            {[
              'Advanced Training Center', 'Training Center', 'Farm', 'House', 'Forge', 
              'Guard House', 'Guard Tower', 'Market', 'Medical Center', 'Mill', 'Mine', 'School'
            ].map(building => {
              const count = buildingGains[building] || 0;
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
              {Object.keys(yourCasualties).length > 0 ? formatCasualties(yourCasualties) : 'No units lost'}
            </div>
          </div>
          <div>
            <div className="text-green-400 font-bold">We managed to kill:</div>
            <div className="text-sm mt-1">
              {Object.keys(enemyCasualties).length > 0 ? formatCasualties(enemyCasualties) : 'No enemy units killed'}
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
          {battleLog.map((entry, idx) => {
            return (
              <div key={idx} className="mb-4 p-3 border-b border-gray-700 last:border-b-0 bg-gray-750">
                <div className="font-bold mb-3 text-lg text-center bg-gray-600 p-2 rounded">Round {entry.round}</div>

                {entry.roundResult.phaseLogs.map((phaseLog, pIdx) => {
                  // Calculate phase-specific stats (skip for end phase)
                  const yourPhaseStats = phaseLog.phase !== 'end' ? calculatePhaseStats(entry.yourArmy, yourRace, yourTechLevels, yourStrategy, true, phaseLog.phase) : { attack: 0, defense: 0, modifiers: [], buildingEffects: [] };
                  const enemyPhaseStats = phaseLog.phase !== 'end' ? calculatePhaseStats(entry.enemyArmy, enemyRace, enemyTechLevels, enemyStrategy, false, phaseLog.phase) : { attack: 0, defense: 0, modifiers: [], buildingEffects: [] };
                  
                  return (
                    <div key={pIdx} className="mb-4 p-3 bg-gray-700 rounded border border-gray-600">
                      <div className="font-bold text-purple-200 capitalize mb-4 text-center bg-gray-600 p-3 rounded text-xl border border-purple-400 shadow-lg">{phaseLog.phase === 'end' ? 'End Phase' : `${phaseLog.phase} Phase`}</div>
                      
                      {/* End Phase Healing Display */}
                      {phaseLog.phase === 'end' ? (
                        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="bg-gray-800 p-4 rounded">
                            <div className="text-green-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg">Your Army Healing:</div>
                            <div className="space-y-3 text-sm">
                              {Object.keys(phaseLog.yourHealing || {}).length > 0 ? (
                                Object.entries(phaseLog.yourHealing || {}).map(([unit, healed]) => (
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
                          
                          <div className="bg-gray-800 p-4 rounded">
                            <div className="text-green-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg">Enemy Army Healing:</div>
                            <div className="space-y-3 text-sm">
                              {Object.keys(phaseLog.enemyHealing || {}).length > 0 ? (
                                Object.entries(phaseLog.enemyHealing || {}).map(([unit, healed]) => (
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
                        </div>
                      ) : (
                        /* Combined Phase Stats and Attackers - FIRST */
                        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-800 p-4 rounded">
                          <div className="text-blue-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg">Your Army Analysis:</div>
                          <div className="space-y-3 text-sm">
                            {/* Army Stats */}
                            <div className="bg-gray-700 p-3 rounded">
                              <div className="text-gray-300 font-medium mb-2">Army Stats:</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="capitalize">{phaseLog.phase}: <span className="font-bold text-blue-400">{yourPhaseStats.attack}</span></div>
                                <div>Defense: <span className="font-bold text-blue-400">{yourPhaseStats.defense}</span></div>
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
                            </div>
                            
                            {/* Condensed Unit Summary */}
                            <div className="bg-gray-700 p-3 rounded">
                              <div className="text-gray-300 font-medium mb-2">Unit Summary:</div>
                              <div className="space-y-1 text-xs">
                                {Object.entries(phaseLog.yourArmyAtStart || entry.yourArmy).filter(([_, v]) => v > 0).map(([unit, count]) => {
                                  const stats = getEffectiveUnitStats(unit, yourRace, yourTechLevels, yourStrategy, true, 1);
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
                                        <div className="text-gray-400 text-xs">
                                          {count} → {survived} ({lost > 0 ? `-${lost}` : '0'})
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-blue-400 font-bold">{attackValue.toFixed(1)}</div>
                                        <div className="text-gray-400 text-xs">{totalDamage.toFixed(0)}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Attackers */}
                            <div className="bg-gray-700 p-3 rounded">
                              <div className="text-gray-300 font-medium mb-2">{phaseLog.phase} Attackers:</div>
                              <div className="space-y-1 text-xs">
                                {Object.entries(entry.yourArmy).filter(([_, v]) => v > 0).map(([unit, count]) => {
                                  const stats = getEffectiveUnitStats(unit, yourRace, yourTechLevels, yourStrategy, true, 1);
                                  let attackValue = 0;
                                  if (phaseLog.phase === 'range') attackValue = stats.range;
                                  else if (phaseLog.phase === 'short') attackValue = stats.short;
                                  else if (phaseLog.phase === 'melee') attackValue = stats.melee;
                                  
                                  if (attackValue > 0) {
                                    return (
                                      <div key={unit} className="flex justify-between items-center">
                                        <span className="text-gray-300">{unit}</span>
                                        <span className="font-bold text-blue-400">{count} × {attackValue.toFixed(1)} = {(count as number * attackValue).toFixed(1)}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded">
                          <div className="text-red-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg">Enemy Army Analysis:</div>
                          <div className="space-y-3 text-sm">
                            {/* Army Stats */}
                            <div className="bg-gray-700 p-3 rounded">
                              <div className="text-gray-300 font-medium mb-2">Army Stats:</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="capitalize">{phaseLog.phase}: <span className="font-bold text-red-400">{enemyPhaseStats.attack}</span></div>
                                <div>Defense: <span className="font-bold text-red-400">{enemyPhaseStats.defense}</span></div>
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
                                const originalTotal = Object.values(originalEnemyArmy).reduce((sum, count) => sum + count, 0);
                                const scaledTotal = Object.values(battleLog[0].enemyArmy).reduce((sum, count) => sum + count, 0);
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
                            </div>
                            
                            {/* Condensed Unit Summary */}
                            <div className="bg-gray-700 p-3 rounded">
                              <div className="text-gray-300 font-medium mb-2">Unit Summary:</div>
                              <div className="space-y-1 text-xs">
                                {Object.entries(phaseLog.enemyArmyAtStart || entry.enemyArmy).filter(([_, v]) => v > 0).map(([unit, count]) => {
                                  const stats = getEffectiveUnitStats(unit, enemyRace, enemyTechLevels, enemyStrategy, false, 1);
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
                                        <div className="text-gray-400 text-xs">
                                          {count} → {survived} ({lost > 0 ? `-${lost}` : '0'})
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-red-400 font-bold">{attackValue.toFixed(1)}</div>
                                        <div className="text-gray-400 text-xs">{totalDamage.toFixed(0)}</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Attackers */}
                            <div className="bg-gray-700 p-3 rounded">
                              <div className="text-gray-300 font-medium mb-2">{phaseLog.phase} Attackers:</div>
                              <div className="space-y-1 text-xs">
                                {Object.entries(entry.enemyArmy).filter(([_, v]) => v > 0).map(([unit, count]) => {
                                  const stats = getEffectiveUnitStats(unit, enemyRace, enemyTechLevels, enemyStrategy, false, 1);
                                  let attackValue = 0;
                                  if (phaseLog.phase === 'range') attackValue = stats.range;
                                  else if (phaseLog.phase === 'short') attackValue = stats.short;
                                  else if (phaseLog.phase === 'melee') attackValue = stats.melee;
                                  
                                  if (attackValue > 0) {
                                    return (
                                      <div key={unit} className="flex justify-between items-center">
                                        <span className="text-gray-300">{unit}</span>
                                        <span className="font-bold text-red-400">{count} × {attackValue.toFixed(1)} = {(count as number * attackValue).toFixed(1)}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      )}
                      
                      {/* Detailed Army Status - Skip for End phase */}
                      {phaseLog.phase !== 'end' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Your Army Details */}
                        <div className="bg-gray-800 p-4 rounded">
                          <div className="font-medium text-blue-300 mb-3 border-b border-gray-600 pb-2 text-lg">Your Army Details</div>
                          <div className="space-y-3 text-sm">
                            {Object.entries(phaseLog.yourArmyAtStart || entry.yourArmy).filter(([_, v]) => v > 0).map(([unit, count]) => {
                              const stats = getEffectiveUnitStats(unit, yourRace, yourTechLevels, yourStrategy, true, 1);
                              const baseStats = UNIT_DATA[yourRace.toLowerCase()]?.[unit];
                              let attackValue = 0;
                              if (phaseLog.phase === 'range') attackValue = stats.range;
                              else if (phaseLog.phase === 'short') attackValue = stats.short;
                              else if (phaseLog.phase === 'melee') attackValue = stats.melee;
                              
                              const totalDamage = (count as number) * attackValue;
                              const lost = phaseLog.yourLosses[unit] || 0;
                              const survived = (count as number) - lost;
                              const damageEntry = (phaseLog.yourDamageLog || []).find(d => d.unitName === unit);
                              
                              return (
                                <div key={unit} className="border border-gray-700 p-3 rounded bg-gray-750">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-200 font-bold text-base">{unit}</span>
                                    <span className={`font-bold text-lg ${lost > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                      {lost > 0 ? `-${lost}` : '0'}
                                    </span>
                                  </div>
                                  
                                  {/* Unit Status */}
                                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Count</div>
                                      <div className="text-blue-300 font-bold">{count}</div>
                                    </div>
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Survived</div>
                                      <div className="text-green-400 font-bold">{survived}</div>
                                    </div>
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Loss Rate</div>
                                      <div className="text-yellow-400 font-bold">{count > 0 ? Math.round((lost / (count as number)) * 100) : 0}%</div>
                                    </div>
                                  </div>
                                  
                                  {/* Damage Details */}
                                  {damageEntry && (
                                    <div className="bg-gray-700 p-2 rounded mb-2">
                                      <div className="text-gray-300 font-medium mb-1">Damage Analysis:</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Received: <span className="text-red-300 font-bold">{damageEntry.damageReceived}</span></div>
                                        <div>Mitigated: <span className="text-green-400 font-bold">{damageEntry.damageMitigated}</span></div>
                                        <div>Final: <span className="text-yellow-400 font-bold">{damageEntry.finalDamage}</span></div>
                                        <div>Lost: <span className="text-red-400 font-bold">{damageEntry.unitsLost}</span></div>
                                      </div>
                                      {damageEntry.buildingEffects.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-600">
                                          <div className="text-gray-400 text-xs">Building Effects:</div>
                                          {damageEntry.buildingEffects.map((effect, i) => (
                                            <div key={i} className="text-green-300 text-xs">• {effect}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Attack Stats */}
                                  {attackValue > 0 && (
                                    <div className="bg-gray-700 p-2 rounded mb-2">
                                      <div className="text-gray-300 font-medium mb-1">{phaseLog.phase.toUpperCase()} Attack:</div>
                                      <div className="text-xs">
                                        {count} × {attackValue.toFixed(1)} = <span className="text-blue-300 font-bold">{totalDamage.toFixed(1)}</span> total damage
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Defense Stats */}
                                  <div className="bg-gray-700 p-2 rounded">
                                    <div className="text-gray-300 font-medium mb-1">Defense Stats:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>Base: <span className="text-purple-300">{baseStats?.defense || 0}</span></div>
                                      <div>Effective: <span className="text-purple-400 font-bold">{stats.defense.toFixed(1)}</span></div>
                                      <div>Multiplier: <span className="text-purple-300">{baseStats?.defense ? (stats.defense / baseStats.defense).toFixed(2) : '1.00'}x</span></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Enemy Army Details */}
                        <div className="bg-gray-800 p-4 rounded">
                          <div className="font-medium text-red-300 mb-3 border-b border-gray-600 pb-2 text-lg">
                            Enemy Army Details
                            {battleLog[0]?.enemyArmy && (() => {
                              const originalTotal = Object.values(originalEnemyArmy).reduce((sum, count) => sum + count, 0);
                              const scaledTotal = Object.values(battleLog[0].enemyArmy).reduce((sum, count) => sum + count, 0);
                              if (originalTotal > 0 && scaledTotal < originalTotal) {
                                const efficiency = Math.round((scaledTotal / originalTotal) * 100);
                                return <span className="text-xs text-orange-300 ml-2">({efficiency}% castle scaling)</span>;
                              }
                              return null;
                            })()}
                          </div>
                          <div className="space-y-3 text-sm">
                            {Object.entries(phaseLog.enemyArmyAtStart || entry.enemyArmy).filter(([_, v]) => v > 0).map(([unit, count]) => {
                              const stats = getEffectiveUnitStats(unit, enemyRace, enemyTechLevels, enemyStrategy, false, 1);
                              const baseStats = UNIT_DATA[enemyRace.toLowerCase()]?.[unit];
                              let attackValue = 0;
                              if (phaseLog.phase === 'range') attackValue = stats.range;
                              else if (phaseLog.phase === 'short') attackValue = stats.short;
                              else if (phaseLog.phase === 'melee') attackValue = stats.melee;
                              
                              const totalDamage = (count as number) * attackValue;
                              const lost = phaseLog.enemyLosses[unit] || 0;
                              const survived = (count as number) - lost;
                              const damageEntry = (phaseLog.enemyDamageLog || []).find(d => d.unitName === unit);
                              
                              return (
                                <div key={unit} className="border border-gray-700 p-3 rounded bg-gray-750">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-200 font-bold text-base">{unit}</span>
                                    <span className={`font-bold text-lg ${lost > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                      {lost > 0 ? `-${lost}` : '0'}
                                    </span>
                                  </div>
                                  
                                  {/* Unit Status */}
                                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Count</div>
                                      <div className="text-red-300 font-bold">{count}</div>
                                    </div>
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Survived</div>
                                      <div className="text-green-400 font-bold">{survived}</div>
                                    </div>
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Loss Rate</div>
                                      <div className="text-yellow-400 font-bold">{count > 0 ? Math.round((lost / (count as number)) * 100) : 0}%</div>
                                    </div>
                                  </div>
                                  
                                  {/* Damage Details */}
                                  {damageEntry && (
                                    <div className="bg-gray-700 p-2 rounded mb-2">
                                      <div className="text-gray-300 font-medium mb-1">Damage Analysis:</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Received: <span className="text-red-300 font-bold">{damageEntry.damageReceived}</span></div>
                                        <div>Mitigated: <span className="text-green-400 font-bold">{damageEntry.damageMitigated}</span></div>
                                        <div>Final: <span className="text-yellow-400 font-bold">{damageEntry.finalDamage}</span></div>
                                        <div>Lost: <span className="text-green-400 font-bold">{damageEntry.unitsLost}</span></div>
                                      </div>
                                      {damageEntry.buildingEffects.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-600">
                                          <div className="text-gray-400 text-xs">Building Effects:</div>
                                          {damageEntry.buildingEffects.map((effect, i) => (
                                            <div key={i} className="text-green-300 text-xs">• {effect}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Attack Stats */}
                                  {attackValue > 0 && (
                                    <div className="bg-gray-700 p-2 rounded mb-2">
                                      <div className="text-gray-300 font-medium mb-1">{phaseLog.phase.toUpperCase()} Attack:</div>
                                      <div className="text-xs">
                                        {count} × {attackValue.toFixed(1)} = <span className="text-red-300 font-bold">{totalDamage.toFixed(1)}</span> total damage
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Defense Stats */}
                                  <div className="bg-gray-700 p-2 rounded">
                                    <div className="text-gray-300 font-medium mb-1">Defense Stats:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>Base: <span className="text-purple-300">{baseStats?.defense || 0}</span></div>
                                      <div>Effective: <span className="text-purple-400 font-bold">{stats.defense.toFixed(1)}</span></div>
                                      <div>Multiplier: <span className="text-purple-300">{baseStats?.defense ? (stats.defense / baseStats.defense).toFixed(2) : '1.00'}x</span></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      )}



                      {/* Combined Damage Analysis and Phase Losses - Skip for End phase */}
                      {phaseLog.phase !== 'end' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-800 p-4 rounded">
                          <div className="text-red-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg">Your Army Analysis:</div>
                          <div className="space-y-3 text-sm">
                            {Object.keys(UNIT_DATA[yourRace.toLowerCase()] || {}).map((unit) => {
                              const lost = phaseLog.yourLosses[unit] || 0;
                              const startCount = phaseLog.yourArmyAtStart?.[unit] || 0;
                              const endCount = startCount - lost;
                              const stats = getEffectiveUnitStats(unit, yourRace, yourTechLevels, yourStrategy, true, 1);
                              const baseStats = UNIT_DATA[yourRace.toLowerCase()]?.[unit];
                              const damageEntry = (phaseLog.yourDamageLog || []).find(d => d.unitName === unit);
                              
                              return (
                                <div key={unit} className="border border-gray-700 p-3 rounded bg-gray-750">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-200 font-bold text-base">{unit}</span>
                                    <span className={`font-bold text-lg ${lost > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                      {lost > 0 ? `-${lost}` : '0'}
                                    </span>
                                  </div>
                                  
                                  {/* Unit Status */}
                                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Started</div>
                                      <div className="text-blue-300 font-bold">{startCount}</div>
                                    </div>
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Ended</div>
                                      <div className="text-green-400 font-bold">{endCount}</div>
                                    </div>
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Loss Rate</div>
                                      <div className="text-yellow-400 font-bold">{startCount > 0 ? Math.round((lost / startCount) * 100) : 0}%</div>
                                    </div>
                                  </div>
                                  
                                  {/* Damage Details */}
                                  {damageEntry && (
                                    <div className="bg-gray-700 p-2 rounded mb-2">
                                      <div className="text-gray-300 font-medium mb-1">Damage Analysis:</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Received: <span className="text-red-300 font-bold">{damageEntry.damageReceived}</span></div>
                                        <div>Mitigated: <span className="text-green-400 font-bold">{damageEntry.damageMitigated}</span></div>
                                        <div>Final: <span className="text-yellow-400 font-bold">{damageEntry.finalDamage}</span></div>
                                        <div>Lost: <span className="text-red-400 font-bold">{damageEntry.unitsLost}</span></div>
                                      </div>
                                      {damageEntry.buildingEffects.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-600">
                                          <div className="text-gray-400 text-xs">Building Effects:</div>
                                          {damageEntry.buildingEffects.map((effect, i) => (
                                            <div key={i} className="text-green-300 text-xs">• {effect}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Defense Stats */}
                                  <div className="bg-gray-700 p-2 rounded">
                                    <div className="text-gray-300 font-medium mb-1">Defense Stats:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>Base: <span className="text-purple-300">{baseStats?.defense || 0}</span></div>
                                      <div>Effective: <span className="text-purple-400 font-bold">{stats.defense.toFixed(1)}</span></div>
                                      <div>Multiplier: <span className="text-purple-300">{baseStats?.defense ? (stats.defense / baseStats.defense).toFixed(2) : '1.00'}x</span></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        <div className="bg-gray-800 p-4 rounded">
                          <div className="text-green-400 font-medium mb-3 border-b border-gray-600 pb-2 text-lg">Enemy Army Analysis:</div>
                          <div className="space-y-3 text-sm">
                            {Object.keys(UNIT_DATA[enemyRace.toLowerCase()] || {}).map((unit) => {
                              const lost = phaseLog.enemyLosses[unit] || 0;
                              const startCount = phaseLog.enemyArmyAtStart?.[unit] || 0;
                              const endCount = startCount - lost;
                              const stats = getEffectiveUnitStats(unit, enemyRace, enemyTechLevels, enemyStrategy, false, 1);
                              const baseStats = UNIT_DATA[enemyRace.toLowerCase()]?.[unit];
                              const damageEntry = (phaseLog.enemyDamageLog || []).find(d => d.unitName === unit);
                              
                              return (
                                <div key={unit} className="border border-gray-700 p-3 rounded bg-gray-750">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-200 font-bold text-base">{unit}</span>
                                    <span className={`font-bold text-lg ${lost > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                                      {lost > 0 ? `-${lost}` : '0'}
                                    </span>
                                  </div>
                                  
                                  {/* Unit Status */}
                                  <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Started</div>
                                      <div className="text-red-300 font-bold">{startCount}</div>
                                    </div>
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Ended</div>
                                      <div className="text-green-400 font-bold">{endCount}</div>
                                    </div>
                                    <div className="bg-gray-700 p-1 rounded text-center">
                                      <div className="text-gray-400">Loss Rate</div>
                                      <div className="text-yellow-400 font-bold">{startCount > 0 ? Math.round((lost / startCount) * 100) : 0}%</div>
                                    </div>
                                  </div>
                                  
                                  {/* Damage Details */}
                                  {damageEntry && (
                                    <div className="bg-gray-700 p-2 rounded mb-2">
                                      <div className="text-gray-300 font-medium mb-1">Damage Analysis:</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Received: <span className="text-red-300 font-bold">{damageEntry.damageReceived}</span></div>
                                        <div>Mitigated: <span className="text-green-400 font-bold">{damageEntry.damageMitigated}</span></div>
                                        <div>Final: <span className="text-yellow-400 font-bold">{damageEntry.finalDamage}</span></div>
                                        <div>Lost: <span className="text-green-400 font-bold">{damageEntry.unitsLost}</span></div>
                                      </div>
                                      {damageEntry.buildingEffects.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-600">
                                          <div className="text-gray-400 text-xs">Building Effects:</div>
                                          {damageEntry.buildingEffects.map((effect, i) => (
                                            <div key={i} className="text-green-300 text-xs">• {effect}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Defense Stats */}
                                  <div className="bg-gray-700 p-2 rounded">
                                    <div className="text-gray-300 font-medium mb-1">Defense Stats:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>Base: <span className="text-purple-300">{baseStats?.defense || 0}</span></div>
                                      <div>Effective: <span className="text-purple-400 font-bold">{stats.defense.toFixed(1)}</span></div>
                                      <div>Multiplier: <span className="text-purple-300">{baseStats?.defense ? (stats.defense / baseStats.defense).toFixed(2) : '1.00'}x</span></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// EconomicSummary component: shows total cost, upkeep, and TEGC for an army
const EconomicSummary = ({ army, kingdomStats, race }: { army: Army; kingdomStats: KingdomStats; race: string }) => {
  const raceKey = race?.toLowerCase() || 'dwarf';
  // Calculate total initial gold cost and TEGC
  const totalInitialGold = getArmyTotalInitialGoldCost(army, raceKey);
  const totalTEGC = getArmyTEGC(army, raceKey);
  // Calculate total upkeep for 48 hours
  let totalGoldUpkeep = 0;
  let totalFoodUpkeep = 0;
  for (const [unit, count] of Object.entries(army)) {
    if (count > 0) {
      const unitData = UNIT_DATA[raceKey][unit];
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
const UnitEfficiencyTable = ({ techLevels, strategy, race }: { techLevels: any; strategy: any; race: string }) => {
  const raceKey = race?.toLowerCase() || 'dwarf';
  // Calculate efficiency for all units
  const unitRows = Object.entries(UNIT_DATA[raceKey] || {}).map(([unit, stats]) => {
    const effectiveStats = getEffectiveUnitStats(unit, raceKey, techLevels, strategy, true, 1);
    const ratios = getUnitEfficiencyRatios(unit, effectiveStats, raceKey);
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
  // List of building keys in in-game order
  const buildingOrder = [
    'Advanced Training Center',
    'Castle',
    'Farm',
    'Forge',
    'Guard House',
    'Guard Towers',
    'House',
    'Market',
    'Medical Center',
    'Mill',
    'Mine',
    'School',
    'Training Center',
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
    if (b === 'House') return 2;
    if (b === 'Guard House') return 0.5;
    if (b === 'Advanced Training Center') return 5 / (land || 20);
    if (b === 'Training Center') return 5 / (land || 20);
    if (b === 'Medical Center') return 0;
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

  // Helper to get building details for display
  const getBuildingDetails = (b: string) => {
    const data = BUILDING_DATA[b];
    if (!data) return '';
    let details = [];
    if (data.optimal_workers) details.push(`Optimal workers: ${data.optimal_workers}`);
    if (data.production_per_day) details.push(`Production/day: ${data.production_per_day}`);
    if (data.housing && Object.keys(data.housing).length > 0) {
      details.push(`Housing: ` + Object.entries(data.housing).map(([type, n]) => `${n} ${type}`).join(', '));
    }
    if (data.per_race_bonus && data.per_race_bonus[race]) {
      const bonus = data.per_race_bonus[race];
      if (bonus.production_per_day) details.push(`(${race} bonus: ${bonus.production_per_day} per day)`);
      if (bonus.housing) details.push(`(${race} bonus: ${bonus.housing} housing)`);
    }
    if (data.defense_bonus) details.push(`Defense bonus: ${data.defense_bonus}`);
    if (data.healing_percent) details.push(`Healing: ${data.healing_percent}%`);
    if (data.unit_production && data.unit_production[race]) {
      const up = data.unit_production[race];
      details.push('Unit production: ' + Object.entries(up).map(([unit, v]) => `${unit}: 1 per ${v.per_building} ${b}`).join(', '));
    }
    return details.join('; ');
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Buildings</h3>
      <p className="text-sm text-purple-300 mb-2">Your builders will work the best they can in order to build {Math.floor((population && population['Building']) ? population['Building'] / 150 : 0)} buildings per day.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-2 text-left">Building</th>
              <th className="p-2 text-left">Details</th>
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
                  <td className="p-2 text-xs text-gray-400" title={getBuildingDetails(b)}>{getBuildingDetails(b)}</td>
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
  // Ensure race is lowercase and defined
  const raceKey = race?.toLowerCase() || 'dwarf';
  
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
    const unitCount = typeof count === 'number' ? count : parseInt(String(count)) || 0;
    if (unitCount > 0 && UNIT_DATA[raceKey]?.[unit]) {
      foodUpkeepUnits += UNIT_DATA[raceKey][unit].upkeep.food * unitCount;
      goldUpkeepUnits += UNIT_DATA[raceKey][unit].upkeep.gold * unitCount;
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
  const [yourArmy, setYourArmy] = useState<Army>(() => getDefaultArmy(RACES[0]));
  const [enemyArmy, setEnemyArmy] = useState<Army>(() => getDefaultArmy(RACES[0]));
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
  const [enemyBuildings, setEnemyBuildings] = useState<any>({ Castle: 2 }); // Default 2 castles for testing castle scaling
  // Add population state for each kingdom
  const [yourPopulation, setYourPopulation] = useState<any>({});
  const [enemyPopulation, setEnemyPopulation] = useState<any>({});
  // Add a race state at the top of the component, e.g.:
  const [race, setRace] = useState<string>('dwarf'); // default to dwarf

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
      20, // maxRounds
      yourBuildings,
      enemyBuildings,
      yourRace,
      enemyRace
    );
    setBattleOutcome(outcome);
  };

  // Auto-calculate KS for your kingdom
  useEffect(() => {
    const newKS = calculateKS(yourArmy, yourBuildings, yourPopulation, yourTechLevels, yourStrategy, yourRace);
    if (yourKingdomStats.KS !== newKS) {
      setYourKingdomStats({ ...yourKingdomStats, KS: newKS });
    }
    // eslint-disable-next-line
  }, [yourArmy, yourBuildings, yourPopulation, yourTechLevels, yourStrategy, yourRace]);
  // Auto-calculate KS for enemy kingdom
  useEffect(() => {
    const newKS = calculateKS(enemyArmy, enemyBuildings, enemyPopulation, enemyTechLevels, enemyStrategy, enemyRace);
    if (enemyKingdomStats.KS !== newKS) {
      setEnemyKingdomStats({ ...enemyKingdomStats, KS: newKS });
    }
    // eslint-disable-next-line
  }, [enemyArmy, enemyBuildings, enemyPopulation, enemyTechLevels, enemyStrategy, enemyRace]);

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

  // When race changes, reset army to 0 for all units of that race
  useEffect(() => {
    setYourArmy(getDefaultArmy(yourRace));
  }, [yourRace]);
  useEffect(() => {
    setEnemyArmy(getDefaultArmy(enemyRace));
  }, [enemyRace]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-gray-100 font-sans p-6 flex flex-col items-center" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="w-full max-w-8xl rounded-2xl bg-gray-900 shadow-lg p-8 mt-8">
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
            <KingdomStatsInput kingdomName="Your Kingdom" stats={yourKingdomStats} setStats={setYourKingdomStats} techLevels={yourTechLevels} setTechLevels={setYourTechLevels} strategy={yourStrategy} setStrategy={setYourStrategy} calculatedPopulation={yourTotalPop} race={yourRace} />
            <ArmyInput
              armyName="Your Army"
              army={yourArmy}
              setArmy={setYourArmy}
              units={getUnitsForRace(yourRace)}
              buildings={yourBuildings}
              race={yourRace}
              techLevels={yourTechLevels}
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
            <EconomicSummary army={yourArmy} kingdomStats={yourKingdomStats} race={yourRace} />
            <UnitEfficiencyTable techLevels={yourTechLevels} strategy={yourStrategy} race={yourRace} />
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
            <KingdomStatsInput kingdomName="Enemy Kingdom" stats={enemyKingdomStats} setStats={setEnemyKingdomStats} techLevels={enemyTechLevels} setTechLevels={setEnemyTechLevels} strategy={enemyStrategy} setStrategy={setEnemyStrategy} calculatedPopulation={enemyTotalPop} race={enemyRace} />
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
            <EconomicSummary army={enemyArmy} kingdomStats={enemyKingdomStats} race={enemyRace} />
            <UnitEfficiencyTable techLevels={enemyTechLevels} strategy={enemyStrategy} race={enemyRace} />
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
        <BattleSimulationDisplay 
          battleOutcome={battleOutcome} 
          yourTechLevels={yourTechLevels}
          yourStrategy={yourStrategy}
          enemyTechLevels={enemyTechLevels}
          enemyStrategy={enemyStrategy}
          yourRace={yourRace}
          enemyRace={enemyRace}
          originalYourArmy={yourArmy}
          originalEnemyArmy={enemyArmy}
        />
      </div>
    </main>
  );
}
