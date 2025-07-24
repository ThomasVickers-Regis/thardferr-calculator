"use client";
import React, { useState, useEffect } from 'react';
import { simulateBattle } from '@/utils/simulateBattle';
import { Army, BattleOutcome, KingdomStats, TechLevels, StrategyName, Buildings } from '@/types';
import '../app/globals.css';
import { UNIT_DATA } from '../data/unitData';
import { TECHNOLOGY_DATA, TECHNOLOGY_TREES, RACE_UNIQUE_TECHS } from '../data/technologyData';
import { STRATEGY_DATA } from '../data/strategyData';
import { getArmyTotalInitialGoldCost, getArmyTEGC } from '../utils/economicHelpers';
import { getEffectiveUnitStats, getStatModifiers } from '../utils/getEffectiveUnitStats';
import { getUnitEfficiencyRatios } from '../utils/economicHelpers';
import { BUILDING_DATA } from '../data/buildingData';
import UnitDetail from './UnitDetail';
import ArmyInput from './ArmyInput';
import KingdomStatsInput from './KingdomStatsInput';
import BuildingTable from './BuildingTable';
import ProjectedProduction from './ProjectedProduction';
import ProjectedWeaponsSummary from './ProjectedWeaponsSummary';
import KingdomSummary from './KingdomSummary';
import PopulationAssignment from './PopulationAssignment';
import BattleReport from './BattleReport';
import EnemyCounterOptimizer from './EnemyCounterOptimizer';

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

// Utility: Calculate KS (Kingdom Strength) based on army and buildings
function calculateKS(army: Army, buildings: Buildings, population: Record<string, number>, techLevels: TechLevels, strategy: StrategyName, race: string) {
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
  const [yourBuildings, setYourBuildings] = useState<Buildings>({});
  const [enemyBuildings, setEnemyBuildings] = useState<Buildings>({});
  // Add population state for each kingdom
  const [yourPopulation, setYourPopulation] = useState<Record<string, number>>({});
  const [enemyPopulation, setEnemyPopulation] = useState<Record<string, number>>({});
  // Add a race state at the top of the component, e.g.:
  const [race, setRace] = useState<string>('dwarf'); // default to dwarf
  // Add building ratios state for each kingdom
  const [yourBuildingRatios, setYourBuildingRatios] = useState<Record<string, number>>({});
  const [enemyBuildingRatios, setEnemyBuildingRatios] = useState<Record<string, number>>({});

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
      setYourBuildings((prev: Buildings) => ({ ...prev, Castle: yourKingdomStats.Castles }));
    }
  }, [yourKingdomStats.Castles]);

  useEffect(() => {
    const currentCastlesInBuildings = enemyBuildings['Castle'] || 0;
    if (enemyKingdomStats.Castles !== currentCastlesInBuildings) {
      setEnemyBuildings((prev: Buildings) => ({ ...prev, Castle: enemyKingdomStats.Castles }));
    }
  }, [enemyKingdomStats.Castles]);

  // Calculate total population for each kingdom
  const calcTotalPop = (buildings: Buildings) => {
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
            <KingdomStatsInput
              kingdomName="Your Kingdom"
              stats={yourKingdomStats}
              setStats={setYourKingdomStats}
              techLevels={yourTechLevels}
              setTechLevels={setYourTechLevels}
              strategy={yourStrategy}
              setStrategy={setYourStrategy}
              calculatedPopulation={yourTotalPop}
              race={yourRace}
            />
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
            {/* Add BuildingTable below ArmyInput */}
            <BuildingTable
              buildings={yourBuildings}
              setBuildings={setYourBuildings}
              land={yourKingdomStats.Land}
              castles={yourKingdomStats.Castles}
              race={yourRace}
              population={yourPopulation}
              setKingdomStats={setYourKingdomStats}
              ratios={yourBuildingRatios}
              setRatios={setYourBuildingRatios}
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
            <KingdomStatsInput
              kingdomName="Enemy Kingdom"
              stats={enemyKingdomStats}
              setStats={setEnemyKingdomStats}
              techLevels={enemyTechLevels}
              setTechLevels={setEnemyTechLevels}
              strategy={enemyStrategy}
              setStrategy={setEnemyStrategy}
              calculatedPopulation={enemyTotalPop}
              race={enemyRace}
            />
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
            {/* Add BuildingTable below ArmyInput */}
            <BuildingTable
              buildings={enemyBuildings}
              setBuildings={setEnemyBuildings}
              land={enemyKingdomStats.Land}
              castles={enemyKingdomStats.Castles}
              race={enemyRace}
              population={enemyPopulation}
              setKingdomStats={setEnemyKingdomStats}
              ratios={enemyBuildingRatios}
              setRatios={setEnemyBuildingRatios}
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
        <BattleReport
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
          yourKingdomStats={yourKingdomStats}
          enemyKingdomStats={enemyKingdomStats}
        />
      </div>
    </main>
  );
}
