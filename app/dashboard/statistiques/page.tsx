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
  parNiveau: { niveau: string; count: number }[];
};

const COLORS = ["#1A3A6C", "#C9A84C", "#CC0000", "#1d9e75", "#2a5499", "#e8c96a"];

function DonutChart({ data, labels, colors }: { data: number[]; labels: string[]; colors: string[] }) {
  const total = data.reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-gray-400 text-sm text-center py-4">Aucune donnée</p>;

  let cumulative = 0;
  const segments = data.map((val, i) => {
    const pct = val / total;
    const start = cumulative;
    cumulative += pct;
    return { val, pct, start, color: colors[i % colors.length], label: labels[i] };
  });

  const radius = 60;
  const cx = 80;
  const cy = 80;

  function polarToCartesian(angle: number, r: number) {
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(start: number, end: number) {
    const s = polarToCartesian(start * 360, radius);
    const e = polarToCartesian(end * 360, radius);
    const large = end - start > 0.5 ? 1 : 0;
    const si = polarToCartesian(start * 360, 36);
    const ei = polarToCartesian(end * 360, 36);
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A 36 36 0 ${large} 0 ${si.x} ${si.y} Z`;
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {segments.map((seg, i) => (
          <path key={i} d={arcPath(seg.start, seg.start + seg.pct)} fill={seg.color} stroke="white" strokeWidth="2" />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#1A3A6C">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#7080a0">total</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-600 flex-1">{seg.label}</span>
            <span className="font-bold text-sbbs-blue">{seg.val}</span>
            <span className="text-gray-400">({Math.round(seg.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        supabase.from("commissions").select("montant_commission, statut_paiement"),
      ]);

      const amb = ambassadeurs ?? [];
      const fill = filleuls ?? [];
      const comm = commissions ?? [];

      const brancheMap: Record<string, number> = {};
      amb.forEach((a) => {
        const b = a.branche || "Non défini";
        brancheMap[b] = (brancheMap[b] || 0) + 1;
      });

      const zoneMap: Record<string, number> = {};
      amb.forEach((a) => {
        const z = a.zone || "Non défini";
        zoneMap[z] = (zoneMap[z] || 0) + 1;
      });

      const niveauMap: Record<string, number> = {};
      amb.forEach((a) => {
        const n = a.niveau || "Débutant";
        niveauMap[n] = (niveauMap[n] || 0) + 1;
      });

      const totalComm = comm.reduce((s, c) => s + (Number(c.montant_commission) || 0), 0);
      const payees = comm.filter((c) => c.statut_paiement === "Payé").reduce((s, c) => s + (Number(c.montant_commission) || 0), 0);
      const enAttente = comm.filter((c) => c.statut_paiement === "En attente").reduce((s, c) => s + (Number(c.montant_commission) || 0), 0);

      setStats({
        totalAmbassadeurs: amb.length,
        actifs: amb.filter((a) => a.statut === "actif").length,
        inactifs: amb.filter((a) => a.statut !== "actif").length,
        totalFilleuls: fill.length,
        totalCommissions: totalComm,
        commissionsPayees: payees,
        commissionsEnAttente: enAttente,
        parBranche: Object.entries(brancheMap).map(([branche, count]) => ({ branche, count })).sort((a, b) => b.count - a.count),
        parZone: Object.entries(zoneMap).map(([zone, count]) => ({ zone, count })).sort((a, b) => b.count - a.count),
        parNiveau: Object.entries(niveauMap).map(([niveau, count]) => ({ niveau, count })).sort((a, b) => b.count - a.count),
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

  const tauxActivite = stats.totalAmbassadeurs > 0 ? Math.round((stats.actifs / stats.totalAmbassadeurs) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard")} className="hover:text-sbbs-gold transition">← Retour</button>
        <div className="flex items-center gap-3">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full object-cover border-2 border-sbbs-gold" />
          <h1 className="font-bold text-lg">Statistiques & Analyses</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Ambassadeurs" value={stats.totalAmbassadeurs} icon="👥" color="blue" />
          <KpiCard label="Filleuls" value={stats.totalFilleuls} icon="🎓" color="gold" />
          <KpiCard label="Commissions payées" value={`${stats.commissionsPayees.toLocaleString()} F`} icon="✅" color="green" />
          <KpiCard label="En attente" value={`${stats.commissionsEnAttente.toLocaleString()} F`} icon="⏳" color="red" />
        </div>

        {/* Taux activité */}
        <div className="card">
          <h2 className="font-bold text-sbbs-blue mb-3">Taux d'activité</h2>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl font-bold text-sbbs-blue">{tauxActivite}%</span>
            <span className="text-gray-500 text-sm">{stats.actifs} actifs / {stats.inactifs} inactifs</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-sbbs-blue h-4 rounded-full transition-all duration-500" style={{ width: `${tauxActivite}%` }} />
          </div>
        </div>

        {/* Graphiques circulaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Par branche */}
          <div className="card">
            <h2 className="font-bold text-sbbs-blue mb-4">Par Branche SBBS</h2>
            <DonutChart
              data={stats.parBranche.map(b => b.count)}
              labels={stats.parBranche.map(b => b.branche)}
              colors={COLORS}
            />
          </div>

          {/* Par zone */}
          <div className="card">
            <h2 className="font-bold text-sbbs-blue mb-4">Par Zone / Ville</h2>
            <DonutChart
              data={stats.parZone.map(z => z.count)}
              labels={stats.parZone.map(z => z.zone)}
              colors={["#C9A84C", "#1A3A6C", "#CC0000", "#1d9e75", "#2a5499"]}
            />
          </div>

          {/* Par niveau */}
          <div className="card">
            <h2 className="font-bold text-sbbs-blue mb-4">Par Niveau / Grade</h2>
            <DonutChart
              data={stats.parNiveau.map(n => n.count)}
              labels={stats.parNiveau.map(n => n.niveau)}
              colors={["#C9A84C", "#CC0000", "#1A3A6C", "#1d9e75"]}
            />
          </div>

          {/* Commissions */}
          <div className="card">
            <h2 className="font-bold text-sbbs-blue mb-4">Commissions (FCFA)</h2>
            <DonutChart
              data={[stats.commissionsPayees, stats.commissionsEnAttente]}
              labels={["Payées", "En attente"]}
              colors={["#1d9e75", "#C9A84C"]}
            />
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">Total général</p>
              <p className="text-2xl font-bold text-sbbs-blue">{stats.totalCommissions.toLocaleString()} FCFA</p>
            </div>
          </div>

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
