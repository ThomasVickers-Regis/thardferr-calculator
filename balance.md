# THARDFERR COMPREHENSIVE UNIT BALANCE ANALYSIS
## Based on Actual Code Analysis - FINAL REVIEW

---

## 📋 TABLE OF CONTENTS

1. [Critical Balance Issues](#critical-balance-issues)
2. [Detailed Unit Analysis](#detailed-unit-analysis)
3. [Proposed Balance Fixes](#proposed-balance-fixes)
4. [Implementation Phases](#implementation-phases)
5. [Comprehensive Changes Table](#comprehensive-changes-table)
6. [Balance Impact Analysis](#balance-impact-analysis)

---

## 🚨 CRITICAL BALANCE ISSUES

### 1. Technology Imbalance
**Problem**: Heavy armor technology is severely underpowered compared to light armor
- **Light Armor**: Level 4 max (+4 defense)
- **Heavy Armor**: Level 2 max (+2 defense)
- **Impact**: Heavy armor units get half the technology bonus despite being used by elite units

### 2. Undead Economic Advantage
**Problem**: Undead units have massive economic advantages
- **SkeletalLegion**: 79g cost for 1/1/0/1 stats (79g per stat point)
- **WraithPikeman**: 285g cost for 4/0/0/4 stats (35.6g per stat point)
- **No Food Upkeep**: All undead units avoid food costs entirely

### 3. Range Phase Dominance
**Problem**: Range phase is too lethal, wiping armies before melee combat
- **Catapult**: 15 range damage (army-deleting)
- **Balista**: 10 range damage (very powerful)
- **Mage**: 7 range damage (potent magical damage)
- **EliteArcher**: 5 range damage (strong for archer)

### 4. Single-Phase Units
**Problem**: Many units only contribute in one phase
- **Melee-only units**: No range or short range damage
- **Range-only units**: No melee or short range damage
- **Short range phase**: Largely irrelevant (most units have 0 short damage)

### 5. Guard House Slot System
**Problem**: Code assumes all units take 1 slot, but actual game has different requirements
- **Catapult**: 5 guard house slots (not 1!)
- **Balista**: 4 guard house slots (not 1!)
- **Impact**: Siege units are actually 4-5x more expensive in army capacity

### 6. Equipment Cost Inconsistencies
**Problem**: Equipment costs don't scale with unit effectiveness
- **Mage**: 0 equipment costs (no gear needed) but 1900g base cost
- **Catapult**: 224g equipment costs (14 Plank and Nails) for 3480g total
- **Knight**: 14g equipment costs (Horse + 2 Swords + Plate Armor) for 1080g total
- **Impact**: Equipment costs are a tiny fraction of total unit costs, making them irrelevant

### 7. Strategy Balance Problems
**Problem**: Some strategies are too powerful or too weak
- **Quick Retreat**: Applied twice in code (0.5 × 0.5 = 0.25 damage, not 0.5)
- **Elf Energy Gathering**: Makes Mage too powerful (+100% melee, +4 range, +2 defense)
- **Dwarf Shield Line**: Shieldbearer defense reduction is too harsh (-50%)
- **Anti-Cavalry**: Pikemen +250% vs mounted is excessive

### 8. Technology Scaling Issues
**Problem**: Technology effects don't scale properly with unit costs
- **Sharper Blades**: +1 melee per level (good for cheap units, weak for expensive ones)
- **Improve Bow Range**: Only 1 level max (too limited)
- **Missing Short Range Technology**: No technology exists for short range damage scaling
- **Impact**: Technologies favor cheap units over expensive ones

### 9. Unit Weight System Imbalance
**Problem**: Unit weights affect damage allocation but aren't balanced
- **Catapult**: Weight 3 (takes more damage)
- **Mage**: Weight 1 (takes less damage)
- **Shieldbearer**: Weight 1 (takes less damage despite being a tank)
- **Impact**: Tank units don't actually tank damage effectively

### 10. Building Mitigation System Analysis
**Current System**: Buildings provide damage mitigation pools with per-unit caps
- **Guard Towers**: 40 damage per tower, max 2 per unit (range phase only)
- **Medical Centers**: 75 damage per center when defending, 50 when attacking, max 2/1 per unit (melee phase only)
- **Post-Battle Healing**: Medical Centers heal 20% of losses if centers/land ≥ 1, 10% if ≥ 0.5
- **Building Cap**: Currently 10 buildings per land (too restrictive)
- **Impact**: Buildings are effective but limited by per-unit caps and restrictive building limits

---

## 📊 DETAILED UNIT ANALYSIS

### Armor Type Distribution
| Race | Heavy Armor Units | Light Armor Units | No Armor Units |
|------|------------------|------------------|----------------|
| **Dwarf** | Shieldbearer, HammerWheilder, AxeMan | Runner, LightCrossbowman, HeavyCrossbowman | None |
| **Elf** | Caragous | Swordman, Lanceman, Archer, EliteArcher | Mage |
| **Gnome** | Rider | Infantry, Militia, RockThrower | Catapult, Balista |
| **Human** | Knight, HeavyInfantry | Infantry, Pikeman, Archer, MountedArcher | None |
| **Orc** | WolfMaster | ShadowWarrior, Rusher, Slother, Slinger, AxeThrower | None |
| **Undead** | DarkKnight, AbominationCaragous | WraithPikeman, WraithRider | SkeletalLegion, PhantomArcher |

### Cost Efficiency Analysis
| Unit | Cost | Stats (M/S/R/D) | Cost per Stat Point | Status |
|------|------|-----------------|-------------------|---------|
| **SkeletalLegion** | 79g | 1/1/0/1 | 26.3g | **BROKEN** |
| **WraithPikeman** | 285g | 4/0/0/4 | 35.6g | **Too Cheap** |
| **Mage** | 1900g | 3/0/7/2 | 158g | **Too Expensive** |
| **Catapult** | 3480g | 0/0/15/25 | 87g | Balanced |
| **EliteArcher** | 730g | 0/0/5/3 | 91g | Balanced |
| **Shieldbearer** | 925g | 0/0/0/20 | 46g | Balanced |

### Upkeep Analysis
| Unit | Gold Upkeep | Food Upkeep | Total Upkeep | Status |
|------|-------------|-------------|--------------|---------|
| **SkeletalLegion** | 1.5g | 0f | 1.5g | **No Food Cost** |
| **WraithPikeman** | 6g | 0f | 6g | **No Food Cost** |
| **Mage** | 30g | 2f | 32g | **Too Expensive** |
| **Knight** | 18g | 5f | 23g | Balanced |
| **Shieldbearer** | 13g | 4f | 17g | Balanced |

---

## 🔧 PROPOSED BALANCE FIXES

### Phase 1: Critical Fixes (Immediate)

#### 1. Fix Heavy Armor Technology
```typescript
// In technologyData.ts
"Tougher Heavy Armor": {
  maxLevel: 5, // Change from 2 to 5 (premium scaling)
  levels: { "1": {}, "2": {}, "3": {}, "4": {}, "5": {} } // Add levels 3, 4, and 5
}
```

#### 2. Fix Undead Economic Advantage
```typescript
// In unitData.ts - Undead section
SkeletalLegion: { 
  base_gold_cost: 150, // Increase from 79
  upkeep: { gold: 3, food: 1 } // Add food cost
}
WraithPikeman: { 
  base_gold_cost: 400, // Increase from 285
  upkeep: { gold: 8, food: 2 } // Add food cost
}
```

#### 3. Fix Mage Cost
```typescript
// In unitData.ts - Elf section
Mage: { 
  base_gold_cost: 1200, // Reduce from 1900
  upkeep: { gold: 20, food: 2 } // Reduce gold upkeep
}
```

#### 4. Fix Caragous Scaling and Base Stats
```typescript
// In unitData.ts - Elf section
Caragous: { 
  melee: 1, // Add base melee damage (main attack stat)
  defense: 3, // Increase from 1 to 3 (better survivability)
  short: 0, // Base short range (scales rapidly)
  base_gold_cost: 1000, // Reduce from 1295
  upkeep: { gold: 10, food: 3 } // Reduce upkeep
}

// In getEffectiveUnitStats.ts - Enhanced infinite scaling
// Caragous: Multi-stat scaling based on ratio to enemy army size
if (unitName === 'Caragous' && raceKey === 'elf' && enemyArmy) {
  const ratio = caragousCount / enemyTotalUnits; // Infinite scaling
  const scalingFactor = Math.floor(ratio * 100);
  
  stats.melee += scalingFactor / 8; // +1 per 8% ratio (fastest scaling - main attack)
  stats.defense += scalingFactor / 15; // +1 per 15% ratio (moderate scaling - prevents invincibility)
  stats.short += scalingFactor / 12; // +1 per 12% ratio (slowest scaling - secondary attack)
}
```

### Phase 2: Range Phase Balance

#### Reduce Range Damage Values
| Unit | Current Range | New Range | Rationale |
|------|---------------|-----------|-----------|
| **Catapult** | 15 | 6 | Siege units powerful but not army-deleting |
| **Balista** | 10 | 5 | Strong but not overwhelming |
| **Mage** | 7 | 4 | Most feared unit, maintains superiority |
| **EliteArcher** | 5 | 3 | Elite archer good, not game-breaking |

### Phase 3: Multi-Phase Damage System

#### Add Short Range to Melee Units
```typescript
// In unitData.ts
HammerWheilder: { short: 2 }, // Can throw hammers
AxeMan: { short: 3 }, // Can throw axes
Knight: { short: 2 }, // Can throw weapons
HeavyInfantry: { short: 1 }, // Can throw weapons
```

#### Add Melee to Ranged Units
```typescript
// In unitData.ts
Catapult: { melee: 2 }, // Crew can fight
Balista: { melee: 3 }, // Crew can fight
EliteArcher: { melee: 1 }, // Can fight in close combat
Archer: { melee: 1 }, // Can fight in close combat
```

### Phase 4: Armor Type Additions

#### Add Missing Armor Types
```typescript
// In unitData.ts
Catapult: { armorType: 'heavy' }, // Siege units need protection
Balista: { armorType: 'heavy' }, // Siege units need protection
EliteArcher: { armorType: 'light' }, // Elite ranged unit should scale
PhantomArcher: { armorType: 'light' }, // Undead ranged unit should scale
Runner: { armorType: 'light' }, // Mobile unit should scale
Archer: { armorType: 'light' }, // Basic ranged unit should scale
SkeletalLegion: { armorType: 'light' }, // Basic infantry should scale
Militia: { armorType: 'light' }, // Basic infantry should scale
RockThrower: { armorType: 'light' }, // Basic ranged unit should scale
Slinger: { armorType: 'light' }, // Basic ranged unit should scale
```

### Phase 5: Equipment Cost Rebalancing

#### Fix Equipment Cost Scaling
```typescript
// In unitData.ts - Increase equipment costs to be meaningful
// Note: Mage keeps 0 equipment costs (no gear needed) - balance through base_gold_cost
Catapult: { 
  equipment_iron_cost: 50, // Increase from 14
  equipment_wood_cost: 300, // Increase from 210
  equipment_gold_cost: 50 // Add metal components
}
Knight: { 
  equipment_iron_cost: 25, // Increase from 14
  equipment_wood_cost: 10, // Add lance/spear cost
  equipment_gold_cost: 20 // Add decorative elements
}
```

### Phase 6: Strategy Balance Fixes

#### Unit Slot Mapping System
```typescript
// Universal unit slot mapping (same across all races)
// Unit 1: Best Elite Unit (DarkKnight, Rider, Balista, Knight, WolfMaster, Rider)
// Unit 2: Infantry Unit (SkeletalLegion, Militia, Infantry, Infantry, Rusher, Infantry)
// Unit 3: Pikeman Unit (WraithPikeman, RockThrower, Militia, Pikeman, Slother, Militia)
// Unit 4: Secondary Elite Unit (AbominationCaragous, Catapult, Catapult, HeavyInfantry, ShadowWarrior, Catapult)
// Unit 5: Ranged Unit (PhantomArcher, Balista, RockThrower, Archer, Slinger, RockThrower)
// Unit 6: Elite Ranged Unit (WraithRider, None, None, MountedArcher, AxeThrower, None)
```

#### Fix Strategy Effects
```typescript
// In strategyData.ts
"Quick Retreat": {
  effects: {
    all_unit_attack_multiplier: 0.7, // Increase from 0.5 (fix double application)
    victory_chance_reduction: 0.3 // Reduce from 0.5
  }
},
"Elf Energy Gathering": {
  effects: {
    wizards_close_combat_damage_multiplier: 1.5, // Reduce from 2.0
    wizards_ranged_attack_increase: 2, // Reduce from 4
    wizards_defense_increase: 1 // Reduce from 2
  }
},
"Dwarf Shield Line": {
  effects: {
    shieldbearers_defense_reduction_percent: 0.25, // Reduce from 0.50
    all_units_close_combat_attack_reduction_percent: 0.05 // Reduce from 0.10
  }
},
"Anti-Cavalry": {
  effects: {
    pikemen_attack_vs_mounted_multiplier: 2.0, // Reduce from 3.5
    all_units_attack_multiplier: 0.95 // Increase from 0.9
  }
}
```

#### Add Dual-Strategy System
```typescript
// In strategyData.ts - New dual-strategy system
// Players can choose ONE positioning strategy AND ONE combat strategy

// POSITIONING STRATEGIES (affect unit weights for damage allocation)
"Frontline Formation": {
  type: "positioning",
  description: "Elite units tank damage, protecting ranged units",
  effects: {
    unit_weight_modifiers: {
      unit_1: +2, // Best Elite Unit takes more damage
      unit_2: +1, // Infantry Unit takes more damage
      unit_3: +1, // Pikeman Unit takes more damage
      unit_4: +1, // Secondary Elite Unit takes more damage
      unit_5: -1, // Ranged Unit takes less damage
      unit_6: -1  // Elite Ranged Unit takes less damage
    }
  }
},
"Skirmish Formation": {
  type: "positioning", 
  description: "Ranged units draw fire, elite units deal damage",
  effects: {
    unit_weight_modifiers: {
      unit_1: -1, // Best Elite Unit takes less damage
      unit_2: -1, // Infantry Unit takes less damage
      unit_3: -1, // Pikeman Unit takes less damage
      unit_4: -1, // Secondary Elite Unit takes less damage
      unit_5: +2, // Ranged Unit takes more damage
      unit_6: +1  // Elite Ranged Unit takes more damage
    }
  }
},
"Elite Focus": {
  type: "positioning",
  description: "Elite units are priority targets, protecting basic units",
  effects: {
    unit_weight_modifiers: {
      unit_1: +2, // Best Elite Unit takes much more damage
      unit_2: -1, // Infantry Unit takes less damage
      unit_3: -1, // Pikeman Unit takes less damage
      unit_4: +1, // Secondary Elite Unit takes more damage
      unit_5: -1, // Ranged Unit takes less damage
      unit_6: +1  // Elite Ranged Unit takes more damage
    }
  }
},
"Ranged Protection": {
  type: "positioning",
  description: "Ranged units are heavily protected by other units",
  effects: {
    unit_weight_modifiers: {
      unit_1: +1, // Best Elite Unit takes more damage
      unit_2: +1, // Infantry Unit takes more damage
      unit_3: +1, // Pikeman Unit takes more damage
      unit_4: +1, // Secondary Elite Unit takes more damage
      unit_5: -2, // Ranged Unit takes much less damage
      unit_6: -2  // Elite Ranged Unit takes much less damage
    }
  }
},
"Balanced Formation": {
  type: "positioning",
  description: "All units share damage equally",
  effects: {
    unit_weight_modifiers: {
      unit_1: 0,  // All units unchanged
      unit_2: 0,
      unit_3: 0,
      unit_4: 0,
      unit_5: 0,
      unit_6: 0
    }
  }
},

// COMBAT STRATEGIES (affect damage and phases)
"Aggressive Assault": {
  type: "combat",
  description: "Focus on overwhelming damage output",
  effects: {
    all_units_melee_damage_multiplier: 1.3,
    all_units_short_range_damage_multiplier: 1.2,
    all_units_range_damage_multiplier: 1.1,
    all_units_defense_multiplier: 0.9
  }
},
"Defensive Stance": {
  type: "combat",
  description: "Prioritize survival over damage",
  effects: {
    all_units_defense_multiplier: 1.4,
    all_units_melee_damage_multiplier: 0.8,
    all_units_short_range_damage_multiplier: 0.8,
    all_units_range_damage_multiplier: 0.9
  }
},
"Range Superiority": {
  type: "combat",
  description: "Maximize ranged combat effectiveness",
  effects: {
    all_units_range_damage_multiplier: 1.4,
    all_units_short_range_damage_multiplier: 1.2,
    all_units_melee_damage_multiplier: 0.7,
    all_units_defense_multiplier: 0.9
  }
},
"Close Combat Specialists": {
  type: "combat",
  description: "Excel in melee and short range combat",
  effects: {
    all_units_melee_damage_multiplier: 1.4,
    all_units_short_range_damage_multiplier: 1.3,
    all_units_range_damage_multiplier: 0.6,
    all_units_defense_multiplier: 1.1
  }
},
"Tactical Flexibility": {
  type: "combat",
  description: "Balanced approach with slight bonuses",
  effects: {
    all_units_melee_damage_multiplier: 1.1,
    all_units_short_range_damage_multiplier: 1.1,
    all_units_range_damage_multiplier: 1.1,
    all_units_defense_multiplier: 1.1
  }
},
"Phase Mastery": {
  type: "combat",
  description: "Focus on one combat phase for maximum effect",
  effects: {
    // Randomly boosts one phase significantly
    phase_boost: "random", // +50% to one random phase
    all_units_defense_multiplier: 0.9
  }
}
```

### Phase 7: Technology Improvements

#### Armor Scaling Philosophy
**Light Armor**: Basic scaling for mass units
- **Max Level**: 4 (+4 defense)
- **Target Units**: Infantry, Archers, Basic units
- **Cost**: Lower (100k gold)
- **Purpose**: Make basic units viable in late-game

**Heavy Armor**: Premium scaling for elite units
- **Max Level**: 5 (+5 defense)
- **Target Units**: Knights, Shieldbearers, DarkKnights, Elite units
- **Cost**: Higher (120k gold)
- **Purpose**: Make expensive units dominant in late-game

#### Fix Technology Scaling
```typescript
// In technologyData.ts
"Sharper Blades": {
  maxLevel: 5, // Increase from 3
  flat_bonus: 1, // Keep +1 per level
  cost: 150000 // Reduce from 200000
},
"Improve Bow Range": {
  maxLevel: 3, // Increase from 1
  flat_bonus: 1, // Keep +1 per level
  cost: 150000 // Reduce from 200000
}
```

#### Add Short Range Technology
```typescript
// In technologyData.ts - New technology
"Throwing Mastery": {
  description: "Increases short range damage for units with throwing weapons.",
  stat: 'short',
  weaponType: 'blade', // For units that can throw weapons
  flat_bonus: 1,
  maxLevel: 3,
  cost: 120000,
  researchTime: 60,
  levels: { "1": {}, "2": {}, "3": {} }
}
```

### Phase 8: Unit Weight System Fix

#### Rebalance Unit Weights
```typescript
// In unitData.ts - Add weight property
Shieldbearer: { weight: 3 }, // Tank units should take more damage
Catapult: { weight: 2 }, // Reduce from 3 (still vulnerable)
Mage: { weight: 2 }, // Increase from 1 (should be targetable)
Knight: { weight: 2 }, // Elite units should be priority targets
EliteArcher: { weight: 2 }, // Elite units should be priority targets
```

### Phase 9: Building System Expansion

#### Adjust Building Effectiveness
```typescript
// In calculatePhaseDamage.ts - Adjust mitigation caps
// Guard Towers: Increase per-unit cap for better scaling
const perUnitCap = 3; // Increase from 2 (better for large armies)

// Medical Centers: Increase per-unit cap when defending
const perUnitCap = isBattleDefender ? 3 : 1; // Increase from 2/1 (better for large armies)

// Alternative: Increase base mitigation per building
const potentialMitigationPool = towerCount * 50; // Increase from 40
const perCenterPool = isBattleDefender ? 100 : 75; // Increase from 75/50
```

#### Add Short Range Mitigation Building
```typescript
// In buildingData.ts - New building
"Barricades": {
  cost: { gold: 800, iron: 20, wood: 100 },
  defense_bonus: 30,
  effect: 'Reduces short range attack by 30 damage per barricade (max 2 per unit).'
}

// In calculatePhaseDamage.ts - Add short range mitigation
if (phaseType === 'short' && defenderBuildings['Barricades'] && isBattleDefender) {
  const barricadeCount = defenderBuildings['Barricades'];
  const potentialMitigationPool = barricadeCount * 30;
  const perUnitCap = 2;
  const maxMitigationByUnitCap = totalDefenders * perUnitCap;
  const totalBarricadeMitigation = Math.min(potentialMitigationPool, maxMitigationByUnitCap);
  if (totalBarricadeMitigation > 0) {
    totalMitigation += totalBarricadeMitigation;
    buildingEffectsLog.push(`Barricades reduced total damage by ${totalBarricadeMitigation.toFixed(0)}`);
  }
}
```

#### Add Race-Specific Strategic Buildings
```typescript
// In buildingData.ts - Race-specific buildings

// ELF BUILDINGS
"Alchemy Lab": {
  cost: { gold: 2500, iron: 20, wood: 60 },
  effect: 'Mages get +2 range damage and +1 defense.',
  race: 'elf',
  combat_bonus: { mage_range: 2, mage_defense: 1 }
},
"Enchanted Grove": {
  cost: { gold: 1800, iron: 10, wood: 200 },
  effect: 'All archer units get +1 range and +1 short range damage.',
  race: 'elf',
  combat_bonus: { archer_range: 1, archer_short: 1 }
},

// DWARF BUILDINGS  
"Forge": {
  cost: { gold: 2200, iron: 150, wood: 50 },
  effect: 'Heavy armor units get +2 defense and equipment costs reduced by 25%.',
  race: 'dwarf',
  combat_bonus: { heavy_armor_defense: 2 },
  cost_reduction: { equipment: 0.75 }
},
"Stone Fortress": {
  cost: { gold: 3000, iron: 200, wood: 100 },
  effect: 'All units get +1 defense when defending. Guard towers provide 50% more mitigation.',
  race: 'dwarf',
  combat_bonus: { defense_bonus: 1 },
  building_bonus: { guard_tower_mitigation: 1.5 }
},

// UNDEAD BUILDINGS
"Necromancer Tower": {
  cost: { gold: 2800, iron: 30, wood: 80 },
  effect: 'All undead units get +1 melee and +1 defense. Post-battle healing increased by 50%.',
  race: 'undead',
  combat_bonus: { undead_melee: 1, undead_defense: 1 },
  healing_bonus: { post_battle: 1.5 }
},
"Graveyard": {
  cost: { gold: 1200, iron: 20, wood: 40 },
  effect: 'SkeletalLegion and WraithPikeman production speed increased by 30%.',
  race: 'undead',
  production_bonus: { skeleton_speed: 1.3, wraith_speed: 1.3 }
},

// HUMAN BUILDINGS
"Barracks": {
  cost: { gold: 1600, iron: 80, wood: 120 },
  effect: 'All infantry units get +1 melee and +1 defense. Training speed increased by 25%.',
  race: 'human',
  combat_bonus: { infantry_melee: 1, infantry_defense: 1 },
  production_bonus: { training_speed: 1.25 }
},
"Royal Stables": {
  cost: { gold: 2000, iron: 60, wood: 150 },
  effect: 'Mounted units get +2 melee and +1 defense. Knight production speed increased by 40%.',
  race: 'human',
  combat_bonus: { mounted_melee: 2, mounted_defense: 1 },
  production_bonus: { knight_speed: 1.4 }
},

// ORC BUILDINGS
"War Camp": {
  cost: { gold: 1400, iron: 40, wood: 100 },
  effect: 'All orc units get +1 melee damage. Production speed increased by 20%.',
  race: 'orc',
  combat_bonus: { orc_melee: 1 },
  production_bonus: { orc_speed: 1.2 }
},
"Beast Pen": {
  cost: { gold: 1800, iron: 30, wood: 120 },
  effect: 'WolfMaster and mounted units get +2 melee and +1 defense.',
  race: 'orc',
  combat_bonus: { beast_melee: 2, beast_defense: 1 }
},

// GNOME BUILDINGS
"Engineering Workshop": {
  cost: { gold: 2400, iron: 100, wood: 80 },
  effect: 'Siege units get +2 range damage and +1 defense. Production speed increased by 35%.',
  race: 'gnome',
  combat_bonus: { siege_range: 2, siege_defense: 1 },
  production_bonus: { siege_speed: 1.35 }
},
"Mechanical Forge": {
  cost: { gold: 1900, iron: 120, wood: 60 },
  effect: 'All gnome units get +1 defense. Equipment costs reduced by 20%.',
  race: 'gnome',
  combat_bonus: { gnome_defense: 1 },
  cost_reduction: { equipment: 0.8 }
}
```

#### Adjust Building Cap System
```typescript
// In BuildingTable.tsx - Change building cap calculation
// Old: const maxBuildings = land ? land * 10 : 0;
// New: const maxBuildings = land ? (land * 12) - (castles || 0) : 0;
// This allows 12 buildings per land minus castles, creating more strategic choices
```

---

## 📅 IMPLEMENTATION PHASES

### Priority 1 (Critical) - Immediate
1. ✅ Fix heavy armor technology (level 5 max - premium scaling)
2. ✅ Fix Undead economic advantage (add food costs)
3. ✅ Fix Mage cost (reduce by 37%)
4. ✅ Fix Caragous infinite scaling and base stats

### Priority 2 (High) - Next Sprint
1. ✅ Add armor types to units missing them
2. ✅ Implement guard house slot system in code
3. ✅ Reduce range phase lethality

### Priority 3 (Medium) - Future Sprint
1. ✅ Add multi-phase damage system
2. ✅ Balance upkeep across all races
3. ✅ Adjust production rates

### Priority 4 (Medium) - Strategy & Technology
1. ✅ Fix strategy balance issues (Quick Retreat, Elf Energy Gathering, etc.)
2. ✅ Implement new dual-strategy system (positioning + combat)
3. ✅ Improve technology scaling (Sharper Blades, Improve Bow Range)
4. ✅ Rebalance equipment costs to be meaningful

### Priority 5 (Medium) - Systems Balance
1. ✅ Fix unit weight system (tank units should tank)
2. ✅ Increase building mitigation effectiveness
3. ✅ Balance production rates
4. ✅ Implement new building system (Barricades, Training Grounds, etc.)
5. ✅ Adjust building cap to 12 per land minus castles

### Priority 6 (Low) - Polish
1. ✅ Fine-tune unit costs
2. ✅ Balance equipment amounts
3. ✅ Adjust race passives

---

## 📋 COMPREHENSIVE CHANGES TABLE

### Technology Changes
| Technology | Old Max Level | New Max Level | Effect |
|------------|---------------|---------------|---------|
| Tougher Heavy Armor | 2 | 5 | Heavy armor units get +5 defense (was +2) |

### Unit Stats & Cost Changes

#### Dwarf Units
| Unit | Old Stats (M/S/R/D) | New Stats (M/S/R/D) | Old Cost | New Cost | Old Upkeep | New Upkeep | Old Armor | New Armor | Changes |
|------|-------------------|-------------------|----------|----------|------------|------------|-----------|-----------|---------|
| Shieldbearer | 0/0/0/20 | 0/0/0/20 | 925g | 925g | 13g,4f | 13g,4f | heavy | heavy | None |
| HammerWheilder | 7/0/0/7 | 7/2/0/7 | 635g | 635g | 7g,3f | 7g,3f | heavy | heavy | +2 short range |
| AxeMan | 9/0/0/11 | 9/3/0/11 | 1090g | 1090g | 10g,4f | 10g,4f | heavy | heavy | +3 short range |
| Runner | 6/2/0/3 | 6/3/0/3 | 510g | 510g | 15g,4f | 15g,4f | none | light | +1 short, +light armor |
| LightCrossbowman | 0/0/2/5 | 0/0/2/5 | 480g | 480g | 8g,2f | 8g,2f | light | light | None |
| HeavyCrossbowman | 0/0/3/6 | 0/0/3/6 | 830g | 830g | 10g,3f | 10g,3f | light | light | None |

#### Elf Units
| Unit | Old Stats (M/S/R/D) | New Stats (M/S/R/D) | Old Cost | New Cost | Old Upkeep | New Upkeep | Old Armor | New Armor | Changes |
|------|-------------------|-------------------|----------|----------|------------|------------|-----------|-----------|---------|
| Mage | 3/0/7/2 | 3/2/4/2 | 1900g | 1200g | 30g,2f | 20g,2f | none | none | -700g cost, -3 range, +2 short |
| Swordman | 4/0/0/3 | 4/2/0/3 | 225g | 225g | 8g,2f | 8g,2f | light | light | +2 short range |
| Lanceman | 3/0/0/3 | 3/2/0/3 | 220g | 220g | 10g,2f | 10g,2f | light | light | +2 short range |
| Caragous | 0/0/0/1 | 1/0/0/3 | 1295g | 1000g | 12g,4f | 10g,3f | heavy | heavy | +1 melee, +2 defense, -295g cost, -2g-1f upkeep, enhanced infinite scaling |
| Archer | 0/0/3/2 | 0/2/3/2 | 390g | 390g | 4g,1f | 4g,1f | none | light | +2 short, +light armor |
| EliteArcher | 0/0/5/3 | 0/3/3/3 | 730g | 730g | 8g,3f | 8g,3f | none | light | -2 range, +3 short, +light armor |

#### Gnome Units
| Unit | Old Stats (M/S/R/D) | New Stats (M/S/R/D) | Old Cost | New Cost | Old Upkeep | New Upkeep | Old Armor | New Armor | Changes |
|------|-------------------|-------------------|----------|----------|------------|------------|-----------|-----------|---------|
| Catapult | 0/0/15/25 | 2/0/6/25 | 3480g | 3480g | 40g,10f | 40g,10f | none | heavy | -9 range, +2 melee, +heavy armor |
| Infantry | 2/0/0/2 | 2/2/0/2 | 210g | 210g | 4g,1f | 4g,1f | light | light | +2 short range |
| Militia | 1/0/0/1 | 1/2/0/1 | 100g | 100g | 1g,1f | 1g,1f | none | light | +2 short, +light armor |
| Rider | 6/0/0/6 | 6/0/0/6 | 835g | 835g | 7g,3f | 7g,3f | heavy | heavy | None |
| RockThrower | 0/0/1/1 | 0/2/1/1 | 115g | 115g | 1g,1f | 1g,1f | none | light | +2 short, +light armor |
| Balista | 5/0/10/15 | 5/2/5/15 | 2380g | 2380g | 22g,6f | 22g,6f | none | heavy | -5 range, +2 short, +heavy armor |

#### Human Units
| Unit | Old Stats (M/S/R/D) | New Stats (M/S/R/D) | Old Cost | New Cost | Old Upkeep | New Upkeep | Old Armor | New Armor | Changes |
|------|-------------------|-------------------|----------|----------|------------|------------|-----------|-----------|---------|
| Knight | 8/1/0/11 | 8/3/0/11 | 1080g | 1080g | 18g,5f | 18g,5f | heavy | heavy | +2 short range |
| Infantry | 3/0/0/5 | 3/2/0/5 | 240g | 240g | 4g,2f | 4g,2f | light | light | +2 short range |
| Pikeman | 4/0/0/3 | 4/2/0/3 | 280g | 280g | 4g,2f | 4g,2f | light | light | +2 short range |
| HeavyInfantry | 7/0/0/8 | 7/1/0/8 | 680g | 680g | 7g,3f | 7g,3f | heavy | heavy | +1 short range |
| Archer | 0/0/2/3 | 0/2/2/3 | 235g | 235g | 3g,3f | 3g,3f | light | light | +2 short, +light armor |
| MountedArcher | 3/0/2/7 | 3/2/2/7 | 800g | 800g | 11g,3f | 11g,3f | light | light | +2 short range |

#### Orc Units
| Unit | Old Stats (M/S/R/D) | New Stats (M/S/R/D) | Old Cost | New Cost | Old Upkeep | New Upkeep | Old Armor | New Armor | Changes |
|------|-------------------|-------------------|----------|----------|------------|------------|-----------|-----------|---------|
| ShadowWarrior | 8/0/0/3 | 8/2/0/3 | 820g | 820g | 15g,4f | 15g,4f | light | light | +2 short range |
| Rusher | 4/0/0/3 | 4/2/0/3 | 210g | 210g | 4g,3f | 4g,3f | light | light | +2 short range |
| Slother | 2/0/0/2 | 2/2/0/2 | 105g | 105g | 2g,2f | 2g,2f | none | light | +2 short, +light armor |
| WolfMaster | 6/0/1/3 | 6/2/1/3 | 595g | 595g | 5g,3f | 5g,3f | heavy | heavy | +2 short range |
| Slinger | 0/0/2/2 | 0/2/2/2 | 65g | 65g | 2g,1f | 2g,1f | none | light | +2 short, +light armor |
| AxeThrower | 3/0/3/2 | 3/2/3/2 | 310g | 310g | 4g,3f | 4g,3f | light | light | +2 short range |

#### Undead Units
| Unit | Old Stats (M/S/R/D) | New Stats (M/S/R/D) | Old Cost | New Cost | Old Upkeep | New Upkeep | Old Armor | New Armor | Changes |
|------|-------------------|-------------------|----------|----------|------------|------------|-----------|-----------|---------|
| DarkKnight | 8/0/1/11 | 8/2/1/11 | 1186g | 1186g | 21g,0f | 21g,2f | heavy | heavy | +2 short, +2f upkeep |
| SkeletalLegion | 1/0/0/1 | 1/2/0/1 | 79g | 150g | 1.5g,0f | 3g,1f | none | light | +71g cost, +2 short, +1.5g+1f upkeep, +light armor |
| WraithPikeman | 4/0/0/4 | 4/2/0/4 | 285g | 400g | 6g,0f | 8g,2f | light | light | +115g cost, +2 short, +2g+2f upkeep |
| AbominationCaragous | 4/0/0/3 | 4/0/0/3 | 1486g | 1486g | 14g,0f | 14g,2f | heavy | heavy | +2f upkeep |
| PhantomArcher | 0/0/2/3 | 0/2/2/3 | 485g | 485g | 5g,0f | 5g,1f | none | light | +2 short, +1f upkeep, +light armor |
| WraithRider | 3/0/2/7 | 3/2/2/7 | 745g | 745g | 13g,0f | 13g,2f | light | light | +2 short, +2f upkeep |

### Production Rate Changes
| Unit | Old Production | New Production | Change |
|------|----------------|----------------|---------|
| Militia | 1 building, 10/day | 2 building, 5/day | Slower mass production |
| RockThrower | 1 building, 10/day | 2 building, 5/day | Slower mass production |
| Elite units | 3-8 building, 1/day | 4 building, 1/day | Faster elite production |

### Guard House Slot System
| Unit | Current Code | Actual Game | Impact |
|------|--------------|-------------|---------|
| Catapult | 1 slot | 5 slots | 5x more expensive in army capacity |
| Balista | 1 slot | 4 slots | 4x more expensive in army capacity |
| All others | 1 slot | 1 slot | No change |

### New Building System
| Building | Cost | Effect | Race |
|----------|------|--------|------|
| **Barricades** | 800g, 20i, 100w | 30 damage reduction per building (max 2/unit) | All |
| **Alchemy Lab** | 2500g, 20i, 60w | +2 range, +1 defense to mages | Elf |
| **Enchanted Grove** | 1800g, 10i, 200w | +1 range, +1 short to all archers | Elf |
| **Forge** | 2200g, 150i, 50w | +2 defense to heavy armor, -25% equipment costs | Dwarf |
| **Stone Fortress** | 3000g, 200i, 100w | +1 defense when defending, +50% guard tower mitigation | Dwarf |
| **Necromancer Tower** | 2800g, 30i, 80w | +1 melee, +1 defense to undead, +50% healing | Undead |
| **Graveyard** | 1200g, 20i, 40w | +30% production speed for SkeletalLegion/WraithPikeman | Undead |
| **Barracks** | 1600g, 80i, 120w | +1 melee, +1 defense to infantry, +25% training speed | Human |
| **Royal Stables** | 2000g, 60i, 150w | +2 melee, +1 defense to mounted, +40% Knight production | Human |
| **War Camp** | 1400g, 40i, 100w | +1 melee to all orcs, +20% production speed | Orc |
| **Beast Pen** | 1800g, 30i, 120w | +2 melee, +1 defense to WolfMaster/mounted | Orc |
| **Engineering Workshop** | 2400g, 100i, 80w | +2 range, +1 defense to siege, +35% production | Gnome |
| **Mechanical Forge** | 1900g, 120i, 60w | +1 defense to all gnomes, -20% equipment costs | Gnome |
| **Building Cap** | N/A | 12 buildings per land (was 10) | System |

### New Dual-Strategy System
| Strategy Type | Strategy Name | Effect | Description |
|---------------|---------------|--------|-------------|
| **Positioning** | Frontline Formation | Elite +2 weight, Ranged -1 weight | Elite units tank damage, protect ranged |
| **Positioning** | Skirmish Formation | Elite -1 weight, Ranged +2 weight | Ranged units draw fire, elite deal damage |
| **Positioning** | Elite Focus | Best Elite +2 weight, Basic units -1 weight | Elite units are priority targets |
| **Positioning** | Ranged Protection | All units +1 weight, Ranged -2 weight | Ranged units heavily protected |
| **Positioning** | Balanced Formation | All units unchanged | Equal damage distribution |
| **Combat** | Aggressive Assault | +30% melee, +20% short, +10% range, -10% defense | Overwhelming damage output |
| **Combat** | Defensive Stance | +40% defense, -20% melee/short, -10% range | Prioritize survival |
| **Combat** | Range Superiority | +40% range, +20% short, -30% melee, -10% defense | Maximize ranged combat |
| **Combat** | Close Combat Specialists | +40% melee, +30% short, -40% range, +10% defense | Excel in close combat |
| **Combat** | Tactical Flexibility | +10% all stats | Balanced approach |
| **Combat** | Phase Mastery | +50% random phase, -10% defense | Focus on one phase |

---

## ⚖️ BALANCE IMPACT ANALYSIS

### Most Impactful Changes

#### 1. Heavy Armor Technology Buff
- **Effect**: +2 defense → +5 defense (premium scaling)
- **Impact**: Massive buff to Dwarf and heavy armor units
- **Benefit**: Heavy armor units become the premium late-game option

#### 2. Undead Food Costs
- **Effect**: All undead units now need food upkeep
- **Impact**: Huge economic nerf to Undead race
- **Benefit**: Undead no longer have unfair economic advantage

#### 3. Mage Cost Reduction
- **Effect**: 1900g → 1200g (37% reduction)
- **Impact**: Makes Elves viable in competitive play
- **Benefit**: Elf race becomes more balanced

#### 4. Multi-Phase Damage System
- **Effect**: All units contribute in 2+ phases
- **Impact**: Fixes range dominance problem
- **Benefit**: All combat phases become meaningful

#### 5. Range Phase Nerfs
- **Effect**: Catapult 15→6, Balista 10→5, Mage 7→4, EliteArcher 5→3
- **Impact**: Prevents range phase army wipe
- **Benefit**: Tactical depth and positioning matter more

#### 6. Enhanced Caragous Scaling
- **Effect**: Multi-stat infinite scaling with different rates
- **Melee**: +1 per 8% ratio (fastest scaling - main attack stat)
- **Defense**: +1 per 15% ratio (moderate scaling - prevents invincibility)
- **Short**: +1 per 12% ratio (slowest scaling - secondary attack)
- **Impact**: Creates unique strategic unit that rewards careful army composition
- **Benefit**: Makes Elves more viable with scaling-focused gameplay

### Race Balance Shifts

| Race | Overall Change | Key Buffs | Key Nerfs |
|------|---------------|-----------|-----------|
| **Dwarf** | 🟢 Buffed | Heavy armor tech +5 defense, multi-phase damage, armor type additions | None |
| **Undead** | 🔴 Nerfed | Multi-phase damage, armor type additions | Food costs, higher unit costs, +2 short range to all units |
| **Elf** | 🟢 Buffed | Cheaper Mage, enhanced Caragous scaling, multi-phase damage, armor type additions | Range damage reduced |
| **Human** | 🟡 Slight Buff | Multi-phase damage, armor type additions | None |
| **Orc** | 🟡 Slight Buff | Multi-phase damage, armor type additions | None |
| **Gnome** | 🔴 Nerfed | Multi-phase damage, siege units get heavy armor scaling | Siege units less dominant |

### Combat Flow Changes

#### Before Changes
- **Range Phase**: Dominant, often wipes armies
- **Short Range Phase**: Irrelevant (most units have 0 short damage)
- **Melee Phase**: Limited relevance (ranged units can't fight)

#### After Changes
- **Range Phase**: Tactical advantage, not army deletion
- **Short Range Phase**: Meaningful (all units get 1-3 short damage)
- **Melee Phase**: More relevant (ranged units get 1-2 melee damage)

### Key Insights

1. **Range should be about positioning and tactical advantage, not about deleting armies**
2. **All units should contribute in multiple phases for balanced combat**
3. **Technology scaling should be consistent across armor types**
4. **Economic advantages should be balanced across all races**
5. **Guard house slot system fundamentally changes unit efficiency calculations**

---

## 🎯 FINAL RECOMMENDATIONS

### Immediate Actions (This Sprint)
1. ✅ Implement heavy armor technology fix
2. ✅ Fix Undead unit costs and add food upkeep
3. ✅ Reduce Mage cost by 37%

### Next Sprint
1. ✅ Add missing armor types to units
2. ✅ Implement range damage reductions
3. ✅ Add multi-phase damage system

### Future Sprints
1. ✅ Implement guard house slot system in code
2. ✅ Balance production rates
3. ✅ Fine-tune unit costs and upkeep

### Success Metrics
- **Combat Balance**: All three phases contribute meaningfully
- **Race Balance**: No race has overwhelming economic or combat advantage
- **Technology Balance**: Heavy armor scales better than light armor (premium vs basic)
- **Unit Diversity**: All unit types have clear roles and viability
- **Strategy Balance**: All strategies are viable and not overpowered
- **Building Relevance**: Buildings provide effective damage mitigation with appropriate scaling
- **Building Diversity**: Multiple strategic building options for different playstyles
- **Equipment Impact**: Equipment costs are a significant part of unit costs
- **Tank Mechanics**: Tank units actually absorb damage effectively

This comprehensive balance plan addresses all major issues while maintaining race uniqueness and strategic depth.










