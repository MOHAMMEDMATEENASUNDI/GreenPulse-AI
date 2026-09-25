/**
 * @license
 * GreenPulse AI — Award-Winning Motion Primitives
 * Animated Counters, Magnetic Buttons, and Skeleton Loaders.
 */

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { cn } from '../../utils/utils';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const displayValue = useTransform(spring, (latest) =>
    latest.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  const [currentText, setCurrentText] = useState('0');

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = displayValue.on('change', (latest) => {
      setCurrentText(latest);
    });
    return () => unsubscribe();
  }, [displayValue]);

  return (
    <span className={cn('font-data font-bold text-[#F4F6F8]', className)}>
      {prefix}
      {currentText}
      {suffix}
    </span>
  );
};

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={cn('skeleton-shimmer rounded-[8px]', className)} />;
};

export const MotionCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}> = ({ children, className, delay = 0, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn('glass-reflection transition-all duration-300', className)}
    >
      {children}
    </motion.div>
  );
};
