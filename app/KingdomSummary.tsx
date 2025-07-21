import React from 'react';

const KingdomSummary = ({ population, buildings, army, land, castles, ks, label }: any) => {
  const maxPop = (() => {
    let total = 0;
    for (const [b, count] of Object.entries(buildings)) {
      const n = typeof count === 'number' ? count : parseInt(count as string) || 0;
      if (b === 'House') total += n * 100;
      else if (b === 'Castle') total += n * 10;
      else total += n * 10;
    }
    return total;
  })();
  const assignedPop = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
  const armySize = Object.values(army).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
  return (
    <div className="mb-3 p-3 bg-gray-800 rounded flex flex-col md:flex-row md:items-center md:justify-between text-sm">
      <div className="flex flex-wrap gap-4 items-center">
        <span className="font-semibold text-purple-300">{label}</span>
        <span>Population: <span className="font-bold text-blue-200">{assignedPop}</span> / <span className="text-gray-300">{maxPop}</span></span>
        <span>Army Size: <span className="font-bold text-green-200">{armySize}</span></span>
        <span>Land: <span className="font-bold text-yellow-200">{land}</span></span>
        <span>Castles: <span className="font-bold text-pink-200">{castles}</span></span>
        <span>KS: <span className="font-bold text-orange-200">{ks}</span></span>
      </div>
    </div>
  );
};

export default KingdomSummary; 