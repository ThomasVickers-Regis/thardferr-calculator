# Thardferr Calculator - Game Design Document

## Core Game Overview
Thardferr is a turn-based strategy game with 6 races (Dwarf, Elf, Gnome, Human, Orc, Undead), each with unique units, technologies, and strategies. Players manage kingdoms with buildings, population, armies, and engage in tactical battles across 3 phases: range, short, melee.

## Races & Units

### Dwarf
- **Units**: Shieldbearer (3w), HammerWheilder (2w), AxeMan (2w), Runner (1w), LightCrossbowman (2w), HeavyCrossbowman (1w)
- **Unique Strategy**: Dwarf Shield Line - All units -10% melee/short attack, Shieldbearers -50% defense (redistributed to others), ranged mitigation
- **Special**: Shieldbearers provide ranged damage mitigation

### Elf  
- **Units**: Mage (1w), Swordman (3w), Lanceman (3w), Caragous (2w), Archer (3w), EliteArcher (1.5w)
- **Unique Strategy**: Elf Energy Gathering - Mages get +100% melee, +4 range, +2 defense in melee/short phases
- **Special**: Caragous scales with enemy army size (0-10 melee/defense bonus)

### Gnome
- **Units**: Catapult (1w), Infantry (2w), Militia (2.5w), Rider (2w), RockThrower (2.5w), Balista (1w)
- **Unique Strategy**: Gnome Far Fighting - Doubles ranged damage for both sides
- **Special**: Ranged-focused race

### Human
- **Units**: Knight (1w), Infantry (3w), Pikeman (3w), HeavyInfantry (2.5w), Archer (2w), MountedArchers (1w)
- **Unique Strategy**: Human Charging! - Knights get +50% attack/short, -25% defense
- **Special**: Pikemen deal 2x damage vs mounted units

### Orc
- **Units**: ShadowWarrior (1w), Rusher (3w), Slother (3w), WolfMaster (2w), Slinger (2.5w), AxeThrower (1.5w)
- **Unique Strategy**: Orc Surrounding - ShadowWarriors deal all damage in short phase, +2 defense, 0% hiding
- **Special**: WolfMaster provides +1 short damage per unit to Rusher/Slother

### Undead
- **Units**: DarkKnight (1w), SkeletonWarrior (1.5w), WraithPikeman (2w), Abomination (2w), PhantomArcher (2w), WraithRider (1w)
- **Unique Strategy**: Skeleton Swarm - Skeleton units immune to long range damage
- **Special**: Undead units have unique immunities

## Combat System

### Battle Phases
1. **Range Phase**: Bow/archer units attack, Guard Towers provide mitigation
2. **Short Phase**: Close-range attacks, ShadowWarriors deal full damage here
3. **Melee Phase**: Close combat, Medical Centers provide mitigation

### Damage Calculation
- **Global Scaling**: Full damage applied (no scaling for single-round battles)
- **Unit Weights**: Different units have different damage allocation weights (1-3)
- **Mitigation**: Buildings reduce incoming damage before unit losses calculated
- **Defense**: Each unit has defense stat, damage/defense = units lost

### Special Combat Rules
- **Pikemen vs Mounted**: 2x damage, 3.5x with Anti-Cavalry strategy
- **Mages**: Immune to melee/short damage (except with Elf Energy Gathering)
- **ShadowWarriors**: 25% hiding (75% damage reduction), +15% with Cloacking tech
- **Skeletons**: Immune to range damage with Skeleton Swarm strategy

## Technologies

### Combat Technologies
- **Sharper Blades**: +1 melee per level for blade units
- **Tougher Light Armor**: +1 defense per level for light armor units  
- **Tougher Heavy Armor**: +1 defense per level for heavy armor units
- **Improve Bow Range**: +50% range per level for bow units
- **Cloacking**: +15% hiding for ShadowWarriors
- **Fortification**: -5% incoming damage when defender has it

## Strategies

### General Strategies
- **Archer Protection**: Infantry -50% attack, protects archers
- **Infantry Attack**: Infantry -75% defense, redistributes to other units
- **Quick Retreat**: -50% attack, 40% retreat threshold, 50% chance to lose on victory
- **Anti-Cavalry**: Pikemen +250% vs mounted, others -10% attack

### Race-Specific Strategies
- **Dwarf Shield Line**: All units -10% melee/short attack, Shieldbearers -50% defense (redistributed to others), ranged mitigation
- **Elf Energy Gathering**: Mages +100% melee, +4 range, +2 defense in melee/short
- **Gnome Far Fighting**: Doubles ranged damage for both sides
- **Human Charging!**: Knights +50% attack/short, -25% defense
- **Orc Surrounding**: ShadowWarriors all damage in short phase, +2 defense
- **Skeleton Swarm**: Skeleton units immune to range damage

## Buildings & Economy

### Production Buildings
- **Farm**: 100 food/day, Orc +15%
- **Mine**: 4 iron/day, Dwarf +1, Orc +2  
- **Mill**: 5 wood/day, Elf +1, Orc +2
- **Forge**: Iron processing
- **Market**: Gold trading

### Military Buildings
- **Guard Towers**: 40 ranged mitigation per tower (max 2/unit)
- **Medical Centers**: 50/75 melee mitigation per center (max 1/2 per unit), 20% healing post-battle
- **Castle**: Defensive penalty scaling (1 castle: 100%, 2-9: 80%, 10-19: 75%, 20+: 70%)
- **Training Centers**: Unit production buildings

### Housing Buildings
- **House**: 100 peasants
- **Guard House**: 40 soldiers (Orc +10, Gnome +20)
- **School**: 40 wizards (Gnome +20)

## Population & Economy

### Population Types
- **Peasants**: Basic workers
- **Soldiers**: Military units
- **Wizards**: Magic users

### Resource System
- **Gold**: Primary currency
- **Iron**: Equipment cost
- **Wood**: Equipment cost  
- **Food**: Unit upkeep

### Market Prices
- Wood: 80 gold
- Iron: 100 gold
- Food: 60 gold

## Battle Mechanics

### Retreat Conditions
- **Standard**: 20% army loss triggers retreat
- **Quick Retreat**: 40% army loss triggers retreat
- **Victory Conditions**: Eliminate enemy or cause sufficient casualties

### Healing System
- **Medical Centers**: Heal 10-20% of losses post-battle based on center/land ratio
- **Healing Formula**: (centers/land) >= 1: 20%, >= 0.5: 10%, < 0.5: 0%

### Damage Allocation
- **Weighted Distribution**: Units receive damage based on unit weights
- **Mitigation First**: Building effects reduce total damage pool
- **Unit Losses**: Final damage / unit defense = units lost

## Kingdom Strength (KS)
- Calculated from army composition, buildings, population
- Affects battle calculations and bottomfeeding mechanics
- Higher KS provides advantages in combat

## Special Unit Interactions
- **Caragous Scaling**: Melee/defense scales with enemy army size percentage
- **WolfMaster Support**: Provides short damage bonus to Rusher/Slother
- **Pikemen Bonus**: Enhanced damage vs mounted units
- **Mage Immunity**: Phase-specific damage immunity
- **ShadowWarrior Hiding**: Damage reduction based on detection chance

## Economic Efficiency
- **TEGC**: Total Effective Gold Cost (initial + 48h upkeep)
- **Efficiency Ratios**: Gold per attack/defense/range (lower = better)
- **Unit Production**: Buildings provide unit training capabilities

## Battle Simulation Flow
1. Apply castle penalties to defender
2. Calculate KS difference factors
3. Simulate rounds until retreat/victory conditions
4. Apply healing from Medical Centers
5. Determine final outcome and casualties

## Key Design Principles
- **Asymmetric Balance**: Each race has unique strengths and weaknesses
- **Strategic Depth**: Multiple viable strategies per race
- **Economic Tension**: Resource management vs military power
- **Tactical Complexity**: Phase-based combat with multiple damage types
- **Progression Systems**: Technology trees and building upgrades
- **Risk/Reward**: Strategies provide bonuses with penalties

---

# Thardferr Calculator – Complete Design and Mechanics (Code-Accurate)

This document captures all battle formulas, steps, stats, strategies, technologies, buildings, and economy rules implemented in this repository. Hand this file to any AI for full context on how the calculator simulates Thardferr battles.

## 1) Races, Units, Stats, Flags

- Races: Dwarf, Elf, Gnome, Human, Orc, Undead.
- Units (per race) with base stats and flags are defined in `data/unitData.ts` under `UNIT_DATA[raceKey][unitName]` with fields:
  - melee, short, range, defense
  - base_gold_cost, equipment_iron_cost, equipment_wood_cost, equipment_gold_cost
  - upkeep: { gold, food }
  - weaponType?: 'blade' | 'bow' | 'siege'
  - armorType?: 'light' | 'heavy' | undefined
  - flags: isInfantry, isPikeman, isMounted

Important special units/flags used by battle logic:
- Mage (Elf): treated as mage unit for melee/short immunity unless strategy removes it.
- ShadowWarrior (Orc): special short/melee handling under Orc Surrounding.
- Skeleton units: named `SkeletalLegion` (Undead) for long-range immunity under Skeleton Swarm.

## 2) Strategies (STRATEGY_DATA) and their Effects

Defined in `data/strategyData.ts`. The following are actually applied in code:

- Archer Protection (General)
  - Infantry attack multiplier: 0.5 (applied to melee/short/range atk values of infantry)
  - Damage sharing reduction: archers get reduction proportional to infantry/archer ratio (see Damage Reductions)

- Infantry Attack (General)
  - Infantry defense reduced by 75% (def = def × 0.25)
  - Sum of lost infantry defense redistributed evenly as a flat defense bonus across all non-infantry defenders (per-unit bonus, recalculated each target stack)

- Quick Retreat (General)
  - All-unit attack multiplier 0.5 is applied twice in the current implementation:
    - Once inside effective stat computation
    - Once again when summing phase damage
  - Net effect: 0.5 × 0.5 = 0.25 (i.e., -75% attack). Building/effect log message still says -50%.
  - Retreat threshold becomes 40% instead of 20%.
  - Special victory rule: if casualties you cause ≥ 40% and your % casualties are less than defender’s, you can win immediately.

- Anti-Cavalry (General)
  - Non-pikemen: attack × 0.9
  - Pikemen: against mounted defenders, their share of pikemen damage gets an extra ×3.5 multiplier on top of base ×2 vs mounted (see Pikemen vs Mounted formula)

- Dwarf Shield Line (Dwarf Unique)
  - All units: -10% melee and short attack
  - Shieldbearers: -50% defense (redistributed to other units)
  - Defending in range phase: incoming ranged damage reduced by min(1.0, 2 × ShieldbearerRatio)

- Elf Energy Gathering (Elf Unique)
  - Mages: ×2 melee attack, +4 ranged attack
  - Mages: +2 defense only during melee and short phases (applied at damage time)

- Gnome Far Fighting (Gnome Unique)
  - During range phase: doubles total ranged damage for both sides (also doubles the pikemen-damage sub-pool used by anti-cavalry logic)

- Human Charging! (Human Unique)
  - Knights: ×1.5 melee attack (and ×1.5 short for display in UI). Defense −25% (display). In damage code, melee is multiplied; an optional `knights_damage_multiplier` would also apply if present (not set in current data).

- Orc Surrounding (Orc Unique)
  - Shadow Warriors deal all their damage in short phase (implementation details below)
  - Shadow Warriors +2 defense (display modifiers)
  - Melee phase: Shadow Warriors do zero melee damage

- Skeleton Swarm (Undead Unique)
  - Skeleton units (SkeletalLegion) are immune to long-range damage while the defender uses this strategy (see Damage Reductions)

## 3) Technologies (TECHNOLOGY_DATA) affecting Combat

Implemented in `utils/getEffectiveUnitStats.ts`:
- Sharper Blades: +1 melee per level for blade units
- Tougher Light Armor: +1 defense per level for light armor units
- Tougher Heavy Armor: +1 defense per level for heavy armor units
- Improve Bow Range: +50% range per level for bow units
- Orc Racial Tech: Cloacking – increases ShadowWarrior hiding by +15% (see Damage Reductions)
- Fortification (Tree2 level 8): when defending a castle, reduces attacker damage by 5% (applied in damage step on the defender side only and only if the target is the current “battle defender”)

Non-combat population tech (referenced by UI/summary):
- Habitation: Houses hold 115 peasants instead of 100
- Barrack: Guard Houses hold 65 soldiers instead of 40

## 4) Effective Stats Pipeline (getEffectiveUnitStats)

Called per unit with context: unitName, race, techLevels, strategy, isAttacker, ksDifferenceFactor, enemyStrategy, ownArmy, enemyArmy.

Order of application (high-level):
1) Start from `UNIT_DATA` base stats.
2) Technologies modify flat or % values as listed above.
3) Strategy modifies stats:
   - Human Charging!: Knights melee ×1.5 (and optionally ×knights_damage_multiplier if present)
   - Anti-Cavalry: if NOT a pikeman, all attacks ×0.9
   - Archer Protection: infantry attacks ×0.5
   - Dwarf Shield Line: all units’ melee/short ×(1 − 0.10); Shieldbearers additionally ×(1 + 1.0)
   - Orc Surrounding: ShadowWarrior: short += melee + range; melee = 0
   - Elf Energy Gathering (Mage): melee ×2; range += 4 (defense +2 is applied only at damage time during melee/short)
   - Quick Retreat: all attacks ×0.5 (note: damage code applies ×0.5 again; net 0.25)
   - Orc Berserker: +3 flat to melee/short/range; defense ÷2
   - Infantry Attack: infantry defense ×0.25 (redistribution handled later during damage)
4) Special per-race interactions for display:
   - Orc Rusher/Slother: UI displays extra short + WolfMasterCount / UnitCount
5) Clamp all stats to ≥ 0.
6) Range modifier flag for UI: if either side has Gnome Far Fighting, show +100% range indicator (actual doubling is applied during damage aggregation, not here).

Note on Orc Surrounding + ShadowWarrior short damage:
- Effective stats already move melee+range into short (melee set to 0). During short phase, the damage loop adds `+ attackerStats.melee + attackerStats.range` again for ShadowWarriors. Since `melee` is 0 but `range` is non-zero, this double-counts range in short phase for ShadowWarriors under Orc Surrounding.

## 5) Battle Simulation Overview

High-level flow (see `utils/simulateBattle.ts` and `utils/simulateRound.ts`):
1) Pre-battle scaling on defender: Castle-based unit count penalty applied to the defending army only:
   - 1 castle: ×1.0; 2–9: ×0.8; 10–19: ×0.75; 20+: ×0.7
2) Single round with three phases: range → short → melee.
3) In each phase, both sides attack and both sides defend using snapshots of the armies at phase start.
4) Losses are applied after each side’s phase damage, then proceed to next phase.
5) Winner determination after all phases complete:
   - If one army is completely destroyed (100% casualties), the other wins
   - If both armies have units remaining, winner is determined by casualty percentage (lower percentage wins)
   - If casualty percentages are equal, winner is determined by remaining unit count (more units wins)
   - If both armies have equal casualty percentages and equal remaining units, it's a draw
6) End of battle: apply post-battle healing from Medical Centers (see Healing).

## 6) Phase Damage Calculation (calculatePhaseDamage)

Global constants and pools:
- GLOBAL_DAMAGE_SCALING_FACTOR = 1.0 (full damage for single-round battles)
- Damage is computed for the attacker and then allocated to defender stacks by weighted shares and mitigations.

Step-by-step for a single attacker→defender calculation:
1) Raw damage aggregation (per attacker unit):
   - Choose per-phase attack value: range, short, or melee from effective stats.
   - Short phase special: if Orc Surrounding and ShadowWarrior, add `attackerStats.melee + attackerStats.range` on top of `attackerStats.short`.
   - Melee phase special: if Orc Surrounding and ShadowWarrior, melee attack is 0.
   - Apply Quick Retreat attack reduction ×0.5 (note: a previous ×0.5 applied during effective stats).
   - Sum `count × attackValue` into `preScaledTotalDamage` and `totalDamage`.
   - Track a separate `pikemenDamage` sub-pool for pikeman attackers (same scaling rules).
2) Gnome Far Fighting (if active and phase=range):
   - Double: totalDamage, pikemenDamage, preScaledTotalDamage, preScaledPikemenDamage.
3) Save pre-scaled totals (for UI) and scale final totals:
   - totalDamage ×= 1.0; pikemenDamage ×= 1.0 (full damage for single-round battles)
4) Fortification (defender tech, only for the true battle defender):
   - Multiply damage by 0.95 (−5%) when defending.

Defender-side mitigation pool (buildings-based, per phase):
- Range phase (defender is battle defender): Guard Towers: total mitigation = min(towers × 40, totalDefenders × 2)
- Melee phase: Medical Center: total mitigation = min(centers × (75 if defending else 50), totalDefenders × (2 if defending else 1))
- The UI also computes and reports a “maximum possible mitigation pool” using the same caps for display.

Damage allocation across defender stacks (handleInfantryAttack):
1) Compute weighted totals per unit using `UNIT_WEIGHTS[race][unit]` (default weight 1) and share ratio = unitWeighted / sumWeighted.
2) Allocate raw damage to each defender stack: `rawShare = totalDamage × shareRatio`.
3) Pikemen vs Mounted bonus on the allocated share:
   - If target stack is mounted and pikemenDamage > 0: `damageFromPikes = rawShare × (pikemenDamage / totalDamage)`.
   - Base multiplier: ×2 vs mounted.
   - If attacker used Anti-Cavalry: multiply the extra bonus by 3.5 (i.e., total roughly behaves like ×(2 + extra), implemented as adding `(bonusMultiplier - 1) × damageFromPikes` to the stack’s raw share with `bonusMultiplier` starting at 2 and then ×3.5).
4) Mitigation allocation to each stack: proportional to defender unit count share: `stackMitigation = totalMitigation × (unitCount / totalDefenders)`.
5) Apply special per-target reductions (applySpecialReductions):
   - Archer Protection: if target is an archer and infantry exist, reduction = min(1.0, 0.5 × infantryCount / archerCount).
   - Dwarf Shield Line (range phase): reduction = min(1.0, 2 × (Shieldbearers / totalArmy)).
   - Mage immunity: if target is Mage and phase is melee/short and defender strategy is NOT Elf Energy Gathering => reduction = 1.0 (fully immune).
   - Skeleton Swarm: if target is skeletal unit and phase is range => reduction = 1.0 (fully immune).
   - ShadowWarrior hiding (melee/short): base hiding 25% ⇒ damageReduction = 75%;
     - Orc Surrounding: sets hiding to 100% (message text says “-25% hiding (0% total)”).
     - Cloacking tech: +15% hiding (further reduces damage).
6) Unit effective defense:
   - Base effective defense comes from effective stats and then:
     - Elf Energy Gathering: if target is Mage and phase is melee/short, +2 defense.
     - Infantry Attack redistribution: infantry targets keep ×0.25 defense; non-infantry get a flat defense bonus equal to total lost infantry defense divided by total non-infantry count (recomputed for each defender stack).
     - Dwarf Shield Line redistribution: shieldbearer targets keep ×0.50 defense; non-shieldbearers get a flat defense bonus equal to total lost shieldbearer defense divided by total non-shieldbearer count (recomputed for each defender stack).
7) Final per-stack damage: `max(0, rawShareAdjusted − stackMitigation) × (1 − reduction)`.
8) Losses: `floor(finalDamageToStack / unitEffectiveDefense)`, clamped to the current stack size.

Per-unit logs (`DamageLog`) capture raw, mitigated, final damage, units lost, effects, and breakdowns.

## 7) Unit Weights for Damage Allocation (UNIT_WEIGHTS)

Used to split incoming damage across defender stacks before mitigation:
- Dwarf: Shieldbearer 3; HammerWheilder 2; AxeMan 2; Runner 1; LightCrossbowman 2; HeavyCrossbowman 1
- Elf: Mage 1; Swordman 3; Lanceman 3; Caragous 2; Archer 3; EliteArcher 1.5
- Gnome: Catapult 1; Infantry 2; Militia 2.5; Rider 2; RockThrower 2.5; Balista 1
- Human: Knight 1; Infantry 3; Pikeman 3; HeavyInfantry 2.5; Archer 2; MountedArchers 1
- Orc: ShadowWarrior 1; Rusher 3; Slother 3; WolfMaster 2; Slinger 2.5; AxeThrower 1.5
- Undead: DarkKnight 1; SkeletonWarrior 1.5; WraithPikeman 2; Abomination 2; PhantomArcher 2; WraithRider 1

If a unit is missing in the map, weight = 1.

## 8) Buildings Affecting Combat

Defined in `data/buildingData.ts`.
- Guard Towers: range-phase mitigation pool = min(40 × towers, 2 × totalDefenders). Active only when the side is the “battle defender”.
- Medical Center: melee-phase mitigation = min(centers × (75 when defending, else 50), totalDefenders × (2 when defending, else 1)). Also provides post-battle healing (below).
- Castle: drives pre-battle defender army scaling (counts only); scaling multipliers listed in Section 5.
- Training Center / Advanced Training Center: unit production only (not used in battle math).

## 9) Healing (Post-Battle)

At battle end, each side heals a portion of losses based on Medical Centers vs Land:
- If centers / land ≥ 1: heal 20% of losses (rounded down per-unit type)
- If centers / land ≥ 0.5: heal 10%
- Otherwise: 0%
Healing is computed relative to the pre-battle scaled armies (defender scaling persists), and applied to the final army counts.

## 10) Economy and Costs

Market prices (`data/marketPrices.ts`): wood=80, iron=100, food=60 (gold-equivalent values).

Unit cost and efficiency (`utils/economicHelpers.ts`):
- Total Initial Gold Cost per unit: base_gold_cost + equipment_iron_cost + equipment_wood_cost + equipment_gold_cost (note: equipment iron/wood are summed as-is, not converted via market prices in this function)
- TEGC per unit (48h): initial + (upkeep.gold × 2) + (upkeep.food × 2 × MARKET_PRICES.food)
- Army totals: sum per-unit × count
- Efficiency (UI): gold per melee/defense/range = TEGC ÷ stat (null if stat = 0)

## 11) Kingdom Strength (KS)

Computed in UI (`app/page.tsx`) as a simple heuristic:
- Units: +2.5 KS per unit
- Buildings: +3 KS per building (except Castle)
- Castle: +1500 KS each
- Technologies: +1000 KS per level (boolean true counts as 1 level)
- Population: no direct bonus currently

KS is displayed/propagated in the UI; it does not directly change battle damage (the “KS difference factor” exists in signatures but is currently deactivated).

## 12) Round/Phase Logging and UI Notes

- Each round logs both armies at phase start, losses, and a `DamageLog[]` per side.
- Effects list includes buildings, strategies, Quick Retreat notes, Fortification, and Gnome Far Fighting.
- Battle report additionally shows:
  - Castle defender scaling summary
     - Global damage reduction note: all damage ×1.0 (full damage)
  - Unit-by-unit summaries with effective stats and losses

## 13) Edge Cases and Implementation Details (Important)

- Quick Retreat attack reduction is applied twice (effective stats and raw damage aggregation). Net −75% attack.
- Orc Surrounding + ShadowWarrior short damage double-counts range (effective stats fold range into short; short-phase loop adds range again).
- Dwarf Shield Line ranged reduction is computed as 2 × Shieldbearer ratio, capped at 100% (implemented in two places in reductions; effective result equals that formula).
- Pikemen vs mounted: bonus is applied only to the portion of damage attributable to pikemen within the target’s raw share.
- Fortification −5% applies only when the side is truly defending the battle (as flagged by the simulation), regardless of who is attacking within a single phase calculation.

## 14) Type Glossary (subset)

- Army: `Record<string, number>` mapping unitName → count
- PhaseType: 'range' | 'short' | 'melee'
- TechLevels: `Record<string, number>` (presence/level per tech)
- StrategyName: union of strategy strings (see `types/index.ts`)
- Buildings: `Record<string, number>`

## 15) Full Battle Step Summary (Checklist)

For each simulation:
1) Scale defender army by Castle count (Section 5).
2) For round in 1..maxRounds:
   - Check retreat thresholds and Quick Retreat special win (Section 5).
   - For each phase in [range, short, melee]:
     a) Compute attacker→defender damage using Section 6.
     b) Apply losses for that phase to each side.
3) If no decisive end, determine outcome by remaining units or draw rules.
4) Apply post-battle healing (Section 9).
5) Return winner, final armies, healing, and detailed logs.

## 16) Data Sources and Files

- Units: `data/unitData.ts`
- Strategies: `data/strategyData.ts`
- Technologies: `data/technologyData.ts` (trees include Fortification, Habitation, Barrack, etc.)
- Buildings: `data/buildingData.ts`
- Battle math: `utils/getEffectiveUnitStats.ts`, `utils/calculatePhaseDamage.ts`, `utils/simulateRound.ts`, `utils/simulateBattle.ts`
- Economy: `utils/economicHelpers.ts`, `data/marketPrices.ts`

This document mirrors the current code behavior, including quirks and double-applications noted in Section 13. If the game rules change, update this file alongside the implementation.