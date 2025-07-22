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

export interface StatModifiers {
  melee: { positive: number; negative: number; positiveFlat: number; negativeFlat: number };
  short: { positive: number; negative: number; positiveFlat: number; negativeFlat: number };
  range: { positive: number; negative: number; positiveFlat: number; negativeFlat: number };
  defense: { positive: number; negative: number; positiveFlat: number; negativeFlat: number };
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
        if (isInfantryUnit(unitName, race)) {
          stats.melee *= effects.infantry_attack_multiplier;
        }
      }
      if (strategy === 'Quick Retreat') {
        stats.melee *= effects.all_unit_attack_multiplier;
        stats.short *= effects.all_unit_attack_multiplier;
        stats.range *= effects.all_unit_attack_multiplier;
      }
      if (strategy === 'Anti-Cavalry') {
        if (isPikemanUnit(unitName, race)) {
          // Pikemen get their vs mounted multiplier in unit stats too
          stats.melee *= effects.pikemen_attack_vs_mounted_multiplier;
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
        if (isInfantryUnit(unitName, race)) {
          stats.melee *= (1 + effects.shieldbearers_close_combat_damage_increase_percent);
        }
      }
      if (strategy === 'Elf Energy Gathering') {
        if (isInfantryUnit(unitName, race)) {
          stats.defense += effects.wizards_defense_increase;
          stats.melee *= effects.wizards_close_combat_damage_multiplier;
          stats.range += effects.wizards_ranged_attack_increase;
        }
      }
      if (strategy === 'Gnome Far Fighting') {
        // Long range attack doubling is handled in battle logic
      }
      if (strategy === 'Human Charging!') {
        if (isInfantryUnit(unitName, race)) {
          stats.melee *= effects.knights_attack_multiplier;
          // Also apply damage multiplier if it exists
          if (effects.knights_damage_multiplier) {
            stats.melee *= effects.knights_damage_multiplier;
          }
        }
      }
      if (strategy === 'Orc Surrounding') {
        if (isMountedUnit(unitName, race)) {
          stats.defense += effects.shadow_warriors_defense_increase;
          // Short ranged phase damage is handled in battle logic
        }
      }
      if (strategy === 'Orc Berserker') {
        stats.melee += effects.all_units_damage_increase;
        stats.short += effects.all_units_damage_increase;
        stats.range += effects.all_units_damage_increase;
        stats.defense *= (1 / effects.all_units_defense_divide_by); // Convert division to multiplication
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

/**
 * Get individual stat modifiers for display purposes
 * @param unitName - The name of the unit
 * @param race - The race key (lowercase)
 * @param techLevels - Object of technology levels
 * @param strategy - The name of the active strategy
 * @returns StatModifiers with positive and negative percentage changes
 */
export function getStatModifiers(
  unitName: string,
  race: string,
  techLevels: TechLevels = {},
  strategy: StrategyName | null = null
): StatModifiers {
  const raceKey = race?.toLowerCase() || 'dwarf';
  const base = UNIT_DATA[raceKey]?.[unitName];
  if (!base) {
    return {
      melee: { positive: 0, negative: 0, positiveFlat: 0, negativeFlat: 0 },
      short: { positive: 0, negative: 0, positiveFlat: 0, negativeFlat: 0 },
      range: { positive: 0, negative: 0, positiveFlat: 0, negativeFlat: 0 },
      defense: { positive: 0, negative: 0, positiveFlat: 0, negativeFlat: 0 }
    };
  }

  const modifiers: StatModifiers = {
    melee: { positive: 0, negative: 0, positiveFlat: 0, negativeFlat: 0 },
    short: { positive: 0, negative: 0, positiveFlat: 0, negativeFlat: 0 },
    range: { positive: 0, negative: 0, positiveFlat: 0, negativeFlat: 0 },
    defense: { positive: 0, negative: 0, positiveFlat: 0, negativeFlat: 0 }
  };

  // Technology modifiers
  const sharperBladesLevel = techLevels['Sharper Blades'] || 0;
  if (sharperBladesLevel > 0 && base.weaponType === 'blade') {
    modifiers.melee.positiveFlat += sharperBladesLevel; // Flat +1 per level
  }

  const tougherLightArmorLevel = techLevels['Tougher Light Armor'] || 0;
  if (tougherLightArmorLevel > 0 && base.armorType === 'light') {
    modifiers.defense.positiveFlat += tougherLightArmorLevel; // Flat +1 per level
  }

  const tougherHeavyArmorLevel = techLevels['Tougher Heavy Armor'] || 0;
  if (tougherHeavyArmorLevel > 0 && base.armorType === 'heavy') {
    modifiers.defense.positiveFlat += tougherHeavyArmorLevel; // Flat +1 per level
  }

  const improveBowRangeLevel = techLevels['Improve Bow Range'] || 0;
  if (improveBowRangeLevel > 0 && base.weaponType === 'bow') {
    modifiers.range.positive += improveBowRangeLevel * 50; // +50% per level
  }

  // Strategy modifiers
  if (strategy) {
    const strat = STRATEGY_DATA[strategy];
    if (strat) {
      const effects = strat.effects;
      
      if (strategy === 'Archer Protection') {
        if (isInfantryUnit(unitName, race)) {
          modifiers.melee.negative += (1 - effects.infantry_attack_multiplier) * 100; // -50%
        }
        // Archer defense increase is handled in battle logic
      }
      
      if (strategy === 'Quick Retreat') {
        modifiers.melee.negative += (1 - effects.all_unit_attack_multiplier) * 100;
        modifiers.short.negative += (1 - effects.all_unit_attack_multiplier) * 100;
        modifiers.range.negative += (1 - effects.all_unit_attack_multiplier) * 100;
      }
      
      if (strategy === 'Anti-Cavalry') {
        if (isPikemanUnit(unitName, race)) {
          modifiers.melee.positive += (effects.pikemen_attack_vs_mounted_multiplier - 1) * 100;
        }
        modifiers.melee.negative += (1 - effects.all_units_attack_multiplier) * 100;
        modifiers.short.negative += (1 - effects.all_units_attack_multiplier) * 100;
        modifiers.range.negative += (1 - effects.all_units_attack_multiplier) * 100;
      }
      
      if (strategy === 'Dwarf Shield Line') {
        modifiers.melee.negative += effects.all_units_close_combat_attack_reduction_percent * 100;
        modifiers.short.negative += effects.all_units_close_combat_attack_reduction_percent * 100;
        
        if (isInfantryUnit(unitName, race)) {
          modifiers.melee.positive += effects.shieldbearers_close_combat_damage_increase_percent * 100;
        }
      }
      
      if (strategy === 'Elf Energy Gathering') {
        if (isInfantryUnit(unitName, race)) {
          modifiers.defense.positiveFlat += effects.wizards_defense_increase; // Flat +2
          modifiers.melee.positive += (effects.wizards_close_combat_damage_multiplier - 1) * 100; // +100%
          modifiers.range.positiveFlat += effects.wizards_ranged_attack_increase; // Flat +4
        }
      }
      
      if (strategy === 'Human Charging!') {
        if (isInfantryUnit(unitName, race)) {
          modifiers.melee.positive += (effects.knights_attack_multiplier - 1) * 100; // +50%
          modifiers.short.positive += (effects.knights_short_multiplier - 1) * 100; // +50%
          modifiers.defense.negative += effects.knights_defense_reduction_percent * 100; // -25%
        }
      }
      
      if (strategy === 'Orc Surrounding') {
        if (isMountedUnit(unitName, race)) {
          modifiers.defense.positiveFlat += effects.shadow_warriors_defense_increase; // Flat +2
        }
      }
      
      if (strategy === 'Orc Berserker') {
        modifiers.melee.positiveFlat += effects.all_units_damage_increase; // Flat +3
        modifiers.short.positiveFlat += effects.all_units_damage_increase; // Flat +3
        modifiers.range.positiveFlat += effects.all_units_damage_increase; // Flat +3
        modifiers.defense.negative += (1 - (1 / effects.all_units_defense_divide_by)) * 100; // -50%
      }
    }
  }

  return modifiers;
} 

// Helper functions to identify unit types
export function isInfantryUnit(unitName: string, race: string): boolean {
  const infantryNames = ['Infantry', 'HeavyInfantry', 'Swordman', 'Militia', 'Rusher', 'Slother', 'SkeletonWarrior', 'Shieldbearer', 'AxeMan'];
  return infantryNames.includes(unitName);
}

export function isPikemanUnit(unitName: string, race: string): boolean {
  const pikemanNames = ['Pikeman', 'Lanceman', 'WraithPikeman'];
  return pikemanNames.includes(unitName);
}

export function isMountedUnit(unitName: string, race: string): boolean {
  const mountedNames = ['Knight', 'Rider', 'Caragous', 'WolfMaster', 'WraithRider', 'Runner', 'MountedArchers'];
  return mountedNames.includes(unitName);
}

export function isMageUnit(unitName: string, race: string): boolean {
    return unitName === 'Mage';
}

export function isShadowWarriorUnit(unitName: string, race: string): boolean {
    return unitName === 'ShadowWarrior';
}

export function isKnightUnit(unitName: string, race: string): boolean {
    return unitName === 'Knight';
} 