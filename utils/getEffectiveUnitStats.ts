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
      const effects = strat.effects;
      
      // Apply strategy effects from STRATEGY_DATA
      if (strategy === 'Archer Protection') {
        if (unitName.toLowerCase().includes('infantry')) {
          stats.melee *= effects.infantry_attack_multiplier;
        }
      }
      if (strategy === 'Infantry Attack') {
        if (unitName.toLowerCase().includes('infantry')) {
          stats.melee *= effects.infantry_damage_multiplier;
        }
      }
      if (strategy === 'Quick Retreat') {
        stats.melee *= effects.all_unit_attack_multiplier;
        stats.short *= effects.all_unit_attack_multiplier;
        stats.range *= effects.all_unit_attack_multiplier;
      }
      if (strategy === 'Anti-Cavalry') {
        if (unitName.toLowerCase().includes('pikeman')) {
          // Pikemen vs mounted multiplier is handled in battle logic
        }
        stats.melee *= effects.all_units_attack_multiplier;
        stats.short *= effects.all_units_attack_multiplier;
        stats.range *= effects.all_units_attack_multiplier;
      }
      if (strategy === 'Dwarf Shield Line') {
        // Close combat attack reduction
        stats.melee *= (1 - effects.all_units_close_combat_attack_reduction_percent);
        stats.short *= (1 - effects.all_units_close_combat_attack_reduction_percent);
        
        // Shieldbearer damage increase
        if (unitName.toLowerCase().includes('shieldbearer')) {
          stats.melee *= (1 + effects.shieldbearers_close_combat_damage_increase_percent);
        }
      }
      if (strategy === 'Elf Energy Gathering') {
        if (unitName.toLowerCase().includes('mage')) {
          stats.defense += effects.wizards_defense_increase;
          stats.melee *= effects.wizards_close_combat_damage_multiplier;
          stats.range += effects.wizards_ranged_attack_increase;
        }
      }
      if (strategy === 'Gnome Far Fighting') {
        // Long range attack doubling is handled in battle logic
      }
      if (strategy === 'Human Charging!') {
        if (unitName.toLowerCase().includes('knight')) {
          stats.melee *= effects.knights_attack_multiplier;
        }
      }
      if (strategy === 'Orc Surrounding') {
        if (unitName.toLowerCase().includes('shadow warrior')) {
          stats.defense += effects.shadow_warriors_defense_increase;
          // Short ranged phase damage is handled in battle logic
        }
      }
      if (strategy === 'Orc Berserker') {
        stats.melee += effects.all_units_damage_increase;
        stats.short += effects.all_units_damage_increase;
        stats.range += effects.all_units_damage_increase;
        stats.defense /= effects.all_units_defense_divide_by;
      }
      if (strategy === 'Orc') {
        // Shadow warrior immunity reduction is handled in battle logic
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