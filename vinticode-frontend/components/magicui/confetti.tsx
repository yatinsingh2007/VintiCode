"use client";

import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!trigger || firedRef.current) return;
    firedRef.current = true;

    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    const timer = setTimeout(() => onComplete?.(), 3000);
    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  useEffect(() => {
    if (!trigger) firedRef.current = false;
  }, [trigger]);

  return null;
}
