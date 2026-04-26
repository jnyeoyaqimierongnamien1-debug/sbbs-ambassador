"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Parrainage = {
  id: string;
  filleul_nom: string;
  filleul_prenom: string;
  filleul_telephone: string;
  formation: string;
  statut: string;
  created_at: string;
  ambassadeurs: {
    nom: string;
    prenom: string;
  };
};

export default function ParrainagesPage() {
  const [parrainages, setParrainages] = useState<Parrainage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("parrainages")
        .select("*, ambassadeurs(nom, prenom)")
        .order("created_at", { ascending: false });

      setParrainages(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = parrainages.filter((p) =>
    `${p.filleul_nom} ${p.filleul_prenom} ${p.formation}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const statutColor: Record<string, string> = {
    inscrit: "bg-blue-100 text-blue-700",
    en_attente: "bg-yellow-100 text-yellow-700",
    confirme: "bg-green-100 text-green-700",
    annule: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard")} className="hover:text-sbbs-gold transition">
          ← Retour
        </button>
        <h1 className="font-bold text-lg">Parrainages</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Rechercher par filleul ou formation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
          />
          <button
            onClick={() => router.push("/dashboard/parrainages/nouveau")}
            className="btn-primary whitespace-nowrap"
          >
            + Nouveau parrainage
          </button>
        </div>

        {loading ? (
          <p className="text-center text-sbbs-blue animate-pulse">Chargement...</p>
        ) : filtered.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">Aucun parrainage trouvé.</div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-sbbs-blue text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Filleul</th>
                  <th className="px-4 py-3 text-left">Formation</th>
                  <th className="px-4 py-3 text-left">Ambassadeur</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium">{p.filleul_prenom} {p.filleul_nom}</td>
                    <td className="px-4 py-3">{p.formation}</td>
                    <td className="px-4 py-3">{p.ambassadeurs?.prenom} {p.ambassadeurs?.nom}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statutColor[p.statut] ?? "bg-gray-100 text-gray-500"}`}>
                        {p.statut}
                      </span>
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
