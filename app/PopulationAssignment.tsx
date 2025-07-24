import React, { useEffect, useRef, useState } from 'react';

interface PopulationAssignmentProps {
  population: Record<string, number>;
  setPopulation: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  buildings: Record<string, number>;
  totalPop: number;
}

const JOBS = [
  { key: 'Mine', label: 'Mine' },
  { key: 'Lumber', label: 'Lumber' },
  { key: 'Agriculture', label: 'Agriculture' },
  { key: 'Building', label: 'Building' },
  { key: 'Training', label: 'Training' },
  { key: 'Blacksmithing', label: 'Blacksmithing' },
  { key: 'Exploration', label: 'Exploration' },
];
const JOB_EFFICIENCY = {
  Mine: { optimal: 100, max: 200, building: 'Mine' },
  Lumber: { optimal: 85, max: 170, building: 'Mill' },
  Agriculture: { optimal: 60, max: 120, building: 'Farm' },
  Blacksmithing: { optimal: 80, max: 160, building: 'Forge' },
};

const isEfficiencyJob = (job: string): job is keyof typeof JOB_EFFICIENCY => job in JOB_EFFICIENCY;

const calculateOptimalPopulation = (buildings: Record<string, number>, totalPop: number) => {
  const optimal: Record<string, number> = {};
  for (const job of JOBS) {
    if (job.key === 'Training' || job.key === 'Exploration') {
      optimal[job.key] = 0;
    } else if (job.key === 'Building') {
      optimal[job.key] = (buildings['Building'] || 0) * 150;
    } else if (job.key === 'Blacksmithing') {
      optimal[job.key] = (buildings['Forge'] || 0) * 80;
    } else if (job.key === 'Agriculture') {
      optimal[job.key] = (buildings['Farm'] || 0) * 60;
    } else if (isEfficiencyJob(job.key)) {
      const eff = JOB_EFFICIENCY[job.key];
      optimal[job.key] = (buildings[eff.building] || 0) * eff.optimal;
    } else {
      optimal[job.key] = 0;
    }
  }
  const totalOptimal = Object.values(optimal).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
  if (totalOptimal > totalPop) {
    const scale = totalPop / totalOptimal;
    for (const job of JOBS) {
      optimal[job.key] = Math.floor(optimal[job.key] * scale);
    }
  }
  return optimal;
};

const PopulationAssignment: React.FC<PopulationAssignmentProps> = ({ population, setPopulation, buildings, totalPop }) => {
  const [efficiencyValues, setEfficiencyValues] = useState<Record<string, number>>({});
  const [manualOverride, setManualOverride] = useState<Record<string, boolean>>({});
  const prevBuildingsRef = useRef<Record<string, number>>(buildings);

  // Ratio-based scaling on buildings/land change
  useEffect(() => {
    const currentTotal = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
    // Calculate previous ratios
    const prevRatios: Record<string, number> = {};
    for (const job of JOBS) {
      const prevCount = population[job.key] || 0;
      const prevBuildings = getBuildings(job.key, prevBuildingsRef.current);
      prevRatios[job.key] = prevBuildings > 0 ? prevCount / prevBuildings : 0;
    }
    // If buildings/land changed, update jobs not manually overridden
    if (buildings !== prevBuildingsRef.current) {
      const newPopulation: Record<string, number> = { ...population };
      for (const job of JOBS) {
        if (!manualOverride[job.key]) {
          const newBuildings = getBuildings(job.key, buildings);
          newPopulation[job.key] = Math.floor(prevRatios[job.key] * newBuildings);
        }
      }
      setPopulation(newPopulation);
      prevBuildingsRef.current = buildings;
    }
    // On first load, set optimal if nothing assigned
    if (currentTotal === 0 && totalPop > 0) {
      const optimalPopulation = calculateOptimalPopulation(buildings, totalPop);
      setPopulation(optimalPopulation);
    }
  }, [buildings, totalPop, setPopulation]);

  const getJobMax = (job: string) => {
    if (job === 'Training' || job === 'Exploration') return totalPop;
    if (job === 'Building') return (buildings['Building'] || 0) * 150;
    if (job === 'Blacksmithing') return (buildings['Forge'] || 0) * 160;
    if (job === 'Agriculture') return (buildings['Farm'] || 0) * 120;
    if (isEfficiencyJob(job)) {
      const eff = JOB_EFFICIENCY[job];
      return (buildings[eff.building] || 0) * eff.max;
    }
    return 0;
  };
  const getJobOptimal = (job: string) => {
    if (job === 'Training' || job === 'Exploration') return 0;
    if (job === 'Building') return (buildings['Building'] || 0) * 150;
    if (job === 'Blacksmithing') return (buildings['Forge'] || 0) * 80;
    if (job === 'Agriculture') return (buildings['Farm'] || 0) * 60;
    if (isEfficiencyJob(job)) {
      const eff = JOB_EFFICIENCY[job];
      return (buildings[eff.building] || 0) * eff.optimal;
    }
    return 0;
  };
  function getBuildings(job: string, bldgs: Record<string, number>) {
    if (job === 'Training') return 1;
    if (job === 'Building') return bldgs['Building'] || 0;
    if (job === 'Blacksmithing') return bldgs['Forge'] || 0;
    if (isEfficiencyJob(job)) {
      const eff = JOB_EFFICIENCY[job];
      return bldgs[eff.building] || 0;
    }
    return 0;
  }
  const getEfficiency = (job: string) => {
    if (efficiencyValues[job] !== undefined) return efficiencyValues[job];
    const b = getBuildings(job, buildings);
    if (job === 'Training' || job === 'Exploration') return population[job] || 0;
    if (!b) return 0;
    if (job === 'Building') return Math.floor((population['Building'] || 0) / 150);
    if (job === 'Blacksmithing') return Math.floor((population[job] || 0) / b);
    return Math.floor((population[job] || 0) / b);
  };
  const handleAssignmentChange = (job: string, value: string) => {
    let val = Math.max(0, parseInt(value) || 0);
    const totalAssigned = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
    const newTotal = totalAssigned - (population[job] || 0) + val;
    if (newTotal > totalPop) val -= (newTotal - totalPop);
    if (getJobMax(job) && val > getJobMax(job)) val = getJobMax(job);
    setPopulation({ ...population, [job]: val });
    setManualOverride((prev: Record<string, boolean>) => ({ ...prev, [job]: true }));
    if (job === 'Training' || job === 'Exploration') {
      setEfficiencyValues((prev: Record<string, number>) => ({ ...prev, [job]: val }));
    } else if (job === 'Building') {
      const eff = Math.floor(val / 150);
      setEfficiencyValues((prev: Record<string, number>) => ({ ...prev, [job]: eff }));
    } else {
      const buildingsForJob = getBuildings(job, buildings);
      if (buildingsForJob > 0) {
        const eff = Math.floor(val / buildingsForJob);
        setEfficiencyValues((prev: Record<string, number>) => ({ ...prev, [job]: eff }));
      }
    }
  };
  const handleEfficiencyChange = (job: string, value: string) => {
    if (job === 'Building') return;
    const eff = Math.max(0, parseInt(value) || 0);
    let val = 0;
    if (job === 'Training' || job === 'Exploration') val = eff;
    else if (job === 'Blacksmithing') {
      const b = getBuildings(job, buildings);
      val = b * eff;
    } else {
      const b = getBuildings(job, buildings);
      val = b * eff;
    }
    const totalAssigned = Object.values(population).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
    const newTotal = totalAssigned - (population[job] || 0) + val;
    if (newTotal > totalPop) val -= (newTotal - totalPop);
    if (getJobMax(job) && val > getJobMax(job)) val = getJobMax(job);
    setPopulation({ ...population, [job]: val });
    setEfficiencyValues((prev: Record<string, number>) => ({ ...prev, [job]: eff }));
  };
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
                  <input
                    type="number"
                    min={0}
                    className="w-20 p-1 rounded bg-gray-900 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={getEfficiency(job.key)}
                    onChange={e => handleEfficiencyChange(job.key, e.target.value)}
                    title={`Set efficiency for ${job.label}`}
                  />
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

export default PopulationAssignment; 