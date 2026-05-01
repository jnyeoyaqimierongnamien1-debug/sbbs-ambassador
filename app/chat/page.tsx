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

type Conversation = {
  id: "direction" | "directeur";
  label: string;
  emoji: string;
  description: string;
  color: string;
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

      // Realtime
      const channel = supabase
        .channel("chat-realtime")
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "messages",
        }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [profile, activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: dir } = await supabase.from("directeurs").select("*").eq("user_id", user.id).single();
    if (dir) {
      setRole("directeur");
      setProfile({ ...dir, user_id: user.id, table: "directeurs" });
      setLoading(false);
      return;
    }

    const { data: amb } = await supabase.from("ambassadeurs").select("*").eq("user_id", user.id).single();
    if (amb) {
      setRole("ambassadeur");
      setProfile({ ...amb, user_id: user.id, table: "ambassadeurs" });
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

      if (activeConv === "directeur") {
        query = query.eq("branche", profile.branche);
      }
    } else if (role === "directeur") {
      query = query
        .eq("destinataire_type", "directeur")
        .eq("branche", profile.branche);
    } else {
      // Admin voit tout
      query = query.eq("destinataire_type", activeConv);
    }

    const { data } = await query;
    setMessages(data || []);

    // Compter non lus
    if (role === "ambassadeur") {
      const { count: cd } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("destinataire_type", "direction")
        .eq("lu", false)
        .neq("expediteur_id", profile.user_id);
      setUnreadDirection(cd || 0);

      const { count: cdir } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("destinataire_type", "directeur")
        .eq("branche", profile.branche)
        .eq("lu", false)
        .neq("expediteur_id", profile.user_id);
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

    const { error } = await supabase.from("messages").insert({
      contenu: newMessage.trim(),
      expediteur_id: profile.user_id,
      expediteur_nom: expediteurNom,
      expediteur_role: role,
      destinataire_type: activeConv,
      branche: profile.branche || null,
      lu: false,
    });

    if (!error) {
      setNewMessage("");
      await fetchMessages();
    }
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

  const CONVERSATIONS: Conversation[] = role === "ambassadeur" ? [
    {
      id: "direction",
      label: "Direction Commerciale",
      emoji: "🏢",
      description: "& Marketing Physique",
      color: "#1A3A6C",
    },
    {
      id: "directeur",
      label: "Mon Directeur",
      emoji: "👔",
      description: profile?.branche || "Directeur de branche",
      color: "#92400E",
    },
  ] : role === "directeur" ? [
    {
      id: "directeur",
      label: "Mes Ambassadeurs",
      emoji: "👥",
      description: profile?.branche || "",
      color: "#92400E",
    },
  ] : [
    {
      id: "direction",
      label: "Messages Ambassadeurs",
      emoji: "💬",
      description: "Tous les messages reçus",
      color: "#1A3A6C",
    },
    {
      id: "directeur",
      label: "Messages Directeurs",
      emoji: "👔",
      description: "Par branche",
      color: "#92400E",
    },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <header className="bg-sbbs-blue text-white px-6 py-4 flex items-center gap-4 shadow-md shrink-0">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition">
          ← Retour
        </button>
        <div className="flex items-center gap-3">
          <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-8 h-8 rounded-full border-2 border-sbbs-gold" />
          <div>
            <h1 className="font-bold text-lg leading-none">Messages</h1>
            <p className="text-xs text-blue-200 capitalize">{role}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-300 font-medium">En direct</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden max-w-4xl mx-auto w-full px-4 py-4 gap-4">

        {/* Sidebar conversations */}
        <div className="w-64 shrink-0 space-y-2">
          {CONVERSATIONS.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConv(conv.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition border ${
                activeConv === conv.id
                  ? "text-white shadow-md border-transparent"
                  : "bg-white text-gray-700 border-gray-200 hover:border-sbbs-blue"
              }`}
              style={activeConv === conv.id ? { backgroundColor: conv.color } : {}}
            >
              <span className="text-2xl shrink-0">{conv.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight truncate">{conv.label}</p>
                <p className={`text-xs truncate mt-0.5 ${activeConv === conv.id ? "opacity-70" : "text-gray-400"}`}>
                  {conv.description}
                </p>
              </div>
              {/* Badge non lus */}
              {conv.id === "direction" && unreadDirection > 0 && (
                <span className="bg-sbbs-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {unreadDirection}
                </span>
              )}
              {conv.id === "directeur" && unreadDirecteur > 0 && (
                <span className="bg-sbbs-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {unreadDirecteur}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Zone chat */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* En-tête conversation */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
            <span className="text-xl">{CONVERSATIONS.find(c => c.id === activeConv)?.emoji}</span>
            <div>
              <p className="font-bold text-sbbs-blue text-sm">{CONVERSATIONS.find(c => c.id === activeConv)?.label}</p>
              <p className="text-xs text-gray-400">{CONVERSATIONS.find(c => c.id === activeConv)?.description}</p>
            </div>
          </div>

          {/* Messages */}
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
                    <div className={`max-w-xs lg:max-w-sm ${mine ? "items-end" : "items-start"} flex flex-col`}>
                      {showName && (
                        <p className="text-xs text-gray-400 mb-1 px-1">{msg.expediteur_nom}</p>
                      )}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        mine
                          ? "bg-sbbs-blue text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}>
                        {msg.contenu}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {formatTime(msg.created_at)}
                        {mine && <span className="ml-1">{msg.lu ? "✓✓" : "✓"}</span>}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input message */}
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex gap-3 items-end">
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
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sbbs-blue resize-none"
                style={{ minHeight: "42px", maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
                className="w-10 h-10 rounded-xl bg-sbbs-blue text-white flex items-center justify-center hover:bg-blue-800 transition disabled:opacity-40 shrink-0"
              >
                {sending ? (
                  <span className="text-xs animate-pulse">...</span>
                ) : (
                  <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5 px-1">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
          </div>
        </div>
      </div>
    </div>
  );
}
