/**
 * @license
 * GreenPulse AI — Glass Reflection Engine
 * Triggers a subtle GPU-accelerated specular light sweep across all architectural glass panels.
 */

let sweepTimeout: ReturnType<typeof setTimeout> | null = null;

export function triggerGlassSweep() {
  if (typeof document === 'undefined') return;

  // Pulse atmospheric aurora in tandem
  window.dispatchEvent(new Event('gp_aurora_pulse'));

  document.body.classList.remove('app-glass-sweep-active');

  // Trigger reflow to restart CSS keyframe animation smoothly
  void document.body.offsetWidth;

  document.body.classList.add('app-glass-sweep-active');

  if (sweepTimeout) clearTimeout(sweepTimeout);

  sweepTimeout = setTimeout(() => {
    document.body.classList.remove('app-glass-sweep-active');
  }, 1200);
}
