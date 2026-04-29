// Calcul automatique des commissions selon branche et type de parrainage

export type TypeParrainage = "À chaud" | "Assisté";

export type BrancheCommission = {
  branche: string;
  frais: number;
  taux_assiste: number; // pourcentage
  commission_chaud: number; // montant fixe ou calculé
};

export const BRANCHES_COMMISSION: BrancheCommission[] = [
  {
    branche: "SBBS Certification",
    frais: 60000,
    taux_assiste: 20,
    commission_chaud: 30000,
  },
  {
    branche: "Communauté d'Havila des Leaders d'Affaires (CHLA)",
    frais: 100000,
    taux_assiste: 10,
    commission_chaud: 10000, // 10% aussi
  },
  {
    branche: "SBBS Éditions",
    frais: 10000,
    taux_assiste: 10,
    commission_chaud: 1000, // 10% aussi
  },
  {
    branche: "SBBS Consulting",
    frais: 600000,
    taux_assiste: 10,
    commission_chaud: 60000, // 10% aussi
  },
];

export const BRANCHES_SANS_REGLE = [
  "SBBS International Language Institute",
  "SBBS Investment",
  "SBBS Kids",
  "Institut de Recherches Appliquées en Affaires",
  "Académie des Affaires",
  "SBBS Technologies",
];

export function calculerCommission(
  branche: string,
  typeParrainage: TypeParrainage,
  montantCustom?: number
): number {
  const regle = BRANCHES_COMMISSION.find(b => b.branche === branche);

  if (!regle) {
    // Branche sans règle définie — utiliser montant custom ou 0
    return montantCustom || 0;
  }

  if (typeParrainage === "À chaud") {
    return regle.commission_chaud;
  } else {
    // Assisté — calcul pourcentage
    return Math.round((regle.frais * regle.taux_assiste) / 100);
  }
}

export function getMontantFrais(branche: string): number {
  const regle = BRANCHES_COMMISSION.find(b => b.branche === branche);
  return regle?.frais || 0;
}

export function getInfoCommission(branche: string): string {
  const regle = BRANCHES_COMMISSION.find(b => b.branche === branche);
  if (!regle) return "Commission à définir";
  return `À chaud: ${regle.commission_chaud.toLocaleString()} FCFA | Assisté: ${regle.taux_assiste}% = ${Math.round(regle.frais * regle.taux_assiste / 100).toLocaleString()} FCFA`;
}
