import { UNIT_DATA, UnitStats } from '../data/unitData';
import { TECHNOLOGY_DATA } from '../data/technologyData';
import { STRATEGY_DATA } from '../data/strategyData';
import { UNIT_DATA as unitData } from "@/data/unitData";

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
    const strategyEffects = STRATEGY_DATA[strategy]?.effects;
    if (strategyEffects) {
        if (strategy === 'Human Charging!' && isKnightUnit(unitName, race)) {
            stats.melee *= strategyEffects.knights_attack_multiplier || 1;
            // Also apply damage multiplier if it exists
            if (strategyEffects.knights_damage_multiplier) {
                stats.melee *= strategyEffects.knights_damage_multiplier;
            }
        }
        if (strategy === 'Quick Retreat' && strategyEffects.all_unit_attack_multiplier) {
            stats.melee *= strategyEffects.all_unit_attack_multiplier;
            stats.short *= strategyEffects.all_unit_attack_multiplier;
            stats.range *= strategyEffects.all_unit_attack_multiplier;
        }
        if (strategy === 'Anti-Cavalry' && strategyEffects.all_units_attack_multiplier) {
            if (!isPikemanUnit(unitName, race)) {
                stats.melee *= strategyEffects.all_units_attack_multiplier;
                stats.short *= strategyEffects.all_units_attack_multiplier;
                stats.range *= strategyEffects.all_units_attack_multiplier;
            }
        }
        if (strategy === 'Archer Protection' && isInfantryUnit(unitName, race)) {
            stats.melee *= strategyEffects.infantry_attack_multiplier || 1;
            stats.short *= strategyEffects.infantry_attack_multiplier || 1;
            stats.range *= strategyEffects.infantry_attack_multiplier || 1;
        }
        if (strategy === 'Dwarf Shield Line') {
            if (isShieldbearerUnit(unitName, race)) {
                stats.melee *= 1 + (strategyEffects.shieldbearers_close_combat_damage_increase_percent || 0);
                stats.short *= 1 + (strategyEffects.shieldbearers_close_combat_damage_increase_percent || 0);
            }
            stats.melee *= 1 - (strategyEffects.all_units_close_combat_attack_reduction_percent || 0);
            stats.short *= 1 - (strategyEffects.all_units_close_combat_attack_reduction_percent || 0);
        }
        // Orc Surrounding: ShadowWarrior does all damage in short phase, none in melee
        if (strategy === 'Orc Surrounding' && isShadowWarriorUnit(unitName, race)) {
            stats.short = (stats.short || 0) + (stats.melee || 0) + (stats.range || 0);
            stats.melee = 0;
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
        } else {
          modifiers.melee.negative += (1 - effects.all_units_attack_multiplier) * 100;
          modifiers.short.negative += (1 - effects.all_units_attack_multiplier) * 100;
          modifiers.range.negative += (1 - effects.all_units_attack_multiplier) * 100;
        }
      }
      
      if (strategy === 'Dwarf Shield Line') {
        modifiers.melee.negative += effects.all_units_close_combat_attack_reduction_percent * 100;
        modifiers.short.negative += effects.all_units_close_combat_attack_reduction_percent * 100;
        
        if (isShieldbearerUnit(unitName, race)) {
          modifiers.melee.positive += effects.shieldbearers_close_combat_damage_increase_percent * 100;
        }
      }
      
      if (strategy === 'Elf Energy Gathering') {
        if (isMageUnit(unitName, race)) {
          modifiers.defense.positiveFlat += effects.wizards_defense_increase; // Flat +2
          modifiers.melee.positive += (effects.wizards_close_combat_damage_multiplier - 1) * 100; // +100%
          modifiers.range.positiveFlat += effects.wizards_ranged_attack_increase; // Flat +4
        }
      }
      
      if (strategy === 'Human Charging!') {
        if (isKnightUnit(unitName, race)) {
          modifiers.melee.positive += (effects.knights_attack_multiplier - 1) * 100; // +50%
          modifiers.short.positive += (effects.knights_short_multiplier - 1) * 100; // +50%
          modifiers.defense.negative += effects.knights_defense_reduction_percent * 100; // -25%
        }
      }
      
      if (strategy === 'Infantry Attack') {
        if (isInfantryUnit(unitName, race)) {
          modifiers.defense.negative += effects.infantry_defense_reduction_percent * 100;
        }
        // The defense bonus for non-infantry is dynamic and calculated in battle logic,
        // so it's not represented here as a static modifier.
      }
      
      if (strategy === 'Orc Surrounding') {
        if (isShadowWarriorUnit(unitName, race)) {
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
  const raceKey = race?.toLowerCase();
  if (!raceKey || !UNIT_DATA[raceKey] || !UNIT_DATA[raceKey][unitName]) return false;
  return !!UNIT_DATA[raceKey][unitName].isInfantry;
}

export function isPikemanUnit(unitName: string, race: string): boolean {
  const raceKey = race?.toLowerCase();
  if (!raceKey || !UNIT_DATA[raceKey] || !UNIT_DATA[raceKey][unitName]) return false;
  return !!UNIT_DATA[raceKey][unitName].isPikeman;
}

export function isMountedUnit(unitName: string, race: string): boolean {
  const raceKey = race?.toLowerCase();
  if (!raceKey || !UNIT_DATA[raceKey] || !UNIT_DATA[raceKey][unitName]) return false;
  return !!UNIT_DATA[raceKey][unitName].isMounted;
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

export function isArcherUnit(unitName: string, race: string): boolean {
    const archerNames = ['Archer', 'EliteArcher', 'LightCrossbowman', 'HeavyCrossbowman', 'MountedArchers', 'PhantomArcher', 'Slinger', 'AxeThrower'];
    return archerNames.includes(unitName);
}

export function isShieldbearerUnit(unitName: string, race: string): boolean {
    return unitName === 'Shieldbearer';
} 