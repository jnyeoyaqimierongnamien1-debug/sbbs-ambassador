"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type Branche = {
  id: string;
  nom: string;
};

const BRANCHES = [
  "SBBS Certification",
  "Communauté d'Havila des Leaders d'Affaires (CHLA)",
  "SBBS Éditions",
  "SBBS Consulting",
  "SBBS SLAM",
  "SBBS KIDS",
];

function RegisterForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [parrain, setParrain] = useState<{ prenom: string; nom: string; branche: string } | null>(null);

  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    email: "",
    zone: "",
    branche: "",
    email_login: "",
    password: "",
    confirmer: "",
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const refId = searchParams.get("ref");
  const supabase = createClient();

  useEffect(() => {
    if (refId) fetchParrain(refId);
  }, [refId]);

  const fetchParrain = async (id: string) => {
    const { data } = await supabase
      .from("ambassadeurs")
      .select("prenom, nom, branche")
      .eq("id", id)
      .single();
    if (data) setParrain(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleStep1 = () => {
    if (!form.prenom.trim() || !form.nom.trim() || !form.telephone.trim() || !form.branche) {
      setError("Prénom, nom, téléphone et branche sont obligatoires.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.email_login.trim() || !form.password || !form.confirmer) {
      setError("Tous les champs sont obligatoires.");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (form.password !== form.confirmer) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError("");

    // 1. Créer le compte auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email_login.trim(),
      password: form.password,
    });

    if (authError) {
      setError("Erreur création compte : " + authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError("Erreur inattendue. Réessayez.");
      setLoading(false);
      return;
    }

    // 2. Générer un code ambassadeur unique
    const code = `AMB-${form.nom.substring(0, 2).toUpperCase()}${form.prenom.substring(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Insérer dans la table ambassadeurs
    const { error: dbError } = await supabase.from("ambassadeurs").insert({
      user_id: userId,
      nom: form.nom.trim().toUpperCase(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      email: form.email_login.trim(),
      zone: form.zone.trim() || null,
      branche: form.branche,
      code,
      statut: "En attente",
      niveau: "Bronze",
      parrain_id: refId || null,
    });

    if (dbError) {
      setError("Erreur enregistrement : " + dbError.message);
      await supabase.auth.admin?.deleteUser(userId);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
    setLoading(false);
  };

  // ─── SUCCESS ───
  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/Banni%C3%A8re%20bandeau.jpg')` }} />
        <div className="absolute inset-0 bg-sbbs-blue/85" />
        <div className="relative z-10 w-full max-w-md mx-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-sbbs-blue mb-2">Candidature envoyée !</h2>
            <p className="text-gray-600 mb-4">
              Bienvenue dans le réseau SBBS Ambassador, <strong>{form.prenom}</strong> !<br />
              Votre candidature est en cours de validation.
            </p>
            <div className="bg-blue-50 rounded-xl p-4 text-sm text-sbbs-blue mb-5">
              ⏳ Vous serez contacté(e) sous <strong>24h</strong> sur votre WhatsApp <strong>{form.telephone}</strong> pour finaliser votre intégration.
            </div>

            {/* Partage social */}
            <p className="text-xs text-gray-500 mb-3">En attendant, partagez SBBS autour de vous :</p>
            <div className="flex justify-center gap-3 mb-5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent("🎓 Je viens de rejoindre le réseau d'ambassadeurs SBBS — la Business School de référence en Côte d'Ivoire ! Rejoins-nous : https://sbbs-ambassador.vercel.app/register")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.122 1.532 5.855L.057 23.5l5.834-1.53A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.792 9.792 0 01-5.028-1.389l-.361-.214-3.737.979.998-3.648-.235-.374A9.779 9.779 0 012.182 12C2.182 6.57 6.571 2.182 12 2.182S21.818 6.57 21.818 12 17.429 21.818 12 21.818z"/></svg>
                WhatsApp
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://sbbs-ambassador.vercel.app/register")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://sbbs-ambassador.vercel.app/register")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </a>
            </div>

            <button
              onClick={() => router.push("/login")}
              className="btn-primary w-full py-3 rounded-xl"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-8">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('/Banni%C3%A8re%20bandeau.jpg')` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-sbbs-blue/80 via-sbbs-blue/70 to-sbbs-blue/90" />

      <div className="relative z-10 w-full max-w-md mx-4">

        {/* En-tête */}
        <div className="text-center mb-6">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS"
            className="w-20 h-20 rounded-full object-cover border-4 border-sbbs-gold mx-auto mb-3 shadow-xl" />
          <h1 className="text-2xl font-bold text-white">Rejoindre SBBS Ambassador</h1>
          <p className="text-sbbs-gold text-sm font-semibold mt-1">Intelligence et Expertise des Affaires</p>
        </div>

        {/* Bandeau parrain */}
        {parrain && (
          <div className="bg-sbbs-gold/20 border border-sbbs-gold/40 rounded-2xl px-4 py-3 mb-4 text-center">
            <p className="text-white text-sm">
              🤝 Vous êtes parrainé(e) par <strong className="text-sbbs-gold">{parrain.prenom} {parrain.nom}</strong>
            </p>
            <p className="text-blue-200 text-xs mt-0.5">{parrain.branche}</p>
          </div>
        )}

        {/* Indicateur étapes */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${step === 1 ? "bg-sbbs-gold text-white" : "bg-white/20 text-white"}`}>
            <span>1</span><span>Informations</span>
          </div>
          <div className="w-8 h-0.5 bg-white/30" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${step === 2 ? "bg-sbbs-gold text-white" : "bg-white/20 text-white"}`}>
            <span>2</span><span>Accès</span>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">

          {/* ÉTAPE 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-sbbs-blue text-center mb-2">Vos informations</h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
                  <input type="text" name="prenom" value={form.prenom} onChange={handleChange}
                    placeholder="Kouamé"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" name="nom" value={form.nom} onChange={handleChange}
                    placeholder="KONAN"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone WhatsApp *</label>
                <input type="tel" name="telephone" value={form.telephone} onChange={handleChange}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Zone / Ville</label>
                <input type="text" name="zone" value={form.zone} onChange={handleChange}
                  placeholder="Abidjan, Cocody"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Branche SBBS *</label>
                <select name="branche" value={form.branche} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue">
                  <option value="">-- Choisir une branche --</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {error && <p className="text-sbbs-red text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <button onClick={handleStep1} className="btn-primary w-full py-3 rounded-xl text-base">
                Continuer →
              </button>
            </div>
          )}

          {/* ÉTAPE 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-sbbs-blue text-center mb-2">Créer votre accès</h2>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email de connexion *</label>
                <input type="email" name="email_login" value={form.email_login} onChange={handleChange}
                  placeholder="votre@email.com"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 6 caractères"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
                <input type="password" name="confirmer" value={form.confirmer} onChange={handleChange}
                  placeholder="Répétez le mot de passe"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>

              {/* Récapitulatif */}
              <div className="bg-blue-50 rounded-xl px-4 py-3 text-xs text-sbbs-blue space-y-0.5">
                <p className="font-bold mb-1">📋 Récapitulatif</p>
                <p>👤 {form.prenom} {form.nom.toUpperCase()}</p>
                <p>📞 {form.telephone}</p>
                <p>🏫 {form.branche}</p>
                {form.zone && <p>📍 {form.zone}</p>}
              </div>

              {error && <p className="text-sbbs-red text-sm bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:border-sbbs-blue hover:text-sbbs-blue transition text-sm"
                >
                  ← Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 btn-primary py-3 rounded-xl text-sm disabled:opacity-50"
                >
                  {loading ? "Envoi..." : "🚀 S'inscrire"}
                </button>
              </div>
            </div>
          )}

          {/* Lien connexion */}
          <p className="text-center text-xs text-gray-400 mt-4">
            Déjà membre ?{" "}
            <button onClick={() => router.push("/login")} className="text-sbbs-blue font-semibold hover:underline">
              Se connecter
            </button>
          </p>
        </div>

        {/* Partage social */}
        <div className="mt-5 text-center">
          <p className="text-blue-200 text-xs mb-3">Partager SBBS Ambassador</p>
          <div className="flex justify-center gap-3">
            <a href={`https://wa.me/?text=${encodeURIComponent("🎓 Rejoins le réseau d'ambassadeurs SBBS ! https://sbbs-ambassador.vercel.app/register")}`}
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center hover:scale-110 transition">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.122 1.532 5.855L.057 23.5l5.834-1.53A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.792 9.792 0 01-5.028-1.389l-.361-.214-3.737.979.998-3.648-.235-.374A9.779 9.779 0 012.182 12C2.182 6.57 6.571 2.182 12 2.182S21.818 6.57 21.818 12 17.429 21.818 12 21.818z"/></svg>
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://sbbs-ambassador.vercel.app/register")}`}
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center hover:scale-110 transition">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent("🎓 Je rejoins le réseau SBBS Ambassador ! #SBBS #BusinessSchool #CotedIvoire")}&url=${encodeURIComponent("https://sbbs-ambassador.vercel.app/register")}`}
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-black flex items-center justify-center hover:scale-110 transition">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://sbbs-ambassador.vercel.app/register")}`}
              target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center hover:scale-110 transition">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-blue-200 mt-4">
          © {new Date().getFullYear()} SBBS — Groupe Intelligent Partnership
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-sbbs-blue">
        <p className="text-white font-semibold animate-pulse">Chargement...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
