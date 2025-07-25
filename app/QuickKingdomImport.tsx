import React, { useState } from 'react';
import { Army, Buildings, KingdomStats } from '@/types';
import { BUILDING_DATA } from '../data/buildingData';

interface QuickKingdomImportProps {
  setArmy: (army: Army) => void;
  setBuildings: (buildings: Buildings) => void;
  setStats: (stats: KingdomStats) => void;
  army: Army;
  buildings: Buildings;
  stats: KingdomStats;
  label?: string;
  setRace?: (race: string) => void; // Optional, for auto-detecting race
  onAfterImport?: (buildings: Buildings, stats: Partial<KingdomStats>, army: Army) => void;
}

// Known units by race for detection
const RACE_UNITS: Record<string, string[]> = {
  Dwarf: ['HammerWheilder', 'AxeMan', 'LightCrossbowman', 'HeavyCrossbowman', 'Shieldbearer', 'Runner'],
  Elf: ['Swordman', 'Lanceman', 'Caragous', 'Archer', 'EliteArcher', 'Mage'],
  Gnome: ['Infantry', 'Militia', 'Rider', 'RockThrower', 'Catapult', 'Balista'],
  Human: ['Infantry', 'Pikeman', 'Archer', 'Knight', 'HeavyInfantry', 'MountedArcher'],
  Orc: ['Rusher', 'Slother', 'Slinger', 'ShadowWarrior', 'WolfMaster', 'AxeThrower'],
  Undead: ['SkeletalLegion', 'PhantomArcher', 'DarkKnight', 'AbominationCaragous', 'WraithRider', 'WraithPikeman'],
};

function detectRace(army: Army): string | null {
  let bestMatch: string | null = null;
  let maxMatches = 0;
  for (const [race, units] of Object.entries(RACE_UNITS)) {
    let matches = 0;
    for (const unit of units) {
      if (army[unit] !== undefined) matches++;
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = race;
    }
  }
  return bestMatch;
}

// Build a mapping of all possible building name variants to canonical keys
const CANONICAL_BUILDING_KEYS = Object.keys(BUILDING_DATA);
const BUILDING_NAME_MAP: Record<string, string> = {};
CANONICAL_BUILDING_KEYS.forEach(key => {
  BUILDING_NAME_MAP[key.toLowerCase()] = key;
  BUILDING_NAME_MAP[key.replace(/\s+/g, '').toLowerCase()] = key;
  BUILDING_NAME_MAP[key.replace(/\s+/g, '').toLowerCase().replace('house', 'house')] = key;
  // Add more variants as needed
});
// Add common manual variants
BUILDING_NAME_MAP['guardtower'] = 'Guard Towers';
BUILDING_NAME_MAP['guardtowers'] = 'Guard Towers';
BUILDING_NAME_MAP['guard house'] = 'Guard House';
BUILDING_NAME_MAP['guardhouse'] = 'Guard House';
BUILDING_NAME_MAP['medicalcenter'] = 'Medical Center';
BUILDING_NAME_MAP['medical center'] = 'Medical Center';
BUILDING_NAME_MAP['trainingcenter'] = 'Training Center';
BUILDING_NAME_MAP['advancedtrainingcenter'] = 'Advanced Training Center';

function parseKingdomText(text: string) {
  const army: Army = {};
  const buildings: Buildings = {};
  const stats: Partial<KingdomStats> = {};
  let errors: string[] = [];

  // Army
  const armyMatch = text.match(/Army:([\s\S]*?)(?=Buildings:|$)/i);
  if (armyMatch) {
    const armyStr = armyMatch[1];
    const unitPairs = armyStr.split(',');
    for (const pair of unitPairs) {
      const m = pair.match(/([A-Za-z ]+):\s*(\d+)/);
      if (m) {
        const name = m[1].trim().replace(/\s+/g, '');
        army[name] = parseInt(m[2], 10);
      }
    }
  } else {
    errors.push('Could not find Army section.');
  }

  // Buildings
  const buildingsMatch = text.match(/Buildings:([\s\S]*?)(?=Resources:|$)/i);
  if (buildingsMatch) {
    const bldStr = buildingsMatch[1].replace(/ and /gi, ', ');
    const bldPairs = bldStr.split(',');
    for (const pair of bldPairs) {
      const m = pair.match(/([A-Za-z ]+):\s*(\d+)/);
      if (m) {
        let name = m[1].trim();
        // Normalize to canonical key
        const canonical = BUILDING_NAME_MAP[name.toLowerCase().replace(/\s+/g, '')] || name;
        buildings[canonical] = parseInt(m[2], 10);
      }
    }
  } else {
    errors.push('Could not find Buildings section.');
  }

  // Resources
  const resourcesMatch = text.match(/Resources:([\s\S]*)/i);
  if (resourcesMatch) {
    const resStr = resourcesMatch[1];
    const resPairs = resStr.split(',');
    for (const pair of resPairs) {
      const m = pair.match(/([A-Za-z ]+):\s*(\d+)/);
      if (m) {
        const name = m[1].trim();
        stats[name] = parseInt(m[2], 10);
      }
    }
  }

  // Estimate Land if not present
  if (stats['Land'] === undefined && Object.keys(buildings).length > 0) {
    const totalBuildings = Object.values(buildings).reduce((a, b) => a + b, 0);
    stats['Land'] = Math.ceil(totalBuildings / 10);
  }

  return { army, buildings, stats, errors };
}

const QuickKingdomImport: React.FC<QuickKingdomImportProps> = ({ setArmy, setBuildings, setStats, army, buildings, stats, label, setRace, onAfterImport }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exportText, setExportText] = useState<string>('');

  const handleImport = () => {
    const { army, buildings, stats, errors } = parseKingdomText(input);
    if (errors.length > 0) {
      setError(errors.join(' '));
      return;
    }
    setArmy(army);
    setBuildings(buildings);
    setStats({ ...stats } as KingdomStats);
    if (setRace) {
      const detected = detectRace(army);
      if (detected) setRace(detected);
    }
    if (onAfterImport) {
      onAfterImport(buildings, stats, army);
    }
    setError(null);
  };

  // Helper to format export text
  const formatKingdomExport = () => {
    // Army
    const armyEntries = Object.entries(army || {}).filter(([_, v]) => v > 0);
    const armyStr = armyEntries.length > 0
      ? 'Army: ' + armyEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
      : '';
    // Buildings (always include all canonical keys, even if 0)
    const buildingEntries = CANONICAL_BUILDING_KEYS.map(k => [k, buildings[k] ?? 0]);
    const buildingsStr = buildingEntries.length > 0
      ? 'Buildings: ' + buildingEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
      : '';
    // Resources (stats)
    const resourceKeys = Object.keys(stats || {}).filter(k => k !== 'KS' && k !== 'Land' && k !== 'Castles');
    const resourceEntries = [
      ...(typeof stats?.Land === 'number' ? [['Land', stats.Land]] : []),
      ...(typeof stats?.Castles === 'number' ? [['Castles', stats.Castles]] : []),
      ...resourceKeys.map(k => [k, stats[k]])
    ].filter(([_, v]) => v !== undefined && v !== null && v !== '');
    const resourcesStr = resourceEntries.length > 0
      ? 'Resources: ' + resourceEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
      : '';
    // Combine
    return [armyStr, buildingsStr, resourcesStr].filter(Boolean).join('\n');
  };

  const handleExport = () => {
    const exportStr = formatKingdomExport();
    setExportText(exportStr);
    setInput(exportStr); // Show export in the same textarea
  };

  const handleCopy = () => {
    if (exportText) {
      navigator.clipboard.writeText(exportText);
    }
  };

  // Show Copy button only if exportText is present
  const showCopy = !!exportText;

  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-md font-semibold mb-2">{label || 'Quick Import'}</h3>
      {/* Button row: Import left, Export right */}
      <div className="flex justify-between mb-2">
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-4 rounded-lg transition"
          onClick={handleImport}
        >
          Import
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded-lg transition"
          onClick={handleExport}
        >
          Export
        </button>
      </div>
      <textarea
        className="w-full p-2 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
        rows={4}
        placeholder="Paste your kingdom data here..."
        value={input}
        onChange={e => {
          setInput(e.target.value);
          setExportText(''); // Clear exportText if user edits
        }}
      />
      {showCopy && (
        <button
          className="bg-gray-700 hover:bg-gray-800 text-white font-semibold py-1 px-4 rounded-lg transition mb-2"
          onClick={handleCopy}
          type="button"
        >
          Copy
        </button>
      )}
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
    </div>
  );
};

export default QuickKingdomImport; 