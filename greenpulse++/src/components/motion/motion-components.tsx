/**
 * @license
 * GreenPulse AI — Motion Wrappers, Spatial Effect Containers & Kinetic Physics
 */

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { cn } from '../../utils/utils';

export interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  showGrid?: boolean;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ children, className, showGrid = true }) => {
  return (
    <div className={cn('relative overflow-hidden bg-[#0A0E14]', className)}>
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute -top-[20%] -left-[10%] w-[65%] h-[65%] rounded-full bg-[#2ED9A3] blur-[140px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[55%] h-[55%] rounded-full bg-[#3FB6E8] blur-[150px] animate-pulse delay-1000" />
        <div className="absolute -bottom-[20%] left-[15%] w-[60%] h-[60%] rounded-full bg-[#8B7FFF] blur-[140px] animate-pulse delay-500" />
      </div>

      {showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03] light:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #F4F6F8 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
};

export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}> = ({ children, delay = 0, className, direction = 'up' }) => {
  const reduce = useReducedMotion();

  const getInitial = () => {
    if (reduce) return { opacity: 0 };
    switch (direction) {
      case 'up': return { opacity: 0, y: 16 };
      case 'down': return { opacity: 0, y: -16 };
      case 'left': return { opacity: 0, x: 16 };
      case 'right': return { opacity: 0, x: -16 };
      case 'none': return { opacity: 0 };
    }
  };

  const getAnimate = () => {
    if (reduce) return { opacity: 1 };
    switch (direction) {
      case 'up': case 'down': return { opacity: 1, y: 0 };
      case 'left': case 'right': return { opacity: 1, x: 0 };
      case 'none': return { opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      animate={getAnimate()}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedCardFloat: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ScrollReveal: Cinematic scroll-triggered entrance with custom cubic-bezier curves
 */
export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale';
  distance?: number;
  className?: string;
  once?: boolean;
}> = ({ children, delay = 0, direction = 'up', distance = 24, className, once = true }) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: distance };
      case 'down': return { opacity: 0, y: -distance };
      case 'left': return { opacity: 0, x: distance };
      case 'right': return { opacity: 0, x: -distance };
      case 'scale': return { opacity: 0, scale: 0.94 };
    }
  };

  const getTarget = () => {
    switch (direction) {
      case 'up': case 'down': return { opacity: 1, y: 0 };
      case 'left': case 'right': return { opacity: 1, x: 0 };
      case 'scale': return { opacity: 1, scale: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitial()}
      whileInView={getTarget()}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * KineticHeading: Word-by-word kinetic typography reveal for oversized Apple/Vercel headlines
 */
export const KineticHeading: React.FC<{
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span';
  delay?: number;
}> = ({ children, className, as = 'h1', delay = 0 }) => {
  const reduce = useReducedMotion();
  const words = children.split(' ');

  const Component = motion[as] as typeof motion.h1;

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.04,
            delayChildren: delay,
          },
        },
      }}
      className={cn('inline-flex flex-wrap gap-x-[0.28em] gap-y-1', className)}
    >
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          variants={{
            hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
            },
          }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
};

/**
 * TiltCard: Interactive 3D tilt with cursor-following radial spotlight glow
 */
export const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glowColor?: string;
  onClick?: () => void;
}> = ({ children, className, maxTilt = 8, glowColor = 'rgba(46, 217, 163, 0.15)', onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 300,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 300,
    damping: 25,
  });

  const [mousePos, setMousePos] = useState({ px: 0, py: 0, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || reduce) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
    setMousePos({ px: mouseX, py: mouseY, opacity: 1 });
  };

  const handleMouseLeave = () => {
    if (reduce) return;
    x.set(0);
    y.set(0);
    setMousePos((prev) => ({ ...prev, opacity: 0 }));
  };

  if (reduce) {
    return (
      <div ref={cardRef} onClick={onClick} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={cn('relative overflow-hidden group cursor-pointer select-none', className)}
    >
      {/* Dynamic Cursor Spotlight Overlay */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
        style={{
          opacity: mousePos.opacity,
          background: `radial-gradient(400px circle at ${mousePos.px}px ${mousePos.py}px, ${glowColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-20 h-full">{children}</div>
    </motion.div>
  );
};

/**
 * LuminousTechGrid: Mission control background with subtle illuminated grid & laser pulse line
 */
export const LuminousTechGrid: React.FC<{ className?: string }> = ({ className }) => {
  const reduce = useReducedMotion();

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      <div
        className="absolute inset-0 opacity-[0.04] light:opacity-[0.06]"
        style={{
          backgroundImage: `linear-gradient(to right, #2ED9A3 1px, transparent 1px), linear-gradient(to bottom, #2ED9A3 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
      {!reduce && (
        <motion.div
          animate={{
            y: ['0%', '100%'],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-[#2ED9A3]/10 to-transparent pointer-events-none opacity-40"
        />
      )}
    </div>
  );
};

/**
 * StaggerContainer & StaggerItem: Orchestrated staggered cascades
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  delay?: number;
  staggerDelay?: number;
  className?: string;
}> = ({ children, delay = 0, staggerDelay = 0.08, className }) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * SpecularLightSweep: Adds a diagonal light sheen across cards
 */
export const SpecularLightSweep: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('glass-reflection', className)} />;
};
