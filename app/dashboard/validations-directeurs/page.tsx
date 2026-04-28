"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Candidat = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  branche: string;
  zone: string;
  fonction: string;
  statut: string;
  created_at: string;
};

export default function ValidationsDirecteursPage() {
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchCandidats(); }, []);

  const fetchCandidats = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data } = await supabase
      .from("directeurs")
      .select("*")
      .eq("statut", "En attente")
      .order("created_at", { ascending: false });

    setCandidats(data || []);
    setLoading(false);
  };

  const handleValider = async (id: string) => {
    setProcessing(id);
    await supabase.from("directeurs").update({ statut: "Actif" }).eq("id", id);
    setProcessing(null);
    fetchCandidats();
  };

  const handleRejeter = async (id: string) => {
    if (!confirm("Rejeter et supprimer cette candidature ?")) return;
    setProcessing(id);
    await supabase.from("directeurs").delete().eq("id", id);
    setProcessing(null);
    fetchCandidats();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard")} className="text-blue-200 hover:text-white text-sm transition">
          ← Retour
        </button>
        <div className="flex items-center gap-3">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full border-2 border-sbbs-gold" />
          <h1 className="font-bold text-lg">Validations Directeurs de Branches</h1>
        </div>
        <span className="ml-auto bg-sbbs-red text-white text-xs font-bold px-2 py-1 rounded-full">
          {candidats.length} en attente
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {candidats.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">✅</p>
            <p className="font-medium text-lg">Aucune candidature en attente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">Appelez chaque candidat avant de valider ou rejeter.</p>

            {candidats.map(c => (
              <div key={c.id} className="card border border-yellow-200 bg-yellow-50/30">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-sbbs-blue text-lg">{c.prenom} {c.nom}</h3>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">⏳ En attente</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm mt-2">
                      <p>📞 <span className="font-semibold text-sbbs-blue">{c.telephone}</span></p>
                      <p>✉️ {c.email}</p>
                      <p>🏫 <span className="font-semibold">{c.branche}</span></p>
                      {c.zone && <p>📍 {c.zone}</p>}
                      {c.fonction && <p>💼 {c.fonction}</p>}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Inscrit le {new Date(c.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 min-w-[130px]">
                    <a
                      href={`https://wa.me/${c.telephone.replace(/\s+/g, "").replace(/^\+/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-center text-xs px-4 py-2 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
                    >
                      📲 Appeler WhatsApp
                    </a>
                    <button
                      onClick={() => handleValider(c.id)}
                      disabled={processing === c.id}
                      className="text-xs px-4 py-2 rounded-lg bg-sbbs-blue text-white font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                    >
                      {processing === c.id ? "..." : "✅ Valider"}
                    </button>
                    <button
                      onClick={() => handleRejeter(c.id)}
                      disabled={processing === c.id}
                      className="text-xs px-4 py-2 rounded-lg bg-red-50 text-sbbs-red font-semibold hover:bg-red-100 transition disabled:opacity-50"
                    >
                      {processing === c.id ? "..." : "❌ Rejeter"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
