import React, { useState } from 'react';
import { Army, Buildings, KingdomStats } from '@/types';

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
        // Normalize to match BUILDING_DATA keys
        if (name === 'Guard Tower') name = 'Guard Towers';
        buildings[name] = parseInt(m[2], 10);
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

const QuickKingdomImport: React.FC<QuickKingdomImportProps> = ({ setArmy, setBuildings, setStats, label, setRace, onAfterImport }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
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
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-md font-semibold mb-2">{label || 'Quick Import'}</h3>
      <textarea
        className="w-full p-2 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
        rows={4}
        placeholder="Paste your kingdom data here..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-4 rounded-lg transition mb-2"
        onClick={handleImport}
      >
        Import
      </button>
      {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
    </div>
  );
};

export default QuickKingdomImport; 