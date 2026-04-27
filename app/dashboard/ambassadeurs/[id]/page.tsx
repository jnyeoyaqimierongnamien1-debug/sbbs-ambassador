"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";

type Ambassadeur = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  zone: string;
  branche: string;
  niveau: string;
  statut: string;
  created_at: string;
};

type Filleul = {
  id: string;
  nom: string;
  prenom: string;
  formation: string;
  statut: string;
};

type Commission = {
  id: string;
  montant_commission: number;
  statut_paiement: string;
};

export default function AmbassadeurDetailPage() {
  const [ambassadeur, setAmbassadeur] = useState<Ambassadeur | null>(null);
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Ambassadeur>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const id = params.id as string;

      const [{ data: amb }, { data: fill }, { data: comm }] = await Promise.all([
        supabase.from("ambassadeurs").select("*").eq("id", id).single(),
        supabase.from("filleuls").select("id, nom, prenom, formation, statut").eq("ambassadeur_id", id).order("created_at", { ascending: false }),
        supabase.from("commissions").select("id, montant_commission, statut_paiement").eq("ambassadeur_id", id).order("created_at", { ascending: false }),
      ]);

      setAmbassadeur(amb);
      setForm(amb ?? {});
      setFilleuls(fill ?? []);
      setCommissions(comm ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase
      .from("ambassadeurs")
      .update({
        nom: form.nom,
        prenom: form.prenom,
        telephone: form.telephone,
        email: form.email,
        zone: form.zone,
        branche: form.branche,
        niveau: form.niveau,
        statut: form.statut,
      })
      .eq("id", ambassadeur!.id);

    if (error) {
      setSaveMsg("Erreur : " + error.message);
    } else {
      setAmbassadeur({ ...ambassadeur!, ...form } as Ambassadeur);
      setSaveMsg("✅ Modifications enregistrées !");
      setEditMode(false);
    }
    setSaving(false);
  };

  const totalCommissions = commissions.reduce((s, c) => s + (Number(c.montant_commission) || 0), 0);
  const commissionsPayees = commissions.filter((c) => c.statut_paiement === "Payé").reduce((s, c) => s + (Number(c.montant_commission) || 0), 0);
  const filleulsConfirmes = filleuls.filter((f) => f.statut === "Confirmé").length;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue animate-pulse font-semibold">Chargement...</p>
    </div>
  );

  if (!ambassadeur) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-red font-semibold">Ambassadeur introuvable.</p>
    </div>
  );

  const niveauIcon: Record<string, string> = {
    "Débutant": "🌱", "Bronze": "🥉", "Argent": "🥈", "Or": "🥇", "Platine": "💎"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/ambassadeurs")} className="hover:text-sbbs-gold transition">
            ← Retour
          </button>
          <div className="flex items-center gap-2">
            <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full object-cover border-2 border-sbbs-gold" />
            <h1 className="font-bold text-lg">Fiche Ambassadeur</h1>
          </div>
        </div>
        <button
          onClick={() => { setEditMode(!editMode); setSaveMsg(""); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
            editMode ? "bg-gray-200 text-gray-700" : "bg-sbbs-gold text-white hover:bg-yellow-500"
          }`}
        >
          {editMode ? "Annuler" : "✏️ Modifier"}
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {saveMsg && (
          <div className={`p-3 rounded-lg text-sm text-center font-medium ${
            saveMsg.includes("✅") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {saveMsg}
          </div>
        )}

        {/* Infos */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-sbbs-blue rounded-full w-14 h-14 flex items-center justify-center flex-shrink-0">
              <span className="text-sbbs-gold text-xl font-bold">
                {ambassadeur.prenom?.[0]}{ambassadeur.nom?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-sbbs-blue">{ambassadeur.prenom} {ambassadeur.nom}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  ambassadeur.statut === "actif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>{ambassadeur.statut}</span>
                {ambassadeur.niveau && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                    {niveauIcon[ambassadeur.niveau] || "🌱"} {ambassadeur.niveau}
                  </span>
                )}
              </div>
            </div>
          </div>

          {editMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Prénom", name: "prenom" },
                { label: "Nom", name: "nom" },
                { label: "Téléphone", name: "telephone" },
                { label: "Email", name: "email" },
                { label: "Zone / Ville", name: "zone" },
                { label: "Branche SBBS", name: "branche" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
                  <input type="text" name={field.name}
                    value={form[field.name as keyof typeof form] as string ?? ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Niveau</label>
                <select name="niveau" value={form.niveau ?? "Débutant"} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue">
                  <option value="Débutant">🌱 Débutant</option>
                  <option value="Bronze">🥉 Bronze</option>
                  <option value="Argent">🥈 Argent</option>
                  <option value="Or">🥇 Or</option>
                  <option value="Platine">💎 Platine</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                <select name="statut" value={form.statut ?? "actif"} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue">
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                  {saving ? "Sauvegarde..." : "💾 Sauvegarder les modifications"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Téléphone</span><p className="font-medium">{ambassadeur.telephone || "—"}</p></div>
              <div><span className="text-gray-500">Email</span><p className="font-medium">{ambassadeur.email || "—"}</p></div>
              <div><span className="text-gray-500">Zone / Ville</span><p className="font-medium">{ambassadeur.zone || "—"}</p></div>
              <div><span className="text-gray-500">Branche</span><p className="font-medium">{ambassadeur.branche || "—"}</p></div>
              <div><span className="text-gray-500">Membre depuis</span><p className="font-medium">{new Date(ambassadeur.created_at).toLocaleDateString("fr-FR")}</p></div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center border-l-4 border-sbbs-blue">
            <p className="text-2xl font-bold text-sbbs-blue">{filleuls.length}</p>
            <p className="text-xs text-gray-500">Filleuls total</p>
          </div>
          <div className="card text-center border-l-4 border-green-500">
            <p className="text-2xl font-bold text-green-600">{filleulsConfirmes}</p>
            <p className="text-xs text-gray-500">Confirmés</p>
          </div>
          <div className="card text-center border-l-4 border-sbbs-gold">
            <p className="text-xl font-bold text-sbbs-gold">{totalCommissions.toLocaleString()}</p>
            <p className="text-xs text-gray-500">FCFA total</p>
          </div>
        </div>

        {/* Filleuls */}
        <div className="card">
          <h3 className="font-bold text-sbbs-blue mb-3">Filleuls ({filleuls.length})</h3>
          {filleuls.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun filleul enregistré.</p>
          ) : (
            <div className="space-y-2">
              {filleuls.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm">
                  <span className="font-medium">{f.prenom} {f.nom}</span>
                  <span className="text-gray-500 text-xs">{f.formation}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    f.statut === "Confirmé" ? "bg-green-100 text-green-700" :
                    f.statut === "En attente" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>{f.statut}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commissions */}
        <div className="card">
          <h3 className="font-bold text-sbbs-blue mb-3">Commissions ({commissions.length})</h3>
          {commissions.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune commission enregistrée.</p>
          ) : (
            <div className="space-y-2">
              {commissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm">
                  <span className="font-bold text-sbbs-blue">{(Number(c.montant_commission) || 0).toLocaleString()} FCFA</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    c.statut_paiement === "Payé" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>{c.statut_paiement}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between text-sm font-bold">
                <span>Total payé</span>
                <span className="text-green-600">{commissionsPayees.toLocaleString()} FCFA</span>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
