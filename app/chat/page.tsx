"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type UserRole = "admin" | "directeur" | "ambassadeur";

type Message = {
  id: string;
  contenu: string;
  expediteur_id: string;
  expediteur_nom: string;
  expediteur_role: string;
  destinataire_type: string;
  branche?: string;
  lu: boolean;
  created_at: string;
};

export default function ChatPage() {
  const [role, setRole] = useState<UserRole>("ambassadeur");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState<"direction" | "directeur">("direction");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadDirection, setUnreadDirection] = useState(0);
  const [unreadDirecteur, setUnreadDirecteur] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (profile) {
      fetchMessages();
      markAsRead();

      const channel = supabase
        .channel("chat-realtime")
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
        }, () => { fetchMessages(); })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [profile, activeConv]);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: dir } = await supabase.from("directeurs").select("*").eq("user_id", user.id).single();
    if (dir) {
      setRole("directeur");
      setProfile({ ...dir, user_id: user.id });
      setLoading(false);
      return;
    }

    const { data: amb } = await supabase.from("ambassadeurs").select("*").eq("user_id", user.id).single();
    if (amb) {
      setRole("ambassadeur");
      setProfile({ ...amb, user_id: user.id });
      setLoading(false);
      return;
    }

    setRole("admin");
    setProfile({ id: user.id, user_id: user.id, nom: "Admin", prenom: "SBBS", branche: null });
    setLoading(false);
  };

  const fetchMessages = useCallback(async () => {
    if (!profile) return;

    let query = supabase.from("messages").select("*").order("created_at", { ascending: true });

    if (role === "ambassadeur") {
      query = query
        .eq("destinataire_type", activeConv)
        .or(`expediteur_id.eq.${profile.user_id},expediteur_role.eq.${activeConv === "direction" ? "admin" : "directeur"}`);
      if (activeConv === "directeur") query = query.eq("branche", profile.branche);
    } else if (role === "directeur") {
      query = query.eq("destinataire_type", "directeur").eq("branche", profile.branche);
    } else {
      query = query.eq("destinataire_type", activeConv);
    }

    const { data } = await query;
    setMessages(data || []);

    if (role === "ambassadeur") {
      const { count: cd } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("destinataire_type", "direction").eq("lu", false).neq("expediteur_id", profile.user_id);
      setUnreadDirection(cd || 0);

      const { count: cdir } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("destinataire_type", "directeur").eq("branche", profile.branche)
        .eq("lu", false).neq("expediteur_id", profile.user_id);
      setUnreadDirecteur(cdir || 0);
    }
  }, [profile, role, activeConv]);

  const markAsRead = async () => {
    if (!profile) return;
    await supabase.from("messages")
      .update({ lu: true })
      .eq("destinataire_type", activeConv)
      .neq("expediteur_id", profile.user_id);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !profile || sending) return;
    setSending(true);

    const expediteurNom = role === "admin"
      ? "Direction SBBS"
      : `${profile.prenom} ${profile.nom}`;

    await supabase.from("messages").insert({
      contenu: newMessage.trim(),
      expediteur_id: profile.user_id,
      expediteur_nom: expediteurNom,
      expediteur_role: role,
      destinataire_type: activeConv,
      branche: profile.branche || null,
      lu: false,
    });

    setNewMessage("");
    await fetchMessages();
    setSending(false);
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " +
      date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const isMe = (msg: Message) => msg.expediteur_id === profile?.user_id;

  const CONVERSATIONS = role === "ambassadeur" ? [
    { id: "direction" as const, label: "Direction", emoji: "🏢", description: "Direction Commerciale & Marketing", color: "#1A3A6C" },
    { id: "directeur" as const, label: "Directeur", emoji: "👔", description: profile?.branche || "Directeur de branche", color: "#92400E" },
  ] : role === "directeur" ? [
    { id: "directeur" as const, label: "Ambassadeurs", emoji: "👥", description: profile?.branche || "", color: "#92400E" },
  ] : [
    { id: "direction" as const, label: "Ambassadeurs", emoji: "💬", description: "Messages reçus", color: "#1A3A6C" },
    { id: "directeur" as const, label: "Directeurs", emoji: "👔", description: "Par branche", color: "#92400E" },
  ];

  const activeConvData = CONVERSATIONS.find(c => c.id === activeConv);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* Header */}
      <header className="bg-sbbs-blue text-white px-4 py-3 flex items-center gap-3 shadow-md shrink-0">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition shrink-0">
          ← Retour
        </button>
        <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full border-2 border-sbbs-gold shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base leading-none truncate">{activeConvData?.description}</h1>
          <p className="text-xs text-blue-200 capitalize mt-0.5">{role}</p>
        </div>
        <div className="flex items-center gap-1 bg-green-500/20 border border-green-400/40 px-2 py-1 rounded-full shrink-0">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-300 font-medium">Live</span>
        </div>
      </header>

      {/* Onglets conversations — visible seulement si plusieurs conversations */}
      {CONVERSATIONS.length > 1 && (
        <div className="flex shrink-0 bg-white border-b border-gray-200 shadow-sm">
          {CONVERSATIONS.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConv(conv.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 ${
                activeConv === conv.id
                  ? "border-sbbs-blue text-sbbs-blue"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <span>{conv.emoji}</span>
              <span>{conv.label}</span>
              {/* Badge */}
              {conv.id === "direction" && unreadDirection > 0 && (
                <span className="bg-sbbs-red text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadDirection}
                </span>
              )}
              {conv.id === "directeur" && unreadDirecteur > 0 && (
                <span className="bg-sbbs-red text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadDirecteur}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Messages — zone scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
            <p className="text-5xl mb-3">💬</p>
            <p className="font-medium text-sm">Aucun message pour le moment</p>
            <p className="text-xs mt-1">Envoyez le premier message !</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const mine = isMe(msg);
            const showName = !mine && (i === 0 || messages[i - 1]?.expediteur_id !== msg.expediteur_id);
            return (
              <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {showName && (
                    <p className="text-xs text-gray-400 mb-1 px-1 font-medium">{msg.expediteur_nom}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                    mine
                      ? "bg-sbbs-blue text-white rounded-br-sm"
                      : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                  }`}>
                    {msg.contenu}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 px-1">
                    {formatTime(msg.created_at)}
                    {mine && <span className="ml-1 text-sbbs-blue">{msg.lu ? "✓✓" : "✓"}</span>}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input message — fixé en bas */}
      <div className="shrink-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Écrivez votre message..."
            rows={1}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue resize-none bg-gray-50"
            style={{ minHeight: "42px", maxHeight: "100px" }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition disabled:opacity-40 shrink-0"
            style={{ background: "linear-gradient(135deg, #1A3A6C, #2563EB)" }}
          >
            {sending ? (
              <span className="text-white text-xs animate-pulse">...</span>
            ) : (
              <svg className="w-5 h-5 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
