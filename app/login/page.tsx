"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showSplash, setShowSplash]           = useState(true);
  const [email, setEmail]                     = useState("");
  const [password, setPassword]               = useState("");
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [installPrompt, setInstallPrompt]     = useState<any>(null);
  const [isInstalled, setIsInstalled]         = useState(false);
  const [installing, setInstalling]           = useState(false);

  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Détection PWA installable ───
  useEffect(() => {
    // Déjà installé ?
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    setInstalling(true);
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
    setInstalling(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: directeur } = await supabase
      .from("directeurs").select("id, statut").eq("user_id", user?.id).single();

    if (directeur) {
      if (directeur.statut === "En attente") {
        await supabase.auth.signOut();
        setError("PENDING");
        setLoading(false);
        return;
      }
      router.push("/directeur");
      return;
    }

    const { data: ambassadeur } = await supabase
      .from("ambassadeurs").select("id, statut").eq("user_id", user?.id).single();

    if (ambassadeur) {
      if (ambassadeur.statut === "En attente") {
        await supabase.auth.signOut();
        setError("PENDING");
        setLoading(false);
        return;
      }
      router.push("/espace");
      return;
    }

    router.push("/dashboard");
  };

  // ─── SPLASH SCREEN ───
  if (showSplash) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('/WhatsApp%20Image%202026-04-29%20at%2013.04.45.jpeg')` }} />
        <div className="absolute inset-0 bg-sbbs-blue/80" />
        <div className="relative z-10 text-center text-white px-6 animate-pulse">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS"
            className="w-28 h-28 rounded-full object-cover border-4 border-sbbs-gold mx-auto mb-6 shadow-2xl" />
          <h1 className="text-3xl font-bold mb-2">SBBS Ambassador</h1>
          <p className="text-sbbs-gold text-lg font-semibold mb-1">Intelligence et Expertise des Affaires</p>
          <p className="text-blue-200 text-sm">Groupe Intelligent Partnership</p>
          <div className="mt-10 flex justify-center gap-2">
            <div className="w-2 h-2 bg-sbbs-gold rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-sbbs-gold rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-sbbs-gold rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  // ─── PAGE LOGIN ───
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">

      <div className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('/pdg-sbbs%20.jpeg')` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-sbbs-blue/70 via-sbbs-blue/60 to-sbbs-blue/90" />

      <div className="relative z-10 w-full max-w-md mx-4">

        {/* ─── BOUTON INSTALLATION PWA ─── */}
        {!isInstalled && installPrompt && (
          <div className="mb-4">
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl font-bold text-sm shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #4B0082 0%, #7B2FBE 40%, #C9A84C 100%)",
                boxShadow: "0 8px 32px rgba(75,0,130,0.5), 0 2px 8px rgba(201,168,76,0.3)",
                color: "white",
                border: "1px solid rgba(201,168,76,0.4)",
              }}
            >
              {installing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Installation en cours...</span>
                </>
              ) : (
                <>
                  {/* Icône téléchargement */}
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold leading-none">Installer SBBS Ambassador</p>
                    <p className="text-xs text-white/70 mt-0.5">Accès rapide depuis votre écran d'accueil</p>
                  </div>
                  {/* Badge étoile royale */}
                  <div className="shrink-0 flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg">
                    <span className="text-sbbs-gold text-xs">★</span>
                    <span className="text-white text-xs font-bold">APP</span>
                  </div>
                </>
              )}
            </button>
          </div>
        )}

        {/* Badge "Déjà installé" */}
        {isInstalled && (
          <div className="mb-4 flex items-center justify-center gap-2 bg-green-500/20 border border-green-400/30 rounded-2xl py-2.5 px-4">
            <span className="text-green-400 text-lg">✓</span>
            <span className="text-green-300 text-sm font-semibold">Application installée sur votre appareil</span>
          </div>
        )}

        {/* En-tête */}
        <div className="text-center mb-6">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS"
            className="w-20 h-20 rounded-full object-cover border-4 border-sbbs-gold mx-auto mb-3 shadow-xl" />
          <h1 className="text-2xl font-bold text-white">SBBS Ambassador</h1>
          <p className="text-sbbs-gold text-sm font-semibold mt-1">Intelligence et Expertise des Affaires</p>
        </div>

        {/* Formulaire */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6">
          <h2 className="text-lg font-bold text-sbbs-blue mb-4 text-center">
            Connexion à votre espace
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="votre@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sbbs-blue text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-sbbs-blue text-sm" />
            </div>

            {error === "PENDING" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
                ⏳ <strong>Compte en cours de validation.</strong><br />
                Vous serez contacté(e) sous 24h sur votre WhatsApp.
              </div>
            )}
            {error && error !== "PENDING" && (
              <p className="text-sbbs-red text-sm text-center font-medium bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button onClick={handleLogin} disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button onClick={() => router.push("/devenir-ambassadeur")}
                className="text-sm px-3 py-2.5 rounded-lg border-2 border-sbbs-blue text-sbbs-blue font-semibold hover:bg-sbbs-blue hover:text-white transition text-center">
                🤝 Rejoindre le réseau
              </button>
              <button onClick={() => router.push("/devenir-directeur")}
                className="text-sm px-3 py-2.5 rounded-lg border-2 border-sbbs-gold text-sbbs-gold font-semibold hover:bg-sbbs-gold hover:text-white transition text-center">
                🏫 Espace Directeur
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-blue-200 mt-4">
          © {new Date().getFullYear()} SBBS — Groupe Intelligent Partnership
        </p>
      </div>
    </div>
  );
}
