// BUILDING_DATA: Placeholder structure, as detailed info is not available from provided sources.

export type BuildingData = {
  cost: { gold: number | null; iron: number | null; wood: number | null };
  production?: { [resource: string]: number | null };
  housing?: { [type: string]: number | null };
  training_rate?: number | null;
  defense_bonus?: number | null;
  healing_percent?: number | null;
};

export const BUILDING_DATA: Record<string, BuildingData> = {
  Farm: { cost: { gold: null, iron: null, wood: null }, production: { food: null }, housing: { peasants: null }, training_rate: null },
  Forge: { cost: { gold: null, iron: null, wood: null }, production: { weapons: null }, housing: { peasants: null }, training_rate: null },
  "Guard House": { cost: { gold: null, iron: null, wood: null }, defense_bonus: null, housing: { soldiers: null } },
  "Training Center": { cost: { gold: null, iron: null, wood: null }, training_rate: null },
  "Advanced Training Center": { cost: { gold: null, iron: null, wood: null }, training_rate: null },
  School: { cost: { gold: null, iron: null, wood: null }, training_rate: null },
  House: { cost: { gold: null, iron: null, wood: null }, housing: { peasants: null } },
  Market: { cost: { gold: null, iron: null, wood: null } },
  Mill: { cost: { gold: null, iron: null, wood: null }, production: { wood: null } },
  Mine: { cost: { gold: null, iron: null, wood: null }, production: { iron: null } },
  "Medical Center": { cost: { gold: null, iron: null, wood: null }, healing_percent: null },
  Castle: { cost: { gold: null, iron: null, wood: null }, defense_bonus: null }
};
