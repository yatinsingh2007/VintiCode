"use client";
import { useState } from "react";
import Login from "@/section/Login";
import Signup from "@/section/Signup";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PlayScreen, PlayCard, Sticker, LogoMark, A } from "@/components/playground";

const tabs = [
  { id: "signup", label: "Sign Up" },
  { id: "login", label: "Login" },
] as const;

export default function AuthPage(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");
  const router = useRouter();

  return (
    <PlayScreen className="flex items-center justify-center p-4">
      {/* Back button */}
      <motion.button
        onClick={() => router.push("/")}
        aria-label="Back to home"
        whileHover={{ x: -3, y: -3, boxShadow: "6px 6px 0 0 var(--pg-cyan)" }}
        whileTap={{ scale: 0.92 }}
        initial={{ boxShadow: "3px 3px 0 0 var(--pg-cyan)" }}
        transition={{ type: "spring", stiffness: 400, damping: 14 }}
        className="absolute left-4 top-4 z-20 grid size-10 place-items-center rounded-xl border-[3px] border-black bg-[#141419] text-white"
      >
        <ArrowLeft strokeWidth={2.5} />
      </motion.button>

      {/* scattered stickers */}
      <Sticker color={A.cyan} className="left-[12%] top-[18%] hidden lg:block" from={-8} to={4}>
        {"{ }"}
      </Sticker>
      <Sticker color={A.amber} className="right-[14%] bottom-[20%] hidden lg:block" from={6} to={-6}>
        O(1)
      </Sticker>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="w-full max-w-md"
      >
        {/* brand */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="text-xl font-extrabold tracking-tight">VintiCode</span>
        </div>

        <PlayCard color={A.cyan} offset={10} className="overflow-hidden p-6">
          {/* Tab switcher */}
          <div className="mb-6 flex gap-2 rounded-xl border-[3px] border-black bg-[#0d0d11] p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 rounded-lg py-2 text-sm font-bold transition-colors"
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="auth-tab"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-lg border-[3px] border-black"
                    style={{ background: A.lime }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10",
                    activeTab === tab.id ? "text-black" : "text-white/60 hover:text-white"
                  )}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          {activeTab === "login" ? <Login /> : <Signup />}
        </PlayCard>
      </motion.div>
    </PlayScreen>
  );
}
