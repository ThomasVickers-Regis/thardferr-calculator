// UNIT_DATA: Stores base stats and costs for all units, with equipment costs separated as per game data.
// This is a comprehensive list based on the user's summary and tardcal.xlsx.

export type UnitStats = {
  melee: number;
  short: number;
  range: number;
  defense: number;
  base_gold_cost: number;
  equipment_iron_cost: number;
  equipment_wood_cost: number;
  equipment_gold_cost: number;
  upkeep: { gold: number; food: number };
};

export const UNIT_DATA: Record<string, UnitStats> = {
  "Dwarf Shieldbearer": { melee: 0, short: 0, range: 0, defense: 20, base_gold_cost: 925, equipment_iron_cost: 6, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 13, food: 4 } },
  "Dwarf Hammer Wheilder": { melee: 7, short: 0, range: 0, defense: 7, base_gold_cost: 635, equipment_iron_cost: 8, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 7, food: 3 } },
  "Dwarf Axe Man": { melee: 9, short: 0, range: 0, defense: 11, base_gold_cost: 1090, equipment_iron_cost: 8, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 10, food: 4 } },
  "Dwarf Runner": { melee: 6, short: 2, range: 0, defense: 3, base_gold_cost: 510, equipment_iron_cost: 8, equipment_wood_cost: 4, equipment_gold_cost: 0, upkeep: { gold: 15, food: 4 } },
  "Dwarf Light Crossbowman": { melee: 0, short: 0, range: 2, defense: 5, base_gold_cost: 480, equipment_iron_cost: 3, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 8, food: 2 } },
  "Dwarf Heavy Crossbowman": { melee: 0, short: 0, range: 3, defense: 6, base_gold_cost: 830, equipment_iron_cost: 3, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 10, food: 3 } },
  "Elf Mage": { melee: 3, short: 0, range: 7, defense: 2, base_gold_cost: 1900, equipment_iron_cost: 0, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 30, food: 2 } },
  "Elf Swordman": { melee: 4, short: 0, range: 0, defense: 3, base_gold_cost: 225, equipment_iron_cost: 8, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 8, food: 2 } },
  "Elf Lanceman": { melee: 3, short: 0, range: 0, defense: 3, base_gold_cost: 220, equipment_iron_cost: 5, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 10, food: 2 } },
  "Elf Caragous": { melee: 10, short: 0, range: 0, defense: 11, base_gold_cost: 1295, equipment_iron_cost: 13, equipment_wood_cost: 5, equipment_gold_cost: 0, upkeep: { gold: 12, food: 4 } },
  "Elf Archer": { melee: 0, short: 0, range: 3, defense: 2, base_gold_cost: 390, equipment_iron_cost: 0, equipment_wood_cost: 4, equipment_gold_cost: 0, upkeep: { gold: 4, food: 1 } },
  "Elf Elite Archer": { melee: 0, short: 0, range: 5, defense: 3, base_gold_cost: 730, equipment_iron_cost: 0, equipment_wood_cost: 8, equipment_gold_cost: 0, upkeep: { gold: 8, food: 3 } },
  "Gnome Catapult": { melee: 0, short: 0, range: 15, defense: 25, base_gold_cost: 3480, equipment_iron_cost: 14, equipment_wood_cost: 210, equipment_gold_cost: 0, upkeep: { gold: 40, food: 10 } },
  "Gnome Infantry": { melee: 2, short: 0, range: 0, defense: 2, base_gold_cost: 210, equipment_iron_cost: 4, equipment_wood_cost: 4, equipment_gold_cost: 0, upkeep: { gold: 4, food: 1 } },
  "Gnome Militia": { melee: 1, short: 0, range: 0, defense: 1, base_gold_cost: 100, equipment_iron_cost: 2, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 1, food: 1 } },
  "Gnome Rider": { melee: 6, short: 0, range: 0, defense: 6, base_gold_cost: 835, equipment_iron_cost: 6, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 7, food: 3 } },
  "Gnome Rock Thrower": { melee: 0, short: 0, range: 1, defense: 1, base_gold_cost: 115, equipment_iron_cost: 1, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 1, food: 1 } },
  "Gnome Balista": { melee: 5, short: 0, range: 10, defense: 15, base_gold_cost: 2380, equipment_iron_cost: 9, equipment_wood_cost: 135, equipment_gold_cost: 0, upkeep: { gold: 22, food: 6 } },
  "Human Knight": { melee: 8, short: 1, range: 0, defense: 11, base_gold_cost: 1080, equipment_iron_cost: 14, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 18, food: 5 } },
  "Human Infantry": { melee: 3, short: 0, range: 0, defense: 5, base_gold_cost: 240, equipment_iron_cost: 6, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 4, food: 2 } },
  "Human Pikeman": { melee: 4, short: 0, range: 0, defense: 3, base_gold_cost: 280, equipment_iron_cost: 5, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 4, food: 2 } },
  "Human Heavy Infantry": { melee: 7, short: 0, range: 0, defense: 8, base_gold_cost: 680, equipment_iron_cost: 13, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 7, food: 3 } },
  "Human Archer": { melee: 0, short: 0, range: 2, defense: 3, base_gold_cost: 235, equipment_iron_cost: 3, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 3, food: 3 } },
  "Human Mounted Archer": { melee: 3, short: 0, range: 2, defense: 7, base_gold_cost: 800, equipment_iron_cost: 7, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 11, food: 3 } },
  "Orc Shadow Warrior": { melee: 8, short: 0, range: 0, defense: 3, base_gold_cost: 820, equipment_iron_cost: 3, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 15, food: 4 } },
  "Orc Rusher": { melee: 4, short: 0, range: 0, defense: 3, base_gold_cost: 210, equipment_iron_cost: 3, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 4, food: 3 } },
  "Orc Slother": { melee: 2, short: 0, range: 0, defense: 2, base_gold_cost: 105, equipment_iron_cost: 1, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 2, food: 2 } },
  "Orc Wolf Master": { melee: 6, short: 0, range: 1, defense: 3, base_gold_cost: 595, equipment_iron_cost: 4, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 5, food: 3 } },
  "Orc Slinger": { melee: 0, short: 0, range: 2, defense: 2, base_gold_cost: 65, equipment_iron_cost: 1, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 2, food: 1 } },
  "Orc Axe Thrower": { melee: 3, short: 0, range: 3, defense: 2, base_gold_cost: 310, equipment_iron_cost: 7, equipment_wood_cost: 4, equipment_gold_cost: 0, upkeep: { gold: 4, food: 3 } },
  "Undead Dark Knight": { melee: 8, short: 0, range: 1, defense: 11, base_gold_cost: 1186, equipment_iron_cost: 11, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 21, food: 0 } },
  "Undead Skeletal Legion": { melee: 1, short: 0, range: 0, defense: 1, base_gold_cost: 79, equipment_iron_cost: 2, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 1.5, food: 0 } },
  "Undead Wraith Pikeman": { melee: 4, short: 0, range: 0, defense: 4, base_gold_cost: 285, equipment_iron_cost: 4, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 6, food: 0 } },
  "Undead Abomination Caragous": { melee: 4, short: 0, range: 0, defense: 3, base_gold_cost: 1486, equipment_iron_cost: 11, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 14, food: 0 } },
  "Undead Phantom Archer": { melee: 0, short: 0, range: 2, defense: 3, base_gold_cost: 485, equipment_iron_cost: 3, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 5, food: 0 } },
  "Undead Wraith Rider": { melee: 3, short: 0, range: 2, defense: 7, base_gold_cost: 745, equipment_iron_cost: 6, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 13, food: 0 } }
};
