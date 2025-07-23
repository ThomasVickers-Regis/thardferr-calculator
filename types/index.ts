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
export type RoundResult = any;

export interface KingdomStats {
  KS: number; // Kingdom Strength (total attack + defense, or similar)
  [key: string]: any;
}

export interface BattleLogEntry {
  round: number;
  roundResult: RoundResult;
  yourArmy: Army;
  enemyArmy: Army;
}

export interface BattleOutcome {
  winner: 'yourArmy' | 'enemyArmy' | 'draw';
  rounds: number;
  finalYourArmy: Army;
  finalEnemyArmy: Army;
  finalYourArmyBeforeHealing: Army;
  finalEnemyArmyBeforeHealing: Army;
  battleLog: BattleLogEntry[];
  yourHealing: Record<string, number>;
  enemyHealing: Record<string, number>;
} 