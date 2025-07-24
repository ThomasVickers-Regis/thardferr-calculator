import React, { useEffect, useRef, useState } from 'react';
import { BUILDING_DATA, BuildingData } from '../data/buildingData';
import { Buildings, KingdomStats } from '@/types';

interface BuildingTableProps {
  buildings: Buildings;
  setBuildings: React.Dispatch<React.SetStateAction<Buildings>>;
  land: number;
  castles: number;
  race: string;
  population: Record<string, number>;
  setKingdomStats: React.Dispatch<React.SetStateAction<KingdomStats>>;
  ratios: Record<string, number>;
  setRatios: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

const DEFAULT_RATIOS: Record<string, number> = {
  'House': 2,
  'Farm': 1,
  'Forge': 0.5,
  'Guard House': 0.5,
  'Guard Towers': 0,
  'Market': 0.5,
  'Medical Center': 0,
  'Mill': 0.5,
  'Mine': 0.5,
  'School': 0.5,
  'Training Center': 0.25,
  'Advanced Training Center': 0.25,
  'Castle': 0 // handled separately
};

const BuildingTable: React.FC<BuildingTableProps> = ({ buildings, setBuildings, land, castles, race, population, setKingdomStats, ratios, setRatios }) => {
  // Manual override state
  const [manualOverride, setManualOverride] = useState<Record<string, boolean>>({});
  const prevLandRef = useRef(land);

  // Helper: get default ratio for a building
  function getDefaultRatio(b: string) {
    if (b in DEFAULT_RATIOS) return DEFAULT_RATIOS[b];
    return 1;
  }

  // Building order and caps
  const buildingOrder = Object.keys(BUILDING_DATA);
  const maxBuildings = land ? land * 10 : 0;
  const buildingsUsed = Object.entries(buildings).filter(([b]) => b !== 'Castle').reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : 0), 0);
  const currentCastles = buildings['Castle'] || 0;
  const castleCap = land ? Math.floor(land / 7) + 1 : 0;
  const ratioSum = Object.entries(ratios).filter(([b]) => b !== 'Castle').reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : parseFloat(v as string) || 0), 0);
  const overMax = ratioSum > 10;

  // Auto-fill logic: update building counts from ratios when land changes or ratios change (unless manually overridden)
  useEffect(() => {
    if (land === prevLandRef.current && Object.keys(buildings).length > 0) return;
    const newBuildings: Record<string, number> = {};
    const currentRatios: Record<string, number> = {};
    if (land && Object.keys(buildings).length > 0) {
      buildingOrder.forEach(b => {
        const currentCount = buildings[b] || 0;
        currentRatios[b] = Math.round((currentCount / (prevLandRef.current || land)) * 100) / 100;
      });
    }
    buildingOrder.forEach(b => {
      if (manualOverride[b]) {
        newBuildings[b] = buildings[b] || 0;
      } else if (b === 'Castle') {
        newBuildings[b] = castles || 1;
      } else {
        const ratioToUse = currentRatios[b] !== undefined ? currentRatios[b] : (ratios[b] !== undefined ? ratios[b] : getDefaultRatio(b));
        newBuildings[b] = Math.floor(ratioToUse * (land || 0));
      }
    });
    // Cap non-castle buildings
    const nonCastleOrder = buildingOrder.filter(b => b !== 'Castle');
    let nonCastleUsed = 0;
    nonCastleOrder.forEach(b => { nonCastleUsed += newBuildings[b]; });
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
    // Update ratios to reflect new counts
    const updatedRatios: Record<string, number> = {};
    buildingOrder.forEach(b => {
      if (land) updatedRatios[b] = Math.round((newBuildings[b] / land) * 100) / 100;
    });
    setRatios(updatedRatios);
    prevLandRef.current = land;
  }, [land, castles, race]);

  // Handler for changing ratio
  const handleRatioChange = (b: string, value: string) => {
    let ratio = Math.max(0, Math.round((parseFloat(value) || 0) * 100) / 100);
    if (b === 'Castle') {
      const maxCastles = Math.floor((land || 0) / 7) + 1;
      const maxCastleRatio = land ? maxCastles / land : 0;
      if (ratio > maxCastleRatio) ratio = maxCastleRatio;
      setRatios({ ...ratios, [b]: ratio });
      setBuildings({ ...buildings, [b]: Math.floor(ratio * (land || 0)) });
      setManualOverride({ ...manualOverride, [b]: false });
      return;
    }
    const otherRatios = (Object.entries(ratios) as [string, number | string][]) 
      .filter(([key]) => key !== 'Castle' && key !== b)
      .reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : parseFloat(v as string) || 0), 0);
    if (otherRatios + ratio > 10) ratio = Math.max(0, 10 - otherRatios);
    let newCount = Math.floor(ratio * (land || 0));
    const otherCounts = Object.entries(buildings).filter(([key]) => key !== 'Castle' && key !== b).reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : 0), 0);
    if (otherCounts + newCount > maxBuildings) {
      newCount = Math.max(0, maxBuildings - otherCounts);
      ratio = Math.round((newCount / (land || 1)) * 100) / 100;
    }
    setRatios({ ...ratios, [b]: ratio });
    setBuildings({ ...buildings, [b]: newCount });
    setManualOverride({ ...manualOverride, [b]: false });
  };
  // Handler for changing count (manual override)
  const handleCountChange = (b: string, value: string) => {
    let count = Math.max(0, parseInt(value) || 0);
    if (b === 'Castle') {
      if (count > castleCap) count = castleCap;
      if (setKingdomStats) setKingdomStats((prev: KingdomStats) => ({ ...prev, Castles: count }));
    } else {
      const otherCounts = Object.entries(buildings).filter(([key]) => key !== 'Castle' && key !== b).reduce((sum, [_, v]) => sum + (typeof v === 'number' ? v : 0), 0);
      if (otherCounts + count > maxBuildings) count = Math.max(0, maxBuildings - otherCounts);
    }
    setBuildings({ ...buildings, [b]: count });
    setManualOverride({ ...manualOverride, [b]: true });
    setRatios({ ...ratios, [b]: Math.round((count / (land || 1)) * 100) / 100 });
  };

  // Helper to get building details
  const getBuildingDetails = (b: string) => {
    const data = BUILDING_DATA[b];
    if (!data) return '';
    const details = [];
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

export default BuildingTable; 