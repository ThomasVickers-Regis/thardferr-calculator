// BUILDING_DATA: Placeholder structure, as detailed info is not available from provided sources.

export type BuildingData = {
  cost: { gold: number | null; iron: number | null; wood: number | null };
  production?: { [resource: string]: number | null };
  housing?: { [type: string]: number | null };
  training_rate?: number | null;
  defense_bonus?: number | null;
  healing_percent?: number | null;
  optimal_workers?: number | null;
  production_per_day?: number | null;
  per_race_bonus?: { [race: string]: any };
  unit_production?: { [race: string]: { [unit: string]: { per_building: number; per_day: number } } };
};

export const BUILDING_DATA: Record<string, BuildingData> = {
  "Advanced Training Center": {
    cost: { gold: 2250, iron: 150, wood: 150 },
    unit_production: {
      Dwarf: {
        "Dwarf Shieldbearer": { per_building: 4, per_day: 1 },
        "Dwarf Runner": { per_building: 5, per_day: 1 },
        "Dwarf Heavy Crossbowman": { per_building: 5, per_day: 1 }
      },
      Elf: {
        "Elf Mage": { per_building: 7, per_day: 1 },
        "Elf Caragous": { per_building: 5, per_day: 1 },
        "Elf Elite Archer": { per_building: 3, per_day: 1 }
      },
      Gnome: {
        "Gnome Catapult": { per_building: 8, per_day: 1 },
        "Gnome Rider": { per_building: 5, per_day: 1 },
        "Gnome Balista": { per_building: 7, per_day: 1 }
      },
      Human: {
        "Human Knight": { per_building: 6, per_day: 1 },
        "Human Heavy Infantry": { per_building: 5, per_day: 1 },
        "Human Mounted Archer": { per_building: 4, per_day: 1 }
      },
      Orc: {
        "Orc Shadow Warrior": { per_building: 6, per_day: 1 },
        "Orc Wolf Master": { per_building: 5, per_day: 1 },
        "Orc Axe Thrower": { per_building: 5, per_day: 1 }
      },
      Undead: {
        "Undead Dark Knight": { per_building: 6, per_day: 1 },
        "Undead Abomination Caragous": { per_building: 5, per_day: 1 },
        "Undead Wraith Rider": { per_building: 4, per_day: 1 }
      }
    }
  },
  Castle: { cost: { gold: 45000, iron: 1250, wood: 750 }, defense_bonus: null },
  Farm: {
    cost: { gold: 1500, iron: 0, wood: 100 },
    production: { food: 100 },
    optimal_workers: 60,
    production_per_day: 100,
    per_race_bonus: { Orc: { production_per_day: 115 } }
  },
  Forge: {
    cost: { gold: 2250, iron: 50, wood: 50 },
    optimal_workers: 80,
    production_per_day: null
  },
  "Guard House": {
    cost: { gold: 1500, iron: 0, wood: 75 },
    housing: { soldiers: 40 },
    per_race_bonus: { Orc: { housing: 50 }, Gnome: { housing: 60 } }
  },
  "Guard Towers": {
    cost: { gold: 1200, iron: 15, wood: 75 },
    defense_bonus: 40
  },
  House: {
    cost: { gold: 1050, iron: 0, wood: 50 },
    housing: { peasants: 100 }
  },
  Market: {
    cost: { gold: 1500, iron: 50, wood: 150 },
    production: { gold: null }
  },
  "Medical Center": {
    cost: { gold: 3000, iron: 10, wood: 50 },
    healing_percent: 20
  },
  Mill: {
    cost: { gold: 450, iron: 0, wood: 50 },
    production: { wood: 5 },
    optimal_workers: 85,
    production_per_day: 5,
    per_race_bonus: { Elf: { production_per_day: 6 }, Orc: { production_per_day: 7 } }
  },
  Mine: {
    cost: { gold: 600, iron: 100, wood: 50 },
    production: { iron: 4 },
    optimal_workers: 100,
    production_per_day: 4,
    per_race_bonus: { Dwarf: { production_per_day: 5 }, Orc: { production_per_day: 6 } }
  },
  School: {
    cost: { gold: 750, iron: 50, wood: 100 },
    housing: { wizards: 40 },
    per_race_bonus: { Gnome: { housing: 60 } }
  },
  "Training Center": {
    cost: { gold: 1800, iron: 125, wood: 125 },
    unit_production: {
      Dwarf: {
        "Dwarf Hammer Wheilder": { per_building: 4, per_day: 1 },
        "Dwarf Axe Man": { per_building: 5, per_day: 1 },
        "Dwarf Light Crossbowman": { per_building: 3, per_day: 1 }
      },
      Elf: {
        "Elf Swordman": { per_building: 3, per_day: 1 },
        "Elf Lanceman": { per_building: 4, per_day: 1 },
        "Elf Archer": { per_building: 2, per_day: 1 }
      },
      Gnome: {
        "Gnome Infantry": { per_building: 3, per_day: 1 },
        "Gnome Militia": { per_building: 1, per_day: 10 },
        "Gnome Rock Thrower": { per_building: 1, per_day: 10 }
      },
      Human: {
        "Human Infantry": { per_building: 3, per_day: 1 },
        "Human Pikeman": { per_building: 4, per_day: 1 },
        "Human Archer": { per_building: 3, per_day: 1 }
      },
      Orc: {
        "Orc Rusher": { per_building: 3, per_day: 1 },
        "Orc Slother": { per_building: 2, per_day: 1 },
        "Orc Slinger": { per_building: 3, per_day: 1 }
      }
    }
  }
};
