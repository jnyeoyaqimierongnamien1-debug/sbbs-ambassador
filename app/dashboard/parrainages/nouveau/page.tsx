"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Ambassadeur = { id: string; nom: string; prenom: string };

export default function NouveauParrainagePage() {
  const [ambassadeurs, setAmbassadeurs] = useState<Ambassadeur[]>([]);
  const [form, setForm] = useState({
    ambassadeur_id: "",
    filleul_nom: "",
    filleul_prenom: "",
    filleul_telephone: "",
    formation: "",
    statut: "en_attente",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchAmbassadeurs = async () => {
      const { data } = await supabase
        .from("ambassadeurs")
        .select("id, nom, prenom")
        .eq("statut", "actif")
        .order("nom");
      setAmbassadeurs(data ?? []);
    };
    fetchAmbassadeurs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.ambassadeur_id || !form.filleul_nom || !form.filleul_prenom || !form.formation) {
      setError("Tous les champs obligatoires doivent être remplis.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.from("parrainages").insert([form]);

    if (error) {
      setError("Erreur lors de l'enregistrement. Réessaye.");
      setLoading(false);
      return;
    }

    router.push("/dashboard/parrainages");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard/parrainages")} className="hover:text-sbbs-gold transition">
          ← Retour
        </button>
        <h1 className="font-bold text-lg">Nouveau Parrainage</h1>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="card space-y-4">
          {/* Ambassadeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ambassadeur *</label>
            <select
              name="ambassadeur_id"
              value={form.ambassadeur_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
            >
              <option value="">-- Sélectionner un ambassadeur --</option>
              {ambassadeurs.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.prenom} {a.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Filleul */}
          {[
            { label: "Prénom du filleul *", name: "filleul_prenom", placeholder: "ex: Aya" },
            { label: "Nom du filleul *", name: "filleul_nom", placeholder: "ex: KOUASSI" },
            { label: "Téléphone du filleul", name: "filleul_telephone", placeholder: "ex: 05 00 00 00 00" },
            { label: "Formation *", name: "formation", placeholder: "ex: BTS Marketing" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type="text"
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
              />
            </div>
          ))}

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="statut"
              value={form.statut}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
            >
              <option value="en_attente">En attente</option>
              <option value="inscrit">Inscrit</option>
              <option value="confirme">Confirmé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>

          {error && <p className="text-sbbs-red text-sm text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? "Enregistrement..." : "Enregistrer le parrainage"}
          </button>
        </div>
      </main>
    </div>
  );
}
