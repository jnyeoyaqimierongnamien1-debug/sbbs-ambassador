"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Stats = {
  totalAmbassadeurs: number;
  totalParrainages: number;
  commissionsEnAttente: number;
  commissionsPayees: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalAmbassadeurs: 0,
    totalParrainages: 0,
    commissionsEnAttente: 0,
    commissionsPayees: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [
        { count: totalAmbassadeurs },
        { count: totalParrainages },
        { data: commissionsData },
      ] = await Promise.all([
        supabase.from("ambassadeurs").select("*", { count: "exact", head: true }),
        supabase.from("parrainages").select("*", { count: "exact", head: true }),
        supabase.from("commissions").select("montant, statut"),
      ]);

      const commissionsEnAttente = commissionsData
        ?.filter((c) => c.statut === "en_attente")
        .reduce((sum, c) => sum + c.montant, 0) ?? 0;

      const commissionsPayees = commissionsData
        ?.filter((c) => c.statut === "payee")
        .reduce((sum, c) => sum + c.montant, 0) ?? 0;

      setStats({
        totalAmbassadeurs: totalAmbassadeurs ?? 0,
        totalParrainages: totalParrainages ?? 0,
        commissionsEnAttente,
        commissionsPayees,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sbbs-blue font-semibold text-lg animate-pulse">
          Chargement...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img src="/LOGO_SBBS_PNG.webp" alt="SBBS" className="w-10 h-10 rounded-full object-cover border-2 border-sbbs-gold" />
          <div>
            <h1 className="font-bold text-lg leading-none">SBBS Ambassador</h1>
            <p className="text-xs text-blue-200">Tableau de bord</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm bg-white text-sbbs-blue px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          Déconnexion
        </button>
      </header>

      {/* Contenu */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-sbbs-blue mb-6">Vue d'ensemble</h2>

        {/* Cartes stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Ambassadeurs"
            value={stats.totalAmbassadeurs}
            color="blue"
            icon="👥"
          />
          <StatCard
            label="Parrainages"
            value={stats.totalParrainages}
            color="gold"
            icon="🤝"
          />
          <StatCard
            label="Commissions en attente"
            value={`${stats.commissionsEnAttente.toLocaleString()} FCFA`}
            color="red"
            icon="⏳"
          />
          <StatCard
            label="Commissions payées"
            value={`${stats.commissionsPayees.toLocaleString()} FCFA`}
            color="green"
            icon="✅"
          />
        </div>

        {/* Navigation rapide */}
        <h2 className="text-xl font-bold text-sbbs-blue mb-4">Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NavCard
            title="Ambassadeurs"
            description="Gérer les ambassadeurs et leurs informations"
            href="/dashboard/ambassadeurs"
            icon="👥"
          />
          <NavCard
            title="Filleuls"
            description="Enregistrer et suivre les filleuls"
            href="/dashboard/filleuls"
            icon="🎓"
          />
          <NavCard
            title="Parrainages"
            description="Suivre les parrainages et inscriptions"
            href="/dashboard/parrainages"
            icon="🤝"
          />
          <NavCard
            title="Commissions"
            description="Gérer et valider les paiements"
            href="/dashboard/commissions"
            icon="💰"
          />
          <NavCard
            title="Statistiques"
            description="Graphiques et analyses en temps réel"
            href="/dashboard/statistiques"
            icon="📊"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: "blue" | "gold" | "red" | "green";
  icon: string;
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

function NavCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(href)}
      className="card cursor-pointer hover:shadow-lg transition-shadow border border-gray-100 hover:border-sbbs-blue"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-bold text-sbbs-blue">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}
