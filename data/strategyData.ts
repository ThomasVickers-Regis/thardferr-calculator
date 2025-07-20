// STRATEGY_DATA: Stores effects for each racial and general strategy.

export type StrategyEffect = Record<string, any>;

export type StrategyData = {
  type: string;
  description: string;
  effects: StrategyEffect;
};

export const STRATEGY_DATA: Record<string, StrategyData> = {
  "Archer Protection": {
    type: "General",
    description: "Infantry stays back to protect archers.",
    effects: {
      infantry_attack_multiplier: 0.5,
      archer_damage_reduction_by_infantry_attack: true
    }
  },
  "Infantry Attack": {
    type: "General",
    description: "Infantry sent first to kill powerful units.",
    effects: {
      infantry_damage_multiplier: 2.5,
      other_units_damage_reduced: true
    }
  },
  "Quick Retreat": {
    type: "General",
    description: "Minimize losses, effective for land capture/defense with minimal loss.",
    effects: {
      all_unit_attack_multiplier: 0.5,
      victory_chance_reduction: 0.5
    }
  },
  "Anti-Cavalry": {
    type: "General",
    description: "Pikemen upfront against mounted units.",
    effects: {
      pikemen_attack_vs_mounted_multiplier: 3.5,
      all_units_attack_multiplier: 0.9
    }
  },
  "Dwarf Shield Line": {
    type: "Dwarf Unique",
    description: "Shieldbearers form a front line against ranged attackers.",
    effects: {
      all_units_close_combat_attack_reduction_percent: 0.10,
      enemy_long_ranged_attack_reduction_multiplier: "2 * percentage_of_shieldbearers_in_army",
      shieldbearers_close_combat_damage_increase_percent: 1.00,
      other_units_damage_reduced_by_shieldbearer_damage: true
    }
  },
  "Elf Energy Gathering": {
    type: "Elf Unique",
    description: "Wizards use magical energy for powerful spells.",
    effects: {
      wizards_defense_increase: 2,
      wizards_close_combat_damage_multiplier: 2,
      wizards_ranged_attack_increase: 4,
      mage_loses_melee_invisibility: true
    }
  },
  "Gnome Far Fighting": {
    type: "Gnome Unique",
    description: "Place army farther on battlefield for more ranged attacks.",
    effects: {
      long_range_attack_doubled_for_both_sides: true
    }
  },
  "Human Charging!": {
    type: "Human Unique",
    description: "Knights charge first, breaking enemy lines.",
    effects: {
      knights_attack_multiplier: 1.5,
      knights_damage_multiplier: 1.5
    }
  },
  "Orc Surrounding": {
    type: "Orc Unique",
    description: "Shadow Warriors surround/infiltrate for maximum damage.",
    effects: {
      shadow_warriors_defense_increase: 2,
      all_shadow_warriors_damages_in_short_ranged_phase: true,
      chances_of_being_detected_increased_percent: 0.25
    }
  },
  "Orc Berserker": {
    type: "Orc Unique (from previous discussion, not changelog)",
    description: "All units fight with increased fury but reduced defense.",
    effects: {
      all_units_damage_increase: 3,
      all_units_defense_divide_by: 2
    }
  },
  "Orc": {
    type: "Orc Unique",
    description: "Standard Orc strategy affecting Shadow Warrior immunity.",
    effects: {
      shadow_warrior_melee_immunity_reduction: 5 // Reduces from 80% to 75%
    }
  }
};
