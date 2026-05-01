"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Directeur = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  branche: string;
  zone: string;
  fonction: string;
  statut: string;
};

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
};

type Filleul = {
  id: string;
  ambassadeur_id: string;
  nom: string;
  prenom: string;
  telephone: string;
  formation: string;
  montant: number;
  statut: string;
  date_inscription: string;
};

const statutColors: Record<string, string> = {
  "En attente": "bg-yellow-100 text-yellow-800",
  "Inscrit": "bg-blue-100 text-blue-800",
  "Payé": "bg-green-100 text-green-800",
  "Annulé": "bg-red-100 text-red-800",
};

const NAV_ITEMS = [
  { title: "Médiathèque", description: "Fichiers · Vidéos · Docs", href: "/dashboard/mediatheque", icon: "📁", bg: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)" },
  { title: "Scripts WhatsApp", description: "Messages personnalisés", href: "/dashboard/scripts", icon: "📲", bg: "linear-gradient(135deg, #15803D 0%, #25D366 100%)" },
  { title: "Exports & Rapports", description: "Excel · CSV · PDF", href: "/dashboard/export", icon: "📄", bg: "linear-gradient(135deg, #991B1B 0%, #CC0000 100%)" },
  { title: "Paramètres", description: "Profil · Mot de passe · Photo", href: "/parametres", icon: "⚙️", bg: "linear-gradient(135deg, #1F2937 0%, #374151 100%)" },
];

export default function DirecteurPage() {
  const [directeur, setDirecteur] = useState<Directeur | null>(null);
  const [ambassadeurs, setAmbassadeurs] = useState<Ambassadeur[]>([]);
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "ambassadeurs" | "filleuls" | "classement">("overview");
  const [selectedAmb, setSelectedAmb] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: dir } = await supabase
      .from("directeurs").select("*").eq("user_id", user.id).single();

    if (!dir) { router.push("/dashboard"); return; }
    setDirecteur(dir);

    const { data: ambs } = await supabase
      .from("ambassadeurs").select("*")
      .eq("branche", dir.branche)
      .order("nom");

    setAmbassadeurs(ambs || []);

    if (ambs && ambs.length > 0) {
      const ambIds = ambs.map(a => a.id);
      const { data: fils } = await supabase
        .from("filleuls").select("*")
        .in("ambassadeur_id", ambIds)
        .order("created_at", { ascending: false });
      setFilleuls(fils || []);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const totalFilleuls = filleuls.filter(f => f.statut !== "Annulé").length;
  const totalConfirmes = filleuls.filter(f => f.statut === "Payé").length;
  const totalCommissions = filleuls.filter(f => f.statut === "Payé").reduce((s, f) => s + (Number(f.montant) || 0), 0);
  const totalAttente = filleuls.filter(f => ["En attente", "Inscrit"].includes(f.statut)).reduce((s, f) => s + (Number(f.montant) || 0), 0);

  const classement = ambassadeurs
    .map(a => {
      const mesFilleuls = filleuls.filter(f => f.ambassadeur_id === a.id && f.statut !== "Annulé");
      const confirmes = filleuls.filter(f => f.ambassadeur_id === a.id && f.statut === "Payé");
      const commissions = confirmes.reduce((s, f) => s + (Number(f.montant) || 0), 0);
      return { ...a, nb_filleuls: mesFilleuls.length, nb_confirmes: confirmes.length, commissions };
    })
    .sort((a, b) => b.nb_filleuls - a.nb_filleuls);

  const filleulsFiltres = selectedAmb
    ? filleuls.filter(f => f.ambassadeur_id === selectedAmb)
    : filleuls;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-10 h-10 rounded-full border-2 border-sbbs-gold object-cover" />
          <div>
            <h1 className="font-bold text-lg leading-none">Espace Directeur</h1>
            <p className="text-xs text-blue-200">{directeur?.branche}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm bg-white text-sbbs-blue px-4 py-1.5 rounded-xl font-semibold hover:bg-gray-100 transition">
          Déconnexion
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Carte profil */}
        <div className="card mb-5 flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-sbbs-blue flex items-center justify-center text-white text-xl font-bold shrink-0">
            {directeur?.prenom?.[0]}{directeur?.nom?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-sbbs-blue text-lg">{directeur?.prenom} {directeur?.nom}</h2>
            <p className="text-sm text-gray-500">{directeur?.fonction || "Directeur de Branche"} · {directeur?.branche}</p>
            <p className="text-xs text-gray-400 mt-0.5">📞 {directeur?.telephone}</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-sbbs-blue">{ambassadeurs.length}</p>
            <p className="text-xs text-gray-400">Ambassadeurs</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="card border-l-4 border-sbbs-blue text-center py-3">
            <p className="text-3xl font-bold text-sbbs-blue">{ambassadeurs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Ambassadeurs</p>
          </div>
          <div className="card border-l-4 border-sbbs-gold text-center py-3">
            <p className="text-3xl font-bold text-sbbs-gold">{totalFilleuls}</p>
            <p className="text-xs text-gray-500 mt-1">Filleuls actifs</p>
          </div>
          <div className="card border-l-4 border-sbbs-red text-center py-3">
            <p className="text-base font-bold text-sbbs-red">{totalAttente.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">En attente (FCFA)</p>
          </div>
          <div className="card border-l-4 border-green-500 text-center py-3">
            <p className="text-base font-bold text-green-600">{totalCommissions.toLocaleString()}</p>
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

        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {([
            { key: "overview", label: "Vue d'ensemble", emoji: "📊" },
            { key: "ambassadeurs", label: "Ambassadeurs", emoji: "👥" },
            { key: "filleuls", label: "Filleuls", emoji: "🎓" },
            { key: "classement", label: "Classement", emoji: "🏆" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-sm px-4 py-2 rounded-xl font-medium transition ${
                activeTab === tab.key
                  ? "bg-sbbs-blue text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-sbbs-blue"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Vue d'ensemble */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-sbbs-blue mb-3">📈 Performance de la branche</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Taux de confirmation</span>
                  <span className="font-bold text-green-600">
                    {totalFilleuls > 0 ? Math.round((totalConfirmes / totalFilleuls) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${totalFilleuls > 0 ? (totalConfirmes / totalFilleuls) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Ambassadeurs actifs</span>
                  <span className="font-bold text-sbbs-blue">
                    {ambassadeurs.filter(a => a.statut === "actif" || a.statut === "Actif").length}/{ambassadeurs.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-sbbs-blue mb-3">🏆 Top 3 Ambassadeurs</h3>
              {classement.slice(0, 3).map((a, i) => (
                <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                  <div className="w-8 h-8 rounded-full bg-sbbs-blue flex items-center justify-center text-white text-xs font-bold">
                    {a.prenom?.[0]}{a.nom?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{a.prenom} {a.nom}</p>
                    <p className="text-xs text-gray-400">{a.nb_filleuls} filleuls · {a.commissions.toLocaleString()} FCFA</p>
                  </div>
                </div>
              ))}
              {classement.length === 0 && <p className="text-gray-400 text-sm">Aucun ambassadeur dans cette branche.</p>}
            </div>
          </div>
        )}

        {/* Ambassadeurs */}
        {activeTab === "ambassadeurs" && (
          <div className="space-y-3">
            {ambassadeurs.length === 0 ? (
              <div className="card text-center text-gray-400 py-12">
                <p className="text-5xl mb-3">👥</p>
                <p>Aucun ambassadeur dans cette branche pour le moment.</p>
              </div>
            ) : ambassadeurs.map(a => {
              const stats = classement.find(c => c.id === a.id);
              return (
                <div key={a.id} className="card border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sbbs-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {a.prenom?.[0]}{a.nom?.[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sbbs-blue">{a.prenom} {a.nom}</p>
                      <p className="text-xs text-gray-500">📞 {a.telephone} · {a.zone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sbbs-blue">{stats?.nb_filleuls || 0}</p>
                      <p className="text-xs text-gray-400">filleuls</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filleuls */}
        {activeTab === "filleuls" && (
          <div>
            <div className="mb-4">
              <select
                value={selectedAmb || ""}
                onChange={e => setSelectedAmb(e.target.value || null)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
              >
                <option value="">— Tous les ambassadeurs —</option>
                {ambassadeurs.map(a => (
                  <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {filleulsFiltres.length === 0 ? (
                <div className="card text-center text-gray-400 py-12">
                  <p className="text-5xl mb-3">🎓</p>
                  <p>Aucun filleul trouvé.</p>
                </div>
              ) : filleulsFiltres.map(f => {
                const amb = ambassadeurs.find(a => a.id === f.ambassadeur_id);
                return (
                  <div key={f.id} className="card border border-gray-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sbbs-blue">{f.prenom} {f.nom}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColors[f.statut] || "bg-gray-100 text-gray-600"}`}>
                            {f.statut}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          📞 {f.telephone}
                          {f.formation ? ` · 📚 ${f.formation}` : ""}
                          {f.montant ? ` · 💰 ${Number(f.montant).toLocaleString()} FCFA` : ""}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Parrain : {amb ? `${amb.prenom} ${amb.nom}` : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Classement */}
        {activeTab === "classement" && (
          <div className="space-y-3">
            {classement.map((a, i) => (
              <div key={a.id} className={`card border ${i === 0 ? "border-yellow-300 bg-yellow-50/30" : i === 1 ? "border-gray-300 bg-gray-50/30" : i === 2 ? "border-orange-300 bg-orange-50/30" : "border-gray-100"}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-8 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-sbbs-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {a.prenom?.[0]}{a.nom?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sbbs-blue">{a.prenom} {a.nom}</p>
                    <p className="text-xs text-gray-500">{a.zone} · {a.telephone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sbbs-blue text-lg">{a.nb_filleuls}</p>
                    <p className="text-xs text-gray-400">filleuls</p>
                    <p className="text-xs text-green-600 font-medium">{a.commissions.toLocaleString()} FCFA</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-sbbs-blue h-1.5 rounded-full transition-all"
                      style={{ width: `${classement[0]?.nb_filleuls > 0 ? (a.nb_filleuls / classement[0].nb_filleuls) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {classement.length === 0 && (
              <div className="card text-center text-gray-400 py-12">
                <p className="text-5xl mb-3">🏆</p>
                <p>Aucun ambassadeur dans cette branche.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
