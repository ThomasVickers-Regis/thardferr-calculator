# THARDFERR COMPREHENSIVE UNIT BALANCE ANALYSIS
## Based on Actual Code Analysis - FINAL REVIEW

---

## 📋 TABLE OF CONTENTS

1. [Critical Balance Issues](#critical-balance-issues)
   - [1.1 Technology Imbalance](#1-technology-imbalance)
   - [1.2 Undead Economic Advantage](#2-undead-economic-advantage)
   - [1.3 Range Phase Dominance](#3-range-phase-dominance)
   - [1.4 Single-Phase Units](#4-single-phase-units)
   - [1.5 Guard House Slot System](#5-guard-house-slot-system)
   - [1.6 Equipment Cost Inconsistencies](#6-equipment-cost-inconsistencies)
   - [1.7 Strategy Balance Problems](#7-strategy-balance-problems)
   - [1.8 Technology Scaling Issues](#8-technology-scaling-issues)
   - [1.9 Unit Weight System Imbalance](#9-unit-weight-system-imbalance)
   - [1.10 Building Mitigation System Analysis](#10-building-mitigation-system-analysis)
   - [1.11 Thievery System Integration](#11-thievery-system-integration)
   - [1.12 Magic System Balance Issues](#12-magic-system-balance-issues)
   - [1.13 Protection System Issues](#13-protection-system-issues)

2. [Detailed Unit Analysis](#detailed-unit-analysis)
   - [2.1 Armor Type Distribution](#armor-type-distribution)
   - [2.2 Cost Efficiency Analysis](#cost-efficiency-analysis)
   - [2.3 Upkeep Analysis](#upkeep-analysis)

3. [Proposed Balance Fixes](#proposed-balance-fixes)
   - [3.1 Phase 1: Critical Fixes (Immediate)](#phase-1-critical-fixes-immediate)
   - [3.2 Phase 2: Range Phase Balance](#phase-2-range-phase-balance)
   - [3.3 Phase 3: Multi-Phase Damage System](#phase-3-multi-phase-damage-system)
   - [3.4 Phase 4: Armor Type Additions](#phase-4-armor-type-additions)
   - [3.5 Phase 5: Dynamic Market System Implementation](#phase-5-dynamic-market-system-implementation)
   - [3.6 Phase 6: Strategy Balance Fixes](#phase-6-strategy-balance-fixes)
   - [3.7 Phase 7: Technology Improvements](#phase-7-technology-improvements)
   - [3.8 Phase 8: Unit Weight System Fix](#phase-8-unit-weight-system-fix)
   - [3.9 Phase 9: Building System Expansion](#phase-9-building-system-expansion)
   - [3.10 Phase 10: Thievery System Implementation](#phase-10-thievery-system-implementation)
   - [3.11 Phase 11: Magic System Balance Implementation](#phase-11-magic-system-balance-implementation)
   - [3.12 Phase 12: Protection System Scaling Implementation](#phase-12-protection-system-scaling-implementation)

4. [Comprehensive Changes Table](#comprehensive-changes-table)
   - [4.1 Technology Changes](#technology-changes)
   - [4.2 Unit Stats & Cost Changes](#unit-stats--cost-changes)
   - [4.3 Production Rate Changes](#production-rate-changes)
   - [4.4 Guard House Slot System](#guard-house-slot-system)
   - [4.5 New Building System](#new-building-system)
   - [4.6 New Dual-Strategy System](#new-dual-strategy-system)
   - [4.7 New Thievery System](#new-thievery-system)
   - [4.8 New Magic System Balance](#new-magic-system-balance)
   - [4.9 Universal Spells System](#universal-spells-system)
   - [4.10 Race-Specific Spells System](#race-specific-spells-system)
   - [4.11 Protection System Rebalancing](#protection-system-rebalancing)

5. [Balance Impact Analysis](#balance-impact-analysis)
   - [5.1 Most Impactful Changes](#most-impactful-changes)
   - [5.2 Race Balance Shifts](#race-balance-shifts)
   - [5.3 Combat Flow Changes](#combat-flow-changes)
   - [5.4 Key Insights](#key-insights)

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

### 11. Thievery System Integration
**Proposed System**: Espionage system mirroring the existing magic system
- **Thieves**: Dedicated espionage units (like wizards for magic)
- **Thieves Guilds**: Infrastructure buildings that increase efficiency (like Schools)
- **Security Buildings**: Defensive buildings that counter thievery (like wizards for counterspelling)
- **Mission Types**: Various thievery operations with different costs and effects
- **Racial Modifiers**: Different races have varying thievery effectiveness
- **Impact**: Adds new strategic layer to warfare beyond direct combat

### 12. Magic System Balance Issues
**Current Problems**: Magic is nearly unusable for most races due to cost and racial penalties
- **Wizard Costs**: 225g-500g base cost with 3g-10g gold upkeep (very expensive)
- **Racial Penalties**: Dwarves -50%, Gnomes -37.5%, Orcs -15% success rates
- **Gate Spell**: Overpowered instant troop return (bypasses 18-24 hour travel time)
- **Upkeep Burden**: Wizard upkeep competes with military upkeep, making magic unaffordable
- **School Requirements**: 1 School per land needed for 75% success (expensive infrastructure)
- **Spell Duration Crisis**: 6-12 hour durations vs 18-24 hour wizard recovery (massive imbalance)
- **Wizard Recovery**: 3 wizards per 2 Schools per day (too slow for spell durations)
- **5:1 School Ratios**: Players build excessive Schools to compensate for broken recovery rates
- **Impact**: Only Elves and Humans can effectively use magic, other races are locked out

### 13. Protection System Issues
**Current Problems**: Protection system creates slow gameplay and weakens defense
- **Fixed Protection Times**: 24h/15h protection doesn't account for army rebuilding time (24-60 hours)
- **Army Loss Reality**: Battles can wipe 80-100% of armies, but protection ends before rebuilding
- **Defense Vulnerability**: 0 hours protection after successful defense allows endless attacks
- **No Scaling**: Protection doesn't scale with actual losses suffered
- **Winner Takes All**: Design philosophy conflicts with protection system
- **Impact**: Gameplay becomes slow and defensive, kingdoms left vulnerable after battles

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
  base_gold_cost: 200, // Increase from 79 (compensate for no food cost)
  upkeep: { gold: 4, food: 0 } // Keep no food cost, increase gold upkeep
}
WraithPikeman: { 
  base_gold_cost: 500, // Increase from 285 (compensate for no food cost)
  upkeep: { gold: 10, food: 0 } // Keep no food cost, increase gold upkeep
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

### Phase 5: Dynamic Market System Implementation

#### Dynamic Market Buying Algorithm
```typescript
// In utils/marketCalculations.ts - Dynamic market system
// The total cost of a transaction is the sum of the prices of each individual unit,
// where each unit's price increases incrementally.

interface MarketTransaction {
  currentPrice: number;
  quantity: number;
  perUnitAdjustment: number;
}

function calculateBuyingCost(transaction: MarketTransaction): {
  totalCost: number;
  finalMarketPrice: number;
} {
  const { currentPrice, quantity, perUnitAdjustment } = transaction;
  
  // Price of a single unit (Pn): Current Price + (Per-Unit Adjustment * n)
  // Total Cost = SUM[n=1 to Q] (Current Price + (Per-Unit Adjustment * n))
  // Simplified: Total Cost = (Current Price * Q) + (Per-Unit Adjustment * (Q * (Q+1) / 2))
  
  const totalCost = (currentPrice * quantity) + 
    (perUnitAdjustment * (quantity * (quantity + 1) / 2));
  
  // Final Market Price = Current Price + (Per-Unit Adjustment * Q)
  const finalMarketPrice = currentPrice + (perUnitAdjustment * quantity);
  
  return { totalCost, finalMarketPrice };
}

// Example: Buying 500,000 Wood
// Current Price: 150 gold, Quantity: 500,000, Per-Unit Adjustment: 0.0000005
// Total Cost = 75,062,500 gold, Final Market Price = 150.25 gold
```

#### Dynamic Market Selling Algorithm
```typescript
// In utils/marketCalculations.ts - Selling algorithm
function calculateSellingRevenue(transaction: MarketTransaction): {
  totalRevenue: number;
  finalMarketPrice: number;
} {
  const { currentPrice, quantity, perUnitAdjustment } = transaction;
  
  // Price of a single unit (Pn): Current Price - (Per-Unit Adjustment * n)
  // Total Revenue = SUM[n=1 to Q] (Current Price - (Per-Unit Adjustment * n))
  // Simplified: Total Revenue = (Current Price * Q) - (Per-Unit Adjustment * (Q * (Q+1) / 2))
  
  const totalRevenue = (currentPrice * quantity) - 
    (perUnitAdjustment * (quantity * (quantity + 1) / 2));
  
  // Final Market Price = Current Price - (Per-Unit Adjustment * Q)
  const finalMarketPrice = currentPrice - (perUnitAdjustment * quantity);
  
  return { totalRevenue, finalMarketPrice };
}
```

#### Market Configuration System
```typescript
// In data/marketData.ts - Market configuration
const marketConfig = {
  // Resource-specific per-unit adjustments (how quickly prices change)
  perUnitAdjustments: {
    'wood': 0.0000005,    // Wood prices change slowly (stable resource)
    'iron': 0.000001,     // Iron prices change moderately
    'food': 0.0000003,    // Food prices change very slowly (essential)
    'gold': 0.000002      // Gold prices change faster (premium resource)
  },
  
  // Market volatility settings
  volatility: {
    'low': 0.0000002,     // Stable markets (basic resources)
    'medium': 0.0000005,  // Normal markets (most resources)
    'high': 0.000001      // Volatile markets (premium resources)
  },
  
  // Price floors and ceilings
  priceLimits: {
    'wood': { min: 50, max: 500 },
    'iron': { min: 100, max: 1000 },
    'food': { min: 25, max: 300 },
    'gold': { min: 200, max: 2000 }
  }
};
```

#### Market Impact on Equipment Costs
```typescript
// In utils/calculateEquipmentCosts.ts - Dynamic equipment pricing
function calculateEquipmentCosts(unitData: any, currentMarketPrices: any): number {
  // Equipment costs now scale with current market prices
  // This creates realistic supply/demand dynamics
  
  const baseCosts = unitData.equipment_costs;
  const marketMultiplier = {
    iron: currentMarketPrices.iron / 150, // Base iron price
    wood: currentMarketPrices.wood / 100, // Base wood price
    gold: currentMarketPrices.gold / 500  // Base gold price
  };
  
  let totalCost = 0;
  
  // Calculate dynamic costs based on current market
  if (baseCosts.iron) {
    totalCost += baseCosts.iron * marketMultiplier.iron;
  }
  if (baseCosts.wood) {
    totalCost += baseCosts.wood * marketMultiplier.wood;
  }
  if (baseCosts.gold) {
    totalCost += baseCosts.gold * marketMultiplier.gold;
  }
  
  return Math.round(totalCost);
}

// Example: Knight equipment costs
// Base costs: 25 iron, 10 wood, 20 gold
// If iron price doubles from 150 to 300, equipment costs increase significantly
// This creates strategic timing for unit production based on market conditions
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
// What ever the total numbers of builds are minus the castle should be the max building around, not 10. Current game should have 12. 
```

### Phase 10: Thievery System Implementation

#### Core Thievery Mechanics
```typescript
// Thievery success depends on:
// 1. Number of thieves committed
// 2. Number of Thieves Guilds (like Schools for magic)
// 3. Target's land size (more land = harder to infiltrate)
// 4. Target's security buildings (like wizards for counterspelling)

// Thief recovery after missions:
// Base: 3 thieves per 2 Thieves Guilds per day
// With "Stealth Training" technology: 2 thieves per Thieves Guild per day

// Racial thievery modifiers (mirroring magic system)
const racialThieveryModifiers = {
  'elf': 1.15,      // +15% success (premier infiltrators)
  'human': 1.0,     // 0% (neutral, reliable generalists)
  'orc': 0.85,      // -15% success (too loud/obvious)
  'gnome': 0.625,   // -37.5% success, 35% detection resistance
  'dwarf': 0.5,     // -50% success, 40% detection resistance (excellent security)
  'undead': 1.1     // +10% success (ethereal spies)
}
```

#### Thievery Infrastructure Buildings
```typescript
// In buildingData.ts - Thievery infrastructure
"Thieves Guild": {
  cost: { gold: 1500, iron: 30, wood: 80 },
  effect: 'Trains thieves and increases thievery efficiency. Base: 1 thief per day.',
  race: 'all',
  production: { thief: 1 },
  thievery_bonus: { efficiency: 1.0 } // Like Schools for magic
},
"Underground Network": {
  cost: { gold: 2500, iron: 50, wood: 120 },
  effect: 'Advanced thievery operations. 2 thieves per day, +20% efficiency.',
  race: 'all',
  production: { thief: 2 },
  thievery_bonus: { efficiency: 1.2 }
},
"Espionage Center": {
  cost: { gold: 4000, iron: 80, wood: 200 },
  effect: 'Elite thievery operations. 3 thieves per day, +40% efficiency.',
  race: 'all',
  production: { thief: 3 },
  thievery_bonus: { efficiency: 1.4 }
}
```

#### Thievery Missions (Like Spells)
```typescript
// In strategyData.ts - Thievery missions
const thieveryMissions = {
  "Gold Heist": {
    effect: "Steals gold from target kingdom",
    duration: "0 days",
    thieves_needed: 8, // Like "7 wizards" for Growing Crop
    tech_level: 0,
    success_rate: 0.75, // Base 75% like magic
    notes: "Yield scales with thieves used"
  },
  "Resource Theft": {
    effect: "Steals iron, wood, or food from target",
    duration: "0 days", 
    thieves_needed: 10,
    tech_level: 0,
    success_rate: 0.70,
    notes: "Amount stolen scales with thieves used"
  },
  "Food Poisoning": {
    effect: "Destroys target's food stores",
    duration: "0 days",
    thieves_needed: 12,
    tech_level: 1,
    success_rate: 0.65,
    notes: "Destroys 25% of target's food"
  },
  "Troop Assassination": {
    effect: "Kills small percentage of target's troops",
    duration: "0 days",
    thieves_needed: 15,
    tech_level: 1,
    success_rate: 0.60,
    notes: "Kills 10% of target's troops. Always loses thieves."
  },
  "Intelligence Gathering": {
    effect: "Reveals details about target kingdom",
    duration: "N/A",
    thieves_needed: 5,
    tech_level: 0,
    success_rate: 0.80,
    notes: "Precision depends on thieves used and tech level"
  },
  "Building Sabotage": {
    effect: "Destroys target's buildings",
    duration: "0 days",
    thieves_needed: 20,
    tech_level: 2,
    success_rate: 0.55,
    notes: "Destroys buildings. May backfire and destroy your buildings."
  },
  "Economic Sabotage": {
    effect: "Reduces target's production by 10%",
    duration: "8 days",
    thieves_needed: 18,
    tech_level: 2,
    success_rate: 0.60,
    notes: "Reduces all production (wood, food, iron, gold)"
  },
  "Security Breach": {
    effect: "Temporarily disables target's security",
    duration: "6 days",
    thieves_needed: 25,
    tech_level: 3,
    success_rate: 0.50,
    notes: "Reduces target's detection abilities by 50%"
  },
  "Mass Infiltration": {
    effect: "Large-scale coordinated theft operation",
    duration: "0 days",
    thieves_needed: 30,
    tech_level: 3,
    success_rate: 0.45,
    notes: "Steals multiple resources. High risk, high reward."
  },
  "Shadow Network": {
    effect: "Creates permanent spy network in target kingdom",
    duration: "Permanent",
    thieves_needed: 40,
    tech_level: 4,
    success_rate: 0.40,
    notes: "Permanent intelligence gathering. Cannot be removed easily."
  }
}
```

#### Thievery Technology Tree
```typescript
// In technologyData.ts - Thievery technologies
"Stealth Training": {
  description: "Improves thief stealth and recovery rate",
  stat: 'stealth',
  flat_bonus: 0.1, // +10% stealth per level
  maxLevel: 5,
  cost: 100000,
  researchTime: 30,
  effects: {
    thief_recovery_rate: 1.5, // Like Insight technology for magic
    capture_rate_reduction: 0.05 // -5% capture rate per level
  }
},
"Advanced Infiltration": {
  description: "Improves mission success rates",
  stat: 'infiltration', 
  flat_bonus: 0.1, // +10% success per level
  maxLevel: 3,
  cost: 150000,
  researchTime: 45,
  effects: {
    mission_success_bonus: 0.1 // +10% success rate per level
  }
},
"Silent Operations": {
  description: "Reduces detection and improves escape",
  stat: 'stealth',
  flat_bonus: 0.15, // +15% stealth per level
  maxLevel: 3,
  cost: 200000,
  researchTime: 60,
  effects: {
    detection_resistance: 0.2, // 20% chance to avoid detection
    escape_rate: 0.3 // 30% chance to escape if caught
  }
}
```

#### Security Buildings (Counter-Thievery)
```typescript
// In buildingData.ts - Security buildings
"Guard Posts": {
  cost: { gold: 800, iron: 20, wood: 60 },
  effect: 'Increases detection of thieves and reduces mission success rates.',
  race: 'all',
  security_bonus: { 
    detection: 1.2, // Like wizards for counterspelling
    success_rate_reduction: 0.9 // -10% success rate
  }
},
"Security Network": {
  cost: { gold: 2000, iron: 40, wood: 100 },
  effect: 'Advanced security that significantly reduces thievery effectiveness.',
  race: 'all',
  security_bonus: { 
    detection: 1.4,
    success_rate_reduction: 0.8,
    capture_rate: 1.3
  }
},
"Intelligence Agency": {
  cost: { gold: 3500, iron: 60, wood: 150 },
  effect: 'Elite security operations with maximum protection.',
  race: 'all',
  security_bonus: { 
    detection: 1.6,
    success_rate_reduction: 0.7,
    capture_rate: 1.5,
    retaliation: 1.2 // Can retaliate against failed thievery attempts
  }
}
```

#### Success Rate Calculation
```typescript
// Thievery success calculation (mirroring magic system)
function calculateThieverySuccess(attackerThieves, attackerGuilds, targetLand, targetSecurity) {
  // Base success rate (like magic's 75%)
  let baseSuccess = 0.75;
  
  // Thieves efficiency (like wizards per land)
  const thievesPerLand = attackerThieves / attackerGuilds;
  const efficiencyBonus = Math.min(thievesPerLand / 1.0, 0.5); // Cap at +50%
  
  // Target land penalty (more land = harder to infiltrate)
  const landPenalty = Math.min(targetLand / 10, 0.3); // Cap at -30%
  
  // Target security penalty (like wizards for counterspelling)
  const securityPenalty = Math.min(targetSecurity / 20, 0.4); // Cap at -40%
  
  // Racial modifier
  const racialModifier = racialThieveryModifiers[attackerRace];
  
  // Final success rate
  const finalSuccess = (baseSuccess + efficiencyBonus - landPenalty - securityPenalty) * racialModifier;
  
  return Math.max(0.05, Math.min(0.95, finalSuccess)); // Clamp between 5% and 95%
}

### Phase 11: Magic System Balance Implementation

#### Core Magic System Mechanics
```typescript
// Magic success depends on:
// 1. Number of wizards committed
// 2. Number of Schools (infrastructure)
// 3. Target's land size (more land = harder to affect)
// 4. Target's wizards + Schools (counterspelling)

// Wizard recovery after casting:
// Base: 3 wizards per 2 Schools per day
// With "Insight" technology: 2 wizards per School per day

// Racial magic modifiers (current system)
const racialMagicModifiers = {
  'elf': 1.15,      // +15% success (premier casters)
  'human': 1.0,     // 0% (neutral, reliable generalists)
  'orc': 0.85,      // -15% success (too loud/obvious)
  'gnome': 0.625,   // -37.5% success, 35% magic resistance
  'dwarf': 0.5,     // -50% success, 40% magic resistance
  'undead': 1.05    // +5% success (ethereal magic affinity)
}
```

#### Fix Wizard Costs and Upkeep
```typescript
// In unitData.ts - Reduce wizard costs across all races
// Current costs are too high, making magic unaffordable

// ELF WIZARDS (baseline - keep current)
"Wizard": {
  base_gold_cost: 225, // Keep current (baseline)
  upkeep: { gold: 3, food: 1 } // Keep current
}

// HUMAN WIZARDS (slight increase from elf)
"Wizard": {
  base_gold_cost: 275, // Keep current
  upkeep: { gold: 4, food: 1 } // Keep current
}

// UNDEAD WIZARDS (new - between elf and human)
"Wizard": {
  base_gold_cost: 250, // New cost
  upkeep: { gold: 3.5, food: 1 } // New upkeep
}

// ORC WIZARDS (reduce from current)
"Wizard": {
  base_gold_cost: 200, // Reduce from 300
  upkeep: { gold: 3, food: 1 } // Reduce from 5g
}

// GNOME WIZARDS (reduce from current)
"Wizard": {
  base_gold_cost: 300, // Reduce from 450
  upkeep: { gold: 6, food: 2 } // Reduce from 10g/3f
}

// DWARF WIZARDS (reduce from current)
"Wizard": {
  base_gold_cost: 350, // Reduce from 500
  upkeep: { gold: 7, food: 2 } // Reduce from 10g/4f
}
```

#### Fix Gate Spell (Overpowered)
```typescript
// In strategyData.ts - Nerf Gate spell
"Gate": {
  effect: "Summon troops back to castles (reduced effectiveness)",
  duration: "0 days",
  wizards_needed: "Always successful",
  tech_level: 4,
  notes: "Each wizard can summon up to 1.5 men (reduced from 3). 25% chance of troop loss (increased from base). Cannot summon generals. Breaks protection.",
  new_mechanics: {
    troops_per_wizard: 1.5, // Reduced from 3
    loss_chance: 0.25, // Increased risk
    travel_time_reduction: 0.75, // 75% faster return instead of instant
    cooldown: "24 hours" // Cannot be cast repeatedly
  }
}
```

#### Add Magic Infrastructure Buildings
```typescript
// In buildingData.ts - Magic infrastructure buildings
"Magic Academy": {
  cost: { gold: 1200, iron: 20, wood: 60 },
  effect: 'Increases wizard training efficiency and reduces upkeep costs.',
  race: 'all',
  magic_bonus: { 
    wizard_upkeep_reduction: 0.2, // -20% wizard upkeep
    training_efficiency: 1.2 // +20% training speed
  }
},
"Arcane Library": {
  cost: { gold: 2000, iron: 30, wood: 100 },
  effect: 'Advanced magical research facility. Reduces spell research time.',
  race: 'all',
  magic_bonus: { 
    research_speed: 1.3, // +30% research speed
    spell_power: 1.1 // +10% spell effectiveness
  }
},
"Magical Nexus": {
  cost: { gold: 3500, iron: 50, wood: 150 },
  effect: 'Elite magical facility. Significantly improves all magical operations.',
  race: 'all',
  magic_bonus: { 
    wizard_upkeep_reduction: 0.3, // -30% wizard upkeep
    spell_success: 1.15, // +15% spell success rate
    recovery_rate: 1.2 // +20% wizard recovery rate
  }
}
```

#### Add Magic Technology Tree
```typescript
// In technologyData.ts - Magic technologies
"Insight": {
  description: "Improves wizard recovery rate and spell efficiency",
  stat: 'magic',
  flat_bonus: 0.1, // +10% efficiency per level
  maxLevel: 5,
  cost: 100000,
  researchTime: 30,
  effects: {
    wizard_recovery_rate: 1.5, // Like current Insight
    spell_efficiency: 1.1 // +10% spell power per level
  }
},
"Arcane Mastery": {
  description: "Improves spell success rates and reduces costs",
  stat: 'magic',
  flat_bonus: 0.15, // +15% success per level
  maxLevel: 3,
  cost: 150000,
  researchTime: 45,
  effects: {
    spell_success_bonus: 0.15, // +15% success rate per level
    wizard_upkeep_reduction: 0.1 // -10% upkeep per level
  }
},
"Magical Resonance": {
  description: "Improves counterspelling and magical defense",
  stat: 'magic',
  flat_bonus: 0.2, // +20% defense per level
  maxLevel: 3,
  cost: 200000,
  researchTime: 60,
  effects: {
    counterspell_power: 1.2, // +20% counterspell effectiveness
    magic_resistance: 0.1 // +10% magic resistance per level
  }
}
```

#### Racial Magic Balance Adjustments
```typescript
// Adjust racial modifiers to make magic more accessible
const newRacialMagicModifiers = {
  'elf': 1.20,      // +20% success (premier casters, slight buff)
  'human': 1.0,     // 0% (neutral, reliable generalists)
  'undead': 1.10,   // +10% success (ethereal magic affinity)
  'orc': 0.90,      // -10% success (reduced penalty from -15%)
  'gnome': 0.75,    // -25% success (reduced penalty from -37.5%)
  'dwarf': 0.65     // -35% success (reduced penalty from -50%)
}

// Add racial magic specialties
const racialMagicSpecialties = {
  'elf': {
    specialty: 'Nature Magic',
    bonus: '+25% success with growth/production spells',
    spells: ['Growing Crop', 'Natural Growth', 'Blessing', 'God Blessing']
  },
  'human': {
    specialty: 'Balanced Magic',
    bonus: '+15% success with all spells when cast on self',
    spells: 'All spells'
  },
  'undead': {
    specialty: 'Death Magic',
    bonus: '+30% success with offensive/destructive spells',
    spells: ['Fireball', 'Famine', 'Earthquake', 'Wraith\'s Temptation']
  },
  'orc': {
    specialty: 'War Magic',
    bonus: '+25% success with combat-related spells',
    spells: ['Fireball', 'Firewall', 'Freeze']
  },
  'gnome': {
    specialty: 'Technical Magic',
    bonus: '+20% success with transformation spells',
    spells: ['Iron to Gold', 'Wood to Food', 'Truesight']
  },
  'dwarf': {
    specialty: 'Protective Magic',
    bonus: '+30% success with defensive spells',
    spells: ['Firewall', 'Blessing', 'God Blessing']
  }
}
```

#### School System Improvements
```typescript
// Reduce School requirements to make magic more accessible
// Old: 1 School per land for 75% success
// New: 0.5 Schools per land for 75% success (50% reduction)

// In buildingData.ts - Improve School efficiency
"School": {
  cost: { gold: 800, iron: 15, wood: 40 }, // Reduce from current cost
  effect: 'Trains wizards and increases magical efficiency. Base: 1 wizard per day.',
  race: 'all',
  production: { wizard: 1 },
  magic_bonus: { efficiency: 2.0 } // Double efficiency (like 2 old Schools)
}

// Add advanced School variants
"University": {
  cost: { gold: 1500, iron: 25, wood: 80 },
  effect: 'Advanced magical education. 2 wizards per day, +30% efficiency.',
  race: 'all',
  production: { wizard: 2 },
  magic_bonus: { efficiency: 2.6 } // 2.0 + 30%
},
"Grand Academy": {
  cost: { gold: 2500, iron: 40, wood: 120 },
  effect: 'Elite magical institution. 3 wizards per day, +50% efficiency.',
  race: 'all',
  production: { wizard: 3 },
  magic_bonus: { efficiency: 3.0 } // 2.0 + 50%
}
```

#### Spell Duration and Recovery Balance Fix
```typescript
// CRITICAL FIX: Spell durations are too short vs wizard recovery rates
// Current: 6-12 hour spells vs 18-24 hour recovery = broken system
// Solution: Extend spell durations to match recovery cycles

// In strategyData.ts - Fix spell durations to match recovery rates
const balancedSpells = {
  "Growing Crop": {
    effect: "Farms produce at peak efficiency; crops mature faster.",
    duration: "24 hours", // Increase from 6 days (was too long)
    wizards_needed: 5, // Reduce from 7
    tech_level: 0,
    notes: "Yield scales with wizards used. Duration matches recovery cycle."
  },
  "Natural Growth": {
    effect: "Population becomes extremely fertile. Birth rate surges; cancels Famine.",
    duration: "36 hours", // Increase from 8 days (was too long)
    wizards_needed: 12, // Reduce from 15
    tech_level: 0,
    notes: "Cancels Famine spell. Duration matches recovery cycle."
  },
  "Iron to Gold": {
    effect: "Convert iron to gold. Yield scales with wizards used.",
    duration: "0 days", // Keep instant
    wizards_needed: 10, // Reduce from 12
    tech_level: 0,
    notes: "1 iron = 2 gold base conversion"
  },
  "Fireball": {
    effect: "Kills population and reduces production.",
    duration: "0 days", // Keep instant
    wizards_needed: 8, // Add requirement (was N/A)
    tech_level: 0,
    notes: "Breaks protection, grants retaliation. Kills 5% population per wizard."
  },
  "Blessing": {
    effect: "Increases population productivity by 10%.",
    duration: "48 hours", // Increase from 12 days (was too long)
    wizards_needed: 10, // Reduce from 12
    tech_level: 0,
    notes: "Increases income by 10%. Duration matches recovery cycle."
  },
  "Truesight": {
    effect: "Reveals enemy kingdom details.",
    duration: "N/A", // Keep instant
    wizards_needed: 3, // Add requirement (was 0)
    tech_level: 0,
    notes: "Precision depends on wizards used and tech level"
  },
  "Wood to Food": {
    effect: "Convert wood to food (1:10 ratio).",
    duration: "0 days", // Keep instant
    wizards_needed: 10, // Reduce from 12
    tech_level: 1,
    notes: "Amount converted depends on wizards used"
  },
  "Farseeing": {
    effect: "Increases exploration rate by 2.",
    duration: "48 hours", // Increase from 12 days (was too long)
    wizards_needed: 6, // Reduce from 7
    tech_level: 1,
    notes: "Faster exploration. Duration matches recovery cycle."
  },
  "Freeze": {
    effect: "Reduces target production by 10% and building rate by 66%.",
    duration: "36 hours", // Increase from 8 days (was too long)
    wizards_needed: 15, // Add requirement (was N/A)
    tech_level: 2,
    notes: "Affects wood, food, iron, gold production. Duration matches recovery cycle."
  },
  "Famine": {
    effect: "Reduces population growth to -0.02% per day.",
    duration: "72 hours", // Increase from 15 days (was too long)
    wizards_needed: 18, // Add requirement (was N/A)
    tech_level: 2,
    notes: "Cannot reduce population below 65%. Cancelled by Natural Growth. Duration matches recovery cycle."
  },
  "Earthquake": {
    effect: "Destroys enemy buildings (max 15%).",
    duration: "0 days", // Keep instant
    wizards_needed: 25, // Add requirement (was N/A)
    tech_level: 3,
    notes: "May destroy your buildings too. Breaks protection, grants retaliation."
  },
  "Firewall": {
    effect: "Increases damage to attacking units by 8%.",
    duration: "72 hours", // Increase from 15 days (was too long)
    wizards_needed: 15, // Reduce from 20
    tech_level: 3,
    notes: "May destroy your buildings due to heat. Duration matches recovery cycle."
  },
  "Gate": {
    effect: "Summon troops back to castles (reduced effectiveness).",
    duration: "0 days", // Keep instant
    wizards_needed: "Always successful",
    tech_level: 4,
    notes: "1.5 troops per wizard, 25% loss chance, 75% faster return, 24h cooldown."
  },
  "God Blessing": {
    effect: "Increases all production by 10%, negates crime effects.",
    duration: "60 hours", // Increase from 11 days (was too long)
    wizards_needed: 20, // Reduce from 25
    tech_level: 4,
    notes: "Failing causes population distrust and crime increase. Duration matches recovery cycle."
  }
}

// IMPROVED WIZARD RECOVERY SYSTEM
// Current: 3 wizards per 2 Schools per day (too slow)
// New: 2 wizards per School per day (50% faster recovery)
// With Insight tech: 3 wizards per School per day (100% faster recovery)

// In calculateMagicRecovery.ts
function calculateWizardRecovery(schools: number, insightLevel: number): number {
  const baseRecovery = schools * 2; // 2 wizards per School per day (was 1.5)
  const insightBonus = schools * insightLevel * 1; // +1 wizard per School per level
  return Math.floor(baseRecovery + insightBonus);
}

// ELIMINATE 5:1 SCHOOL RATIOS
// The new recovery rates make excessive School building unnecessary
// Players can now maintain spells with reasonable School:Land ratios (1:1 to 2:1)
```

#### Success Rate Calculation Improvements
```typescript
// Improved magic success calculation
function calculateMagicSuccess(attackerWizards, attackerSchools, targetLand, targetWizards, targetSchools, attackerRace) {
  // Base success rate (like current 75%)
  let baseSuccess = 0.75;
  
  // Wizards efficiency (like current system)
  const wizardsPerSchool = attackerWizards / attackerSchools;
  const efficiencyBonus = Math.min(wizardsPerSchool / 1.0, 0.5); // Cap at +50%
  
  // Target land penalty (more land = harder to affect)
  const landPenalty = Math.min(targetLand / 10, 0.3); // Cap at -30%
  
  // Target counterspelling penalty (wizards + schools)
  const targetMagicPower = targetWizards + (targetSchools * 2); // Schools count double
  const counterspellPenalty = Math.min(targetMagicPower / 20, 0.4); // Cap at -40%
  
  // Racial modifier (adjusted for balance)
  const racialModifier = newRacialMagicModifiers[attackerRace];
  
  // Final success rate
  const finalSuccess = (baseSuccess + efficiencyBonus - landPenalty - counterspellPenalty) * racialModifier;
  
  return Math.max(0.05, Math.min(0.95, finalSuccess)); // Clamp between 5% and 95%
}

### Phase 12: Protection System Scaling Implementation

#### Core Protection Scaling Mechanics
```typescript
// Protection system that scales with army losses
// Accounts for the reality that battles can wipe 80-100% of armies
// Protection should last long enough for meaningful rebuilding

const protectionSystem = {
  "Attack Success": {
    base_protection: 8, // 8 hours base protection
    army_loss_bonus: 2, // +2 hours per 20% army lost
    max_protection: 24, // Cap at 24 hours
    calculation: "8h + (2h × army_loss_percentage / 20%)"
  },
  "Defense Failure": {
    base_protection: 6, // 6 hours base protection
    army_loss_bonus: 2, // +2 hours per 20% army lost
    max_protection: 20, // Cap at 20 hours
    calculation: "6h + (2h × army_loss_percentage / 20%)"
  },
  "Successful Defense": {
    base_protection: 4, // 4 hours base protection
    army_loss_bonus: 1, // +1 hour per 20% army lost (less scaling)
    max_protection: 12, // Cap at 12 hours
    calculation: "4h + (1h × army_loss_percentage / 20%)"
  },
  "Failed Attack": {
    base_protection: 2, // 2 hours base protection
    army_loss_bonus: 1, // +1 hour per 20% army lost
    max_protection: 8, // Cap at 8 hours
    calculation: "2h + (1h × army_loss_percentage / 20%)"
  }
}

// Example Calculations:
// If you lose 80% of your army:
// - Attack success: 8h + (4 × 2h) = 16 hours protection
// - Defense failure: 6h + (4 × 2h) = 14 hours protection
// - Successful defense: 4h + (4 × 1h) = 8 hours protection
// - Failed attack: 2h + (4 × 1h) = 6 hours protection

// If you lose 40% of your army:
// - Attack success: 8h + (2 × 2h) = 12 hours protection
// - Defense failure: 6h + (2 × 2h) = 10 hours protection
// - Successful defense: 4h + (2 × 1h) = 6 hours protection
// - Failed attack: 2h + (2 × 1h) = 4 hours protection
```

#### Protection Calculation Function
```typescript
// Calculate protection time based on battle outcome and army losses
function calculateProtectionTime(battleOutcome: string, armyLossPercentage: number): number {
  const system = protectionSystem[battleOutcome];
  
  if (!system) {
    return 0; // No protection for unknown outcomes
  }
  
  // Calculate bonus protection based on army losses
  const lossMultiplier = Math.floor(armyLossPercentage / 20); // Every 20% = 1 bonus
  const bonusProtection = lossMultiplier * system.army_loss_bonus;
  
  // Total protection time
  const totalProtection = system.base_protection + bonusProtection;
  
  // Cap at maximum protection
  return Math.min(totalProtection, system.max_protection);
}

// Usage examples:
// calculateProtectionTime("Attack Success", 80) // Returns 16 hours
// calculateProtectionTime("Defense Failure", 60) // Returns 12 hours
// calculateProtectionTime("Successful Defense", 40) // Returns 6 hours
// calculateProtectionTime("Failed Attack", 20) // Returns 3 hours
```

#### Activity Penalty System
```typescript
// Activity penalty to encourage engagement
const activityPenalty = {
  "Active Player": {
    protection_reduction: 0.1, // 10% less protection
    definition: "Player who has attacked or been attacked in last 24 hours"
  },
  "Inactive Player": {
    protection_reduction: 0, // No penalty
    definition: "Player who hasn't been in combat for 24+ hours"
  }
}

// Apply activity penalty to final protection time
function applyActivityPenalty(protectionTime: number, isActivePlayer: boolean): number {
  if (isActivePlayer) {
    return protectionTime * 0.9; // 10% reduction
  }
  return protectionTime; // No reduction
}
```


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
| SkeletalLegion | 1/0/0/1 | 1/2/0/1 | 79g | 200g | 1.5g,0f | 4g,0f | none | light | +121g cost, +2 short, +2.5g upkeep, +light armor |
| WraithPikeman | 4/0/0/4 | 4/2/0/4 | 285g | 500g | 6g,0f | 10g,0f | light | light | +215g cost, +2 short, +4g upkeep |
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

### New Thievery System
| Component | Details | Effect |
|-----------|---------|--------|
| **Thieves Guild** | 1500g, 30i, 80w | Trains 1 thief/day, increases efficiency |
| **Underground Network** | 2500g, 50i, 120w | Trains 2 thieves/day, +20% efficiency |
| **Espionage Center** | 4000g, 80i, 200w | Trains 3 thieves/day, +40% efficiency |
| **Guard Posts** | 800g, 20i, 60w | +20% detection, -10% success rate |
| **Security Network** | 2000g, 40i, 100w | +40% detection, -20% success rate |
| **Intelligence Agency** | 3500g, 60i, 150w | +60% detection, -30% success rate |
| **Gold Heist** | 8 thieves needed | Steals gold, 75% success rate |
| **Resource Theft** | 10 thieves needed | Steals resources, 70% success rate |
| **Food Poisoning** | 12 thieves needed | Destroys 25% food, 65% success rate |
| **Troop Assassination** | 15 thieves needed | Kills 10% troops, 60% success rate |
| **Intelligence Gathering** | 5 thieves needed | Reveals kingdom details, 80% success rate |
| **Building Sabotage** | 20 thieves needed | Destroys buildings, 55% success rate |
| **Economic Sabotage** | 18 thieves needed | -10% production for 8 days, 60% success rate |
| **Security Breach** | 25 thieves needed | -50% detection for 6 days, 50% success rate |
| **Mass Infiltration** | 30 thieves needed | Multiple thefts, 45% success rate |
| **Shadow Network** | 40 thieves needed | Permanent spy network, 40% success rate |

### New Magic System Balance
| Component | Old Value | New Value | Effect |
|-----------|-----------|-----------|--------|
| **Elf Wizard** | 225g, 3g/1f | 225g, 3g/1f | Baseline (unchanged) |
| **Human Wizard** | 275g, 4g/1f | 275g, 4g/1f | Baseline (unchanged) |
| **Undead Wizard** | N/A | 250g, 3.5g/1f | New race option |
| **Orc Wizard** | 300g, 5g/1f | 200g, 3g/1f | -33% cost, -40% upkeep |
| **Gnome Wizard** | 450g, 10g/3f | 300g, 6g/2f | -33% cost, -40% upkeep |
| **Dwarf Wizard** | 500g, 10g/4f | 350g, 7g/2f | -30% cost, -30% upkeep |
| **School Efficiency** | 1.0 | 2.0 | Double efficiency (50% fewer needed) |
| **School Cost** | Current | 800g, 15i, 40w | Reduced cost |
| **Gate Spell** | 3 troops/wizard | 1.5 troops/wizard | -50% effectiveness |
| **Gate Risk** | Base | 25% loss chance | Increased risk |
| **Gate Travel** | Instant | 75% faster | No longer instant |
| **Wizard Recovery** | 1.5 per School/day | 2 per School/day | 33% faster recovery |
| **Insight Recovery** | 2 per School/day | 3 per School/day | 50% faster with tech |
| **Spell Durations** | 6-15 days | 24-72 hours | Match recovery cycles |
| **School Ratios** | 5:1 excessive | 1:1 to 2:1 | Eliminate broken ratios |
| **Elf Magic** | +15% success | +20% success | Slight buff |
| **Orc Magic** | -15% success | -10% success | Reduced penalty |
| **Gnome Magic** | -37.5% success | -25% success | Reduced penalty |
| **Dwarf Magic** | -50% success | -35% success | Reduced penalty |
| **Undead Magic** | N/A | +10% success | New race option |

### Universal Spells System
| Spell | Wizards | Tech Level | Effect | Duration |
|-------|---------|------------|--------|----------|
| **Rally the Troops** | 10 | 1 | +20% melee/short/range damage for all units | 6 hours |
| **Fortify Defenses** | 12 | 2 | +25% defense for all units | 8 hours |
| **Scout's Vision** | 6 | 0 | Reveals army composition and protection status | Instant |
| **Mana Surge** | 15 | 3 | Doubles wizard recovery rate | 12 hours |
| **Dispel Magic** | 20 | 3 | Removes all active spells from target | Instant |
| **Time Warp** | 25 | 4 | Reduces all timers by 25% | 24 hours |
| **Mass Teleport** | 30 | 4 | Instant troop movement (50% loss chance) | Instant |
| **Protection Breach** | 12 | 2 | Reduces target protection by 50% | Instant |
| **Shield of Valor** | 8 | 1 | Grants 8h protection after successful defense | 8 hours |
| **Reality Anchor** | 18 | 3 | Blocks teleportation and protection manipulation | 12 hours |

### Race-Specific Spells System
| Race | Spell | Wizards | Tech Level | Effect | Duration |
|------|-------|---------|------------|--------|----------|
| **Elf** | **Nature's Wrath** | 15 | 2 | +30% melee/short/range damage to all units, +50% to archers | 8 hours |
| **Elf** | **Forest Camouflage** | 8 | 1 | +40% defense to all units, +20% to archers | 12 hours |
| **Dwarf** | **Stone Skin** | 12 | 2 | +40% defense to all units, +60% to heavy armor units | 10 hours |
| **Dwarf** | **Mountain's Fury** | 18 | 3 | +25% melee damage, +35% to hammer/axe units | 6 hours |
| **Human** | **Inspiration** | 10 | 1 | +15% to all stats (melee/short/range/defense), +25% production speed | 12 hours |
| **Human** | **Tactical Mastery** | 14 | 2 | +20% to unit weights, +30% strategy effectiveness | 8 hours |
| **Orc** | **Blood Rage** | 12 | 2 | +40% melee damage, +20% short damage, -20% defense | 6 hours |
| **Orc** | **Pack Tactics** | 10 | 1 | +25% damage when outnumbered, +15% to mounted units | 8 hours |
| **Gnome** | **Mechanical Genius** | 16 | 3 | +30% to siege units, +40% building speed, +25% equipment efficiency | 10 hours |
| **Gnome** | **Precision Engineering** | 12 | 2 | +20% range damage, +30% to all units, +15% defense | 8 hours |
| **Undead** | **Death's Embrace** | 14 | 2 | +25% to all undead units, +40% post-battle healing | 10 hours |
| **Undead** | **Soul Harvest** | 18 | 3 | Kills 5% of enemy troops, converts 10% to your side | Instant |

### Protection System Rebalancing
| Component | Old Value | New Value | Effect |
|-----------|-----------|-----------|--------|
| **Attack Success** | 24 hours | 8h base + 2h per 20% army lost (max 24h) | Scales with army losses, max 24 hours |
| **Defense Failure** | 15 hours | 6h base + 2h per 20% army lost (max 20h) | Scales with army losses, max 20 hours |
| **Successful Defense** | 0 hours | 4h base + 1h per 20% army lost (max 12h) | Rewards good defense, scales with losses |
| **Failed Attack** | 0 hours | 2h base + 1h per 20% army lost (max 8h) | Penalizes bad attacks, minimal protection |
| **Activity Penalty** | N/A | -10% protection | Active players get less protection |

---

## ⚖️ BALANCE IMPACT ANALYSIS

### Most Impactful Changes

#### 1. Heavy Armor Technology Buff
- **Effect**: +2 defense → +5 defense (premium scaling)
- **Impact**: Massive buff to Dwarf and heavy armor units
- **Benefit**: Heavy armor units become the premium late-game option

#### 2. Undead Economic Balance
- **Effect**: Undead units keep no food costs but increased gold costs/upkeep
- **Impact**: Economic nerf to Undead race while maintaining thematic identity
- **Benefit**: Undead no longer have unfair economic advantage, but keep their unique food-free theme

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

#### 7. Thievery System Integration
- **Effect**: New espionage system mirroring magic mechanics
- **Thieves**: Dedicated espionage units with recovery system
- **Infrastructure**: Thieves Guilds provide efficiency (like Schools for magic)
- **Security**: Counter-thievery buildings provide defense (like wizards for counterspelling)
- **Missions**: 10 different thievery operations with varying costs and effects
- **Racial Modifiers**: Different races have varying thievery effectiveness
- **Impact**: Adds new strategic layer to warfare beyond direct combat
- **Benefit**: Creates economic warfare, intelligence gathering, and sabotage options

#### 8. Magic System Balance Overhaul
- **Effect**: Comprehensive magic system rebalancing to make it accessible to all races
- **Wizard Costs**: Reduced costs for Orcs (-33%), Gnomes (-33%), Dwarves (-30%)
- **Wizard Upkeep**: Reduced upkeep for all disadvantaged races (-30% to -40%)
- **School Efficiency**: Doubled efficiency (50% fewer Schools needed for same effect)
- **Racial Penalties**: Reduced penalties for Orcs (-15%→-10%), Gnomes (-37.5%→-25%), Dwarves (-50%→-35%)
- **Gate Spell**: Nerfed from 3 troops/wizard to 1.5, added 25% loss chance, 75% faster return instead of instant
- **Spell Duration Crisis**: Fixed 6-15 day durations → 24-72 hours to match recovery cycles
- **Wizard Recovery**: Increased from 1.5 to 2 per School/day (33% faster), Insight tech gives 3 per School/day
- **5:1 School Ratios**: Eliminated broken system, now 1:1 to 2:1 School:Land ratios work properly
- **Racial Specialties**: Added unique magic specialties for each race (Nature, Death, War, Technical, Protective, Balanced)
- **Infrastructure**: Added Magic Academy, Arcane Library, Magical Nexus buildings
- **Technology**: Added Insight, Arcane Mastery, Magical Resonance technologies
- **Impact**: Makes magic viable for all races while maintaining racial identity
- **Benefit**: Creates strategic diversity and makes magic a core gameplay element for all races

#### 9. Enhanced Magic System Integration
- **Effect**: 22 total new spells (10 universal + 12 race-specific) adding strategic depth
- **Universal Spells**: Combat bonuses (melee/short/range/defense), utility, movement, and protection manipulation
- **Race-Specific Spells**: Each race gets 2 unique thematic spells using real game mechanics
  - **Elf**: Nature's Wrath (+30% damage, +50% archer boost), Forest Camouflage (+40% defense, +20% archer defense)
  - **Dwarf**: Stone Skin (+40% defense, +60% heavy armor), Mountain's Fury (+25% melee, +35% hammer/axe)
  - **Human**: Inspiration (+15% all stats, +25% production), Tactical Mastery (+20% unit weights, +30% strategy)
  - **Orc**: Blood Rage (+40% melee, +20% short, -20% defense), Pack Tactics (+25% when outnumbered, +15% mounted)
  - **Gnome**: Mechanical Genius (+30% siege, +40% building, +25% equipment), Precision Engineering (+20% range, +30% all units, +15% defense)
  - **Undead**: Death's Embrace (+25% undead, +40% healing), Soul Harvest (kills 5% enemy, converts 10%)
- **Impact**: Expands magical toolkit with both universal and race-specific tactical options using only real game mechanics
- **Benefit**: Creates more strategic depth while maintaining racial identity and making magic engaging for all players

#### 10. Protection System Scaling Overhaul
- **Effect**: Protection system that scales with actual army losses suffered
- **Core Problem Solved**: Fixed protection times didn't account for army rebuilding time (24-60 hours)
- **Scaling Protection**: 8h base + 2h per 20% army lost for attack success (max 24h), 6h base + 2h per 20% army lost for defense failure (max 20h)
- **Defense Rewards**: Successful defense gets 4h base + 1h per 20% army lost (max 12h)
- **Attack Penalties**: Failed attacks get 2h base + 1h per 20% army lost (max 8h)
- **Activity Penalty**: Active players get 10% less protection to encourage engagement
- **Removed Systems**: Alliance War and Challenge System removed (too complex/illogical)
- **Impact**: Protection now matches actual rebuilding needs, prevents endless attacks on weakened kingdoms
- **Benefit**: Creates fair, predictable protection that scales with battle intensity and encourages strategic play

### Race Balance Shifts

| Race | Overall Change | Key Buffs | Key Nerfs |
|------|---------------|-----------|-----------|
| **Dwarf** | 🟢 Buffed | Heavy armor tech +5 defense, multi-phase damage, armor type additions | None |
| **Undead** | 🔴 Nerfed | Multi-phase damage, armor type additions | Higher gold costs/upkeep, +2 short range to all units |
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

This comprehensive balance plan addresses all major issues while maintaining race uniqueness and strategic depth.











