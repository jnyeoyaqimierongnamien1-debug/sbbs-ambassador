"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "directeur" | "ambassadeur";

type Apport = {
  id: string;
  investisseur_nom: string;
  investisseur_telephone: string;
  type_investissement: "obligation" | "parts";
  montant: number;
  commission: number;
  statut: "En attente" | "Confirmé" | "Payé";
  apporteur_type: string;
  notes: string;
  created_at: string;
};

type Profile = {
  id: string;
  user_id: string;
  nom: string;
  prenom: string;
  branche?: string;
  ip_certifie?: boolean;
};

const formatMontant = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export default function IPPage() {
  const [role, setRole] = useState<UserRole>("ambassadeur");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apports, setApports] = useState<Apport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"apports" | "certifies">("apports");

  // Form
  const [investisseurNom, setInvestisseurNom] = useState("");
  const [investisseurTel, setInvestisseurTel] = useState("");
  const [typeInv, setTypeInv] = useState<"obligation" | "parts">("obligation");
  const [montant, setMontant] = useState("");
  const [notes, setNotes] = useState("");

  // Certifiés (admin seulement)
  const [ambassadeurs, setAmbassadeurs] = useState<any[]>([]);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: dir } = await supabase.from("directeurs").select("*").eq("user_id", user.id).single();
    if (dir) { setRole("directeur"); setProfile({ ...dir, user_id: user.id }); setLoading(false); fetchApports("directeur", dir); return; }

    const { data: amb } = await supabase.from("ambassadeurs").select("*").eq("user_id", user.id).single();
    if (amb) { setRole("ambassadeur"); setProfile({ ...amb, user_id: user.id }); setLoading(false); fetchApports("ambassadeur", amb); return; }

    setRole("admin");
    setProfile({ id: user.id, user_id: user.id, nom: "Admin", prenom: "SBBS" });
    setLoading(false);
    fetchApports("admin", null);
    fetchAmbassadeurs();
  };

  const fetchApports = useCallback(async (r: string, p: any) => {
    let query = supabase.from("ip_apports").select("*").order("created_at", { ascending: false });
    if (r === "ambassadeur" && p) query = query.eq("apporteur_id", p.id).eq("apporteur_type", "ambassadeur");
    if (r === "directeur" && p) query = query.eq("directeur_id", p.id);
    const { data } = await query;
    setApports(data || []);
  }, []);

  const fetchAmbassadeurs = async () => {
    const { data } = await supabase.from("ambassadeurs").select("id, nom, prenom, branche, ip_certifie").order("nom");
    setAmbassadeurs(data || []);
  };

  const toggleCertifie = async (ambId: string, current: boolean) => {
    await supabase.from("ambassadeurs").update({ ip_certifie: !current }).eq("id", ambId);
    fetchAmbassadeurs();
  };

  const updateStatut = async (id: string, statut: string) => {
    await supabase.from("ip_apports").update({ statut }).eq("id", id);
    if (profile) fetchApports(role, profile);
  };

  const handleSubmit = async () => {
    if (!investisseurNom || !montant || !profile) return;

    const montantNum = parseInt(montant.replace(/\s/g, ""));
    const minimum = typeInv === "obligation" ? 2000000 : 5000000;

    if (montantNum < minimum) {
      alert(`Le montant minimum pour ${typeInv === "obligation" ? "une obligation" : "une prise de parts"} est de ${formatMontant(minimum)}`);
      return;
    }

    setSaving(true);
    const payload: any = {
      investisseur_nom: investisseurNom,
      investisseur_telephone: investisseurTel,
      type_investissement: typeInv,
      montant: montantNum,
      statut: "En attente",
      notes,
    };

    if (role === "ambassadeur") {
      payload.apporteur_id = profile.id;
      payload.apporteur_type = "ambassadeur";
    } else if (role === "directeur") {
      payload.directeur_id = profile.id;
      payload.apporteur_type = "directeur";
    }

    await supabase.from("ip_apports").insert(payload);
    setInvestisseurNom(""); setInvestisseurTel(""); setMontant(""); setNotes("");
    setShowForm(false);
    setSaving(false);
    fetchApports(role, profile);
  };

  const totalCommissions = apports.reduce((s, a) => s + (a.commission || 0), 0);
  const totalPayees = apports.filter(a => a.statut === "Payé").reduce((s, a) => s + (a.commission || 0), 0);
  const totalAttente = apports.filter(a => a.statut !== "Payé").reduce((s, a) => s + (a.commission || 0), 0);
  const minimum = typeInv === "obligation" ? 2000000 : 5000000;
  const commissionEstimee = montant ? Math.floor(parseInt(montant.replace(/\s/g, "") || "0") * 0.1) : 0;

  const peutSoumettre = role === "directeur" || (role === "ambassadeur" && profile?.ip_certifie) || role === "admin";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 shadow-lg"
        style={{ background: "linear-gradient(135deg, #1A3A6C 0%, #2563EB 100%)" }}>
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition shrink-0">← Retour</button>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md bg-sbbs-gold">
          <span className="text-xl">💼</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white text-sm leading-none">Groupe Intelligent Partnership</h1>
          <p className="text-xs text-blue-200 mt-0.5">Opportunités d'investissement · Commissions 10%</p>
        </div>
        <span className="text-xs font-bold text-white bg-sbbs-gold/30 px-2 py-1 rounded-lg capitalize">{role}</span>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Alerte ambassadeur non certifié */}
        {role === "ambassadeur" && !profile?.ip_certifie && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-bold text-amber-800 text-sm">Accès en cours de déblocage</p>
              <p className="text-amber-700 text-xs mt-1">Vous pourrez soumettre des apports IP après votre formation complète sur le Groupe IP. Contactez votre Directeur ou l'Administration.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total apports", value: apports.length, unit: "dossiers", color: "#1A3A6C" },
            { label: "Commissions payées", value: formatMontant(totalPayees), unit: "", color: "#16A34A" },
            { label: "En attente", value: formatMontant(totalAttente), unit: "", color: "#C9A84C" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
              {s.unit && <p className="text-xs text-gray-400">{s.unit}</p>}
            </div>
          ))}
        </div>

        {/* Info investissement */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-sbbs-blue text-sm mb-3">📋 Types d'investissement IP</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="font-bold text-sbbs-blue text-xs">📄 Obligation d'entreprise</p>
              <p className="text-xs text-gray-600 mt-1">Minimum : <strong>2 000 000 FCFA</strong></p>
              <p className="text-xs text-green-600 font-bold mt-1">Commission : 10%</p>
              <p className="text-xs text-gray-500 mt-1">Ex: 2M → 200 000 FCFA</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="font-bold text-sbbs-gold text-xs">🤝 Prise de parts</p>
              <p className="text-xs text-gray-600 mt-1">Minimum : <strong>5 000 000 FCFA</strong></p>
              <p className="text-xs text-green-600 font-bold mt-1">Commission : 10%</p>
              <p className="text-xs text-gray-500 mt-1">Ex: 5M → 500 000 FCFA</p>
            </div>
          </div>
        </div>

        {/* Tabs admin */}
        {role === "admin" && (
          <div className="flex bg-white rounded-2xl shadow-sm overflow-hidden">
            {[
              { id: "apports", label: "📋 Tous les apports" },
              { id: "certifies", label: "🏅 Certifications IP" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 text-sm font-semibold transition ${activeTab === tab.id ? "bg-sbbs-blue text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Certification ambassadeurs (admin) */}
        {role === "admin" && activeTab === "certifies" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-sbbs-blue text-sm">Certification IP des Ambassadeurs</p>
              <p className="text-xs text-gray-400 mt-0.5">Activez l'accès IP après formation complète</p>
            </div>
            {ambassadeurs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm">Aucun ambassadeur</p>
              </div>
            ) : ambassadeurs.map(amb => (
              <div key={amb.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full bg-sbbs-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {amb.prenom?.[0]}{amb.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{amb.prenom} {amb.nom}</p>
                  <p className="text-xs text-gray-400">{amb.branche}</p>
                </div>
                <button
                  onClick={() => toggleCertifie(amb.id, amb.ip_certifie)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    amb.ip_certifie
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {amb.ip_certifie ? "✅ Certifié IP" : "🔒 Non certifié"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Liste des apports */}
        {(role !== "admin" || activeTab === "apports") && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-sbbs-blue text-sm">Dossiers d'investissement</p>
              {peutSoumettre && (
                <button onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl text-white font-bold transition"
                  style={{ background: "linear-gradient(135deg, #1A3A6C, #2563EB)" }}>
                  + Nouveau dossier
                </button>
              )}
            </div>

            {apports.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="text-4xl mb-2">💼</p>
                <p className="text-sm font-medium">Aucun dossier pour le moment</p>
                {peutSoumettre && <p className="text-xs mt-1">Cliquez sur + Nouveau dossier pour commencer</p>}
              </div>
            ) : apports.map(apport => (
              <div key={apport.id} className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 text-sm">{apport.investisseur_nom}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        apport.type_investissement === "obligation"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {apport.type_investissement === "obligation" ? "Obligation" : "Prise de parts"}
                      </span>
                    </div>
                    {apport.investisseur_telephone && (
                      <p className="text-xs text-gray-400 mt-0.5">📱 {apport.investisseur_telephone}</p>
                    )}
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-xs text-gray-400">Montant souscrit</p>
                        <p className="font-bold text-sbbs-blue text-sm">{formatMontant(apport.montant)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Commission (10%)</p>
                        <p className="font-bold text-green-600 text-sm">{formatMontant(apport.commission)}</p>
                      </div>
                    </div>
                    {apport.notes && <p className="text-xs text-gray-500 mt-2 italic">{apport.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                      apport.statut === "Payé" ? "bg-green-100 text-green-700" :
                      apport.statut === "Confirmé" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {apport.statut}
                    </span>
                    {role === "admin" && (
                      <select
                        value={apport.statut}
                        onChange={e => updateStatut(apport.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sbbs-blue">
                        <option>En attente</option>
                        <option>Confirmé</option>
                        <option>Payé</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sbbs-blue">Nouveau dossier IP</p>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Type */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Type d'investissement</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "obligation", label: "📄 Obligation", desc: "Min. 2 000 000 FCFA" },
                    { value: "parts", label: "🤝 Prise de parts", desc: "Min. 5 000 000 FCFA" },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => { setTypeInv(opt.value as any); setMontant(""); }}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        typeInv === opt.value ? "border-sbbs-blue bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Investisseur */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom de l'investisseur *</label>
                <input type="text" value={investisseurNom} onChange={e => setInvestisseurNom(e.target.value)}
                  placeholder="Nom complet de l'investisseur"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                <input type="tel" value={investisseurTel} onChange={e => setInvestisseurTel(e.target.value)}
                  placeholder="+225 XX XX XX XX XX"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
              </div>

              {/* Montant */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Montant souscrit * <span className="text-gray-400 font-normal">(min. {formatMontant(minimum)})</span>
                </label>
                <input type="number" value={montant} onChange={e => setMontant(e.target.value)}
                  placeholder={`Minimum ${minimum.toLocaleString()}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue" />
                {montant && parseInt(montant) >= minimum && (
                  <div className="mt-2 bg-green-50 rounded-xl px-3 py-2">
                    <p className="text-xs text-green-700 font-bold">
                      ✅ Votre commission : {formatMontant(commissionEstimee)}
                    </p>
                  </div>
                )}
                {montant && parseInt(montant) < minimum && (
                  <p className="text-xs text-red-500 mt-1">
                    Montant insuffisant — minimum requis : {formatMontant(minimum)}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Informations complémentaires..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue resize-none" />
              </div>

              <button onClick={handleSubmit} disabled={saving || !investisseurNom || !montant}
                className="w-full py-3 rounded-2xl text-white font-bold text-sm transition disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #1A3A6C, #2563EB)" }}>
                {saving ? "Enregistrement..." : "Soumettre le dossier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
