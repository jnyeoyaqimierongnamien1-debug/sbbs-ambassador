"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const router   = useRouter();
  const supabase = createClient();

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

    const { data: ambassadeur } = await supabase
      .from("ambassadeurs")
      .select("id, statut")
      .eq("user_id", user?.id)
      .single();
// Vérifier si c'est un directeur
const { data: directeur } = await supabase
  .from("directeurs")
  .select("id, statut")
  .eq("user_id", user?.id)
  .single();

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
    if (ambassadeur) {
      if (ambassadeur.statut === "En attente") {
        await supabase.auth.signOut();
        setError("PENDING");
        setLoading(false);
        return;
      }
      router.push("/espace");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex bg-sbbs-blue rounded-full w-16 h-16 items-center justify-center mb-4">
            <span className="text-sbbs-gold text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-sbbs-blue">SBBS Ambassador</h1>
          <p className="text-gray-500 text-sm mt-1">Connexion à votre espace</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="votre@email.com"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
            />
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

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>

          <p className="text-center text-sm text-gray-500 pt-1">
            Pas encore ambassadeur ?{" "}
            <span
              onClick={() => router.push("/devenir-ambassadeur")}
              className="text-sbbs-blue font-semibold cursor-pointer hover:underline"
            >
              Rejoindre le réseau
            </span>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} SBBS — Tous droits réservés
        </p>
      </div>
    </div>
  );
}
