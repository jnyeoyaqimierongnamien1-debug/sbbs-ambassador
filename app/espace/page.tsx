"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Ambassadeur = {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  zone: string;
  branche: string;
  niveau: string;
  statut: string;
  user_id: string;
};

type Filleul = {
  id: string;
  ambassadeur_id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  formation: string;
  montant: number;
  statut: string;
  date_inscription: string;
  created_at: string;
};

const STATUTS = ["En attente", "Inscrit", "Payé", "Annulé"];

const statutColors: Record<string, string> = {
  "En attente": "bg-yellow-100 text-yellow-800",
  "Inscrit":    "bg-blue-100 text-blue-800",
  "Payé":       "bg-green-100 text-green-800",
  "Annulé":     "bg-red-100 text-red-800",
};

const niveauStyle: Record<string, string> = {
  "Or":     "bg-yellow-100 text-yellow-700",
  "Argent": "bg-gray-100 text-gray-700",
  "Bronze": "bg-orange-100 text-orange-700",
};

export default function EspacePage() {
  const [ambassadeur, setAmbassadeur]   = useState<Ambassadeur | null>(null);
  const [filleuls, setFilleuls]         = useState<Filleul[]>([]);
  const [rang, setRang]                 = useState<number>(0);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editingFilleul, setEditingFilleul] = useState<Filleul | null>(null);
  const [form, setForm] = useState({
    nom: "", prenom: "", telephone: "", email: "",
    formation: "", montant: "", statut: "En attente", date_inscription: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Trouver l'ambassadeur lié à ce compte
    const { data: amb } = await supabase
      .from("ambassadeurs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!amb) { router.push("/dashboard"); return; }
    setAmbassadeur(amb);

    // Filleuls de cet ambassadeur
    const { data: fils } = await supabase
      .from("filleuls")
      .select("*")
      .eq("ambassadeur_id", amb.id)
      .order("created_at", { ascending: false });

    setFilleuls(fils || []);

    // Calcul du rang (basé sur nb filleuls non annulés)
    const { data: tousFilleuls } = await supabase
      .from("filleuls")
      .select("ambassadeur_id, statut");

    const counts: Record<string, number> = {};
    tousFilleuls?.forEach(f => {
      if (f.statut !== "Annulé") {
        counts[f.ambassadeur_id] = (counts[f.ambassadeur_id] || 0) + 1;
      }
    });
    const monCount   = counts[amb.id] || 0;
    const plusHaut   = Object.values(counts).filter(c => c > monCount).length;
    setRang(plusHaut + 1);

    setLoading(false);
  };

  // Stats calculées
  const filleulsActifs      = filleuls.filter(f => f.statut !== "Annulé").length;
  const filleulsPayes       = filleuls.filter(f => f.statut === "Payé").length;
  const commissionsPayees   = filleuls
    .filter(f => f.statut === "Payé")
    .reduce((sum, f) => sum + (Number(f.montant) || 0), 0);
  const commissionsAttente  = filleuls
    .filter(f => ["En attente", "Inscrit"].includes(f.statut))
    .reduce((sum, f) => sum + (Number(f.montant) || 0), 0);

  // Ouvrir formulaire ajout
  const openAdd = () => {
    setEditingFilleul(null);
    setForm({
      nom: "", prenom: "", telephone: "", email: "",
      formation: "", montant: "", statut: "En attente",
      date_inscription: new Date().toISOString().split("T")[0],
    });
    setError("");
    setShowForm(true);
  };

  // Ouvrir formulaire modification
  const openEdit = (f: Filleul) => {
    setEditingFilleul(f);
    setForm({
      nom: f.nom || "", prenom: f.prenom || "", telephone: f.telephone || "",
      email: f.email || "", formation: f.formation || "",
      montant: String(f.montant || ""), statut: f.statut,
      date_inscription: f.date_inscription || "",
    });
    setError("");
    setShowForm(true);
  };

  // Enregistrer
  const handleSave = async () => {
    if (!form.nom.trim() || !form.telephone.trim()) {
      setError("Le nom et le téléphone sont obligatoires.");
      return;
    }
    setSaving(true);
    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      email: form.email.trim(),
      formation: form.formation.trim(),
      montant: form.montant ? Number(form.montant) : null,
      statut: form.statut,
      date_inscription: form.date_inscription || null,
      ambassadeur_id: ambassadeur!.id,
    };

    if (editingFilleul) {
      await supabase.from("filleuls").update(payload).eq("id", editingFilleul.id);
    } else {
      await supabase.from("filleuls").insert(payload);
    }
    setSaving(false);
    setShowForm(false);
    fetchData();
  };

  // Annuler inscription
  const handleCancel = async (id: string) => {
    if (!confirm("Annuler l'inscription de ce filleul ?")) return;
    await supabase.from("filleuls").update({ statut: "Annulé" }).eq("id", id);
    fetchData();
  };

  // Supprimer
  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement ce filleul ?")) return;
    await supabase.from("filleuls").delete().eq("id", id);
    fetchData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold text-lg animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img
            src="/LOGO%20SBBS%20PNG.webp"
            alt="SBBS"
            className="w-10 h-10 rounded-full object-cover border-2 border-sbbs-gold"
          />
          <div>
            <h1 className="font-bold text-lg leading-none">Mon Espace Ambassador</h1>
            <p className="text-xs text-blue-200">
              {ambassadeur?.prenom} {ambassadeur?.nom}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm bg-white text-sbbs-blue px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Déconnexion
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* Carte Profil */}
        <div className="card mb-5 flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-sbbs-blue flex items-center justify-center text-white text-xl font-bold shrink-0">
            {ambassadeur?.prenom?.[0]}{ambassadeur?.nom?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-sbbs-blue text-lg">
              {ambassadeur?.prenom} {ambassadeur?.nom}
            </h2>
            <p className="text-sm text-gray-500">
              {ambassadeur?.zone}{ambassadeur?.branche ? ` · ${ambassadeur.branche}` : ""} · Code : {ambassadeur?.code}
            </p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold mt-1 ${niveauStyle[ambassadeur?.niveau || ""] || "bg-gray-100 text-gray-600"}`}>
              🏅 {ambassadeur?.niveau}
            </span>
          </div>
          <div className="text-center ml-auto">
            <p className="text-4xl font-bold text-sbbs-blue">#{rang}</p>
            <p className="text-xs text-gray-400">Classement</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card border-l-4 border-sbbs-blue text-center">
            <p className="text-3xl font-bold text-sbbs-blue">{filleulsActifs}</p>
            <p className="text-xs text-gray-500 mt-1">Filleuls actifs</p>
          </div>
          <div className="card border-l-4 border-green-500 text-center">
            <p className="text-3xl font-bold text-green-600">{filleulsPayes}</p>
            <p className="text-xs text-gray-500 mt-1">Confirmés (Payés)</p>
          </div>
          <div className="card border-l-4 border-sbbs-red text-center">
            <p className="text-xl font-bold text-sbbs-red">{commissionsAttente.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Commissions en attente (FCFA)</p>
          </div>
          <div className="card border-l-4 border-sbbs-gold text-center">
            <p className="text-xl font-bold text-sbbs-gold">{commissionsPayees.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Commissions payées (FCFA)</p>
          </div>
        </div>

        {/* En-tête liste filleuls */}
        <div className="flex items-center justify-between mb-3">
          <div
  onClick={() => router.push("/espace/scripts")}
  className="card cursor-pointer border border-green-200 bg-green-50 hover:bg-green-100 transition mb-4 flex items-center gap-4"
>
  <span className="text-3xl">📲</span>
  <div>
    <p className="font-bold text-green-700">Scripts WhatsApp</p>
    <p className="text-sm text-gray-500">10 messages personnalisés prêts à envoyer</p>
  </div>
</div>
          <h3 className="font-bold text-sbbs-blue text-lg">Mes Filleuls ({filleuls.length})</h3>
          <button onClick={openAdd} className="btn-primary text-sm px-4 py-2">
            + Ajouter un filleul
          </button>
        </div>

        {/* Liste filleuls */}
        {filleuls.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">
            <p className="text-5xl mb-3">🎓</p>
            <p className="font-medium">Aucun filleul enregistré pour le moment.</p>
            <button onClick={openAdd} className="btn-primary text-sm mt-5 px-6 py-2">
              Enregistrer mon premier filleul
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filleuls.map(f => (
              <div
                key={f.id}
                className={`card border flex flex-col sm:flex-row sm:items-center gap-3 ${f.statut === "Annulé" ? "opacity-60 border-gray-200" : "border-gray-100"}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sbbs-blue">
                      {f.prenom} {f.nom}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColors[f.statut] || "bg-gray-100 text-gray-600"}`}>
                      {f.statut}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    📞 {f.telephone}{f.email ? ` · ✉️ ${f.email}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {f.formation ? `📚 ${f.formation}` : ""}
                    {f.montant ? ` · 💰 ${Number(f.montant).toLocaleString()} FCFA` : ""}
                    {f.date_inscription ? ` · 📅 ${f.date_inscription}` : ""}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => openEdit(f)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-sbbs-blue font-medium hover:bg-blue-100 transition"
                  >
                    ✏️ Modifier
                  </button>
                  {f.statut !== "Annulé" && (
                    <button
                      onClick={() => handleCancel(f.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 font-medium hover:bg-yellow-100 transition"
                    >
                      🚫 Annuler
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-sbbs-red font-medium hover:bg-red-100 transition"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Ajout / Modification */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-bold text-sbbs-blue text-lg mb-5">
              {editingFilleul ? "✏️ Modifier le filleul" : "➕ Ajouter un filleul"}
            </h3>

            <div className="space-y-3">
              {([
                { label: "Nom *",               key: "nom",               type: "text" },
                { label: "Prénom",              key: "prenom",            type: "text" },
                { label: "Téléphone *",         key: "telephone",         type: "tel" },
                { label: "Email",               key: "email",             type: "email" },
                { label: "Formation",           key: "formation",         type: "text" },
                { label: "Montant (FCFA)",      key: "montant",           type: "number" },
                { label: "Date d'inscription",  key: "date_inscription",  type: "date" },
              ] as const).map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={form.statut}
                  onChange={e => setForm(prev => ({ ...prev, statut: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
                >
                  {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {error && <p className="text-sbbs-red text-sm font-medium">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 btn-primary text-sm py-2"
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
