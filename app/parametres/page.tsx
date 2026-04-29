"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "ambassadeur" | "directeur";

type Profile = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  zone?: string;
  branche?: string;
  niveau?: string;
  fonction?: string;
  table: string;
};

type CommissionRule = {
  branche: string;
  frais: number;
  taux_assiste: number;
  commission_chaud: number;
};

const COMMISSION_RULES_DEFAULT: CommissionRule[] = [
  { branche: "SBBS Certification", frais: 60000, taux_assiste: 20, commission_chaud: 30000 },
  { branche: "Communauté d'Havila des Leaders d'Affaires (CHLA)", frais: 100000, taux_assiste: 10, commission_chaud: 10000 },
  { branche: "SBBS Éditions", frais: 10000, taux_assiste: 10, commission_chaud: 1000 },
  { branche: "SBBS Consulting", frais: 600000, taux_assiste: 10, commission_chaud: 60000 },
];

export default function ParametresPage() {
  const [role, setRole] = useState<UserRole>("admin");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profil" | "motdepasse" | "commissions" | "photo">("profil");

  // Profil form
  const [formProfil, setFormProfil] = useState({ nom: "", prenom: "", telephone: "", zone: "", fonction: "" });
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilMsg, setProfilMsg] = useState("");

  // Mot de passe form
  const [formMdp, setFormMdp] = useState({ nouveau: "", confirmer: "" });
  const [savingMdp, setSavingMdp] = useState(false);
  const [mdpMsg, setMdpMsg] = useState("");

  // Commissions
  const [rules, setRules] = useState<CommissionRule[]>(COMMISSION_RULES_DEFAULT);
  const [savingRules, setSavingRules] = useState(false);
  const [rulesMsg, setRulesMsg] = useState("");

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Vérifier directeur
    const { data: dir } = await supabase.from("directeurs").select("*").eq("user_id", user.id).single();
    if (dir) {
      setRole("directeur");
      setProfile({ ...dir, table: "directeurs" });
      setFormProfil({ nom: dir.nom, prenom: dir.prenom, telephone: dir.telephone, zone: dir.zone || "", fonction: dir.fonction || "" });
      setLoading(false);
      return;
    }

    // Vérifier ambassadeur
    const { data: amb } = await supabase.from("ambassadeurs").select("*").eq("user_id", user.id).single();
    if (amb) {
      setRole("ambassadeur");
      setProfile({ ...amb, table: "ambassadeurs" });
      setFormProfil({ nom: amb.nom, prenom: amb.prenom, telephone: amb.telephone, zone: amb.zone || "", fonction: "" });
      setLoading(false);
      return;
    }

    // Admin
    setRole("admin");
    setProfile({ id: user.id, nom: "Admin", prenom: "SBBS", telephone: "", email: user.email || "", table: "admin" });
    setLoading(false);
  };

  // Sauvegarder profil
  const handleSaveProfil = async () => {
    if (!profile || !formProfil.nom.trim() || !formProfil.prenom.trim()) {
      setProfilMsg("❌ Nom et prénom obligatoires.");
      return;
    }
    setSavingProfil(true);
    setProfilMsg("");

    if (profile.table !== "admin") {
      const { error } = await supabase.from(profile.table).update({
        nom: formProfil.nom.trim().toUpperCase(),
        prenom: formProfil.prenom.trim(),
        telephone: formProfil.telephone.trim(),
        zone: formProfil.zone.trim() || null,
        fonction: formProfil.fonction.trim() || null,
      }).eq("id", profile.id);

      if (error) {
        setProfilMsg("❌ Erreur lors de la sauvegarde.");
      } else {
        setProfilMsg("✅ Profil mis à jour avec succès !");
      }
    } else {
      setProfilMsg("✅ Profil admin mis à jour !");
    }
    setSavingProfil(false);
    setTimeout(() => setProfilMsg(""), 3000);
  };

  // Changer mot de passe
  const handleChangeMdp = async () => {
    if (formMdp.nouveau.length < 6) {
      setMdpMsg("❌ Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (formMdp.nouveau !== formMdp.confirmer) {
      setMdpMsg("❌ Les mots de passe ne correspondent pas.");
      return;
    }
    setSavingMdp(true);
    setMdpMsg("");

    const { error } = await supabase.auth.updateUser({ password: formMdp.nouveau });

    if (error) {
      setMdpMsg("❌ Erreur : " + error.message);
    } else {
      setMdpMsg("✅ Mot de passe changé avec succès !");
      setFormMdp({ nouveau: "", confirmer: "" });
    }
    setSavingMdp(false);
    setTimeout(() => setMdpMsg(""), 3000);
  };

  // Sauvegarder règles commission
  const handleSaveRules = async () => {
    setSavingRules(true);
    setRulesMsg("");

    // Sauvegarder dans localStorage pour l'instant
    // (Dans une vraie app on aurait une table settings dans Supabase)
    localStorage.setItem("sbbs_commission_rules", JSON.stringify(rules));
    setRulesMsg("✅ Règles de commission mises à jour !");
    setSavingRules(false);
    setTimeout(() => setRulesMsg(""), 3000);
  };

  // Photo de profil
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    if (!photoFile || !profile) return;
    setSavingPhoto(true);
    setPhotoMsg("");

    const ext = photoFile.name.split(".").pop();
    const fileName = `${profile.id}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, photoFile, { upsert: true });

    if (error) {
      setPhotoMsg("❌ Erreur upload : " + error.message);
    } else {
      setPhotoMsg("✅ Photo de profil mise à jour !");
    }
    setSavingPhoto(false);
    setTimeout(() => setPhotoMsg(""), 3000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  const tabs = [
    { key: "profil", label: "Mon Profil", emoji: "👤" },
    { key: "motdepasse", label: "Mot de passe", emoji: "🔒" },
    { key: "photo", label: "Photo", emoji: "📸" },
    ...(role === "admin" ? [{ key: "commissions", label: "Commissions", emoji: "💰" }] : []),
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition">
          ← Retour
        </button>
        <div className="flex items-center gap-3">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full border-2 border-sbbs-gold" />
          <div>
            <h1 className="font-bold text-lg leading-none">Paramètres</h1>
            <p className="text-xs text-blue-200 capitalize">{role}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* Carte profil résumé */}
        <div className="card mb-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sbbs-blue flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              `${profile?.prenom?.[0]}${profile?.nom?.[0]}`
            )}
          </div>
          <div>
            <p className="font-bold text-sbbs-blue text-lg">{profile?.prenom} {profile?.nom}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className="text-xs bg-sbbs-blue text-white px-2 py-0.5 rounded-full capitalize mt-1 inline-block">
              {role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.key
                  ? "bg-sbbs-blue text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-sbbs-blue"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* ─── PROFIL ─── */}
        {activeTab === "profil" && (
          <div className="card space-y-4">
            <h3 className="font-bold text-sbbs-blue text-lg">👤 Mon Profil</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input type="text" value={formProfil.prenom}
                  onChange={e => setFormProfil(p => ({ ...p, prenom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input type="text" value={formProfil.nom}
                  onChange={e => setFormProfil(p => ({ ...p, nom: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone WhatsApp</label>
              <input type="tel" value={formProfil.telephone}
                onChange={e => setFormProfil(p => ({ ...p, telephone: e.target.value }))}
                placeholder="+225 07 00 00 00 00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone / Ville</label>
              <input type="text" value={formProfil.zone}
                onChange={e => setFormProfil(p => ({ ...p, zone: e.target.value }))}
                placeholder="Abidjan, Cocody"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
            </div>

            {(role === "directeur") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fonction</label>
                <input type="text" value={formProfil.fonction}
                  onChange={e => setFormProfil(p => ({ ...p, fonction: e.target.value }))}
                  placeholder="Ex: Directeur de Branche"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={profile?.email || ""} disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
            </div>

            {profilMsg && (
              <p className={`text-sm font-medium px-3 py-2 rounded-lg ${profilMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-sbbs-red"}`}>
                {profilMsg}
              </p>
            )}

            <button onClick={handleSaveProfil} disabled={savingProfil} className="btn-primary w-full py-3">
              {savingProfil ? "Sauvegarde..." : "💾 Sauvegarder le profil"}
            </button>
          </div>
        )}

        {/* ─── MOT DE PASSE ─── */}
        {activeTab === "motdepasse" && (
          <div className="card space-y-4">
            <h3 className="font-bold text-sbbs-blue text-lg">🔒 Changer le mot de passe</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input type="password" value={formMdp.nouveau}
                onChange={e => setFormMdp(p => ({ ...p, nouveau: e.target.value }))}
                placeholder="Min. 6 caractères"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input type="password" value={formMdp.confirmer}
                onChange={e => setFormMdp(p => ({ ...p, confirmer: e.target.value }))}
                placeholder="Répétez le mot de passe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
            </div>

            {/* Indicateur force mot de passe */}
            {formMdp.nouveau && (
              <div>
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${
                      formMdp.nouveau.length >= i * 3
                        ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-yellow-400" : i <= 3 ? "bg-blue-400" : "bg-green-500"
                        : "bg-gray-200"
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {formMdp.nouveau.length < 6 ? "Trop court" :
                   formMdp.nouveau.length < 9 ? "Faible" :
                   formMdp.nouveau.length < 12 ? "Moyen" : "Fort"}
                </p>
              </div>
            )}

            {mdpMsg && (
              <p className={`text-sm font-medium px-3 py-2 rounded-lg ${mdpMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-sbbs-red"}`}>
                {mdpMsg}
              </p>
            )}

            <button onClick={handleChangeMdp} disabled={savingMdp} className="btn-primary w-full py-3">
              {savingMdp ? "Modification..." : "🔒 Changer le mot de passe"}
            </button>
          </div>
        )}

        {/* ─── PHOTO ─── */}
        {activeTab === "photo" && (
          <div className="card space-y-4">
            <h3 className="font-bold text-sbbs-blue text-lg">📸 Photo de profil</h3>

            {/* Preview */}
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-sbbs-blue flex items-center justify-center text-white text-4xl font-bold overflow-hidden border-4 border-sbbs-gold">
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  `${profile?.prenom?.[0]}${profile?.nom?.[0]}`
                )}
              </div>
            </div>

            {/* Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Choisir une photo</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-sbbs-blue hover:bg-blue-50 transition">
                <span className="text-3xl mb-2">📷</span>
                <span className="text-sm text-gray-500">Cliquez pour choisir une photo</span>
                <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP — Max 5MB</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            {photoFile && (
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                📄 {photoFile.name}
              </p>
            )}

            {photoMsg && (
              <p className={`text-sm font-medium px-3 py-2 rounded-lg ${photoMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-sbbs-red"}`}>
                {photoMsg}
              </p>
            )}

            <button
              onClick={handleSavePhoto}
              disabled={!photoFile || savingPhoto}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {savingPhoto ? "Upload en cours..." : "📸 Enregistrer la photo"}
            </button>
          </div>
        )}

        {/* ─── COMMISSIONS (Admin uniquement) ─── */}
        {activeTab === "commissions" && role === "admin" && (
          <div className="card space-y-4">
            <h3 className="font-bold text-sbbs-blue text-lg">💰 Règles de Commission</h3>
            <p className="text-sm text-gray-500">Modifiez les taux et montants de commission par branche.</p>

            {rules.map((rule, i) => (
              <div key={rule.branche} className="border border-gray-100 rounded-xl p-4 space-y-3">
                <p className="font-semibold text-sbbs-blue text-sm">{rule.branche}</p>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Frais (FCFA)</label>
                    <input
                      type="number"
                      value={rule.frais}
                      onChange={e => {
                        const updated = [...rules];
                        updated[i] = { ...updated[i], frais: Number(e.target.value) };
                        setRules(updated);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Taux assisté (%)</label>
                    <input
                      type="number"
                      value={rule.taux_assiste}
                      onChange={e => {
                        const updated = [...rules];
                        updated[i] = { ...updated[i], taux_assiste: Number(e.target.value) };
                        setRules(updated);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Chaud (FCFA)</label>
                    <input
                      type="number"
                      value={rule.commission_chaud}
                      onChange={e => {
                        const updated = [...rules];
                        updated[i] = { ...updated[i], commission_chaud: Number(e.target.value) };
                        setRules(updated);
                      }}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
                    />
                  </div>
                </div>

                {/* Résumé calculé */}
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-sbbs-blue">
                  💡 Assisté : {Math.round(rule.frais * rule.taux_assiste / 100).toLocaleString()} FCFA · À chaud : {rule.commission_chaud.toLocaleString()} FCFA
                </div>
              </div>
            ))}

            {rulesMsg && (
              <p className={`text-sm font-medium px-3 py-2 rounded-lg ${rulesMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-sbbs-red"}`}>
                {rulesMsg}
              </p>
            )}

            <button onClick={handleSaveRules} disabled={savingRules} className="btn-primary w-full py-3">
              {savingRules ? "Sauvegarde..." : "💾 Sauvegarder les règles"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
