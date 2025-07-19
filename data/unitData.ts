// UNIT_DATA: Stores base stats and costs for all units, grouped by race for clarity.
// Usage: UNIT_DATA['dwarf']['Shieldbearer'], UNIT_DATA['elf']['Mage'], etc.
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
  weaponType?: string;
  armorType?: string;
  equipment?: Record<string, number>; // New field: weapons/armors and their quantities
};

export const UNIT_DATA: Record<string, Record<string, UnitStats>> = {
  dwarf: {
    Shieldbearer: { melee: 0, short: 0, range: 0, defense: 20, base_gold_cost: 925, equipment_iron_cost: 6, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 13, food: 4 }, weaponType: undefined, armorType: 'heavy', equipment: { "Plate Armor": 1 } },
    HammerWheilder: { melee: 7, short: 0, range: 0, defense: 7, base_gold_cost: 635, equipment_iron_cost: 8, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 7, food: 3 }, weaponType: 'blade', armorType: 'heavy', equipment: { "Hammer": 1, "Plate Armor": 1 } },
    AxeMan: { melee: 9, short: 0, range: 0, defense: 11, base_gold_cost: 1090, equipment_iron_cost: 8, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 10, food: 4 }, weaponType: 'blade', armorType: 'heavy', equipment: { "Axe": 1, "Plate Armor": 1 } },
    Runner: { melee: 6, short: 2, range: 0, defense: 3, base_gold_cost: 510, equipment_iron_cost: 8, equipment_wood_cost: 4, equipment_gold_cost: 0, upkeep: { gold: 15, food: 4 }, weaponType: 'blade', armorType: undefined, equipment: { "Axe": 4 } },
    LightCrossbowman: { melee: 0, short: 0, range: 2, defense: 5, base_gold_cost: 480, equipment_iron_cost: 3, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 8, food: 2 }, weaponType: 'bow', armorType: 'light', equipment: { "Crossbow": 1, "Chainmail": 1 } },
    HeavyCrossbowman: { melee: 0, short: 0, range: 3, defense: 6, base_gold_cost: 830, equipment_iron_cost: 3, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 10, food: 3 }, weaponType: 'bow', armorType: 'light', equipment: { "Poney": 1, "Crossbow": 1, "Chainmail": 1 } },
  },
  elf: {
    Mage: { melee: 3, short: 0, range: 7, defense: 2, base_gold_cost: 1900, equipment_iron_cost: 0, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 30, food: 2 }, weaponType: undefined, armorType: undefined, equipment: {} },
    Swordman: { melee: 4, short: 0, range: 0, defense: 3, base_gold_cost: 225, equipment_iron_cost: 8, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 8, food: 2 }, weaponType: 'blade', armorType: 'light', equipment: { "Sword": 1, "Light Armor": 1 } },
    Lanceman: { melee: 3, short: 0, range: 0, defense: 3, base_gold_cost: 220, equipment_iron_cost: 5, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 10, food: 2 }, weaponType: 'blade', armorType: 'light', equipment: { "Lance": 1, "Light Armor": 1 } },
    Caragous: { melee: 10, short: 0, range: 0, defense: 11, base_gold_cost: 1295, equipment_iron_cost: 13, equipment_wood_cost: 5, equipment_gold_cost: 0, upkeep: { gold: 12, food: 4 }, weaponType: 'blade', armorType: 'heavy', equipment: { "Lance": 1, "Sword": 1, "Caragous Armor": 1, "Horse": 1 } },
    Archer: { melee: 0, short: 0, range: 3, defense: 2, base_gold_cost: 390, equipment_iron_cost: 0, equipment_wood_cost: 4, equipment_gold_cost: 0, upkeep: { gold: 4, food: 1 }, weaponType: 'bow', armorType: undefined, equipment: { "Bow": 1 } },
    EliteArcher: { melee: 0, short: 0, range: 5, defense: 3, base_gold_cost: 730, equipment_iron_cost: 0, equipment_wood_cost: 8, equipment_gold_cost: 0, upkeep: { gold: 8, food: 3 }, weaponType: 'bow', armorType: undefined, equipment: { "Bow": 2 } },
  },
  gnome: {
    Catapult: { melee: 0, short: 0, range: 15, defense: 25, base_gold_cost: 3480, equipment_iron_cost: 14, equipment_wood_cost: 210, equipment_gold_cost: 0, upkeep: { gold: 40, food: 10 }, weaponType: undefined, armorType: undefined, equipment: { "Plank and Nails": 14 } },
    Infantry: { melee: 2, short: 0, range: 0, defense: 2, base_gold_cost: 210, equipment_iron_cost: 4, equipment_wood_cost: 4, equipment_gold_cost: 0, upkeep: { gold: 4, food: 1 }, weaponType: 'blade', armorType: 'light', equipment: { "Spear": 1, "Leather Armor": 1 } },
    Militia: { melee: 1, short: 0, range: 0, defense: 1, base_gold_cost: 100, equipment_iron_cost: 2, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 1, food: 1 }, weaponType: 'blade', armorType: undefined, equipment: { "Spear": 1 } },
    Rider: { melee: 6, short: 0, range: 0, defense: 6, base_gold_cost: 835, equipment_iron_cost: 6, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 7, food: 3 }, weaponType: 'blade', armorType: 'heavy', equipment: { "Poney": 1, "Spear": 1, "Chainmail": 1 } },
    RockThrower: { melee: 0, short: 0, range: 1, defense: 1, base_gold_cost: 115, equipment_iron_cost: 1, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 1, food: 1 }, weaponType: 'bow', armorType: undefined, equipment: { "Sling": 1 } },
    Balista: { melee: 5, short: 0, range: 10, defense: 15, base_gold_cost: 2380, equipment_iron_cost: 9, equipment_wood_cost: 135, equipment_gold_cost: 0, upkeep: { gold: 22, food: 6 }, weaponType: undefined, armorType: undefined, equipment: { "Plank and Nails": 9 } },
  },
  human: {
    Knight: { melee: 8, short: 1, range: 0, defense: 11, base_gold_cost: 1080, equipment_iron_cost: 14, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 18, food: 5 }, weaponType: 'blade', armorType: 'heavy', equipment: { "Horse": 1, "Sword": 2, "Plate Armor": 1 } },
    Infantry: { melee: 3, short: 0, range: 0, defense: 5, base_gold_cost: 240, equipment_iron_cost: 6, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 4, food: 2 }, weaponType: 'blade', armorType: 'light', equipment: { "Sword": 1, "Light Armor": 1 } },
    Pikeman: { melee: 4, short: 0, range: 0, defense: 3, base_gold_cost: 280, equipment_iron_cost: 5, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 4, food: 2 }, weaponType: 'blade', armorType: 'light', equipment: { "Spear": 1, "Light Armor": 1 } },
    HeavyInfantry: { melee: 7, short: 0, range: 0, defense: 8, base_gold_cost: 680, equipment_iron_cost: 13, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 7, food: 3 }, weaponType: 'blade', armorType: 'heavy', equipment: { "Sword": 2, "Plate Armor": 1 } },
    Archer: { melee: 0, short: 0, range: 2, defense: 3, base_gold_cost: 235, equipment_iron_cost: 3, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 3, food: 3 }, weaponType: 'bow', armorType: 'light', equipment: { "Bow": 1, "Light Armor": 1 } },
    MountedArcher: { melee: 3, short: 0, range: 2, defense: 7, base_gold_cost: 800, equipment_iron_cost: 7, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 11, food: 3 }, weaponType: 'bow', armorType: 'light', equipment: { "Horse": 1, "Sword": 1, "Bow": 1, "Light Armor": 1 } },
  },
  orc: {
    ShadowWarrior: { melee: 8, short: 0, range: 0, defense: 3, base_gold_cost: 820, equipment_iron_cost: 3, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 15, food: 4 }, weaponType: 'blade', armorType: 'light', equipment: { "Leather Armor": 1, "Axe": 1 } },
    Rusher: { melee: 4, short: 0, range: 0, defense: 3, base_gold_cost: 210, equipment_iron_cost: 3, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 4, food: 3 }, weaponType: 'blade', armorType: 'light', equipment: { "Axe": 1, "Leather Armor": 1, "Wolf": 1 } },
    Slother: { melee: 2, short: 0, range: 0, defense: 2, base_gold_cost: 105, equipment_iron_cost: 1, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 2, food: 2 }, weaponType: 'blade', armorType: undefined, equipment: { "Spear": 1, "Wolf": 1 } },
    WolfMaster: { melee: 6, short: 0, range: 1, defense: 3, base_gold_cost: 595, equipment_iron_cost: 4, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 5, food: 3 }, weaponType: 'blade', armorType: 'heavy', equipment: { "Axe": 1, "Wolf": 1, "Enforced Leather Armor": 1 } },
    Slinger: { melee: 0, short: 0, range: 2, defense: 2, base_gold_cost: 65, equipment_iron_cost: 1, equipment_wood_cost: 1, equipment_gold_cost: 0, upkeep: { gold: 2, food: 1 }, weaponType: 'bow', armorType: undefined, equipment: { "Sling": 1 } },
    AxeThrower: { melee: 3, short: 0, range: 3, defense: 2, base_gold_cost: 310, equipment_iron_cost: 7, equipment_wood_cost: 4, equipment_gold_cost: 0, upkeep: { gold: 4, food: 3 }, weaponType: 'blade', armorType: 'light', equipment: { "Axe": 3, "Leather Armor": 1 } },
  },
  undead: {
    DarkKnight: { melee: 8, short: 0, range: 1, defense: 11, base_gold_cost: 1186, equipment_iron_cost: 11, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 21, food: 0 }, weaponType: 'blade', armorType: 'heavy', equipment: {} },
    SkeletalLegion: { melee: 1, short: 0, range: 0, defense: 1, base_gold_cost: 79, equipment_iron_cost: 2, equipment_wood_cost: 0, equipment_gold_cost: 0, upkeep: { gold: 1.5, food: 0 }, weaponType: 'blade', armorType: undefined, equipment: {} },
    WraithPikeman: { melee: 4, short: 0, range: 0, defense: 4, base_gold_cost: 285, equipment_iron_cost: 4, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 6, food: 0 }, weaponType: 'blade', armorType: 'light', equipment: {} },
    AbominationCaragous: { melee: 4, short: 0, range: 0, defense: 3, base_gold_cost: 1486, equipment_iron_cost: 11, equipment_wood_cost: 3, equipment_gold_cost: 0, upkeep: { gold: 14, food: 0 }, weaponType: 'blade', armorType: 'heavy', equipment: {} },
    PhantomArcher: { melee: 0, short: 0, range: 2, defense: 3, base_gold_cost: 485, equipment_iron_cost: 3, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 5, food: 0 }, weaponType: 'bow', armorType: undefined, equipment: {} },
    WraithRider: { melee: 3, short: 0, range: 2, defense: 7, base_gold_cost: 745, equipment_iron_cost: 6, equipment_wood_cost: 2, equipment_gold_cost: 0, upkeep: { gold: 13, food: 0 }, weaponType: 'blade', armorType: 'light', equipment: {} },
  },
};
