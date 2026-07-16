"use client"
import { useState } from "react";
import Login from "@/section/Login";
import Signup from "@/section/Signup";
import { MoveLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { GridBeams } from "@/components/ui/grid-beams";



export default function ShineBorderDemo(): React.ReactNode {
  const [activeTab, setActiveTab] = useState<string>("signup");
  const router = useRouter();

  return (
    <GridBeams className="flex items-center justify-center w-full h-screen p-4">
      <div
        onClick={() => router.push('/')}
        className="absolute top-5 left-5 p-2 bg-gray-800 rounded-full cursor-pointer hover:bg-gray-700 transition z-20"
      >
        <MoveLeftIcon className="text-white" />
      </div>
      <div className="w-full max-w-md bg-transparent rounded-xl shadow-lg relative flex flex-col h-[600px]">
        {/* Tabs */}
        <div className="flex w-full rounded-t-xl overflow-hidden border-b border-gray-700 z-10">
          <button
            onClick={() => setActiveTab("signup")}
            className={`flex-1 py-3 text-sm font-bold transition-all duration-300 ${activeTab === "signup"
              ? "bg-white text-black"
              : "bg-black text-gray-300 hover:bg-gray-900"
              }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-3 text-sm font-bold transition-all duration-300 ${activeTab === "login"
              ? "bg-white text-black"
              : "bg-black text-gray-300 hover:bg-gray-900"
              }`}
          >
            Login
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "login" ? <Login /> : <Signup />}
        </div>
      </div>
    </GridBeams>
  );
}
