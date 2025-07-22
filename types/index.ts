export type Army = Record<string, number>;

export type PhaseType = 'range' | 'short' | 'melee';

export type TechLevels = Record<string, number>;

export type StrategyName =
  | 'Human Charging!'
  | 'Elf Energy Gathering'
  | 'Orc Berserker'
  | 'Orc Surrounding'
  | 'Quick Retreat'
  | 'Anti-Cavalry'
  | 'Archer Protection'
  | 'Dwarf Shield Line'
  | 'Gnome Far Fighting'
  | 'Infantry Attack'
  | 'Undead Sacrifice'
  | 'Orc'
  | null;

export type Buildings = Record<string, number>;

// Placeholder types, can be refined later
export type BattleLog = any;
export type UnitBattleLog = any;
export type PhaseLog = any; 