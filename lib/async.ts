"use client";

/** Artificial latency. Instant success reads as fake, so every write waits. */
export const wait = (ms = 700 + Math.random() * 900) => new Promise<void>((r) => setTimeout(r, ms));

/** Short pause used before a list renders, behind a skeleton. */
export const waitShort = () => wait(320 + Math.random() * 180);
