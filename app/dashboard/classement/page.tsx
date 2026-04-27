"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type AmbassadeurRank = {
  id: string;
  nom: string;
  prenom: string;
  zone: string;
  niveau: string;
  telephone: string;
  totalFilleuls: number;
  filleulsConfirmes: number;
  totalCommissions: number;
};

export default function ClassementPage() {
  const [classement, setClassement] = useState<AmbassadeurRank[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: ambassadeurs }, { data: filleuls }, { data: commissions }] = await Promise.all([
        supabase.from("ambassadeurs").select("*").eq("statut", "actif"),
        supabase.from("filleuls").select("ambassadeur_id, statut"),
        supabase.from("commissions").select("ambassadeur_id, montant_commission"),
      ]);

      const ranked = (ambassadeurs ?? []).map((a) => {
        const myFilleuls = (filleuls ?? []).filter((f) => f.ambassadeur_id === a.id);
        const myComm = (commissions ?? []).filter((c) => c.ambassadeur_id === a.id);
        return {
          id: a.id, nom: a.nom, prenom: a.prenom, zone: a.zone || "—",
          niveau: a.niveau || "Débutant", telephone: a.telephone,
          totalFilleuls: myFilleuls.length,
          filleulsConfirmes: myFilleuls.filter((f) => f.statut === "Confirmé").length,
          totalCommissions: myComm.reduce((s, c) => s + (Number(c.montant_commission) || 0), 0),
        };
      }).sort((a, b) => b.filleulsConfirmes - a.filleulsConfirmes || b.totalCommissions - a.totalCommissions);

      setClassement(ranked);
      setLoading(false);
    };
    fetchData();
  }, []);

  const niveauIcon: Record<string, string> = {
    "Débutant": "🌱", "Bronze": "🥉", "Argent": "🥈", "Or": "🥇", "Platine": "💎"
  };

  const rankIcon = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return `${i + 1}`;
  };

  const rankColor = (i: number) => {
    if (i === 0) return "border-l-4 border-yellow-400 bg-yellow-50";
    if (i === 1) return "border-l-4 border-gray-400 bg-gray-50";
    if (i === 2) return "border-l-4 border-orange-400 bg-orange-50";
    return "border-l-4 border-gray-200 bg-white";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue animate-pulse font-semibold">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard")} className="hover:text-sbbs-gold transition">← Retour</button>
        <div className="flex items-center gap-2">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full object-cover border-2 border-sbbs-gold" />
          <h1 className="font-bold text-lg">🏆 Classement des Ambassadeurs</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">

        {/* Podium top 3 */}
        {classement.length >= 3 && (
          <div className="card mb-6 text-center">
            <h2 className="font-bold text-sbbs-blue mb-6">🏆 Podium du mois</h2>
            <div className="flex items-end justify-center gap-6">
              <div className="flex flex-col items-center">
                <div className="bg-gray-300 rounded-full w-12 h-12 flex items-center justify-center font-bold text-gray-700 mb-1">
                  {classement[1].prenom[0]}{classement[1].nom[0]}
                </div>
                <p className="text-xs font-bold">{classement[1].prenom} {classement[1].nom}</p>
                <p className="text-xs text-sbbs-blue font-bold">{classement[1].filleulsConfirmes} filleuls</p>
                <div className="bg-gray-300 w-20 h-16 flex items-center justify-center rounded-t-lg mt-2 text-3xl">🥈</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-sbbs-gold rounded-full w-14 h-14 flex items-center justify-center font-bold text-white mb-1">
                  {classement[0].prenom[0]}{classement[0].nom[0]}
                </div>
                <p className="text-xs font-bold">{classement[0].prenom} {classement[0].nom}</p>
                <p className="text-xs text-sbbs-blue font-bold">{classement[0].filleulsConfirmes} filleuls</p>
                <div className="bg-yellow-400 w-20 h-24 flex items-center justify-center rounded-t-lg mt-2 text-3xl">🥇</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-orange-200 rounded-full w-12 h-12 flex items-center justify-center font-bold text-orange-700 mb-1">
                  {classement[2].prenom[0]}{classement[2].nom[0]}
                </div>
                <p className="text-xs font-bold">{classement[2].prenom} {classement[2].nom}</p>
                <p className="text-xs text-sbbs-blue font-bold">{classement[2].filleulsConfirmes} filleuls</p>
                <div className="bg-orange-300 w-20 h-10 flex items-center justify-center rounded-t-lg mt-2 text-3xl">🥉</div>
              </div>
            </div>
          </div>
        )}

        {/* Liste complète */}
        <div className="space-y-3">
          {classement.map((a, i) => (
            <div key={a.id} className={`card ${rankColor(i)} cursor-pointer hover:shadow-md transition`}
              onClick={() => router.push(`/dashboard/ambassadeurs/${a.id}`)}>
              <div className="flex items-center gap-3">
                <div className="text-2xl w-8 text-center font-bold">{rankIcon(i)}</div>
                <div className="bg-sbbs-blue rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sbbs-gold text-sm font-bold">{a.prenom[0]}{a.nom[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sbbs-blue">{a.prenom} {a.nom}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                      {niveauIcon[a.niveau]} {a.niveau}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{a.zone} · {a.telephone}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-sbbs-blue">{a.filleulsConfirmes}</p>
                  <p className="text-xs text-gray-400">confirmés</p>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-sbbs-gold">{a.totalCommissions.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">FCFA</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{a.filleulsConfirmes}/{a.totalFilleuls} filleuls confirmés</span>
                  <span>{a.totalFilleuls > 0 ? Math.round((a.filleulsConfirmes / a.totalFilleuls) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-sbbs-blue h-1.5 rounded-full"
                    style={{ width: `${a.totalFilleuls > 0 ? (a.filleulsConfirmes / a.totalFilleuls) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
