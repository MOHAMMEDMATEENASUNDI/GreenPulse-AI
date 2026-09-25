/**
 * @license
 * GreenPulse AI — High-Performance, Warning-Free Environmental Mascot
 * Pixel-perfect SVG physics & emotive animation engine for GreenPulse Guardian.
 */

import React, { useId, useEffect, useRef, useState } from 'react';
import {
  useReducedMotion,
  useMotionValue,
  useTransform,
  animate,
  MotionConfig,
  motion,
  type Variants,
} from 'motion/react';

export type JellyBlobMood = 'neutral' | 'happy' | 'sad' | 'angry' | 'hmm' | 'sideEye' | 'password';

export interface JellyBlobMascotProps {
  mood?: JellyBlobMood;
  className?: string;
  onOverpoke?: () => void;
  happyEyes?: 'star' | 'smile';
  gaze?: {
    x: number;
    y: number;
    intensity?: number;
  };
  mouth?: 'open' | 'wide';
  nod?: boolean;
}

const BODY_SHAPE =
  'M450 135 C520 137 580 158 618 200 C652 240 672 290 680 345 C686 390 688 425 686 462 C684 505 676 530 658 552 C641 569 627 580 602 583 C578 585 561 578 536 577 C510 576 482 585 450 585 C418 585 390 576 364 577 C339 578 323 585 298 583 C273 580 259 569 242 552 C224 530 216 505 214 462 C212 425 214 390 220 345 C228 290 248 240 282 200 C320 158 380 137 450 135 Z';

const SAD_SHAPE =
  'M450 168 C516 169 568 188 604 222 C640 258 662 308 672 364 C678 408 682 444 680 482 C678 522 668 548 646 566 C628 582 606 590 580 590 C554 590 530 582 504 583 C482 584 467 593 450 593 C433 593 418 584 396 583 C370 582 346 590 320 590 C294 590 272 582 254 566 C232 548 222 522 220 482 C218 444 222 408 228 364 C238 308 260 258 296 222 C332 188 384 169 450 168 Z';

const BODY_PATHS: Record<JellyBlobMood, string> = {
  sideEye: BODY_SHAPE,
  password: BODY_SHAPE,
  hmm: BODY_SHAPE,
  neutral: BODY_SHAPE,
  happy: BODY_SHAPE,
  sad: SAD_SHAPE,
  angry: BODY_SHAPE,
};

const NEUTRAL_TOP = 'M450 135 C520 137 580 158 618 200 C652 240 672 290 680 345 C686 390 688 425 686 462';
const NEUTRAL_BOTTOM: [number, number][] = [
  [684, 505], [676, 530], [658, 552],
  [641, 569], [627, 580], [602, 583],
  [578, 585], [561, 578], [536, 577],
  [510, 576], [482, 585], [450, 585],
  [418, 585], [390, 576], [364, 577],
  [339, 578], [323, 585], [298, 583],
  [273, 580], [259, 569], [242, 552],
  [224, 530], [216, 505], [214, 462],
  [212, 425], [214, 390], [220, 345],
  [228, 290], [248, 240], [282, 200],
  [320, 158], [380, 137], [450, 135],
];

const RIPPLE_AMP = 10;
const SLOSH_AMP = 4;
const WOBBLE_K = 0.016;
const lowness = (y: number) => Math.max(0, Math.min(1, (y - 440) / 145));
const legBias = (x: number) => 0.3 + 0.7 * Math.min(1, Math.abs(x - 450) / 150);

function bottomWave(phase: number, amt = 1): string {
  let d = NEUTRAL_TOP;
  for (let i = 0; i < NEUTRAL_BOTTOM.length; i += 3) {
    const seg = NEUTRAL_BOTTOM.slice(i, i + 3).map(([x, y]) => {
      const w = lowness(y) * legBias(x) * amt;
      const px = x + w * (SLOSH_AMP * Math.sin(phase) + RIPPLE_AMP * 0.22 * Math.cos(WOBBLE_K * x + phase));
      const py = y + w * RIPPLE_AMP * Math.sin(WOBBLE_K * x + phase);
      return `${px.toFixed(1)} ${py.toFixed(1)}`;
    }).join(' ');
    d += ` C${seg}`;
  }
  return `${d} Z`;
}

function lerpPath(a: string, b: string, t: number): string {
  if (t <= 1e-4) return a;
  if (t >= 0.9999) return b;
  const nb = b.match(/-?\d+(?:\.\d+)?/g) ?? [];
  let i = 0;
  return a.replace(/-?\d+(?:\.\d+)?/g, (na) => (parseFloat(na) + (parseFloat(nb[i++] ?? na) - parseFloat(na)) * t).toFixed(1));
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const IDLE_MOODS = new Set<JellyBlobMood>(['neutral', 'hmm', 'sideEye', 'password']);

const BODY_TRANSFORMS: Record<JellyBlobMood, any> = {
  sideEye: { x: -4, y: 1, rotate: -1.2, scaleX: 1, scaleY: 1, skewX: 0, transition: { type: 'spring', stiffness: 190, damping: 18 } },
  password: { x: 0, y: [0, -2, 0], rotate: 0, scaleX: [1, 0.996, 1], scaleY: [1, 1.008, 1], skewX: 0, transition: { duration: 3.8, ease: 'easeInOut', repeat: Infinity } },
  hmm: { y: 0, scaleX: 1, scaleY: 1, skewX: 2.5, transition: { type: 'spring', stiffness: 200, damping: 18 } },
  neutral: {
    y: [0, -3, 0],
    scaleX: [1, 0.992, 1],
    scaleY: [1, 1.012, 1],
    transition: { duration: 4.2, ease: 'easeInOut', repeat: Infinity },
  },
  happy: {
    y: [0, -22, -6, -10],
    scaleX: [1, 1, 1.05, 1],
    scaleY: [1, 1.06, 0.96, 1],
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  sad: {
    y: 0,
    scaleX: 1,
    scaleY: 1,
    transition: { type: 'spring', stiffness: 130, damping: 20, mass: 1.05 },
  },
  angry: {
    y: 5,
    scaleX: 1,
    scaleY: 0.95,
    transition: { type: 'spring', stiffness: 260, damping: 8, mass: 0.7 },
  },
};

const FACE_TRANSFORMS: Record<JellyBlobMood, any> = {
  sideEye: { x: -7, y: 2, scaleX: 1, scaleY: 0.98, rotate: -2, transition: { delay: 0.05, type: 'spring', stiffness: 210, damping: 18 } },
  password: { x: -4, y: 3, scale: 1, rotate: -3, transition: { delay: 0.04, type: 'spring', stiffness: 210, damping: 17 } },
  hmm: { y: 0, scale: 1, transition: { delay: 0.05, type: 'spring', stiffness: 200, damping: 18 } },
  neutral: {
    y: [0, -2, 0],
    scale: 1,
    transition: { delay: 0.05, duration: 3.2, ease: 'easeInOut', repeat: Infinity },
  },
  happy: {
    y: [0, -22, -6, -10],
    scale: 1,
    transition: { delay: 0.05, duration: 0.6, ease: 'easeInOut' },
  },
  sad: {
    y: 12,
    scaleX: 1,
    scaleY: 1,
    transition: { delay: 0.04, type: 'spring', stiffness: 145, damping: 18, mass: 0.95 },
  },
  angry: {
    y: 7,
    scaleX: 1,
    scaleY: 0.96,
    transition: { delay: 0.05, type: 'spring', stiffness: 260, damping: 9, mass: 0.7 },
  },
};

const LEFT_ARM_TRANSFORMS: Record<JellyBlobMood, any> = {
  sideEye: { y: 0, rotate: 0, transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 16 } },
  password: { y: 0, rotate: -2, transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 16 } },
  hmm: { y: 0, rotate: 0, transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 16 } },
  neutral: { y: 0, rotate: 0, transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 16 } },
  happy: { y: [0, -19, -5, -9], rotate: -8, transition: { delay: 0.1, duration: 0.5, ease: 'easeInOut' } },
  sad: { y: 13, rotate: 12, scaleX: 0.96, scaleY: 0.96, transition: { delay: 0.1, type: 'spring', stiffness: 135, damping: 18, mass: 0.95 } },
  angry: { y: 2, rotate: -3, transition: { delay: 0.08, type: 'spring', stiffness: 250, damping: 10, mass: 0.8 } },
};

const RIGHT_ARM_TRANSFORMS: Record<JellyBlobMood, any> = {
  sideEye: { y: 0, rotate: 0, transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 16 } },
  password: { y: 0, rotate: 2, transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 16 } },
  hmm: { y: 0, rotate: 0, transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 16 } },
  neutral: { y: 0, rotate: 0, transition: { delay: 0.1, type: 'spring', stiffness: 200, damping: 16 } },
  happy: { y: [0, -19, -5, -9], rotate: 8, transition: { delay: 0.12, duration: 0.5, ease: 'easeInOut' } },
  sad: { y: 13, rotate: -12, scaleX: 0.96, scaleY: 0.96, transition: { delay: 0.1, type: 'spring', stiffness: 135, damping: 18, mass: 0.95 } },
  angry: { y: 2, rotate: 3, transition: { delay: 0.08, type: 'spring', stiffness: 250, damping: 10, mass: 0.8 } },
};

const ARM_REST_POSES = [
  { l: { dx: -2, dy: 3, rot: -5 }, r: { dx: 2, dy: -2, rot: 3 } },
  { l: { dx: 1, dy: -3, rot: 5 }, r: { dx: -2, dy: 4, rot: -6 } },
  { l: { dx: -3, dy: 4, rot: -4 }, r: { dx: 1, dy: 1, rot: 6 } },
  { l: { dx: 3, dy: -1, rot: 6 }, r: { dx: -3, dy: 2, rot: -3 } },
  { l: { dx: -1, dy: 2, rot: -6 }, r: { dx: 2, dy: -3, rot: 4 } },
  { l: { dx: 2, dy: 5, rot: 3 }, r: { dx: -2, dy: -2, rot: -5 } },
];

const LEFT_ARM_PIVOT = '229 407';
const RIGHT_ARM_PIVOT = '671 407';

const HIGHLIGHT_TRANSFORMS: Record<JellyBlobMood, any> = {
  sideEye: { x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  password: { x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  hmm: { x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  neutral: { x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  happy: { x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 12 } },
  sad: { x: 0, y: 20, scaleX: 1.02, scaleY: 0.98, transition: { type: 'spring', stiffness: 150, damping: 20, mass: 0.85 } },
  angry: { x: 0, y: 0, scale: 1, transition: { type: 'spring', stiffness: 240, damping: 12 } },
};

const EYE_TRANSFORMS: Record<JellyBlobMood, any> = {
  sideEye: { scaleX: 1.04, scaleY: 0.64, y: 3 },
  password: { scaleX: 0.9, scaleY: 0.38, y: 3 },
  hmm: { scaleX: 1, scaleY: 0.78, y: 2 },
  neutral: { scaleY: 1, y: 0 },
  happy: { scaleX: 1.05, scaleY: 1.04, y: -2 },
  sad: { scaleX: 1.1, scaleY: 1.16, y: 4 },
  angry: { scaleX: 1.1, scaleY: 0.48, y: 2 },
};

const CHEEK_TRANSFORMS: Record<JellyBlobMood, any> = {
  sideEye: { x: -3, y: 3, scaleX: 0.9, scaleY: 0.82, opacity: 0.48 },
  password: { x: 0, y: 2, scaleX: 0.86, scaleY: 0.76, opacity: 0.38 },
  hmm: { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 0.7 },
  neutral: { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 0.76 },
  happy: { x: 0, y: -1, scaleX: 1.1, scaleY: 1.1, opacity: 0.88 },
  sad: { x: 0, y: 8, scaleX: 1.04, scaleY: 0.8, opacity: 0.72 },
  angry: { x: 0, y: 2, scaleX: 1.08, scaleY: 0.94, opacity: 0.9 },
};

const LEFT_EYE_MOOD: Record<JellyBlobMood, any> = {
  sideEye: { x: -5, y: 1 },
  password: { x: -3, y: 0 },
  hmm: { x: -9, y: 1 },
  neutral: { x: 0, y: 0 },
  happy: { x: 0, y: -1 },
  sad: { x: 5, y: 5 },
  angry: { x: 3, y: 3 },
};

const RIGHT_EYE_MOOD: Record<JellyBlobMood, any> = {
  sideEye: { x: -10, y: 1 },
  password: { x: -3, y: 0 },
  hmm: { x: -9, y: 1 },
  neutral: { x: 0, y: 0 },
  happy: { x: 0, y: -1 },
  sad: { x: -5, y: 5 },
  angry: { x: -3, y: 3 },
};

const MOUTH_PATHS: Record<JellyBlobMood, string> = {
  sideEye: 'M432 418 C445 418 461 415 474 409',
  password: 'M452 416 C452 416 452 416 452 416',
  hmm: 'M431 418 C443 420 461 414 473 411',
  neutral: 'M431 409 C437 429 466 429 473 409',
  happy: 'M420 402 C435 448 470 448 485 402',
  sad: 'M431 424 C440 414 464 414 473 424',
  angry: 'M431 416 C443 422 461 422 473 416',
};

const TALK_MOUTH_PATHS = {
  open: [
    'M441 410 C447 405 457 405 463 410 C466 417 462 424 452 424 C442 424 438 417 441 410 Z',
    'M436 408 C443 400 462 400 469 408 C474 421 466 434 452 434 C438 434 431 421 436 408 Z',
    'M439 413 C445 408 461 408 467 413 C469 423 463 430 452 430 C441 430 435 423 439 413 Z',
    'M434 411 C441 404 464 404 471 411 C474 422 466 432 452 432 C438 432 431 422 434 411 Z',
    'M441 410 C447 405 457 405 463 410 C466 417 462 424 452 424 C442 424 438 417 441 410 Z',
  ],
  wide: [
    'M438 410 C445 404 460 404 467 410 C472 421 465 432 452 432 C439 432 433 421 438 410 Z',
    'M431 407 C440 398 465 398 474 407 C481 424 469 439 452 439 C435 439 424 424 431 407 Z',
    'M428 413 C438 404 467 404 477 413 C479 426 468 435 452 435 C436 435 426 426 428 413 Z',
    'M434 409 C442 401 463 401 471 409 C477 423 467 437 452 437 C437 437 428 423 434 409 Z',
    'M438 410 C445 404 460 404 467 410 C472 421 465 432 452 432 C439 432 433 421 438 410 Z',
  ],
};

const svgMotionStyle: React.CSSProperties = {
  transformBox: 'fill-box',
  transformOrigin: 'center bottom',
};
const centerMotionStyle: React.CSSProperties = {
  transformBox: 'fill-box',
  transformOrigin: 'center',
};
const leftArmStyle: React.CSSProperties = {
  transformBox: 'fill-box',
  transformOrigin: '70% 38%',
};
const rightArmStyle: React.CSSProperties = {
  transformBox: 'fill-box',
  transformOrigin: '30% 38%',
};

export function JellyBlobMascot({
  mood = 'neutral',
  className,
  onOverpoke,
  happyEyes = 'star',
  gaze = { x: 0, y: 0 },
  mouth,
  nod = false,
}: JellyBlobMascotProps) {
  const reduce = useReducedMotion();
  const rawUid = useId();
  const uid = rawUid.replace(/[^a-zA-Z0-9]/g, '');

  const bodyFill = `${uid}-bodyFill`;
  const bodyEdge = `${uid}-bodyEdge`;
  const armFill = `${uid}-armFill`;
  const cheekFill = `${uid}-cheekFill`;
  const eyeFill = `${uid}-eyeFill`;
  const shadowFill = `${uid}-shadowFill`;
  const bellyGlow = `${uid}-bellyGlow`;
  const bodyClip = `${uid}-bodyClip`;
  const shadowBlur = `${uid}-shadowBlur`;
  const softBlur = `${uid}-softBlur`;
  const wideSoftBlur = `${uid}-wideSoftBlur`;

  // Eye blinking
  const blinkL = useMotionValue(1);
  const blinkR = useMotionValue(1);
  const blinkLX = useTransform(blinkL, [0.05, 1], [1.08, 1]);
  const blinkRX = useTransform(blinkR, [0.05, 1], [1.08, 1]);

  useEffect(() => {
    if (reduce) {
      blinkL.set(1);
      blinkR.set(1);
      return;
    }
    let cancelled = false;
    let timer = 0;
    const dip = (mv: any, dur = 0.2, then?: () => void) =>
      animate(mv, [1, 0.04, 1], { duration: dur, ease: ['easeIn', 'easeOut'], times: [0, 0.42, 1], onComplete: then });

    const both = (dur: number, then?: () => void) => {
      dip(blinkL, dur);
      dip(blinkR, dur, then);
    };

    const fire = () => {
      if (cancelled) return;
      const r = Math.random();
      if (r < 0.1) dip(Math.random() < 0.5 ? blinkL : blinkR, 0.22, schedule);
      else if (r < 0.32) both(0.15, () => !cancelled && both(0.15, schedule));
      else if (r < 0.42) both(0.46, schedule);
      else both(0.2, schedule);
    };

    const schedule = () => {
      if (!cancelled) timer = window.setTimeout(fire, 2000 + Math.random() * 3000);
    };

    timer = window.setTimeout(fire, 900 + Math.random() * 1400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      blinkL.set(1);
      blinkR.set(1);
    };
  }, [reduce, blinkL, blinkR]);

  // Boop & shake
  const boop = useMotionValue(1);
  const shake = useMotionValue(0);
  const pokes = useRef(0);
  const tallyTimer = useRef(0);
  const onOverpokeRef = useRef(onOverpoke);
  onOverpokeRef.current = onOverpoke;

  const onBoop = () => {
    if (reduce) return;
    animate(boop, [1, 0.86, 1.08, 0.97, 1], { duration: 0.5, ease: 'easeOut', times: [0, 0.2, 0.5, 0.78, 1] });
    pokes.current += 1;
    window.clearTimeout(tallyTimer.current);
    tallyTimer.current = window.setTimeout(() => {
      pokes.current = 0;
    }, 2500);

    if (pokes.current >= 6) {
      pokes.current = 0;
      animate(shake, [0, -6, 6, -5, 5, -3, 3, 0], { duration: 0.8, ease: 'easeInOut' });
      onOverpokeRef.current?.();
    }
  };

  useEffect(() => () => clearTimeout(tallyTimer.current), []);

  const larmRot = useMotionValue(0);
  const larmY = useMotionValue(0);
  const rarmRot = useMotionValue(0);
  const rarmY = useMotionValue(0);

  useEffect(() => {
    const settle = { type: 'spring', stiffness: 170, damping: 18 } as const;
    if (reduce || !IDLE_MOODS.has(mood)) {
      animate(larmRot, 0, settle);
      animate(larmY, 0, settle);
      animate(rarmRot, 0, settle);
      animate(rarmY, 0, settle);
      return;
    }
    let cancelled = false;
    const fidget = (rot: any, lift: any) => {
      let timer = 0;
      const step = () => {
        if (cancelled) return;
        const dur = 1.1 + Math.random() * 1.7;
        animate(rot, (Math.random() - 0.5) * 9, { duration: dur, ease: 'easeInOut' });
        animate(lift, (Math.random() - 0.5) * 4, { duration: dur, ease: 'easeInOut', onComplete: step });
      };
      timer = window.setTimeout(step, Math.random() * 900);
      return () => window.clearTimeout(timer);
    };
    const stopL = fidget(larmRot, larmY);
    const stopR = fidget(rarmRot, rarmY);
    return () => {
      cancelled = true;
      stopL();
      stopR();
    };
  }, [mood, reduce, larmRot, larmY, rarmRot, rarmY]);

  const armRest = useRef<{ left: string; right: string } | null>(null);
  if (!armRest.current) {
    const p = ARM_REST_POSES[Math.floor(Math.random() * ARM_REST_POSES.length)];
    armRest.current = {
      left: `translate(${p.l.dx} ${p.l.dy}) rotate(${p.l.rot} ${LEFT_ARM_PIVOT})`,
      right: `translate(${p.r.dx} ${p.r.dy}) rotate(${p.r.rot} ${RIGHT_ARM_PIVOT})`,
    };
  }

  const gazeX = Math.max(-16, Math.min(18, gaze.x || 0));
  const gazeY = Math.max(-10, Math.min(10, gaze.y || 0));
  const eyeGaze = reduce ? { x: 0, y: 0 } : { x: gazeX, y: gazeY };
  const glossGaze = reduce ? { x: 0, y: 0 } : { x: gazeX * -0.08, y: gazeY * 0.04 };

  const bodyDMV = useMotionValue(reduce ? BODY_PATHS[mood] : IDLE_MOODS.has(mood) ? bottomWave(0) : BODY_PATHS[mood]);
  const moodRef = useRef(mood);
  const fromRef = useRef(bodyDMV.get());
  const morphRef = useRef(1);
  const phaseRef = useRef(0);
  const amtRef = useRef(IDLE_MOODS.has(mood) ? 1 : 0);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    fromRef.current = bodyDMV.get();
    morphRef.current = 0;
    moodRef.current = mood;
  }, [mood, bodyDMV]);

  useEffect(() => {
    if (reduce) {
      bodyDMV.set(BODY_PATHS[mood]);
      return;
    }
    let raf = 0;
    let last = 0;
    const PHASE_SPEED = 0.7;
    const MORPH_RATE = 2.4;
    const AMT_RATE = 2.2;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const idle = IDLE_MOODS.has(moodRef.current);
      phaseRef.current += dt * PHASE_SPEED;
      amtRef.current += ((idle ? 1 : 0) - amtRef.current) * Math.min(1, dt * AMT_RATE);
      const rest = idle ? bottomWave(phaseRef.current, amtRef.current) : BODY_PATHS[moodRef.current];
      morphRef.current = Math.min(1, morphRef.current + dt * MORPH_RATE);
      bodyDMV.set(morphRef.current >= 1 ? rest : lerpPath(fromRef.current, rest, easeInOut(morphRef.current)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce, mood, bodyDMV]);

  const isPassword = mood === 'password';
  const isSideEye = mood === 'sideEye';
  const isHappy = mood === 'happy';
  const isSad = mood === 'sad';
  const isAngry = mood === 'angry';
  const isHmm = mood === 'hmm';

  return (
    <MotionConfig reducedMotion="user">
      <svg
        className={className}
        viewBox="0 0 900 720"
        role="img"
        aria-label={`Jelly blob mascot, ${mood}`}
        onPointerDown={onBoop}
        style={{ display: 'block', overflow: 'visible', cursor: reduce ? undefined : 'pointer' }}
      >
        <defs>
          <radialGradient id={bodyFill} cx="345" cy="192" r="520" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--jelly-body-top, #ecb8ff)" />
            <stop offset="0.32" stopColor="var(--jelly-body-mid, #c57af3)" />
            <stop offset="0.67" stopColor="var(--jelly-body-deep, #a662e8)" />
            <stop offset="1" stopColor="var(--jelly-body-rim, #d292fb)" />
          </radialGradient>
          <linearGradient id={bodyEdge} x1="215" y1="150" x2="735" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--jelly-outline-light, #b66af0)" />
            <stop offset="0.55" stopColor="var(--jelly-outline, #8d52de)" />
            <stop offset="1" stopColor="var(--jelly-outline-light, #ad62ea)" />
          </linearGradient>
          <radialGradient id={armFill} cx="0.45" cy="0.25" r="0.8">
            <stop offset="0" stopColor="var(--jelly-arm-light, #e1a8ff)" />
            <stop offset="0.55" stopColor="var(--jelly-arm-mid, #bc78ed)" />
            <stop offset="1" stopColor="var(--jelly-arm-deep, #9c5de2)" />
          </radialGradient>
          <radialGradient id={cheekFill} cx="0.34" cy="0.28" r="0.78">
            <stop offset="0" stopColor="var(--jelly-cheek-light, #ffc5e2)" />
            <stop offset="0.6" stopColor="var(--jelly-cheek, #f68fc8)" />
            <stop offset="1" stopColor="var(--jelly-cheek-deep, #e87cb9)" />
          </radialGradient>
          <radialGradient id={eyeFill} cx="0.34" cy="0.24" r="0.8">
            <stop offset="0" stopColor="var(--jelly-eye-light, #37204b)" />
            <stop offset="0.55" stopColor="var(--jelly-eye, #170d25)" />
            <stop offset="1" stopColor="var(--jelly-eye-deep, #0d0715)" />
          </radialGradient>
          <radialGradient id={shadowFill} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--jelly-shadow, var(--jelly-outline, #9e57df))" stopOpacity="0.38" />
            <stop offset="0.58" stopColor="var(--jelly-shadow-light, var(--jelly-outline-light, #b46df0))" stopOpacity="0.17" />
            <stop offset="1" stopColor="var(--jelly-shadow-light, var(--jelly-outline-light, #b46df0))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={bellyGlow} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="var(--jelly-belly-glow, #ffb2dc)" stopOpacity="0.5" />
            <stop offset="0.7" stopColor="var(--jelly-belly-glow, #ffb2dc)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--jelly-belly-glow, #ffb2dc)" stopOpacity="0" />
          </radialGradient>
          <clipPath id={bodyClip} clipPathUnits="userSpaceOnUse">
            <motion.path d={BODY_PATHS[mood]} animate={{ d: BODY_PATHS[mood] }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 140, damping: 18, mass: 0.9 }} />
          </clipPath>
          <filter id={shadowBlur} x="-40%" y="-80%" width="180%" height="260%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <filter id={softBlur} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id={wideSoftBlur} x="-45%" y="-45%" width="190%" height="190%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* Outer Group with Shake Physics */}
        <motion.g style={{ x: shake }}>
          {/* Ground Shadow */}
          <ellipse cx="450" cy="582" rx="270" ry="46" fill={`url(#${shadowFill})`} filter={`url(#${shadowBlur})`} />

          {/* Left & Right Arms */}
          <motion.g id="arms" initial={{ opacity: 1 }} animate={mood}>
            <g transform={armRest.current?.left}>
              <motion.g id="left-arm" initial={{ y: 0, rotate: 0, scaleX: 1, scaleY: 1 }} animate={mood} variants={LEFT_ARM_TRANSFORMS} style={leftArmStyle}>
                <motion.g style={{ rotate: larmRot, y: larmY, transformBox: 'fill-box', transformOrigin: '70% 38%' }}>
                  <path
                    id="left-arm-base"
                    d="M216 380 C195 380 180 396 180 416 C180 438 195 452 216 452 C237 452 250 438 250 416 C250 396 237 380 216 380 Z"
                    fill={`url(#${armFill})`}
                    stroke="var(--jelly-arm-deep, #9c5de2)"
                    strokeWidth="5.5"
                    strokeLinejoin="round"
                  />
                  <path id="left-arm-inner-shadow" d="M234 396 C214 402 208 428 220 446" fill="none" stroke="var(--jelly-arm-deep, #8d54db)" strokeWidth="9" strokeLinecap="round" opacity={0.14} filter={`url(#${softBlur})`} />
                  <ellipse id="left-arm-small-highlight" cx="196" cy="405" rx="5.6" ry="9" fill="#ffffff" opacity={0.6} transform="rotate(24 196 405)" />
                </motion.g>
              </motion.g>
            </g>
            <g transform={armRest.current?.right}>
              <motion.g id="right-arm" initial={{ y: 0, rotate: 0, scaleX: 1, scaleY: 1 }} animate={mood} variants={RIGHT_ARM_TRANSFORMS} style={rightArmStyle}>
                <motion.g style={{ rotate: rarmRot, y: rarmY, transformBox: 'fill-box', transformOrigin: '30% 38%' }}>
                  <path
                    id="right-arm-base"
                    d="M684 380 C705 380 720 396 720 416 C720 438 705 452 684 452 C663 452 650 438 650 416 C650 396 663 380 684 380 Z"
                    fill={`url(#${armFill})`}
                    stroke="var(--jelly-arm-deep, #9c5de2)"
                    strokeWidth="5.5"
                    strokeLinejoin="round"
                  />
                  <path id="right-arm-inner-shadow" d="M666 396 C686 402 692 428 680 446" fill="none" stroke="var(--jelly-arm-deep, #8d54db)" strokeWidth="9" strokeLinecap="round" opacity={0.14} filter={`url(#${softBlur})`} />
                  <ellipse id="right-arm-small-highlight" cx="704" cy="405" rx="5.6" ry="9" fill="#ffffff" opacity={0.6} transform="rotate(-24 704 405)" />
                </motion.g>
              </motion.g>
            </g>
          </motion.g>

          {/* Main Jelly Body */}
          <motion.g id="body" initial={{ x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1, skewX: 0 }} animate={mood} variants={BODY_TRANSFORMS} style={svgMotionStyle}>
            <motion.path
              id="body-main-shape"
              d={bodyDMV}
              fill={`url(#${bodyFill})`}
              stroke={`url(#${bodyEdge})`}
              strokeWidth="5.8"
              strokeLinejoin="round"
            />
            {/* Shading clipped to body */}
            <g id="body-shading-clipped" clipPath={`url(#${bodyClip})`}>
              <path id="left-inner-shine" d="M300 210C262 300 258 430 286 512" fill="none" stroke="#ffffff" strokeWidth="22" strokeLinecap="round" opacity={0.13} filter={`url(#${wideSoftBlur})`} />
              <path id="right-inner-shade" d="M672 270C698 360 684 500 616 548" fill="none" stroke="var(--jelly-outline, #7e47cf)" strokeWidth="24" strokeLinecap="round" opacity={0.14} filter={`url(#${wideSoftBlur})`} />
              <ellipse id="top-soft-sheen" cx="470" cy="175" rx="92" ry="27" fill="#ffffff" opacity={0.14} transform="rotate(1 470 175)" filter={`url(#${softBlur})`} />
              <ellipse id="right-body-shine" cx="592" cy="252" rx="16" ry="36" fill="#ffffff" opacity={0.14} transform="rotate(-26 592 252)" filter={`url(#${softBlur})`} />
            </g>

            {/* Belly glow */}
            <motion.g id="lower-jelly-belly" initial={{ x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1 }} animate={mood} variants={HIGHLIGHT_TRANSFORMS} style={centerMotionStyle}>
              <ellipse id="bottom-belly-glow" cx="450" cy="504" rx="240" ry="62" fill={`url(#${bellyGlow})`} opacity={0.95} />
            </motion.g>

            {/* Highlights */}
            <g>
              <motion.g id="highlights" animate={mood} style={centerMotionStyle}>
                <motion.g id="head-gloss" animate={mood} style={centerMotionStyle}>
                  <motion.g id="head-gloss-gaze" animate={glossGaze} transition={{ type: 'spring', stiffness: 180, damping: 18 }}>
                    <ellipse id="large-highlight" cx="372" cy="212" rx="37" ry="21" fill="#ffffff" opacity={0.9} transform="rotate(-36 372 212)" />
                    <g id="small-highlights">
                      <circle id="small-head-highlight" cx="320" cy="268" r="12" fill="#ffffff" opacity={0.86} />
                      <circle id="top-dot-highlight" cx="424" cy="172" r="10" fill="#ffffff" opacity={isSad ? 0 : 0.84} style={{ transition: 'opacity 0.2s ease' }} />
                    </g>
                  </motion.g>
                </motion.g>
                <ellipse id="left-side-faint-gloss" cx="252" cy="470" rx="17" ry="56" fill="#ffffff" opacity={0.09} transform="rotate(-6 252 470)" filter={`url(#${softBlur})`} />
                <ellipse id="right-side-faint-gloss" cx="648" cy="470" rx="17" ry="56" fill="#ffffff" opacity={0.09} transform="rotate(8 648 470)" filter={`url(#${softBlur})`} />
              </motion.g>
            </g>
          </motion.g>

          {/* Emotive Face Group */}
          <motion.g id="face" initial={{ x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0 }} animate={mood} variants={FACE_TRANSFORMS} style={centerMotionStyle}>
            {/* Left & Right Cheeks */}
            <motion.g
              id="left-cheek"
              initial={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 0.76 }}
              animate={mood}
              variants={CHEEK_TRANSFORMS}
              style={centerMotionStyle}
            >
              <ellipse id="left-cheek-base" cx="309" cy="430" rx="35" ry="23" fill={`url(#${cheekFill})`} opacity={0.82} />
              <ellipse id="left-cheek-highlight-large" cx="294" cy="421" rx="6.2" ry="4.2" fill="#ffffff" opacity={0.44} transform="rotate(-20 294 421)" />
              <ellipse id="left-cheek-highlight-small" cx="319" cy="420" rx="5.8" ry="4" fill="#ffffff" opacity={0.36} transform="rotate(22 319 420)" />
            </motion.g>
            <motion.g
              id="right-cheek"
              initial={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 0.76 }}
              animate={mood}
              variants={CHEEK_TRANSFORMS}
              style={centerMotionStyle}
            >
              <ellipse id="right-cheek-base" cx="617" cy="430" rx="35" ry="23" fill={`url(#${cheekFill})`} opacity={0.82} />
              <ellipse id="right-cheek-highlight-large" cx="602" cy="421" rx="6.2" ry="4.2" fill="#ffffff" opacity={0.44} transform="rotate(-20 602 421)" />
              <ellipse id="right-cheek-highlight-small" cx="627" cy="420" rx="5.8" ry="4" fill="#ffffff" opacity={0.36} transform="rotate(22 627 420)" />
            </motion.g>

            {/* Standard Eyes (with star / highlight sparkles and blink animation) */}
            <motion.g id="eyes" animate={eyeGaze} transition={{ type: 'spring', stiffness: 220, damping: 20 }} style={centerMotionStyle}>
              {/* Left Eye */}
              <motion.g id="left-eye" initial={{ x: 0, y: 0 }} animate={mood} variants={LEFT_EYE_MOOD} transition={{ delay: 0.05, type: 'spring', stiffness: 240, damping: 17 }} style={centerMotionStyle}>
                <g style={{ opacity: (isHappy && happyEyes === 'smile') || isPassword || isSideEye ? 0 : 1, transition: 'opacity 0.13s ease-out' }}>
                  <motion.g initial={{ scaleX: 1, scaleY: 1, y: 0 }} animate={mood} variants={EYE_TRANSFORMS} style={centerMotionStyle}>
                    <motion.g style={{ ...centerMotionStyle, scaleX: blinkLX, scaleY: blinkL }}>
                      <ellipse id="left-eye-base" cx="353" cy="371" rx="32" ry="39" fill={`url(#${eyeFill})`} />
                      <ellipse id="left-eye-lower-shade" cx="353" cy="393" rx="23" ry="12" fill="var(--jelly-eye-light, #2a1640)" opacity={0.3} />
                      <circle id="left-eye-main-highlight" cx="364" cy="353" r="10.5" fill="#ffffff" opacity={isHappy && happyEyes === 'star' ? 0 : 0.96} style={{ transition: 'opacity 0.16s' }} />
                      <path
                        id="left-eye-star"
                        d="M364 340 C366.4 349.4 367.6 350.6 377 353 C367.6 355.4 366.4 356.6 364 366 C361.6 356.6 360.4 355.4 351 353 C360.4 350.6 361.6 349.4 364 340 Z"
                        fill="#ffffff"
                        opacity={isHappy && happyEyes === 'star' ? 1 : 0}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center', transition: 'opacity 0.2s ease' }}
                      />
                      <circle id="left-eye-secondary-highlight" cx="359" cy="347" r="3.2" fill="#ffffff" opacity={0.58} />
                      <circle id="left-eye-violet-sparkle" cx="339" cy="391" r="5.8" fill="var(--jelly-eye-sparkle, #b471e6)" opacity={0.62} />
                    </motion.g>
                  </motion.g>
                </g>
                {/* Left Happy Eye Arc */}
                <path
                  id="left-eye-happy-arc"
                  d="M325 380 C341 330 365 330 381 380"
                  fill="none"
                  stroke={`url(#${eyeFill})`}
                  strokeWidth="11"
                  strokeLinecap="round"
                  opacity={isHappy && happyEyes === 'smile' ? 1 : 0}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center bottom', transition: 'opacity 0.18s ease' }}
                />
              </motion.g>

              {/* Right Eye */}
              <motion.g id="right-eye" initial={{ x: 0, y: 0 }} animate={mood} variants={RIGHT_EYE_MOOD} transition={{ delay: 0.05, type: 'spring', stiffness: 240, damping: 17 }} style={centerMotionStyle}>
                <g style={{ opacity: (isHappy && happyEyes === 'smile') || isPassword || isSideEye ? 0 : 1, transition: 'opacity 0.13s ease-out' }}>
                  <motion.g initial={{ scaleX: 1, scaleY: 1, y: 0 }} animate={mood} variants={EYE_TRANSFORMS} style={centerMotionStyle}>
                    <motion.g style={{ ...centerMotionStyle, scaleX: blinkRX, scaleY: blinkR }}>
                      <ellipse id="right-eye-base" cx="551" cy="371" rx="32" ry="39" fill={`url(#${eyeFill})`} />
                      <ellipse id="right-eye-lower-shade" cx="551" cy="393" rx="23" ry="12" fill="var(--jelly-eye-light, #2a1640)" opacity={0.3} />
                      <circle id="right-eye-main-highlight" cx="540" cy="353" r="10.5" fill="#ffffff" opacity={isHappy && happyEyes === 'star' ? 0 : 0.96} style={{ transition: 'opacity 0.16s' }} />
                      <path
                        id="right-eye-star"
                        d="M540 340 C542.4 349.4 543.6 350.6 553 353 C543.6 355.4 542.4 356.6 540 366 C537.6 356.6 536.4 355.4 527 353 C536.4 350.6 537.6 349.4 540 340 Z"
                        fill="#ffffff"
                        opacity={isHappy && happyEyes === 'star' ? 1 : 0}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center', transition: 'opacity 0.2s ease' }}
                      />
                      <circle id="right-eye-secondary-highlight" cx="545" cy="347" r="3.2" fill="#ffffff" opacity={0.58} />
                      <circle id="right-eye-violet-sparkle" cx="565" cy="391" r="5.8" fill="var(--jelly-eye-sparkle, #b471e6)" opacity={0.62} />
                    </motion.g>
                  </motion.g>
                </g>
                {/* Right Happy Eye Arc */}
                <path
                  id="right-eye-happy-arc"
                  d="M523 380 C539 330 563 330 579 380"
                  fill="none"
                  stroke={`url(#${eyeFill})`}
                  strokeWidth="11"
                  strokeLinecap="round"
                  opacity={isHappy && happyEyes === 'smile' ? 1 : 0}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center bottom', transition: 'opacity 0.18s ease' }}
                />
              </motion.g>
            </motion.g>

            {/* Password Face (Look-down eyes + dot mouth) */}
            <g
              id="password-face"
              pointerEvents="none"
              style={{
                opacity: isPassword ? 1 : 0,
                transition: 'opacity 0.13s ease-out',
                ...centerMotionStyle,
              }}
            >
              <path id="left-password-eye" d="M314 353 C331 365 355 365 372 353" fill="none" stroke="#21102f" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
              <path id="right-password-eye" d="M520 353 C537 365 561 365 578 353" fill="none" stroke="#21102f" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
              <ellipse id="password-dot-mouth" cx="452" cy="397" rx="13" ry="9" fill="#21102f" opacity={0.92} />
            </g>

            {/* Side-Eye Face */}
            <g
              id="side-eye-eyes"
              pointerEvents="none"
              style={{
                opacity: isSideEye ? 1 : 0,
                transition: 'opacity 0.13s ease-out',
                ...centerMotionStyle,
              }}
            >
              <path id="left-side-eye" d="M314 357 C331 337 353 336 372 351" fill="none" stroke="#21102f" strokeWidth="11" strokeLinecap="round" opacity={0.92} />
              <ellipse id="left-side-eye-blob" cx="373" cy="360" rx="10.5" ry="13.5" fill="#21102f" opacity={0.92} transform="rotate(-16 373 360)" />
              <path id="right-side-eye" d="M520 357 C537 337 559 336 578 351" fill="none" stroke="#21102f" strokeWidth="11" strokeLinecap="round" opacity={0.92} />
              <ellipse id="right-side-eye-blob" cx="579" cy="360" rx="10.5" ry="13.5" fill="#21102f" opacity={0.92} transform="rotate(-16 579 360)" />
            </g>

            {/* Hmm Lids */}
            <g
              id="hmm-lids"
              pointerEvents="none"
              style={{
                opacity: isHmm ? 0.52 : 0,
                transition: 'opacity 0.16s ease-out',
                ...centerMotionStyle,
              }}
            >
              <path id="left-hmm-lid" d="M324 345 C342 336 365 337 383 345" fill="none" stroke="#21102f" strokeWidth="6.5" strokeLinecap="round" opacity={0.62} />
              <path id="right-hmm-lid" d="M521 345 C541 336 564 337 581 345" fill="none" stroke="#21102f" strokeWidth="6.5" strokeLinecap="round" opacity={0.62} />
            </g>

            {/* Sad Brows */}
            <g
              id="sad-brows"
              pointerEvents="none"
              style={{
                opacity: isSad ? 1 : 0,
                transition: 'opacity 0.16s ease-out',
                ...centerMotionStyle,
              }}
            >
              <path id="left-sad-brow" d="M318 342 C342 328 370 324 392 331" fill="none" stroke="#21102f" strokeWidth="7" strokeLinecap="round" opacity={0.58} />
              <path id="right-sad-brow" d="M512 331 C534 324 562 328 586 342" fill="none" stroke="#21102f" strokeWidth="7" strokeLinecap="round" opacity={0.58} />
            </g>

            {/* Happy Open Mouth */}
            <g
              id="happy-open-mouth"
              style={{
                opacity: isHappy ? 1 : 0,
                transition: 'opacity 0.18s ease-out',
                ...centerMotionStyle,
              }}
            >
              <path id="open-mouth-fill" d="M420 402 C440 384 465 384 485 402 C470 446 435 446 420 402 Z" fill="#3a0f24" stroke="none" />
              <path id="open-mouth-tongue" d="M438 424 C440 442 465 442 467 424 C462 418 444 418 438 424 Z" fill="var(--jelly-cheek, #ff8fc0)" stroke="none" />
              <ellipse id="open-mouth-tongue-shine" cx="452" cy="427" rx="9" ry="3.4" fill="#ffc2dc" opacity={0.7} />
            </g>

            {/* Default Mouth Line */}
            <motion.path
              id="mouth"
              d={MOUTH_PATHS[mood]}
              animate={{ d: MOUTH_PATHS[mood] }}
              transition={reduce ? { duration: 0 } : { delay: 0.05, type: 'spring', stiffness: 240, damping: 16 }}
              fill="none"
              stroke="#21102f"
              strokeWidth={isSad ? 9 : 8}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: mouth || isPassword || isHappy ? 0 : 1,
                transition: 'opacity 0.12s ease',
              }}
            />

            {/* Talking Mouth shape if mouth prop is active */}
            {mouth && (
              <motion.path
                id="mouth-oh"
                d={mouth === 'wide' ? TALK_MOUTH_PATHS.wide[0] : TALK_MOUTH_PATHS.open[0]}
                fill="#21102f"
                style={centerMotionStyle}
              />
            )}
          </motion.g>

          {/* Sad Tears Effect */}
          {isSad && (
            <motion.g
              id="sad-tears"
              initial={{ opacity: 0.72 }}
              animate={{ opacity: [0.72, 0.94, 0.72], y: [0, 5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M335 397 C324 414 326 428 338 434 C351 427 349 413 335 397Z" fill="#9de8ff" opacity={0.82} />
              <ellipse cx="335" cy="410" rx="3.2" ry="5.8" fill="#ffffff" opacity={0.48} transform="rotate(18 335 410)" />
              <path d="M570 397 C559 414 561 428 573 434 C586 427 584 413 570 397Z" fill="#9de8ff" opacity={0.82} />
              <ellipse cx="570" cy="410" rx="3.2" ry="5.8" fill="#ffffff" opacity={0.48} transform="rotate(18 570 410)" />
            </motion.g>
          )}

          {/* Angry Effects */}
          {isAngry && (
            <motion.g
              id="angry-effects"
              initial={{ opacity: 1 }}
              animate={{ x: [0, 4, -3, 0] }}
              transition={{ duration: 0.32, repeat: Infinity }}
            >
              <path d="M617 286 L639 268 M636 292 L660 287 M630 313 L653 329" stroke="var(--jelly-outline, #813ad6)" strokeWidth="9" strokeLinecap="round" opacity={0.86} />
              <circle cx="260" cy="306" r="13" fill="var(--jelly-body-rim, #cf8dff)" opacity={0.55} />
              <circle cx="241" cy="292" r="8" fill="var(--jelly-body-rim, #cf8dff)" opacity={0.45} />
              <circle cx="683" cy="304" r="13" fill="var(--jelly-body-rim, #cf8dff)" opacity={0.55} />
              <circle cx="704" cy="290" r="8" fill="var(--jelly-body-rim, #cf8dff)" opacity={0.45} />
            </motion.g>
          )}

          {/* Happy Floating Hearts & Sparks */}
          {isHappy && (
            <g id="happy-decor" style={centerMotionStyle}>
              <motion.path
                id="happy-spark-yellow"
                d="M636 318 C638 332 642 336 656 338 C642 340 638 344 636 358 C634 344 630 340 616 338 C630 336 634 332 636 318 Z"
                fill="#ffe07a"
                animate={{ y: [-4, -12, -4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
              <circle id="happy-spark-yellow-dot" cx="662" cy="318" r="4" fill="#fff2a8" />
              <motion.path
                id="happy-heart-pink"
                d="M270 326 C264 318 252 320 252 331 C252 341 263 348 270 354 C277 348 288 341 288 331 C288 320 276 318 270 326 Z"
                fill="var(--jelly-cheek, #ff8fc6)"
                animate={{ y: [-3, -11, -3] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              />
              <circle id="happy-heart-dot" cx="263" cy="328" r="2.6" fill="#ffd0e6" opacity={0.85} />
            </g>
          )}
        </motion.g>
      </svg>
    </MotionConfig>
  );
}
