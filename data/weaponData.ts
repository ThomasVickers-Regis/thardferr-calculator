// WEAPON_DATA: Reference for all weapon types used in Thardferr units.
// Used for technology calculations and UI display. See unitData.ts for per-unit equipment costs.

export type WeaponType = {
  name: string;
  type: 'blade' | 'bow' | 'siege';
  description: string;
  techTags?: string[]; // For future tech interactions
};

export const WEAPON_DATA: Record<string, WeaponType> = {
  blade: {
    name: 'Blade',
    type: 'blade',
    description: 'Includes swords, axes, hammers, lances, and spears. Used for melee and short-range attacks.',
    techTags: ['melee', 'short'],
  },
  bow: {
    name: 'Bow',
    type: 'bow',
    description: 'Includes bows, crossbows, and slings. Used for ranged attacks.',
    techTags: ['ranged'],
  },
  siege: {
    name: 'Siege',
    type: 'siege',
    description: 'Siege weapons such as catapults and balistae. Used for siege and special attacks.',
    techTags: ['siege', 'ranged'],
  },
};
