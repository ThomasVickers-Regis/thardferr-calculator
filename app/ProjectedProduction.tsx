import React from 'react';
import { UNIT_DATA } from '../data/unitData';
import { Army } from '@/types';
import { BUILDING_DATA } from '../data/buildingData';

interface ProjectedProductionProps {
  population: Record<string, number>;
  buildings: Record<string, number>;
  army: Army;
  land: number;
  race: string;
  techLevels?: Record<string, number | boolean>;
}

const ProjectedProduction: React.FC<ProjectedProductionProps> = ({ population, buildings, army, land, race, techLevels = {} }) => {
  const raceKey = race?.toLowerCase() || 'dwarf';
  const get = (b: string) => typeof buildings[b] === 'number' ? buildings[b] : parseInt(buildings[b] || '0', 10) || 0;
  let maxPop = 0;
  for (const [b, count] of Object.entries(buildings)) {
    const n = typeof count === 'number' ? count : parseInt(count as string) || 0;
    if (b === 'House') maxPop += n * 100;
    else if (b === 'Castle') maxPop += n * 10;
    else maxPop += n * 10;
  }
  const totalPop = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
  // Mine: Use BUILDING_DATA and per_race_bonus
  const mines = get('Mine');
  const minePop = population['Mine'] || 0;
  let mineOpt = BUILDING_DATA['Mine'].optimal_workers || 100;
  let mineMax = 200; // If you want to make this dynamic, add to BUILDING_DATA
  // Machinery technology decreases optimal workers for mines from 100 to 85
  const hasMachinery = techLevels['Machinery'] || false;
  if (hasMachinery) {
    mineOpt = 85;
    mineMax = 170; // Max is 2x optimal
  }
  let mineBase = BUILDING_DATA['Mine'].production_per_day || 4;
  let minePeak = mineBase + (mineBase / 2); // Peak is base + (base/2)
  if (BUILDING_DATA['Mine'].per_race_bonus && BUILDING_DATA['Mine'].per_race_bonus[race]) {
    if (BUILDING_DATA['Mine'].per_race_bonus[race].production_per_day)
      mineBase = BUILDING_DATA['Mine'].per_race_bonus[race].production_per_day;
    minePeak = mineBase + (mineBase / 2); // Recalculate peak after race bonus
  }
  // If you want to make minePeak race-specific, add production_peak to per_race_bonus in buildingData
  let ironProd = 0;
  if (mines > 0) {
    const perMine = minePop / mines;
    if (perMine <= mineOpt) {
      ironProd = mines * (perMine / mineOpt) * mineBase;
    } else if (perMine >= mineMax) {
      ironProd = mines * minePeak;
    } else {
      const t = (perMine - mineOpt) / (mineMax - mineOpt);
      ironProd = mines * ((1 - t) * mineBase + t * minePeak);
    }
    ironProd = Math.round(ironProd);
  }
  // Mill: Use BUILDING_DATA and per_race_bonus
  const mills = get('Mill');
  const lumberPop = population['Lumber'] || 0;
  const lumberOpt = BUILDING_DATA['Mill'].optimal_workers || 85;
  const lumberMax = 170; // If you want to make this dynamic, add to BUILDING_DATA
  let lumberBase = BUILDING_DATA['Mill'].production_per_day || 5;
  // Wood Recycling technology increases wood production by 1.5 per mill
  const hasWoodRecycling = techLevels['Wood Recycling'] || false;
  if (hasWoodRecycling) {
    lumberBase += 1.5;
  }
  let lumberPeak = lumberBase + (lumberBase / 2); // Peak is base + (base/2)
  if (BUILDING_DATA['Mill'].per_race_bonus && BUILDING_DATA['Mill'].per_race_bonus[race]) {
    if (BUILDING_DATA['Mill'].per_race_bonus[race].production_per_day)
      lumberBase = BUILDING_DATA['Mill'].per_race_bonus[race].production_per_day;
    // Reapply Wood Recycling bonus after race bonus
    if (hasWoodRecycling) {
      lumberBase += 1.5;
    }
    lumberPeak = lumberBase + (lumberBase / 2); // Recalculate peak after race bonus
  }
  // If you want to make lumberPeak race-specific, add production_peak to per_race_bonus in buildingData
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
  // Farm: Use BUILDING_DATA and per_race_bonus
  const farms = get('Farm');
  const agriPop = population['Agriculture'] || 0;
  const agriOpt = BUILDING_DATA['Farm'].optimal_workers || 60;
  const agriMax = 120; // If you want to make this dynamic, add to BUILDING_DATA
  let agriBase = BUILDING_DATA['Farm'].production_per_day || 100;
  // Irrigation technology increases food production per farm by 15
  const hasIrrigation = techLevels['Irrigation'] || false;
  if (hasIrrigation) {
    agriBase += 15; // Adds 15 food
  }
  let agriPeak = agriBase + (agriBase / 2); // Peak is base + (base/2)
  if (BUILDING_DATA['Farm'].per_race_bonus && BUILDING_DATA['Farm'].per_race_bonus[race]) {
    if (BUILDING_DATA['Farm'].per_race_bonus[race].production_per_day)
      agriBase = BUILDING_DATA['Farm'].per_race_bonus[race].production_per_day;
    // Reapply Irrigation bonus after race bonus
    if (hasIrrigation) {
      agriBase += 15;
    }
    agriPeak = agriBase + (agriBase / 2); // Recalculate peak after race bonus
  }
  // If you want to make agriPeak race-specific, add production_peak to per_race_bonus in buildingData
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
  const goldUpkeep = goldUpkeepUnits;
  const netFood = foodProd - foodUpkeep;
  const netGold = goldProd - goldUpkeep;
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

export default ProjectedProduction; 