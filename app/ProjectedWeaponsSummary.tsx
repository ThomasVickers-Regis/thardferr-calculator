import React from 'react';

interface ProjectedWeaponsSummaryProps {
  race: string;
  blacksmithingEfficiency: number;
  population: Record<string, number>;
  buildings: Record<string, number>;
  techLevels?: Record<string, number>;
}

const WEAPON_DATA_BY_RACE: Record<string, Array<{ name: string; iron: number; wood: number; gold: number }>> = {
  Elf: [
    { name: 'Horse', iron: 1, wood: 0, gold: 300 },
    { name: 'Sword', iron: 4, wood: 1, gold: 25 },
    { name: 'Lance', iron: 1, wood: 3, gold: 20 },
    { name: 'Bow', iron: 0, wood: 4, gold: 40 },
    { name: 'Caragous Armor', iron: 7, wood: 1, gold: 200 },
    { name: 'Light Armor', iron: 4, wood: 0, gold: 100 },
  ],
  Dwarf: [
    { name: 'Poney', iron: 0, wood: 0, gold: 150 },
    { name: 'Axe', iron: 2, wood: 1, gold: 15 },
    { name: 'Hammer', iron: 2, wood: 1, gold: 10 },
    { name: 'Crossbow', iron: 0, wood: 3, gold: 30 },
    { name: 'Plate Armor', iron: 6, wood: 0, gold: 175 },
    { name: 'Chainmail', iron: 3, wood: 0, gold: 125 },
  ],
  Gnome: [
    { name: 'Poney', iron: 1, wood: 0, gold: 250 },
    { name: 'Plank and Nails', iron: 1, wood: 15, gold: 70 },
    { name: 'Spear', iron: 2, wood: 3, gold: 10 },
    { name: 'Sling', iron: 1, wood: 1, gold: 15 },
    { name: 'Chainmail', iron: 6, wood: 0, gold: 175 },
    { name: 'Leather Armor', iron: 2, wood: 1, gold: 125 },
  ],
  Human: [
    { name: 'Horse', iron: 1, wood: 0, gold: 350 },
    { name: 'Sword', iron: 3, wood: 0, gold: 15 },
    { name: 'Spear', iron: 2, wood: 3, gold: 5 },
    { name: 'Bow', iron: 0, wood: 3, gold: 10 },
    { name: 'Plate Armor', iron: 7, wood: 0, gold: 200 },
    { name: 'Light Armor', iron: 3, wood: 0, gold: 125 },
  ],
  Orc: [
    { name: 'Wolf', iron: 0, wood: 0, gold: 50 },
    { name: 'Axe', iron: 2, wood: 1, gold: 20 },
    { name: 'Spear', iron: 1, wood: 3, gold: 10 },
    { name: 'Sling', iron: 1, wood: 1, gold: 5 },
    { name: 'Enforced Leather Armor', iron: 2, wood: 1, gold: 125 },
    { name: 'Leather Armor', iron: 1, wood: 1, gold: 100 },
  ],
};

const ProjectedWeaponsSummary: React.FC<ProjectedWeaponsSummaryProps> = ({ race, blacksmithingEfficiency, population, buildings, techLevels = {} }) => {
  const weapons = WEAPON_DATA_BY_RACE[race] || [];
  const forges = typeof buildings['Forge'] === 'number' ? buildings['Forge'] : parseInt(buildings['Forge'] || '0', 10) || 0;
  const assigned = population['Blacksmithing'] || 0;
  const perForge = forges > 0 ? assigned / forges : 0;
  let outputPerForge = 0;
  if (perForge <= 80) {
    outputPerForge = (perForge / 80) * 1.5;
  } else if (perForge >= 160) {
    outputPerForge = 3;
  } else {
    const t = (perForge - 80) / (160 - 80);
    outputPerForge = (1 - t) * 1.5 + t * 3;
  }
  let totalProduced = forges > 0 ? Math.floor(forges * outputPerForge) : 0;
  
  // Apply technology bonuses
      const hasAnimalTraining = (techLevels['Animal training'] || 0) > 0;
    const hasBlacksmithing = (techLevels['Blacksmithing'] || 0) > 0;
  
  // Animal Training boosts horse/animal weapons by 20%
  const animalWeapons = ['Horse', 'Poney', 'Wolf'];
  const animalWeaponBonus = hasAnimalTraining ? 1.2 : 1;
  
  // Blacksmithing boosts blade weapons by 20%
  const bladeWeapons = ['Sword', 'Axe', 'Hammer', 'Lance', 'Spear'];
  const bladeWeaponBonus = hasBlacksmithing ? 1.2 : 1;
  
  const summary = weapons.map(w => {
    let weaponCount = totalProduced;
    if (animalWeapons.includes(w.name)) {
      weaponCount = Math.floor(totalProduced * animalWeaponBonus);
    } else if (bladeWeapons.includes(w.name)) {
      weaponCount = Math.floor(totalProduced * bladeWeaponBonus);
    }
    return `${weaponCount} ${w.name}`;
  }).join(', ');
  return (
    <div className="p-4 bg-gray-800 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Armory Production</h3>
      <p className="text-sm text-purple-300 mb-2">
        If your blacksmiths go to work right away, they will be able to build: {summary} per day.
      </p>
    </div>
  );
};

export default ProjectedWeaponsSummary; 