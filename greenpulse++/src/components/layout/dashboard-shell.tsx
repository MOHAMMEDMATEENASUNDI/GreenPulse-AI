/**
 * @license
 * GreenPulse AI — Futuristic Mission Control Dashboard Shell
 * Top Nav, Collapsible Glassmorphism Sidebar, Persistent AI Copilot Panel, Live Feed Drawer & Command Palette.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore, useMetricsStore, useAuthStore } from '../../stores';
import { triggerGlassSweep } from '../../utils/glass-sweep';
import { ScoreGaugeArc } from '../ui/score-gauge-arc';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { cn } from '../../utils/utils';
import { LogoutConfirmationModal } from '../guardian/logout-confirmation-modal';
import {
  LayoutDashboard,
  Leaf,
  Zap,
  ShieldCheck,
  Trash2,
  Bot,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Building2,
  Sparkles,
  X,
  Send,
  ArrowRight,
  Cpu,
  Command,
  Activity,
  Layers,
  Globe2,
  Check,
  Sliders,
  ExternalLink,
  Volume2,
  LogOut,
} from 'lucide-react';

export interface DashboardShellProps {
  children: React.ReactNode;
  activePath?: string;
  onNavigate?: (path: string) => void;
}

/* ==========================================================================
   1. TOP NAVIGATION BAR (MISSION CONTROL HEADER)
   ========================================================================== */
export const TopNav: React.FC<{
  onNavigate?: (path: string) => void;
  onOpenCommandPalette: () => void;
  onOpenLogoutModal: () => void;
}> = ({ onNavigate, onOpenCommandPalette, onOpenLogoutModal }) => {
  const { greenScore, totalEnergyKwh } = useMetricsStore();
  const {
    themeMode,
    toggleTheme,
  } = useUiStore();
  const { user, company } = useAuthStore();

  const [selectedFacility, setSelectedFacility] = useState('Pune Plant 1 (HQ)');
  const [isFacilityDropdownOpen, setIsFacilityDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Live simulated telemetry pulse
  const [liveKwhRate, setLiveKwhRate] = useState(1485);

  useEffect(() => {
    const timer = setInterval(() => {
      // Small realistic jitter +/- 8 kWh
      setLiveKwhRate(prev => Math.round(prev + (Math.random() * 16 - 8)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-[#0A0E14]/95 backdrop-blur-xl border-b border-[#1A1F2A] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xl select-none">
      {/* Brand, Facility Switcher, & Green Score Badge */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => onNavigate?.('/app/dashboard')}
        >
          <div className="w-8 h-8 rounded-[8px] aurora-gradient-bg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Leaf className="w-4 h-4 text-[#0A0E14]" />
          </div>
          <span className="font-display font-semibold text-base text-[#F4F6F8] tracking-tight hidden sm:inline">
            GreenPulse AI
          </span>
        </div>

        <div className="h-4 w-[1px] bg-[#1A1F2A]" />

        {/* Facility Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFacilityDropdownOpen(!isFacilityDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-[#12161F] border border-[#242B38] hover:border-[#2ED9A3]/50 text-xs font-medium text-[#F4F6F8] transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-[#2ED9A3]" />
            <span className="max-w-[120px] sm:max-w-none truncate">{selectedFacility}</span>
            <ChevronRight className={cn('w-3 h-3 text-[#8891A3] transition-transform', isFacilityDropdownOpen && 'rotate-90')} />
          </button>

          {isFacilityDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-56 rounded-[10px] bg-[#12161F] border border-[#242B38] shadow-2xl p-1.5 z-50 text-xs space-y-1">
              {[
                { name: 'Pune Plant 1 (HQ)', desc: 'West Grid • 1,250 Employees' },
                { name: 'Bengaluru R&D Hub', desc: 'South Grid • Solar Microgrid' },
                { name: 'Chennai Plant 2', desc: 'Coastal Grid • Casting Unit' },
                { name: 'All Global Facilities', desc: 'Aggregated Scope 1, 2, 3' },
              ].map(fac => (
                <button
                  key={fac.name}
                  onClick={() => {
                    setSelectedFacility(fac.name);
                    setIsFacilityDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-2.5 py-2 rounded-[6px] transition-colors',
                    selectedFacility === fac.name
                      ? 'bg-[#171C27] text-[#2ED9A3] font-semibold'
                      : 'text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#12161F]'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{fac.name}</span>
                    {selectedFacility === fac.name && <Check className="w-3 h-3 text-[#2ED9A3]" />}
                  </div>
                  <span className="text-[10px] text-[#8891A3] font-data block">{fac.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Grid Ticker (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0E14] border border-[#1A1F2A] text-[11px] font-data text-[#8891A3]">
          <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-pulse" />
          <span>Grid Intensity:</span>
          <span className="text-[#2ED9A3] font-semibold">542 g CO₂/kWh</span>
          <span className="text-[#1A1F2A]">|</span>
          <span>Load:</span>
          <span className="text-[#3FB6E8] font-semibold">{liveKwhRate} kW</span>
        </div>
      </div>

      {/* Global Actions: Search, Copilot, Feed, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Search Bar (`Cmd + K`) */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#12161F] border border-[#242B38] hover:border-[#2ED9A3]/50 text-xs text-[#8891A3] transition-all group"
        >
          <Search className="w-3.5 h-3.5 group-hover:text-[#2ED9A3] transition-colors" />
          <span className="hidden md:inline">Command Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#0A0E14] border border-[#242B38] text-[10px] font-data text-[#8891A3]">
            ⌘K
          </kbd>
        </button>

        {/* Persistent Green Score Gauge Trigger */}
        <button
          onClick={() => onNavigate?.('/app/dashboard')}
          className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#171C27] border border-[#242B38] hover:border-[#2ED9A3] transition-all cursor-pointer"
          title="View Green Score Breakdown"
        >
          <ScoreGaugeArc score={greenScore.score} size="compact" />
          <span className="text-xs font-semibold font-data text-[#2ED9A3] hidden sm:inline">
            {greenScore.score}/100
          </span>
        </button>

        <div className="h-4 w-[1px] bg-[#1A1F2A]" />

        {/* Persistent AI Copilot Button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-medium"
          onClick={() => onNavigate?.('/app/copilot')}
        >
          <Bot className="w-4 h-4 mr-1 text-[#8B7FFF]" />
          <span className="hidden sm:inline">AI Copilot</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#8B7FFF]/20 text-[#8B7FFF] text-[10px] font-data">
            Live
          </span>
        </Button>


        {/* User Profile Avatar & Dropdown */}
        <div className="relative pl-1 border-l border-[#1A1F2A]">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 group p-0.5 rounded-full hover:ring-2 hover:ring-[#2ED9A3]/50 transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full aurora-gradient-bg p-[1px]">
              <div className="w-full h-full rounded-full bg-[#0A0E14] flex items-center justify-center text-xs font-bold text-[#2ED9A3]">
                {user?.name?.charAt(0) || 'E'}
              </div>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 rounded-[12px] bg-[#12161F] border border-[#242B38] shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-[#1A1F2A]">
                <p className="font-semibold text-[#F4F6F8] truncate">{user?.name || 'Elena Rostova'}</p>
                <p className="text-[10px] text-[#8891A3] truncate">{user?.email || 'sustainability.lead@apex-mfg.com'}</p>
              </div>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onNavigate?.('/app/settings');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#171C27] transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5 text-[#2ED9A3]" /> Settings & Organization
              </button>
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onOpenLogoutModal();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[6px] text-[#F0554C] hover:bg-[#F0554C]/10 transition-colors font-medium text-left"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

/* ==========================================================================
   2. COLLAPSIBLE GLASSMORPHISM SIDEBAR
   ========================================================================== */
export const Sidebar: React.FC<{ activePath?: string; onNavigate?: (path: string) => void }> = ({
  activePath = '/app/dashboard',
  onNavigate,
}) => {
  const { isSidebarCollapsed, toggleSidebar } = useUiStore();

  const navItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard, badge: 'Live' },
    { label: 'Recommendations', path: '/app/recommendations', icon: Sparkles, badge: 'AI' },
    { label: 'Carbon Footprint', path: '/app/carbon', icon: Leaf, badge: 'SBTi' },
    { label: 'Energy Monitor', path: '/app/energy', icon: Zap, alert: true },
    { label: 'ESG Compliance', path: '/app/esg', icon: ShieldCheck, badge: 'BRSR' },
    { label: 'Waste Streams', path: '/app/waste', icon: Trash2 },
    { label: 'AI Copilot', path: '/app/copilot', icon: Bot, highlight: true },
    { label: 'Audit Reports', path: '/app/reports', icon: FileText },
    { label: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'bg-[#0A0E14]/95 backdrop-blur-xl border-r border-[#1A1F2A] transition-all duration-300 flex flex-col justify-between select-none z-20 shrink-0 shadow-xl',
        isSidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="p-3 space-y-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activePath === item.path;

          return (
            <button
              key={item.path}
              onClick={() => onNavigate?.(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all relative group',
                isActive
                  ? 'text-[#F4F6F8] bg-[#171C27] border border-[#242B38] shadow-md'
                  : 'text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#12161F]'
              )}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-[#2ED9A3]' : item.highlight ? 'text-[#8B7FFF]' : 'text-[#8891A3] group-hover:text-[#F4F6F8]'
                )}
              />

              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-data bg-[#12161F] text-[#2ED9A3] border border-[#2ED9A3]/30">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-2 h-2 rounded-full bg-[#F0554C] animate-pulse" />
                  )}
                </div>
              )}

              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#2ED9A3] rounded-r-full shadow-[0_0_8px_#2ED9A3]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer & Collapse Toggle */}
      <div className="p-3 border-t border-[#1A1F2A] space-y-2">
        {!isSidebarCollapsed && (
          <div className="p-3 rounded-[8px] aurora-gradient-bg/10 border border-[#2ED9A3]/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2ED9A3]">
              <Sparkles className="w-3.5 h-3.5 text-[#2ED9A3]" /> Mission Status
            </div>
            <p className="text-[10px] text-[#8891A3]">
              SEBI BRSR Principle 6 audit ready. 12.4 t CO₂e saved this week.
            </p>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-[8px] text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#171C27] transition-colors text-xs"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[#2ED9A3]" />
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#8891A3]">Collapse Menu</span>
              <ChevronLeft className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};




/* ==========================================================================
   5. COMMAND PALETTE SEARCH MODAL (`Cmd + K`)
   ========================================================================== */
export const CommandPaletteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const categories = [
    'All',
    'Dashboard',
    'Carbon',
    'Energy',
    'ESG',
    'Waste',
    'Copilot',
    'Reports',
    'Settings',
  ];

  const actions = [
    {
      label: 'Mission Control Dashboard',
      desc: 'Live ESG gauges, green score & carbon telemetry',
      path: '/app/dashboard',
      icon: LayoutDashboard,
      category: 'Dashboard',
      accent: '#2ED9A3',
      badge: 'Live',
    },
    {
      label: 'Carbon Footprint & SBTi Scopes',
      desc: 'Direct fuels (Scope 1), electricity (Scope 2), supply chain (Scope 3)',
      path: '/app/carbon',
      icon: Leaf,
      category: 'Carbon',
      accent: '#2ED9A3',
      badge: 'SBTi',
    },
    {
      label: 'Energy Monitor & Hourly Heatmaps',
      desc: 'Facility power load curves, anomaly detection & tariff shifts',
      path: '/app/energy',
      icon: Zap,
      category: 'Energy',
      accent: '#F5A623',
      badge: 'Alerts',
    },
    {
      label: 'SEBI BRSR Principle 6 ESG Compliance',
      desc: 'Statutory audit tables, sustainability governance checklists',
      path: '/app/esg',
      icon: ShieldCheck,
      category: 'ESG',
      accent: '#8B7FFF',
      badge: 'BRSR',
    },
    {
      label: 'Waste Streams & Circular Economy',
      desc: 'Hazardous waste mitigation, zero-landfill scrap diversion',
      path: '/app/waste',
      icon: Trash2,
      category: 'Waste',
      accent: '#F5A623',
      badge: 'Zero Landfill',
    },
    {
      label: 'Ask GreenPulse AI Copilot',
      desc: 'Autonomous conversational assistant for net-zero decisions',
      path: '/app/copilot',
      icon: Bot,
      category: 'Copilot',
      accent: '#8B7FFF',
      badge: 'AI Model',
    },
    {
      label: 'Audit-Ready Reports & Exports',
      desc: 'Download CEA-certified BRSR, CDP & GRI report packages',
      path: '/app/reports',
      icon: FileText,
      category: 'Reports',
      accent: '#2ED9A3',
      badge: 'PDF / CSV',
    },
    {
      label: 'Organization & Facility Settings',
      desc: 'Manage API tokens, plants, team permissions & integrations',
      path: '/app/settings',
      icon: Settings,
      category: 'Settings',
      accent: '#8891A3',
    },
  ];

  const filtered = actions.filter(a => {
    const matchesCategory =
      selectedCategory === 'All' || a.category === selectedCategory;
    const matchesQuery =
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.desc.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        onNavigate?.(filtered[selectedIndex].path);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-[#0A0E14]/85 backdrop-blur-xl z-50 flex items-start justify-center pt-14 sm:pt-20 p-4 select-none"
          onClick={onClose}
        >
          {/* Ambient Spotlight behind Modal */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] rounded-full bg-gradient-to-br from-[#2ED9A3]/15 via-[#3FB6E8]/10 to-[#8B7FFF]/15 blur-[120px] pointer-events-none -z-10" />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            className="max-w-2xl w-full bg-[#12161F]/95 border border-[#242B38] rounded-[16px] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(46,217,163,0.12)] overflow-hidden space-y-0 relative backdrop-blur-2xl"
          >
            {/* Top Multi-Color Accent Specular Bar */}
            <div className="h-[2px] w-full bg-gradient-to-r from-[#2ED9A3] via-[#3FB6E8] to-[#8B7FFF]" />

            {/* Glowing Search Input Header */}
            <div className="p-4 border-b border-[#1A1F2A] flex items-center gap-3 relative focus-within:border-[#2ED9A3]/70 transition-all">
              <div className="w-8 h-8 rounded-[8px] bg-[#171C27] border border-[#242B38] flex items-center justify-center text-[#2ED9A3] shrink-0">
                <Search className="w-4 h-4" />
              </div>

              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search commands, facilities, metrics, audits (e.g. Scope 1, BRSR)..."
                className="w-full bg-transparent text-sm text-[#F4F6F8] placeholder-[#8891A3]/60 focus:outline-none font-medium"
              />

              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-[#8891A3] hover:text-[#F4F6F8] p-1 text-xs"
                >
                  Clear
                </button>
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-2 py-0.5 rounded-[6px] bg-[#0A0E14] border border-[#242B38] text-[10px] font-data text-[#8891A3]">
                  ESC
                </kbd>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#171C27] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="px-4 py-2.5 bg-[#0A0E14]/60 border-b border-[#1A1F2A] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap',
                      isActive
                        ? 'bg-[#2ED9A3]/15 text-[#2ED9A3] border border-[#2ED9A3]/60 shadow-[0_0_12px_rgba(46,217,163,0.3)] font-semibold'
                        : 'bg-[#12161F] text-[#8891A3] border border-[#242B38] hover:text-[#F4F6F8] hover:border-[#8891A3]/40'
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Staggered Results List */}
            <div className="p-2.5 max-h-80 overflow-y-auto space-y-1.5">
              {filtered.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Info className="w-6 h-6 text-[#8891A3] mx-auto opacity-60" />
                  <p className="text-xs text-[#8891A3]">
                    No command matching "{query}" in category "{selectedCategory}".
                  </p>
                </div>
              ) : (
                filtered.map((a, idx) => {
                  const Icon = a.icon;
                  const isSelected = selectedIndex === idx;

                  return (
                    <motion.button
                      key={a.path}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.025 }}
                      onClick={() => {
                        onNavigate?.(a.path);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={cn(
                        'w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-[10px] text-xs transition-all text-left group relative',
                        isSelected
                          ? 'bg-[#171C27] border border-[#2ED9A3]/50 shadow-[0_0_18px_rgba(46,217,163,0.18)] text-[#F4F6F8]'
                          : 'bg-transparent border border-transparent hover:bg-[#12161F] text-[#8891A3] hover:text-[#F4F6F8]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 transition-transform duration-200',
                          isSelected ? 'scale-110' : 'group-hover:scale-105'
                        )}
                        style={{
                          backgroundColor: `${a.accent}15`,
                          color: a.accent,
                          border: `1px solid ${a.accent}30`,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-semibold truncate',
                              isSelected ? 'text-[#F4F6F8]' : 'text-[#D0D6E0]'
                            )}
                          >
                            {a.label}
                          </span>
                          {a.badge && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-data uppercase tracking-wider"
                              style={{
                                backgroundColor: `${a.accent}15`,
                                color: a.accent,
                                border: `1px solid ${a.accent}30`,
                              }}
                            >
                              {a.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#8891A3] truncate mt-0.5">
                          {a.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 shrink-0">
                        {isSelected && (
                          <span className="hidden sm:inline text-[10px] font-data text-[#2ED9A3] mr-1">
                            Press ↵
                          </span>
                        )}
                        <ArrowRight
                          className={cn(
                            'w-3.5 h-3.5 transition-transform',
                            isSelected && 'translate-x-0.5 text-[#2ED9A3]'
                          )}
                        />
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Footer Status Bar */}
            <div className="p-3 border-t border-[#1A1F2A] bg-[#0A0E14]/90 flex items-center justify-between text-[11px] text-[#8891A3] font-data">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#12161F] border border-[#242B38] text-[9px]">
                    ↑↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#12161F] border border-[#242B38] text-[9px]">
                    ↵
                  </kbd>{' '}
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-[#12161F] border border-[#242B38] text-[9px]">
                    ESC
                  </kbd>{' '}
                  Close
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#2ED9A3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2ED9A3] animate-pulse" />
                <span>Mission Control v2.4</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* ==========================================================================
   6. MAIN DASHBOARD SHELL CONTAINER
   ========================================================================== */
export const DashboardShell: React.FC<DashboardShellProps> = ({ children, activePath, onNavigate }) => {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { logout } = useAuthStore();

  // Keyboard shortcut listener for Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-[#F4F6F8] flex flex-col antialiased relative overflow-hidden select-none">
      {/* Top Header */}
      <TopNav
        onNavigate={onNavigate}
        onOpenCommandPalette={() => setIsCommandOpen(true)}
        onOpenLogoutModal={() => setIsLogoutOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Sidebar */}
        <Sidebar activePath={activePath} onNavigate={onNavigate} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0A0E14]/30 backdrop-blur-[2px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePath}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>


      </div>

      {/* Cmd + K Command Palette */}
      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={onNavigate}
      />

      {/* Logout Confirmation Modal with GreenPulse Guardian */}
      <LogoutConfirmationModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirmLogout={async () => {
          setIsLogoutOpen(false);
          await logout();
          onNavigate?.('/login');
        }}
      />
    </div>
  );
};
