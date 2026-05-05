"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevPathname = useRef(pathname);
  const loadingTimer = useRef<NodeJS.Timeout>();
  const doneTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (pathname === prevPathname.current) {
      setDisplayChildren(children);
      return;
    }

    // Nouvelle page — afficher skeleton immédiatement
    setIsLoading(true);
    clearTimeout(loadingTimer.current);
    clearTimeout(doneTimer.current);

    // Mettre à jour le contenu après un tout petit délai (imperceptible)
    loadingTimer.current = setTimeout(() => {
      setDisplayChildren(children);
      prevPathname.current = pathname;
      // Masquer le skeleton rapidement
      doneTimer.current = setTimeout(() => {
        setIsLoading(false);
      }, 80);
    }, 50);

    return () => {
      clearTimeout(loadingTimer.current);
      clearTimeout(doneTimer.current);
    };
  }, [pathname, children]);

  return (
    <>
      {/* Barre de progression en haut — style WhatsApp */}
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-[9999]" style={{ height: "3px" }}>
          <div
            className="h-full"
            style={{
              background: "linear-gradient(90deg, #1A3A6C, #2563EB, #C9A84C)",
              animation: "sbbs-progress 0.6s ease-out forwards",
            }}
          />
        </div>
      )}

      {/* Contenu avec fade-in */}
      <div
        style={{
          opacity: isLoading ? 0.7 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {displayChildren}
      </div>
    </>
  );
}
