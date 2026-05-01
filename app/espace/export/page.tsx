"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Ambassadeur = {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  zone: string;
  branche: string;
  niveau: string;
  statut: string;
  created_at: string;
};

type Filleul = {
  id: string;
  ambassadeur_id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  formation: string;
  montant: number;
  statut: string;
  date_inscription: string;
};

type RapportCommission = {
  ambassadeur: string;
  code: string;
  zone: string;
  branche: string;
  niveau: string;
  nb_filleuls: number;
  nb_confirmes: number;
  commission_due: number;
  commission_payee: number;
  solde: number;
};

type Mode = "admin" | "ambassadeur";

export default function ExportPage() {
  const [ambassadeurs, setAmbassadeurs] = useState<Ambassadeur[]>([]);
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [commissions, setCommissions] = useState<RapportCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("admin");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: amb } = await supabase
      .from("ambassadeurs").select("*").eq("user_id", user.id).single();

    const isAmbassadeur = !!amb;
    setMode(isAmbassadeur ? "ambassadeur" : "admin");

    const { data: ambData } = await supabase.from("ambassadeurs").select("*").order("nom");
    const { data: filleulsData } = await supabase.from("filleuls").select("*").order("created_at", { ascending: false });

    const allAmbassadeurs = ambData || [];
    const allFilleuls = filleulsData || [];

    const myFilleuls = isAmbassadeur ? allFilleuls.filter(f => f.ambassadeur_id === amb.id) : allFilleuls;
    const myAmbassadeurs = isAmbassadeur ? allAmbassadeurs.filter(a => a.id === amb.id) : allAmbassadeurs;

    setAmbassadeurs(myAmbassadeurs);
    setFilleuls(myFilleuls);

    const rapport: RapportCommission[] = (isAmbassadeur ? [amb] : allAmbassadeurs).map(a => {
      const mes = allFilleuls.filter(f => f.ambassadeur_id === a.id);
      const confirmes = mes.filter(f => f.statut === "Payé");
      const enAttente = mes.filter(f => ["En attente", "Inscrit"].includes(f.statut));
      return {
        ambassadeur: `${a.prenom} ${a.nom}`,
        code: a.code || "-", zone: a.zone || "-",
        branche: a.branche || "-", niveau: a.niveau || "-",
        nb_filleuls: mes.filter(f => f.statut !== "Annulé").length,
        nb_confirmes: confirmes.length,
        commission_due: enAttente.reduce((s, f) => s + (Number(f.montant) || 0), 0),
        commission_payee: confirmes.reduce((s, f) => s + (Number(f.montant) || 0), 0),
        solde: enAttente.reduce((s, f) => s + (Number(f.montant) || 0), 0),
      };
    });

    setCommissions(rapport);
    setLoading(false);
  };

  const exportCSV = (rapport: string) => {
    setExporting(`csv-${rapport}`);
    let csvContent = "";
    let filename = "";

    if (rapport === "filleuls") {
      const headers = ["Nom", "Prénom", "Téléphone", "Email", "Formation", "Montant (FCFA)", "Statut", "Date inscription"];
      const rows = filleuls.map(f => [f.nom, f.prenom || "-", f.telephone, f.email || "-", f.formation || "-", f.montant || 0, f.statut, f.date_inscription || "-"]);
      csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
      filename = "mes_filleuls_sbbs.csv";
    }
    if (rapport === "commissions") {
      const headers = ["Ambassadeur", "Code", "Zone", "Branche", "Niveau", "Nb filleuls", "Confirmés", "Commission due (FCFA)", "Commission payée (FCFA)", "Solde (FCFA)"];
      const rows = commissions.map(c => [c.ambassadeur, c.code, c.zone, c.branche, c.niveau, c.nb_filleuls, c.nb_confirmes, c.commission_due, c.commission_payee, c.solde]);
      csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
      filename = "mes_commissions_sbbs.csv";
    }

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  };

  const exportExcel = (rapport: string) => {
    setExporting(`excel-${rapport}`);
    let rows: (string | number)[][] = [];
    let filename = "";

    if (rapport === "filleuls") {
      rows = [
        ["Nom", "Prénom", "Téléphone", "Email", "Formation", "Montant (FCFA)", "Statut", "Date inscription"],
        ...filleuls.map(f => [f.nom, f.prenom || "-", f.telephone, f.email || "-", f.formation || "-", f.montant || 0, f.statut, f.date_inscription || "-"]),
      ];
      filename = "mes_filleuls_sbbs.xls";
    }
    if (rapport === "commissions") {
      rows = [
        ["Ambassadeur", "Code", "Zone", "Branche", "Niveau", "Nb filleuls", "Confirmés", "Commission due (FCFA)", "Commission payée (FCFA)", "Solde (FCFA)"],
        ...commissions.map(c => [c.ambassadeur, c.code, c.zone, c.branche, c.niveau, c.nb_filleuls, c.nb_confirmes, c.commission_due, c.commission_payee, c.solde]),
      ];
      filename = "mes_commissions_sbbs.xls";
    }

    let html = "<html><head><meta charset='UTF-8'></head><body><table border='1'>";
    rows.forEach((row, i) => {
      html += "<tr>";
      row.forEach(cell => {
        html += i === 0
          ? `<th style="background:#1A3A6C;color:white;font-weight:bold;padding:8px 10px">${cell}</th>`
          : `<td style="padding:6px 10px">${cell}</td>`;
      });
      html += "</tr>";
    });
    html += "</table></body></html>";

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setExporting(null);
  };

  const exportPDF = (rapport: string) => {
    setExporting(`pdf-${rapport}`);
    let titre = "";
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (rapport === "filleuls") {
      titre = "Mes Filleuls — SBBS Ambassador";
      headers = ["Nom & Prénom", "Téléphone", "Formation", "Montant", "Statut"];
      rows = filleuls.map(f => [`${f.prenom || ""} ${f.nom}`, f.telephone, f.formation || "-", `${(f.montant || 0).toLocaleString()} FCFA`, f.statut]);
    }
    if (rapport === "commissions") {
      titre = "Mes Commissions — SBBS Ambassador";
      headers = ["Filleuls", "Confirmés", "Commission due", "Commission payée", "Solde"];
      rows = commissions.map(c => [c.nb_filleuls, c.nb_confirmes, `${c.commission_due.toLocaleString()} FCFA`, `${c.commission_payee.toLocaleString()} FCFA`, `${c.solde.toLocaleString()} FCFA`]);
    }

    const date = new Date().toLocaleDateString("fr-FR");
    const colW = Math.floor(100 / headers.length);

    const html = `
    <html><head><meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
      .header { background: linear-gradient(135deg, #1A3A6C, #2563EB); color: white; padding: 18px 22px; border-radius: 12px; margin-bottom: 20px; }
      .header h1 { margin: 0; font-size: 18px; }
      .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.8; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { background: #1A3A6C; color: white; padding: 9px 8px; text-align: left; }
      td { padding: 7px 8px; border-bottom: 1px solid #f0f0f0; }
      tr:nth-child(even) td { background: #f8faff; }
      .footer { margin-top: 20px; font-size: 10px; color: #aaa; text-align: center; }
    </style></head><body>
      <div class="header">
        <h1>📊 ${titre}</h1>
        <p>Généré le ${date} — SBBS Ambassador Program</p>
      </div>
      <table>
        <thead><tr>${headers.map(h => `<th width="${colW}%">${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
      <div class="footer">© ${new Date().getFullYear()} SBBS — Tous droits réservés | Document confidentiel</div>
    </body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { win.print(); }, 500); }
    setExporting(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  const RAPPORTS = [
    { id: "filleuls", titre: "Mes Filleuls", description: `${filleuls.length} filleul(s)`, emoji: "🎓", accent: "#C9A84C", light: "#FFFBEB" },
    { id: "commissions", titre: "Mes Commissions", description: `${commissions.length} entrée(s)`, emoji: "💰", accent: "#16A34A", light: "#F0FDF4" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition">
          ← Retour
        </button>
        <div className="flex items-center gap-3">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full border-2 border-sbbs-gold" />
          <div>
            <h1 className="font-bold text-lg leading-none">Exports & Rapports</h1>
            <p className="text-xs text-blue-200">Excel · CSV · PDF</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        <p className="text-sm text-gray-500 mb-6">
          Téléchargez vos rapports personnels dans le format de votre choix.
        </p>

        <div className="space-y-4">
          {RAPPORTS.map(rapport => (
            <div
              key={rapport.id}
              className="card border-0 shadow-sm overflow-hidden"
              style={{ borderLeft: `4px solid ${rapport.accent}` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ backgroundColor: rapport.light }}
                >
                  {rapport.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-sbbs-blue text-base leading-tight">{rapport.titre}</h3>
                  <p className="text-xs text-gray-400">{rapport.description}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Excel */}
                <button
                  onClick={() => exportExcel(rapport.id)}
                  disabled={!!exporting}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-green-200 bg-green-50 hover:bg-green-500 hover:border-green-500 transition-all duration-200 disabled:opacity-40"
                >
                  <span className="text-base">📗</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-green-700 group-hover:text-white leading-none">Excel</p>
                    <p className="text-xs text-green-500 group-hover:text-green-100 leading-none mt-0.5">.xls</p>
                  </div>
                  {exporting === `excel-${rapport.id}` && <span className="text-xs animate-pulse ml-1">...</span>}
                </button>

                {/* CSV */}
                <button
                  onClick={() => exportCSV(rapport.id)}
                  disabled={!!exporting}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-600 hover:border-blue-600 transition-all duration-200 disabled:opacity-40"
                >
                  <span className="text-base">📄</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-blue-700 group-hover:text-white leading-none">CSV</p>
                    <p className="text-xs text-blue-400 group-hover:text-blue-100 leading-none mt-0.5">.csv</p>
                  </div>
                  {exporting === `csv-${rapport.id}` && <span className="text-xs animate-pulse ml-1">...</span>}
                </button>

                {/* PDF */}
                <button
                  onClick={() => exportPDF(rapport.id)}
                  disabled={!!exporting}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-600 hover:border-red-600 transition-all duration-200 disabled:opacity-40"
                >
                  <span className="text-base">📕</span>
                  <div className="text-left">
                    <p className="text-xs font-bold text-red-700 group-hover:text-white leading-none">PDF</p>
                    <p className="text-xs text-red-400 group-hover:text-red-100 leading-none mt-0.5">Imprimer</p>
                  </div>
                  {exporting === `pdf-${rapport.id}` && <span className="text-xs animate-pulse ml-1">...</span>}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 rounded-2xl p-4 text-sm text-sbbs-blue border border-blue-100">
          💡 <strong>Conseil :</strong> Utilisez <strong>Excel</strong> pour analyser vos données,
          <strong> CSV</strong> pour les importer ailleurs,
          et <strong>PDF</strong> pour imprimer ou partager.
        </div>
      </main>
    </div>
  );
}
