/**
 * @license
 * GreenPulse AI — Low-Poly 3D Interactive Earth Canvas Component
 * Built with WebGL Canvas / Three.js lightweight setup for 60FPS performance on mid-range GPUs.
 * Features: Low-poly Earth, Soft Atmosphere Glow, Low-Poly Cloud Layer, Aurora Lighting, Orbiting Carbon Particles.
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useUiStore } from '../../stores';
import { ThemeMode } from '../../types/enums';

export interface EarthGlobeProps {
  className?: string;
  interactive?: boolean;
  showBadge?: boolean;
  atmosphereGlow?: number; // multiplier for atmosphere opacity
}

export const EarthGlobe: React.FC<EarthGlobeProps> = ({
  className = '',
  interactive = true,
  showBadge = true,
  atmosphereGlow = 1,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { themeMode } = useUiStore();
  const isLight = themeMode === ThemeMode.LIGHT;
  const isLightRef = useRef(isLight);

  useEffect(() => {
    isLightRef.current = isLight;
  }, [isLight]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 260;

    // 2. High-Efficiency WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Root Group containing all globe objects
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 3. Low-Poly Core Earth Mesh
    const earthGeo = new THREE.IcosahedronGeometry(75, 3);
    const earthMat = new THREE.MeshPhongMaterial({
      color: isLightRef.current ? 0x059669 : 0x121824,
      emissive: isLightRef.current ? 0x064e3b : 0x0a0f1a,
      specular: isLightRef.current ? 0x34d399 : 0x2ed9a3,
      shininess: isLightRef.current ? 25 : 15,
      flatShading: true,
      wireframe: true,
      transparent: true,
      opacity: isLightRef.current ? 0.95 : 0.88,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // Inner Core Sphere (Ocean Base)
    const coreGeo = new THREE.IcosahedronGeometry(73, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: isLightRef.current ? 0x1e3a8a : 0x0a0e14,
      transparent: true,
      opacity: 0.95,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 4. Low-Poly Cloud Layer
    const cloudGeo = new THREE.IcosahedronGeometry(80, 2);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: isLightRef.current ? 0xffffff : 0x3fb6e8,
      wireframe: true,
      transparent: true,
      opacity: isLightRef.current ? 0.45 : 0.18,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);

    // 5. Soft Atmosphere Outer Glow Shell
    const atmosGeo = new THREE.SphereGeometry(86, 24, 24);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: isLightRef.current ? 0x60a5fa : 0x2ed9a3,
      transparent: true,
      opacity: isLightRef.current ? 0.28 : 0.12,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 6. Orbiting Carbon & Telemetry Particles
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const radius = 90 + Math.random() * 35;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x2ed9a3,
      size: 2,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    globeGroup.add(particleSystem);

    // 7. Global Facility Nodes
    const locations = [
      { name: 'Pune Mfg Hub', lat: 18.5204, lon: 73.8567, color: 0x2ed9a3 },
      { name: 'Tokyo Energy Grid Node', lat: 35.6762, lon: 139.6503, color: 0x3fb6e8 },
      { name: 'Frankfurt Datacenter', lat: 50.1109, lon: 8.6821, color: 0x8b7fff },
      { name: 'San Francisco Cleantech HQ', lat: 37.7749, lon: -122.4194, color: 0x2ed9a3 },
      { name: 'Sydney Solar PV Field', lat: -33.8688, lon: 151.2093, color: 0xf5a623 },
    ];

    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    const nodeGroup = new THREE.Group();
    locations.forEach(loc => {
      const pos = latLonToVector3(loc.lat, loc.lon, 76);
      const nodeGeo = new THREE.SphereGeometry(2.5, 12, 12);
      const nodeMat = new THREE.MeshBasicMaterial({ color: loc.color });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.copy(pos);
      nodeGroup.add(nodeMesh);

      const ringGeo = new THREE.RingGeometry(3, 4.5, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: loc.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      nodeGroup.add(ringMesh);
    });
    globeGroup.add(nodeGroup);

    // 8. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isLightRef.current ? 1.2 : 0.4);
    scene.add(ambientLight);

    const mainDirLight = new THREE.DirectionalLight(
      isLightRef.current ? 0xfffbeb : 0x2ed9a3,
      isLightRef.current ? 2.4 : 1.8
    );
    mainDirLight.position.set(150, 120, 150);
    scene.add(mainDirLight);

    const auroraLight = new THREE.PointLight(0x8b7fff, isLightRef.current ? 0.2 : 2.0, 300);
    auroraLight.position.set(-120, -80, -100);
    scene.add(auroraLight);

    // Interactive Drag & Pointer Parallax Physics
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isMouseDown) {
        const deltaX = e.clientX - mouseX;
        const deltaY = e.clientY - mouseY;

        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;

        mouseX = e.clientX;
        mouseY = e.clientY;
      } else {
        // Subtle pointer tilt response relative to screen center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        pointerOffsetX = ((e.clientX - centerX) / centerX) * 0.15;
        pointerOffsetY = ((e.clientY - centerY) / centerY) * 0.15;
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    if (interactive) {
      container.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    let isVisible = true;
    const observer = new IntersectionObserver(
      entries => {
        isVisible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 }
    );
    observer.observe(container);

    // Target Color Containers for 700ms Smooth Lerp Transitions
    const targetEarthColor = new THREE.Color();
    const targetCoreColor = new THREE.Color();
    const targetCloudColor = new THREE.Color();
    const targetAtmosColor = new THREE.Color();
    const targetDirLightColor = new THREE.Color();

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const lightMode = isLightRef.current;

      // Update Target Values based on Theme
      targetEarthColor.setHex(lightMode ? 0x059669 : 0x121824);
      targetCoreColor.setHex(lightMode ? 0x1e3a8a : 0x0a0e14);
      targetCloudColor.setHex(lightMode ? 0xffffff : 0x3fb6e8);
      targetAtmosColor.setHex(lightMode ? 0x60a5fa : 0x2ed9a3);
      targetDirLightColor.setHex(lightMode ? 0xfffbeb : 0x2ed9a3);

      const targetCloudOpacity = lightMode ? 0.45 : 0.18;
      const targetAtmosOpacity = lightMode ? 0.28 : 0.12;
      const targetAmbientIntensity = lightMode ? 1.2 : 0.4;
      const targetDirLightIntensity = lightMode ? 2.4 : 1.8;
      const targetAuroraIntensity = lightMode ? 0.2 : 2.0;

      // Smooth 700ms Lerp Interpolation
      const lerpFactor = 0.08;
      earthMat.color.lerp(targetEarthColor, lerpFactor);
      coreMat.color.lerp(targetCoreColor, lerpFactor);
      cloudMat.color.lerp(targetCloudColor, lerpFactor);
      atmosMat.color.lerp(targetAtmosColor, lerpFactor);
      mainDirLight.color.lerp(targetDirLightColor, lerpFactor);

      cloudMat.opacity += (targetCloudOpacity - cloudMat.opacity) * lerpFactor;
      atmosMat.opacity += (targetAtmosOpacity - atmosMat.opacity) * lerpFactor;
      ambientLight.intensity += (targetAmbientIntensity - ambientLight.intensity) * lerpFactor;
      mainDirLight.intensity += (targetDirLightIntensity - mainDirLight.intensity) * lerpFactor;
      auroraLight.intensity += (targetAuroraIntensity - auroraLight.intensity) * lerpFactor;

      // Slow rotation when idle with subtle cursor tilt response
      if (!isMouseDown) {
        targetRotationY += 0.002;
        targetRotationX = Math.sin(Date.now() * 0.0004) * 0.08 + pointerOffsetY;
      }

      // Smooth damping interpolation
      globeGroup.rotation.y += (targetRotationY + pointerOffsetX - globeGroup.rotation.y) * 0.08;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08;

      cloudMesh.rotation.y -= 0.001;
      cloudMesh.rotation.x += 0.0005;

      particleSystem.rotation.y += 0.0015;

      camera.position.y = Math.sin(Date.now() * 0.0008) * 3;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      if (interactive) {
        container.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [interactive]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {showBadge && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] text-[#8891A3] font-data px-3 py-1 rounded-full bg-[#12161F]/90 border border-[#242B38] pointer-events-none flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2ED9A3] animate-ping" />
          Interactive Low-Poly Planet OS • Drag to rotate
        </div>
      )}
    </div>
  );
};
