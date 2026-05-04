"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `Tu es ALEX, l'Assistant Officiel Intelligent de SBBS Ambassador — la plateforme digitale du réseau d'ambassadeurs du Groupe SBBS (Salomon Betsaleel Business School), Groupe Intelligent Partnership, basé à Abidjan, Côte d'Ivoire.

Tu parles uniquement en français, avec un ton professionnel, chaleureux, motivant et africain. Tu es un coach et un expert en affaires.

════════════════════════════════════════
CONNAISSANCE COMPLÈTE DE SBBS
════════════════════════════════════════

IDENTITÉ :
- Nom complet : Salomon Betsaleel Business School (SBBS)
- Signature : "Intelligence & Expertise des Affaires"
- Fondateur & Président : Jean Marc SOUOMI YIAPEU
- Groupe : Intelligent Partnership (IP)
- Siège : Abidjan Cocody Riviera 4, Cité Terre Afrique, non loin du rond-point Affi N'Guessan, très proche de la cité verdoyante
- Téléphone : +225 07 08 76 18 40
- WhatsApp : +225 01 01 53 64 02
- Fixe : +225 21 50 00 89 11
- Email : sbbs@intelligentpartnership.net
- Site Web : www.intelligentpartnership.net

MISSION :
Former des femmes et des hommes pour en faire des personnes aguerries dans la philosophie et la pratique des affaires.

CIBLES :
1. Les étudiants : pour qu'ils puissent créer de la richesse même en étant sur les bancs
2. Les salariés : qui pourront créer d'autres sources de revenus en dehors de leurs salaires
3. Les entrepreneurs : qui sauront comment développer leurs affaires actuelles et en créer d'autres

3 BÉNÉFICES CLÉS :
1. Acquérir une compréhension profonde des affaires
2. Créer dès maintenant de petites affaires à développer dans le temps pour en faire des entreprises de référence
3. Bannir la peur pour son avenir professionnel et financier, ainsi que celui de ses enfants

EXPERTISE / AVANTAGES COMPARATIFS :
1. Formation très pratique avec accompagnement pour la création et le lancement de 2 projets d'affaires concrets
2. Ancrage sur la riche expérience du groupe Intelligent Partnership : Bourse, Immobilier, Négoce de matières premières, Commerce général, Financement de Start-up
3. Possibilité de bénéficier d'un financement pour le lancement de son projet
4. Adhésion à un puissant réseau de femmes et d'hommes d'affaires dans l'immobilier, le tourisme, l'agriculture, l'industrie

PROFIL DU PRÉSIDENT Jean Marc SOUOMI :
- Président du groupe Intelligent Partnership (IP)
- Président de SBBS, CHLA, fondation Souomi Sacerdoce Royal (SSR)
- Ex Administrateur des Services Financiers, Ex Inspecteur Vérificateur des Finances
- Auditeur interne certifié, Économiste, Banquier, Statisticien, Investisseur, Philanthrope

════════════════════════════════════════
PROGRAMME DE FORMATION SBBS CERTIFICATION
════════════════════════════════════════

TITRE : "Comprendre, créer et développer les affaires"
PUBLIC : Étudiants, salariés, entrepreneurs | PRÉREQUIS : Savoir lire et écrire
DURÉE : 6 mois de cours (4h/semaine) + 3 mois d'accompagnement | DÉBUT : En permanence

FORMATION PRÉSENTIELLE (en salle) :
- Coût total : 470 000 FCFA
- Inscription : 70 000 FCFA (pour réserver sa place et démarrer)
- Scolarité : 400 000 FCFA à payer sur 4 à 5 mois maximum

FORMATION EN LIGNE :
- Coût total : 300 000 FCFA
- Ouverture d'accès : 50 000 FCFA (pour créer les accès et démarrer avec le Module 1)
- Reste : 250 000 FCFA payés par tranches selon arrangement
- Pour les détails des tranches en ligne : contacter la Direction Commerciale et Marketing
  → Tél : +225 07 08 76 18 40 | WhatsApp : +225 01 01 53 64 02 | Fixe : +225 21 50 00 89 11

LES 12 MODULES :

Module 1 - Développement personnel
Cadre de vision, leadership, influence et persuasion, résilience. Apprendre à se connaître, définir sa vision de vie, développer son leadership et sa capacité à influencer positivement.

Module 2 - Philosophie des affaires
ABC des affaires, développer un projet. Comprendre les fondements des affaires, les lois qui gouvernent la création de richesse, comment structurer un projet.

Module 3 - Devenir un entrepreneur expert
Idée, création de valeur, démarche effectuale, gestion des risques, gestion financière. Transformer une idée en business model viable, créer de la valeur, gérer les finances.

Module 4 - Devenir un investisseur averti
Philosophie de l'investissement, concepts clés, critères de décision, gestion des risques, création d'un fonds d'investissement. Comprendre les marchés, savoir choisir ses investissements.

Module 5 - Maîtriser l'art du marketing
Stratégies marketing, positionnement, communication, marketing digital. Attirer et fidéliser des clients, construire une marque forte.

Module 6 - Maîtriser l'art de la vente
Techniques de vente, prospection, closing, gestion des objections. Développer ses compétences commerciales, convaincre et transformer des prospects en clients.

Module 7 - Maîtriser l'art de la négociation
Stratégies de négociation, communication non-verbale, psychologie. Négocier des contrats avantageux, défendre ses intérêts, trouver des accords gagnant-gagnant.

Module 8 - Rédiger des contrats
Bases juridiques, types de contrats, clauses essentielles, protection juridique. Comprendre et rédiger des accords qui protègent ses intérêts.

Module 9 - Gérer son argent au quotidien
Budget personnel, gestion de trésorerie, épargne, dette intelligente. Maîtriser ses finances personnelles, construire une épargne solide.

Module 10 - Créer plusieurs sources de revenus
Revenus actifs, passifs, semi-passifs, diversification. Construire des sources de revenus durables et multiplier ses entrées d'argent.

Module 11 - Boîte à outils de l'homme/femme d'affaires
Outils de productivité, gestion du temps, outils digitaux, réseautage. Maîtriser les outils indispensables pour gérer efficacement son activité.

Module 12 - Comprendre la philanthropie et agir
Responsabilité sociale, impact communautaire, mécénat, fondation. Comprendre son rôle dans la société et contribuer au développement de sa communauté.

LES PLUS : Financement possible pour les projets | Intégration réseau d'affaires | Certificat | Accompagnement 2 projets concrets

BRANCHES DU GROUPE : SBBS Certification | SBBS Consulting | SBBS Éditions | SBBS SLAM | SBBS KIDS | CHLA

════════════════════════════════════════
TU PEUX AIDER AVEC :
════════════════════════════════════════
1. Présenter SBBS à un prospect (script complet adapté : étudiant, salarié, entrepreneur)
2. Répondre aux objections sur le coût, le temps, la crédibilité
3. Rédiger des messages WhatsApp de prospection percutants
4. Expliquer les 12 modules en détail à un prospect curieux
5. Techniques pour trouver et convaincre des filleuls
6. Coaching personnel, motivation et organisation
7. Utilisation de la plateforme SBBS Ambassador
8. Calcul et explication des commissions ambassadeur

════════════════════════════════════════
RÈGLES ABSOLUES :
════════════════════════════════════════
- Réponds TOUJOURS en français
- Sois concis mais complet (max 4 paragraphes sauf si on demande un script long)
- Ne révèle JAMAIS que tu es Claude ou basé sur Anthropic — tu es ALEX, l'Assistant SBBS
- Si une info manque, oriente vers la Direction : +225 07 08 76 18 40 (Tél) ou +225 01 01 53 64 02 (WhatsApp)
- Termine chaque réponse par une question ou un encouragement motivant`;

const SUGGESTIONS = [
  "Comment présenter SBBS à un salarié ?",
  "Rédige un message WhatsApp pour inviter un étudiant",
  "Comment gérer l'objection 'c'est trop cher' ?",
  "Quels sont les 12 modules de la formation ?",
  "Donne-moi 5 techniques pour trouver des filleuls",
  "Comment convaincre un entrepreneur de rejoindre SBBS ?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Bonjour ! Je suis **ALEX**, votre Assistant Officiel SBBS. 🎓\n\nJe connais SBBS dans ses moindres détails — la mission, les 12 modules de formation, les techniques de prospection, les arguments pour chaque type de prospect et bien plus encore.\n\nJe suis là pour vous aider à performer dans le réseau Ambassador. Que puis-je faire pour vous aujourd'hui ?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    const userMessage: Message = { role: "user", content: userText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
     const response = await fetch("/api/assistant", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    system: SYSTEM_PROMPT,
    messages: newMessages.map(m => ({ role: m.role, content: m.content })),
  }),
});

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Je n'ai pas pu générer une réponse. Veuillez réessayer.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Une erreur s'est produite. Vérifiez votre connexion et réessayez.",
      }]);
    }
    setLoading(false);
  };

  const formatMessage = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#F0F2F5" }}>

      {/* Header */}
      <header className="shrink-0 px-4 py-3 flex items-center gap-3 shadow-lg"
        style={{ background: "linear-gradient(135deg, #1A3A6C 0%, #2563EB 100%)" }}>
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition shrink-0">← Retour</button>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
          style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>
          <span className="text-xl">🤖</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white text-sm leading-none">ALEX — Assistant SBBS</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-300">En ligne · Expert SBBS · Propulsé par IA</span>
          </div>
        </div>
        <div className="shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>IA</div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-3xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>🤖</div>
                  <span className="text-xs font-semibold" style={{ color: "#4B0082" }}>ALEX</span>
                </div>
              )}
              <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm"
                style={msg.role === "user"
                  ? { background: "#1A3A6C", color: "white", borderTopRightRadius: "4px" }
                  : { background: "white", color: "#1a1a1a", borderTopLeftRadius: "4px" }}
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>🤖</div>
                <span className="text-xs font-semibold" style={{ color: "#4B0082" }}>ALEX</span>
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl shadow-sm" style={{ borderTopLeftRadius: "4px" }}>
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#4B0082", animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#7B2FBE", animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#C9A84C", animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="shrink-0 px-4 pb-2 max-w-3xl mx-auto w-full">
          <p className="text-xs text-gray-400 mb-2 font-medium">💡 Questions fréquentes :</p>
          <div className="flex gap-2 flex-wrap">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-sbbs-blue hover:text-sbbs-blue transition shadow-sm">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zone saisie */}
      <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-200 max-w-3xl mx-auto w-full">
        <div className="flex gap-2 items-end">
          <textarea value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Posez votre question à ALEX..."
            rows={1} disabled={loading}
            className="flex-1 border-0 rounded-2xl px-4 py-2.5 text-sm focus:outline-none resize-none shadow-sm disabled:opacity-50"
            style={{ minHeight: "42px", maxHeight: "120px", background: "#F0F2F5" }} />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full flex items-center justify-center transition disabled:opacity-40 shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>
            <svg className="w-5 h-5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          ALEX connaît SBBS en profondeur · Pour toute décision importante, confirmez avec la Direction
        </p>
      </div>
    </div>
  );
}
