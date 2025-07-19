import { UNIT_DATA } from '../data/unitData';
import { MARKET_PRICES } from '../data/marketPrices';
import { Army } from './calculatePhaseDamage';

/**
 * Get total initial gold cost for a unit and race.
 * @param unitName - The name of the unit (must exist in UNIT_DATA[race])
 * @param race - The race key (lowercase)
 */
export function getUnitTotalInitialGoldCost(unitName: string, race: string): number {
  const unit = UNIT_DATA[race][unitName];
  if (!unit) return 0;
  return (
    (unit.base_gold_cost || 0) +
    (unit.equipment_iron_cost || 0) +
    (unit.equipment_wood_cost || 0) +
    (unit.equipment_gold_cost || 0)
  );
}

/**
 * Get TEGC for a unit and race.
 * @param unitName - The name of the unit (must exist in UNIT_DATA[race])
 * @param race - The race key (lowercase)
 */
export function getUnitTEGC(unitName: string, race: string): number {
  const unit = UNIT_DATA[race][unitName];
  if (!unit) return 0;
  const initial = getUnitTotalInitialGoldCost(unitName, race);
  const upkeep = (unit.upkeep.gold * 2) + (unit.upkeep.food * 2 * MARKET_PRICES.food);
  return initial + upkeep;
}

/**
 * Calculates the total initial gold cost for an entire army.
 */
export function getArmyTotalInitialGoldCost(army: Army, race: string): number {
  let total = 0;
  for (const [unit, count] of Object.entries(army)) {
    total += getUnitTotalInitialGoldCost(unit, race) * count;
  }
  return total;
}

/**
 * Calculates the Total Effective Gold Cost (TEGC) for an entire army for 48 hours.
 */
export function getArmyTEGC(army: Army, race: string): number {
  let total = 0;
  for (const [unit, count] of Object.entries(army)) {
    total += getUnitTEGC(unit, race) * count;
  }
  return total;
}

/**
 * Calculates efficiency ratios for a unit given its effective stats.
 * Returns gold per attack, defense, and ranged (lower is better).
 * If a stat is 0, returns null for that ratio.
 */
export function getUnitEfficiencyRatios(
  unitName: string,
  effectiveStats: { melee: number; short: number; range: number; defense: number },
  race: string
): { goldPerAttack: number | null, goldPerDefense: number | null, goldPerRanged: number | null } {
  const tegc = getUnitTEGC(unitName, race);
  const goldPerAttack = effectiveStats.melee > 0 ? tegc / effectiveStats.melee : null;
  const goldPerDefense = effectiveStats.defense > 0 ? tegc / effectiveStats.defense : null;
  const goldPerRanged = effectiveStats.range > 0 ? tegc / effectiveStats.range : null;
  return { goldPerAttack, goldPerDefense, goldPerRanged };
} 