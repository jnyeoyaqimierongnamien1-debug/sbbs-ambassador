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

// Direction Commerciale & Marketing Physique — contacts fixes
const DIRECTION_CONTACTS = {
  whatsapp: "+2250101536402",
  telephone: "+2252150008911",
  nom: "Direction Commerciale & Marketing",
};

type TabKey = "profil" | "motdepasse" | "photo" | "qrcode" | "inviter" | "contact" | "codesecret" | "commissions";

export default function ParametresPage() {
  const [role, setRole] = useState<UserRole>("admin");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("profil");

  // Profil form
  const [formProfil, setFormProfil] = useState({ nom: "", prenom: "", telephone: "", zone: "", fonction: "" });
  const [savingProfil, setSavingProfil] = useState(false);
  const [profilMsg, setProfilMsg] = useState("");

  // Mot de passe form
  const [formMdp, setFormMdp] = useState({ nouveau: "", confirmer: "" });
  const [showMdp, setShowMdp] = useState(false);
  const [savingMdp, setSavingMdp] = useState(false);
  const [mdpMsg, setMdpMsg] = useState("");

  // Code secret
  const [formCodeSecret, setFormCodeSecret] = useState({ nouveau: "", confirmer: "" });
  const [savingCode, setSavingCode] = useState(false);
  const [codeMsg, setCodeMsg] = useState("");

  // Commissions
  const [rules, setRules] = useState<CommissionRule[]>(COMMISSION_RULES_DEFAULT);
  const [savingRules, setSavingRules] = useState(false);
  const [rulesMsg, setRulesMsg] = useState("");

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [photoMsg, setPhotoMsg] = useState("");

  // Inviter
  const [inviterMsg, setInviterMsg] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: dir } = await supabase.from("directeurs").select("*").eq("user_id", user.id).single();
    if (dir) {
      setRole("directeur");
      setProfile({ ...dir, table: "directeurs" });
      setFormProfil({ nom: dir.nom, prenom: dir.prenom, telephone: dir.telephone, zone: dir.zone || "", fonction: dir.fonction || "" });
      if (dir.photo_url) setPhotoPreview(dir.photo_url);
      setLoading(false);
      return;
    }

    const { data: amb } = await supabase.from("ambassadeurs").select("*").eq("user_id", user.id).single();
    if (amb) {
      setRole("ambassadeur");
      setProfile({ ...amb, table: "ambassadeurs" });
      setFormProfil({ nom: amb.nom, prenom: amb.prenom, telephone: amb.telephone, zone: amb.zone || "", fonction: "" });
      if (amb.photo_url) setPhotoPreview(amb.photo_url);
      setLoading(false);
      return;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    setRole("admin");
setProfile({ id: authUser?.id || "", nom: "Admin", prenom: "SBBS", telephone: "", email: authUser?.email || "", table: "admin" });
// Charger la photo admin depuis les métadonnées Auth
const adminPhotoUrl = user.user_metadata?.photo_url;
if (adminPhotoUrl) setPhotoPreview(adminPhotoUrl);
setLoading(false);
  };

  // ─── Lien de parrainage
  const getReferralLink = () => {
  if (!profile) return "";
  return `https://sbbs-ambassador.vercel.app/login?ref=${profile.id}`;
};

  // ─── Sauvegarder profil
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
      if (error) { setProfilMsg("❌ Erreur lors de la sauvegarde."); }
      else { setProfilMsg("✅ Profil mis à jour avec succès !"); }
    } else {
      setProfilMsg("✅ Profil admin mis à jour !");
    }
    setSavingProfil(false);
    setTimeout(() => setProfilMsg(""), 3000);
  };

  // ─── Changer mot de passe
  const handleChangeMdp = async () => {
    if (formMdp.nouveau.length < 6) { setMdpMsg("❌ Minimum 6 caractères."); return; }
    if (formMdp.nouveau !== formMdp.confirmer) { setMdpMsg("❌ Les mots de passe ne correspondent pas."); return; }
    setSavingMdp(true); setMdpMsg("");
    const { error } = await supabase.auth.updateUser({ password: formMdp.nouveau });
    if (error) { setMdpMsg("❌ Erreur : " + error.message); }
    else { setMdpMsg("✅ Mot de passe changé avec succès !"); setFormMdp({ nouveau: "", confirmer: "" }); }
    setSavingMdp(false);
    setTimeout(() => setMdpMsg(""), 3000);
  };

  // ─── Modifier code secret
  const handleSaveCodeSecret = async () => {
    if (formCodeSecret.nouveau.length < 4) { setCodeMsg("❌ Le code secret doit avoir au moins 4 chiffres."); return; }
    if (formCodeSecret.nouveau !== formCodeSecret.confirmer) { setCodeMsg("❌ Les codes ne correspondent pas."); return; }
    if (!profile || profile.table === "admin") { setCodeMsg("❌ Non disponible pour ce rôle."); return; }
    setSavingCode(true); setCodeMsg("");
    const { error } = await supabase.from(profile.table).update({ code_secret: formCodeSecret.nouveau }).eq("id", profile.id);
    if (error) { setCodeMsg("❌ Erreur : " + error.message); }
    else { setCodeMsg("✅ Code secret mis à jour !"); setFormCodeSecret({ nouveau: "", confirmer: "" }); }
    setSavingCode(false);
    setTimeout(() => setCodeMsg(""), 3000);
  };

  // ─── Sauvegarder règles commission
  const handleSaveRules = async () => {
    setSavingRules(true); setRulesMsg("");
    localStorage.setItem("sbbs_commission_rules", JSON.stringify(rules));
    setRulesMsg("✅ Règles de commission mises à jour !");
    setSavingRules(false);
    setTimeout(() => setRulesMsg(""), 3000);
  };

  // ─── Photo de profil (correctif complet)
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
    if (photoFile.size > 5 * 1024 * 1024) { setPhotoMsg("❌ La photo dépasse 5MB."); return; }
    setSavingPhoto(true); setPhotoMsg("");

    const ext = photoFile.name.split(".").pop()?.toLowerCase();
    const fileName = `${profile.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, photoFile, { upsert: true, contentType: photoFile.type });

    if (uploadError) {
      setPhotoMsg("❌ Erreur upload : " + uploadError.message);
      setSavingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const photoUrlDb = urlData.publicUrl;
    const photoUrlPreview = `${photoUrlDb}?t=${Date.now()}`; // cache-buster

    if (profile.table !== "admin") {
  const { error: dbError } = await supabase
    .from(profile.table)
    .update({ photo_url: photoUrlDb })
    .eq("id", profile.id);

  if (dbError) {
    setPhotoMsg("❌ Erreur base de données : " + dbError.message);
    setSavingPhoto(false);
    return;
  }
} else {
  // Pour l'admin : sauvegarde dans les métadonnées Supabase Auth
  const { error: metaError } = await supabase.auth.updateUser({
    data: { photo_url: photoUrlDb }
  });

  if (metaError) {
    setPhotoMsg("❌ Erreur sauvegarde admin : " + metaError.message);
    setSavingPhoto(false);
    return;
  }
}

    setPhotoPreview(photoUrlPreview);
    setPhotoFile(null);
    setPhotoMsg("✅ Photo de profil mise à jour !");
    setSavingPhoto(false);
    setTimeout(() => setPhotoMsg(""), 3000);
  };

  // ─── Copier lien de parrainage
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setInviterMsg("❌ Impossible de copier le lien.");
    }
  };

  // ─── Partager via WhatsApp
  const handleShareWhatsApp = () => {
    const msg = encodeURIComponent(
      `🎓 Je t'invite à rejoindre SBBS — la Business School de référence en Côte d'Ivoire !\n\nInscris-toi via mon lien : ${getReferralLink()}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // ─── Contacter Direction
  const handleContactWhatsApp = () => {
    const msg = encodeURIComponent("Bonjour, je vous contacte depuis l'application SBBS Ambassador.");
    window.open(`https://wa.me/${DIRECTION_CONTACTS.whatsapp.replace(/\+/g, "")}?text=${msg}`, "_blank");
  };

  const handleCallDirection = () => {
    window.open(`tel:${DIRECTION_CONTACTS.telephone}`, "_self");
  };

  // ─── QR Code URL
  const getQrUrl = () => {
    if (!profile) return "";
    const data = encodeURIComponent(getReferralLink());
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=1A3A6C&data=${data}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  const tabs: { key: TabKey; label: string; emoji: string; highlight?: boolean }[] = [
    { key: "profil", label: "Mon Profil", emoji: "👤" },
    { key: "motdepasse", label: "Mot de passe", emoji: "🔒" },
    { key: "photo", label: "Photo", emoji: "📸" },
    { key: "qrcode", label: "Mon QR Code", emoji: "📱" },
    { key: "inviter", label: "Inviter", emoji: "🤝" },
    { key: "contact", label: "Contact Direction", emoji: "📞" },
    ...(role !== "admin" ? [{ key: "codesecret" as TabKey, label: "Code Secret", emoji: "🔑", highlight: true }] : []),
    ...(role === "admin" ? [{ key: "commissions" as TabKey, label: "Commissions", emoji: "💰" }] : []),
  ];

  const msgClass = (msg: string) =>
    `text-sm font-medium px-3 py-2 rounded-lg ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-sbbs-red"}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

        {/* Carte résumé profil */}
        <div className="card mb-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sbbs-blue flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden border-2 border-sbbs-gold">
            {photoPreview ? (
              <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              `${profile?.prenom?.[0]}${profile?.nom?.[0]}`
            )}
          </div>
          <div>
            <p className="font-bold text-sbbs-blue text-lg">{profile?.prenom} {profile?.nom}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className="text-xs bg-sbbs-blue text-white px-2 py-0.5 rounded-full capitalize mt-1 inline-block">{role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition border ${
                activeTab === tab.key
                  ? "bg-sbbs-blue text-white border-sbbs-blue"
                  : tab.highlight
                  ? "bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-sbbs-blue"
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
            {role === "directeur" && (
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
            {profilMsg && <p className={msgClass(profilMsg)}>{profilMsg}</p>}
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
              <div className="relative">
                <input type={showMdp ? "text" : "password"} value={formMdp.nouveau}
                  onChange={e => setFormMdp(p => ({ ...p, nouveau: e.target.value }))}
                  placeholder="Min. 6 caractères"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue pr-10" />
                <button type="button" onClick={() => setShowMdp(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  {showMdp ? "Cacher" : "Voir"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input type={showMdp ? "text" : "password"} value={formMdp.confirmer}
                onChange={e => setFormMdp(p => ({ ...p, confirmer: e.target.value }))}
                placeholder="Répétez le mot de passe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
            </div>
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
                  {formMdp.nouveau.length < 6 ? "Trop court" : formMdp.nouveau.length < 9 ? "Faible" : formMdp.nouveau.length < 12 ? "Moyen" : "Fort"}
                </p>
              </div>
            )}
            {mdpMsg && <p className={msgClass(mdpMsg)}>{mdpMsg}</p>}
            <button onClick={handleChangeMdp} disabled={savingMdp} className="btn-primary w-full py-3">
              {savingMdp ? "Modification..." : "🔒 Changer le mot de passe"}
            </button>
          </div>
        )}

        {/* ─── PHOTO ─── */}
        {activeTab === "photo" && (
          <div className="card space-y-4">
            <h3 className="font-bold text-sbbs-blue text-lg">📸 Photo de profil</h3>
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-sbbs-blue flex items-center justify-center text-white text-4xl font-bold overflow-hidden border-4 border-sbbs-gold">
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  `${profile?.prenom?.[0]}${profile?.nom?.[0]}`
                )}
              </div>
            </div>
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
              <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">📄 {photoFile.name}</p>
            )}
            {photoMsg && <p className={msgClass(photoMsg)}>{photoMsg}</p>}
            <button onClick={handleSavePhoto} disabled={!photoFile || savingPhoto}
              className="btn-primary w-full py-3 disabled:opacity-50">
              {savingPhoto ? "Upload en cours..." : "📸 Enregistrer la photo"}
            </button>
          </div>
        )}

        {/* ─── QR CODE ─── */}
        {activeTab === "qrcode" && (
          <div className="card space-y-5">
            <h3 className="font-bold text-sbbs-blue text-lg">📱 Mon QR Code</h3>
            <p className="text-sm text-gray-500">
              Affiche ce QR code pour que tes prospects s'inscrivent directement via ton lien de parrainage.
            </p>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-2xl border-2 border-sbbs-gold shadow-sm inline-block">
                {profile && (
                  <img
                    src={getQrUrl()}
                    alt="QR Code de parrainage"
                    className="w-52 h-52"
                  />
                )}
              </div>
              <div className="text-center">
                <p className="font-bold text-sbbs-blue">{profile?.prenom} {profile?.nom}</p>
                <p className="text-xs text-gray-400 capitalize">{role} SBBS</p>
              </div>
            </div>

            {/* Lien */}
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">Mon lien de parrainage</p>
              <p className="text-xs text-sbbs-blue font-mono break-all">{getReferralLink()}</p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-sbbs-blue text-gray-700 text-sm font-medium py-3 rounded-xl transition"
              >
                {copiedLink ? "✅ Copié !" : "📋 Copier le lien"}
              </button>
              <button
                onClick={() => {
                  const link = getQrUrl();
                  const a = document.createElement("a");
                  a.href = link;
                  a.download = `QRCode_SBBS_${profile?.prenom}_${profile?.nom}.png`;
                  a.target = "_blank";
                  a.click();
                }}
                className="flex items-center justify-center gap-2 bg-sbbs-blue text-white text-sm font-medium py-3 rounded-xl hover:bg-blue-800 transition"
              >
                ⬇️ Télécharger
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              💡 Imprime ou partage ce QR code lors de tes événements et prospections
            </p>
          </div>
        )}

        {/* ─── INVITER ─── */}
        {activeTab === "inviter" && (
          <div className="card space-y-5">
            <h3 className="font-bold text-sbbs-blue text-lg">🤝 Inviter des collègues</h3>
            <p className="text-sm text-gray-500">
              Invite tes anciens collègues ou amis qui ont déjà fait SBBS à rejoindre le réseau d'ambassadeurs.
            </p>

            {/* Message personnalisé */}
            <div className="bg-blue-50 rounded-xl px-4 py-4 space-y-2">
              <p className="text-xs font-medium text-sbbs-blue mb-2">📝 Message d'invitation prêt à envoyer :</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                🎓 Salut ! Je suis maintenant <strong>Ambassadeur SBBS</strong> et je pense à toi.<br /><br />
                Tu as déjà fait SBBS — tu sais la valeur que ça apporte. Pourquoi ne pas rejoindre notre réseau d'ambassadeurs et générer des revenus en recommandant SBBS autour de toi ?<br /><br />
                Inscris-toi via mon lien : <span className="text-sbbs-blue font-mono text-xs break-all">{getReferralLink()}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleShareWhatsApp}
                className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.122 1.532 5.855L.057 23.5l5.834-1.53A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.792 9.792 0 01-5.028-1.389l-.361-.214-3.737.979.998-3.648-.235-.374A9.779 9.779 0 012.182 12C2.182 6.57 6.571 2.182 12 2.182S21.818 6.57 21.818 12 17.429 21.818 12 21.818z"/>
                </svg>
                Envoyer via WhatsApp
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:border-sbbs-blue text-gray-700 font-medium py-3 rounded-xl transition"
              >
                {copiedLink ? "✅ Lien copié !" : "📋 Copier le lien de parrainage"}
              </button>
            </div>

            {inviterMsg && <p className={msgClass(inviterMsg)}>{inviterMsg}</p>}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs text-amber-800 font-medium">
                💰 Rappel : chaque inscription via ton lien te génère une commission selon les règles de ta branche.
              </p>
            </div>
          </div>
        )}

        {/* ─── CONTACT DIRECTION ─── */}
        {activeTab === "contact" && (
          <div className="card space-y-5">
            <h3 className="font-bold text-sbbs-blue text-lg">📞 Contacter la Direction</h3>
            <p className="text-sm text-gray-500">
              Contacte directement la Direction Commerciale & Marketing Physique pour tout besoin opérationnel.
            </p>

            {/* Carte contact */}
            <div className="bg-blue-50 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sbbs-blue flex items-center justify-center text-white font-bold text-lg shrink-0">
                  DC
                </div>
                <div>
                  <p className="font-bold text-sbbs-blue text-sm">Direction Commerciale</p>
                  <p className="text-xs text-gray-500">& Marketing Physique — SBBS</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleContactWhatsApp}
                  className="w-full flex items-center gap-4 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-5 rounded-xl transition"
                >
                  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.122 1.532 5.855L.057 23.5l5.834-1.53A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.792 9.792 0 01-5.028-1.389l-.361-.214-3.737.979.998-3.648-.235-.374A9.779 9.779 0 012.182 12C2.182 6.57 6.571 2.182 12 2.182S21.818 6.57 21.818 12 17.429 21.818 12 21.818z"/>
                  </svg>
                  <div className="text-left">
                    <p className="font-bold text-sm">Message WhatsApp</p>
                    <p className="text-xs text-green-100">{DIRECTION_CONTACTS.whatsapp}</p>
                  </div>
                </button>

                <button
                  onClick={handleCallDirection}
                  className="w-full flex items-center gap-4 bg-sbbs-blue hover:bg-blue-800 text-white font-semibold py-4 px-5 rounded-xl transition"
                >
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-bold text-sm">Appel direct</p>
                    <p className="text-xs text-blue-200">{DIRECTION_CONTACTS.telephone}</p>
                  </div>
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Disponible du lundi au vendredi · 8h – 18h
            </p>
          </div>
        )}

        {/* ─── CODE SECRET (ambassadeurs & directeurs) ─── */}
        {activeTab === "codesecret" && role !== "admin" && (
          <div className="card space-y-4">
            {/* Bandeau d'alerte visuel */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-2xl">🔑</span>
              <div>
                <p className="font-bold text-amber-800 text-sm">Code Secret de vérification</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Ce code est utilisé pour valider tes inscriptions et confirmations de paiement. Ne le communique jamais à un tiers.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau code secret</label>
              <input
                type="password"
                inputMode="numeric"
                value={formCodeSecret.nouveau}
                onChange={e => setFormCodeSecret(p => ({ ...p, nouveau: e.target.value }))}
                placeholder="4 chiffres minimum"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 tracking-widest text-center text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le code secret</label>
              <input
                type="password"
                inputMode="numeric"
                value={formCodeSecret.confirmer}
                onChange={e => setFormCodeSecret(p => ({ ...p, confirmer: e.target.value }))}
                placeholder="Répète le code"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 tracking-widest text-center text-lg"
              />
            </div>

            {codeMsg && <p className={msgClass(codeMsg)}>{codeMsg}</p>}

            <button
              onClick={handleSaveCodeSecret}
              disabled={savingCode || !formCodeSecret.nouveau || !formCodeSecret.confirmer}
              className="w-full py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 transition disabled:opacity-50"
            >
              {savingCode ? "Sauvegarde..." : "🔑 Mettre à jour le code secret"}
            </button>
          </div>
        )}

        {/* ─── COMMISSIONS (Admin) ─── */}
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
                    <input type="number" value={rule.frais}
                      onChange={e => { const u = [...rules]; u[i] = { ...u[i], frais: Number(e.target.value) }; setRules(u); }}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Taux assisté (%)</label>
                    <input type="number" value={rule.taux_assiste}
                      onChange={e => { const u = [...rules]; u[i] = { ...u[i], taux_assiste: Number(e.target.value) }; setRules(u); }}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Chaud (FCFA)</label>
                    <input type="number" value={rule.commission_chaud}
                      onChange={e => { const u = [...rules]; u[i] = { ...u[i], commission_chaud: Number(e.target.value) }; setRules(u); }}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-xs text-sbbs-blue">
                  💡 Assisté : {Math.round(rule.frais * rule.taux_assiste / 100).toLocaleString()} FCFA · À chaud : {rule.commission_chaud.toLocaleString()} FCFA
                </div>
              </div>
            ))}

            {rulesMsg && <p className={msgClass(rulesMsg)}>{rulesMsg}</p>}
            <button onClick={handleSaveRules} disabled={savingRules} className="btn-primary w-full py-3">
              {savingRules ? "Sauvegarde..." : "💾 Sauvegarder les règles"}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
