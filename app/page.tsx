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
import { getEffectiveUnitStats, getStatModifiers } from '../utils/getEffectiveUnitStats';
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
// Default army: 10 TC units, 0 ATC units, 10 other units per race
const getDefaultArmy = (race: string) => {
  const lower = race.toLowerCase();
  const units = getUnitsForRace(lower);
  const army: Army = {};
  
  // Map race key to building data format (capitalized)
  const buildingRaceKey = lower.charAt(0).toUpperCase() + lower.slice(1);
  
  // Get TC and ATC units for this race
  const tcUnits = Object.keys(BUILDING_DATA['Training Center']?.unit_production?.[buildingRaceKey] || {});
  const atcUnits = Object.keys(BUILDING_DATA['Advanced Training Center']?.unit_production?.[buildingRaceKey] || {});
  
  // Map building unit names to unit data names
  const mapUnitName = (buildingUnitName: string) => {
    const nameMap: Record<string, string> = {
      'Dwarf Hammer Wheilder': 'HammerWheilder',
      'Dwarf Axe Man': 'AxeMan',
      'Dwarf Light Crossbowman': 'LightCrossbowman',
      'Dwarf Heavy Crossbowman': 'HeavyCrossbowman',
      'Dwarf Shieldbearer': 'Shieldbearer',
      'Dwarf Runner': 'Runner',
      'Elf Swordman': 'Swordman',
      'Elf Lanceman': 'Lanceman',
      'Elf Caragous': 'Caragous',
      'Elf Archer': 'Archer',
      'Elf Elite Archer': 'EliteArcher',
      'Elf Mage': 'Mage',
      'Gnome Infantry': 'Infantry',
      'Gnome Militia': 'Militia',
      'Gnome Rider': 'Rider',
      'Gnome Rock Thrower': 'RockThrower',
      'Gnome Catapult': 'Catapult',
      'Gnome Balista': 'Balista',
      'Human Infantry': 'Infantry',
      'Human Pikeman': 'Pikeman',
      'Human Archer': 'Archer',
      'Human Knight': 'Knight',
      'Human Heavy Infantry': 'HeavyInfantry',
      'Human Mounted Archer': 'MountedArcher',
      'Orc Rusher': 'Rusher',
      'Orc Slother': 'Slother',
      'Orc Slinger': 'Slinger',
      'Orc Shadow Warrior': 'ShadowWarrior',
      'Orc Wolf Master': 'WolfMaster',
      'Orc Axe Thrower': 'AxeThrower',
      'Undead Skeleton': 'SkeletalLegion',
      'Undead Zombie': 'SkeletalLegion',
      'Undead Archer': 'PhantomArcher',
      'Undead Dark Knight': 'DarkKnight',
      'Undead Abomination Caragous': 'AbominationCaragous',
      'Undead Wraith Rider': 'WraithRider',
      'Undead Wraith Pikeman': 'WraithPikeman'
    };
    return nameMap[buildingUnitName] || buildingUnitName.replace(/^(Dwarf|Elf|Gnome|Human|Orc|Undead)\s+/, '');
  };
  
  // Map the building unit names to unit data names
  const mappedTcUnits = tcUnits.map(mapUnitName);
  const mappedAtcUnits = atcUnits.map(mapUnitName);
  
  units.forEach(unit => {
    if (mappedTcUnits.includes(unit)) {
      army[unit] = 10; // Training Center units start with 10
    } else if (mappedAtcUnits.includes(unit)) {
      army[unit] = 0; // Advanced Training Center units start with 0
    } else {
      army[unit] = 10; // fallback for any other units
    }
  });
  return army;
};

// ArmyInput component: allows user to set quantities for all unit types
const ArmyInput = ({ armyName, army, setArmy, units, buildings, race, techLevels, strategy }: { armyName: string; army: Army; setArmy: (a: Army) => void; units: string[]; buildings?: any; race?: string; techLevels?: any; strategy?: any }) => {
  // Ensure race is lowercase and defined
  const raceKey = race?.toLowerCase() || 'dwarf';
  
  // Handler for changing unit count
  const handleChange = (unit: string, value: string) => {
    let count = Math.max(0, parseInt(value) || 0);
    
    // Apply Guard House cap if buildings are provided
    if (buildings && buildings['Guard House']) {
      const guardHouses = buildings['Guard House'];
      const maxUnits = guardHouses * 40;
      const currentTotal = Object.values(army).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
      const otherUnits = currentTotal - (army[unit] || 0);
      const maxForThisUnit = Math.max(0, maxUnits - otherUnits);
      
      if (count > maxForThisUnit) {
        count = maxForThisUnit;
      }
    }
    
    setArmy({ ...army, [unit]: count });
  };
  // Unit production estimate summary (if buildings and race are provided)
  const getUnitProductionSummary = () => {
    if (!buildings || !race) return '';
    const unitCounts: Record<string, number> = {};
    // Try different ways to access the buildings
    const tc = buildings['Training Center'] || buildings['training center'] || buildings['TrainingCenter'] || 0;
    const atc = buildings['Advanced Training Center'] || buildings['advanced training center'] || buildings['AdvancedTrainingCenter'] || 0;
    const castle = buildings['Castle'] || buildings['castle'] || 0;
    

    
    // Map building data unit names to unit data names
    const mapUnitName = (buildingUnitName: string) => {
      // Remove race prefix and fix common naming differences
      const nameMap: Record<string, string> = {
        'Dwarf Hammer Wheilder': 'HammerWheilder',
        'Dwarf Axe Man': 'AxeMan',
        'Dwarf Light Crossbowman': 'LightCrossbowman',
        'Dwarf Heavy Crossbowman': 'HeavyCrossbowman',
        'Dwarf Shieldbearer': 'Shieldbearer',
        'Dwarf Runner': 'Runner',
        'Elf Swordman': 'Swordman',
        'Elf Lanceman': 'Lanceman',
        'Elf Caragous': 'Caragous',
        'Elf Archer': 'Archer',
        'Elf Elite Archer': 'EliteArcher',
        'Elf Mage': 'Mage',
        'Gnome Infantry': 'Infantry',
        'Gnome Militia': 'Militia',
        'Gnome Rider': 'Rider',
        'Gnome Rock Thrower': 'RockThrower',
        'Gnome Catapult': 'Catapult',
        'Gnome Balista': 'Balista',
        'Human Infantry': 'Infantry',
        'Human Pikeman': 'Pikeman',
        'Human Archer': 'Archer',
        'Human Knight': 'Knight',
        'Human Heavy Infantry': 'HeavyInfantry',
        'Human Mounted Archer': 'MountedArcher',
        'Orc Rusher': 'Rusher',
        'Orc Slother': 'Slother',
        'Orc Slinger': 'Slinger',
        'Orc Shadow Warrior': 'ShadowWarrior',
        'Orc Wolf Master': 'WolfMaster',
        'Orc Axe Thrower': 'AxeThrower',
        'Undead Skeleton': 'SkeletalLegion',
        'Undead Zombie': 'SkeletalLegion', // Assuming this maps to SkeletalLegion
        'Undead Archer': 'PhantomArcher',
        'Undead Dark Knight': 'DarkKnight',
        'Undead Abomination Caragous': 'AbominationCaragous',
        'Undead Wraith Rider': 'WraithRider',
        'Undead Wraith Pikeman': 'WraithPikeman'
      };
      return nameMap[buildingUnitName] || buildingUnitName.replace(/^(Dwarf|Elf|Gnome|Human|Orc|Undead)\s+/, '');
    };
    
    // Map race key to building data format (capitalized)
    const buildingRaceKey = raceKey.charAt(0).toUpperCase() + raceKey.slice(1);
    
    const tcProd = BUILDING_DATA['Training Center']?.unit_production?.[buildingRaceKey] || {};
    for (const [unit, v] of Object.entries(tcProd)) {
      const mappedUnit = mapUnitName(unit);
      unitCounts[mappedUnit] = Math.floor(tc / v.per_building) * v.per_day;
    }
    const atcProd = BUILDING_DATA['Advanced Training Center']?.unit_production?.[buildingRaceKey] || {};
    for (const [unit, v] of Object.entries(atcProd)) {
      const mappedUnit = mapUnitName(unit);
      unitCounts[mappedUnit] = (unitCounts[mappedUnit] || 0) + Math.floor(atc / v.per_building) * v.per_day;
    }
    for (const unit of Object.keys({ ...tcProd, ...atcProd })) {
      const mappedUnit = mapUnitName(unit);
      unitCounts[mappedUnit] = (unitCounts[mappedUnit] || 0) + castle;
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

  // Guard House cap display
  const guardHouses = buildings?.['Guard House'] || 0;
  const maxUnits = guardHouses * 40;
  const currentTotal = Object.values(army).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);

  // Generate race-specific unit abilities and special rules
  const getRaceSpecificInfo = () => {
    const raceLower = race?.toLowerCase() || 'dwarf';
    const info: string[] = [];
    
    // Dwarf abilities
    if (raceLower === 'dwarf') {
      info.push('Shieldbearer: Protects army from ranged attacks (based on army ratio)');
      info.push('Runner: Attacks in short-range phase with throwing axes');
      info.push('Hammer Wielder: High melee damage, feared by other races');
      info.push('Axe Man: Most powerful dwarf unit, high defense');
    }
    
    // Elf abilities
    if (raceLower === 'elf') {
      info.push('Mage: Invisible to melee attacks (only ranged can damage)');
      info.push('Lanceman: Double damage vs mounted units');
      info.push('Caragous: Attack/defense scales with army percentage');
      info.push('Caragous: Mounted unit (vulnerable to pikemen)');
    }
    
    // Gnome abilities
    if (raceLower === 'gnome') {
      info.push('Infantry: Double damage vs mounted units');
      info.push('Catapult: Requires 5 men to operate');
      info.push('Balista: Requires 4 men to operate');
      info.push('Rider: Best gnomish melee fighter');
    }
    
    // Human abilities
    if (raceLower === 'human') {
      info.push('Pikeman: Double damage vs mounted units');
      info.push('Knight: Short-range charge attack');
      info.push('Mounted Archer: Mounted unit (vulnerable to pikemen)');
    }
    
    // Orc abilities
    if (raceLower === 'orc') {
      info.push('Shadow Warrior: Hiding ability (immune to melee when hidden)');
      info.push('Rusher: Short-range attack with wolf mount');
      info.push('Slother: Short-range attack with wolf mount');
      info.push('Wolf Master: Controls wolf mounts for short-range attacks');
    }
    
    // Undead abilities
    if (raceLower === 'undead') {
      info.push('Skeleton: Immune to ranged attacks');
      info.push('Wraith units: No food upkeep');
      info.push('Abomination Caragous: Mounted unit (vulnerable to pikemen)');
    }
    
    return info;
  };

  const getStrategyAbilities = () => {
    if (!strategy || !STRATEGY_DATA[strategy]) return [];
    
    const strategyData = STRATEGY_DATA[strategy];
    const effects = strategyData.effects;
    const abilities: { text: string; isPositive: boolean }[] = [];
    
    switch (strategy) {
      case 'Archer Protection':
        abilities.push({ text: 'Infantry: -50% melee attack', isPositive: false });
        abilities.push({ text: 'Archers: +defense from infantry damage loss', isPositive: true });
        break;
        
      case 'Infantry Attack':
        abilities.push({ text: 'Infantry: -75% defense', isPositive: false });
        abilities.push({ text: 'Other units: +defense from infantry defense loss', isPositive: true });
        break;
        
      case 'Quick Retreat':
        abilities.push({ text: 'All units: -50% attack', isPositive: false });
        abilities.push({ text: 'Retreats if army falls below 35% of original strength (normal: 17.5%)', isPositive: true });
        break;
        
      case 'Anti-Cavalry':
        abilities.push({ text: 'Pikemen: +250% vs mounted units', isPositive: true });
        abilities.push({ text: 'All units: -10% attack', isPositive: false });
        break;
        
      case 'Dwarf Shield Line':
        abilities.push({ text: 'All units: -10% close combat attack', isPositive: false });
        abilities.push({ text: 'Shieldbearers: +100% melee damage', isPositive: true });
        abilities.push({ text: 'Long range immunity: 2× Shieldbearer ratio', isPositive: true });
        break;
        
      case 'Elf Energy Gathering':
        abilities.push({ text: 'Mages: +100% melee damage', isPositive: true });
        abilities.push({ text: 'Mages: +4 range attack', isPositive: true });
        abilities.push({ text: 'Mages: +2 defense', isPositive: true });
        abilities.push({ text: 'Mages: Lose melee immunity', isPositive: false });
        break;
        
      case 'Gnome Far Fighting':
        abilities.push({ text: 'Range/Short attacks: Doubled for both sides', isPositive: true });
        break;
        
      case 'Human Charging!':
        abilities.push({ text: 'Knights: +50% melee/short attack', isPositive: true });
        abilities.push({ text: 'Knights: -25% defense', isPositive: false });
        break;
        
      case 'Orc Surrounding':
        abilities.push({ text: 'Shadow Warriors: +2 defense', isPositive: true });
        abilities.push({ text: 'Shadow Warriors: Deal damage in short phase', isPositive: true });
        abilities.push({ text: 'Detection chance: +25%', isPositive: false });
        break;
        
      case 'Orc Berserker':
        abilities.push({ text: 'All units: +3 all attacks', isPositive: true });
        abilities.push({ text: 'All units: -50% defense', isPositive: false });
        break;
        
      case 'Orc':
        abilities.push({ text: 'Shadow Warriors: 75% melee immunity (vs 80% normal)', isPositive: false });
        break;
    }
    
    return abilities;
  };

  const raceSpecificInfo = getRaceSpecificInfo();

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">{armyName} Composition</h3>
      {sharperBladesLevel > 0 && (
        <p className="text-sm text-purple-300 mb-1">Sharper Blades: {sharperBladesBonus}</p>
      )}
      {guardHouses > 0 && (
        <p className="text-sm text-purple-300 mb-1">Guard Houses: {currentTotal}/{maxUnits} units (40 per Guard House)</p>
      )}
      {buildings && race && (
        <p className="text-sm text-purple-300 mb-2">
          {getUnitProductionSummary() || 'No Training Centers or Advanced Training Centers built'}
        </p>
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
              const baseStats = UNIT_DATA[raceKey]?.[unit];
              if (!baseStats) return null; // Skip if unit not found for this race
              
              // Get effective stats including technology and strategy bonuses
              const effectiveStats = getEffectiveUnitStats(unit, raceKey, techLevels || {}, strategy, true, 1);
              // Get individual modifiers for display
              const statModifiers = getStatModifiers(unit, raceKey, techLevels || {}, strategy);
              
              return (
                <tr key={unit} className="even:bg-gray-700">
                  <td className="p-2 font-medium" title={unit}>{unit}</td>
                  <td className="p-2">
                    {baseStats.melee}
                    {(() => {
                      const modifiers = [];
                      if (statModifiers.melee.positiveFlat > 0) {
                        modifiers.push(<span key="positiveFlat" className="text-green-400 ml-1">(+{statModifiers.melee.positiveFlat})</span>);
                      }
                      if (statModifiers.melee.positive > 0) {
                        modifiers.push(<span key="positive" className="text-green-400 ml-1">(+{Math.round(statModifiers.melee.positive)}%)</span>);
                      }
                      if (statModifiers.melee.negativeFlat > 0) {
                        modifiers.push(<span key="negativeFlat" className="text-red-400 ml-1">(-{statModifiers.melee.negativeFlat})</span>);
                      }
                      if (statModifiers.melee.negative > 0) {
                        modifiers.push(<span key="negative" className="text-red-400 ml-1">(-{Math.round(statModifiers.melee.negative)}%)</span>);
                      }
                      return modifiers;
                    })()}
                  </td>
                  <td className="p-2">
                    {baseStats.short}
                    {(() => {
                      const modifiers = [];
                      if (statModifiers.short.positiveFlat > 0) {
                        modifiers.push(<span key="positiveFlat" className="text-green-400 ml-1">(+{statModifiers.short.positiveFlat})</span>);
                      }
                      if (statModifiers.short.positive > 0) {
                        modifiers.push(<span key="positive" className="text-green-400 ml-1">(+{Math.round(statModifiers.short.positive)}%)</span>);
                      }
                      if (statModifiers.short.negativeFlat > 0) {
                        modifiers.push(<span key="negativeFlat" className="text-red-400 ml-1">(-{statModifiers.short.negativeFlat})</span>);
                      }
                      if (statModifiers.short.negative > 0) {
                        modifiers.push(<span key="negative" className="text-red-400 ml-1">(-{Math.round(statModifiers.short.negative)}%)</span>);
                      }
                      return modifiers;
                    })()}
                  </td>
                  <td className="p-2">
                    {baseStats.range}
                    {(() => {
                      const modifiers = [];
                      if (statModifiers.range.positiveFlat > 0) {
                        modifiers.push(<span key="positiveFlat" className="text-green-400 ml-1">(+{statModifiers.range.positiveFlat})</span>);
                      }
                      if (statModifiers.range.positive > 0) {
                        modifiers.push(<span key="positive" className="text-green-400 ml-1">(+{Math.round(statModifiers.range.positive)}%)</span>);
                      }
                      if (statModifiers.range.negativeFlat > 0) {
                        modifiers.push(<span key="negativeFlat" className="text-red-400 ml-1">(-{statModifiers.range.negativeFlat})</span>);
                      }
                      if (statModifiers.range.negative > 0) {
                        modifiers.push(<span key="negative" className="text-red-400 ml-1">(-{Math.round(statModifiers.range.negative)}%)</span>);
                      }
                      return modifiers;
                    })()}
                  </td>
                  <td className="p-2">
                    {baseStats.defense}
                    {(() => {
                      const modifiers = [];
                      if (statModifiers.defense.positiveFlat > 0) {
                        modifiers.push(<span key="positiveFlat" className="text-green-400 ml-1">(+{statModifiers.defense.positiveFlat})</span>);
                      }
                      if (statModifiers.defense.positive > 0) {
                        modifiers.push(<span key="positive" className="text-green-400 ml-1">(+{Math.round(statModifiers.defense.positive)}%)</span>);
                      }
                      if (statModifiers.defense.negativeFlat > 0) {
                        modifiers.push(<span key="negativeFlat" className="text-red-400 ml-1">(-{statModifiers.defense.negativeFlat})</span>);
                      }
                      if (statModifiers.defense.negative > 0) {
                        modifiers.push(<span key="negative" className="text-red-400 ml-1">(-{Math.round(statModifiers.defense.negative)}%)</span>);
                      }
                      return modifiers;
                    })()}
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min={0}
                      className={`w-20 p-1 rounded bg-gray-900 text-gray-100 border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        guardHouses > 0 && currentTotal >= maxUnits && (army[unit] || 0) > 0 
                          ? 'border-yellow-500' 
                          : 'border-gray-600'
                      }`}
                      value={army[unit] !== undefined ? army[unit] : 0}
                      onChange={e => handleChange(unit, e.target.value)}
                      title={`Set number of ${unit}${guardHouses > 0 ? ` (Guard House cap: ${maxUnits} total units)` : ''}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {(raceSpecificInfo.length > 0 || getStrategyAbilities().length > 0) && (
        <div className="mt-2">
          <div className="text-xs text-gray-300">
            <span className="font-medium">Special Abilities:</span>
            {raceSpecificInfo.map((info, index) => (
              <div key={`race-${index}`} className="ml-2">• {info}</div>
            ))}
            {getStrategyAbilities().map((ability, index) => (
              <div key={`strategy-${index}`} className={`ml-2 ${ability.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                • {ability.text}
              </div>
            ))}
          </div>
        </div>
      )}
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
    const newValue = parseInt(value) || 0;
    setStats({ ...stats, [field]: newValue });
    
    // If castles changed, update the buildings state to sync castle count
    if (field === 'Castles') {
      // This will be handled by the parent component through useEffect
    }
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
              {['Sharper Blades', 'Tougher Light Armor', 'Tougher Heavy Armor', 'Improve Bow Range'].map(tech => {
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
          {Object.entries(STRATEGY_DATA)
            .filter(([strat, data]) => {
              // Show all General strategies
              if (data.type === 'General') return true;
              // Show race-specific strategy for the current race
              const capitalizedRace = race.charAt(0).toUpperCase() + race.slice(1);
              if (data.type === `${capitalizedRace} Unique`) return true;
              // Show Orc strategies for Orc race (handle both "Orc Unique" and "Orc")
              if (race === 'orc' && (data.type === 'Orc Unique' || strat === 'Orc')) return true;
              return false;
            })
            .map(([strat, data]) => (
              <option key={strat} value={strat}>{strat}</option>
            ))}
        </select>
      </div>
    </div>
  );
};

const BattleSimulationDisplay = ({ battleOutcome, yourTechLevels, yourStrategy, enemyTechLevels, enemyStrategy, yourRace, enemyRace, originalYourArmy, originalEnemyArmy, yourBuildings = {}, enemyBuildings = {} }: { 
  battleOutcome: BattleOutcome | null;
  yourTechLevels: any;
  yourStrategy: any;
  enemyTechLevels: any;
  enemyStrategy: any;
  yourRace: string;
  enemyRace: string;
  originalYourArmy: Army;
  originalEnemyArmy: Army;
  yourBuildings?: any;
  enemyBuildings?: any;
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
  const calculatePhaseStats = (army: any, race: string, techLevels: any = {}, strategy: any = null, isAttacker: boolean = true, phase: string, buildings: any = {}) => {
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

    // Add Combat Technologies modifiers
    if (techLevels['Sharper Blades'] > 0) {
      const level = techLevels['Sharper Blades'];
      modifiers.push(`Sharper Blades: +${level} melee for blade units`);
    }
    
    if (techLevels['Tougher Light Armor'] > 0) {
      const level = techLevels['Tougher Light Armor'];
      modifiers.push(`Tougher Light Armor: +${level} defense for light armor units`);
    }
    
    if (techLevels['Tougher Heavy Armor'] > 0) {
      const level = techLevels['Tougher Heavy Armor'];
      modifiers.push(`Tougher Heavy Armor: +${level} defense for heavy armor units`);
    }
    
    if (techLevels['Improve Bow Range'] > 0) {
      const level = techLevels['Improve Bow Range'];
      modifiers.push(`Improve Bow Range: +${Math.round(level * 50)}% range for bow units`);
    }
    
    // Add any percentage-based technology modifiers here if they exist in the data

    // Add strategy effects from STRATEGY_DATA
    if (strategy && STRATEGY_DATA[strategy]) {
      const strategyData = STRATEGY_DATA[strategy];
      const effects = strategyData.effects;
      
      // Handle specific strategy effects based on phase
      if (strategy === 'Archer Protection' && phase === 'melee') {
        modifiers.push(`Archer Protection: Infantry -${((1 - effects.infantry_attack_multiplier) * 100).toFixed(0)}% melee`);
      }
      if (strategy === 'Archer Protection' && phase === 'range') {
        modifiers.push('Archer Protection: Archers -20% damage when infantry present');
      }
      if (strategy === 'Infantry Attack' && phase === 'melee') {
        if (typeof effects.infantry_damage_multiplier === 'number' && !isNaN(effects.infantry_damage_multiplier)) {
          modifiers.push(`Infantry Attack: Infantry +${((effects.infantry_damage_multiplier - 1) * 100).toFixed(0)}% melee, other units -20%`);
        } else {
          modifiers.push('Infantry Attack: Infantry -75% defense, other units gain redistributed defense');
        }
      }
      if (strategy === 'Quick Retreat') {
        modifiers.push(`Quick Retreat: All attacks -${((1 - effects.all_unit_attack_multiplier) * 100).toFixed(0)}%`);
      }
      if (strategy === 'Anti-Cavalry' && phase === 'melee') {
        modifiers.push(`Anti-Cavalry: Pikemen +${((effects.pikemen_attack_vs_mounted_multiplier - 1) * 100).toFixed(0)}% vs mounted, all units -10%`);
      }
      if (strategy === 'Dwarf Shield Line' && phase === 'melee') {
        modifiers.push(`Dwarf Shield Line: Shieldbearers +${(effects.shieldbearers_close_combat_damage_increase_percent * 100).toFixed(0)}% melee`);
      }
      if (strategy === 'Dwarf Shield Line' && phase === 'range') {
        const totalArmySize = Object.values(army).reduce((sum: number, count: any) => sum + (count || 0), 0);
        const shieldbearerCount = army['Shieldbearer'] || 0;
        if (totalArmySize > 0) {
          const shieldbearerRatio = shieldbearerCount / totalArmySize;
          const immunityPercent = Math.min(100, shieldbearerRatio * 200);
          modifiers.push(`Dwarf Shield Line: ${immunityPercent.toFixed(1)}% long range immunity (${(shieldbearerRatio * 100).toFixed(1)}% Shieldbearers × 2)`);
        }
      }
      if (strategy === 'Elf Energy Gathering' && (phase === 'melee' || phase === 'range')) {
        modifiers.push(`Elf Energy Gathering: Mages +${(effects.wizards_close_combat_damage_multiplier - 1) * 100}% melee, +${effects.wizards_ranged_attack_increase} range${phase === 'melee' ? ', lose melee immunity, +2 melee defense' : ''}`);
      }
      if (strategy === 'Gnome Far Fighting' && (phase === 'range' || phase === 'short')) {
        modifiers.push('Gnome Far Fighting: Range/Short attacks doubled');
      }
      if (strategy === 'Human Charging!' && phase === 'melee') {
        modifiers.push(`Human Charging!: Knights +${((effects.knights_attack_multiplier * effects.knights_damage_multiplier - 1) * 100).toFixed(0)}% melee`);
      }
      if (strategy === 'Orc Surrounding' && phase === 'short') {
        modifiers.push('Orc Surrounding: Shadow Warriors in short phase');
      }
      if (strategy === 'Orc Berserker') {
        modifiers.push(`Orc Berserker: +${effects.all_units_damage_increase} all attacks, -${((1 - 1/effects.all_units_defense_divide_by) * 100).toFixed(0)}% defense`);
      }
      if (strategy === 'Orc' && phase === 'melee') {
        modifiers.push(`Orc: Shadow Warriors ${effects.shadow_warrior_melee_immunity_reduction}% melee immunity (vs 80% normal)`);
      }
    }

    // Add building effects
    if (phase === 'range' && buildings && buildings['Guard Towers'] > 0) {
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

  // Calculate casualties using army state before healing was applied
  const yourCasualties = calculateCasualties(originalYourArmy, battleOutcome.finalYourArmyBeforeHealing);
  
  // For enemy casualties, use the scaled army as the starting point (not the original)
  const enemyCasualties = battleLog.length > 0 
    ? calculateCasualties(battleLog[0].enemyArmy, battleOutcome.finalEnemyArmyBeforeHealing)
    : calculateCasualties(originalEnemyArmy, battleOutcome.finalEnemyArmyBeforeHealing);
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
                  const yourPhaseStats = phaseLog.phase !== 'end' ? calculatePhaseStats(entry.yourArmy, yourRace, yourTechLevels, yourStrategy, true, phaseLog.phase, yourBuildings) : { attack: 0, defense: 0, modifiers: [], buildingEffects: [] };
                  const enemyPhaseStats = phaseLog.phase !== 'end' ? calculatePhaseStats(entry.enemyArmy, enemyRace, enemyTechLevels, enemyStrategy, false, phaseLog.phase, enemyBuildings) : { attack: 0, defense: 0, modifiers: [], buildingEffects: [] };
                  
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
                                <div className="capitalize">{phaseLog.phase}: <span className="font-bold text-blue-400">{isNaN(yourPhaseStats.attack) ? 0 : yourPhaseStats.attack}</span></div>
                                <div>Defense: <span className="font-bold text-blue-400">{isNaN(yourPhaseStats.defense) ? 0 : yourPhaseStats.defense}</span></div>
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
                                                                          <div className="text-blue-400 font-bold">{isNaN(attackValue) ? '0.0' : attackValue.toFixed(1)}</div>
                                  <div className="text-gray-400 text-xs">{isNaN(totalDamage) ? '0' : totalDamage.toFixed(0)}</div>
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
                                        <span className="font-bold text-blue-400">{count} × {isNaN(attackValue) ? '0.0' : attackValue.toFixed(1)} = {isNaN(count as number * attackValue) ? '0.0' : (count as number * attackValue).toFixed(1)}</span>
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
                                <div className="capitalize">{phaseLog.phase}: <span className="font-bold text-red-400">{isNaN(enemyPhaseStats.attack) ? 0 : enemyPhaseStats.attack}</span></div>
                                <div>Defense: <span className="font-bold text-red-400">{isNaN(enemyPhaseStats.defense) ? 0 : enemyPhaseStats.defense}</span></div>
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
                                                                          <div className="text-red-400 font-bold">{isNaN(attackValue) ? '0.0' : attackValue.toFixed(1)}</div>
                                  <div className="text-gray-400 text-xs">{isNaN(totalDamage) ? '0' : totalDamage.toFixed(0)}</div>
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
                                        <span className="font-bold text-red-400">{count} × {isNaN(attackValue) ? '0.0' : attackValue.toFixed(1)} = {isNaN(count as number * attackValue) ? '0.0' : (count as number * attackValue).toFixed(1)}</span>
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
                      Detailed Army Status - Skip for End phase
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
                                        <div>Total Effective Defense: <span className="text-blue-300 font-bold">{((damageEntry.damageMitigated || 0) + (stats.defense * count)).toFixed(1)}</span></div>
                                      </div>
                                      {damageEntry.buildingEffects.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-600">
                                          <div className="text-gray-400 text-xs">Effects:</div>
                                          {damageEntry.buildingEffects.map((effect, i) => (
                                            <div key={i} className="text-green-300 text-xs">• {effect}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Attack Stats */}
                                  <div className="bg-gray-700 p-2 rounded mb-2">
                                    <div className="text-gray-300 font-medium mb-1">Attack Stats:</div>
                                    {phaseLog.phase === 'melee' && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Melee: <span className="text-red-300">{baseStats?.melee || 0}</span></div>
                                        <div>Effective: <span className="text-red-400 font-bold">{stats.melee?.toFixed(1)}</span></div>
                                        <div>Multiplier: <span className="text-red-300">{baseStats?.melee ? (stats.melee / baseStats.melee).toFixed(2) : '1.00'}x</span></div>
                                        <div>Total: <span className="text-red-400 font-bold">{(stats.melee * count).toFixed(1)}</span></div>
                                      </div>
                                    )}
                                    {phaseLog.phase === 'short' && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Short: <span className="text-orange-300">{baseStats?.short || 0}</span></div>
                                        <div>Effective: <span className="text-orange-400 font-bold">{stats.short?.toFixed(1)}</span></div>
                                        <div>Multiplier: <span className="text-orange-300">{baseStats?.short ? (stats.short / baseStats.short).toFixed(2) : '1.00'}x</span></div>
                                        <div>Total: <span className="text-orange-400 font-bold">{(stats.short * count).toFixed(1)}</span></div>
                                      </div>
                                    )}
                                    {phaseLog.phase === 'range' && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Range: <span className="text-blue-300">{baseStats?.range || 0}</span></div>
                                        <div>Effective: <span className="text-blue-400 font-bold">{stats.range?.toFixed(1)}</span></div>
                                        <div>Multiplier: <span className="text-blue-300">{baseStats?.range ? (stats.range / baseStats.range).toFixed(2) : '1.00'}x</span></div>
                                        <div>Total: <span className="text-blue-400 font-bold">{(stats.range * count).toFixed(1)}</span></div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Defense Stats */}
                                  <div className="bg-gray-700 p-2 rounded">
                                    <div className="text-gray-300 font-medium mb-1">Defense Stats:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>Base: <span className="text-purple-300">{baseStats?.defense || 0}</span></div>
                                      <div>Effective: <span className="text-purple-400 font-bold">{stats.defense.toFixed(1)}</span></div>
                                      <div>Multiplier: <span className="text-purple-300">{baseStats?.defense ? (stats.defense / baseStats.defense).toFixed(2) : '1.00'}x</span></div>
                                      <div>Total Defense: <span className="text-purple-400 font-bold">{(stats.defense * count).toFixed(1)}</span></div>
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
                                          <div className="text-gray-400 text-xs">Effects:</div>
                                          {damageEntry.buildingEffects.map((effect, i) => (
                                            <div key={i} className="text-green-300 text-xs">• {effect}</div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Attack Stats */}
                                  <div className="bg-gray-700 p-2 rounded mb-2">
                                    <div className="text-gray-300 font-medium mb-1">Attack Stats:</div>
                                    {phaseLog.phase === 'melee' && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Melee: <span className="text-red-300">{baseStats?.melee || 0}</span></div>
                                        <div>Effective: <span className="text-red-400 font-bold">{stats.melee?.toFixed(1)}</span></div>
                                        <div>Multiplier: <span className="text-red-300">{baseStats?.melee ? (stats.melee / baseStats.melee).toFixed(2) : '1.00'}x</span></div>
                                        <div>Total: <span className="text-red-400 font-bold">{(stats.melee * count).toFixed(1)}</span></div>
                                      </div>
                                    )}
                                    {phaseLog.phase === 'short' && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Short: <span className="text-orange-300">{baseStats?.short || 0}</span></div>
                                        <div>Effective: <span className="text-orange-400 font-bold">{stats.short?.toFixed(1)}</span></div>
                                        <div>Multiplier: <span className="text-orange-300">{baseStats?.short ? (stats.short / baseStats.short).toFixed(2) : '1.00'}x</span></div>
                                        <div>Total: <span className="text-orange-400 font-bold">{(stats.short * count).toFixed(1)}</span></div>
                                      </div>
                                    )}
                                    {phaseLog.phase === 'range' && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>Range: <span className="text-blue-300">{baseStats?.range || 0}</span></div>
                                        <div>Effective: <span className="text-blue-400 font-bold">{stats.range?.toFixed(1)}</span></div>
                                        <div>Multiplier: <span className="text-blue-300">{baseStats?.range ? (stats.range / baseStats.range).toFixed(2) : '1.00'}x</span></div>
                                        <div>Total: <span className="text-blue-400 font-bold">{(stats.range * count).toFixed(1)}</span></div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Defense Stats */}
                                  <div className="bg-gray-700 p-2 rounded">
                                    <div className="text-gray-300 font-medium mb-1">Defense Stats:</div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div>Base: <span className="text-purple-300">{baseStats?.defense || 0}</span></div>
                                      <div>Effective: <span className="text-purple-400 font-bold">{stats.defense.toFixed(1)}</span></div>
                                      <div>Multiplier: <span className="text-purple-300">{baseStats?.defense ? (stats.defense / baseStats.defense).toFixed(2) : '1.00'}x</span></div>
                                      <div>Total Defense: <span className="text-purple-400 font-bold">{(stats.defense * count).toFixed(1)}</span></div>
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

// EnemyCounterOptimizer: Analyzes enemy army and recommends optimal counter composition
const EnemyCounterOptimizer = ({ 
  yourArmy, yourKingdomStats, yourRace, yourTechLevels, yourStrategy, yourBuildings,
  enemyArmy, enemyKingdomStats, enemyRace, enemyTechLevels, enemyStrategy, enemyBuildings
}: { 
  yourArmy: Army; yourKingdomStats: KingdomStats; yourRace: string; yourTechLevels: any; yourStrategy: any; yourBuildings: any;
  enemyArmy: Army; enemyKingdomStats: KingdomStats; enemyRace: string; enemyTechLevels: any; enemyStrategy: any; enemyBuildings: any;
}) => {
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
    
    const effectiveStats = getEffectiveUnitStats(unit, enemyRaceKey, enemyTechLevels || {}, enemyStrategy || null, false, count);
    
    return {
      unit,
      count,
      baseStats,
      effectiveStats,
      totalRangeDamage: effectiveStats.range * count,
      totalShortDamage: effectiveStats.short * count,
      totalMeleeDamage: effectiveStats.melee * count,
      totalDefense: effectiveStats.defense * count,
      // Check for special abilities
      isRangedImmune: unit.includes('Skeleton') || unit.includes('Phantom'),
      isMeleeImmune: unit.includes('Mage'),
      hasGuardTower: enemyKingdomStats.GuardTower > 0
    };
  }).filter(Boolean);
  
  // Calculate enemy phase distribution
  const enemyPhaseDamage = {
    range: enemyAnalysis.reduce((sum, unit) => sum + (unit?.totalRangeDamage || 0), 0),
    short: enemyAnalysis.reduce((sum, unit) => sum + (unit?.totalShortDamage || 0), 0),
    melee: enemyAnalysis.reduce((sum, unit) => sum + (unit?.totalMeleeDamage || 0), 0)
  };
  
  const totalEnemyDamage = enemyPhaseDamage.range + enemyPhaseDamage.short + enemyPhaseDamage.melee;
  const enemyRangePercentage = totalEnemyDamage > 0 ? (enemyPhaseDamage.range / totalEnemyDamage) * 100 : 0;
  const enemyMeleePercentage = totalEnemyDamage > 0 ? (enemyPhaseDamage.melee / totalEnemyDamage) * 100 : 0;
  
  // Get your available units
  const yourUnits = Object.entries(UNIT_DATA[yourRaceKey] || {}).map(([unit, baseStats]) => {
    const effectiveStats = getEffectiveUnitStats(unit, yourRaceKey, yourTechLevels || {}, yourStrategy || null, true, 1);
    
    // Calculate costs
    const baseCost = baseStats.base_gold_cost || 0;
    const equipmentCost = baseStats.equipment_gold_cost || 0;
    const totalCost = baseCost + equipmentCost;
    
    // Calculate 48h upkeep
    const goldUpkeep48h = (baseStats.upkeep.gold || 0) * 2;
    const foodUpkeep48h = (baseStats.upkeep.food || 0) * 2;
    const totalUpkeep48h = goldUpkeep48h + foodUpkeep48h;
    
    // Efficiency metrics
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
  
  // Determine counter strategy based on enemy composition and kingdom data
  let counterStrategy = 'balanced';
  let strategyReason = '';
  let rangedStrategy = '';
  let meleeStrategy = '';
  
  // Check enemy kingdom defenses (using actual building data)
  const enemyGuardTowers = enemyBuildings?.['Guard Tower'] || 0;
  const enemyMedicalCenters = enemyBuildings?.['Medical Center'] || 0;
  const enemyCastles = enemyKingdomStats.Castles || 0;
  
  // Check your kingdom capabilities
  const yourGuardTowers = yourBuildings?.['Guard Tower'] || 0;
  const yourMedicalCenters = yourBuildings?.['Medical Center'] || 0;
  const yourCastles = yourKingdomStats.Castles || 0;
  
  // Calculate building recommendations to counter enemy efficiently
  const buildingRecommendations = [];
  
  // Calculate optimal Guard Towers needed
  if (enemyRangePercentage > 40) {
    const enemyRangedDamage = enemyPhaseDamage.range;
    const guardTowersNeeded = Math.ceil(enemyRangedDamage / 100); // 1 Guard Tower per 100 ranged damage
    const optimalGuardTowers = Math.min(guardTowersNeeded, 3); // Cap at 3 to avoid waste
    const additionalGuardTowers = Math.max(0, optimalGuardTowers - yourGuardTowers);
    
    if (additionalGuardTowers > 0) {
      buildingRecommendations.push(`Build ${additionalGuardTowers} Guard Tower(s) to reduce enemy ranged damage by ~${additionalGuardTowers * 50}%`);
    }
  }
  
  // Calculate optimal Medical Centers needed
  if (enemyMeleePercentage > 60) {
    const enemyMeleeDamage = enemyPhaseDamage.melee;
    const medicalCentersNeeded = Math.ceil(enemyMeleeDamage / 200); // 1 Medical Center per 200 melee damage
    const optimalMedicalCenters = Math.min(medicalCentersNeeded, 2); // Cap at 2 to avoid waste
    const additionalMedicalCenters = Math.max(0, optimalMedicalCenters - yourMedicalCenters);
    
    if (additionalMedicalCenters > 0) {
      buildingRecommendations.push(`Build ${additionalMedicalCenters} Medical Center(s) to reduce melee damage by ${additionalMedicalCenters * 50}`);
    }
  }
  
  // Calculate requirements for each strategy
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
  
  // Determine best strategy based on feasibility
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
  
  // Generate optimal counter army
  const generateCounterArmy = () => {
    const counterArmy: any = {};
    let remainingSlots = availableSlots;
    let totalCost = 0;
    let totalUpkeep = 0;
    
    // Calculate budget based on your kingdom's economic capabilities
    const yourFarms = yourBuildings?.['Farm'] || 0;
    const yourMines = yourBuildings?.['Mine'] || 0;
    
    // Estimate available budget (more realistic calculation)
    const farmIncome = yourFarms * 50; // 50 gold per farm per hour
    const mineIncome = yourMines * 100; // 100 gold per mine per hour
    const totalHourlyIncome = farmIncome + mineIncome;
    const estimatedBudget = totalHourlyIncome * 24; // 24 hours of income (more realistic timeframe)
    
    // Sort units based on counter strategy
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
    
    // Fill available slots with best units, considering budget
    sortedUnits.forEach(unit => {
      if (remainingSlots > 0 && totalCost < estimatedBudget) {
        // Calculate how many units we can afford
        const remainingBudget = estimatedBudget - totalCost;
        const maxAffordable = Math.floor(remainingBudget / unit.totalCost);
        const unitsToAdd = Math.min(remainingSlots, maxAffordable, 25); // Cap at 25 per unit type
        
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
  
  // Calculate current army upkeep
  const currentArmyUpkeep = {
    gold: 0,
    food: 0,
    total: 0
  };
  
  Object.entries(yourArmy).forEach(([unit, count]) => {
    const unitCount = count || 0;
    const baseStats = UNIT_DATA[yourRaceKey]?.[unit];
    if (baseStats) {
      currentArmyUpkeep.gold += (baseStats.upkeep.gold || 0) * unitCount * 2; // 48h
      currentArmyUpkeep.food += (baseStats.upkeep.food || 0) * unitCount * 2; // 48h
    }
  });
  currentArmyUpkeep.total = currentArmyUpkeep.gold + currentArmyUpkeep.food;
  
  // Calculate expected battle outcome
  const calculateBattleOutcome = () => {
    // Your current army + recommended additions
    const yourTotalArmy = { ...yourArmy };
    Object.entries(optimalCounter.counterArmy).forEach(([unit, count]) => {
      yourTotalArmy[unit] = (yourTotalArmy[unit] || 0) + (count as number);
    });
    
    // Calculate your total damage by phase
    const yourPhaseDamage = { range: 0, short: 0, melee: 0 };
    yourUnits.forEach(unit => {
      const count = yourTotalArmy[unit.unit] || 0;
      yourPhaseDamage.range += unit.rangeDamage * count;
      yourPhaseDamage.short += unit.shortDamage * count;
      yourPhaseDamage.melee += unit.meleeDamage * count;
    });
    
    const yourTotalDamage = yourPhaseDamage.range + yourPhaseDamage.short + yourPhaseDamage.melee;
    
    return {
      yourDamage: yourTotalDamage,
      enemyDamage: totalEnemyDamage,
      advantage: yourTotalDamage - totalEnemyDamage,
      rangeAdvantage: yourPhaseDamage.range - enemyPhaseDamage.range,
      meleeAdvantage: yourPhaseDamage.melee - enemyPhaseDamage.melee
    };
  };
  
  const battleOutcome = calculateBattleOutcome();
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Enemy Counter Optimizer</h3>
      
            {/* Enemy Analysis */}
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
      
      {/* Counter Strategy Analysis */}
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
      
      {/* Your Capacity & Economy */}
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
      
      {/* Recommended Counter Army */}
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
      
      {/* Battle Prediction */}
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
    </div>
  );
};

// GuardHouseOptimizer component: optimizes army to max out Guard Houses while staying under upkeep
const GuardHouseOptimizer = ({ army, kingdomStats, race, techLevels, strategy }: { army: Army; kingdomStats: KingdomStats; race: string; techLevels: any; strategy: any }) => {
  const raceKey = race?.toLowerCase() || 'dwarf';
  
  // Get Guard House capacity
  const guardHouses = kingdomStats.GuardHouse || 0;
  const maxUnits = guardHouses * 40; // 40 units per Guard House
  
  // Calculate current army stats
  const currentTotalUnits = Object.values(army).reduce((sum, count) => sum + (count || 0), 0);
  
  // Calculate unit efficiency for Guard House optimization
  const unitEfficiency = Object.entries(UNIT_DATA[raceKey] || {}).map(([unit, baseStats]) => {
    const effectiveStats = getEffectiveUnitStats(unit, raceKey, techLevels, strategy, true, 1);
    
    // Calculate costs
    const baseCost = baseStats.base_gold_cost || 0;
    const equipmentCost = baseStats.equipment_gold_cost || 0;
    const totalCost = baseCost + equipmentCost;
    
    // Calculate 48h upkeep
    const goldUpkeep48h = (baseStats.upkeep.gold || 0) * 2;
    const foodUpkeep48h = (baseStats.upkeep.food || 0) * 2;
    const totalUpkeep48h = goldUpkeep48h + foodUpkeep48h;
    
    // Phase-specific damage
    const rangeDamage = effectiveStats.range;
    const shortDamage = effectiveStats.short;
    const meleeDamage = effectiveStats.melee;
    
    // Efficiency metrics
    const damagePerGold = totalCost > 0 ? (rangeDamage + shortDamage + meleeDamage) / totalCost : 0;
    const damagePerUpkeep = totalUpkeep48h > 0 ? (rangeDamage + shortDamage + meleeDamage) / totalUpkeep48h : 0;
    
    return {
      unit,
      effectiveStats,
      totalCost,
      totalUpkeep48h,
      damagePerGold,
      damagePerUpkeep,
      rangeDamage,
      shortDamage,
      meleeDamage,
      defense: effectiveStats.defense
    };
  });
  
  // Sort units by different criteria
  const bestDamagePerGold = [...unitEfficiency].sort((a, b) => b.damagePerGold - a.damagePerGold);
  const bestDamagePerUpkeep = [...unitEfficiency].sort((a, b) => b.damagePerUpkeep - a.damagePerUpkeep);
  const bestRangeDamage = [...unitEfficiency].filter(u => u.rangeDamage > 0).sort((a, b) => b.rangeDamage - a.rangeDamage);
  const bestMeleeDamage = [...unitEfficiency].filter(u => u.meleeDamage > 0).sort((a, b) => b.meleeDamage - a.meleeDamage);
  
  // Generate Guard House optimization recommendations
  const recommendations = [];
  
  // Check if army is at capacity
  if (currentTotalUnits >= maxUnits) {
    recommendations.push({
      type: 'warning',
      title: 'Guard House at Capacity',
      description: `You have ${currentTotalUnits}/${maxUnits} units. Consider upgrading units for better efficiency.`,
      impact: 'Cannot add more units without more Guard Houses'
    });
  } else {
    const remainingSlots = maxUnits - currentTotalUnits;
    recommendations.push({
      type: 'info',
      title: 'Available Slots',
      description: `You have ${remainingSlots} unit slots remaining in your Guard Houses.`,
      impact: 'Can add more units for increased damage output'
    });
  }
  
  // Phase stacking recommendations
  const currentPhaseDamage = {
    range: 0,
    short: 0,
    melee: 0
  };
  
  unitEfficiency.forEach(unit => {
    const count = army[unit.unit] || 0;
    currentPhaseDamage.range += unit.rangeDamage * count;
    currentPhaseDamage.short += unit.shortDamage * count;
    currentPhaseDamage.melee += unit.meleeDamage * count;
  });
  
  const totalDamage = currentPhaseDamage.range + currentPhaseDamage.short + currentPhaseDamage.melee;
  const rangePercentage = totalDamage > 0 ? (currentPhaseDamage.range / totalDamage) * 100 : 0;
  const shortPercentage = totalDamage > 0 ? (currentPhaseDamage.short / totalDamage) * 100 : 0;
  const meleePercentage = totalDamage > 0 ? (currentPhaseDamage.melee / totalDamage) * 100 : 0;
  
  // Recommend phase stacking
  if (rangePercentage > 50) {
    recommendations.push({
      type: 'recommendation',
      title: 'Ranged-Focused Army',
      description: `${rangePercentage.toFixed(1)}% of damage is ranged. Good against enemies with weak ranged defense.`,
      impact: 'Effective against enemies without Guard Towers or ranged immunity'
    });
  } else if (meleePercentage > 50) {
    recommendations.push({
      type: 'recommendation',
      title: 'Melee-Focused Army',
      description: `${meleePercentage.toFixed(1)}% of damage is melee. Good for overwhelming enemy defense.`,
      impact: 'Strong in close combat, vulnerable to ranged attacks'
    });
  } else {
    recommendations.push({
      type: 'warning',
      title: 'Mixed Damage Army',
      description: 'Damage is spread across phases. Consider focusing on one phase for better effectiveness.',
      impact: 'Less effective than concentrated damage in one phase'
    });
  }
  
  // Generate optimal army composition
  const generateOptimalArmy = (focus: 'range' | 'melee' | 'balanced') => {
    const optimalArmy: any = {};
    let remainingSlots = maxUnits - currentTotalUnits;
    let totalCost = 0;
    
    if (focus === 'range') {
      // Focus on ranged units
      bestRangeDamage.forEach(unit => {
        if (remainingSlots > 0 && unit.totalCost <= 1000) { // Budget constraint
          const maxUnitsForThis = Math.min(remainingSlots, Math.floor(1000 / unit.totalCost));
          if (maxUnitsForThis > 0) {
            optimalArmy[unit.unit] = maxUnitsForThis;
            remainingSlots -= maxUnitsForThis;
            totalCost += maxUnitsForThis * unit.totalCost;
          }
        }
      });
    } else if (focus === 'melee') {
      // Focus on melee units
      bestMeleeDamage.forEach(unit => {
        if (remainingSlots > 0 && unit.totalCost <= 1000) {
          const maxUnitsForThis = Math.min(remainingSlots, Math.floor(1000 / unit.totalCost));
          if (maxUnitsForThis > 0) {
            optimalArmy[unit.unit] = maxUnitsForThis;
            remainingSlots -= maxUnitsForThis;
            totalCost += maxUnitsForThis * unit.totalCost;
          }
        }
      });
    } else {
      // Balanced approach
      bestDamagePerGold.forEach(unit => {
        if (remainingSlots > 0 && unit.totalCost <= 500) {
          const maxUnitsForThis = Math.min(remainingSlots, Math.floor(500 / unit.totalCost));
          if (maxUnitsForThis > 0) {
            optimalArmy[unit.unit] = maxUnitsForThis;
            remainingSlots -= maxUnitsForThis;
            totalCost += maxUnitsForThis * unit.totalCost;
          }
        }
      });
    }
    
    return { optimalArmy, totalCost, remainingSlots };
  };
  
  const rangedArmy = generateOptimalArmy('range');
  const meleeArmy = generateOptimalArmy('melee');
  const balancedArmy = generateOptimalArmy('balanced');
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Guard House Optimizer</h3>
      
      {/* Guard House Status */}
      <div className="mb-4 p-3 bg-gray-750 rounded">
        <h4 className="font-medium text-blue-300 mb-2">Guard House Status</h4>
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
              <span>{currentTotalUnits}</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between">
              <span>Available Slots:</span>
              <span>{Math.max(0, maxUnits - currentTotalUnits)}</span>
            </div>
            <div className="flex justify-between">
              <span>Capacity Used:</span>
              <span>{maxUnits > 0 ? ((currentTotalUnits / maxUnits) * 100).toFixed(1) : '0'}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Phase Damage Distribution */}
      <div className="mb-4 p-3 bg-gray-750 rounded">
        <h4 className="font-medium text-green-300 mb-2">Current Phase Distribution</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-purple-300">Ranged: {rangePercentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">{currentPhaseDamage.range.toFixed(0)} damage</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-orange-300">Short: {shortPercentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">{currentPhaseDamage.short.toFixed(0)} damage</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-300">Melee: {meleePercentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">{currentPhaseDamage.melee.toFixed(0)} damage</div>
          </div>
        </div>
      </div>
      
      {/* Top Units by Efficiency */}
      <div className="mb-4 p-3 bg-gray-750 rounded">
        <h4 className="font-medium text-yellow-300 mb-2">Top Units by Efficiency</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-purple-300">Best Damage/Gold:</div>
            <div className="text-xs text-gray-400">
              {bestDamagePerGold.slice(0, 3).map((unit, i) => (
                <div key={unit.unit}>{i + 1}. {unit.unit} ({unit.damagePerGold.toFixed(3)})</div>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium text-blue-300">Best Damage/Upkeep:</div>
            <div className="text-xs text-gray-400">
              {bestDamagePerUpkeep.slice(0, 3).map((unit, i) => (
                <div key={unit.unit}>{i + 1}. {unit.unit} ({unit.damagePerUpkeep.toFixed(2)})</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Optimal Army Compositions */}
      <div className="mb-4 p-3 bg-gray-750 rounded">
        <h4 className="font-medium text-cyan-300 mb-2">Optimal Army Compositions</h4>
        <div className="space-y-3">
          <div className="p-2 bg-purple-900 rounded">
            <div className="font-medium text-purple-300">Ranged-Focused Army</div>
            <div className="text-xs text-gray-400">
              {Object.entries(rangedArmy.optimalArmy).map(([unit, count]) => `${unit}: ${count}`).join(', ')}
            </div>
            <div className="text-xs text-gray-400">Cost: {rangedArmy.totalCost.toFixed(0)} gold, Slots: {rangedArmy.remainingSlots}</div>
          </div>
          <div className="p-2 bg-red-900 rounded">
            <div className="font-medium text-red-300">Melee-Focused Army</div>
            <div className="text-xs text-gray-400">
              {Object.entries(meleeArmy.optimalArmy).map(([unit, count]) => `${unit}: ${count}`).join(', ')}
            </div>
            <div className="text-xs text-gray-400">Cost: {meleeArmy.totalCost.toFixed(0)} gold, Slots: {meleeArmy.remainingSlots}</div>
          </div>
          <div className="p-2 bg-green-900 rounded">
            <div className="font-medium text-green-300">Balanced Army</div>
            <div className="text-xs text-gray-400">
              {Object.entries(balancedArmy.optimalArmy).map(([unit, count]) => `${unit}: ${count}`).join(', ')}
            </div>
            <div className="text-xs text-gray-400">Cost: {balancedArmy.totalCost.toFixed(0)} gold, Slots: {balancedArmy.remainingSlots}</div>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mb-4 p-3 bg-gray-750 rounded">
        <h4 className="font-medium text-orange-300 mb-2">Optimization Recommendations</h4>
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div key={i} className={`p-2 rounded text-sm ${
              rec.type === 'warning' ? 'bg-red-900 text-red-200' : 
              rec.type === 'recommendation' ? 'bg-green-900 text-green-200' : 
              'bg-blue-900 text-blue-200'
            }`}>
              <div className="font-medium">{rec.title}</div>
              <div className="text-xs text-gray-300">{rec.description}</div>
              <div className="text-xs text-gray-400">Impact: {rec.impact}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs text-gray-400">
        <div className="font-medium">Optimization Strategy:</div>
        <div className="ml-2">• Focus on one damage phase for maximum effectiveness</div>
        <div className="ml-2">• Ranged units excel against enemies with weak ranged defense</div>
        <div className="ml-2">• Melee units are strong for overwhelming enemy defense</div>
        <div className="ml-2">• Avoid spreading damage across multiple phases</div>
      </div>
    </div>
  );
};


// BuildingTable component: shows and edits building counts for a kingdom
const BuildingTable = ({ buildings, setBuildings, land, castles, race, population, setKingdomStats }: any) => {
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
  const prevLandRef = React.useRef(land);

  // Max buildings allowed (excluding Castle)
  const maxBuildings = (land || 0) * 10;

  // Calculate counts from ratios and land
  const autoCounts: any = {};
  buildingOrder.forEach(b => {
    autoCounts[b] = Math.floor((ratios[b] ?? getDefaultRatio(b)) * (land || 0));
  });

  // Helper: get default ratio for a building
  function getDefaultRatio(b: string) {
    if (b === 'Castle') {
      // For castles, use the current castle count from kingdom stats if available
      const currentCastles = castles || 1;
      return land ? currentCastles / land : 1 / (land || 20);
    }
    if (b === 'House') return 2;
    if (b === 'Guard House') return 0.5;
    if (b === 'Guard Towers') return 0;
    if (b === 'Advanced Training Center') return 5 / (land || 20);
    if (b === 'Training Center') return 5 / (land || 20);
    if (b === 'Medical Center') return 0;
    return 10 / (land || 20);
  }

  // On land/race change, update counts from ratios unless manually overridden
  React.useEffect(() => {
    // Only update if land actually changed
    if (land === prevLandRef.current && Object.keys(buildings).length > 0) {
      return;
    }
    
    const newBuildings: any = {};
    
    // Calculate current ratios from existing buildings (if we have buildings and land)
    const currentRatios: any = {};
    if (land && Object.keys(buildings).length > 0) {
      buildingOrder.forEach(b => {
        const currentCount = buildings[b] || 0;
        currentRatios[b] = Math.round((currentCount / (prevLandRef.current || land)) * 100) / 100;
      });
    }
    
    // Set all buildings (manual or auto)
    buildingOrder.forEach(b => {
      if (manualOverride[b]) {
        newBuildings[b] = buildings[b] || 0;
      } else if (b === 'Castle') {
        // For castles, always use the kingdom stats castle count
        newBuildings[b] = castles || 1;
      } else {
        // Use existing ratio if available, otherwise use default
        const ratioToUse = currentRatios[b] !== undefined ? currentRatios[b] : (ratios[b] !== undefined ? ratios[b] : getDefaultRatio(b));
        newBuildings[b] = Math.floor(ratioToUse * (land || 0));
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
    
    // Update ratios to reflect the new counts
    const updatedRatios: any = {};
    buildingOrder.forEach(b => {
      if (land) {
        updatedRatios[b] = Math.round((newBuildings[b] / land) * 100) / 100;
      }
    });
    setRatios(updatedRatios);
    
    // Update the ref
    prevLandRef.current = land;
    
    // eslint-disable-next-line
  }, [land, castles, race]);

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
      // Update kingdom stats when castle count changes
      if (setKingdomStats) {
        setKingdomStats((prev: any) => ({ ...prev, Castles: count }));
      }
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
      <p className="text-sm text-purple-300 mt-2">
        Land: {land || 0} | Buildings: {buildingsUsed}/{maxBuildings} | Castles: {currentCastles}/{castleCap} | Ratio: {ratioSum.toFixed(2)}/10.00 {overMax ? '(OVER MAX!)' : ''}
      </p>
      <p className="text-xs text-gray-400 mt-1">You cannot exceed 10 buildings per land (excluding Castle). Castles do not count toward the building cap. Max castles: floor(land / 7) + 1. Ratios are buildings per land (e.g., 2.00 = 2 per land).</p>
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
      <p className="text-sm text-purple-300 mb-2">
        If your blacksmiths go to work right away, they will be able to build: {summary} per day.
      </p>
    </div>
  );
};

// Update PopulationAssignment for Training, Building, Blacksmithing
// Helper function to calculate optimal population assignments
const calculateOptimalPopulation = (buildings: any, totalPop: number) => {
  const optimal: any = {};
  
  // Calculate optimal for each job
  for (const job of JOBS) {
    if (job.key === 'Training' || job.key === 'Exploration') {
      optimal[job.key] = 0; // These are set manually
    } else if (job.key === 'Building') {
      optimal[job.key] = (buildings['Building'] || 0) * 150;
    } else if (job.key === 'Blacksmithing') {
      optimal[job.key] = (buildings['Forge'] || 0) * 80;
    } else if (job.key === 'Agriculture') {
      optimal[job.key] = (buildings['Farm'] || 0) * 60;
    } else {
      const eff = JOB_EFFICIENCY[job.key];
      if (eff) {
        optimal[job.key] = (buildings[eff.building] || 0) * eff.optimal;
      } else {
        optimal[job.key] = 0;
      }
    }
  }
  
  // Ensure we don't exceed total population
  const totalOptimal = Object.values(optimal).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
  if (totalOptimal > totalPop) {
    // Scale down proportionally
    const scale = totalPop / totalOptimal;
    for (const job of JOBS) {
      optimal[job.key] = Math.floor(optimal[job.key] * scale);
    }
  }
  
  return optimal;
};

const PopulationAssignment = ({ population, setPopulation, buildings, totalPop }: any) => {
  const prevTotalPopRef = React.useRef(totalPop);
  const prevBuildingsRef = React.useRef(buildings);
  const [efficiencyValues, setEfficiencyValues] = React.useState<any>({});
  
  // Set optimal population assignments when component mounts or buildings change
  useEffect(() => {
    const currentTotal = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
    
    // Check if buildings actually changed by comparing key building counts
    const buildingsChanged = () => {
      const keyBuildings = ['House', 'Farm', 'Forge', 'Building'];
      for (const building of keyBuildings) {
        const current = buildings[building] || 0;
        const previous = prevBuildingsRef.current[building] || 0;
        if (current !== previous) {
          return true;
        }
      }
      return false;
    };
    
    if (currentTotal === 0 && totalPop > 0) {
      // Initial load - set optimal population
      const optimalPopulation = calculateOptimalPopulation(buildings, totalPop);
      setPopulation(optimalPopulation);
    } else if (currentTotal > 0 && totalPop > 0 && buildingsChanged()) {
      // Buildings changed - preserve efficiency ratios
      const newPopulation: any = {};
      
      // Use stored efficiency values or calculate current ones
      const efficiencyRatios: any = {};
      JOBS.forEach(job => {
        if (efficiencyValues[job.key] !== undefined) {
          // Use stored efficiency value
          efficiencyRatios[job.key] = efficiencyValues[job.key];
        } else {
          // Calculate current efficiency for initial load
          if (job.key === 'Training' || job.key === 'Exploration') {
            efficiencyRatios[job.key] = population[job.key] || 0;
          } else if (job.key === 'Building') {
            const currentAssigned = population[job.key] || 0;
            efficiencyRatios[job.key] = Math.floor(currentAssigned / 150);
          } else {
            const buildingsForJob = getBuildings(job.key);
            if (buildingsForJob > 0) {
              const currentAssigned = population[job.key] || 0;
              efficiencyRatios[job.key] = Math.floor(currentAssigned / buildingsForJob);
            } else {
              efficiencyRatios[job.key] = 0;
            }
          }
        }
      });
      
      // Apply efficiency ratios to new building counts
      JOBS.forEach(job => {
        if (job.key === 'Training' || job.key === 'Exploration') {
          // Preserve absolute numbers for Training/Exploration
          newPopulation[job.key] = efficiencyRatios[job.key] || 0;
        } else if (job.key === 'Building') {
          // Apply building efficiency (workers per 150)
          const buildingEfficiency = efficiencyRatios[job.key] || 0;
          newPopulation[job.key] = buildingEfficiency * 150;
        } else {
          // Apply efficiency per building for other jobs
          const buildingsForJob = getBuildings(job.key);
          if (buildingsForJob > 0 && efficiencyRatios[job.key] !== undefined) {
            newPopulation[job.key] = buildingsForJob * efficiencyRatios[job.key];
          } else {
            // If no buildings, keep efficiency at 0
            newPopulation[job.key] = 0;
          }
        }
      });
      
      // Update stored efficiency values to match what we're applying
      const newEfficiencyValues: any = {};
      JOBS.forEach(job => {
        newEfficiencyValues[job.key] = efficiencyRatios[job.key] || 0;
      });
      setEfficiencyValues(newEfficiencyValues);
      
      // Ensure we don't exceed total population
      const newTotal = Object.values(newPopulation).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
      if (newTotal > totalPop) {
        // Scale down proportionally
        const scale = totalPop / newTotal;
        for (const job of JOBS) {
          newPopulation[job.key] = Math.floor(newPopulation[job.key] * scale);
        }
      }
      
      setPopulation(newPopulation);
    }
    
    // Update the ref
    prevBuildingsRef.current = buildings;
  }, [buildings, totalPop, setPopulation]);

  // Capture efficiency values when they're first set (for initial load)
  useEffect(() => {
    const currentTotal = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
    
    // If we have population assigned but no stored efficiency values, capture them
    if (currentTotal > 0 && Object.keys(efficiencyValues).length === 0) {
      const initialEfficiencyValues: any = {};
      
      JOBS.forEach(job => {
        if (job.key === 'Training' || job.key === 'Exploration') {
          initialEfficiencyValues[job.key] = population[job.key] || 0;
        } else if (job.key === 'Building') {
          const currentAssigned = population[job.key] || 0;
          initialEfficiencyValues[job.key] = Math.floor(currentAssigned / 150);
        } else {
          const buildingsForJob = getBuildings(job.key);
          if (buildingsForJob > 0) {
            const currentAssigned = population[job.key] || 0;
            initialEfficiencyValues[job.key] = Math.floor(currentAssigned / buildingsForJob);
          } else {
            initialEfficiencyValues[job.key] = 0;
          }
        }
      });
      
      setEfficiencyValues(initialEfficiencyValues);
    }
  }, [population, efficiencyValues]);



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
    // Use stored efficiency value if available
    if (efficiencyValues[job] !== undefined) {
      return efficiencyValues[job];
    }
    
    // Otherwise calculate from current population
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
    
    // Update efficiency value based on new assignment
    if (job === 'Training' || job === 'Exploration') {
      setEfficiencyValues((prev: any) => ({ ...prev, [job]: val }));
    } else if (job === 'Building') {
      const eff = Math.floor(val / 150);
      setEfficiencyValues((prev: any) => ({ ...prev, [job]: eff }));
    } else {
      const buildingsForJob = getBuildings(job);
      if (buildingsForJob > 0) {
        const eff = Math.floor(val / buildingsForJob);
        setEfficiencyValues((prev: any) => ({ ...prev, [job]: eff }));
      }
    }
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
    setEfficiencyValues((prev: any) => ({ ...prev, Building: eff }));
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
    setEfficiencyValues((prev: any) => ({ ...prev, [job]: eff }));
  };
  // Total assigned
  const totalAssigned = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Population Assignment</h3>
      <p className="text-sm text-purple-300 mb-2">Total Assigned: {totalAssigned} / {totalPop}</p>
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
      <div className="mt-2 space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-400">Both Assigned and Efficiency are editable and kept in sync.</p>
          <button
            onClick={() => {
              const optimalPopulation = calculateOptimalPopulation(buildings, totalPop);
              setPopulation(optimalPopulation);
            }}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition"
            title="Reset to optimal population assignments"
          >
            Reset to Optimal
          </button>
        </div>
        <div className="text-xs text-gray-300">
          <span className="font-medium">Efficiency Formula:</span>
          <div className="ml-2">• Building: assigned/150 workers</div>
          <div className="ml-2">• Blacksmithing: assigned/forges</div>
          <div className="ml-2">• Training/Exploration: 1:1 ratio</div>
          <div className="ml-2">• Others: assigned/buildings (rounded down)</div>
        </div>
      </div>
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
    else maxPop += n * 10;  // All other buildings provide 10 population each
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
  const [enemyBuildings, setEnemyBuildings] = useState<any>({}); // Start empty like your army side
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

  // Sync castle counts between kingdom stats and buildings (one-way sync to avoid loops)
  useEffect(() => {
    const currentCastlesInBuildings = yourBuildings['Castle'] || 0;
    if (yourKingdomStats.Castles !== currentCastlesInBuildings) {
      setYourBuildings((prev: any) => ({ ...prev, Castle: yourKingdomStats.Castles }));
    }
  }, [yourKingdomStats.Castles]);

  useEffect(() => {
    const currentCastlesInBuildings = enemyBuildings['Castle'] || 0;
    if (enemyKingdomStats.Castles !== currentCastlesInBuildings) {
      setEnemyBuildings((prev: any) => ({ ...prev, Castle: enemyKingdomStats.Castles }));
    }
  }, [enemyKingdomStats.Castles]);

  // Calculate total population for each kingdom
  const calcTotalPop = (buildings: any) => {
    let total = 0;
    for (const [b, count] of Object.entries(buildings)) {
      const n = typeof count === 'number' ? count : parseInt(count as string) || 0;
      if (b === 'House') total += n * 100;
      else if (b === 'Castle') total += n * 10;
      else total += n * 10;  // All other buildings provide 10 population each
    }
    return total;
  };
  const yourTotalPop = calcTotalPop(yourBuildings);
  const enemyTotalPop = calcTotalPop(enemyBuildings);

  // Initialize enemy buildings and population to start empty like your army side
  useEffect(() => {
    // Reset enemy buildings to empty state to match your army side behavior
    if (Object.keys(enemyBuildings).length > 1) {
      setEnemyBuildings({ Castle: 1 });
    }
    // Reset enemy population to empty state to match your army side behavior
    if (Object.keys(enemyPopulation).length > 0) {
      setEnemyPopulation({});
    }
  }, []);

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
              strategy={yourStrategy}
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
              setKingdomStats={setYourKingdomStats}
            />
                    <EnemyCounterOptimizer 
          yourArmy={yourArmy} 
          yourKingdomStats={yourKingdomStats} 
          yourRace={yourRace} 
          yourTechLevels={yourTechLevels} 
          yourStrategy={yourStrategy}
          yourBuildings={yourBuildings}
          enemyArmy={enemyArmy} 
          enemyKingdomStats={enemyKingdomStats} 
          enemyRace={enemyRace} 
          enemyTechLevels={enemyTechLevels} 
          enemyStrategy={enemyStrategy}
          enemyBuildings={enemyBuildings}
        />
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
              buildings={enemyBuildings}
              race={enemyRace}
              techLevels={enemyTechLevels}
              strategy={enemyStrategy}
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
              setKingdomStats={setEnemyKingdomStats}
            />
                    <EnemyCounterOptimizer 
          yourArmy={enemyArmy} 
          yourKingdomStats={enemyKingdomStats} 
          yourRace={enemyRace} 
          yourTechLevels={enemyTechLevels} 
          yourStrategy={enemyStrategy}
          yourBuildings={enemyBuildings}
          enemyArmy={yourArmy} 
          enemyKingdomStats={yourKingdomStats} 
          enemyRace={yourRace} 
          enemyTechLevels={yourTechLevels} 
          enemyStrategy={yourStrategy}
          enemyBuildings={yourBuildings}
        />
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
          yourBuildings={yourBuildings}
          enemyBuildings={enemyBuildings}
        />
      </div>
    </main>
  );
}
