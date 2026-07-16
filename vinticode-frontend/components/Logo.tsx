import Link from "next/link";
import { motion } from "motion/react";

/*
  The wordmark read "Allgrow" — the project's former name, still shown in the
  user sidebar while the admin console said "VintiCode". Same product, two
  different brands depending on which half of it you were in.

  Also fixed here: the logo linked to "#" (a dead anchor that jumps to the top
  of the page instead of navigating home), and LogoIcon carried a hardcoded
  `text-black` that is invisible against the dark sidebar.
*/
const Mark = () => (
  <div
    aria-hidden="true"
    className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-primary"
  />
);

export const Logo = () => {
  return (
    <Link
      href="/dashboard/home"
      className="relative z-20 flex items-center space-x-2 rounded-md py-1 text-sm font-normal text-foreground"
    >
      <Mark />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-foreground"
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
      className="relative z-20 flex items-center space-x-2 rounded-md py-1 text-sm font-normal text-foreground"
    >
      <Mark />
    </Link>
  );
};
