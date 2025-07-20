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
 * Get effective unit stats for a given unit and race.
 * @param unitName - The name of the unit (must exist in UNIT_DATA[race])
 * @param race - The race key (lowercase)
 * @param techLevels - Object of technology levels
 * @param activeStrategy - The name of the active strategy
 * @param isAttacker - Whether this unit is attacking (for KS difference factor)
 * @param ksDifferenceFactor - Multiplier/divisor for bottomfeeding (KS difference)
 * @returns EffectiveUnitStats
 */
export function getEffectiveUnitStats(
  unitName: string,
  race: string,
  techLevels: TechLevels = {},
  strategy: StrategyName | null = null,
  isAttacker: boolean = true,
  ksDifferenceFactor: number = 1
): UnitStats {
  const raceKey = race?.toLowerCase() || 'dwarf';
  const base = UNIT_DATA[raceKey]?.[unitName];
  if (!base) {
    console.warn(`Unknown unit: ${unitName} for race: ${raceKey}. Using default stats.`);
    // Return default stats to prevent crashes
    return {
      melee: 0,
      short: 0,
      range: 0,
      defense: 0,
      base_gold_cost: 0,
      equipment_iron_cost: 0,
      equipment_wood_cost: 0,
      equipment_gold_cost: 0,
      upkeep: { gold: 0, food: 0 }
    };
  }
  let stats = { ...base };
  // Apply Combat Technologies (flat stat bonuses)
  
  // Sharper Blades: +1 melee per level for blade units
  const sharperBladesLevel = techLevels['Sharper Blades'] || 0;
  if (sharperBladesLevel > 0 && base.weaponType === 'blade') {
    stats.melee += sharperBladesLevel;
  }
  
  // Tougher Light Armor: +1 defense per level for light armor units
  const tougherLightArmorLevel = techLevels['Tougher Light Armor'] || 0;
  if (tougherLightArmorLevel > 0 && base.armorType === 'light') {
    stats.defense += tougherLightArmorLevel;
  }
  
  // Tougher Heavy Armor: +1 defense per level for heavy armor units
  const tougherHeavyArmorLevel = techLevels['Tougher Heavy Armor'] || 0;
  if (tougherHeavyArmorLevel > 0 && base.armorType === 'heavy') {
    stats.defense += tougherHeavyArmorLevel;
  }
  
  // Improve Bow Range: +50% range per level for bow units
  const improveBowRangeLevel = techLevels['Improve Bow Range'] || 0;
  if (improveBowRangeLevel > 0 && base.weaponType === 'bow') {
    stats.range += stats.range * (improveBowRangeLevel * 0.5); // +50% per level
  }

  // --- Ranged Base Effectiveness ---
  // Base stats are used as-is (no automatic 50% reduction)

  // --- Technology Modifiers ---
  // Add any percentage-based technologies here if they exist in the data

  // --- Strategy Modifiers ---
  if (strategy) {
    const strat = STRATEGY_DATA[strategy];
    if (strat) {
      // Example: Archer Protection
      if (strategy === 'Archer Protection') {
        if (unitName.toLowerCase().includes('infantry')) stats.melee *= 0.5;
        if (unitName.toLowerCase().includes('archer')) stats.range -= stats.melee; // Simplified
      }
      // Infantry Attack
      if (strategy === 'Infantry Attack') {
        if (unitName.toLowerCase().includes('infantry')) stats.melee *= 2.5;
        // Other units' damages reduced (not specified)
      }
      // Quick Retreat
      if (strategy === 'Quick Retreat') {
        stats.melee *= 0.5;
        stats.short *= 0.5;
        stats.range *= 0.5;
      }
      // Anti-Cavalry
      if (strategy === 'Anti-Cavalry') {
        if (unitName.toLowerCase().includes('pikeman')) stats.melee *= 3.5;
        stats.melee *= 0.9;
        stats.short *= 0.9;
        stats.range *= 0.9;
      }
      // Dwarf Shield Line
      if (strategy === 'Dwarf Shield Line') {
        stats.melee *= 0.9;
        if (unitName.toLowerCase().includes('shieldbearer')) stats.melee *= 2;
      }
      // Elf Energy Gathering
      if (strategy === 'Elf Energy Gathering') {
        if (unitName.toLowerCase().includes('mage')) {
          stats.defense += 2;
          stats.melee *= 2;
          stats.range += 4;
        }
      }
      // Gnome Far Fighting
      if (strategy === 'Gnome Far Fighting') {
        stats.range *= 2;
        stats.short *= 2;
      }
      // Human Charging!
      if (strategy === 'Human Charging!') {
        if (unitName.toLowerCase().includes('knight')) {
          stats.melee *= 1.5;
        }
      }
      // Orc Surrounding
      if (strategy === 'Orc Surrounding') {
        if (unitName.toLowerCase().includes('shadow warrior')) {
          stats.defense += 2;
          // All Shadow Warrior damages dealt in Short-ranged phase (handled in battle logic)
        }
      }
      // Orc Berserker
      if (strategy === 'Orc Berserker') {
        stats.melee += 3;
        stats.short += 3;
        stats.range += 3;
        stats.defense *= 0.5;
      }
    }
  }

  // --- KS Difference Factor (Bottomfeeding) ---
  stats.melee *= ksDifferenceFactor;
  stats.short *= ksDifferenceFactor;
  stats.range *= ksDifferenceFactor;
  stats.defense *= ksDifferenceFactor;

  // Clamp to 0 minimum
  stats.melee = Math.max(0, stats.melee);
  stats.short = Math.max(0, stats.short);
  stats.range = Math.max(0, stats.range);
  stats.defense = Math.max(0, stats.defense);

  return stats;
} 