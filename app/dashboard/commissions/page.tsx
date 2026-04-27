"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Commission = {
  id: string;
  montant_commission: number;
  montant_vente: number;
  taux: number;
  statut_paiement: string;
  date_commission: string;
  ambassadeurs: { nom: string; prenom: string };
  filleuls: { nom: string; prenom: string };
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
        .select("*, ambassadeurs(nom, prenom), filleuls(nom, prenom)")
        .order("created_at", { ascending: false });

      setCommissions(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = commissions.filter((c) =>
    filtre === "tous" ? true : c.statut_paiement === filtre
  );

  const totalEnAttente = commissions
    .filter((c) => c.statut_paiement === "En attente")
    .reduce((s, c) => s + c.montant_commission, 0);

  const totalPayee = commissions
    .filter((c) => c.statut_paiement === "Payé")
    .reduce((s, c) => s + c.montant_commission, 0);

  const handleValider = async (id: string) => {
    await supabase.from("commissions").update({ statut_paiement: "Payé" }).eq("id", id);
    setCommissions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, statut_paiement: "Payé" } : c))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard")} className="hover:text-sbbs-gold transition">
          ← Retour
        </button>
        <div className="flex items-center gap-2">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full object-cover border-2 border-sbbs-gold" />
          <h1 className="font-bold text-lg">Commissions</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Résumé */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-2xl font-bold text-yellow-600">{totalEnAttente.toLocaleString()} FCFA</p>
          </div>
          <div className="card border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Payées</p>
            <p className="text-2xl font-bold text-green-600">{totalPayee.toLocaleString()} FCFA</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6">
          {[
            { val: "tous", label: "Toutes" },
            { val: "En attente", label: "En attente" },
            { val: "Payé", label: "Payées" },
          ].map((f) => (
            <button key={f.val} onClick={() => setFiltre(f.val)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                filtre === f.val
                  ? "bg-sbbs-blue text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:border-sbbs-blue"
              }`}>
              {f.label}
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
                  <th className="px-4 py-3 text-left">Filleul</th>
                  <th className="px-4 py-3 text-left">Montant vente</th>
                  <th className="px-4 py-3 text-left">Commission</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium">{c.ambassadeurs?.prenom} {c.ambassadeurs?.nom}</td>
                    <td className="px-4 py-3">{c.filleuls?.prenom} {c.filleuls?.nom}</td>
                    <td className="px-4 py-3">{c.montant_vente?.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3 font-bold text-sbbs-blue">{c.montant_commission?.toLocaleString()} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.statut_paiement === "Payé"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {c.statut_paiement}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.statut_paiement === "En attente" && (
                        <button onClick={() => handleValider(c.id)}
                          className="text-green-600 hover:underline text-sm font-medium">
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
