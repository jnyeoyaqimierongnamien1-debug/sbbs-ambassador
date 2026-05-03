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
  fichier_url?: string;
  fichier_type?: string;
  fichier_nom?: string;
};

type Contact = {
  id: string;
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
  const [activeConv, setActiveConv] = useState<string>("direction");
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [unreadDirection, setUnreadDirection] = useState(0);
  const [unreadDirecteur, setUnreadDirecteur] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarView, setSidebarView] = useState<"contacts" | "settings">("contacts");

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    if (profile) {
      if (role === "directeur" || role === "admin") fetchContacts();
      fetchMessages();
      markAsRead();

      const channel = supabase
        .channel("chat-realtime-v4")
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

  useEffect(() => {
    if (showSearch) setTimeout(() => searchRef.current?.focus(), 100);
  }, [showSearch]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: dir } = await supabase.from("directeurs").select("*").eq("user_id", user.id).single();
    if (dir) {
      setRole("directeur");
      setProfile({ ...dir, user_id: user.id });
      setActiveConv("direction");
      setLoading(false);
      return;
    }

    const { data: amb } = await supabase.from("ambassadeurs").select("*").eq("user_id", user.id).single();
    if (amb) {
      setRole("ambassadeur");
      setProfile({ ...amb, user_id: user.id });
      setActiveConv("direction");
      setSidebarOpen(false);
      setLoading(false);
      return;
    }

    setRole("admin");
    setProfile({ id: user.id, user_id: user.id, nom: "Admin", prenom: "SBBS", branche: null });
    setLoading(false);
  };

  const fetchContacts = useCallback(async () => {
    if (!profile) return;

    if (role === "directeur") {
      const { data: ambs } = await supabase
        .from("ambassadeurs").select("id, user_id, nom, prenom, branche")
        .eq("branche", profile.branche).order("nom");

      const contactsWithUnread: Contact[] = await Promise.all(
        (ambs || []).map(async (amb) => {
          const { count } = await supabase.from("messages")
            .select("*", { count: "exact", head: true })
            .eq("ambassadeur_id", amb.id).eq("destinataire_type", "directeur")
            .eq("lu", false).neq("expediteur_id", profile.user_id);
          return { ...amb, type: "ambassadeur" as const, unread: count || 0 };
        })
      );
      setContacts(contactsWithUnread);
    }

    if (role === "admin") {
      const { data: ambs } = await supabase.from("ambassadeurs").select("id, user_id, nom, prenom, branche").order("nom");
      const { data: dirs } = await supabase.from("directeurs").select("id, user_id, nom, prenom, branche").order("nom");

      const ambContacts: Contact[] = await Promise.all(
        (ambs || []).map(async (amb) => {
          const { count } = await supabase.from("messages")
            .select("*", { count: "exact", head: true })
            .eq("ambassadeur_id", amb.id).eq("lu", false).neq("expediteur_id", profile.user_id);
          return { ...amb, type: "ambassadeur" as const, unread: count || 0 };
        })
      );

      const dirContacts: Contact[] = await Promise.all(
        (dirs || []).map(async (dir) => {
          const { count } = await supabase.from("messages")
            .select("*", { count: "exact", head: true })
            .eq("directeur_id", dir.id).eq("lu", false).neq("expediteur_id", profile.user_id);
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
      const { data: msgs } = await supabase.from("messages").select("*")
        .eq("destinataire_type", activeConv).eq("ambassadeur_id", profile.id)
        .order("created_at", { ascending: true });
      data = msgs || [];

      const { count: cd } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("destinataire_type", "direction").eq("ambassadeur_id", profile.id)
        .eq("lu", false).neq("expediteur_id", profile.user_id);
      setUnreadDirection(cd || 0);

      const { count: cdir } = await supabase.from("messages")
        .select("*", { count: "exact", head: true })
        .eq("destinataire_type", "directeur").eq("ambassadeur_id", profile.id)
        .eq("lu", false).neq("expediteur_id", profile.user_id);
      setUnreadDirecteur(cdir || 0);

    } else if (role === "directeur") {
      if (activeConv === "direction") {
        const { data: msgs } = await supabase.from("messages").select("*")
          .eq("destinataire_type", "direction").eq("directeur_id", profile.id)
          .order("created_at", { ascending: true });
        data = msgs || [];
      } else if (activeContact) {
        const { data: msgs } = await supabase.from("messages").select("*")
          .eq("destinataire_type", "directeur").eq("ambassadeur_id", activeContact.id)
          .order("created_at", { ascending: true });
        data = msgs || [];
      }
    } else if (role === "admin" && activeContact) {
      if (activeContact.type === "ambassadeur") {
        const { data: msgs } = await supabase.from("messages").select("*")
          .eq("ambassadeur_id", activeContact.id).eq("destinataire_type", "direction")
          .order("created_at", { ascending: true });
        data = msgs || [];
      } else {
        const { data: msgs } = await supabase.from("messages").select("*")
          .eq("directeur_id", activeContact.id).eq("destinataire_type", "direction")
          .order("created_at", { ascending: true });
        data = msgs || [];
      }
    }

    setMessages(data);
  }, [profile, role, activeConv, activeContact]);

  const markAsRead = async () => {
    if (!profile) return;
    if (role === "ambassadeur") {
      await supabase.from("messages").update({ lu: true })
        .eq("destinataire_type", activeConv).eq("ambassadeur_id", profile.id)
        .neq("expediteur_id", profile.user_id);
    } else if (role === "directeur" && activeContact) {
      await supabase.from("messages").update({ lu: true })
        .eq("destinataire_type", "directeur").eq("ambassadeur_id", activeContact.id)
        .neq("expediteur_id", profile.user_id);
    } else if (role === "admin" && activeContact) {
      await supabase.from("messages").update({ lu: true })
        .eq("ambassadeur_id", activeContact.id).neq("expediteur_id", profile.user_id);
    }
  };

  const buildPayload = (extra: any = {}) => {
    const expediteurNom = role === "admin" ? "Direction SBBS" : `${profile.prenom} ${profile.nom}`;
    let payload: any = { expediteur_id: profile.user_id, expediteur_nom: expediteurNom, expediteur_role: role, lu: false, ...extra };

    if (role === "ambassadeur") {
      payload.destinataire_type = activeConv;
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
      payload.destinataire_type = "direction";
      if (activeContact.type === "ambassadeur") payload.ambassadeur_id = activeContact.id;
      else payload.directeur_id = activeContact.id;
    }

    return payload;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !profile || sending) return;
    setSending(true);
    await supabase.from("messages").insert(buildPayload({ contenu: newMessage.trim() }));
    setNewMessage("");
    await fetchMessages();
    setSending(false);
  };

  const handleFileUpload = async (file: File, type: "fichier" | "photo" | "video") => {
    if (!file || !profile) return;
    setUploadingFile(true);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const fileName = `chat/${profile.user_id}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("fichiers").upload(fileName, file, { upsert: false, contentType: file.type });
    if (error) { setUploadingFile(false); return; }
    const { data: urlData } = supabase.storage.from("fichiers").getPublicUrl(fileName);
    await supabase.from("messages").insert(buildPayload({ contenu: file.name, fichier_url: urlData.publicUrl, fichier_type: type, fichier_nom: file.name }));
    await fetchMessages();
    setUploadingFile(false);
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " " + date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const isMe = (msg: Message) => msg.expediteur_id === profile?.user_id;
  const canSend = () => {
    if (role === "ambassadeur") return true;
    if (role === "directeur") return activeConv === "direction" || !!activeContact;
    if (role === "admin") return !!activeContact;
    return false;
  };

  const getConvTitle = () => {
    if (role === "ambassadeur") return activeConv === "direction" ? "Direction Commerciale & Marketing" : `Mon Directeur · ${profile?.branche}`;
    if (role === "directeur") return activeConv === "direction" ? "Direction Commerciale & Marketing" : activeContact ? `${activeContact.prenom} ${activeContact.nom}` : "Messages";
    if (role === "admin" && activeContact) return `${activeContact.prenom} ${activeContact.nom}`;
    return "Messages";
  };

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);
  const filteredContacts = contacts.filter(c =>
    `${c.prenom} ${c.nom} ${c.branche}`.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const showSidebar = (role === "directeur" && activeConv === "ambassadeurs") || role === "admin";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-sbbs-blue font-semibold animate-pulse">Chargement...</p>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#F0F2F5" }}>

      {/* ─── HEADER ─── */}
      <header className="bg-sbbs-blue text-white px-4 py-3 flex items-center gap-3 shadow-lg shrink-0">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white text-sm transition shrink-0">← Retour</button>
        <img src="/LOGO%20SBBS%20PNG.webp" alt="SBBS" className="w-9 h-9 rounded-full border-2 border-sbbs-gold shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm leading-none truncate">{getConvTitle()}</h1>
          <p className="text-xs text-blue-200 mt-0.5 capitalize">{role}</p>
        </div>
        {/* Toggle sidebar — visible si admin ou directeur */}
        {showSidebar && (
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition shrink-0"
            title={sidebarOpen ? "Fermer le panneau" : "Ouvrir le panneau"}
          >
            {sidebarOpen ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            )}
          </button>
        )}
        <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/40 px-2.5 py-1 rounded-full shrink-0">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-300 font-medium">Live</span>
        </div>
      </header>

      {/* Onglets ambassadeur */}
      {role === "ambassadeur" && (
        <div className="flex shrink-0 bg-white border-b border-gray-200 shadow-sm">
          {[
            { id: "direction", label: "Administration", emoji: "🏛️", unread: unreadDirection },
            { id: "directeur", label: "Mon Directeur", emoji: "👔", unread: unreadDirecteur },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveConv(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 ${
                activeConv === tab.id ? "border-sbbs-blue text-sbbs-blue bg-blue-50" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              <span>{tab.emoji}</span><span>{tab.label}</span>
              {tab.unread > 0 && <span className="bg-sbbs-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{tab.unread}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Onglets directeur */}
      {role === "directeur" && (
        <div className="flex shrink-0 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => { setActiveConv("direction"); setActiveContact(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 ${
              activeConv === "direction" ? "border-sbbs-blue text-sbbs-blue bg-blue-50" : "border-transparent text-gray-500"
            }`}>
            🏛️ Administration
          </button>
          <button onClick={() => { setActiveConv("ambassadeurs"); setSidebarOpen(true); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition border-b-2 ${
              activeConv !== "direction" ? "border-sbbs-blue text-sbbs-blue bg-blue-50" : "border-transparent text-gray-500"
            }`}>
            👥 Ambassadeurs
            {totalUnread > 0 && <span className="bg-sbbs-red text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">{totalUnread}</span>}
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ─── SIDEBAR PREMIUM ─── */}
        {showSidebar && sidebarOpen && (
          <div className="w-72 shrink-0 flex flex-col bg-white border-r border-gray-200 shadow-md transition-all duration-300 overflow-hidden">

            {/* En-tête sidebar avec dégradé */}
            <div className="shrink-0 px-4 py-3" style={{ background: "linear-gradient(135deg, #1A3A6C 0%, #2563EB 100%)" }}>

              {/* Profil + actions */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-sbbs-gold flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {profile?.prenom?.[0]}{profile?.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{profile?.prenom} {profile?.nom}</p>
                  <p className="text-xs text-blue-200 capitalize">{role}</p>
                </div>
              </div>

              {/* Icônes d'action */}
              <div className="flex gap-2">
                {/* Nouvelle conversation */}
                <button
                  onClick={() => { setActiveContact(null); setSearchQuery(""); setSidebarView("contacts"); }}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
                  title="Conversations"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-xs text-white/80">Discussions</span>
                </button>

                {/* Recherche */}
                <button
                  onClick={() => { setShowSearch(s => !s); setSidebarView("contacts"); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition ${showSearch ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
                  title="Rechercher"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-xs text-white/80">Recherche</span>
                </button>

                {/* Paramètres */}
                <button
                  onClick={() => setSidebarView(v => v === "settings" ? "contacts" : "settings")}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition ${sidebarView === "settings" ? "bg-white/30" : "bg-white/10 hover:bg-white/20"}`}
                  title="Paramètres"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-white/80">Paramètres</span>
                </button>
              </div>
            </div>

            {/* Barre de recherche */}
            {showSearch && sidebarView === "contacts" && (
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un contact..."
                    className="flex-1 text-sm focus:outline-none bg-transparent"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">✕</button>
                  )}
                </div>
              </div>
            )}

            {/* ─── VUE CONTACTS ─── */}
            {sidebarView === "contacts" && (
              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    {searchQuery ? `${filteredContacts.length} résultat(s)` : `${contacts.length} contact(s)`}
                  </p>
                </div>
                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-4xl mb-2">🔍</p>
                    <p className="text-sm">{searchQuery ? "Aucun résultat" : "Aucun contact"}</p>
                  </div>
                ) : filteredContacts.map(contact => (
                  <button key={contact.id}
                    onClick={() => { setActiveContact(contact); if (role === "directeur") setActiveConv("ambassadeur_conv"); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition border-b border-gray-100 ${
                      activeContact?.id === contact.id ? "bg-blue-50 border-l-4 border-l-sbbs-blue" : "hover:bg-gray-50"
                    }`}>
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                      style={{ background: contact.type === "directeur" ? "linear-gradient(135deg, #7C3AED, #A855F7)" : "linear-gradient(135deg, #1A3A6C, #2563EB)" }}>
                      {contact.prenom?.[0]}{contact.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{contact.prenom} {contact.nom}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{contact.branche}</p>
                      {contact.type === "directeur" && (
                        <span className="text-xs text-purple-600 font-semibold">Directeur</span>
                      )}
                    </div>
                    {contact.unread > 0 && (
                      <span className="bg-sbbs-red text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shrink-0">
                        {contact.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ─── VUE PARAMÈTRES ─── */}
            {sidebarView === "settings" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Paramètres du chat</p>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Notifications</p>
                      <p className="text-xs text-gray-400">Nouveaux messages</p>
                    </div>
                    <div className="w-10 h-6 bg-sbbs-blue rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Accusés de réception</p>
                      <p className="text-xs text-gray-400">Afficher les ✓✓</p>
                    </div>
                    <div className="w-10 h-6 bg-sbbs-blue rounded-full flex items-center justify-end px-1">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Mon profil</p>
                  <p className="text-xs text-gray-400">{profile?.prenom} {profile?.nom}</p>
                  <p className="text-xs text-gray-400 capitalize">{role}</p>
                  {profile?.branche && <p className="text-xs text-sbbs-blue mt-1">{profile.branche}</p>}
                </div>

                <button
                  onClick={() => router.push("/parametres")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sbbs-blue text-white text-sm font-semibold hover:bg-blue-800 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                  Aller aux Paramètres
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── ZONE MESSAGES ─── */}
        {(role === "ambassadeur" || (role === "directeur" && activeConv === "direction") || (role === "directeur" && activeContact) || (role === "admin" && activeContact)) && (
  <div className="flex-1 flex flex-col overflow-hidden max-w-3xl mx-auto w-full">

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 max-w-3xl mx-auto w-full" style={{ background: "#E5DDD5" }}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="bg-white rounded-2xl px-8 py-8 text-center shadow-sm">
                    <p className="text-5xl mb-3">💬</p>
                    <p className="font-semibold text-gray-700">Aucun message</p>
                    <p className="text-sm text-gray-400 mt-1">Envoyez le premier message !</p>
                  </div>
                </div>
              ) : messages.map((msg, i) => {
                const mine = isMe(msg);
                const showName = !mine && (i === 0 || messages[i - 1]?.expediteur_id !== msg.expediteur_id);
                const showTime = i === messages.length - 1 || messages[i + 1]?.expediteur_id !== msg.expediteur_id;

                return (
                  <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"} ${i > 0 && messages[i-1]?.expediteur_id === msg.expediteur_id ? "mt-0.5" : "mt-3"}`}>
                    <div className={`max-w-[70%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
                      {showName && <p className="text-xs font-semibold mb-1 px-1" style={{ color: "#1A3A6C" }}>{msg.expediteur_nom}</p>}
                      <div className={`relative px-3 py-2 rounded-2xl shadow-sm text-sm leading-relaxed break-words ${mine ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                        style={mine ? { background: "#1A3A6C", color: "white" } : { background: "white", color: "#1a1a1a" }}>
                        {msg.fichier_url && msg.fichier_type === "photo" && (
                          <img src={msg.fichier_url} alt={msg.fichier_nom} className="rounded-xl mb-2 max-w-full" style={{ maxHeight: "200px", objectFit: "cover" }} />
                        )}
                        {msg.fichier_url && msg.fichier_type === "video" && (
                          <video src={msg.fichier_url} controls className="rounded-xl mb-2 max-w-full" style={{ maxHeight: "200px" }} />
                        )}
                        {msg.fichier_url && msg.fichier_type === "fichier" && (
                          <a href={msg.fichier_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 mb-2 bg-black/10 rounded-xl px-3 py-2">
                            <span className="text-xl">📎</span>
                            <span className="text-xs font-medium truncate">{msg.fichier_nom}</span>
                          </a>
                        )}
                        {msg.contenu && (!msg.fichier_url || msg.fichier_type === "fichier") && <span>{msg.contenu}</span>}
                      </div>
                      {showTime && (
                        <p className="text-xs mt-1 px-1" style={{ color: "#667781" }}>
                          {formatTime(msg.created_at)}{mine && <span className="ml-1">{msg.lu ? " ✓✓" : " ✓"}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {canSend() && (
              <div className="shrink-0 px-3 py-3 bg-gray-100 border-t border-gray-200">
                <div className="flex gap-2 mb-2">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm">
                    📎 <span className="hidden sm:inline">Fichier</span>
                  </button>
                  <button onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm">
                    📷 <span className="hidden sm:inline">Photo</span>
                  </button>
                  <button onClick={() => videoInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition shadow-sm">
                    🎥 <span className="hidden sm:inline">Vidéo</span>
                  </button>
                  {uploadingFile && <span className="text-xs text-sbbs-blue animate-pulse self-center">Envoi...</span>}
                </div>

                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "fichier"); e.target.value = ""; }} />
                <input ref={cameraInputRef} type="file" className="hidden" accept="image/*" capture="environment"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "photo"); e.target.value = ""; }} />
                <input ref={videoInputRef} type="file" className="hidden" accept="video/*" capture="environment"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, "video"); e.target.value = ""; }} />

                <div className="flex gap-2 items-end">
                  <textarea value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Écrivez votre message..."
                    rows={1}
                    className="flex-1 border-0 rounded-2xl px-4 py-2.5 text-sm focus:outline-none resize-none shadow-sm"
                    style={{ minHeight: "42px", maxHeight: "120px", background: "white" }}
                  />
                  <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                    className="w-11 h-11 rounded-full flex items-center justify-center transition disabled:opacity-40 shrink-0 shadow-md"
                    style={{ background: "linear-gradient(135deg, #1A3A6C, #2563EB)" }}>
                    {sending ? <span className="text-white text-xs animate-pulse">...</span> : (
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

        {/* Admin sans contact */}
        {role === "admin" && !activeContact && (
          <div className="flex-1 flex flex-col items-center justify-center" style={{ background: "#E5DDD5" }}>
            <div className="bg-white rounded-2xl px-10 py-10 text-center shadow-sm">
              <p className="text-5xl mb-3">💬</p>
              <p className="font-semibold text-gray-700">Sélectionnez un contact</p>
              <p className="text-sm text-gray-400 mt-1">Choisissez dans le panneau à gauche</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
