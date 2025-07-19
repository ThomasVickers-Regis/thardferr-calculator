// WEAPON_DATA: Reference for all weapon types used in Thardferr units.
// Used for technology calculations and UI display. See unitData.ts for per-unit equipment costs.

export type WeaponType = {
  name: string;
  type: 'blade' | 'bow' | 'siege';
  description: string;
  techTags?: string[]; // For future tech interactions
};

export type WeaponCost = {
  name: string;
  race: string;
  iron: number;
  wood: number;
  gold: number;
};

export const WEAPON_DATA: Record<string, WeaponCost> = {
  // Dwarf
  "Poney": { name: "Poney", race: "Dwarf", iron: 0, wood: 0, gold: 150 },
  "Axe": { name: "Axe", race: "Dwarf", iron: 2, wood: 1, gold: 15 },
  "Hammer": { name: "Hammer", race: "Dwarf", iron: 2, wood: 1, gold: 10 },
  "Crossbow": { name: "Crossbow", race: "Dwarf", iron: 0, wood: 3, gold: 30 },
  "Plate Armor": { name: "Plate Armor", race: "Dwarf", iron: 6, wood: 0, gold: 175 },
  "Chainmail": { name: "Chainmail", race: "Dwarf", iron: 3, wood: 0, gold: 125 },
  // Elf
  "Horse": { name: "Horse", race: "Elf", iron: 1, wood: 0, gold: 300 },
  "Sword": { name: "Sword", race: "Elf", iron: 4, wood: 1, gold: 25 },
  "Lance": { name: "Lance", race: "Elf", iron: 1, wood: 3, gold: 20 },
  "Bow": { name: "Bow", race: "Elf", iron: 0, wood: 4, gold: 40 },
  "Caragous Armor": { name: "Caragous Armor", race: "Elf", iron: 7, wood: 1, gold: 200 },
  "Light Armor": { name: "Light Armor", race: "Elf", iron: 4, wood: 0, gold: 100 },
  // Gnome
  "Gnome Poney": { name: "Poney", race: "Gnome", iron: 1, wood: 0, gold: 250 },
  "Plank and Nails": { name: "Plank and Nails", race: "Gnome", iron: 1, wood: 15, gold: 70 },
  "Spear": { name: "Spear", race: "Gnome", iron: 2, wood: 3, gold: 10 },
  "Sling": { name: "Sling", race: "Gnome", iron: 1, wood: 1, gold: 15 },
  "Gnome Chainmail": { name: "Chainmail", race: "Gnome", iron: 6, wood: 0, gold: 175 },
  "Leather Armor": { name: "Leather Armor", race: "Gnome", iron: 2, wood: 1, gold: 125 },
  // Human
  "Human Horse": { name: "Horse", race: "Human", iron: 1, wood: 0, gold: 350 },
  "Human Sword": { name: "Sword", race: "Human", iron: 3, wood: 0, gold: 15 },
  "Human Spear": { name: "Spear", race: "Human", iron: 2, wood: 3, gold: 5 },
  "Human Bow": { name: "Bow", race: "Human", iron: 0, wood: 3, gold: 10 },
  "Human Plate Armor": { name: "Plate Armor", race: "Human", iron: 7, wood: 0, gold: 200 },
  "Human Light Armor": { name: "Light Armor", race: "Human", iron: 3, wood: 0, gold: 125 },
  // Orc
  "Wolf": { name: "Wolf", race: "Orc", iron: 0, wood: 0, gold: 50 },
  "Orc Axe": { name: "Axe", race: "Orc", iron: 2, wood: 1, gold: 20 },
  "Orc Spear": { name: "Spear", race: "Orc", iron: 1, wood: 3, gold: 10 },
  "Orc Sling": { name: "Sling", race: "Orc", iron: 1, wood: 1, gold: 5 },
  "Enforced Leather Armor": { name: "Enforced Leather Armor", race: "Orc", iron: 2, wood: 1, gold: 125 },
  "Orc Leather Armor": { name: "Leather Armor", race: "Orc", iron: 1, wood: 1, gold: 100 },
};
