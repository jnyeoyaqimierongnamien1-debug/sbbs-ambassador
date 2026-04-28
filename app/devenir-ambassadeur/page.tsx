"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const BRANCHES_SBBS = [
  "SBBS Certification",
  "SBBS Éditions",
  "SBBS Consulting",
  "SBBS International Language Institute",
  "Communauté d'Havila des Leaders d'Affaires (CHLA)",
  "SBBS Investment",
  "SBBS Kids",
  "Institut de Recherches Appliquées en Affaires",
  "Académie des Affaires",
  "SBBS Technologies",
];

export default function DevenirAmbassadeurPage() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nom: "", prenom: "", telephone: "", email: "",
    password: "", confirmPassword: "", zone: "",
    branche: "", promotion: "", fonction: "", domaine_activites: "",
  });

  const router = useRouter();
  const supabase = createClient();

  const setField = (key: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const insertAmbassadeur = async (userId: string) => {
    const initiales = `${form.prenom[0]}${form.nom[0]}`.toUpperCase();
    const code = `AMB-${initiales}-${Date.now().toString().slice(-4)}`;

    const { error: dbError } = await supabase.from("ambassadeurs").insert({
      user_id: userId,
      code,
      nom: form.nom.trim().toUpperCase(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      email: form.email.trim(),
      zone: form.zone.trim(),
      branche: form.branche || null,
      promotion: form.promotion.trim() || null,
      fonction: form.fonction.trim() || null,
      domaine_activites: form.domaine_activites.trim() || null,
      niveau: "Bronze",
      statut: "En attente",
    });

    await supabase.auth.signOut();
    setLoading(false);

    if (dbError) {
      setError(`Erreur : ${dbError.message}`);
      return;
    }
    setStep("success");
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.nom.trim() || !form.prenom.trim()) { setError("Nom et prénom obligatoires."); return; }
    if (!form.telephone.trim()) { setError("Le téléphone WhatsApp est obligatoire."); return; }
    if (!form.email.trim()) { setError("L'email est obligatoire."); return; }
    if (!form.zone.trim()) { setError("La zone / ville est obligatoire."); return; }
    if (form.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères."); return; }
    if (form.password !== form.confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }

    setLoading(true);

    // Vérifier si email déjà utilisé
    const { data: existing } = await supabase
      .from("ambassadeurs").select("id").eq("email", form.email.trim()).single();

    if (existing) {
      setError("Cet email est déjà enregistré. Connectez-vous ou utilisez un autre email.");
      setLoading(false);
      return;
    }

    // Tentative signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    if (!authError && authData.user) {
      await insertAmbassadeur(authData.user.id);
      return;
    }

    // Si compte Auth déjà existant, on tente signIn
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (!signInError && signInData.user) {
      await insertAmbassadeur(signInData.user.id);
      return;
    }

    setError("Cet email est déjà utilisé avec un autre mot de passe. Essayez de vous connecter.");
    setLoading(false);
  };

  if (step === "success") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-md text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-sbbs-blue mb-2">Demande envoyée !</h2>
        <p className="text-gray-600 mb-4">
          Votre demande a bien été reçue. L'équipe SBBS vous contactera
          sous <strong>24h</strong> sur votre WhatsApp pour vérification.
        </p>
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-sbbs-blue font-medium mb-6">
          📞 Gardez votre téléphone accessible.<br />
          Un appel de validation est attendu.
        </div>
        <button onClick={() => router.push("/login")} className="btn-primary w-full">
          Retour à la connexion
        </button>
        <p className="text-xs text-gray-400 mt-4">© {new Date().getFullYear()} SBBS — Tous droits réservés</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-8">
          <div className="inline-flex bg-sbbs-blue rounded-full w-16 h-16 items-center justify-center mb-4">
            <span className="text-sbbs-gold text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-sbbs-blue">Devenir Ambassadeur SBBS</h1>
          <p className="text-gray-500 text-sm mt-1">Remplissez ce formulaire pour rejoindre le réseau</p>
        </div>

        <div className="card space-y-4">

          {/* Obligatoire */}
          <div>
            <p className="text-xs font-bold text-sbbs-red uppercase tracking-wide mb-3">Informations obligatoires</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom *" type="text" value={form.prenom} onChange={setField("prenom")} placeholder="Jean" />
              <Field label="Nom *" type="text" value={form.nom} onChange={setField("nom")} placeholder="KOUASSI" />
            </div>
            <div className="mt-3">
              <Field label="Téléphone WhatsApp *" type="tel" value={form.telephone} onChange={setField("telephone")} placeholder="+225 07 00 00 00 00" />
            </div>
            <div className="mt-3">
              <Field label="Zone / Ville *" type="text" value={form.zone} onChange={setField("zone")} placeholder="Abidjan, Cocody" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Connexion */}
          <div>
            <p className="text-xs font-bold text-sbbs-blue uppercase tracking-wide mb-3">Identifiants de connexion</p>
            <Field label="Email *" type="email" value={form.email} onChange={setField("email")} placeholder="votre@email.com" />
            <div className="mt-3">
              <Field label="Mot de passe * (min. 6 caractères)" type="password" value={form.password} onChange={setField("password")} placeholder="••••••••" />
            </div>
            <div className="mt-3">
              <Field label="Confirmer le mot de passe *" type="password" value={form.confirmPassword} onChange={setField("confirmPassword")} placeholder="••••••••" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Optionnel */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Informations complémentaires (optionnel)</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branche SBBS</label>
              <select
                value={form.branche}
                onChange={setField("branche")}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue bg-white"
              >
                <option value="">— Sélectionnez votre branche —</option>
                {BRANCHES_SBBS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="mt-3">
              <Field label="Promotion / Année de formation" type="text" value={form.promotion} onChange={setField("promotion")} placeholder="Ex: Promotion 2023" />
            </div>
            <div className="mt-3">
              <Field label="Fonction" type="text" value={form.fonction} onChange={setField("fonction")} placeholder="Ex: Directeur Commercial" />
            </div>
            <div className="mt-3">
              <Field label="Domaine d'activités" type="text" value={form.domaine_activites} onChange={setField("domaine_activites")} placeholder="Ex: Commerce, IT, Agriculture..." />
            </div>
          </div>

          {error && (
            <p className="text-sbbs-red text-sm font-medium bg-red-50 px-3 py-2 rounded-lg">⚠️ {error}</p>
          )}

          <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? "Envoi en cours..." : "Soumettre ma candidature"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Déjà ambassadeur ?{" "}
            <span onClick={() => router.push("/login")} className="text-sbbs-blue font-semibold cursor-pointer hover:underline">
              Se connecter
            </span>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© {new Date().getFullYear()} SBBS — Tous droits réservés</p>
      </div>
    </div>
  );
}

function Field({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
    </div>
  );
}
