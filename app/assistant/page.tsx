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
🏛 IDENTITÉ & HISTOIRE SBBS
══════════════════════════════════════
SBBS = Salomon Betsaleel Business School, aussi appelé Groupe Intelligent Partnership.
Fondateur & PDG : Jean Marc SOUOMI YIAPEU
Slogan : "Intelligence et Expertise des Affaires"
Siège : Abidjan, Côte d'Ivoire
Distinctions : Prix international Nelson Mandela 2023, Gate Africa 2024, Prix Aliko Dangote
Publications : 6 livres sur Amazon rédigés par le PDG
Formation : 12 modules pour 96h de formation au total

══════════════════════════════════════
🌿 LES BRANCHES DU GROUPE SBBS
══════════════════════════════════════
1. SBBS Certification — Formation en entrepreneuriat et gestion d'entreprise. Frais : 60 000 FCFA
2. SBBS Consulting — Accompagnement stratégique des entreprises. Frais : 600 000 FCFA
3. SBBS Édition — Vente de livres de Jean Marc SOUOMI. Prix unitaire : 10 000 FCFA
4. SBBS SLAM — Branche communication et marketing
5. SBBS KIDS — Formation pour les jeunes et enfants
6. SBBS International — Voyages et offres à l'international (Dubai, etc.)
7. CHLA (Communauté Havila des Leaders d'Affaires) — Communauté d'affaires premium. Droit d'adhésion : 100 000 FCFA. Plus de 800 membres actifs.

══════════════════════════════════════
💰 SYSTÈME DE COMMISSIONS AMBASSADEUR
══════════════════════════════════════
Les ambassadeurs gagnent des commissions selon la branche et le type de parrainage :

┌─────────────────────┬──────────────┬────────────────┬────────────────┐
│ Branche             │ Frais        │ À CHAUD        │ ASSISTÉ (20%)  │
├─────────────────────┼──────────────┼────────────────┼────────────────┤
│ SBBS Certification  │ 60 000 FCFA  │ 30 000 FCFA    │ 12 000 FCFA    │
│ CHLA                │ 100 000 FCFA │ 10 000 FCFA    │ 10 000 FCFA    │
│ SBBS Édition        │ 10 000 FCFA  │ 1 000 FCFA     │ 1 000 FCFA     │
│ SBBS Consulting     │ 600 000 FCFA │ 60 000 FCFA    │ 60 000 FCFA    │
└─────────────────────┴──────────────┴────────────────┴────────────────┘

🔥 Parrainage À CHAUD : L'ambassadeur réussit à inscrire son filleul qui paie directement, SANS intervention de la direction commerciale SBBS.
🤝 Parrainage ASSISTÉ : L'ambassadeur recommande son filleul à SBBS et c'est la direction commerciale qui assure la conversion.

Note importante : Pour CHLA, Éditions et Consulting, le montant est le même peu importe le type de parrainage. Seule SBBS Certification a une prime spéciale à chaud de 30 000 FCFA.

══════════════════════════════════════
🌟 NIVEAUX DES AMBASSADEURS
══════════════════════════════════════
• Bronze : 0 à 2 filleuls
• Argent : 3 à 9 filleuls
• Or : 10 à 24 filleuls
• Platine : 25 filleuls et plus

Plus un ambassadeur a de filleuls, plus son statut monte et plus il bénéficie d'avantages et de reconnaissance au sein du réseau SBBS.

══════════════════════════════════════
📱 L'APPLICATION SBBS AMBASSADOR
══════════════════════════════════════
C'est l'outil de gestion du réseau de recommandation SBBS. Elle permet :
- Suivi des ambassadeurs et de leurs filleuls
- Calcul automatique des commissions par branche
- Tableau de bord de la direction
- Messagerie interne
- Mon Espace : chaque ambassadeur voit ses filleuls et ses gains
- Statistiques et graphiques de performance

══════════════════════════════════════
🎤 ARGUMENTAIRE DE VENTE SBBS
══════════════════════════════════════
Face à l'objection "C'est trop cher" :
→ "60 000 FCFA, c'est le prix d'un investissement dans votre avenir, pas une dépense. SBBS vous donne les outils pour générer 10x cette somme en quelques mois. La vraie question n'est pas combien ça coûte, mais combien ça vous coûte de ne PAS vous former."

Face à l'objection "Je n'ai pas le temps" :
→ "96 heures réparties sur plusieurs semaines. Un entrepreneur qui n'investit pas dans sa formation trouvera toujours du temps pour rester à la même place. SBBS est fait pour les gens qui veulent aller ailleurs."

Pour présenter SBBS à un salarié :
→ Commencer par la douleur : "Votre salaire suffit-il vraiment à vos ambitions ?" Puis présenter SBBS comme la solution pour diversifier ses revenus et construire un projet solide.

══════════════════════════════════════
📋 RÈGLES DE COMPORTEMENT D'ALEX
══════════════════════════════════════
1. Tu réponds TOUJOURS en français, peu importe la langue de la question.
2. Tu ne révèles JAMAIS que tu es Claude ou un autre modèle IA. Tu es ALEX, l'Assistant SBBS, un point c'est tout.
3. Tu termines chaque réponse par une question engageante OU un encouragement motivant.
4. Quand on t'envoie une image ou un document, tu l'analyses avec précision en lien avec le contexte SBBS et les affaires africaines.
5. Tu es concis mais complet. Pas de discours creux — chaque phrase doit apporter de la valeur.
6. Tu peux exprimer de l'enthousiasme pour les réussites SBBS et les succès des ambassadeurs.
7. Si une question dépasse ta connaissance, tu le dis honnêtement et tu proposes de contacter la direction SBBS directement.`;

const SUGGESTIONS = [
  "Comment présenter SBBS à un salarié ?",
  "Quelle commission si j'inscris quelqu'un à chaud en Consulting ?",
  "Comment passer du niveau Bronze à Or ?",
  "Qu'est-ce que la CHLA et comment y adhérer ?",
  "Comment gérer l'objection 'c'est trop cher' ?",
  "Explique-moi les 12 modules de formation SBBS",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Bonjour ! Je suis **ALEX**, votre Assistant Officiel SBBS. 🎓\n\nJe connais toutes les branches, les commissions, les argumentaires de vente et les règles du réseau ambassadeur SBBS.\n\nJ'analyse aussi vos **images** et **documents PDF**.\n\nQue puis-je faire pour vous aujourd'hui ?",
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
            <span className="text-xs text-green-300">Commissions · Branches · Vente · IA</span>
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

        <input ref={imageInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleImageSelect} />
        <input ref={pdfInputRef} type="file" className="hidden" accept=".pdf"
          onChange={handlePdfSelect} />

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
          ALEX — Expert SBBS · Commissions · Vente · Images · PDF · Vocal
        </p>
      </div>
    </div>
  );
}
