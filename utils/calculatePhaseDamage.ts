import { getEffectiveUnitStats, TechLevels, StrategyName } from './getEffectiveUnitStats';
import { UNIT_DATA } from '../data/unitData';

export type Army = Record<string, number>; // { "Elf Archer": 10, ... }
export type PhaseType = 'range' | 'short' | 'melee';

/**
 * Calculates losses for the defending army in a given phase.
 * @param attackingArmy - Object of attacking units and their counts
 * @param defendingArmy - Object of defending units and their counts
 * @param phaseType - 'range', 'short', or 'melee'
 * @param techLevels - Tech levels for the attacker
 * @param activeStrategy - Active strategy for the attacker
 * @param ksDifferenceFactor - Multiplier/divisor for bottomfeeding
 * @returns Object of losses for the defending army: { UnitName: numLost }
 */
export function calculatePhaseDamage(
  attackingArmy: Army,
  defendingArmy: Army,
  phaseType: PhaseType,
  techLevels: TechLevels,
  activeStrategy: StrategyName | null,
  ksDifferenceFactor: number = 1,
  attackerBuildings: any = {},
  defenderBuildings: any = {},
  isAttacker: boolean = false,
  attackerRace: string = 'dwarf',
  defenderRace: string = 'dwarf'
): Record<string, number> {
  // Clone defendingArmy to track losses
  const losses: Record<string, number> = {};
  const defenderUnitNames = Object.keys(defendingArmy).filter(u => defendingArmy[u] > 0);
  if (defenderUnitNames.length === 0) return losses;

  // Track total damage reduction from buildings
  let buildingDamageReduction = 0;
  let perUnitCap = 0;
  const totalDefenders = defenderUnitNames.reduce((sum, u) => sum + defendingArmy[u], 0);
  if (phaseType === 'range' && defenderBuildings['Guard Towers']) {
    // Guard Towers: -40 per tower, max 2 per unit (max 80 per unit)
    const towers = defenderBuildings['Guard Towers'] || 0;
    perUnitCap = 80;
    buildingDamageReduction = Math.min(towers * 40, totalDefenders * perUnitCap);
  }
  if (phaseType === 'melee' && defenderBuildings['Medical Center']) {
    // Medical Center: -50 per center on attack (max 1 per unit), -75 per center on defense (max 2 per unit)
    const med = defenderBuildings['Medical Center'] || 0;
    if (isAttacker) {
      perUnitCap = 50;
      buildingDamageReduction = Math.min(med * 50, totalDefenders * perUnitCap);
    } else {
      perUnitCap = 150;
      buildingDamageReduction = Math.min(med * 75, totalDefenders * perUnitCap);
    }
  }

  // For each attacking unit type
  for (const [attackerName, attackerCount] of Object.entries(attackingArmy)) {
    if (attackerCount <= 0) continue;
          // Get effective stats for this attacker
      const attackerStats = getEffectiveUnitStats(attackerName, attackerRace, techLevels, activeStrategy, true, ksDifferenceFactor);
    // Determine attack value for this phase
    let attackValue = 0;
    if (phaseType === 'range') attackValue = attackerStats.range;
    else if (phaseType === 'short') attackValue = attackerStats.short;
    else if (phaseType === 'melee') attackValue = attackerStats.melee;
    if (attackValue <= 0) continue;

    // Each attacking unit attempts to "kill" a defending unit
    for (let i = 0; i < attackerCount; i++) {
      // Randomly select a defending unit (weighted by count)
      const totalDefenders = defenderUnitNames.reduce((sum, u) => sum + defendingArmy[u], 0);
      if (totalDefenders === 0) break;
      let rand = Math.floor(Math.random() * totalDefenders);
      let defenderName = defenderUnitNames[0];
      for (const name of defenderUnitNames) {
        if (rand < defendingArmy[name]) {
          defenderName = name;
          break;
        }
        rand -= defendingArmy[name];
      }
              // Get effective defense for this defender
        const defenderStats = getEffectiveUnitStats(defenderName, defenderRace, {}, null, false, ksDifferenceFactor); // Defenders' tech/strategy not applied here for simplicity
      const defenseValue = defenderStats.defense;
      // Probabilistic kill chance
      let killChance = 0.2;
      if (attackValue > defenseValue) killChance = 0.8;
      else if (attackValue === defenseValue) killChance = 0.5;
      // Roll for kill
      if (Math.random() < killChance) {
        // Register a loss
        losses[defenderName] = (losses[defenderName] || 0) + 1;
        defendingArmy[defenderName]--;
        if (defendingArmy[defenderName] <= 0) {
          // Remove from selection pool
          const idx = defenderUnitNames.indexOf(defenderName);
          if (idx !== -1) defenderUnitNames.splice(idx, 1);
        }
      }
    }
  }
  // Apply building-based damage reduction to total losses (as a flat reduction, distributed across units)
  if (buildingDamageReduction > 0) {
    // Distribute reduction across units proportionally
    let reductionLeft = buildingDamageReduction;
    const unitNames = Object.keys(losses);
    for (const unit of unitNames) {
      if (reductionLeft <= 0) break;
      const reduc = Math.min(losses[unit] || 0, Math.floor(reductionLeft / unitNames.length));
      losses[unit] = Math.max(0, (losses[unit] || 0) - reduc);
      reductionLeft -= reduc;
    }
  }
  return losses;
} 