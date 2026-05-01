"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "directeur" | "ambassadeur";

type Fichier = {
  id: string;
  nom: string;
  url: string;
  type: string;
  categorie: string;
  uploaded_by: string;
  role_uploader: string;
  branche?: string;
  taille?: number;
  created_at: string;
};

type Profile = {
  id: string;
  user_id: string;
  nom: string;
  prenom: string;
  branche?: string;
  table: string;
};

const CATEGORIES = {
  admin: [
    { key: "formation", label: "Formations & Procédures", icon: "📚", color: "#1A3A6C" },
  ],
  directeur: [
    { key: "formation", label: "Formations & Procédures", icon: "📚", color: "#1A3A6C" },
    { key: "branche", label: "Documents de Branche", icon: "🏫", color: "#92400E" },
  ],
  ambassadeur: [
    { key: "formation", label: "Formations & Procédures", icon: "📚", color: "#1A3A6C" },
    { key: "personnel", label: "Mes Documents", icon: "🪪", color: "#7C3AED" },
  ],
};

const TYPE_ICONS: Record<string, string> = {
  video: "🎬",
  audio: "🎵",
  document: "📄",
  image: "🖼️",
};

const formatSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const getFileType = (file: File): string => {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  return "document";
};

export default function MediathequePage() {
  const [role, setRole] = useState<UserRole>("ambassadeur");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategorie, setActiveCategorie] = useState("formation");

  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [loadingFichiers, setLoadingFichiers] = useState(false);

  // Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNom, setUploadNom] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  // Recherche
  const [search, setSearch] = useState("");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (profile) fetchFichiers();
  }, [activeCategorie, profile]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: dir } = await supabase.from("directeurs").select("*").eq("user_id", user.id).single();
    if (dir) {
      setRole("directeur");
      setProfile({ ...dir, table: "directeurs" });
      setLoading(false);
      return;
    }

    const { data: amb } = await supabase.from("ambassadeurs").select("*").eq("user_id", user.id).single();
    if (amb) {
      setRole("ambassadeur");
      setProfile({ ...amb, table: "ambassadeurs" });
      setLoading(false);
      return;
    }

    setRole("admin");
    setProfile({ id: user.id, user_id: user.id, nom: "Admin", prenom: "SBBS", table: "admin" });
    setLoading(false);
  };

  const fetchFichiers = useCallback(async () => {
    if (!profile) return;
    setLoadingFichiers(true);

    let query = supabase.from("fichiers").select("*").eq("categorie", activeCategorie).order("created_at", { ascending: false });

    // Ambassadeur : voit formations + ses propres docs personnels
    if (role === "ambassadeur" && activeCategorie === "personnel") {
      query = supabase.from("fichiers").select("*")
        .eq("categorie", "personnel")
        .eq("uploaded_by", profile.user_id)
        .order("created_at", { ascending: false });
    }

    // Directeur : voit les docs branche de sa branche uniquement
    if (role === "directeur" && activeCategorie === "branche") {
      query = supabase.from("fichiers").select("*")
        .eq("categorie", "branche")
        .eq("branche", profile.branche || "")
        .order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (!error && data) setFichiers(data);
    setLoadingFichiers(false);
  }, [activeCategorie, profile, role]);

  const handleUpload = async () => {
    if (!uploadFile || !profile) return;
    if (!uploadNom.trim()) { setUploadMsg("❌ Donnez un nom au fichier."); return; }
    if (uploadFile.size > 50 * 1024 * 1024) { setUploadMsg("❌ Fichier trop lourd (max 50MB)."); return; }

    setUploading(true);
    setUploadMsg("");

    const ext = uploadFile.name.split(".").pop()?.toLowerCase();
    const fileName = `${activeCategorie}/${profile.user_id}_${Date.now()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("fichiers")
      .upload(fileName, uploadFile, { upsert: false, contentType: uploadFile.type });

    if (storageError) {
      setUploadMsg("❌ Erreur upload : " + storageError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("fichiers").getPublicUrl(fileName);

    const { error: dbError } = await supabase.from("fichiers").insert({
      nom: uploadNom.trim(),
      url: urlData.publicUrl,
      type: getFileType(uploadFile),
      categorie: activeCategorie,
      uploaded_by: profile.user_id,
      role_uploader: role,
      branche: profile.branche || null,
      taille: uploadFile.size,
    });

    if (dbError) {
      setUploadMsg("❌ Erreur base de données : " + dbError.message);
      setUploading(false);
      return;
    }

    setUploadMsg("✅ Fichier ajouté avec succès !");
    setUploadFile(null);
    setUploadNom("");
    await fetchFichiers();
    setUploading(false);
    setTimeout(() => setUploadMsg(""), 3000);
  };

  const handleDelete = async (fichier: Fichier) => {
    if (!confirm(`Supprimer "${fichier.nom}" ?`)) return;

    // Extraire le path du fichier dans le bucket
    const path = fichier.url.split("/fichiers/")[1];
    if (path) await supabase.storage.from("fichiers").remove([path]);

    await supabase.from("fichiers").delete().eq("id", fichier.id);
    await fetchFichiers();
  };

  const canUpload = () => {
    if (role === "admin") return true;
    if (role === "directeur" && activeCategorie === "branche") return true;
    if (role === "ambassadeur" && activeCategorie === "personnel") return true;
    return false;
  };

  const canDelete = (fichier: Fichier) => {
    if (role === "admin") return true;
    return fichier.uploaded_by === profile?.user_id;
  };

  const filteredFichiers = fichiers.filter(f =>
    f.nom.toLowerCase().includes(search.toLowerCase())
  );

  const categories = CATEGORIES[role];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

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
            <h1 className="font-bold text-lg leading-none">Médiathèque</h1>
            <p className="text-xs text-blue-200 capitalize">{role}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Onglets catégories */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => { setActiveCategorie(cat.key); setSearch(""); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition border ${
                activeCategorie === cat.key
                  ? "text-white border-transparent"
                  : "bg-white text-gray-600 border-gray-200 hover:border-sbbs-blue"
              }`}
              style={activeCategorie === cat.key ? { backgroundColor: cat.color } : {}}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Zone upload */}
        {canUpload() && (
          <div className="card space-y-4">
            <h3 className="font-bold text-sbbs-blue">
              ⬆️ Ajouter un fichier
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du fichier</label>
              <input
                type="text"
                value={uploadNom}
                onChange={e => setUploadNom(e.target.value)}
                placeholder="Ex: Guide d'utilisation ambassadeur v2"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue"
              />
            </div>

            <div>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-sbbs-blue hover:bg-blue-50 transition">
                {uploadFile ? (
                  <div className="text-center">
                    <p className="text-2xl">{TYPE_ICONS[getFileType(uploadFile)]}</p>
                    <p className="text-sm font-medium text-sbbs-blue mt-1">{uploadFile.name}</p>
                    <p className="text-xs text-gray-400">{formatSize(uploadFile.size)}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-3xl mb-1">📁</p>
                    <p className="text-sm text-gray-500">Cliquez pour choisir un fichier</p>
                    <p className="text-xs text-gray-400 mt-0.5">Vidéo, Audio, PDF, Image — Max 50MB</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            {uploadMsg && (
              <p className={`text-sm font-medium px-3 py-2 rounded-lg ${uploadMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {uploadMsg}
              </p>
            )}

            <button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadNom.trim() || uploading}
              className="btn-primary w-full py-3 disabled:opacity-50"
            >
              {uploading ? "Upload en cours..." : "⬆️ Envoyer le fichier"}
            </button>
          </div>
        )}

        {/* Recherche */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un fichier..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue bg-white"
          />
        </div>

        {/* Liste fichiers */}
        <div className="space-y-3">
          {loadingFichiers ? (
            <p className="text-center text-sbbs-blue animate-pulse py-8">Chargement...</p>
          ) : filteredFichiers.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">Aucun fichier dans cette catégorie</p>
              {canUpload() && <p className="text-sm mt-1">Ajoutez votre premier fichier ci-dessus</p>}
            </div>
          ) : (
            filteredFichiers.map(fichier => (
              <div key={fichier.id} className="card flex items-center gap-4">
                {/* Icône type */}
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                  {TYPE_ICONS[fichier.type] || "📄"}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sbbs-blue text-sm truncate">{fichier.nom}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400 capitalize">{fichier.type}</span>
                    {fichier.taille && <span className="text-xs text-gray-400">· {formatSize(fichier.taille)}</span>}
                    <span className="text-xs text-gray-400">· {formatDate(fichier.created_at)}</span>
                    {fichier.branche && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{fichier.branche}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Aperçu / Lecture */}
                  {fichier.type === "video" ? (
                    <a
                      href={fichier.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-sbbs-blue text-white text-xs px-3 py-2 rounded-lg hover:bg-blue-800 transition font-medium"
                    >
                      ▶️ Voir
                    </a>
                  ) : fichier.type === "audio" ? (
                    <a
                      href={fichier.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-purple-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      🎵 Écouter
                    </a>
                  ) : (
                    <a
                      href={fichier.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-gray-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                      👁️ Ouvrir
                    </a>
                  )}

                  {/* Télécharger */}
                  <a
                    href={fichier.url}
                    download={fichier.nom}
                    className="flex items-center gap-1 bg-green-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    ⬇️
                  </a>

                  {/* Supprimer */}
                  {canDelete(fichier) && (
                    <button
                      onClick={() => handleDelete(fichier)}
                      className="flex items-center gap-1 bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg hover:bg-red-100 transition font-medium"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
