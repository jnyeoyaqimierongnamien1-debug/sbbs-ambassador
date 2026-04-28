"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Ambassadeur = {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  zone: string;
  branche: string;
  niveau: string;
};

type ScriptData = {
  id: string;
  titre: string;
  categorie: string;
  emoji: string;
  contenu: (vars: Vars) => string;
};

type Vars = {
  prenom: string;
  nom: string;
  rang: number;
  nb_filleuls: number;
  nb_confirmes: number;
  commission_totale: number;
  branche: string;
  zone: string;
  niveau: string;
  jours_restants: number;
  filleuls_manquants: number;
};

const SCRIPTS: ScriptData[] = [
  {
    id: "recrutement",
    titre: "Invitation à devenir Ambassadeur",
    categorie: "Recrutement",
    emoji: "🤝",
    contenu: (v) => `Bonjour,

Je suis *${v.prenom} ${v.nom}*, Ambassadeur SBBS – ${v.branche}.

Je pense à toi aujourd'hui car je sais que tu as bénéficié de la formation SBBS et que tu as un vrai potentiel de leader.

🎯 *Deviens Ambassadeur SBBS !*
En recommandant la SBBS autour de toi, tu gagnes des commissions réelles sur chaque inscription confirmée.

✅ C'est simple
✅ C'est flexible
✅ C'est rémunéré

Pour t'inscrire : https://sbbs-ambassador.vercel.app/devenir-ambassadeur

L'équipe te contactera sous 24h pour validation. 📞

À bientôt !
*${v.prenom} ${v.nom}* | Ambassadeur SBBS 🏅`,
  },
  {
    id: "relance_filleul",
    titre: "Relance filleul non payé",
    categorie: "Relance",
    emoji: "⏰",
    contenu: (v) => `Bonjour,

Je me permets de te relancer concernant ton inscription à la *SBBS*.

Tu as déjà fait le premier pas en t'inscrivant — c'est courageux ! 💪

Il ne reste plus qu'à finaliser ton paiement pour rejoindre officiellement la prochaine promotion et débuter ta formation.

⚠️ Les places sont limitées et la date de clôture approche.

N'hésite pas à me contacter directement pour tout question :
📞 ${v.telephone_ambassadeur ?? "Mon numéro WhatsApp"}

Je reste disponible pour t'accompagner.

*${v.prenom} ${v.nom}* | Ambassadeur SBBS 🏅`,
  },
  {
    id: "confirmation",
    titre: "Confirmation d'inscription filleul",
    categorie: "Confirmation",
    emoji: "✅",
    contenu: (v) => `Félicitations ! 🎉

Ton inscription à la *SBBS* est officiellement confirmée !

Tu rejoins une communauté de leaders africains engagés dans leur développement personnel et professionnel.

📚 La SBBS te donnera les outils pour :
- Développer ton leadership
- Créer et gérer ton entreprise
- Bâtir un réseau solide

L'équipe SBBS te contactera très prochainement pour les détails pratiques.

Bienvenue dans la famille SBBS ! 🙌

*${v.prenom} ${v.nom}* | Ambassadeur SBBS 🏅`,
  },
  {
    id: "classement",
    titre: "Partage de classement",
    categorie: "Motivation",
    emoji: "🏆",
    contenu: (v) => `🏆 *Je suis N°${v.rang} du classement SBBS Ambassador ce mois-ci !*

${v.rang === 1 ? "👑 Première place !" : v.rang === 2 ? "🥈 Deuxième place !" : v.rang === 3 ? "🥉 Troisième place !" : `📊 Position #${v.rang}`}

📊 Mes stats du mois :
- ${v.nb_filleuls} filleul(s) parrainé(s)
- ${v.nb_confirmes} inscription(s) confirmée(s)
- ${v.commission_totale.toLocaleString()} FCFA de commissions 💰

Toi aussi tu peux devenir Ambassadeur SBBS et gagner des commissions en recommandant la formation à ton réseau !

👉 https://sbbs-ambassador.vercel.app/devenir-ambassadeur

*${v.prenom} ${v.nom}* | Ambassadeur ${v.niveau} SBBS 🏅`,
  },
  {
    id: "promotion_bonus",
    titre: "Promotion Bonus 100 000 FCFA",
    categorie: "Promotion",
    emoji: "🎁",
    contenu: (v) => `🔥 *OFFRE SPÉCIALE — SEMAINE DE PROMOTION SBBS !*

Bonjour,

Cette semaine uniquement, la SBBS lance un *DÉFI AMBASSADEUR* exceptionnel !

🎯 *Le défi :* Parrainer *3 filleuls ou plus* cette semaine
🎁 *La récompense :* Un bonus de *100 000 FCFA* au tirage !

⏳ Offre valable cette semaine seulement !

Je suis déjà à *${v.nb_filleuls} filleul(s)* ce mois-ci — rejoins-moi dans ce défi !

Pour devenir Ambassadeur :
👉 https://sbbs-ambassador.vercel.app/devenir-ambassadeur

Ne laisse pas passer cette opportunité ! 💪

*${v.prenom} ${v.nom}* | Ambassadeur ${v.niveau} SBBS 🏅`,
  },
  {
    id: "bienvenue",
    titre: "Bienvenue nouvel ambassadeur",
    categorie: "Onboarding",
    emoji: "🌟",
    contenu: (v) => `🌟 *Bienvenue dans l'équipe SBBS Ambassador !*

Bonjour,

Ton compte Ambassadeur SBBS vient d'être *validé* ! 🎉

Tu fais maintenant partie d'un réseau de leaders qui recommandent la meilleure école de business de Côte d'Ivoire.

🚀 *Tes prochaines étapes :*
1. Connecte-toi à ton espace : https://sbbs-ambassador.vercel.app/login
2. Commence à partager autour de toi
3. Enregistre tes filleuls depuis ton espace personnel

💰 Pour chaque filleul confirmé et payé, tu gagnes ta commission automatiquement.

Des questions ? Je suis là !
📞 ${v.telephone_ambassadeur ?? "Contact SBBS"}

*${v.prenom} ${v.nom}* | Ambassadeur SBBS 🏅`,
  },
  {
    id: "felicitations_podium",
    titre: "Félicitations Top 3 du mois",
    categorie: "Motivation",
    emoji: "🥇",
    contenu: (v) => `${v.rang === 1 ? "👑" : v.rang === 2 ? "🥈" : "🥉"} *FÉLICITATIONS ${v.prenom.toUpperCase()} !*

Tu termines ce mois à la *${v.rang === 1 ? "1ère" : `${v.rang}ème`} place* du classement SBBS Ambassador !

🏆 *Tes performances du mois :*
✅ ${v.nb_filleuls} filleuls parrainés
✅ ${v.nb_confirmes} confirmés
✅ ${v.commission_totale.toLocaleString()} FCFA gagnés

C'est le fruit de ton travail et de ton engagement. Continue sur cette lancée le mois prochain !

L'équipe SBBS est fière de toi. 💙

*${v.prenom} ${v.nom}* | Ambassadeur ${v.niveau} SBBS 🏅`,
  },
  {
    id: "motivation_inactif",
    titre: "Relance ambassadeur inactif",
    categorie: "Motivation",
    emoji: "💪",
    contenu: (v) => `💪 *${v.prenom}, on pense à toi !*

Cela fait un moment qu'on n'a pas eu de nouvelles de ton activité en tant qu'Ambassadeur SBBS.

Tu as tout ce qu'il faut pour réussir — un réseau, une formation SBBS derrière toi, et un espace personnel qui t'attend !

🎯 *Rappel de tes avantages :*
- Commission sur chaque filleul confirmé
- Classement mensuel avec bonus
- Réseau de leaders SBBS

Connecte-toi dès maintenant :
👉 https://sbbs-ambassador.vercel.app/login

On compte sur toi ! 🙌

*SBBS Ambassador Program*`,
  },
  {
    id: "urgence_fin_mois",
    titre: "Urgence fin de mois",
    categorie: "Urgence",
    emoji: "🔔",
    contenu: (v) => `🔔 *RAPPEL IMPORTANT — Plus que ${v.jours_restants} jour(s) !*

${v.prenom}, le mois se termine bientôt et il te reste encore de belles opportunités !

📊 *Ton statut actuel :*
- ${v.nb_filleuls} filleul(s) parrainé(s) ce mois
- ${v.nb_confirmes} confirmé(s)
- ${v.commission_totale.toLocaleString()} FCFA acquis

${v.filleuls_manquants > 0
  ? `💡 *Il te faut encore ${v.filleuls_manquants} filleul(s)* pour atteindre le niveau supérieur et débloquer plus de commissions !`
  : `🎯 *Tu es déjà bien positionné(e) !* Continue pour consolider ta place.`}

Chaque contact compte. N'attends pas demain ! ⏰

*${v.prenom} ${v.nom}* | Ambassadeur ${v.niveau} SBBS 🏅`,
  },
  {
    id: "remerciement_filleul",
    titre: "Remerciement après paiement filleul",
    categorie: "Confirmation",
    emoji: "🙏",
    contenu: (v) => `🙏 *Merci et félicitations !*

Ton paiement a bien été reçu et ton inscription à la *SBBS* est maintenant *complète et définitive* ! ✅

Tu as pris une décision courageuse et intelligente pour ton avenir.

📅 L'équipe pédagogique SBBS te contactera très prochainement pour :
- La date de début de ta formation
- Les documents à préparer
- Les accès à ta plateforme

En attendant, rejoins notre communauté de leaders :
🌐 Notre réseau SBBS t'accueille !

Encore félicitations et bienvenue ! 🎉

*${v.prenom} ${v.nom}* | Ambassadeur SBBS 🏅`,
  },
];

const CATEGORIES = ["Tous", "Recrutement", "Relance", "Confirmation", "Motivation", "Promotion", "Onboarding", "Urgence"];

export default function ScriptsPage() {
  const [ambassadeur, setAmbassadeur] = useState<Ambassadeur | null>(null);
  const [vars, setVars] = useState<Vars | null>(null);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState("Tous");
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: amb } = await supabase
      .from("ambassadeurs").select("*").eq("user_id", user.id).single();

    // Si pas d'ambassadeur trouvé, c'est un admin — on crée des vars génériques
    const isAdmin = !amb;

    const ambassadeurData = amb || {
      id: "admin", nom: "ADMIN", prenom: "SBBS",
      telephone: "+225 00 00 00 00", zone: "Abidjan",
      branche: "SBBS", niveau: "Or",
    };

    setAmbassadeur(ambassadeurData);

    // Récupérer stats
    let nb_filleuls = 0;
    let nb_confirmes = 0;
    let commission_totale = 0;

    if (!isAdmin) {
      const { data: filleuls } = await supabase
        .from("filleuls").select("statut, montant")
        .eq("ambassadeur_id", amb.id);

      nb_filleuls = filleuls?.filter(f => f.statut !== "Annulé").length || 0;
      nb_confirmes = filleuls?.filter(f => f.statut === "Payé").length || 0;
      commission_totale = filleuls
        ?.filter(f => f.statut === "Payé")
        .reduce((s, f) => s + (Number(f.montant) || 0), 0) || 0;
    }

    // Calcul rang
    const { data: tousFilleuls } = await supabase
      .from("filleuls").select("ambassadeur_id, statut");

    const counts: Record<string, number> = {};
    tousFilleuls?.forEach(f => {
      if (f.statut !== "Annulé") counts[f.ambassadeur_id] = (counts[f.ambassadeur_id] || 0) + 1;
    });
    const monCount = counts[ambassadeurData.id] || 0;
    const rang = Object.values(counts).filter(c => c > monCount).length + 1;

    // Jours restants dans le mois
    const now = new Date();
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const jours_restants = finMois.getDate() - now.getDate();

    setVars({
      prenom: ambassadeurData.prenom,
      nom: ambassadeurData.nom,
      rang,
      nb_filleuls,
      nb_confirmes,
      commission_totale,
      branche: ambassadeurData.branche || "SBBS",
      zone: ambassadeurData.zone || "Abidjan",
      niveau: ambassadeurData.niveau || "Bronze",
      jours_restants,
      filleuls_manquants: Math.max(0, 3 - nb_filleuls),
    });

    setLoading(false);
  };

  const handleCopy = (script: ScriptData) => {
    if (!vars) return;
    const texte = script.contenu({ ...vars, telephone_ambassadeur: ambassadeur?.telephone } as any);
    navigator.clipboard.writeText(texte);
    setCopied(script.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleWhatsApp = (script: ScriptData) => {
    if (!vars) return;
    const texte = script.contenu({ ...vars, telephone_ambassadeur: ambassadeur?.telephone } as any);
    const encoded = encodeURIComponent(texte);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const scriptsFiltres = SCRIPTS.filter(s =>
    categorie === "Tous" || s.categorie === categorie
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement des scripts...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition">
          ← Retour
        </button>
        <div className="flex items-center gap-3">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full border-2 border-sbbs-gold" />
          <div>
            <h1 className="font-bold text-lg leading-none">Scripts WhatsApp</h1>
            <p className="text-xs text-blue-200">Messages personnalisés pour {ambassadeur?.prenom}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* Bandeau stats rapides */}
        <div className="bg-sbbs-blue text-white rounded-xl p-4 mb-5 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold">#{vars?.rang}</p>
            <p className="text-xs text-blue-200">Classement</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{vars?.nb_filleuls}</p>
            <p className="text-xs text-blue-200">Filleuls</p>
          </div>
          <div>
            <p className="text-lg font-bold">{vars?.commission_totale.toLocaleString()}</p>
            <p className="text-xs text-blue-200">FCFA gagnés</p>
          </div>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 flex-wrap mb-5">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategorie(cat)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                categorie === cat
                  ? "bg-sbbs-blue text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-sbbs-blue"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-4">
          {scriptsFiltres.length} script(s) disponible(s) — personnalisés avec tes données en temps réel
        </p>

        {/* Liste scripts */}
        <div className="space-y-3">
          {scriptsFiltres.map(script => {
            const texte = vars ? script.contenu({ ...vars, telephone_ambassadeur: ambassadeur?.telephone } as any) : "";
            const isExpanded = expanded === script.id;

            return (
              <div key={script.id} className="card border border-gray-100">
                {/* En-tête script */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : script.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{script.emoji}</span>
                    <div>
                      <p className="font-semibold text-sbbs-blue">{script.titre}</p>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {script.categorie}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-lg">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {/* Contenu déplié */}
                {isExpanded && (
                  <div className="mt-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed border border-gray-200">
                      {texte}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleCopy(script)}
                        className={`flex-1 text-sm px-4 py-2 rounded-lg font-semibold transition ${
                          copied === script.id
                            ? "bg-green-500 text-white"
                            : "bg-sbbs-blue text-white hover:bg-blue-800"
                        }`}
                      >
                        {copied === script.id ? "✅ Copié !" : "📋 Copier le message"}
                      </button>
                      <button
                        onClick={() => handleWhatsApp(script)}
                        className="flex-1 text-sm px-4 py-2 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 transition"
                      >
                        📲 Ouvrir WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
