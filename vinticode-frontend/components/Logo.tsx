import Link from "next/link";
import { motion } from "motion/react";
import { LogoMark } from "@/components/playground";

export const Logo = () => {
  return (
    <Link
      href="/dashboard/home"
      className="relative z-20 flex items-center gap-2.5 rounded-md py-1 text-sm font-normal text-white"
    >
      <LogoMark className="size-7" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="whitespace-pre text-base font-extrabold tracking-tight text-white"
      >
        VintiCode
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/dashboard/home"
      aria-label="VintiCode home"
      className="relative z-20 flex items-center py-1"
    >
      <LogoMark className="size-7" />
    </Link>
  );
};
