import React from 'react';
import { UNIT_DATA } from '../data/unitData';

const ProjectedProduction = ({ population, buildings, army, land, race }: any) => {
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