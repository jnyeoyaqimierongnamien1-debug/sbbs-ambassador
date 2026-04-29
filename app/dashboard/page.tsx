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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalAmbassadeurs: 0,
    totalFilleuls: 0,
    commissionsEnAttente: 0,
    commissionsPayees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
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

    // ─── REALTIME : écoute les changements en temps réel ───
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "ambassadeurs" }, () => {
        fetchStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "filleuls" }, () => {
        fetchStats();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "commissions" }, () => {
        fetchStats();
      })
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
          {/* Indicateur temps réel */}
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
        <img
          src="/Banni%C3%A8re%20bandeau.jpg"
          alt="Diplômés SBBS"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sbbs-blue/85 via-sbbs-blue/50 to-sbbs-blue/20" />
        <div className="absolute inset-0 flex items-center px-8">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
              Bienvenue sur{" "}
              <span style={{ color: "#C9A84C" }}>SBBS Ambassador</span>
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

      {/* Contenu */}
      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Dernière mise à jour */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-sbbs-blue">Vue d'ensemble</h2>
          <p className="text-xs text-gray-400">
            Mis à jour à {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>

        {/* Cartes stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Ambassadeurs" value={stats.totalAmbassadeurs} color="blue" icon="👥" />
          <StatCard label="Filleuls" value={stats.totalFilleuls} color="gold" icon="🎓" />
          <StatCard label="Commissions en attente" value={`${stats.commissionsEnAttente.toLocaleString()} FCFA`} color="red" icon="⏳" />
          <StatCard label="Commissions payées" value={`${stats.commissionsPayees.toLocaleString()} FCFA`} color="green" icon="✅" />
        </div>

        {/* Navigation */}
        <h2 className="text-xl font-bold text-sbbs-blue mb-4">Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NavCard title="Ambassadeurs" description="Gérer les ambassadeurs et leurs informations" href="/dashboard/ambassadeurs" icon="👥" />
          <NavCard title="Filleuls" description="Enregistrer et suivre les filleuls" href="/dashboard/filleuls" icon="🎓" />
          <NavCard title="Parrainages" description="Suivre les parrainages et inscriptions" href="/dashboard/parrainages" icon="🤝" />
          <NavCard title="Commissions" description="Gérer et valider les paiements" href="/dashboard/commissions" icon="💰" />
          <NavCard title="Classement" description="Podium et performances des ambassadeurs" href="/dashboard/classement" icon="🏆" />
          <NavCard title="Statistiques" description="Graphiques et analyses en temps réel" href="/dashboard/statistiques" icon="📊" />
          <NavCard title="Validations" description="Candidatures ambassadeurs en attente" href="/dashboard/validations" icon="✅" />
          <NavCard title="Validations Directeurs" description="Candidatures directeurs de branches en attente" href="/dashboard/validations-directeurs" icon="🏫" />
          <NavCard title="Scripts WhatsApp" description="Messages personnalisés pour les ambassadeurs" href="/dashboard/scripts" icon="📲" />
          <NavCard title="Exports & Rapports" description="Excel · CSV · PDF" href="/dashboard/export" icon="📊" />
        </div>
      </main>
    </div>
  );
}
<NavCard
  title="Paramètres"
  description="Profil, mot de passe, commissions"
  href="/parametres"
  icon="⚙️"
/>
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
    <div className={`card border-l-4 ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}

function NavCard({ title, description, href, icon }: {
  title: string; description: string; href: string; icon: string;
}) {
  const router = useRouter();
  return (
    <div onClick={() => router.push(href)} className="card cursor-pointer hover:shadow-lg transition-shadow border border-gray-100 hover:border-sbbs-blue">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-bold text-sbbs-blue">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}
