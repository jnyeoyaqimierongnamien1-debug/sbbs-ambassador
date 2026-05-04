"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import FilleulFormModal from "@/components/FilleulFormModal";

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
  type_parrainage: string;
  branche_filleul: string;
};

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

const parrainageColors: Record<string, string> = {
  "À chaud": "bg-yellow-100 text-yellow-700",
  "Assisté": "bg-blue-100 text-blue-700",
};

const NAV_ITEMS = [
  { title: "Investissement IP", description: "Groupe Intelligent Partnership", href: "/ip", icon: "💼", bg: "linear-gradient(135deg, #C9A84C, #92400E)" }
  { title: "Médiathèque", description: "Formations · Docs", href: "/dashboard/mediatheque", icon: "📁", bg: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)" },
  { title: "Scripts WhatsApp", description: "10 messages", href: "/espace/scripts", icon: "📲", bg: "linear-gradient(135deg, #15803D 0%, #25D366 100%)" },
  { title: "Exports & Rapports", description: "Excel · CSV · PDF", href: "/espace/export", icon: "📄", bg: "linear-gradient(135deg, #991B1B 0%, #CC0000 100%)" },
  { title: "Paramètres", description: "Profil · Photo", href: "/parametres", icon: "⚙️", bg: "linear-gradient(135deg, #1F2937 0%, #374151 100%)" },
];

export default function EspacePage() {
  const [ambassadeur, setAmbassadeur] = useState<Ambassadeur | null>(null);
  const [filleuls, setFilleuls]       = useState<Filleul[]>([]);
  const [rang, setRang]               = useState<number>(0);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editingFilleul, setEditingFilleul] = useState<Filleul | null>(null);

  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: amb } = await supabase
      .from("ambassadeurs").select("*").eq("user_id", user.id).single();

    if (!amb) { router.push("/dashboard"); return; }
    setAmbassadeur(amb);

    const { data: fils } = await supabase
      .from("filleuls").select("*")
      .eq("ambassadeur_id", amb.id)
      .order("created_at", { ascending: false });

    setFilleuls(fils || []);

    const { data: tousFilleuls } = await supabase
      .from("filleuls").select("ambassadeur_id, statut");

    const counts: Record<string, number> = {};
    tousFilleuls?.forEach(f => {
      if (f.statut !== "Annulé") counts[f.ambassadeur_id] = (counts[f.ambassadeur_id] || 0) + 1;
    });
    const monCount = counts[amb.id] || 0;
    setRang(Object.values(counts).filter(c => c > monCount).length + 1);
    setLoading(false);
  };

  const filleulsActifs     = filleuls.filter(f => f.statut !== "Annulé").length;
  const filleulsPayes      = filleuls.filter(f => f.statut === "Payé").length;
  const commissionsPayees  = filleuls.filter(f => f.statut === "Payé").reduce((s, f) => s + (Number(f.montant) || 0), 0);
  const commissionsAttente = filleuls.filter(f => ["En attente", "Inscrit"].includes(f.statut)).reduce((s, f) => s + (Number(f.montant) || 0), 0);

  const handleSave = async (form: any) => {
    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      email: form.email?.trim() || null,
      formation: form.formation.trim(),
      branche_filleul: form.branche_filleul || null,
      type_parrainage: form.type_parrainage,
      montant: form.montant ? Number(form.montant) : null,
      statut: form.statut,
      date_inscription: form.date_inscription || null,
      ambassadeur_id: ambassadeur!.id,
    };

    if (editingFilleul) {
      const { error } = await supabase.from("filleuls").update(payload).eq("id", editingFilleul.id);
      if (error) { alert("Erreur modification : " + error.message); return; }
    } else {
      const { error } = await supabase.from("filleuls").insert(payload);
      if (error) { alert("Erreur enregistrement : " + error.message); return; }
    }
    setShowForm(false);
    setEditingFilleul(null);
    fetchData();
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Annuler l'inscription de ce filleul ?")) return;
    await supabase.from("filleuls").update({ statut: "Annulé" }).eq("id", id);
    fetchData();
  };

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
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-10 h-10 rounded-full object-cover border-2 border-sbbs-gold" />
          <div>
            <h1 className="font-bold text-lg leading-none">Mon Espace Ambassador</h1>
            <p className="text-xs text-blue-200">{ambassadeur?.prenom} {ambassadeur?.nom}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm bg-white text-sbbs-blue px-4 py-1.5 rounded-xl font-semibold hover:bg-gray-100 transition">
          Déconnexion
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">

        {/* Profil */}
        <div className="card mb-5 flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-sbbs-blue flex items-center justify-center text-white text-xl font-bold shrink-0">
            {ambassadeur?.prenom?.[0]}{ambassadeur?.nom?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-sbbs-blue text-lg">{ambassadeur?.prenom} {ambassadeur?.nom}</h2>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="card border-l-4 border-sbbs-blue text-center py-3">
            <p className="text-3xl font-bold text-sbbs-blue">{filleulsActifs}</p>
            <p className="text-xs text-gray-500 mt-1">Filleuls actifs</p>
          </div>
          <div className="card border-l-4 border-green-500 text-center py-3">
            <p className="text-3xl font-bold text-green-600">{filleulsPayes}</p>
            <p className="text-xs text-gray-500 mt-1">Confirmés</p>
          </div>
          <div className="card border-l-4 border-sbbs-red text-center py-3">
            <p className="text-xl font-bold text-sbbs-red">{commissionsAttente.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">En attente (FCFA)</p>
          </div>
          <div className="card border-l-4 border-sbbs-gold text-center py-3">
            <p className="text-xl font-bold text-sbbs-gold">{commissionsPayees.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Payées (FCFA)</p>
          </div>
        </div>

        {/* ─── Navigation colorée compacte ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {NAV_ITEMS.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="group relative flex items-center gap-2.5 px-3 py-2.5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-left overflow-hidden"
              style={{ background: item.bg }}
            >
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl" />
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-base shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-white leading-tight">{item.title}</p>
                <p className="text-xs text-white/70 truncate mt-0.5 hidden sm:block">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Liste filleuls */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sbbs-blue text-lg">Mes Filleuls ({filleuls.length})</h3>
          <button
            onClick={() => { setEditingFilleul(null); setShowForm(true); }}
            className="btn-primary text-sm px-4 py-2 rounded-xl"
          >
            + Ajouter un filleul
          </button>
        </div>

        {filleuls.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">
            <p className="text-5xl mb-3">🎓</p>
            <p className="font-medium">Aucun filleul enregistré pour le moment.</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm mt-5 px-6 py-2 rounded-xl">
              Enregistrer mon premier filleul
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filleuls.map(f => (
              <div key={f.id} className={`card border flex flex-col sm:flex-row sm:items-center gap-3 ${f.statut === "Annulé" ? "opacity-60 border-gray-200" : "border-gray-100"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sbbs-blue">{f.prenom} {f.nom}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColors[f.statut] || "bg-gray-100 text-gray-600"}`}>
                      {f.statut}
                    </span>
                    {f.type_parrainage && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${parrainageColors[f.type_parrainage] || "bg-gray-100 text-gray-600"}`}>
                        {f.type_parrainage === "À chaud" ? "🔥" : "🤝"} {f.type_parrainage}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    📞 {f.telephone}{f.email ? ` · ✉️ ${f.email}` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {f.branche_filleul ? `🏫 ${f.branche_filleul}` : ""}
                    {f.montant ? ` · 💰 ${Number(f.montant).toLocaleString()} FCFA` : ""}
                    {f.date_inscription ? ` · 📅 ${f.date_inscription}` : ""}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => { setEditingFilleul(f); setShowForm(true); }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-sbbs-blue font-medium hover:bg-blue-100 transition"
                  >
                    ✏️ Modifier
                  </button>
                  {f.statut !== "Annulé" && (
                    <button
                      onClick={() => handleCancel(f.id)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 font-medium hover:bg-yellow-100 transition"
                    >
                      🚫 Annuler
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-sbbs-red font-medium hover:bg-red-100 transition"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showForm && (
        <FilleulFormModal
          initial={editingFilleul ? {
            nom: editingFilleul.nom,
            prenom: editingFilleul.prenom,
            telephone: editingFilleul.telephone,
            email: editingFilleul.email,
            formation: editingFilleul.formation,
            branche_filleul: editingFilleul.branche_filleul,
            type_parrainage: (editingFilleul.type_parrainage as any) || "Assisté",
            montant: String(editingFilleul.montant || ""),
            statut: editingFilleul.statut,
            date_inscription: editingFilleul.date_inscription,
          } : undefined}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingFilleul(null); }}
          isEditing={!!editingFilleul}
        />
      )}
    </div>
  );
}
