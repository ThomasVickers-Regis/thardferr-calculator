// TECHNOLOGY_DATA: Stores effects for each level of relevant technologies.

export type TechnologyLevel = {
  miss_chance?: number;
  damage_increase_percent?: number;
  defense_increase_percent?: number;
};

export type TechnologyData = {
  description: string;
  stat?: 'melee' | 'range' | 'defense';
  weaponType?: string;
  armorType?: string;
  flat_bonus?: number;
  percent_bonus?: number;
  maxLevel?: number;
  cost?: number;
  researchTime?: number;
  levels: Record<string, TechnologyLevel>;
};

export type TechnologyTreeTech = {
  name: string;
  effect: string;
  level: number;
  researchTime: number;
  cost: number;
  description?: string;
  maxLevel?: number;
};

export const TECHNOLOGY_DATA: Record<string, TechnologyData> = {
  "Sharper Blades": {
    description: "Increases damages from Sword and Lance.",
    stat: 'melee',
    weaponType: 'blade',
    flat_bonus: 1,
    maxLevel: 3,
    cost: 200000,
    researchTime: 60,
    levels: { "1": {}, "2": {}, "3": {} }
  },
  "Improve Bow Range": {
    description: "Increases number of attacks from Bow.",
    stat: 'range',
    weaponType: 'bow',
    percent_bonus: 0.5,
    maxLevel: 1,
    cost: 200000,
    researchTime: 100,
    levels: { "1": {} }
  },
  "Tougher Light Armor": {
    description: "Increases defence of units wearing a Light Armor.",
    stat: 'defense',
    armorType: 'light',
    flat_bonus: 1,
    maxLevel: 4,
    cost: 100000,
    researchTime: 100,
    levels: { "1": {}, "2": {}, "3": {}, "4": {} }
  },
  "Tougher Caragous Armor": {
    description: "Increases defence of units wearing a Caragous Armor.",
    stat: 'defense',
    armorType: 'caragous',
    flat_bonus: 1,
    maxLevel: 2,
    cost: 120000,
    researchTime: 75,
    levels: { "1": {}, "2": {} }
  },
  "Magic Field": {
    description: "Allows mages to cast kingdom spells (as wizards normally do). Mage spells are identified by a * in the spell casting options.",
    maxLevel: 1,
    cost: 500000,
    researchTime: 175,
    levels: { "1": {} }
  },
  "Convertion": {
    description: "Increases the number of peasants joining your kingdom after capturing land from an enemy.",
    maxLevel: 6,
    cost: 300000,
    researchTime: 50,
    levels: { "1": {}, "2": {}, "3": {}, "4": {}, "5": {}, "6": {} }
  },
  "Habitation": {
    description: "Increases the number of peasants per house to 115.",
    maxLevel: 12,
    cost: 200000,
    researchTime: 40,
    levels: { "1": {}, "2": {}, "3": {}, "4": {}, "5": {}, "6": {}, "7": {}, "8": {}, "9": {}, "10": {}, "11": {}, "12": {} }
  },
  "Irrigation": {
    description: "Increases the number of food produced per farm by 15.",
    maxLevel: 3,
    cost: 50000,
    researchTime: 150,
    levels: { "1": {}, "2": {}, "3": {} }
  },
  "New Spells": {
    description: "Research new spells.",
    maxLevel: 6,
    cost: 150000,
    researchTime: 50,
    levels: { "1": {}, "2": {}, "3": {}, "4": {}, "5": {}, "6": {} }
  },
  "Castle Loss Immunity": {
    description: "When you win a castle in battle, your kingdom gains 12 hours of Castle Loss Immunity (CLI). Applies to regular attack or retaliation.",
    maxLevel: 5,
    cost: 100000,
    researchTime: 20,
    levels: { "1": {}, "2": {}, "3": {}, "4": {}, "5": {} }
  },
  "Thane’s Table Etiquette": {
    description: "General population food consumption is halved.",
    maxLevel: 1,
    cost: 250000,
    researchTime: 48,
    levels: { "1": {} }
  }
};

export const TECHNOLOGY_TREES: Record<string, TechnologyTreeTech[]> = {
  Tree1: [
    { name: 'Field-glass', effect: 'Doubles exploration efficiency.', level: 1, researchTime: 30, cost: 50000, maxLevel: 1 },
    { name: 'Convertion', effect: 'Increases the number of peasants joining your kingdom after capturing land from an enemy.', level: 2, researchTime: 50, cost: 300000, maxLevel: 1 },
    { name: 'Transport', effect: 'Reduces attack time to 18 days.', level: 3, researchTime: 60, cost: 500000, maxLevel: 1 },
    { name: 'Leadership', effect: 'Increase minimum Basic Army Strength to 0 and gives natural Basic Army Strength growth.', level: 4, researchTime: 40, cost: 400000, maxLevel: 1 },
    { name: 'Improved Law System', effect: 'Reduce crime rate natural growth and reduce maximum crime rate to 25%.', level: 5, researchTime: 70, cost: 500000, maxLevel: 1 },
    { name: 'Tactical Knowledge', effect: 'Greatly improves chances of victory in combat.', level: 6, researchTime: 100, cost: 2500000, maxLevel: 1 }
  ],
  Tree2: [
    { name: 'Habitation', effect: 'Increases the number of peasants per house to 115.', level: 1, researchTime: 40, cost: 200000, maxLevel: 1 },
    { name: 'Commerce', effect: 'Increases gold production.', level: 2, researchTime: 60, cost: 300000, maxLevel: 1 },
    { name: 'Animal training', effect: 'Increases animal weapon production by 20%.', level: 3, researchTime: 15, cost: 100000, maxLevel: 1 },
    { name: 'Blacksmithing', effect: 'Increases weapon production by 20%.', level: 4, researchTime: 15, cost: 100000, maxLevel: 1 },
    { name: 'Carpentry', effect: 'Increases building construction speed by 50%.', level: 5, researchTime: 60, cost: 400000, maxLevel: 1 },
    { name: 'Barrack', effect: 'Increases the number of men that can be housed in a guard house to 65.', level: 6, researchTime: 50, cost: 300000, maxLevel: 1 },
    { name: 'Training techniques', effect: 'Increases unit production speed by 25%.', level: 7, researchTime: 100, cost: 1000000, maxLevel: 1 },
    { name: 'Fortification', effect: 'Decreases enemy attack power by 5% when defending a castle.', level: 8, researchTime: 125, cost: 400000, maxLevel: 1 }
  ],
  Tree3: [
    { name: 'Irrigation', effect: 'Increases the number of food produced per farm by 15.', level: 1, researchTime: 150, cost: 50000, maxLevel: 1 },
    { name: 'Machinery', effect: 'Decreases the optimal worker level for Mines to 85.', level: 2, researchTime: 175, cost: 200000, maxLevel: 1 },
    { name: 'Wood Recycling', effect: 'Increases wood production by 1.5 per Mill.', level: 3, researchTime: 240, cost: 300000, maxLevel: 1 }
  ],
  Tree4: [
    { name: 'New Spells', effect: 'Adds new spells to your spellbook.', level: 1, researchTime: 50, cost: 150000, maxLevel: 4 },
    { name: 'Insight', effect: 'Decreases wizard rest time. They will rest at a rate of 2 per school per day.', level: 2, researchTime: 150, cost: 100000, maxLevel: 1 },
    { name: 'Magical Instruments', effect: 'Greatly improves spell casting success.', level: 3, researchTime: 100, cost: 2000000, maxLevel: 1 }
  ]
};

export const RACE_UNIQUE_TECHS: Record<string, TechnologyTreeTech> = {
  Dwarf: { name: 'True Silver', effect: 'Researching new materials for shield creating has been found to help in many great armies. Allows creation of True Silver shields for shieldbearers.', level: 1, researchTime: 0, cost: 0, maxLevel: 1 },
  Elf: { name: 'Magic Field', effect: 'Allows mages to cast kingdom spells (as wizards normally do). Mage spells are identified by a * in the spell casting options.', level: 1, researchTime: 0, cost: 0, maxLevel: 1 },
  Gnome: { name: 'Explosive powder', effect: 'Allows you to build explosive projectiles for your catapults, increasing their attack radius.', level: 1, researchTime: 0, cost: 0, maxLevel: 1 },
  Human: { name: 'Clerical Magic', effect: 'Allows trainers to include clerical magic in knight formation, reducing combat losses.', level: 1, researchTime: 0, cost: 0, maxLevel: 1 },
  Orc: { name: 'Cloacking', effect: 'Provides shadow warriors equipment suited to hide in different areas more effectively, decreasing the chances of being found by 15%.', level: 1, researchTime: 0, cost: 0, maxLevel: 1 }
};
