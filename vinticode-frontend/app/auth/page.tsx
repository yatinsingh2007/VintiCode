"use client"
import { useState } from "react";
import Login from "@/section/Login";
import Signup from "@/section/Signup";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { GridBeams } from "@/components/ui/grid-beams";
import { Button } from "@/components/ui/button";
import { ShineBorder } from "@/components/magicui/shine-border";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "signup", label: "Sign Up" },
  { id: "login", label: "Login" },
] as const;

export default function AuthPage(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<"signup" | "login">("signup");
  const router = useRouter();

  return (
    <GridBeams className="flex items-center justify-center w-full min-h-screen p-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 z-20 rounded-full text-white/70 hover:text-white hover:bg-white/10"
      >
        <ArrowLeft />
      </Button>

      {/* Force dark mode tokens — GridBeams bg is always dark */}
      <div className="dark w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
          <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />

          <div className="px-4 pt-4 pb-4 border-b border-border">
            <div className="flex rounded-xl bg-muted p-1 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === "login" ? <Login /> : <Signup />}
          </div>
        </div>
      </div>
    </GridBeams>
  );
}
