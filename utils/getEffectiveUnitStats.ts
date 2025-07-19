import { UNIT_DATA, UnitStats } from '../data/unitData';
import { TECHNOLOGY_DATA } from '../data/technologyData';
import { STRATEGY_DATA } from '../data/strategyData';

// Types for input
export type TechLevels = Record<string, number>; // e.g., { 'Ranged Accuracy': 2, 'Hardening': 3 }
export type StrategyName = keyof typeof STRATEGY_DATA;

export interface EffectiveUnitStats {
  melee: number;
  short: number;
  range: number;
  defense: number;
}

/**
 * Calculates a unit's effective stats for a specific battle, applying all modifiers.
 * @param unitName - The name of the unit (must exist in UNIT_DATA)
 * @param techLevels - Object of technology levels
 * @param activeStrategy - The name of the active strategy
 * @param isAttacker - Whether this unit is attacking (for KS difference factor)
 * @param ksDifferenceFactor - Multiplier/divisor for bottomfeeding (KS difference)
 * @returns EffectiveUnitStats
 */
export function getEffectiveUnitStats(
  unitName: string,
  techLevels: TechLevels,
  activeStrategy: StrategyName | null,
  isAttacker: boolean,
  ksDifferenceFactor: number = 1
): EffectiveUnitStats {
  const base = UNIT_DATA[unitName];
  if (!base) throw new Error(`Unit not found: ${unitName}`);

  // Start with base stats
  let melee = base.melee;
  let short = base.short;
  let range = base.range;
  let defense = base.defense;

  // --- Ranged Base Effectiveness ---
  // All range and short attacks are dealt at 50% effectiveness before tech/strategy
  range *= 0.5;
  short *= 0.5;

  // --- Technology Modifiers ---
  // Sharper Blades (melee)
  const sharperBladesLvl = techLevels['Sharper Blades Structure'] || 0;
  if (sharperBladesLvl > 0) {
    const percent = TECHNOLOGY_DATA['Sharper Blades Structure'].levels[String(sharperBladesLvl)]?.damage_increase_percent || 0;
    melee *= 1 + percent;
  }
  // Improved Range Structure (range/short)
  const improvedRangeLvl = techLevels['Improved Range Structure'] || 0;
  if (improvedRangeLvl > 0) {
    const percent = TECHNOLOGY_DATA['Improved Range Structure'].levels[String(improvedRangeLvl)]?.damage_increase_percent || 0;
    range *= 1 + percent;
    short *= 1 + percent;
  }
  // Hardening (defense)
  const hardeningLvl = techLevels['Hardening'] || 0;
  if (hardeningLvl > 0) {
    const percent = TECHNOLOGY_DATA['Hardening'].levels[String(hardeningLvl)]?.defense_increase_percent || 0;
    defense *= 1 + percent;
  }

  // --- Strategy Modifiers ---
  if (activeStrategy) {
    const strat = STRATEGY_DATA[activeStrategy];
    if (strat) {
      // Example: Archer Protection
      if (activeStrategy === 'Archer Protection') {
        if (unitName.toLowerCase().includes('infantry')) melee *= 0.5;
        if (unitName.toLowerCase().includes('archer')) range -= melee; // Simplified
      }
      // Infantry Attack
      if (activeStrategy === 'Infantry Attack') {
        if (unitName.toLowerCase().includes('infantry')) melee *= 2.5;
        // Other units' damages reduced (not specified)
      }
      // Quick Retreat
      if (activeStrategy === 'Quick Retreat') {
        melee *= 0.5;
        short *= 0.5;
        range *= 0.5;
      }
      // Anti-Cavalry
      if (activeStrategy === 'Anti-Cavalry') {
        if (unitName.toLowerCase().includes('pikeman')) melee *= 3.5;
        melee *= 0.9;
        short *= 0.9;
        range *= 0.9;
      }
      // Dwarf Shield Line
      if (activeStrategy === 'Dwarf Shield Line') {
        melee *= 0.9;
        if (unitName.toLowerCase().includes('shieldbearer')) melee *= 2;
      }
      // Elf Energy Gathering
      if (activeStrategy === 'Elf Energy Gathering') {
        if (unitName.toLowerCase().includes('mage')) {
          defense += 2;
          melee *= 2;
          range += 4;
        }
      }
      // Gnome Far Fighting
      if (activeStrategy === 'Gnome Far Fighting') {
        range *= 2;
        short *= 2;
      }
      // Human Charging!
      if (activeStrategy === 'Human Charging!') {
        if (unitName.toLowerCase().includes('knight')) {
          melee *= 1.5;
        }
      }
      // Orc Surrounding
      if (activeStrategy === 'Orc Surrounding') {
        if (unitName.toLowerCase().includes('shadow warrior')) {
          defense += 2;
          // All Shadow Warrior damages dealt in Short-ranged phase (handled in battle logic)
        }
      }
      // Orc Berserker
      if (activeStrategy === 'Orc Berserker') {
        melee += 3;
        short += 3;
        range += 3;
        defense *= 0.5;
      }
    }
  }

  // --- KS Difference Factor (Bottomfeeding) ---
  melee *= ksDifferenceFactor;
  short *= ksDifferenceFactor;
  range *= ksDifferenceFactor;
  defense *= ksDifferenceFactor;

  // Clamp to 0 minimum
  melee = Math.max(0, melee);
  short = Math.max(0, short);
  range = Math.max(0, range);
  defense = Math.max(0, defense);

  return { melee, short, range, defense };
} 