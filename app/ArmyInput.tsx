import React from 'react';
import { UNIT_DATA } from '../data/unitData';
import { BUILDING_DATA } from '../data/buildingData';
import { getEffectiveUnitStats, getStatModifiers } from '../utils/getEffectiveUnitStats';
import { STRATEGY_DATA } from '../data/strategyData';
import { Army, TechLevels, StrategyName, Buildings } from '@/types';

interface ArmyInputProps {
  armyName: string;
  army: Army;
  setArmy: React.Dispatch<React.SetStateAction<Army>>;
  units: string[];
  buildings?: Buildings;
  race?: string;
  techLevels?: TechLevels;
  strategy?: StrategyName | null;
  enemyStrategy?: StrategyName | null;
  enemyArmy?: Army; // Add enemy army for Caragous scaling
}

const ArmyInput: React.FC<ArmyInputProps> = ({ armyName, army, setArmy, units, buildings, race, techLevels, strategy, enemyStrategy = null, enemyArmy = {} }) => {
  const raceKey = race?.toLowerCase() || 'dwarf';
  // Guard House cap display
  const guardHouses = buildings?.['Guard House'] || 0;
  const maxUnits = guardHouses * 40;
  const currentTotal = Object.values(army).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);

  // Handler for changing unit count
  const handleChange = (unit: string, value: string) => {
    let count = Math.max(0, parseInt(value) || 0);
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
    const tc = buildings['Training Center'] || buildings['training center'] || buildings['TrainingCenter'] || 0;
    const atc = buildings['Advanced Training Center'] || buildings['advanced training center'] || buildings['AdvancedTrainingCenter'] || 0;
    const castle = buildings['Castle'] || buildings['castle'] || 0;
    const mapUnitName = (buildingUnitName: string) => {
      const nameMap: Record<string, string> = {
        'Dwarf Hammer Wheilder': 'HammerWheilder',
        'Dwarf Axe Man': 'AxeMan',
        'Dwarf Light Crossbowman': 'LightCrossbowman',
        'Dwarf HeavyCrossbowman': 'HeavyCrossbowman',
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
      .filter(([, n]) => n > 0)
      .map(([unit, n]) => `${n} ${unit}`)
      .join(', ');
    return summary ? `You can currently train ${summary} per day.` : '';
  };

  // Special abilities and strategy info
  const getRaceSpecificInfo = () => {
    const raceLower = raceKey;
    const info: string[] = [];
    if (raceLower === 'dwarf') {
      info.push('Shieldbearer: Protects army from ranged attacks (based on army ratio)');
      info.push('Runner: Attacks in short-range phase with throwing axes');
      info.push('Hammer Wielder: High melee damage, feared by other races');
      info.push('Axe Man: Most powerful dwarf unit, high defense');
    }
    if (raceLower === 'elf') {
      info.push('Mage: Invisible to melee attacks (only ranged can damage)');
      info.push('Lanceman: Double damage vs mounted units');
      info.push('Caragous: Attack/defense scales with army percentage');
      info.push('Caragous: Mounted unit (vulnerable to pikemen)');
    }
    if (raceLower === 'gnome') {
      info.push('Infantry: Double damage vs mounted units');
      info.push('Catapult: Requires 5 men to operate');
      info.push('Balista: Requires 4 men to operate');
      info.push('Rider: Best gnomish melee fighter');
    }
    if (raceLower === 'human') {
      info.push('Pikeman: Double damage vs mounted units');
      info.push('Knight: Short-range charge attack');
      info.push('Mounted Archer: Mounted unit (vulnerable to pikemen)');
    }
    if (raceLower === 'orc') {
      info.push('Shadow Warrior: Hiding ability (immune to melee when hidden)');
      info.push('Rusher: Short-range attack with wolf mount');
      info.push('Slother: Short-range attack with wolf mount');
      info.push('Wolf Master: Controls wolf mounts for short-range attacks');
    }
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

              // Use getEffectiveUnitStats for display values, with special case for Orc Surrounding + ShadowWarrior
              // For enemy army, pass yourStrategy as enemyStrategy; for your army, pass enemyStrategy as enemyStrategy
              // Pass enemyArmy for Caragous scaling effect
              const stats = getEffectiveUnitStats(unit, raceKey, techLevels, strategy, true, 1, enemyStrategy, army, enemyArmy);
              const statModifiers = getStatModifiers(unit, raceKey, techLevels || {}, strategy);
              // Add WolfMaster bonus to short positiveFlat for Rusher/Slother (Orc only)
              let shortWolfBonus = 0;
              if (raceKey === 'orc' && (unit === 'Rusher' || unit === 'Slother')) {
                const wolfMasterCount = army['WolfMaster'] || 0;
                const unitCount = army[unit] || 0;
                if (unitCount > 0 && wolfMasterCount > 0) {
                  shortWolfBonus = wolfMasterCount / unitCount;
                }
              }
              const displayShortPositiveFlat = statModifiers.short.positiveFlat + shortWolfBonus;
              const isOrcSurroundingShadowWarrior = strategy === 'Orc Surrounding' && unit === 'ShadowWarrior';
              
              // Calculate Caragous scaling bonus for display
              let caragousMeleeBonus = 0;
              let caragousDefenseBonus = 0;
              if (unit === 'Caragous' && raceKey === 'elf' && enemyArmy && Object.keys(enemyArmy).length > 0) {
                const enemyTotalUnits = Object.values(enemyArmy).reduce((sum, count) => sum + count, 0);
                const caragousCount = army[unit] || 0;
                if (enemyTotalUnits > 0 && caragousCount > 0) {
                  const enemyPercentage = (caragousCount / enemyTotalUnits);
                  const scalingFactor = Math.min(1.0, enemyPercentage) * 100;
                  caragousMeleeBonus = Math.floor(scalingFactor) / 10;
                  caragousDefenseBonus = Math.floor(scalingFactor) / 10;
                }
              }

              return (
                <tr key={unit} className="even:bg-gray-700">
                  <td className="p-2 font-medium" title={unit}>{unit}</td>
                  <td className="p-2 text-center">
                    <span className="text-white font-bold">{stats.melee}</span>
                    {isOrcSurroundingShadowWarrior && (
                      <span className="text-red-400 ml-1">(-{baseStats.melee})</span>
                    )}
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
                      // Add Caragous scaling bonus
                      if (caragousMeleeBonus > 0) {
                        modifiers.push(<span key="caragous" className="text-green-400 ml-1">(+{caragousMeleeBonus})</span>);
                      }
                      return modifiers;
                    })()}
                  </td>
                  <td className="p-2 text-center">
                    <span className="text-white font-bold">{stats.short}</span>
                    {isOrcSurroundingShadowWarrior && (
                      <span className="text-green-400 ml-1">(+{baseStats.melee})</span>
                    )}
                    {(() => {
                      const modifiers = [];
                      if (displayShortPositiveFlat > 0) {
                        modifiers.push(<span key="positiveFlat" className="text-green-400 ml-1">(+{displayShortPositiveFlat})</span>);
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
                  <td className="p-2 text-center">{stats.range}
                    {stats.rangeModifier && (
                      <span className="text-green-400 ml-1">(+{stats.rangeModifier}%)</span>
                    )}
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
                  <td className="p-2 text-center">{stats.defense}
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
                      // Add Caragous scaling bonus
                      if (caragousDefenseBonus > 0) {
                        modifiers.push(<span key="caragous" className="text-green-400 ml-1">(+{caragousDefenseBonus})</span>);
                      }
                      return modifiers;
                    })()}
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min={0}
                      className="w-16 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                      value={army[unit] ?? 0}
                      onChange={e => handleChange(unit, e.target.value)}
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
              <div key={`strategy-${index}`} className={`ml-2 ${ability.isPositive ? 'text-green-400' : 'text-red-400'}`}>• {ability.text}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArmyInput; 