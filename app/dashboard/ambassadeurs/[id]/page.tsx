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
  statut: string;
  created_at: string;
};

type Filleul = {
  id: string;
  filleul_nom: string;
  filleul_prenom: string;
  formation: string;
  statut: string;
};

type Commission = {
  id: string;
  montant: number;
  type_commission: string;
  statut: string;
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
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const id = params.id as string;

      const [{ data: amb }, { data: fill }, { data: comm }] = await Promise.all([
        supabase.from("ambassadeurs").select("*").eq("id", id).single(),
        supabase.from("filleuls").select("*").eq("ambassadeur_id", id).order("created_at", { ascending: false }),
        supabase.from("commissions").select("*").eq("ambassadeur_id", id).order("created_at", { ascending: false }),
      ]);

      setAmbassadeur(amb);
      setForm(amb ?? {});
      setFilleuls(fill ?? []);
      setCommissions(comm ?? []);
      setLoading(false);
    };
    fetch();
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

  const totalCommissions = commissions.reduce((s, c) => s + c.montant, 0);
  const commissionsPayees = commissions.filter((c) => c.statut === "payee").reduce((s, c) => s + c.montant, 0);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard/ambassadeurs")} className="hover:text-sbbs-gold transition">
            ← Retour
          </button>
          <h1 className="font-bold text-lg">Fiche Ambassadeur</h1>
        </div>
        <button
          onClick={() => { setEditMode(!editMode); setSaveMsg(""); }}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
            editMode
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-sbbs-gold text-white hover:bg-yellow-500"
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

        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-sbbs-blue rounded-full w-14 h-14 flex items-center justify-center">
              <span className="text-sbbs-gold text-xl font-bold">
                {ambassadeur.prenom?.[0]}{ambassadeur.nom?.[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-sbbs-blue">
                {ambassadeur.prenom} {ambassadeur.nom}
              </h2>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                ambassadeur.statut === "actif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {ambassadeur.statut}
              </span>
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
                  <input
                    type="text"
                    name={field.name}
                    value={form[field.name as keyof typeof form] as string ?? ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                <select
                  name="statut"
                  value={form.statut ?? "actif"}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
                >
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

        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center border-l-4 border-sbbs-blue">
            <p className="text-2xl font-bold text-sbbs-blue">{filleuls.length}</p>
            <p className="text-sm text-gray-500">Filleuls</p>
          </div>
          <div className="card text-center border-l-4 border-sbbs-gold">
            <p className="text-2xl font-bold text-sbbs-gold">{totalCommissions.toLocaleString()}</p>
            <p className="text-sm text-gray-500">FCFA total</p>
          </div>
          <div className="card text-center border-l-4 border-green-500">
            <p className="text-2xl font-bold text-green-600">{commissionsPayees.toLocaleString()}</p>
            <p className="text-sm text-gray-500">FCFA payés</p>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-sbbs-blue mb-3">Filleuls ({filleuls.length})</h3>
          {filleuls.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucun filleul enregistré.</p>
          ) : (
            <div className="space-y-2">
              {filleuls.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm">
                  <span className="font-medium">{f.filleul_prenom} {f.filleul_nom}</span>
                  <span className="text-gray-500">{f.formation}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    f.statut === "confirme" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>{f.statut}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-sbbs-blue mb-3">Commissions ({commissions.length})</h3>
          {commissions.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune commission enregistrée.</p>
          ) : (
            <div className="space-y-2">
              {commissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 text-sm">
                  <span className="font-medium">{c.type_commission}</span>
                  <span className="font-bold text-sbbs-blue">{c.montant.toLocaleString()} FCFA</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    c.statut === "payee" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>{c.statut === "payee" ? "Payée" : "En attente"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
