"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  motion,
  MotionConfig,
  useMotionValue,
  useSpring,
  type Variants,
} from "motion/react";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  Brain,
  Code2,
  Terminal,
  Activity,
  Zap,
  Sparkles,
  CheckCircle2,
  Github,
  Twitter,
  Linkedin,
  GripHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import toast from "react-hot-toast";

/* ── Flat, solid playground accents (the anti-AI-gradient palette) ── */
const A = {
  lime: "var(--pg-lime)",
  coral: "var(--pg-coral)",
  cyan: "var(--pg-cyan)",
  amber: "var(--pg-amber)",
  indigo: "var(--pg-indigo)",
};

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How", href: "#how" },
  { label: "Practice", href: "#cta" },
];

const TOPICS = [
  "Arrays",
  "Hash Maps",
  "Two Pointers",
  "Binary Search",
  "Linked Lists",
  "Recursion",
  "Trees",
  "Graphs",
  "DP",
  "Greedy",
  "Backtracking",
  "Heaps",
  "Sorting",
  "Bit Tricks",
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Approach Review",
    body: "Sketch your idea in the scratchpad and get instant, blunt feedback on your reasoning — before you write a single line of code.",
    color: A.lime,
    tilt: -1.5,
  },
  {
    icon: Code2,
    title: "In-browser editor",
    body: "A real Monaco editor with run + submit. No setup, no context switching.",
    color: A.cyan,
    tilt: 1.5,
  },
  {
    icon: Activity,
    title: "Progress that compounds",
    body: "A streak heatmap and per-topic mastery so you always know what to sharpen next.",
    color: A.amber,
    tilt: 1.5,
  },
];

const isReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function fireConfetti() {
  if (isReduced()) return;
  confetti({
    particleCount: 110,
    spread: 78,
    startVelocity: 42,
    origin: { y: 0.72 },
    colors: ["#b8f230", "#ff6a5b", "#34e0e6", "#ffc24b", "#7c86ff"],
  });
}

/* ── Spring-physics entrance + hover wrapper ─────────────────────── */
function Bounce({
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
function Magnetic({
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
function PlayButton({
  children,
  onClick,
  fill = A.lime,
  shadow = A.coral,
  text = "#0a0a0d",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  fill?: string;
  shadow?: string;
  text?: string;
  className?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      style={{ background: fill, color: text }}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border-[3px] border-black px-6 py-3 text-base font-extrabold tracking-tight",
        className
      )}
      initial={{ boxShadow: `5px 5px 0 0 ${shadow}` }}
      whileHover={{ x: -2, y: -2, boxShadow: `9px 9px 0 0 ${shadow}` }}
      whileTap={{ x: 3, y: 3, scale: 0.95, boxShadow: `1px 1px 0 0 ${shadow}` }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      {children}
    </motion.button>
  );
}

/* ── Wobbling, draggable sticker chip ────────────────────────────── */
function Sticker({
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

/* Headline word stagger */
const wordContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const wordItem: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.6 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 320, damping: 14 },
  },
};

export default function LandingPage() {
  const router = useRouter();

  // Auth gate: signed-in visitors skip the marketing page and land in-app.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        toast.loading("Loading");

        const response = await api.get("/?t=" + Date.now());

        if (response.status === 200) {
          router.push("/dashboard/home");
        }
      } catch (err) {
        console.log("Not authenticated");
      } finally {
        toast.dismiss();
      }
    };

    checkAuth();
  }, []);

  const go = () => router.push("/auth");
  const startCoding = () => {
    fireConfetti();
    setTimeout(go, 220);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="dark relative min-h-screen overflow-x-clip bg-[#0a0a0d] text-white">
        {/* ── Background: bold play-grid + faint flat accent blooms ── */}
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

        {/* ── Navbar ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 px-4 pt-4">
          <motion.nav
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border-[3px] border-black bg-[#141419]/90 px-4 py-2.5 shadow-[5px_5px_0_0_#000] backdrop-blur-md"
          >
            <Link href="/" className="flex items-center gap-2.5">
              <motion.span
                whileHover={{ rotate: -12, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                aria-hidden
                className="grid h-7 w-7 place-items-center rounded-lg border-[3px] border-black text-sm font-black text-black"
                style={{ background: A.lime }}
              >
                V
              </motion.span>
              <span className="text-lg font-extrabold tracking-tight">VintiCode</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg border-[3px] border-transparent px-3 py-1.5 text-sm font-bold text-white/70 transition-all hover:-translate-y-0.5 hover:border-black hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={go}
                className="hidden rounded-lg px-3 py-1.5 text-sm font-bold text-white/80 transition-colors hover:text-white sm:block"
              >
                Sign in
              </button>
              <PlayButton
                onClick={go}
                className="!px-4 !py-2 text-sm"
                fill={A.lime}
                shadow={A.coral}
              >
                Start <ArrowRight className="size-4" strokeWidth={3} />
              </PlayButton>
            </div>
          </motion.nav>
        </header>

        <main>
          {/* ── Hero ───────────────────────────────────────────────── */}
          <section className="relative mx-auto max-w-6xl px-6 pb-10 pt-16 md:pt-24">
            {/* scattered draggable stickers */}
            <Sticker color={A.cyan} className="left-[6%] top-[8%] hidden md:block" from={-8} to={4}>
              {"{ }"}
            </Sticker>
            <Sticker color={A.amber} className="right-[8%] top-[4%] hidden md:block" from={6} to={-6}>
              O(n)
            </Sticker>
            <Sticker color={A.coral} className="left-[12%] bottom-[6%] hidden lg:block" from={-4} to={8}>
              while(true)
            </Sticker>
            <Sticker color={A.indigo} className="right-[10%] bottom-[10%] hidden lg:block" from={5} to={-5}>
              []{"->"}next
            </Sticker>

            <div className="relative flex flex-col items-center text-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.7, rotate: -4 }}
                animate={{ opacity: 1, scale: 1, rotate: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                className="mb-7 inline-flex items-center gap-2 rounded-full border-[3px] border-black bg-white px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_var(--pg-coral)]"
              >
                <Sparkles className="size-3.5" strokeWidth={3} /> Master DSA by doing
              </motion.span>

              {/* Kinetic headline */}
              <motion.h1
                variants={wordContainer}
                initial="hidden"
                animate="show"
                className="flex max-w-4xl flex-wrap justify-center gap-x-4 gap-y-2 text-5xl font-black leading-[0.95] tracking-tighter md:text-8xl"
              >
                <motion.span variants={wordItem}>BUILD</motion.span>
                <motion.span variants={wordItem}>REAL</motion.span>
                <motion.span variants={wordItem} className="text-stroke">
                  INTUITION
                </motion.span>
                <motion.span variants={wordItem} className="w-full">
                  for{" "}
                  <motion.span
                    whileHover={{ rotate: 2, scale: 1.04 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    className="inline-block -rotate-2 rounded-xl border-[3px] border-black px-3 py-0.5 text-black shadow-[6px_6px_0_0_#000]"
                    style={{ background: A.lime }}
                  >
                    algorithms
                  </motion.span>
                </motion.span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 18 }}
                className="mt-7 max-w-xl text-pretty text-lg font-medium text-white/70"
              >
                A loud, hands-on workspace to build a rock-solid foundation in problem
                solving — before you step into the world of Data Structures & Algorithms.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62, type: "spring", stiffness: 200, damping: 18 }}
                className="mt-9 flex flex-col items-center gap-4 sm:flex-row"
              >
                <Magnetic strength={0.4}>
                  <PlayButton onClick={startCoding} fill={A.lime} shadow={A.coral} className="text-lg">
                    Start Coding <ArrowRight strokeWidth={3} />
                  </PlayButton>
                </Magnetic>
                <PlayButton
                  onClick={() => {
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  fill="#141419"
                  shadow={A.cyan}
                  text="#ffffff"
                  className="text-lg"
                >
                  See features
                </PlayButton>
              </motion.div>

              {/* Draggable hero mock */}
              <motion.div
                initial={{ opacity: 0, y: 40, rotate: -4 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ delay: 0.7, type: "spring", stiffness: 160, damping: 16 }}
                className="mt-16 w-full max-w-3xl"
              >
                <ProblemPreview />
              </motion.div>
            </div>
          </section>

          {/* ── Topics marquee ───────────────────────────────────── */}
          <section aria-label="Topics" className="relative py-8">
            <div className="border-y-[3px] border-black bg-[#141419] py-4">
              <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
                <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
                  {[...TOPICS, ...TOPICS].map((t, i) => {
                    const colors = [A.lime, A.cyan, A.amber, A.coral, A.indigo];
                    return (
                      <span
                        key={`${t}-${i}`}
                        style={{ background: colors[i % colors.length] }}
                        className="inline-block shrink-0 -rotate-1 rounded-lg border-[3px] border-black px-4 py-1.5 font-mono text-sm font-bold text-black odd:rotate-1"
                      >
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── Bento features ───────────────────────────────────── */}
          <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
            <SectionHeading kicker="What's inside" title="A workspace with personality" />

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Bounce
                  key={f.title}
                  delay={i * 0.06}
                  tilt={f.tilt}
                  className="rounded-2xl border-[3px] border-black bg-[#141419] p-6"
                  style={{ ["--pg-shadow" as string]: f.color } as React.CSSProperties}
                >
                  <div className="pg-shadow-lg -m-6 h-full rounded-2xl p-6" style={{ boxShadow: `8px 8px 0 0 ${f.color}` }}>
                    <div
                      className="grid size-12 place-items-center rounded-xl border-[3px] border-black text-black"
                      style={{ background: f.color }}
                    >
                      <f.icon className="size-6" strokeWidth={2.5} />
                    </div>
                    <h3 className="mt-5 text-xl font-extrabold tracking-tight">{f.title}</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-white/65">
                      {f.body}
                    </p>
                  </div>
                </Bounce>
              ))}
            </div>

            {/* wide instant-feedback strip */}
            <Bounce
              delay={0.1}
              className="mt-6 rounded-2xl border-[3px] border-black bg-[#141419] p-6 md:p-8"
              hover={false}
            >
              <div
                className="-m-6 rounded-2xl p-6 md:-m-8 md:p-8"
                style={{ boxShadow: `8px 8px 0 0 ${A.indigo}` }}
              >
                <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="grid size-12 shrink-0 place-items-center rounded-xl border-[3px] border-black text-black"
                      style={{ background: A.indigo }}
                    >
                      <Zap className="size-6" strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold tracking-tight">
                        Instant feedback loops
                      </h3>
                      <p className="mt-1 max-w-lg text-sm font-medium text-white/65">
                        Run against test cases and submit in one click. Tight loops turn
                        practice into intuition.
                      </p>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-2 text-sm font-semibold">
                    {["Run test cases", "One-click submit", "Results inline"].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span
                          className="grid size-5 place-items-center rounded border-2 border-black text-black"
                          style={{ background: A.lime }}
                        >
                          <CheckCircle2 className="size-3.5" strokeWidth={3} />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Bounce>
          </section>

          {/* ── How it works ─────────────────────────────────────── */}
          <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
            <SectionHeading kicker="How it works" title="Three steps, then it's just reps" />
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { n: "01", t: "Pick a problem", b: "Curated sets that build from fundamentals to fluency.", c: A.lime },
                { n: "02", t: "Reason it out", b: "Sketch your approach and get AI feedback before you code.", c: A.cyan },
                { n: "03", t: "Solve & submit", b: "Write, run, submit — then watch your streak grow.", c: A.amber },
              ].map((s, i) => (
                <Bounce key={s.n} delay={i * 0.06} tilt={i % 2 === 0 ? -1 : 1}
                  className="rounded-2xl border-[3px] border-black bg-[#141419] p-6">
                  <div className="-m-6 rounded-2xl p-6" style={{ boxShadow: `8px 8px 0 0 ${s.c}` }}>
                    <span
                      className="inline-block -rotate-3 rounded-lg border-[3px] border-black px-3 py-1 font-mono text-2xl font-black text-black"
                      style={{ background: s.c }}
                    >
                      {s.n}
                    </span>
                    <h3 className="mt-4 text-xl font-extrabold tracking-tight">{s.t}</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-white/65">{s.b}</p>
                  </div>
                </Bounce>
              ))}
            </div>
          </section>

          {/* ── CTA ──────────────────────────────────────────────── */}
          <section id="cta" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
            <Bounce hover={false} className="rounded-3xl border-[3px] border-black bg-[#141419]">
              <div
                className="rounded-3xl px-6 py-16 text-center"
                style={{ boxShadow: `12px 12px 0 0 ${A.lime}` }}
              >
                <h2 className="mx-auto max-w-2xl text-4xl font-black leading-[0.95] tracking-tighter md:text-6xl">
                  READY TO THINK IN{" "}
                  <span
                    className="inline-block -rotate-2 rounded-xl border-[3px] border-black px-2 text-black"
                    style={{ background: A.coral }}
                  >
                    ALGORITHMS?
                  </span>
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-lg font-medium text-white/70">
                  Start with the fundamentals and code your way to mastery — one deliberate
                  problem at a time.
                </p>
                <div className="mt-9 flex justify-center">
                  <Magnetic strength={0.4}>
                    <PlayButton onClick={startCoding} fill={A.lime} shadow={A.coral} className="text-lg">
                      Start Coding — it&apos;s free <ArrowRight strokeWidth={3} />
                    </PlayButton>
                  </Magnetic>
                </div>
              </div>
            </Bounce>
          </section>
        </main>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="border-t-[3px] border-black">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="flex flex-col gap-10 md:flex-row md:justify-between">
              <div className="max-w-xs">
                <Link href="/" className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="grid h-7 w-7 place-items-center rounded-lg border-[3px] border-black text-sm font-black text-black"
                    style={{ background: A.lime }}
                  >
                    V
                  </span>
                  <span className="text-lg font-extrabold tracking-tight">VintiCode</span>
                </Link>
                <p className="mt-4 text-sm font-medium leading-relaxed text-white/60">
                  Build real intuition for data structures and algorithms, and code your way
                  to mastery.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
                <FooterGroup title="Product" links={[
                  { label: "Features", href: "#features" },
                  { label: "How it works", href: "#how" },
                  { label: "Practice", href: "/auth" },
                ]} />
                <FooterGroup title="Account" links={[
                  { label: "Sign in", href: "/auth" },
                  { label: "Sign up", href: "/auth" },
                ]} />
                <FooterGroup title="More" links={[
                  { label: "Get started", href: "/auth" },
                  { label: "Dashboard", href: "/dashboard/home" },
                ]} />
              </div>
            </div>
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t-[3px] border-black pt-6 sm:flex-row">
              <p className="text-xs font-semibold text-white/60">
                &copy; {new Date().getFullYear()} VintiCode. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                {[
                  { icon: Github, label: "GitHub", c: A.lime },
                  { icon: Twitter, label: "Twitter", c: A.cyan },
                  { icon: Linkedin, label: "LinkedIn", c: A.amber },
                ].map(({ icon: Icon, label, c }) => (
                  <motion.a
                    key={label}
                    href="#"
                    aria-label={label}
                    whileHover={{ y: -3, rotate: -6 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="grid size-9 place-items-center rounded-lg border-[3px] border-black text-black"
                    style={{ background: c }}
                  >
                    <Icon className="size-4" strokeWidth={2.5} />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

/* ── Section heading ──────────────────────────────────────────────── */
function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span
        className="inline-block -rotate-2 rounded-lg border-[3px] border-black px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-black shadow-[3px_3px_0_0_#000]"
        style={{ background: A.cyan }}
      >
        {kicker}
      </span>
      <h2 className="mt-5 text-balance text-3xl font-black tracking-tighter md:text-5xl">
        {title}
      </h2>
    </div>
  );
}

/* ── Footer link group ────────────────────────────────────────────── */
function FooterGroup({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white/50">{title}</h4>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm font-semibold text-white/75 transition-colors hover:text-[var(--pg-lime)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Draggable hero product mock ──────────────────────────────────── */
function ProblemPreview() {
  return (
    <motion.div
      drag
      dragElastic={0.16}
      dragConstraints={{ left: -40, right: 40, top: -24, bottom: 24 }}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 18 }}
      whileDrag={{ scale: 1.02, cursor: "grabbing", rotate: 0 }}
      className="group relative cursor-grab overflow-hidden rounded-2xl border-[3px] border-black bg-[#111116] text-left shadow-[12px_12px_0_0_var(--pg-cyan)]"
    >
      {/* drag hint */}
      <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full border-2 border-black bg-white px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-black opacity-0 transition-opacity group-hover:opacity-100">
        <span className="flex items-center gap-1">
          <GripHorizontal className="size-3" strokeWidth={3} /> drag me
        </span>
      </div>

      {/* window chrome */}
      <div className="flex items-center gap-2 border-b-[3px] border-black bg-[#0d0d11] px-4 py-3">
        <span className="size-3 rounded-full border-2 border-black" style={{ background: A.coral }} />
        <span className="size-3 rounded-full border-2 border-black" style={{ background: A.amber }} />
        <span className="size-3 rounded-full border-2 border-black" style={{ background: A.lime }} />
        <div className="ml-3 flex items-center gap-2 text-xs font-bold text-white/60">
          <Terminal className="size-3.5" strokeWidth={2.5} />
          <span className="font-mono">two-sum.ts</span>
        </div>
        <span
          className="ml-auto inline-flex items-center rounded-md border-2 border-black px-2 py-0.5 font-mono text-[0.7rem] font-bold text-black"
          style={{ background: A.lime }}
        >
          EASY
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="border-b-[3px] border-black p-5 md:border-b-0 md:border-r-[3px]">
          <h3 className="text-base font-extrabold">Two Sum</h3>
          <p className="mt-2 text-xs font-medium leading-relaxed text-white/60">
            Given an array of integers, return the indices of the two numbers that add up to a
            specific target.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Array", "Hash Map", "O(n)"].map((tag, i) => (
              <span
                key={tag}
                style={{ background: [A.cyan, A.amber, A.lime][i] }}
                className="inline-flex items-center rounded-md border-2 border-black px-2 py-0.5 font-mono text-[0.7rem] font-bold text-black"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-[#0d0d11] p-5 font-mono text-xs leading-relaxed">
          <pre className="overflow-x-auto text-white/70">
            <code>
              <span style={{ color: A.indigo }}>function</span>{" "}
              <span style={{ color: A.lime }}>twoSum</span>(nums, target) {"{"}
              {"\n"}  <span style={{ color: A.indigo }}>const</span> seen = new Map();
              {"\n"}  <span style={{ color: A.indigo }}>for</span> (
              <span style={{ color: A.indigo }}>let</span> i = 0; i {"<"} nums.length; i++) {"{"}
              {"\n"}    <span style={{ color: A.indigo }}>const</span> need = target - nums[i];
              {"\n"}    <span style={{ color: A.indigo }}>if</span> (seen.has(need))
              {"\n"}      <span style={{ color: A.indigo }}>return</span> [seen.get(need), i];
              {"\n"}    seen.set(nums[i], i);
              {"\n"}  {"}"}
              {"\n"}
              {"}"}
            </code>
          </pre>
          <div className="mt-4 flex items-center gap-2 text-[0.7rem] font-bold" style={{ color: A.lime }}>
            <CheckCircle2 className="size-3.5" strokeWidth={3} />
            <span>All 24 test cases passed · 41 ms</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
