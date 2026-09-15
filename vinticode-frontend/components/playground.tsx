"use client";

/*
  ── VintiCode "Playground" design system ─────────────────────────
  The neo-brutalist visual language used across the whole app: flat
  solid accent colours, thick black borders, hard offset "sticker"
  shadows, and springy Motion interactions. Import these primitives
  instead of re-inlining the styles on every page.

  Accent hexes live in globals.css as --pg-* CSS vars so a single edit
  re-themes everything. Motion respects prefers-reduced-motion via the
  <PlayScreen> MotionConfig wrapper.
*/

import React, { useEffect, useLayoutEffect, useRef } from "react";
import {
  motion,
  MotionConfig,
  useMotionValue,
  useSpring,
} from "motion/react";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

/* useLayoutEffect on the client, useEffect on the server (avoids the SSR warning). */
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/*
  GSAP staggered "pop" reveal. Attach the returned ref to a container, mark
  the children you want to animate with `data-reveal`, and they spring in with
  a bouncy back.out ease. Re-runs whenever `active` flips true (e.g. after data
  loads). Respects prefers-reduced-motion.
*/
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(active = true) {
  const scope = useRef<T>(null);
  useIsoLayoutEffect(() => {
    if (!active || isReduced() || !scope.current) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-reveal]", {
        opacity: 0,
        y: 30,
        scale: 0.92,
        duration: 0.6,
        ease: "back.out(1.6)",
        stagger: 0.07,
        clearProps: "opacity,transform",
      });
    }, scope);
    return () => ctx.revert();
  }, [active]);
  return scope;
}

/* Flat, solid playground accents (the anti-AI-gradient palette). */
export const A = {
  lime: "var(--pg-lime)",
  coral: "var(--pg-coral)",
  cyan: "var(--pg-cyan)",
  amber: "var(--pg-amber)",
  indigo: "var(--pg-indigo)",
};

export const CONFETTI_COLORS = [
  "#b8f230",
  "#ff6a5b",
  "#34e0e6",
  "#ffc24b",
  "#7c86ff",
];

export const isReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function fireConfetti(opts?: confetti.Options) {
  if (isReduced()) return;
  confetti({
    particleCount: 110,
    spread: 78,
    startVelocity: 42,
    origin: { y: 0.72 },
    colors: CONFETTI_COLORS,
    ...opts,
  });
}

/* ── Brand mark ──────────────────────────────────────────────────
   Chunky lime squircle, thick black border, coral hard-offset shadow,
   and a bold geometric "V". Scales with the `className` size. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="7.5" y="9.5" width="26" height="26" rx="8" fill="#ff6a5b" />
      <rect x="4" y="4" width="26" height="26" rx="8" fill="#b8f230" stroke="#000" strokeWidth="2.5" />
      <path d="M11 12 L17 25 L23 12" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Screen shell: forced dark, play-grid background, reduced-motion ── */
export function PlayScreen({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "dark relative min-h-screen overflow-x-clip bg-[#0a0a0d] text-white",
          className
        )}
      >
        <PlaySurface />
        {children}
      </div>
    </MotionConfig>
  );
}

/* Fixed background: bold play-grid + faint flat accent blooms. */
export function PlaySurface() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-grid-bold absolute inset-0 [mask-image:radial-gradient(130%_100%_at_50%_0%,#000_25%,transparent_75%)]" />
      <div
        className="absolute -left-[10%] -top-[10%] h-[46vh] w-[46vh] rounded-full opacity-[0.12] blur-[90px]"
        style={{ background: A.lime }}
      />
      <div
        className="absolute right-[-8%] top-[18%] h-[42vh] w-[42vh] rounded-full opacity-[0.10] blur-[90px]"
        style={{ background: A.cyan }}
      />
      <div
        className="absolute bottom-[-12%] left-[30%] h-[40vh] w-[40vh] rounded-full opacity-[0.08] blur-[90px]"
        style={{ background: A.coral }}
      />
    </div>
  );
}

/* ── Spring-physics entrance + hover wrapper ─────────────────────── */
export function Bounce({
  children,
  className,
  delay = 0,
  tilt = 0,
  hover = true,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  tilt?: number;
  hover?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 30, scale: 0.9, rotate: tilt }}
      whileInView={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 240, damping: 15, delay }}
      whileHover={
        hover
          ? {
              y: -8,
              rotate: tilt + 1.5,
              scale: 1.035,
              transition: { type: "spring", stiffness: 400, damping: 11 },
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}

/* ── Magnetic wrapper — leans toward the cursor with a spring ─────── */
export function Magnetic({
  children,
  className,
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 13, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 13, mass: 0.4 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  );
}

/* ── Chunky brutalist button with squish + colored offset shadow ── */
type PlayButtonProps = {
  fill?: string;
  shadow?: string;
  text?: string;
} & React.ComponentProps<typeof motion.button>;

export function PlayButton({
  children,
  fill = A.lime,
  shadow = A.coral,
  text = "#0a0a0d",
  className,
  disabled,
  ...props
}: PlayButtonProps) {
  return (
    <motion.button
      disabled={disabled}
      style={{ background: fill, color: text }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-black px-6 py-3 text-base font-extrabold tracking-tight",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      initial={{ boxShadow: `5px 5px 0 0 ${shadow}` }}
      whileHover={disabled ? undefined : { x: -2, y: -2, boxShadow: `9px 9px 0 0 ${shadow}` }}
      whileTap={disabled ? undefined : { x: 3, y: 3, scale: 0.95, boxShadow: `1px 1px 0 0 ${shadow}` }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

/* ── Chunky card with a colored hard shadow ──────────────────────── */
export function PlayCard({
  children,
  className,
  color = A.lime,
  offset = 8,
  surface = "#141419",
  style,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  offset?: number;
  surface?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border-[3px] border-black", className)}
      style={{ background: surface, boxShadow: `${offset}px ${offset}px 0 0 ${color}`, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

/* ── Icon tile ───────────────────────────────────────────────────── */
export function IconTile({
  icon: Icon,
  color = A.lime,
  className,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid size-12 shrink-0 place-items-center rounded-xl border-[3px] border-black text-black",
        className
      )}
      style={{ background: color }}
    >
      <Icon className="size-6" strokeWidth={2.5} />
    </div>
  );
}

/* ── Sticker label / badge (optionally draggable + wobbling) ─────── */
export function PlayBadge({
  children,
  color = A.lime,
  className,
  rotate = -1,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
  rotate?: number;
}) {
  return (
    <span
      style={{ background: color, transform: `rotate(${rotate}deg)` }}
      className={cn(
        "inline-flex items-center rounded-lg border-[3px] border-black px-3 py-1 font-mono text-xs font-bold text-black",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Sticker({
  children,
  className,
  color = A.lime,
  from = -6,
  to = 6,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  from?: number;
  to?: number;
}) {
  return (
    <motion.div
      drag
      dragElastic={0.5}
      dragConstraints={{ left: -60, right: 60, top: -60, bottom: 60 }}
      whileTap={{ scale: 1.15, cursor: "grabbing" }}
      dragTransition={{ bounceStiffness: 500, bounceDamping: 14 }}
      className={cn("animate-wiggle absolute cursor-grab select-none", className)}
      style={
        {
          ["--wiggle-from" as string]: `${from}deg`,
          ["--wiggle-to" as string]: `${to}deg`,
        } as React.CSSProperties
      }
    >
      <span
        style={{ background: color }}
        className="inline-block rounded-lg border-[3px] border-black px-3 py-1 font-mono text-sm font-bold text-black shadow-[3px_3px_0_0_#000]"
      >
        {children}
      </span>
    </motion.div>
  );
}

/* ── Section heading with a tilted sticker kicker ────────────────── */
export function PlaySectionHeading({
  kicker,
  title,
  kickerColor = A.cyan,
  className,
}: {
  kicker: string;
  title: string;
  kickerColor?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <span
        className="inline-block -rotate-2 rounded-lg border-[3px] border-black px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_#000]"
        style={{ background: kickerColor }}
      >
        {kicker}
      </span>
      <h2 className="mt-5 text-balance text-3xl font-black tracking-tighter md:text-5xl">
        {title}
      </h2>
    </div>
  );
}

/* ── Chunky form input ───────────────────────────────────────────── */
export const PlayInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function PlayInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border-[3px] border-black bg-[#0d0d11] px-3.5 py-2.5 text-sm font-medium text-white",
        "placeholder:text-white/35",
        "outline-none transition-shadow focus:shadow-[4px_4px_0_0_var(--pg-cyan)]",
        className
      )}
      {...props}
    />
  );
});

/* ── Form field label ────────────────────────────────────────────── */
export function PlayLabel({
  children,
  htmlFor,
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("text-xs font-bold uppercase tracking-wider text-white/70", className)}
    >
      {children}
    </label>
  );
}
