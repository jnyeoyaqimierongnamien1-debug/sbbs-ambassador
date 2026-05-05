"use client";
import { useRouter, usePathname } from "next/navigation";

export default function AssistantFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const hiddenPaths = ["/login", "/register", "/devenir-ambassadeur", "/devenir-directeur", "/assistant"];
  if (hiddenPaths.includes(pathname)) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-center">
      <button
        onClick={() => router.push("/assistant")}
        className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-200"
        style={{
          background: "linear-gradient(135deg, #4B0082 0%, #7B2FBE 50%, #C9A84C 100%)",
          boxShadow: "0 6px 24px rgba(75,0,130,0.45), 0 2px 8px rgba(0,0,0,0.2)",
        }}
        title="Assistant IA SBBS"
      >
        <span className="text-lg">🤖</span>
      </button>
      <p className="text-center font-bold mt-1 drop-shadow"
        style={{ fontSize: "8px", color: "#4B0082", textShadow: "0 1px 2px rgba(255,255,255,0.8)" }}>
        ALEX IA
      </p>
    </div>
  );
}
