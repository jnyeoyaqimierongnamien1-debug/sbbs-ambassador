"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NouvelAmbassadeurPage() {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    zone: "",
    branche: "",
    statut: "actif",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.telephone) {
      setError("Nom, prénom et téléphone sont obligatoires.");
      return;
    }
    setLoading(true);
    setError("");

    const { error } = await supabase.from("ambassadeurs").insert([form]);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard/ambassadeurs");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.push("/dashboard/ambassadeurs")} className="hover:text-sbbs-gold transition">
          ← Retour
        </button>
        <h1 className="font-bold text-lg">Nouvel Ambassadeur</h1>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="card space-y-4">
          {[
            { label: "Prénom", name: "prenom", type: "text", placeholder: "ex: Kouamé" },
            { label: "Nom", name: "nom", type: "text", placeholder: "ex: KONAN" },
            { label: "Téléphone", name: "telephone", type: "tel", placeholder: "ex: 07 00 00 00 00" },
            { label: "Email", name: "email", type: "email", placeholder: "ex: kouame@email.com" },
            { label: "Zone / Ville", name: "zone", type: "text", placeholder: "ex: Abidjan" },
            { label: "Branche SBBS", name: "branche", type: "text", placeholder: "ex: SBBS Certification" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                name={field.name}
                value={form[field.name as keyof typeof form]}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              name="statut"
              value={form.statut}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
            >
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>

          {error && <p className="text-sbbs-red text-sm text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? "Enregistrement..." : "Enregistrer l'ambassadeur"}
          </button>
        </div>
      </main>
    </div>
  );
}
