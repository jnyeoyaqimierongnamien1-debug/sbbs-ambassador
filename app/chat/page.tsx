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
  ambassadeur_id?: string;
  directeur_id?: string;
  branche?: string;
  lu: boolean;
  created_at: string;
};

type Contact = {
  id: string; // ambassadeur.id ou directeur.id
  user_id: string;
  nom: string;
  prenom: string;
  branche?: string;
  type: "ambassadeur" | "directeur";
  unread: number;
};

export default function ChatPage() {
  const [role, setRole] = useState<UserRole>("ambassadeur");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pour ambassadeur : "direction" ou "directeur"
  // Pour directeur : ambassadeur_id sélectionné ou "direction"
  // Pour admin : contact sélectionné
  const [activeConv, setActiveConv] = useState<string>("direction");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
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
      if (role === "directeur" || role === "admin") fetchContacts();
      fetchMessages();
      markAsRead();

      const channel = supabase
        .channel("chat-realtime-v2")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
          fetchMessages();
          if (role === "directeur" || role === "admin") fetchContacts();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [profile, activeConv, activeContact]);

  useEffect(() => {
    setTimeout(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
  }, [messages]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: dir } = await supabase.from("directeurs").select("*").eq("user_id", user.id).single();
    if (dir) {
      setRole("directeur");
      setProfile({ ...dir, user_id: user.id });
      setActiveConv("direction"); // directeur commence par voir ses messages avec direction
      setLoading(false);
      return;
    }

    const { data: amb } = await supabase.from("ambassadeurs").select("*").eq("user_id", user.id).single();
    if (amb) {
      setRole("ambassadeur");
      setProfile({ ...amb, user_id: user.id });
      setActiveConv("direction");
      setLoading(false);
      return;
    }

    setRole("admin");
    setProfile({ id: user.id, user_id: user.id, nom: "Admin", prenom: "SBBS", branche: null });
    setActiveConv("ambassadeurs_list");
    setLoading(false);
  };

  // Charger les contacts pour directeur et admin
  const fetchContacts = useCallback(async () => {
    if (!profile) return;

    if (role === "directeur") {
      // Ambassadeurs de la même branche
      const { data: ambs } = await supabase
        .from("ambassadeurs").select("id, user_id, nom, prenom, branche")
        .eq("branche", profile.branche).order("nom");

      const contactsWithUnread: Contact[] = await Promise.all(
        (ambs || []).map(async (amb) => {
          const { count } = await supabase.from("messages")
            .select("*", { count: "exact", head: true })
            .eq("ambassadeur_id", amb.id)
            .eq("destinataire_type", "directeur")
            .eq("lu", false)
            .neq("expediteur_id", profile.user_id);
          return { ...amb, type: "ambassadeur" as const, unread: count || 0 };
        })
      );
      setContacts(contactsWithUnread);
    }

    if (role === "admin") {
      // Tous les ambassadeurs
      const { data: ambs } = await supabase
        .from("ambassadeurs").select("id, user_id, nom, prenom, branche").order("nom");

      // Tous les directeurs
      const { data: dirs } = await supabase
        .from("directeurs").select("id, user_id, nom, prenom, branche").order("nom");

      const ambContacts: Contact[] = await Promise.all(
        (ambs || []).map(async (amb) => {
          const { count } = await supabase.from("messages")
            .select("*", { count: "exact", head: true })
            .eq("ambassadeur_id", amb.id)
            .eq("lu", false)
            .neq("expediteur_id", profile.user_id);
          return { ...amb, type: "ambassadeur" as const, unread: count || 0 };
        })
      );

      const dirContacts: Contact[] = await Promise.all(
        (dirs || []).map(async (dir) => {
          const { count } = await supabase.from("messages")
            .select("*", { count: "exact", head: true })
            .eq("directeur_id", dir.id)
            .eq("lu", false)
            .neq("expediteur_id", profile.user_id);
          return { ...dir, type: "directeur" as const, unread: count || 0 };
        })
      );

      setContacts([...ambContacts, ...dirContacts]);
    }
  }, [profile, role]);

  const fetchMessages = useCallback(async () => {
    if (!profile) return;

    let data: Message[] = [];

    if (role === "ambassadeur") {
      if (activeConv === "direction") {
        // Messages entre cet ambassadeur et la direction
        const { data: msgs } = await supabase.from("messages")
          .select("*")
          .eq("destinataire_type", "direction")
          .eq("ambassadeur_id", profile.id)
          .order("created_at", { ascending: true });
        data = msgs || [];
      } else if (activeConv === "directeur") {
        // Messages entre cet ambassadeur et son directeur
        const { data: msgs } = await supabase.from("messages")
          .select("*")
          .eq("destinataire_type", "directeur")
          .eq("ambassadeur_id", profile.id)
          .order("created_at", { ascending: true });
        data = msgs || [];
      }

      // Compter non lus
      const { count: cd } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("destinataire_type", "direction")
        .eq("ambassadeur_id", profile.id)
        .eq("lu", false).neq("expediteur_id", profile.user_id);
      setUnreadDirection(cd || 0);

      const { count: cdir } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("destinataire_type", "directeur")
        .eq("ambassadeur_id", profile.id)
        .eq("lu", false).neq("expediteur_id", profile.user_id);
      setUnreadDirecteur(cdir || 0);

    } else if (role === "directeur") {
      if (activeConv === "direction") {
        // Messages entre ce directeur et la direction admin
        const { data: msgs } = await supabase.from("messages")
          .select("*")
          .eq("destinataire_type", "direction")
          .eq("directeur_id", profile.id)
          .order("created_at", { ascending: true });
        data = msgs || [];
      } else if (activeContact) {
        // Messages avec un ambassadeur spécifique
        const { data: msgs } = await supabase.from("messages")
          .select("*")
          .eq("destinataire_type", "directeur")
          .eq("ambassadeur_id", activeContact.id)
          .order("created_at", { ascending: true });
        data = msgs || [];
      }

    } else if (role === "admin") {
      if (activeContact) {
        if (activeContact.type === "ambassadeur") {
          const { data: msgs } = await supabase.from("messages")
            .select("*")
            .eq("ambassadeur_id", activeContact.id)
            .eq("destinataire_type", "direction")
            .order("created_at", { ascending: true });
          data = msgs || [];
        } else {
          const { data: msgs } = await supabase.from("messages")
            .select("*")
            .eq("directeur_id", activeContact.id)
            .eq("destinataire_type", "direction")
            .order("created_at", { ascending: true });
          data = msgs || [];
        }
      }
    }

    setMessages(data);
  }, [profile, role, activeConv, activeContact]);

  const markAsRead = async () => {
    if (!profile) return;

    if (role === "ambassadeur") {
      await supabase.from("messages").update({ lu: true })
        .eq("destinataire_type", activeConv)
        .eq("ambassadeur_id", profile.id)
        .neq("expediteur_id", profile.user_id);
    } else if (role === "directeur" && activeContact) {
      await supabase.from("messages").update({ lu: true })
        .eq("destinataire_type", "directeur")
        .eq("ambassadeur_id", activeContact.id)
        .neq("expediteur_id", profile.user_id);
    } else if (role === "admin" && activeContact) {
      await supabase.from("messages").update({ lu: true })
        .eq("ambassadeur_id", activeContact.id)
        .neq("expediteur_id", profile.user_id);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !profile || sending) return;
    setSending(true);

    const expediteurNom = role === "admin"
      ? "Direction SBBS"
      : `${profile.prenom} ${profile.nom}`;

    let payload: any = {
      contenu: newMessage.trim(),
      expediteur_id: profile.user_id,
      expediteur_nom: expediteurNom,
      expediteur_role: role,
      lu: false,
    };

    if (role === "ambassadeur") {
      payload.destinataire_type = activeConv; // "direction" ou "directeur"
      payload.ambassadeur_id = profile.id;
      payload.branche = profile.branche;
    } else if (role === "directeur") {
      if (activeConv === "direction") {
        payload.destinataire_type = "direction";
        payload.directeur_id = profile.id;
        payload.branche = profile.branche;
      } else if (activeContact) {
        payload.destinataire_type = "directeur";
        payload.ambassadeur_id = activeContact.id;
        payload.branche = profile.branche;
      }
    } else if (role === "admin" && activeContact) {
      if (activeContact.type === "ambassadeur") {
        payload.destinataire_type = "direction";
        payload.ambassadeur_id = activeContact.id;
      } else {
        payload.destinataire_type = "direction";
        payload.directeur_id = activeContact.id;
      }
    }

    await supabase.from("messages").insert(payload);
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

  // Titre de la conversation active
  const getConvTitle = () => {
    if (role === "ambassadeur") {
      return activeConv === "direction" ? "Direction Commerciale & Marketing" : `Mon Directeur · ${profile?.branche}`;
    }
    if (role === "directeur") {
      return activeConv === "direction" ? "Direction Commerciale & Marketing" :
        activeContact ? `${activeContact.prenom} ${activeContact.nom}` : "Sélectionnez un ambassadeur";
    }
    if (role === "admin" && activeContact) {
      return `${activeContact.prenom} ${activeContact.nom} · ${activeContact.branche || ""}`;
    }
    return "Messages";
  };

  const canSend = () => {
    if (role === "ambassadeur") return true;
    if (role === "directeur") return activeConv === "direction" || !!activeContact;
    if (role === "admin") return !!activeContact;
    return false;
  };

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
          <h1 className="font-bold text-sm leading-none truncate">{getConvTitle()}</h1>
          <p className="text-xs text-blue-200 capitalize mt-0.5">{role}</p>
        </div>
        <div className="flex items-center gap-1 bg-green-500/20 border border-green-400/40 px-2 py-1 rounded-full shrink-0">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-300 font-medium">Live</span>
        </div>
      </header>

      {/* ─── AMBASSADEUR : onglets Direction / Directeur ─── */}
      {role === "ambassadeur" && (
        <div className="flex shrink-0 bg-white border-b border-gray-200">
          {[
            { id: "direction", label: "Direction", emoji: "🏢", unread: unreadDirection },
            { id: "directeur", label: "Mon Directeur", emoji: "👔", unread: unreadDirecteur },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveConv(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 ${
                activeConv === tab.id ? "border-sbbs-blue text-sbbs-blue" : "border-transparent text-gray-400"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.unread > 0 && (
                <span className="bg-sbbs-red text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {tab.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ─── DIRECTEUR : onglets Direction / Ambassadeurs ─── */}
      {role === "directeur" && (
        <div className="flex shrink-0 bg-white border-b border-gray-200">
          <button
            onClick={() => { setActiveConv("direction"); setActiveContact(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 ${
              activeConv === "direction" ? "border-sbbs-blue text-sbbs-blue" : "border-transparent text-gray-400"
            }`}
          >
            🏢 Direction
          </button>
          <button
            onClick={() => setActiveConv("ambassadeurs")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 ${
              activeConv !== "direction" ? "border-sbbs-blue text-sbbs-blue" : "border-transparent text-gray-400"
            }`}
          >
            👥 Ambassadeurs
            {contacts.reduce((s, c) => s + c.unread, 0) > 0 && (
              <span className="bg-sbbs-red text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {contacts.reduce((s, c) => s + c.unread, 0)}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden max-w-5xl mx-auto w-full">

        {/* ─── LISTE CONTACTS (directeur ambassadeurs / admin) ─── */}
        {((role === "directeur" && activeConv === "ambassadeurs") || role === "admin") && (
          <div className={`${role === "admin" ? "w-64 shrink-0" : "w-full"} bg-white border-r border-gray-200 overflow-y-auto`}>
            {contacts.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                <p className="text-3xl mb-2">👥</p>
                <p>Aucun contact</p>
              </div>
            ) : contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => {
                  setActiveContact(contact);
                  if (role === "directeur") setActiveConv("ambassadeur_conv");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 ${
                  activeContact?.id === contact.id ? "bg-blue-50 border-l-4 border-l-sbbs-blue" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-sbbs-blue flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {contact.prenom?.[0]}{contact.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sbbs-blue text-sm truncate">{contact.prenom} {contact.nom}</p>
                  <p className="text-xs text-gray-400 truncate">{contact.branche}</p>
                  {contact.type === "directeur" && (
                    <span className="text-xs text-purple-600 font-medium">Directeur</span>
                  )}
                </div>
                {contact.unread > 0 && (
                  <span className="bg-sbbs-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {contact.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ─── ZONE MESSAGES ─── */}
        {(role === "ambassadeur" || (role === "directeur" && activeConv === "direction") || (role === "directeur" && activeContact) || (role === "admin" && activeContact)) && (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p className="text-5xl mb-3">💬</p>
                  <p className="font-medium text-sm">Aucun message</p>
                  <p className="text-xs mt-1">Envoyez le premier message !</p>
                </div>
              ) : messages.map((msg, i) => {
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
                        {mine && <span className="ml-1">{msg.lu ? "✓✓" : "✓"}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {canSend() && (
              <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4 max-w-2xl mx-auto w-full">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
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
            )}
          </div>
        )}

        {/* ─── ADMIN : pas de contact sélectionné ─── */}
        {role === "admin" && !activeContact && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <p className="text-5xl mb-3">💬</p>
            <p className="font-medium text-sm">Sélectionnez un contact</p>
            <p className="text-xs mt-1">Choisissez un ambassadeur ou directeur à gauche</p>
          </div>
        )}
      </div>
    </div>
  );
}
