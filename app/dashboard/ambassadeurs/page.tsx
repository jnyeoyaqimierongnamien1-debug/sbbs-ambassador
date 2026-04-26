"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Ambassadeur = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  ville: string;
  statut: string;
  created_at: string;
};

export default function AmbassadeursPage() {
  const [ambassadeurs, setAmbassadeurs] = useState<Ambassadeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("ambassadeurs")
        .select("*")
        .order("created_at", { ascending: false });

      setAmbassadeurs(data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = ambassadeurs.filter((a) =>
    `${a.nom} ${a.prenom} ${a.ville} ${a.telephone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard")} className="text-white hover:text-sbbs-gold transition">
          ← Retour
        </button>
        <h1 className="font-bold text-lg">Ambassadeurs</h1>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Barre de recherche + bouton ajouter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Rechercher par nom, ville, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
          />
          <button
            onClick={() => router.push("/dashboard/ambassadeurs/nouveau")}
            className="btn-primary whitespace-nowrap"
          >
            + Nouvel ambassadeur
          </button>
        </div>

        {/* Tableau */}
        {loading ? (
          <p className="text-center text-sbbs-blue animate-pulse">Chargement...</p>
        ) : filtered.length === 0 ? (
          <div className="card text-center text-gray-400 py-12">
            Aucun ambassadeur trouvé.
          </div>
        ) : (
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-sbbs-blue text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Nom & Prénom</th>
                  <th className="px-4 py-3 text-left">Téléphone</th>
                  <th className="px-4 py-3 text-left">Ville</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium">{a.prenom} {a.nom}</td>
                    <td className="px-4 py-3">{a.telephone}</td>
                    <td className="px-4 py-3">{a.ville}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        a.statut === "actif"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {a.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/dashboard/ambassadeurs/${a.id}`)}
                        className="text-sbbs-blue hover:underline text-sm font-medium"
                      >
                        Voir →
                      </button>
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
