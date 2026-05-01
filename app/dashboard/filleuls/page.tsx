"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Filleul = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  formation: string;
  statut: string;
  created_at: string;
  ambassadeur_id: string;
  ambassadeurs?: { nom: string; prenom: string };
};

type Ambassadeur = { id: string; nom: string; prenom: string };

export default function FilleulsPage() {
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [ambassadeurs, setAmbassadeurs] = useState<Ambassadeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ambassadeur_id: "",
    nom: "",
    prenom: "",
    telephone: "",
    formation: "",
    statut: "En attente",
  });
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: fill }, { data: amb }] = await Promise.all([
        supabase.from("filleuls").select("*, ambassadeurs(nom, prenom)").order("created_at", { ascending: false }),
        supabase.from("ambassadeurs").select("id, nom, prenom").order("nom"),
      ]);

      setFilleuls(fill ?? []);
      setAmbassadeurs(amb ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleSubmit = async () => {
  if (!form.ambassadeur_id || !form.nom || !form.prenom) {
    setError("Ambassadeur, prénom et nom sont obligatoires.");
    return;
  }
  setSaving(true);
  setError("");

  if (editId) {
    const { error } = await supabase.from("filleuls").update({
      nom: form.nom.trim().toUpperCase(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      formation: form.formation.trim(),
      statut: form.statut,
      ambassadeur_id: form.ambassadeur_id,
    }).eq("id", editId);
    if (error) { setError("Erreur : " + error.message); setSaving(false); return; }
    setEditId(null);
  } else {
    const { error } = await supabase.from("filleuls").insert({
      ambassadeur_id: form.ambassadeur_id,
      nom: form.nom.trim().toUpperCase(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      formation: form.formation.trim(),
      statut: form.statut,
    });
    if (error) { setError("Erreur : " + error.message); setSaving(false); return; }
  }

  // Recharger la liste
  const { data: updated, error: fetchError } = await supabase
    .from("filleuls")
    .select("*, ambassadeurs(nom, prenom)")
    .order("created_at", { ascending: false });

  if (!fetchError && updated && updated.length > 0) {
    setFilleuls(updated);
  }

  setForm({ ambassadeur_id: "", nom: "", prenom: "", telephone: "", formation: "", statut: "En attente" });
  setShowForm(false);
  setSaving(false);
};

  const filtered = filleuls.filter((f) =>
    `${f.nom} ${f.prenom} ${f.formation}`.toLowerCase().includes(search.toLowerCase())
  );

  const statutColor: Record<string, string> = {
    "Inscrit": "bg-blue-100 text-blue-700",
    "En attente": "bg-yellow-100 text-yellow-700",
    "Confirmé": "bg-green-100 text-green-700",
    "Annulé": "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="hover:text-sbbs-gold transition">← Retour</button>
          <div className="flex items-center gap-2">
            <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full object-cover border-2 border-sbbs-gold" />
            <h1 className="font-bold text-lg">Filleuls</h1>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-sbbs-gold text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-yellow-500 transition">
          {showForm ? "Annuler" : "+ Nouveau filleul"}
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Formulaire */}
        {showForm && (
          <div className="card mb-6 border-l-4 border-sbbs-gold">
            <h2 className="font-bold text-sbbs-blue mb-4">{editId ? "Modifier le filleul" : "Enregistrer un nouveau filleul"}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ambassadeur *</label>
                <select name="ambassadeur_id" value={form.ambassadeur_id} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue">
                  <option value="">-- Sélectionner l'ambassadeur parrain --</option>
                  {ambassadeurs.map((a) => (
                    <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>
                  ))}
                </select>
              </div>
              {[
                { label: "Prénom *", name: "prenom", placeholder: "ex: Kouamé" },
                { label: "Nom *", name: "nom", placeholder: "ex: KONAN" },
                { label: "Téléphone", name: "telephone", placeholder: "ex: 07 00 00 00 00" },
                { label: "Formation *", name: "formation", placeholder: "ex: BTS Marketing" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type="text" name={field.name}
                    value={form[field.name as keyof typeof form]}
                    onChange={handleChange} placeholder={field.placeholder}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select name="statut" value={form.statut} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue">
                  <option value="En attente">En attente</option>
                  <option value="Inscrit">Inscrit</option>
                  <option value="Confirmé">Confirmé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
            </div>
            {error && <p className="text-sbbs-red text-sm mt-3">{error}</p>}
            <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full mt-4">
              {saving ? "Enregistrement..." : editId ? "💾 Sauvegarder les modifications" : "Enregistrer le filleul"}
            </button>
          </div>
        )}

        {/* Recherche */}
        <div className="mb-4">
          <input type="text" placeholder="Rechercher par nom, formation..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
        </div>

        {/* Tableau */}
        {loading ? (
          <p className="text-center text-sbbs-blue animate-pulse">Chargement...</p>
        ) : filtered.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">Aucun filleul trouvé.</div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-sbbs-blue text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Filleul</th>
                  <th className="px-4 py-3 text-left">Formation</th>
                  <th className="px-4 py-3 text-left">Ambassadeur</th>
                  <th className="px-4 py-3 text-left">Téléphone</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={f.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium">{f.prenom} {f.nom}</td>
                    <td className="px-4 py-3">{f.formation}</td>
                    <td className="px-4 py-3">{f.ambassadeurs?.prenom} {f.ambassadeurs?.nom}</td>
                    <td className="px-4 py-3">{f.telephone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statutColor[f.statut] ?? "bg-gray-100 text-gray-500"}`}>
                        {f.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setForm({ ambassadeur_id: f.ambassadeur_id, nom: f.nom, prenom: f.prenom, telephone: f.telephone, formation: f.formation, statut: f.statut });
                            setEditId(f.id);
                            setShowForm(true);
                          }}
                          className="text-sbbs-blue hover:underline text-xs font-medium"
                        >✏️ Modifier</button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Supprimer ${f.prenom} ${f.nom} ?`)) return;
                            await supabase.from("commissions").delete().eq("filleul_id", f.id);
                            await supabase.from("filleuls").delete().eq("id", f.id);
                            setFilleuls((prev) => prev.filter((x) => x.id !== f.id));
                          }}
                          className="text-sbbs-red hover:underline text-xs font-medium"
                        >🗑️ Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
