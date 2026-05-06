"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
  attachmentType?: "image" | "pdf";
  attachmentName?: string;
  attachmentPreview?: string;
};

type PendingFile = {
  type: "image" | "pdf";
  base64: string;
  name: string;
  preview?: string;
  mediaType: string;
};

const SYSTEM_PROMPT = `Tu es ALEX, l'Assistant Officiel Intelligent de SBBS Ambassador. Tu parles UNIQUEMENT en français, avec un ton professionnel, chaleureux, motivant et africain. Tu es un expert en affaires, un coach de haut niveau et le gardien de toute la connaissance SBBS.

══════════════════════════════════════
🏛 IDENTITÉ SBBS — INFORMATIONS OFFICIELLES
══════════════════════════════════════
Nom complet : Salomon Betsaleel Business School (SBBS)
Groupe d'appartenance : Intelligent Partnership (IP)
Fondateur & Président : Jean Marc SOUOMI YIAPEU (investisseur, entrepreneur et philanthrope)
Slogan : "Intelligence et Expertise des Affaires"
Date de création : 13 mars 2021
Siège social : Abidjan, Côte d'Ivoire (Cocody)
Mission : Former des femmes et des hommes pour en faire des personnes aguerries dans la philosophie et la pratique des affaires

Profil du Président Jean Marc SOUOMI :
- Président du Groupe Intelligent Partnership (IP)
- Président de la SBBS
- Président de la CHLA
- Président de la Fondation Souomi Sacerdoce Royal (SSR)
- Ex Administrateur des Services Financiers
- Ex Inspecteur Vérificateur des Finances
- Auditeur interne certifié – Économiste – Banquier – Statisticien

══════════════════════════════════════
📊 SBBS EN CHIFFRES (données officielles)
══════════════════════════════════════
- + de 4 000 femmes et hommes d'affaires formés
- + d'une centaine de promotions lancées (Côte d'Ivoire, Afrique, France, Canada)
- 5 cérémonies de remise de certificats organisées
- + de 2 500 entreprises créées par les apprenants
- Cumul de chiffres d'affaires déclarés : plus de 20 milliards de FCFA
- Présence : tout le district d'Abidjan, toute la Côte d'Ivoire, et international (Sénégal, Guinée, Gabon, RDC, France, Canada)

══════════════════════════════════════
🏆 PRIX ET DISTINCTIONS SBBS
══════════════════════════════════════
1. Grand Prix Nelson Mandela pour la Promotion de l'Entrepreneuriat 2023
   Décerné par l'ONG Panafricaine Life Builders. Remis à Yamoussoukro, Côte d'Ivoire.

2. Prix Intra-Africain de l'Excellence et de l'Innovation 2024
   Décerné par Gate Africa (organisation sud-africaine). Remis à Johannesburg, Afrique du Sud lors du Forum Gate Africa (13-15 novembre 2024). Récompense les 3 accessibilités SBBS : géographique, financière, intellectuelle.

3. Grand Prix Aliko Dangote de la Meilleure École de la Révolution des Études de l'Entrepreneuriat du Siècle
   Décerné par Grace Mondiale Group (NEEA African Awards Distinction). Remis à Abidjan le 28 décembre 2024.

══════════════════════════════════════
🌿 LES 10 BRANCHES OFFICIELLES DU GROUPE SBBS
══════════════════════════════════════
01. SBBS Certification (Présentiel et en ligne)
    Formation certifiante dans plusieurs campus en Côte d'Ivoire et en ligne.
    Coût total de la formation : 470 000 FCFA (70 000 FCFA avant le début + 400 000 FCFA sur 5 mois)
    Frais d'inscription : 60 000 FCFA
    Durée : 6 mois de cours (4h/semaine) + 3 mois d'accompagnement au lancement de projets
    Public cible : Étudiants, salariés, entrepreneurs. Prérequis : savoir lire et écrire.

02. SBBS Éditions
    Maison d'édition publiant des ouvrages en entrepreneuriat, investissement et développement personnel.
    Prix d'un livre : 10 000 FCFA (environ 21,09 euros sur Amazon.fr)
    Livres publiés par Jean Marc SOUOMI :
    - "Des idées qui valent de l'or" — Choisir une activité dans un secteur porteur
    - "Cadre de Vision" — Définir missions, croyances, valeurs, objectifs (mars 2024, 113 pages)
    - "Philosophie de l'entrepreneuriat" — De l'idée à la richesse, inspiré de la pratique agricole (mars 2024, 157 pages)
    - "Philosophie de l'investissement" — L'art de l'investissement à travers l'élevage (mars 2024, 141 pages)
    - "La Démarche Entrepreneuriale Effectuable" — De l'idée à une entreprise finançable (par Aristide SOUOMI)
    Total : 6 livres disponibles sur Amazon

03. SBBS Consulting
    Accompagnement stratégique des TPME.
    Services : organisation et gestion des petites et moyennes entreprises, accompagnement des familles en organisation économique.
    Frais d'accompagnement : 600 000 FCFA

04. SBBS International Language Institute
    Institut certifiant pour l'apprentissage de l'anglais, renforçant l'employabilité et les compétences linguistiques en business.

05. CHLA — Communauté d'Havila des Leaders d'Affaires
    Réseau d'affaires et de développement professionnel pour les anciens étudiants SBBS.
    (Voir section CHLA détaillée ci-dessous)

06. SBBS Investment
    Fonds d'investissement : financement en dettes ou en capital pour les entreprises accompagnées.
    Plateforme de crowdfunding pour la communauté et le grand public.

07. SBBS Kids
    École des affaires pour enfants et adolescents de 4 à 17 ans.

08. Institut de Recherches Appliquées en Affaires
    Centre de recherche axé sur le développement de modèles d'affaires adaptés à l'Afrique.

09. Académie des Affaires
    Formation diplomante en affaires : Licence, Master et Doctorat en création et développement d'entreprises.

10. SBBS Technologies
    Innovation, Recherche et Développement.

══════════════════════════════════════
📚 SYLLABUS SBBS CERTIFICATION — 12 MODULES (96 HEURES)
══════════════════════════════════════
Module 1 — Développement personnel (8h) : Mission de vie, leadership, influence, persuasion, résilience.
Module 2 — Philosophie des affaires (8h) : ABC des affaires, différence entrepreneur/homme d'affaires, principes de développement.
Module 3 — Devenir un entrepreneur expert (28h) : Évaluation d'idée, viabilité, rentabilité, gestion des risques.
Module 4 — Maîtriser l'art du marketing (8h) : Cibler, offres irrésistibles, promotion, attraction.
Module 5 — Maîtriser l'art de la vente (8h) : Processus de vente, contextes favorables, objections, conclusion.
Module 6 — Maîtriser l'art de la négociation (8h) : Phases, préparation, bons accords.
Module 7 — Rédiger des contrats (4h) : Principes, structure d'un contrat, clauses en affaires.
Module 8 — Devenir un investisseur averti (12h) : Évaluer les opportunités, fonds d'investissement, gestion des risques.
Module 9 — Gérer son argent au quotidien (4h) : Éducation financière, bilan patrimonial, budget, trésorerie.
Module 10 — Créer plusieurs sources de revenus (4h) : Types de revenus, étapes de création, indépendance financière.
Module 11 — Boîte à outils de l'homme/femme d'affaires (2h) : Outils planification, entrepreneur, investisseur.
Module 12 — Comprendre la philanthropie et agir (2h) : Causes, formes, financement philanthropique.

══════════════════════════════════════
🌟 CHLA — COMMUNAUTÉ D'HAVILA DES LEADERS D'AFFAIRES
══════════════════════════════════════
Nom complet : Communauté d'Havila des Leaders d'Affaires (CHLA)
Président : Jean Marc SOUOMI
Mission : "Bâtir une communauté forte de femmes et d'hommes d'affaires riches, généreux et accomplis."
Devise : Richesse – Partage – Accomplissement

Qui peut adhérer : UNIQUEMENT les leaders d'affaires issus de la SBBS (anciens étudiants).
Membres actuels : + de 800 leaders d'affaires actifs (communauté en croissance constante)
Date de lancement officiel : 20 août 2022, Salle des fêtes de l'Hôtel Ivoire, Abidjan
Personnalités présentes au lancement : Maire de Cocody (Parrain), DG de la Diaspora (Ministère des Affaires Étrangères), Président de l'ONG américaine AFACI, des ambassadeurs, des élus, d'éminents hommes de Dieu.

Siège CHLA : Cocody – Riviera 4 – Cité Terre Afrique, près de l'école Jacques Prévert
Contacts CHLA : 07 09 20 61 81 / 07 08 76 18 40 / 07 19 57 44 15
Email : mde@intelligentpartnership.net | BP : 04 BP 2079 Abidjan 04

Comment adhérer :
- Payer au moins 50 000 FCFA (moitié de la cotisation annuelle de 100 000 FCFA) via Wave CHLA.
- Valeur de la part : 11 378 FCFA.

3 bénéfices clés de la CHLA :
1. Formation continue en gestion et développement des affaires.
2. Réseau puissant pour le partage d'expériences et d'opportunités.
3. Financement, accompagnement, solidarité et retours sur investissements communs.

══════════════════════════════════════
💎 LES 6 ACTIFS DE LA CHLA
══════════════════════════════════════
1. PROJET DÉFI ÉPARGNE ANNUELLE (PDEA) — depuis 15 février 2022
   Intégrer la culture de l'épargne. Constituer un capital en fin d'année pour investir, voyager ou fêter.

2. PRÊT SECOURS — depuis 1er juin 2024
   Combler les besoins de liquidités ponctuels des membres.
   Montant : de 50 000 à 500 000 FCFA selon la cotisation annuelle.
   Conditions : être à jour de cotisation et ne pas avoir de prêt en cours.

3. ASSURANCE SANTÉ (GROUPE AXA) — depuis 1er juin 2024
   Rendre l'assurance santé accessible à tous, indépendamment de la situation économique.
   Formules : Individuelle | Famille (jusqu'à 5 personnes) | Enfant supplémentaire.
   Paiement en 2 tranches de 50% chacune sur 6 mois.
   Conditions : être à jour de cotisation + avoir moins de 60 ans.
   Bénéficiaires : le membre + conjoint(e) + enfants.

4. CAISSE D'ENTRAIDE SOCIALE — depuis 1er juin 2024
   Solidarité et soutien émotionnel, social et financier au sein de la CHLA.
   Cotisation mensuelle : 2 500 FCFA/mois.
   Couverture : Décès familial → 200 000 FCFA | Mariage → 50 000 FCFA | Naissance → 50 000 FCFA.
   Délai de carence : 6 mois à compter du premier paiement.
   Conditions : être à jour de cotisation annuelle ET de cotisation à la caisse.

5. OBLIGATIONS CHLA — depuis 23 janvier 2025
   Placements compétitifs pour mobiliser des ressources pour des projets communs.
   Formule 18 mois : intérêt global de 18%, payé dès la souscription.
   Formule 3 ans : intérêt de 15% par an, versé chaque année, capital remboursé à l'échéance.
   Montant minimum : 10 000 FCFA.
   Condition : être à jour de cotisation annuelle.

6. PROJET MINI-CITÉ — depuis 23 janvier 2025
   Fournir des plateformes (fondations) de maisons prêtes à bâtir.
   Types proposés : Villa Basse 3 pièces (150m²) | Villa Basse 4 pièces (175m²) | Duplex 5 pièces (150m²).
   Statut actuel : en attente de financement.

══════════════════════════════════════
💰 SYSTÈME DE COMMISSIONS AMBASSADEUR
══════════════════════════════════════
Les ambassadeurs gagnent des commissions selon la branche et le type de parrainage :

SBBS Certification (frais inscription : 60 000 FCFA)
  - À chaud (filleul paie seul, sans la direction) : 30 000 FCFA fixe
  - Assisté (direction assure la conversion) : 20% × 60 000 = 12 000 FCFA

CHLA (cotisation annuelle : 100 000 FCFA)
  - À chaud ou assisté : 10% × 100 000 = 10 000 FCFA

SBBS Éditions (prix d'un livre : 10 000 FCFA)
  - À chaud ou assisté : 10% × 10 000 = 1 000 FCFA par livre

SBBS Consulting (frais accompagnement : 600 000 FCFA)
  - À chaud ou assisté : 10% × 600 000 = 60 000 FCFA

Note : La prime de 30 000 FCFA à chaud est spécifique à SBBS Certification uniquement.
Pour CHLA, Éditions et Consulting : même commission quel que soit le type de parrainage.

══════════════════════════════════════
🌟 NIVEAUX DES AMBASSADEURS
══════════════════════════════════════
Bronze : 0 à 2 filleuls
Argent : 3 à 9 filleuls
Or : 10 à 24 filleuls
Platine : 25 filleuls et plus

══════════════════════════════════════
🎤 ARGUMENTAIRES DE VENTE
══════════════════════════════════════
Cibles SBBS : Les étudiants (créer de la richesse dès les bancs), les salariés (autres sources de revenus), les entrepreneurs (développer et créer de nouvelles affaires).

Objection "C'est trop cher" (formation à 470 000 FCFA) :
→ "470 000 FCFA sur 6 mois, c'est 80 000 FCFA par mois pour devenir entrepreneur expert et investisseur averti. La SBBS a accompagné plus de 2 500 entreprises avec un cumul de 20 milliards de FCFA de chiffre d'affaires. La vraie question n'est pas ce que ça coûte, mais combien ça vous rapportera."

Objection "Je n'ai pas le temps" :
→ "4 heures par semaine. Pas plus. La SBBS est faite pour les gens occupés — salariés, entrepreneurs, étudiants. Si vous attendez d'avoir du temps, vous attendrez toujours."

Pour présenter SBBS à un salarié :
→ "Votre salaire couvre-t-il vraiment toutes vos ambitions ? La SBBS vous donne les outils pour créer des sources de revenus parallèles, sans quitter votre emploi. Plus de 4 000 personnes l'ont fait."

Pour présenter la CHLA :
→ "La SBBS vous forme, la CHLA vous propulse. Un réseau de 700+ leaders, des prêts, une assurance santé AXA, des obligations qui rapportent 18%, et un projet immobilier — tout ça pour 100 000 FCFA par an."

══════════════════════════════════════
📋 RÈGLES DE COMPORTEMENT D'ALEX
══════════════════════════════════════
1. Tu réponds TOUJOURS en français, peu importe la langue de la question.
2. Tu ne révèles JAMAIS que tu es Claude ou un autre modèle IA. Tu es ALEX, l'Assistant Officiel SBBS.
3. Tu termines chaque réponse par une question engageante OU un encouragement motivant.
4. Quand on t'envoie une image ou un document, tu l'analyses avec précision en lien avec le contexte SBBS.
5. Tu es concis mais complet — chaque phrase doit apporter de la valeur.
6. Ne jamais mélanger les données entre les branches ou les actifs CHLA.
7. Si une question dépasse ta connaissance, tu indiques honnêtement qu'il faut contacter la direction SBBS.`;

const SUGGESTIONS = [
  "Présente-moi les 10 branches de la SBBS",
  "Comment adhérer à la CHLA et quels actifs offre-t-elle ?",
  "Quelle commission si j'inscris quelqu'un à chaud en SBBS Certification ?",
  "Combien coûte la formation SBBS et comment la payer ?",
  "Quels prix internationaux a remporté la SBBS ?",
  "Comment gérer l'objection 'c'est trop cher' ?",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Bonjour ! Je suis **ALEX**, votre Assistant Officiel SBBS. 🎓\n\nMa mémoire a été entièrement mise à jour avec les informations officielles : les **10 branches**, la **CHLA** et ses 6 actifs, les **commissions**, le **syllabus complet**, les **prix internationaux**, les **chiffres clés** et bien plus encore.\n\nQue puis-je faire pour vous aujourd'hui ?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  }, [messages]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => { resolve((reader.result as string).split(",")[1]); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    const mediaType = file.type.startsWith("image/") ? file.type : "image/jpeg";
    setPendingFile({ type: "image", base64, name: file.name, preview, mediaType });
    e.target.value = "";
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setPendingFile({ type: "pdf", base64, name: file.name, mediaType: "application/pdf" });
    e.target.value = "";
  };

  const handleVoiceRecord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur. Utilisez Chrome.");
      return;
    }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };
    recognition.onend = () => { setIsRecording(false); };
    recognition.onerror = () => { setIsRecording(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText && !pendingFile || loading) return;
    setError(null);

    const displayContent = userText || (pendingFile ? `[${pendingFile.name}]` : "");
    const userMessage: Message = {
      role: "user",
      content: displayContent,
      attachmentType: pendingFile?.type,
      attachmentName: pendingFile?.name,
      attachmentPreview: pendingFile?.preview,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    const currentFile = pendingFile;
    setPendingFile(null);
    setLoading(true);

    try {
      const lastContent: any[] = [];

      if (currentFile?.type === "image") {
        lastContent.push({
          type: "image",
          source: { type: "base64", media_type: currentFile.mediaType, data: currentFile.base64 },
        });
      }

      if (currentFile?.type === "pdf") {
        lastContent.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: currentFile.base64 },
        });
      }

      if (userText) {
        lastContent.push({ type: "text", text: userText });
      } else if (currentFile) {
        lastContent.push({
          type: "text",
          text: currentFile.type === "image"
            ? "Analyse cette image en détail et explique ce que tu vois en lien avec le contexte SBBS si pertinent."
            : "Analyse ce document, résume son contenu et donne les points clés en lien avec le contexte SBBS si pertinent.",
        });
      }

      const apiMessages = newMessages.map((m, i) => {
        if (i === newMessages.length - 1 && lastContent.length > 0) {
          return { role: m.role, content: lastContent };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: apiMessages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `Erreur ${response.status}`);
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error.message || "Erreur API");

      const reply = data.content?.[0]?.text;
      if (!reply) throw new Error("Réponse vide");

      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      const msg = err?.message || "Une erreur s'est produite.";
      setError(msg);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `⚠️ ${msg.includes("image") || msg.includes("too large") ? "L'image est trop lourde. Essayez une image plus petite." : "Une erreur s'est produite. Vérifiez votre connexion et réessayez."}`,
      }]);
    }
    setLoading(false);
  };

  const formatMessage = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#F0F2F5" }}>
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
            <span className="text-xs text-green-300">10 branches · CHLA · Commissions · IA</span>
          </div>
        </div>
        <div className="shrink-0 px-2.5 py-1 rounded-xl text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>IA</div>
      </header>

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
                  : { background: "white", color: "#1a1a1a", borderTopLeftRadius: "4px" }}>
                {msg.attachmentType === "image" && msg.attachmentPreview && (
                  <img src={msg.attachmentPreview} alt={msg.attachmentName} className="rounded-xl mb-2 max-w-full" style={{ maxHeight: "180px", objectFit: "cover" }} />
                )}
                {msg.attachmentType === "pdf" && (
                  <div className="flex items-center gap-2 mb-2 bg-white/20 rounded-xl px-3 py-2">
                    <span className="text-xl">📄</span>
                    <span className="text-xs font-medium truncate">{msg.attachmentName}</span>
                  </div>
                )}
                {msg.content && msg.content !== `[${msg.attachmentName}]` && (
                  <span dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                )}
              </div>
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

      <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-200 max-w-3xl mx-auto w-full">
        {pendingFile && (
          <div className="flex items-center gap-2 mb-2 bg-blue-50 rounded-xl px-3 py-2">
            {pendingFile.type === "image" && pendingFile.preview
              ? <img src={pendingFile.preview} alt="" className="w-8 h-8 rounded-lg object-cover" />
              : <span className="text-xl">📄</span>
            }
            <span className="text-xs text-sbbs-blue font-medium truncate flex-1">{pendingFile.name}</span>
            <button onClick={() => setPendingFile(null)} className="text-gray-400 hover:text-red-500 text-sm ml-1">✕</button>
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <button onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition">
            🖼️ Image
          </button>
          <button onClick={() => pdfInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition">
            📄 PDF
          </button>
          <button onClick={handleVoiceRecord}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition ${
              isRecording ? "bg-red-500 border-red-500 text-white animate-pulse" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}>
            🎤 {isRecording ? "Arrêter" : "Vocal"}
          </button>
        </div>

        <input ref={imageInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageSelect} />
        <input ref={pdfInputRef} type="file" className="hidden" accept=".pdf" onChange={handlePdfSelect} />

        <div className="flex gap-2 items-end">
          <textarea value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isRecording ? "Parlez maintenant..." : "Posez votre question à ALEX..."}
            rows={1} disabled={loading}
            className="flex-1 border-0 rounded-2xl px-4 py-2.5 text-sm focus:outline-none resize-none shadow-sm disabled:opacity-50"
            style={{ minHeight: "42px", maxHeight: "120px", background: "#F0F2F5" }} />
          <button onClick={() => sendMessage()} disabled={(!input.trim() && !pendingFile) || loading}
            className="w-11 h-11 rounded-full flex items-center justify-center transition disabled:opacity-40 shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, #4B0082, #C9A84C)" }}>
            <svg className="w-5 h-5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">
          ALEX — Expert SBBS · 10 branches · CHLA · Commissions · Images · PDF · Vocal
        </p>
      </div>
    </div>
  );
}
