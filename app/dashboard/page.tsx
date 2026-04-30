"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Stats = {
  totalAmbassadeurs: number;
  totalFilleuls: number;
  commissionsEnAttente: number;
  commissionsPayees: number;
};

const NAV_ITEMS = [
  { title: "Ambassadeurs", description: "Gérer les ambassadeurs", href: "/dashboard/ambassadeurs", icon: "👥", bg: "#1A3A6C", text: "#fff" },
  { title: "Filleuls", description: "Suivre les filleuls", href: "/dashboard/filleuls", icon: "🎓", bg: "#C9A84C", text: "#fff" },
  { title: "Parrainages", description: "Suivre les parrainages", href: "/dashboard/parrainages", icon: "🤝", bg: "#059669", text: "#fff" },
  { title: "Commissions", description: "Gérer les paiements", href: "/dashboard/commissions", icon: "💰", bg: "#7C3AED", text: "#fff" },
  { title: "Classement", description: "Podium ambassadeurs", href: "/dashboard/classement", icon: "🏆", bg: "#EA580C", text: "#fff" },
  { title: "Statistiques", description: "Analyses en temps réel", href: "/dashboard/statistiques", icon: "📊", bg: "#0284C7", text: "#fff" },
  { title: "Validations", description: "Candidatures ambassadeurs", href: "/dashboard/validations", icon: "✅", bg: "#16A34A", text: "#fff" },
  { title: "Validations Directeurs", description: "Candidatures directeurs", href: "/dashboard/validations-directeurs", icon: "🏫", bg: "#92400E", text: "#fff" },
  { title: "Scripts WhatsApp", description: "Messages personnalisés", href: "/dashboard/scripts", icon: "📲", bg: "#25D366", text: "#fff" },
  { title: "Exports & Rapports", description: "Excel · CSV · PDF", href: "/dashboard/export", icon: "📄", bg: "#CC0000", text: "#fff" },
  { title: "Paramètres", description: "Profil · Mot de passe", href: "/parametres", icon: "⚙️", bg: "#374151", text: "#fff" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalAmbassadeurs: 0,
    totalFilleuls: 0,
    commissionsEnAttente: 0,
    commissionsPayees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showStats, setShowStats] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchStats = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const [
      { count: totalAmbassadeurs },
      { count: totalFilleuls },
      { data: commissionsData },
    ] = await Promise.all([
      supabase.from("ambassadeurs").select("*", { count: "exact", head: true }),
      supabase.from("filleuls").select("*", { count: "exact", head: true }),
      supabase.from("commissions").select("montant_commission, statut_paiement"),
    ]);

    const commissionsEnAttente = commissionsData
      ?.filter((c) => c.statut_paiement === "En attente")
      .reduce((sum, c) => sum + (Number(c.montant_commission) || 0), 0) ?? 0;

    const commissionsPayees = commissionsData
      ?.filter((c) => c.statut_paiement === "Payé")
      .reduce((sum, c) => sum + (Number(c.montant_commission) || 0), 0) ?? 0;

    setStats({
      totalAmbassadeurs: totalAmbassadeurs ?? 0,
      totalFilleuls: totalFilleuls ?? 0,
      commissionsEnAttente,
      commissionsPayees,
    });
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ambassadeurs" }, () => { fetchStats(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "filleuls" }, () => { fetchStats(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "commissions" }, () => { fetchStats(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sbbs-blue font-semibold text-lg animate-pulse">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-10 h-10 rounded-full object-cover border-2 border-sbbs-gold" />
          <div>
            <h1 className="font-bold text-lg leading-none">SBBS Ambassador</h1>
            <p className="text-xs text-blue-200">Tableau de bord Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-300 font-medium">En direct</span>
          </div>
          <button onClick={handleLogout} className="text-sm bg-white text-sbbs-blue px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition">
            Déconnexion
          </button>
        </div>
      </header>

      {/* Bandeau photo */}
      <div className="relative w-full h-56 overflow-hidden">
        <img src="/Banni%C3%A8re%20bandeau.jpg" alt="Diplômés SBBS" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-r from-sbbs-blue/85 via-sbbs-blue/50 to-sbbs-blue/20" />
        <div className="absolute inset-0 flex items-center px-8">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              Bienvenue sur <span style={{ color: "#C9A84C" }}>SBBS Ambassador</span>
            </h2>
            <p className="font-bold text-base mt-1 drop-shadow" style={{ color: "#CC0000" }}>
              Intelligence et Expertise des Affaires
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full border" style={{ color: "#C9A84C", borderColor: "#C9A84C", backgroundColor: "rgba(201,168,76,0.15)" }}>
                👥 {stats.totalAmbassadeurs} Ambassadeurs
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full border border-white/40 text-white" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                🎓 {stats.totalFilleuls} Filleuls
              </span>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-12 h-12 rounded-full border-2 object-cover" style={{ borderColor: "#C9A84C" }} />
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Vue d'ensemble — Accordéon */}
        <div className="mb-5">
          <button
            onClick={() => setShowStats(s => !s)}
            className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-sbbs-blue transition shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-sbbs-blue text-lg">📊 Vue d'ensemble</span>
              <span className="text-xs text-gray-400">
                Mis à jour à {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
            <span className="text-gray-400">{showStats ? "▲" : "▼"}</span>
          </button>

          {showStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
              <StatCard label="Ambassadeurs" value={stats.totalAmbassadeurs} color="blue" icon="👥" />
              <StatCard label="Filleuls" value={stats.totalFilleuls} color="gold" icon="🎓" />
              <StatCard label="Commissions en attente" value={`${stats.commissionsEnAttente.toLocaleString()} FCFA`} color="red" icon="⏳" />
              <StatCard label="Commissions payées" value={`${stats.commissionsPayees.toLocaleString()} FCFA`} color="green" icon="✅" />
            </div>
          )}
        </div>

        {/* Navigation — boutons colorés */}
        <h2 className="text-xl font-bold text-sbbs-blue mb-3">Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {NAV_ITEMS.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-sm hover:shadow-md hover:scale-105 transition-all text-left"
              style={{ backgroundColor: item.bg, color: item.text }}
            >
              <span className="text-2xl shrink-0">{item.icon}</span>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">{item.title}</p>
                <p className="text-xs opacity-75 truncate">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color, icon }: {
  label: string; value: string | number;
  color: "blue" | "gold" | "red" | "green"; icon: string;
}) {
  const colors = {
    blue: "border-sbbs-blue text-sbbs-blue",
    gold: "border-sbbs-gold text-sbbs-gold",
    red: "border-sbbs-red text-sbbs-red",
    green: "border-green-500 text-green-600",
  };
  return (
    <div className={`card border-l-4 ${colors[color]} p-3`}>
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}
