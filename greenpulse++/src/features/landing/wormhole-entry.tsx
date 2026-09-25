/**
 * @license
 * GreenPulse AI — Wormhole Entry Portal Animation Component
 * High-performance 60FPS WebGL cinematic warp tunnel entry experience.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { Sparkles, Play, FastForward, ShieldCheck, Cpu } from 'lucide-react';
import { MissionControlBootSequence } from '../../components/ui/boot-sequence';

export interface WormholeEntryProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

export const WormholeEntry: React.FC<WormholeEntryProps> = ({ onComplete, autoPlay = true }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [stageText, setStageText] = useState<string>('INIT_NEURAL_TELEMETRY');
  const [progress, setProgress] = useState<number>(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Check reduced motion preference & session storage
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = sessionStorage.getItem('gp_wormhole_seen');

    if (!seen && autoPlay) {
      if (prefersReducedMotion) {
        // Skip heavy animation for reduced motion users
        sessionStorage.setItem('gp_wormhole_seen', 'true');
        onComplete?.();
      } else {
        setIsActive(true);
        sessionStorage.setItem('gp_wormhole_seen', 'true');
      }
    }
  }, [autoPlay, onComplete]);

  // WebGL 3D Scene Initialization
  useEffect(() => {
    if (!isActive) return;

    const container = canvasContainerRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene & Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0e14, 0.002);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 0, 100);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Tunnel Ring Structure
    const ringCount = 35;
    const rings: THREE.Mesh[] = [];
    const ringGroup = new THREE.Group();

    const ringGeo = new THREE.TorusGeometry(35, 0.6, 8, 32);

    for (let i = 0; i < ringCount; i++) {
      const isGreen = i % 2 === 0;
      const ringMat = new THREE.MeshBasicMaterial({
        color: isGreen ? 0x2ed9a3 : 0x3fb6e8,
        wireframe: true,
        transparent: true,
        opacity: 0.1 + (i / ringCount) * 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.z = -i * 25;
      ring.scale.setScalar(1 + (ringCount - i) * 0.02);
      rings.push(ring);
      ringGroup.add(ring);
    }
    scene.add(ringGroup);

    // 3. Warp Speed Streaks
    const streakCount = 200;
    const streakGeo = new THREE.BufferGeometry();
    const streakPositions = new Float32Array(streakCount * 6); // 2 points per line

    for (let i = 0; i < streakCount; i++) {
      const x = (Math.random() - 0.5) * 150;
      const y = (Math.random() - 0.5) * 150;
      const z = -Math.random() * 800;
      const length = 20 + Math.random() * 40;

      streakPositions[i * 6] = x;
      streakPositions[i * 6 + 1] = y;
      streakPositions[i * 6 + 2] = z;

      streakPositions[i * 6 + 3] = x;
      streakPositions[i * 6 + 4] = y;
      streakPositions[i * 6 + 5] = z - length;
    }

    streakGeo.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
    const streakMat = new THREE.LineBasicMaterial({
      color: 0x8b7fff,
      transparent: true,
      opacity: 0.8,
    });
    const streakLines = new THREE.LineSegments(streakGeo, streakMat);
    scene.add(streakLines);

    // 4. Low-Poly Exit Earth Globe
    const earthGroup = new THREE.Group();
    earthGroup.position.set(0, 0, -850); // Positioned at exit end

    const earthGeo = new THREE.IcosahedronGeometry(70, 3);
    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x121824,
      emissive: 0x0a0f18,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    const atmosGeo = new THREE.SphereGeometry(76, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x2ed9a3,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    earthGroup.add(atmosMesh);

    scene.add(earthGroup);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x2ed9a3, 2);
    dirLight.position.set(100, 100, -500);
    scene.add(dirLight);

    // 6. Animation Timeline & Stage Logic
    let startTime = performance.now();
    let animFrameId: number;

    const animate = (time: number) => {
      animFrameId = requestAnimationFrame(animate);

      const elapsed = (time - startTime) / 1000; // Total seconds
      const currentPct = Math.min(100, Math.round((elapsed / 3.6) * 100));
      setProgress(currentPct);

      // Stage Progression Updates
      if (elapsed < 0.6) {
        setStageText('INIT_NEURAL_TELEMETRY');
        // Stage 1: Darkness -> Tunnel ring fade-in
        ringGroup.rotation.z += 0.005;
        camera.position.z = 100;
      } else if (elapsed < 1.8) {
        setStageText('WARPING_THROUGH_SCOPE_1_2_3_PIPELINE');
        // Stage 2 & 3: Fast Tunnel Travel
        camera.position.z -= 6; // Move fast into tunnel
        ringGroup.rotation.z += 0.02;

        // Move streak lines back for illusion of warp speed
        const positions = streakLines.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < streakCount; i++) {
          positions[i * 6 + 2] += 12;
          positions[i * 6 + 5] += 12;
          if (positions[i * 6 + 2] > camera.position.z) {
            positions[i * 6 + 2] = camera.position.z - 800;
            positions[i * 6 + 5] = camera.position.z - 840;
          }
        }
        streakLines.geometry.attributes.position.needsUpdate = true;
      } else if (elapsed < 2.8) {
        setStageText('EXITING_PORTAL_REVEALING_PLANET_OS');
        // Stage 4: Exit tunnel -> Approaching Earth
        camera.position.z -= 4;
        earthMesh.rotation.y += 0.01;
        // Fade out tunnel rings
        rings.forEach(r => {
          (r.material as THREE.MeshBasicMaterial).opacity *= 0.95;
        });
      } else if (elapsed < 3.6) {
        setStageText('GREENPULSE_OS_SYNCHRONIZED');
        earthMesh.rotation.y += 0.015;
      } else {
        // Complete sequence
        cancelAnimationFrame(animFrameId);
        setIsActive(false);
        onComplete?.();
        return;
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    // Window Resize Handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // ESC key shortcut to skip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelAnimationFrame(animFrameId);
        setIsActive(false);
        onComplete?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isActive, onComplete]);

  const triggerWormhole = () => {
    setProgress(0);
    setIsActive(true);
  };

  return (
    <>
      {/* Replay trigger button for showcase */}
      <button
        onClick={triggerWormhole}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171C27] border border-[#2ED9A3]/30 hover:border-[#2ED9A3] text-[11px] font-medium text-[#2ED9A3] transition-all hover:scale-105 shadow-md"
      >
        <Play className="w-3 h-3 text-[#2ED9A3]" /> Replay Boot Launch
      </button>

      {isActive && (
        <MissionControlBootSequence
          forcePlay={true}
          onComplete={() => {
            setIsActive(false);
            onComplete?.();
          }}
        />
      )}
    </>
  );
};
