// TECHNOLOGY_DATA: Stores effects for each level of relevant technologies.

export type TechnologyLevel = {
  miss_chance?: number;
  damage_increase_percent?: number;
  defense_increase_percent?: number;
};

export type TechnologyData = {
  description: string;
  base_miss_chance?: number;
  levels: Record<string, TechnologyLevel>;
};

export const TECHNOLOGY_DATA: Record<string, TechnologyData> = {
  "Ranged Accuracy": {
    description: "Increases the accuracy of ranged units so their arrows strike true more often.",
    base_miss_chance: 0.5,
    levels: {
      "1": { miss_chance: 0.4 },
      "2": { miss_chance: 0.3 },
      "3": { miss_chance: 0.2 },
      "4": { miss_chance: 0.1 }
    }
  },
  "Improved Range Structure": {
    description: "Increases damage from Short and Long Range attacks.",
    levels: {
      "1": { damage_increase_percent: 0.10 },
      "2": { damage_increase_percent: 0.20 },
      "3": { damage_increase_percent: 0.30 },
      "4": { damage_increase_percent: 0.40 },
      "5": { damage_increase_percent: 0.50 }
    }
  },
  "Sharper Blades Structure": {
    description: "Increases damage from all melee damage units.",
    levels: {
      "1": { damage_increase_percent: 0.10 },
      "2": { damage_increase_percent: 0.20 },
      "3": { damage_increase_percent: 0.30 },
      "4": { damage_increase_percent: 0.40 },
      "5": { damage_increase_percent: 0.50 }
    }
  },
  "Hardening": {
    description: "Increases defense of all units. Type of armor used does not impact this technology.",
    levels: {
      "1": { defense_increase_percent: 0.10 },
      "2": { defense_increase_percent: 0.20 },
      "3": { defense_increase_percent: 0.30 },
      "4": { defense_increase_percent: 0.40 },
      "5": { defense_increase_percent: 0.50 }
    }
  }
};
