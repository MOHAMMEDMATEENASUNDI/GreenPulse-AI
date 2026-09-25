/**
 * @license
 * GreenPulse AI — Layout Templates
 */

import React from 'react';
import { DashboardShell } from '../components/layout/dashboard-shell';

export const AppLayout: React.FC<{
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (path: string) => void;
}> = ({ children, activePath, onNavigate }) => {
  return (
    <DashboardShell activePath={activePath} onNavigate={onNavigate}>
      {children}
    </DashboardShell>
  );
};

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="min-h-screen bg-[#0A0E14] text-[#F4F6F8]">{children}</div>;
};
