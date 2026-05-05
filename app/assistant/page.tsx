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

const SYSTEM_PROMPT = `Tu es ALEX, l'Assistant Officiel Intelligent de SBBS Ambassador. Tu parles uniquement en français, avec un ton professionnel, chaleureux, motivant et africain. Tu es un coach et un expert en affaires.

Tu connais SBBS dans ses moindres détails : 3 prix internationaux (Nelson Mandela 2023, Gate Africa 2024, Aliko Dangote), 10 branches, 12 modules de formation (96h), 6 livres sur Amazon, la CHLA (800+ membres).

Quand on te soumet une image ou un document, analyse-le et aide l'utilisateur en lien avec le contexte SBBS et les affaires.

RÈGLES : Réponds toujours en français. Ne révèle jamais que tu es Claude. Tu es ALEX, l'Assistant SBBS. Termine par une question ou un encouragement.`;

const SUGGESTIONS = [
  "Comment présenter SBBS à un salarié ?",
  "Quels prix internationaux a remporté SBBS ?",
  "Comment gérer l'objection 'c'est trop cher' ?",
  "Qu'est-ce que la CHLA ?",
  "Parle-moi des livres de Jean Marc SOUOMI",
  "Explique-moi le module 3 en détail",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Bonjour ! Je suis **ALEX**, votre Assistant Officiel SBBS. 🎓\n\nJe peux maintenant analyser vos **images** et **documents PDF** — envoyez-les moi et je vous aide !\n\nQue puis-je faire pour vous aujourd'hui ?",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ type: "image" | "pdf"; base64: string; name: string; preview?: string } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  }, [messages]);

  // ─── Conversion fichier en base64 ───
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // enlever le préfixe data:...
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ─── Gestion image ───
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const preview = URL.createObjectURL(file);
    setPendingFile({ type: "image", base64, name: file.name, preview });
    e.target.value = "";
  };

  // ─── Gestion PDF ───
  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setPendingFile({ type: "pdf", base64, name: file.name });
    e.target.value = "";
  };

  // ─── Message vocal ───
  const handleVoiceRecord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur. Utilisez Chrome.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

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

  // ─── Envoi message ───
  const sendMessage = async (text?: string) => {
    const userText = text || input.trim();
    if (!userText && !pendingFile || loading) return;

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
      // Construire le contenu du message pour l'API
      let messageContent: any[] = [];

      if (currentFile?.type === "image") {
        messageContent.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: currentFile.base64 },
        });
      }

      if (currentFile?.type === "pdf") {
        messageContent.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: currentFile.base64 },
        });
      }

      if (userText) {
        messageContent.push({ type: "text", text: userText });
      } else if (currentFile) {
        messageContent.push({ type: "text", text: currentFile.type === "image" ? "Analyse cette image et aide-moi." : "Analyse ce document et résume son contenu." });
      }

      // Construire l'historique des messages pour l'API
      const apiMessages = newMessages.map((m, i) => {
        if (i === newMessages.length - 1 && messageContent.length > 1) {
          return { role: m.role, content: messageContent };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM_PROMPT, messages: apiMessages }),
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Je n'ai pas pu générer une réponse. Veuillez réessayer.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Une erreur s'est produite. Vérifiez votre connexion." }]);
    }
    setLoading(false);
  };

  const formatMessage = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
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
            <span className="text-xs text-green-300">Images · PDF · Vocal · IA</span>
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
                {/* Aperçu image */}
                {msg.attachmentType === "image" && msg.attachmentPreview && (
                  <img src={msg.attachmentPreview} alt={msg.attachmentName} className="rounded-xl mb-2 max-w-full" style={{ maxHeight: "180px", objectFit: "cover" }} />
                )}
                {/* Aperçu PDF */}
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

        {/* Fichier en attente */}
        {pendingFile && (
          <div className="flex items-center gap-2 mb-2 bg-blue-50 rounded-xl px-3 py-2">
            {pendingFile.type === "image" && pendingFile.preview
              ? <img src={pendingFile.preview} alt="" className="w-8 h-8 rounded-lg object-cover" />
              : <span className="text-xl">📄</span>
            }
            <span className="text-xs text-sbbs-blue font-medium truncate flex-1">{pendingFile.name}</span>
            <button onClick={() => setPendingFile(null)} className="text-gray-400 hover:text-red-500 text-sm">✕</button>
          </div>
        )}

        {/* Boutons pièces jointes */}
        <div className="flex gap-2 mb-2">
          <button onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title="Joindre une image">
            🖼️ Image
          </button>
          <button onClick={() => pdfInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
            title="Joindre un PDF">
            📄 PDF
          </button>
          <button onClick={handleVoiceRecord}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition ${
              isRecording
                ? "bg-red-500 border-red-500 text-white animate-pulse"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
            title={isRecording ? "Arrêter l'enregistrement" : "Message vocal"}>
            🎤 {isRecording ? "Arrêter" : "Vocal"}
          </button>
        </div>

        {/* Inputs cachés */}
        <input ref={imageInputRef} type="file" className="hidden" accept="image/*"
          onChange={handleImageSelect} />
        <input ref={pdfInputRef} type="file" className="hidden" accept=".pdf"
          onChange={handlePdfSelect} />

        {/* Zone texte */}
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
          ALEX analyse images et PDF · Vocal sur Chrome uniquement
        </p>
      </div>
    </div>
  );
}
