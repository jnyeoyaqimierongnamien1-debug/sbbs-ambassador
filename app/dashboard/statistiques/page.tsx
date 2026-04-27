"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type StatData = {
  totalAmbassadeurs: number;
  actifs: number;
  inactifs: number;
  totalFilleuls: number;
  totalCommissions: number;
  commissionsPayees: number;
  commissionsEnAttente: number;
  parBranche: { branche: string; count: number }[];
  parZone: { zone: string; count: number }[];
  evolutionMois: { mois: string; count: number }[];
};

export default function StatistiquesPage() {
  const [stats, setStats] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [
        { data: ambassadeurs },
        { data: filleuls },
        { data: commissions },
      ] = await Promise.all([
        supabase.from("ambassadeurs").select("*"),
        supabase.from("filleuls").select("*"),
        supabase.from("commissions").select("*"),
      ]);

      const amb = ambassadeurs ?? [];
      const fill = filleuls ?? [];
      const comm = commissions ?? [];

      // Par branche
      const brancheMap: Record<string, number> = {};
      amb.forEach((a) => {
        const b = a.branche || "Non défini";
        brancheMap[b] = (brancheMap[b] || 0) + 1;
      });

      // Par zone
      const zoneMap: Record<string, number> = {};
      amb.forEach((a) => {
        const z = a.zone || "Non défini";
        zoneMap[z] = (zoneMap[z] || 0) + 1;
      });

      // Evolution par mois
      const moisMap: Record<string, number> = {};
      amb.forEach((a) => {
        const mois = new Date(a.created_at).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        moisMap[mois] = (moisMap[mois] || 0) + 1;
      });

      setStats({
        totalAmbassadeurs: amb.length,
        actifs: amb.filter((a) => a.statut === "actif").length,
        inactifs: amb.filter((a) => a.statut === "inactif").length,
        totalFilleuls: fill.length,
        totalCommissions: comm.reduce((s, c) => s + c.montant, 0),
        commissionsPayees: comm.filter((c) => c.statut === "payee").reduce((s, c) => s + c.montant, 0),
        commissionsEnAttente: comm.filter((c) => c.statut === "en_attente").reduce((s, c) => s + c.montant, 0),
        parBranche: Object.entries(brancheMap).map(([branche, count]) => ({ branche, count })).sort((a, b) => b.count - a.count),
        parZone: Object.entries(zoneMap).map(([zone, count]) => ({ zone, count })).sort((a, b) => b.count - a.count),
        evolutionMois: Object.entries(moisMap).map(([mois, count]) => ({ mois, count })),
      });

      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue animate-pulse font-semibold">Chargement des statistiques...</p>
    </div>
  );

  if (!stats) return null;

  const maxBranche = Math.max(...stats.parBranche.map((b) => b.count), 1);
  const maxZone = Math.max(...stats.parZone.map((z) => z.count), 1);
  const maxMois = Math.max(...stats.evolutionMois.map((m) => m.count), 1);
  const tauxActivite = stats.totalAmbassadeurs > 0
    ? Math.round((stats.actifs / stats.totalAmbassadeurs) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard")} className="hover:text-sbbs-gold transition">
          ← Retour
        </button>
        <div className="flex items-center gap-3">
          <img src="/LOGO_SBBS_PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full object-cover border-2 border-sbbs-gold" />
          <h1 className="font-bold text-lg">Statistiques & Analyses</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Ambassadeurs" value={stats.totalAmbassadeurs} icon="👥" color="blue" />
          <KpiCard label="Filleuls" value={stats.totalFilleuls} icon="🤝" color="gold" />
          <KpiCard label="Commissions payées" value={`${stats.commissionsPayees.toLocaleString()} F`} icon="✅" color="green" />
          <KpiCard label="En attente" value={`${stats.commissionsEnAttente.toLocaleString()} F`} icon="⏳" color="red" />
        </div>

        {/* Taux d'activité */}
        <div className="card">
          <h2 className="font-bold text-sbbs-blue mb-4">Taux d'activité des ambassadeurs</h2>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl font-bold text-sbbs-blue">{tauxActivite}%</span>
            <span className="text-gray-500 text-sm">{stats.actifs} actifs / {stats.inactifs} inactifs</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-sbbs-blue h-4 rounded-full transition-all duration-500"
              style={{ width: `${tauxActivite}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Ambassadeurs par branche */}
        {stats.parBranche.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-sbbs-blue mb-4">Ambassadeurs par Branche SBBS</h2>
            <div className="space-y-3">
              {stats.parBranche.map((b) => (
                <div key={b.branche}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{b.branche}</span>
                    <span className="text-sbbs-blue font-bold">{b.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-sbbs-blue h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(b.count / maxBranche) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ambassadeurs par zone */}
        {stats.parZone.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-sbbs-blue mb-4">Ambassadeurs par Zone / Ville</h2>
            <div className="space-y-3">
              {stats.parZone.map((z) => (
                <div key={z.zone}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{z.zone}</span>
                    <span className="text-sbbs-gold font-bold">{z.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-sbbs-gold h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(z.count / maxZone) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evolution mensuelle */}
        {stats.evolutionMois.length > 0 && (
          <div className="card">
            <h2 className="font-bold text-sbbs-blue mb-4">Évolution des inscriptions</h2>
            <div className="flex items-end gap-3 h-32">
              {stats.evolutionMois.map((m) => (
                <div key={m.mois} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-bold text-sbbs-blue">{m.count}</span>
                  <div
                    className="w-full bg-sbbs-blue rounded-t transition-all duration-500"
                    style={{ height: `${(m.count / maxMois) * 100}px` }}
                  />
                  <span className="text-xs text-gray-400">{m.mois}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commissions */}
        <div className="card">
          <h2 className="font-bold text-sbbs-blue mb-4">Répartition des Commissions</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-sbbs-blue">{stats.totalCommissions.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Total FCFA</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">{stats.commissionsPayees.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Payées</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-yellow-600">{stats.commissionsEnAttente.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">En attente</p>
            </div>
          </div>
          {stats.totalCommissions > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden flex">
                <div
                  className="bg-green-500 h-4 transition-all"
                  style={{ width: `${(stats.commissionsPayees / stats.totalCommissions) * 100}%` }}
                />
                <div
                  className="bg-yellow-400 h-4 transition-all"
                  style={{ width: `${(stats.commissionsEnAttente / stats.totalCommissions) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"/> Payées</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full inline-block"/> En attente</span>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

function KpiCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "border-sbbs-blue text-sbbs-blue",
    gold: "border-sbbs-gold text-sbbs-gold",
    green: "border-green-500 text-green-600",
    red: "border-sbbs-red text-sbbs-red",
  };
  return (
    <div className={`card border-l-4 ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
}
