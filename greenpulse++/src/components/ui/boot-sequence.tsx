/**
 * @license
 * GreenPulse AI — Mission Control Boot Sequence
 * Cinematic 60 FPS startup experience powering the AI Sustainability OS.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import {
  Leaf,
  Cpu,
  Sparkles,
  CheckCircle2,
  FastForward,
  ShieldCheck,
  Globe2,
  Zap,
  Bot,
  Activity,
  Satellite
} from 'lucide-react';

export interface BootSequenceProps {
  onComplete?: () => void;
  forcePlay?: boolean;
}

const DIAGNOSTIC_STEPS = [
  { id: 'ai', label: 'AI Engine Online', icon: Cpu, detail: 'Gemini 2.5 Sustainability Model Loaded' },
  { id: 'carbon', label: 'Carbon Intelligence Ready', icon: Activity, detail: 'Scope 1, 2, 3 Telemetry Calibrated' },
  { id: 'esg', label: 'ESG Analyzer Ready', icon: ShieldCheck, detail: 'SEBI BRSR & EU CSRD Schemas Verified' },
  { id: 'satellite', label: 'Satellite Network Connected', icon: Satellite, detail: 'NASA FIRMS & Sentinel Emission Feeds Active' },
  { id: 'energy', label: 'Energy Intelligence Ready', icon: Zap, detail: 'Grid Emission Factors Synchronized' },
  { id: 'copilot', label: 'GreenPulse Copilot Ready', icon: Bot, detail: 'Autonomous Decarbonization Agent Standby' },
  { id: 'planet', label: 'Planet Synchronization Complete', icon: Globe2, detail: 'Real-time Earth Digital Twin Online' },
];

export const MissionControlBootSequence: React.FC<BootSequenceProps> = ({ onComplete, forcePlay = false }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<'pulse' | 'diagnostics' | 'warp' | 'reveal'>('pulse');
  const [activeDiagIndex, setActiveDiagIndex] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Determine whether to run on mount
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = sessionStorage.getItem('gp_mission_boot_seen');

    if (forcePlay || (!seen && !prefersReducedMotion)) {
      sessionStorage.setItem('gp_mission_boot_seen', 'true');
      setIsActive(true);
    }
  }, [forcePlay]);

  // Main Boot Sequence Timeline Controller
  useEffect(() => {
    if (!isActive) return;

    let isCancelled = false;

    // 1. Phase: Pulse & Logo Reveal (0s - 1.2s)
    setPhase('pulse');
    setProgress(5);

    const timerPulse = setTimeout(() => {
      if (isCancelled) return;
      setPhase('diagnostics');
      setActiveDiagIndex(0);
      setProgress(15);
    }, 1200);

    // 2. Phase: Diagnostics Rollout (1.2s - 3.4s)
    const diagInterval = setInterval(() => {
      if (isCancelled) return;
      setActiveDiagIndex((prev) => {
        if (prev < DIAGNOSTIC_STEPS.length - 1) {
          const next = prev + 1;
          setProgress(15 + Math.round((next / DIAGNOSTIC_STEPS.length) * 45));
          return next;
        } else {
          clearInterval(diagInterval);
          return prev;
        }
      });
    }, 280);

    // 3. Phase: Warp Tunnel Launch (3.4s - 5.6s)
    const timerWarp = setTimeout(() => {
      if (isCancelled) return;
      setPhase('warp');
      setProgress(75);
    }, 3400);

    // 4. Phase: Final Earth & OS Reveal (5.6s - 6.4s)
    const timerReveal = setTimeout(() => {
      if (isCancelled) return;
      setPhase('reveal');
      setProgress(100);
    }, 5600);

    // Complete Sequence (6.4s)
    const timerEnd = setTimeout(() => {
      if (isCancelled) return;
      setIsActive(false);
      onComplete?.();
    }, 6400);

    return () => {
      isCancelled = true;
      clearTimeout(timerPulse);
      clearInterval(diagInterval);
      clearTimeout(timerWarp);
      clearTimeout(timerReveal);
      clearTimeout(timerEnd);
    };
  }, [isActive, onComplete]);

  // 3D Three.js WebGL Warp Canvas Scene
  useEffect(() => {
    if (!isActive || (phase !== 'warp' && phase !== 'reveal')) return;

    const container = canvasContainerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e14, 0.002);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Warp Rings
    const ringCount = 30;
    const ringGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(32, 0.5, 8, 32);

    for (let i = 0; i < ringCount; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0x2ed9a3 : 0x3fb6e8,
        wireframe: true,
        transparent: true,
        opacity: 0.15 + (i / ringCount) * 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = -i * 24;
      ring.scale.setScalar(1 + (ringCount - i) * 0.02);
      ringGroup.add(ring);
    }
    scene.add(ringGroup);

    // Exit Earth Globe
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, 0, -750);

    const earthGeo = new THREE.IcosahedronGeometry(68, 3);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x121824,
      emissive: 0x0a0f18,
      wireframe: true,
      transparent: true,
      opacity: 0.95,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    const atmosGeo = new THREE.SphereGeometry(74, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x2ed9a3,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    earthGroup.add(atmosMesh);

    scene.add(earthGroup);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0x2ed9a3, 2.5);
    dirLight.position.set(100, 100, -400);
    scene.add(dirLight);

    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);

      ringGroup.rotation.z += 0.015;
      camera.position.z -= 4.5;
      earthMesh.rotation.y += 0.01;

      if (camera.position.z < -650) {
        camera.position.z = -650;
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isActive, phase]);

  // ESC shortcut to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        setIsActive(false);
        onComplete?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[9999] bg-[#0A0E14] flex flex-col justify-between overflow-hidden select-none font-sans"
      >
        {/* WebGL Canvas Background during Warp/Reveal Phase */}
        {(phase === 'warp' || phase === 'reveal') && (
          <div ref={canvasContainerRef} className="absolute inset-0 z-0 pointer-events-none" />
        )}

        {/* Ambient Emerald Pulse Ring Effect in Phase 1 */}
        {phase === 'pulse' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="w-64 h-64 rounded-full border border-[#2ED9A3] bg-[#2ED9A3]/10 blur-xl"
            />
          </div>
        )}

        {/* Top Header HUD */}
        <div className="relative z-20 p-6 sm:p-8 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] aurora-gradient-bg flex items-center justify-center shadow-[0_0_20px_rgba(46,217,163,0.5)]">
              <Leaf className="w-5 h-5 text-[#0A0E14]" />
            </div>
            <div>
              <span className="font-display font-semibold text-base text-[#F4F6F8] tracking-tight block">
                GreenPulse AI
              </span>
              <span className="text-[10px] text-[#2ED9A3] font-data tracking-widest uppercase">
                Enterprise Sustainability OS v2.5
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsActive(false);
              onComplete?.();
            }}
            className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12161F]/90 border border-[#242B38] text-xs font-data text-[#8891A3] hover:text-[#F4F6F8] hover:border-[#2ED9A3] transition-all hover:scale-105 shadow-md"
          >
            <FastForward className="w-3.5 h-3.5 text-[#2ED9A3]" /> Skip Sequence (ESC)
          </button>
        </div>

        {/* Center Stage Content */}
        <div className="relative z-20 my-auto text-center max-w-xl mx-auto px-6 w-full space-y-8 pointer-events-none">
          {/* Logo Materialization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-3"
          >
            <div className="w-20 h-20 rounded-2xl aurora-gradient-bg mx-auto flex items-center justify-center shadow-[0_0_60px_rgba(46,217,163,0.45)]">
              <Sparkles className="w-10 h-10 text-[#0A0E14]" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#F4F6F8] tracking-tight">
              {phase === 'pulse' && 'Initializing Core Operating System...'}
              {phase === 'diagnostics' && 'Running System Diagnostics'}
              {(phase === 'warp' || phase === 'reveal') && 'Warping to Mission Control'}
            </h1>
          </motion.div>

          {/* System Diagnostics Checklist Panel */}
          {(phase === 'diagnostics' || phase === 'pulse') && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-panel p-5 rounded-2xl border border-[#242B38] text-left space-y-2.5 max-w-md mx-auto backdrop-blur-xl shadow-2xl"
            >
              <div className="flex items-center justify-between text-[11px] font-data text-[#8891A3] pb-2 border-b border-[#1A1F2A]">
                <span>DIAGNOSTIC_MODULES</span>
                <span className="text-[#2ED9A3]">{activeDiagIndex + 1} / {DIAGNOSTIC_STEPS.length} READY</span>
              </div>

              <div className="space-y-2">
                {DIAGNOSTIC_STEPS.map((step, idx) => {
                  const Icon = step.icon;
                  const isReady = idx <= activeDiagIndex;
                  const isCurrent = idx === activeDiagIndex;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: isReady ? 1 : 0.25, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-data transition-colors ${
                        isCurrent ? 'bg-[#2ED9A3]/10 border border-[#2ED9A3]/30' : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isReady ? 'text-[#2ED9A3]' : 'text-[#8891A3]'}`} />
                        <span className={`truncate font-medium ${isReady ? 'text-[#F4F6F8]' : 'text-[#8891A3]'}`}>
                          {step.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isReady ? (
                          <>
                            <span className="text-[10px] text-[#2ED9A3] font-semibold">[READY]</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3]" />
                          </>
                        ) : (
                          <span className="text-[10px] text-[#8891A3]">[WAIT]</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Warp / Reveal Banner */}
          {(phase === 'warp' || phase === 'reveal') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12161F]/80 border border-[#2ED9A3]/40 text-xs font-data text-[#2ED9A3] shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-ping" />
                PLANET DIGITAL TWIN SYNCHRONIZED
              </div>
              <p className="text-xs text-[#8891A3] font-data">
                Entering Mission Control Center • Carbon & Energy Telemetry Live
              </p>
            </motion.div>
          )}

          {/* High-Tech Progress Bar */}
          <div className="space-y-1.5 max-w-md mx-auto">
            <div className="w-full bg-[#171C27] rounded-full h-1.5 overflow-hidden border border-[#242B38] p-0.5">
              <div
                className="aurora-gradient-bg h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#8891A3] font-data px-1">
              <span>SYSTEM BOOT INITIALIZATION</span>
              <span className="font-semibold text-[#2ED9A3]">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer Telemetry */}
        <div className="relative z-20 p-6 sm:p-8 flex items-center justify-between text-[10px] text-[#8891A3] font-data pointer-events-none border-t border-[#1A1F2A]/50">
          <span>LATENCY: 12ms • GPU_RENDER: 60FPS</span>
          <span className="hidden sm:inline">SEBI BRSR & EU CSRD COMPLIANT ENGINE</span>
          <span>MISSION CONTROL ACTIVE</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
