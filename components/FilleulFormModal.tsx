"use client";

import { useState } from "react";
import { calculerCommission, getMontantFrais, getInfoCommission, BRANCHES_COMMISSION, BRANCHES_SANS_REGLE, TypeParrainage } from "@/lib/commission-utils";

const TOUTES_BRANCHES = [
  ...BRANCHES_COMMISSION.map(b => b.branche),
  ...BRANCHES_SANS_REGLE,
];

const STATUTS = ["En attente", "Inscrit", "Payé", "Annulé"];

type FilleulForm = {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  formation: string;
  branche_filleul: string;
  type_parrainage: TypeParrainage;
  montant: string;
  statut: string;
  date_inscription: string;
};

type AmbassadeurOption = { id: string; nom: string; prenom: string; };

type Props = {
  initial?: Partial<FilleulForm>;
  onSave: (data: FilleulForm & { ambassadeur_id?: string }) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
  ambassadeurs?: AmbassadeurOption[];
  defaultAmbassadeurId?: string;
};

export default function FilleulFormModal({ initial, onSave, onCancel, isEditing, ambassadeurs, defaultAmbassadeurId }: Props) {
  const [form, setForm] = useState<FilleulForm>({
    nom: initial?.nom || "",
    prenom: initial?.prenom || "",
    telephone: initial?.telephone || "",
    email: initial?.email || "",
    formation: initial?.formation || "",
    branche_filleul: initial?.branche_filleul || "",
    type_parrainage: initial?.type_parrainage || "Assisté",
    montant: initial?.montant || "",
    statut: initial?.statut || "En attente",
    date_inscription: initial?.date_inscription || new Date().toISOString().split("T")[0],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedAmbId, setSelectedAmbId] = useState<string>(defaultAmbassadeurId || "");

  const set = (key: keyof FilleulForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setForm(prev => {
        const updated = { ...prev, [key]: val };

        // Recalcul automatique commission si branche ou type change
        if (key === "branche_filleul" || key === "type_parrainage") {
          const branche = key === "branche_filleul" ? val : prev.branche_filleul;
          const type = key === "type_parrainage" ? val as TypeParrainage : prev.type_parrainage;
          const commission = calculerCommission(branche, type);
          if (commission > 0) {
            updated.montant = String(commission);
          }
          // Aussi mettre à jour le montant frais d'inscription
          if (key === "branche_filleul") {
            const frais = getMontantFrais(val);
            if (frais > 0 && !updated.formation) {
              updated.formation = val;
            }
          }
        }

        return updated;
      });
    };

 const handleSave = async () => {
    if (!form.nom.trim() || !form.telephone.trim()) {
      setError("Le nom et le téléphone sont obligatoires.");
      return;
    }
    if (ambassadeurs && ambassadeurs.length > 0 && !selectedAmbId) {
      setError("Veuillez sélectionner un ambassadeur.");
      return;
    }
    setSaving(true);
    await onSave({ ...form, ambassadeur_id: selectedAmbId || undefined });
    setSaving(false);
  };

  const infoCommission = form.branche_filleul ? getInfoCommission(form.branche_filleul) : null;
  const fraisInscription = getMontantFrais(form.branche_filleul);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
       <h3 className="font-bold text-sbbs-blue text-lg mb-5">
          {isEditing ? "✏️ Modifier le filleul" : "➕ Ajouter un filleul"}
        </h3>

        <div className="space-y-3">

          {/* Sélecteur ambassadeur (mode directeur uniquement) */}
          {ambassadeurs && ambassadeurs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ambassadeur parrain *</label>
              <select value={selectedAmbId} onChange={e => setSelectedAmbId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue bg-white">
                <option value="">— Sélectionner un ambassadeur —</option>
                {ambassadeurs.map(a => (
                  <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Infos filleul */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" value={form.nom} onChange={set("nom")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" value={form.prenom} onChange={set("prenom")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
            <input type="tel" value={form.telephone} onChange={set("telephone")}
              placeholder="+225 07 00 00 00 00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={set("email")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
          </div>

          <hr className="border-gray-100" />

          {/* Branche et type parrainage */}
          <p className="text-xs font-bold text-sbbs-blue uppercase tracking-wide">Parrainage</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branche concernée</label>
            <select value={form.branche_filleul} onChange={set("branche_filleul")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue bg-white">
              <option value="">— Sélectionner la branche —</option>
              {TOUTES_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Info commission */}
          {infoCommission && (
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-sbbs-blue">
              💰 <strong>Règle de commission :</strong><br />
              {infoCommission}
              {fraisInscription > 0 && (
                <span className="block mt-1">📋 Frais d'inscription : <strong>{fraisInscription.toLocaleString()} FCFA</strong></span>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de parrainage</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const commission = calculerCommission(form.branche_filleul, "À chaud");
                  setForm(prev => ({
                    ...prev,
                    type_parrainage: "À chaud",
                    montant: commission > 0 ? String(commission) : prev.montant,
                  }));
                }}
                className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition ${
                  form.type_parrainage === "À chaud"
                    ? "border-sbbs-gold bg-yellow-50 text-yellow-700"
                    : "border-gray-200 text-gray-500 hover:border-sbbs-gold"
                }`}
              >
                🔥 À chaud
                {form.branche_filleul && (
                  <span className="block text-xs mt-0.5 font-bold">
                    {calculerCommission(form.branche_filleul, "À chaud").toLocaleString()} FCFA
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  const commission = calculerCommission(form.branche_filleul, "Assisté");
                  setForm(prev => ({
                    ...prev,
                    type_parrainage: "Assisté",
                    montant: commission > 0 ? String(commission) : prev.montant,
                  }));
                }}
                className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition ${
                  form.type_parrainage === "Assisté"
                    ? "border-sbbs-blue bg-blue-50 text-sbbs-blue"
                    : "border-gray-200 text-gray-500 hover:border-sbbs-blue"
                }`}
              >
                🤝 Assisté
                {form.branche_filleul && (
                  <span className="block text-xs mt-0.5 font-bold">
                    {calculerCommission(form.branche_filleul, "Assisté").toLocaleString()} FCFA
                  </span>
                )}
              </button>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Formation et montant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formation</label>
            <input type="text" value={form.formation} onChange={set("formation")}
              placeholder="Ex: SBBS Certification Niveau 1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commission (FCFA)
              {form.branche_filleul && <span className="text-xs text-green-600 ml-1">— calculée automatiquement</span>}
            </label>
            <input type="number" value={form.montant} onChange={set("montant")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'inscription</label>
            <input type="date" value={form.date_inscription} onChange={set("date_inscription")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={form.statut} onChange={set("statut")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue">
              {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && <p className="text-sbbs-red text-sm font-medium">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onCancel}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 btn-primary text-sm py-2">
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
