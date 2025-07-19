import { UNIT_DATA } from '../data/unitData';
import { MARKET_PRICES } from '../data/marketPrices';
import { Army } from './calculatePhaseDamage';

/**
 * Calculates the total initial gold cost for a single unit, including equipment.
 */
export function getUnitTotalInitialGoldCost(unitName: string): number {
  const unit = UNIT_DATA[unitName];
  if (!unit) return 0;
  return (
    unit.base_gold_cost +
    (unit.equipment_iron_cost * MARKET_PRICES.iron) +
    (unit.equipment_wood_cost * MARKET_PRICES.wood) +
    unit.equipment_gold_cost
  );
}

/**
 * Calculates the Total Effective Gold Cost (TEGC) for a single unit for 48 hours (2 days).
 */
export function getUnitTEGC(unitName: string): number {
  const unit = UNIT_DATA[unitName];
  if (!unit) return 0;
  const initial = getUnitTotalInitialGoldCost(unitName);
  const upkeep = (unit.upkeep.gold * 2) + (unit.upkeep.food * 2 * MARKET_PRICES.food);
  return initial + upkeep;
}

/**
 * Calculates the total initial gold cost for an entire army.
 */
export function getArmyTotalInitialGoldCost(army: Army): number {
  let total = 0;
  for (const [unit, count] of Object.entries(army)) {
    total += getUnitTotalInitialGoldCost(unit) * count;
  }
  return total;
}

/**
 * Calculates the Total Effective Gold Cost (TEGC) for an entire army for 48 hours.
 */
export function getArmyTEGC(army: Army): number {
  let total = 0;
  for (const [unit, count] of Object.entries(army)) {
    total += getUnitTEGC(unit) * count;
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
  effectiveStats: { melee: number; short: number; range: number; defense: number }
): { goldPerAttack: number | null, goldPerDefense: number | null, goldPerRanged: number | null } {
  const tegc = getUnitTEGC(unitName);
  const goldPerAttack = effectiveStats.melee > 0 ? tegc / effectiveStats.melee : null;
  const goldPerDefense = effectiveStats.defense > 0 ? tegc / effectiveStats.defense : null;
  const goldPerRanged = effectiveStats.range > 0 ? tegc / effectiveStats.range : null;
  return { goldPerAttack, goldPerDefense, goldPerRanged };
} 