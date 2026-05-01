"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";

export default function ChatFAB() {
  const [unread, setUnread] = useState(0);
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Cacher sur la page chat elle-même
  const hiddenPaths = ["/login", "/register", "/devenir-ambassadeur", "/devenir-directeur"];
  const isHidden = hiddenPaths.includes(pathname) || pathname === "/chat";

  useEffect(() => {
    if (isHidden) return;
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setVisible(true);
    fetchUnread(user.id);

    // Realtime non lus
    const channel = supabase
      .channel("fab-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchUnread(user.id);
        setPulse(true);
        setTimeout(() => setPulse(false), 2000);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const fetchUnread = async (userId: string) => {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("lu", false)
      .neq("expediteur_id", userId);

    setUnread(count || 0);
  };

  if (isHidden || !visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">

      {/* Tooltip */}
      <div className={`bg-sbbs-blue text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-lg transition-all duration-300 ${unread > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        {unread} nouveau{unread > 1 ? "x" : ""} message{unread > 1 ? "s" : ""}
      </div>

      {/* Bouton principal */}
      <button
        onClick={() => router.push("/chat")}
        className={`relative group flex items-center justify-center transition-all duration-300 ${pulse ? "scale-110" : "scale-100"}`}
        title="Messagerie SBBS"
      >
        {/* Halo animé si nouveaux messages */}
        {unread > 0 && (
          <>
            <span className="absolute inset-0 rounded-full bg-sbbs-red opacity-30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-sbbs-red opacity-20 animate-pulse" />
          </>
        )}

        {/* Bouton */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-200 cursor-pointer"
          style={{
            background: unread > 0
              ? "linear-gradient(135deg, #CC0000 0%, #FF4444 100%)"
              : "linear-gradient(135deg, #1A3A6C 0%, #2563EB 100%)",
            boxShadow: unread > 0
              ? "0 8px 32px rgba(204,0,0,0.5), 0 2px 8px rgba(0,0,0,0.2)"
              : "0 8px 32px rgba(26,58,108,0.5), 0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>

        {/* Badge nombre */}
        {unread > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-sbbs-red border-2 border-white rounded-full flex items-center justify-center px-1">
            <span className="text-white text-xs font-bold leading-none">
              {unread > 99 ? "99+" : unread}
            </span>
          </div>
        )}
      </button>
    </div>
  );
}
