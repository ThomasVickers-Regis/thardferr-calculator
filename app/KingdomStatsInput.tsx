import React from 'react';
import { TECHNOLOGY_DATA, TECHNOLOGY_TREES } from '../data/technologyData';
import { STRATEGY_DATA } from '../data/strategyData';

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
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Strategy</label>
        <select
          className="w-full p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          value={strategy || ''}
          onChange={e => handleStrategyChange(e.target.value)}
        >
          <option value="">None</option>
          {Object.keys(STRATEGY_DATA).map(strat => (
            <option key={strat} value={strat}>{strat}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default KingdomStatsInput; 