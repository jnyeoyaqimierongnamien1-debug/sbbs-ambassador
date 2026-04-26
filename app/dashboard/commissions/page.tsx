"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Commission = {
  id: string;
  montant: number;
  statut: string;
  type_commission: string;
  created_at: string;
  ambassadeurs: {
    nom: string;
    prenom: string;
  };
};

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState("tous");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("commissions")
        .select("*, ambassadeurs(nom, prenom)")
        .order("created_at", { ascending: false });

      setCommissions(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = commissions.filter((c) =>
    filtre === "tous" ? true : c.statut === filtre
  );

  const totalEnAttente = commissions
    .filter((c) => c.statut === "en_attente")
    .reduce((s, c) => s + c.montant, 0);

  const totalPayee = commissions
    .filter((c) => c.statut === "payee")
    .reduce((s, c) => s + c.montant, 0);

  const handleValider = async (id: string) => {
    await supabase.from("commissions").update({ statut: "payee" }).eq("id", id);
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, statut: "payee" } : c))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard")} className="hover:text-sbbs-gold transition">
          ← Retour
        </button>
        <h1 className="font-bold text-lg">Commissions</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Résumé */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">
              {totalEnAttente.toLocaleString()} FCFA
            </p>
          </div>
          <div className="card border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Payées</p>
            <p className="text-2xl font-bold text-green-600">
              {totalPayee.toLocaleString()} FCFA
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {["tous", "en_attente", "payee"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltre(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                filtre === f
                  ? "bg-sbbs-blue text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:border-sbbs-blue"
              }`}
            >
              {f === "tous" ? "Toutes" : f === "en_attente" ? "En attente" : "Payées"}
            </button>
          ))}
        </div>

        {/* Tableau */}
        {loading ? (
          <p className="text-center text-sbbs-blue animate-pulse">Chargement...</p>
        ) : filtered.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">Aucune commission trouvée.</div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-sbbs-blue text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Ambassadeur</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium">
                      {c.ambassadeurs?.prenom} {c.ambassadeurs?.nom}
                    </td>
                    <td className="px-4 py-3">{c.type_commission}</td>
                    <td className="px-4 py-3 font-semibold text-sbbs-blue">
                      {c.montant.toLocaleString()} FCFA
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.statut === "payee"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {c.statut === "payee" ? "Payée" : "En attente"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.statut === "en_attente" && (
                        <button
                          onClick={() => handleValider(c.id)}
                          className="text-green-600 hover:underline text-sm font-medium"
                        >
                          Valider ✓
                        </button>
                      )}
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
