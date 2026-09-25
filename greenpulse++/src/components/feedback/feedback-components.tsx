/**
 * @license
 * GreenPulse AI — Feedback Components
 */

import React from 'react';
import { cn } from '../../utils/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-[6px] bg-[#171C27] border border-[#242B38]/50',
        className
      )}
      {...props}
    />
  );
};

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center border border-dashed border-[#242B38] rounded-[10px] bg-[#12161F]/50', className)}>
      {icon && <div className="mb-4 text-[#2ED9A3]">{icon}</div>}
      <h3 className="text-base font-semibold text-[#F4F6F8] mb-1">{title}</h3>
      <p className="text-sm text-[#8891A3] max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 rounded-[10px] bg-[#12161F] border border-[#F0554C]/30 text-center">
            <h3 className="text-base font-semibold text-[#F0554C] mb-2">Component Failed to Render</h3>
            <p className="text-xs text-[#8891A3] mb-4">A rendering error occurred in this module.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-xs text-[#2ED9A3] underline hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
