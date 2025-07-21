import React from 'react';

interface UnitDetailProps {
  unitName: string;
  count: number;
  survived: number;
  lost: number;
  stats: any;
  baseStats: any;
  damageEntry: any;
  side: 'your' | 'enemy';
  phase: 'range' | 'short' | 'melee' | string;
}

const UnitDetail: React.FC<UnitDetailProps> = ({ unitName, count, survived, lost, stats, baseStats, damageEntry, side, phase }) => {
  return (
    <div className={`border border-gray-700 p-3 rounded bg-gray-750`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-200 font-bold text-base">{unitName}</span>
        <span className={`font-bold text-lg ${lost > 0 ? (side === 'your' ? 'text-red-400' : 'text-green-400') : 'text-gray-500'}`}>{lost > 0 ? `-${lost}` : '0'}</span>
      </div>
      {/* Unit Status */}
      <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
        <div className="bg-gray-700 p-1 rounded text-center">
          <div className="text-gray-400">Count</div>
          <div className={side === 'your' ? 'text-blue-300 font-bold' : 'text-red-300 font-bold'}>{count}</div>
        </div>
        <div className="bg-gray-700 p-1 rounded text-center">
          <div className="text-gray-400">Survived</div>
          <div className="text-green-400 font-bold">{survived}</div>
        </div>
        <div className="bg-gray-700 p-1 rounded text-center">
          <div className="text-gray-400">Loss Rate</div>
          <div className="text-yellow-400 font-bold">{count > 0 ? Math.round((lost / count) * 100) : 0}%</div>
        </div>
      </div>
      {/* Damage Details */}
      {damageEntry && (
        <div className="bg-gray-700 p-2 rounded mb-2">
          <div className="text-gray-300 font-medium mb-1">Damage Analysis:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Received</span>:
              <span className="text-red-300 font-bold" title="Raw damage before any mitigation">{damageEntry.damageReceived}</span>
              <span className="text-gray-400 ml-2">Total:</span>
              <span className="text-red-200 font-bold">{(damageEntry.damageReceived * count).toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-400">Mitigated</span>:
              <span className="text-green-400 font-bold" title="Total mitigation from buildings, redistribution, immunity, etc.">{damageEntry.damageMitigated}</span>
              <span className="text-gray-400 ml-2">Total:</span>
              <span className="text-green-300 font-bold">{(damageEntry.damageMitigated * count).toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-400">Final</span>:
              <span className="text-yellow-400 font-bold" title="Actual damage taken after all mitigation">{damageEntry.finalDamage}</span>
              <span className="text-gray-400 ml-2">Total:</span>
              <span className="text-yellow-200 font-bold">{(damageEntry.finalDamage * count).toFixed(3)}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Effective Defense</span>:
              <span className="text-blue-300 font-bold">{((damageEntry.damageMitigated || 0) + (stats.defense * count)).toFixed(1)}</span>
            </div>
            {typeof damageEntry.unitsLost === 'number' && (
              <div>
                <span className="text-gray-400">Lost</span>:
                <span className="text-green-400 font-bold">{damageEntry.unitsLost}</span>
              </div>
            )}
          </div>
          {/* Detailed breakdown for transparency */}
          {damageEntry.breakdown && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-gray-400 text-xs mb-1">Breakdown:</div>
              <div className="text-xs text-gray-300">Unit weight: <span className="text-purple-300">{damageEntry.breakdown?.unitWeight ?? '1'}</span></div>
              <div className="text-xs text-gray-300">Initial share: <span className="text-blue-300">{damageEntry.breakdown?.initialShare?.toFixed(2) ?? '0.00'}</span></div>
              <div className="text-xs text-gray-300">After mitigation: <span className="text-blue-300">{damageEntry.breakdown?.afterMitigation?.toFixed(2) ?? '0.00'}</span></div>
              {damageEntry.breakdown?.mitigationDetails && damageEntry.breakdown.mitigationDetails.length > 0 && (
                <div className="text-xs text-gray-400 ml-2">Mitigation: {damageEntry.breakdown.mitigationDetails.map((m: string, i: number) => <span key={i} className="text-green-300">{m}{i < damageEntry.breakdown.mitigationDetails.length - 1 ? ', ' : ''}</span>)}</div>
              )}
              <div className="text-xs text-gray-300">After immunity: <span className="text-blue-300">{damageEntry.breakdown?.afterImmunity?.toFixed(2) ?? '0.00'}</span></div>
              <div className="text-xs text-gray-300">Final: <span className="text-yellow-300">{damageEntry.breakdown?.final?.toFixed(2) ?? '0.00'}</span></div>
            </div>
          )}
          {damageEntry.buildingEffects.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="text-gray-400 text-xs">Effects:</div>
              {damageEntry.buildingEffects.map((effect: string, i: number) => (
                <div key={i} className="text-green-300 text-xs">• {effect}</div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Attack Stats */}
      <div className="bg-gray-700 p-2 rounded mb-2">
        <div className="text-gray-300 font-medium mb-1">Attack Stats:</div>
        {baseStats && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {phase === 'melee' && (
              <>
                <div>Melee: <span className="text-red-300">{baseStats.melee || 0}</span></div>
                <div>Effective: <span className="text-red-400 font-bold">{stats.melee?.toFixed(1)}</span></div>
                <div>Multiplier: <span className="text-red-300">{baseStats.melee ? (stats.melee / baseStats.melee).toFixed(2) : '1.00'}x</span></div>
                <div>Total: <span className="text-red-400 font-bold">{(stats.melee * count).toFixed(1)}</span></div>
              </>
            )}
            {phase === 'short' && (
              <>
                <div>Short: <span className="text-orange-300">{baseStats.short || 0}</span></div>
                <div>Effective: <span className="text-orange-400 font-bold">{stats.short?.toFixed(1)}</span></div>
                <div>Multiplier: <span className="text-orange-300">{baseStats.short ? (stats.short / baseStats.short).toFixed(2) : '1.00'}x</span></div>
                <div>Total: <span className="text-orange-400 font-bold">{(stats.short * count).toFixed(1)}</span></div>
              </>
            )}
            {phase === 'range' && (
              <>
                <div>Range: <span className="text-blue-300">{baseStats.range || 0}</span></div>
                <div>Effective: <span className="text-blue-400 font-bold">{stats.range?.toFixed(1)}</span></div>
                <div>Multiplier: <span className="text-blue-300">{baseStats.range ? (stats.range / baseStats.range).toFixed(2) : '1.00'}x</span></div>
                <div>Total: <span className="text-blue-400 font-bold">{(stats.range * count).toFixed(1)}</span></div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Defense Stats */}
      <div className="bg-gray-700 p-2 rounded">
        <div className="text-gray-300 font-medium mb-1">Defense Stats:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Base: <span className="text-purple-300">{baseStats?.defense || 0}</span></div>
          <div>Effective: <span className="text-purple-400 font-bold">{(damageEntry?.trueEffectiveDefense !== undefined ? damageEntry.trueEffectiveDefense : stats.defense).toFixed(1)}</span></div>
          {damageEntry?.appliedRedistributionBonus !== undefined && (
            <div className="col-span-2 text-green-300">+{damageEntry.appliedRedistributionBonus.toFixed(2)} defense redistributed from infantry</div>
          )}
          <div>Multiplier: <span className="text-purple-300">{baseStats?.defense ? ((damageEntry?.trueEffectiveDefense !== undefined ? damageEntry.trueEffectiveDefense : stats.defense) / baseStats.defense).toFixed(2) : '1.00'}x</span></div>
          <div>Total Defense: <span className="text-purple-400 font-bold">{((damageEntry?.trueEffectiveDefense !== undefined ? damageEntry.trueEffectiveDefense : stats.defense) * count).toFixed(1)}</span></div>
        </div>
      </div>
    </div>
  );
};

export default UnitDetail; 