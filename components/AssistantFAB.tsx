"use client";

import { useRouter, usePathname } from "next/navigation";

export default function AssistantFAB() {
  const router = useRouter();
  const pathname = usePathname();

  const hiddenPaths = ["/login", "/register", "/devenir-ambassadeur", "/devenir-directeur", "/assistant"];
  if (hiddenPaths.includes(pathname)) return null;

  return (
    <div className="fixed bottom-6 right-20 z-50">
      <button
        onClick={() => router.push("/assistant")}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-200"
        style={{
          background: "linear-gradient(135deg, #4B0082 0%, #7B2FBE 50%, #C9A84C 100%)",
          boxShadow: "0 8px 32px rgba(75,0,130,0.5), 0 2px 8px rgba(0,0,0,0.2)",
        }}
        title="Assistant IA SBBS"
      >
        <span className="text-2xl">🤖</span>
      </button>
      <p className="text-center text-white text-xs font-bold mt-1 drop-shadow"
        style={{ fontSize: "9px", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
        ALEX IA
      </p>
    </div>
  );
}
