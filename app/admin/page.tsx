"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import FilleulFormModal from "@/components/FilleulFormModal";

// ─── CHANGE CE CODE APRÈS DÉPLOIEMENT ───────────────────────
const ADMIN_SECRET = "SBBS@2026#Admin";
// ────────────────────────────────────────────────────────────

type Ambassadeur = { id: string; code: string; nom: string; prenom: string; telephone: string; email: string; zone: string; branche: string; niveau: string; statut: string; user_id: string; };
type Directeur = { id: string; nom: string; prenom: string; telephone: string; email: string; branche: string; zone: string; fonction: string; statut: string; user_id: string; };
type Filleul = { id: string; ambassadeur_id: string; nom: string; prenom: string; telephone: string; email: string; formation: string; montant: number; statut: string; date_inscription: string; created_at: string; type_parrainage: string; branche_filleul: string; };

const statutColors: Record<string, string> = {
  "En attente": "bg-yellow-100 text-yellow-800",
  "Inscrit": "bg-blue-100 text-blue-800",
  "Payé": "bg-green-100 text-green-800",
  "Annulé": "bg-red-100 text-red-800",
  "actif": "bg-green-100 text-green-800",
  "Actif": "bg-green-100 text-green-800",
  "suspendu": "bg-red-100 text-red-800",
  "Suspendu": "bg-red-100 text-red-800",
};

export default function AdminPage() {
  // ── Auth admin ──
  const [code, setCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // ── Data ──
  const [ambassadeurs, setAmbassadeurs] = useState<Ambassadeur[]>([]);
  const [directeurs, setDirecteurs] = useState<Directeur[]>([]);
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [loading, setLoading] = useState(false);

  // ── UI ──
  const [activeTab, setActiveTab] = useState<"overview" | "ambassadeurs" | "directeurs" | "filleuls" | "comptes">("overview");
  const [selectedAmb, setSelectedAmb] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFilleul, setEditingFilleul] = useState<Filleul | null>(null);
  const [search, setSearch] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleCodeSubmit = () => {
    if (code === ADMIN_SECRET) {
      setAuthenticated(true);
      setCodeError(false);
      fetchData();
    } else {
      setCodeError(true);
      setCode("");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const [{ data: ambs }, { data: dirs }, { data: fils }] = await Promise.all([
      supabase.from("ambassadeurs").select("*").order("nom"),
      supabase.from("directeurs").select("*").order("nom"),
      supabase.from("filleuls").select("*").order("created_at", { ascending: false }),
    ]);
    setAmbassadeurs(ambs || []);
    setDirecteurs(dirs || []);
    setFilleuls(fils || []);
    setLoading(false);
  };

  // ── Filleuls CRUD ──
  const handleSaveFilleul = async (form: any) => {
    const payload = {
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      email: form.email?.trim() || null,
      formation: form.formation?.trim() || null,
      branche_filleul: form.branche_filleul || null,
      type_parrainage: form.type_parrainage,
      montant: form.montant ? Number(form.montant) : null,
      statut: form.statut,
      date_inscription: form.date_inscription || null,
      ambassadeur_id: form.ambassadeur_id,
    };
    if (editingFilleul) {
      const { error } = await supabase.from("filleuls").update(payload).eq("id", editingFilleul.id);
      if (error) { alert("Erreur modification : " + error.message); return; }
    } else {
      const { error } = await supabase.from("filleuls").insert(payload);
      if (error) { alert("Erreur ajout : " + error.message); return; }
    }
    setShowForm(false);
    setEditingFilleul(null);
    fetchData();
  };

  const handleDeleteFilleul = async (id: string) => {
    if (!confirm("Supprimer définitivement ce filleul ?")) return;
    await supabase.from("filleuls").delete().eq("id", id);
    fetchData();
  };

  const handleUpdateStatutFilleul = async (id: string, statut: string) => {
    await supabase.from("filleuls").update({ statut }).eq("id", id);
    fetchData();
  };

  // ── Comptes Ambassadeurs ──
  const handleUpdateStatutAmb = async (id: string, statut: string) => {
    await supabase.from("ambassadeurs").update({ statut }).eq("id", id);
    fetchData();
  };

  const handleDeleteAmb = async (id: string) => {
    if (!confirm("Supprimer définitivement cet ambassadeur et tous ses filleuls ?")) return;
    await supabase.from("filleuls").delete().eq("ambassadeur_id", id);
    await supabase.from("ambassadeurs").delete().eq("id", id);
    fetchData();
  };

  // ── Comptes Directeurs ──
  const handleUpdateStatutDir = async (id: string, statut: string) => {
    await supabase.from("directeurs").update({ statut }).eq("id", id);
    fetchData();
  };

  const handleDeleteDir = async (id: string) => {
    if (!confirm("Supprimer définitivement ce directeur ?")) return;
    await supabase.from("directeurs").delete().eq("id", id);
    fetchData();
  };

  // ── Stats globales ──
  const totalFilleulsActifs = filleuls.filter(f => f.statut !== "Annulé").length;
  const totalPayes = filleuls.filter(f => f.statut === "Payé").length;
  const totalCommissions = filleuls.filter(f => f.statut === "Payé").reduce((s, f) => s + (Number(f.montant) || 0), 0);
  const totalAttente = filleuls.filter(f => ["En attente", "Inscrit"].includes(f.statut)).reduce((s, f) => s + (Number(f.montant) || 0), 0);
  const ambsEnAttente = ambassadeurs.filter(a => a.statut === "En attente").length;
  const dirsEnAttente = directeurs.filter(d => d.statut === "En attente").length;

  const filleulsFiltres = (selectedAmb ? filleuls.filter(f => f.ambassadeur_id === selectedAmb) : filleuls)
    .filter(f => search === "" || `${f.nom} ${f.prenom} ${f.telephone}`.toLowerCase().includes(search.toLowerCase()));

  const ambsFiltres = ambassadeurs.filter(a => search === "" || `${a.nom} ${a.prenom} ${a.telephone}`.toLowerCase().includes(search.toLowerCase()));
  const dirsFiltres = directeurs.filter(d => search === "" || `${d.nom} ${d.prenom} ${d.telephone}`.toLowerCase().includes(search.toLowerCase()));

  // ════════════════════════════════════════════════════════
  // ÉCRAN DE CODE SECRET
  // ════════════════════════════════════════════════════════
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0F0C29, #302B63, #24243e)" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>
              🔐
            </div>
            <h1 className="text-2xl font-bold text-white">Espace Admin</h1>
            <p className="text-sm mt-1" style={{ color: "#C9A84C" }}>SBBS — Accès restreint</p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
            <label className="block text-sm font-medium text-white/80 mb-2">Code secret</label>
            <div className="relative mb-4">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={e => { setCode(e.target.value); setCodeError(false); }}
                onKeyDown={e => e.key === "Enter" && handleCodeSubmit()}
                placeholder="Entrez votre code secret"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 pr-10"
                style={{ background: "rgba(255,255,255,0.15)", color: "white", border: codeError ? "1px solid #CC0000" : "1px solid rgba(255,255,255,0.2)" }}
              />
              <button onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-sm">
                {showCode ? "🙈" : "👁️"}
              </button>
            </div>

            {codeError && (
              <p className="text-red-400 text-xs mb-3 text-center">❌ Code incorrect. Réessayez.</p>
            )}

            <button onClick={handleCodeSubmit}
              className="w-full py-3 rounded-xl font-bold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1A3A6C, #2563EB)" }}>
              Accéder →
            </button>
          </div>

          <button onClick={() => router.push("/login")}
            className="w-full text-center text-xs text-white/40 mt-4 hover:text-white/60 transition">
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // TABLEAU DE BORD ADMIN
  // ════════════════════════════════════════════════════════
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement des données...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shadow-lg"
        style={{ background: "linear-gradient(135deg, #0F0C29, #302B63)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>👑</div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">Super Admin</h1>
            <p className="text-xs" style={{ color: "#C9A84C" }}>SBBS — Accès complet</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(ambsEnAttente + dirsEnAttente) > 0 && (
            <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-400/30 rounded-xl py-1 px-2.5">
              <span className="text-red-400 text-xs font-bold">{ambsEnAttente + dirsEnAttente}</span>
              <span className="text-red-300 text-xs">en attente</span>
            </div>
          )}
          <button onClick={() => setAuthenticated(false)}
            className="text-sm bg-white/10 text-white px-4 py-1.5 rounded-xl font-semibold hover:bg-white/20 transition">
            Verrouiller
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Stats globales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="card border-l-4 border-sbbs-blue text-center py-3">
            <p className="text-3xl font-bold text-sbbs-blue">{ambassadeurs.length}</p>
            <p className="text-xs text-gray-500 mt-1">Ambassadeurs</p>
            {ambsEnAttente > 0 && <p className="text-xs text-yellow-600 font-bold">{ambsEnAttente} en attente</p>}
          </div>
          <div className="card border-l-4 border-sbbs-gold text-center py-3">
            <p className="text-3xl font-bold text-sbbs-gold">{totalFilleulsActifs}</p>
            <p className="text-xs text-gray-500 mt-1">Filleuls actifs</p>
          </div>
          <div className="card border-l-4 border-sbbs-red text-center py-3">
            <p className="text-base font-bold text-sbbs-red">{totalAttente.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">En attente (FCFA)</p>
          </div>
          <div className="card border-l-4 border-green-500 text-center py-3">
            <p className="text-base font-bold text-green-600">{totalCommissions.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Commissions payées</p>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un nom, téléphone..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue bg-white" />
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
         {([
            { key: "overview", label: "Vue globale", emoji: "📊", alert: 0 },
            { key: "ambassadeurs", label: "Ambassadeurs", emoji: "👥", alert: 0 },
            { key: "directeurs", label: "Directeurs", emoji: "🏫", alert: 0 },
            { key: "filleuls", label: "Filleuls", emoji: "🎓", alert: 0 },
            { key: "comptes", label: "Comptes", emoji: "⚙️", alert: ambsEnAttente + dirsEnAttente },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`relative text-sm px-4 py-2 rounded-xl font-medium transition flex-shrink-0 ${activeTab === tab.key ? "bg-sbbs-blue text-white shadow-sm" : "bg-white text-gray-600 border border-gray-200 hover:border-sbbs-blue"}`}>
              {tab.emoji} {tab.label}
              {tab.alert > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {tab.alert}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-bold text-sbbs-blue mb-3">📈 Réseau global</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Total ambassadeurs</span><span className="font-bold">{ambassadeurs.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total directeurs</span><span className="font-bold">{directeurs.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total filleuls</span><span className="font-bold">{filleuls.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Filleuls payés</span><span className="font-bold text-green-600">{totalPayes}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Taux conversion</span><span className="font-bold text-sbbs-blue">{totalFilleulsActifs > 0 ? Math.round((totalPayes / totalFilleulsActifs) * 100) : 0}%</span></div>
                </div>
              </div>
              <div className="card">
                <h3 className="font-bold text-sbbs-blue mb-3">🏆 Top 5 Ambassadeurs</h3>
                {ambassadeurs.map(a => ({
                  ...a,
                  nb: filleuls.filter(f => f.ambassadeur_id === a.id && f.statut !== "Annulé").length
                })).sort((a, b) => b.nb - a.nb).slice(0, 5).map((a, i) => (
                  <div key={a.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm w-5">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                    <span className="text-sm flex-1 truncate">{a.prenom} {a.nom}</span>
                    <span className="text-xs font-bold text-sbbs-blue">{a.nb} filleuls</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AMBASSADEURS ── */}
        {activeTab === "ambassadeurs" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{ambsFiltres.length} ambassadeur(s) trouvé(s)</p>
            {ambsFiltres.map(a => (
              <div key={a.id} className="card border border-gray-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-sbbs-blue flex items-center justify-center text-white font-bold text-sm shrink-0">{a.prenom?.[0]}{a.nom?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sbbs-blue">{a.prenom} {a.nom}</p>
                    <p className="text-xs text-gray-500">📞 {a.telephone} · {a.zone} · {a.branche}</p>
                    <p className="text-xs text-gray-400">Code : {a.code} · {filleuls.filter(f => f.ambassadeur_id === a.id && f.statut !== "Annulé").length} filleuls</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColors[a.statut] || "bg-gray-100 text-gray-600"}`}>{a.statut}</span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {a.statut === "En attente" && (
                    <button onClick={() => handleUpdateStatutAmb(a.id, "Actif")}
                      className="text-xs px-3 py-1.5 rounded-xl bg-green-50 text-green-700 font-medium hover:bg-green-100 transition">
                      ✅ Valider
                    </button>
                  )}
                  {(a.statut === "Actif" || a.statut === "actif") && (
                    <button onClick={() => handleUpdateStatutAmb(a.id, "Suspendu")}
                      className="text-xs px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 font-medium hover:bg-yellow-100 transition">
                      🚫 Suspendre
                    </button>
                  )}
                  {(a.statut === "Suspendu" || a.statut === "suspendu") && (
                    <button onClick={() => handleUpdateStatutAmb(a.id, "Actif")}
                      className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-sbbs-blue font-medium hover:bg-blue-100 transition">
                      🔓 Réactiver
                    </button>
                  )}
                  <button onClick={() => handleDeleteAmb(a.id)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-sbbs-red font-medium hover:bg-red-100 transition">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DIRECTEURS ── */}
        {activeTab === "directeurs" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{dirsFiltres.length} directeur(s) trouvé(s)</p>
            {dirsFiltres.map(d => (
              <div key={d.id} className="card border border-gray-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: "linear-gradient(135deg, #4B0082, #7B2FBE)" }}>{d.prenom?.[0]}{d.nom?.[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sbbs-blue">{d.prenom} {d.nom}</p>
                    <p className="text-xs text-gray-500">📞 {d.telephone} · {d.branche}</p>
                    <p className="text-xs text-gray-400">{d.fonction || "Directeur"} · {d.zone}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColors[d.statut] || "bg-gray-100 text-gray-600"}`}>{d.statut}</span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {d.statut === "En attente" && (
                    <button onClick={() => handleUpdateStatutDir(d.id, "Actif")}
                      className="text-xs px-3 py-1.5 rounded-xl bg-green-50 text-green-700 font-medium hover:bg-green-100 transition">
                      ✅ Valider
                    </button>
                  )}
                  {(d.statut === "Actif" || d.statut === "actif") && (
                    <button onClick={() => handleUpdateStatutDir(d.id, "Suspendu")}
                      className="text-xs px-3 py-1.5 rounded-xl bg-yellow-50 text-yellow-700 font-medium hover:bg-yellow-100 transition">
                      🚫 Suspendre
                    </button>
                  )}
                  {(d.statut === "Suspendu" || d.statut === "suspendu") && (
                    <button onClick={() => handleUpdateStatutDir(d.id, "Actif")}
                      className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-sbbs-blue font-medium hover:bg-blue-100 transition">
                      🔓 Réactiver
                    </button>
                  )}
                  <button onClick={() => handleDeleteDir(d.id)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-sbbs-red font-medium hover:bg-red-100 transition">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FILLEULS ── */}
        {activeTab === "filleuls" && (
          <div>
            <div className="mb-4 flex gap-2">
              <select value={selectedAmb || ""} onChange={e => setSelectedAmb(e.target.value || null)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue">
                <option value="">— Tous les ambassadeurs —</option>
                {ambassadeurs.map(a => <option key={a.id} value={a.id}>{a.prenom} {a.nom}</option>)}
              </select>
              <button onClick={() => { setEditingFilleul(null); setShowForm(true); }}
                className="btn-primary text-sm px-4 py-2 rounded-xl shrink-0">
                + Ajouter
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-3">{filleulsFiltres.length} filleul(s)</p>
            <div className="space-y-2">
              {filleulsFiltres.length === 0 ? (
                <div className="card text-center text-gray-400 py-12">
                  <p className="text-5xl mb-3">🎓</p>
                  <p>Aucun filleul trouvé.</p>
                </div>
              ) : filleulsFiltres.map(f => {
                const amb = ambassadeurs.find(a => a.id === f.ambassadeur_id);
                return (
                  <div key={f.id} className="card border border-gray-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sbbs-blue">{f.prenom} {f.nom}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColors[f.statut] || "bg-gray-100 text-gray-600"}`}>{f.statut}</span>
                          {f.type_parrainage && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {f.type_parrainage === "À chaud" ? "🔥" : "🤝"} {f.type_parrainage}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">📞 {f.telephone}{f.branche_filleul ? ` · 🏫 ${f.branche_filleul}` : ""}{f.montant ? ` · 💰 ${Number(f.montant).toLocaleString()} FCFA` : ""}</p>
                        <p className="text-xs text-gray-400">Parrain : {amb ? `${amb.prenom} ${amb.nom}` : "-"}{f.date_inscription ? ` · 📅 ${f.date_inscription}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <select value={f.statut}
                        onChange={e => handleUpdateStatutFilleul(f.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sbbs-blue">
                        {["En attente", "Inscrit", "Payé", "Annulé"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => { setEditingFilleul(f); setShowForm(true); }}
                        className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-sbbs-blue font-medium hover:bg-blue-100 transition">
                        ✏️ Modifier
                      </button>
                      <button onClick={() => handleDeleteFilleul(f.id)}
                        className="text-xs px-3 py-1.5 rounded-xl bg-red-50 text-sbbs-red font-medium hover:bg-red-100 transition">
                        🗑️ Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COMPTES ── */}
        {activeTab === "comptes" && (
          <div className="space-y-4">
            {ambsEnAttente > 0 && (
              <div>
                <h3 className="font-bold text-yellow-700 mb-3">⏳ Ambassadeurs en attente de validation ({ambsEnAttente})</h3>
                <div className="space-y-2">
                  {ambassadeurs.filter(a => a.statut === "En attente").map(a => (
                    <div key={a.id} className="card border border-yellow-200 bg-yellow-50/30">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{a.prenom?.[0]}{a.nom?.[0]}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-sbbs-blue">{a.prenom} {a.nom}</p>
                          <p className="text-xs text-gray-500">📞 {a.telephone} · {a.email}</p>
                          <p className="text-xs text-gray-400">{a.zone} · {a.branche}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateStatutAmb(a.id, "Actif")}
                            className="text-xs px-3 py-2 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition">
                            ✅ Valider
                          </button>
                          <button onClick={() => handleDeleteAmb(a.id)}
                            className="text-xs px-3 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition">
                            ❌ Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dirsEnAttente > 0 && (
              <div>
                <h3 className="font-bold text-yellow-700 mb-3">⏳ Directeurs en attente de validation ({dirsEnAttente})</h3>
                <div className="space-y-2">
                  {directeurs.filter(d => d.statut === "En attente").map(d => (
                    <div key={d.id} className="card border border-yellow-200 bg-yellow-50/30">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                          style={{ background: "linear-gradient(135deg, #4B0082, #7B2FBE)" }}>{d.prenom?.[0]}{d.nom?.[0]}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-sbbs-blue">{d.prenom} {d.nom}</p>
                          <p className="text-xs text-gray-500">📞 {d.telephone} · {d.email}</p>
                          <p className="text-xs text-gray-400">{d.fonction} · {d.branche}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateStatutDir(d.id, "Actif")}
                            className="text-xs px-3 py-2 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition">
                            ✅ Valider
                          </button>
                          <button onClick={() => handleDeleteDir(d.id)}
                            className="text-xs px-3 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition">
                            ❌ Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ambsEnAttente === 0 && dirsEnAttente === 0 && (
              <div className="card text-center text-gray-400 py-12">
                <p className="text-5xl mb-3">✅</p>
                <p className="font-medium">Aucun compte en attente de validation.</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Modal filleul */}
      {showForm && (
        <FilleulFormModal
          initial={editingFilleul ? {
            nom: editingFilleul.nom,
            prenom: editingFilleul.prenom,
            telephone: editingFilleul.telephone,
            email: editingFilleul.email,
            formation: editingFilleul.formation,
            branche_filleul: editingFilleul.branche_filleul,
            type_parrainage: (editingFilleul.type_parrainage as any) || "Assisté",
            montant: String(editingFilleul.montant || ""),
            statut: editingFilleul.statut,
            date_inscription: editingFilleul.date_inscription,
          } : undefined}
          onSave={handleSaveFilleul}
          onCancel={() => { setShowForm(false); setEditingFilleul(null); }}
          isEditing={!!editingFilleul}
          ambassadeurs={ambassadeurs}
          defaultAmbassadeurId={selectedAmb || undefined}
        />
      )}

    </div>
  );
}
