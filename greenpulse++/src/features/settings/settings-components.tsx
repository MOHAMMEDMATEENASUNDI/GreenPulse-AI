/**
 * @license
 * GreenPulse AI — Settings Feature Components
 * Organization & Compliance settings + Team & Roles access control
 * Choreographed motion & hover micro-interactions
 *
 * Phase 7J: Real backend integration via GET/PATCH /api/v1/companies/me
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Building, Users, Check, Loader2, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { CompanyService, CompanyProfile, CompanyProfileUpdate } from '../../services/company-service';
import { cn } from '../../utils/utils';

type BrsrStatus = CompanyProfile['brsrStatus'];

const BRSR_OPTIONS: { value: BrsrStatus; label: string }[] = [
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'voluntary', label: 'Voluntary' },
  { value: 'in_scope', label: 'In Scope' },
  { value: 'exempt', label: 'Exempt' },
];

export const SettingsView: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'org' | 'team'>('org');

  // Company profile state from backend
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form fields — populated from backend
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [brsrStatus, setBrsrStatus] = useState<BrsrStatus>('voluntary');
  const [companyId, setCompanyId] = useState('');
  const [companyCreatedAt, setCompanyCreatedAt] = useState('');

  // Track original values for dirty detection
  const [originalValues, setOriginalValues] = useState<{ name: string; industry: string; brsrStatus: BrsrStatus }>({
    name: '',
    industry: '',
    brsrStatus: 'voluntary',
  });

  const isDirty =
    companyName !== originalValues.name ||
    industry !== originalValues.industry ||
    brsrStatus !== originalValues.brsrStatus;

  // Apply fetched profile data to local state
  const applyProfileData = useCallback((profile: CompanyProfile) => {
    setCompanyName(profile.name || '');
    setIndustry(profile.industry || '');
    setBrsrStatus(profile.brsrStatus || 'voluntary');
    setCompanyId(profile._id || '');
    setCompanyCreatedAt(profile.createdAt || '');
    setOriginalValues({
      name: profile.name || '',
      industry: profile.industry || '',
      brsrStatus: profile.brsrStatus || 'voluntary',
    });
  }, []);

  // Fetch company profile from backend
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const profile = await CompanyService.getProfile();
      applyProfileData(profile);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load company profile.';
      setLoadError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [applyProfileData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Save company profile via PATCH
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    const updates: CompanyProfileUpdate = {};
    if (companyName !== originalValues.name) updates.name = companyName;
    if (industry !== originalValues.industry) updates.industry = industry;
    if (brsrStatus !== originalValues.brsrStatus) updates.brsrStatus = brsrStatus;

    // If nothing changed, just flash success
    if (Object.keys(updates).length === 0) {
      setSaveSuccess(true);
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 1500);
      return;
    }

    try {
      const updated = await CompanyService.updateProfile(updates);
      applyProfileData(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);
    } catch (err: any) {
      const msg = err?.message || 'Failed to save changes. Please try again.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card variant="surface" className="p-6 max-w-3xl">
      {/* Minimal Tab Navigation */}
      <div className="flex items-center gap-6 border-b border-[#242B38] mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('org')}
          className={cn(
            'pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 cursor-pointer focus-visible:outline-none',
            activeTab === 'org'
              ? 'text-[#F4F6F8] font-semibold'
              : 'text-[#8891A3] hover:text-[#F4F6F8]'
          )}
        >
          <Building className={cn('w-4 h-4', activeTab === 'org' ? 'text-[#2ED9A3]' : 'text-[#8891A3]')} />
          <span>Organization & Compliance</span>
          {activeTab === 'org' && (
            <motion.div
              layoutId="settings-tab-active-indicator"
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ED9A3] rounded-full"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={cn(
            'pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 cursor-pointer focus-visible:outline-none',
            activeTab === 'team'
              ? 'text-[#F4F6F8] font-semibold'
              : 'text-[#8891A3] hover:text-[#F4F6F8]'
          )}
        >
          <Users className={cn('w-4 h-4', activeTab === 'team' ? 'text-[#2ED9A3]' : 'text-[#8891A3]')} />
          <span>Team & Roles</span>
          {activeTab === 'team' && (
            <motion.div
              layoutId="settings-tab-active-indicator"
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2ED9A3] rounded-full"
            />
          )}
        </button>
      </div>

      {/* Tab Content with Cross-Fade Transition */}
      <AnimatePresence mode="wait">
        {activeTab === 'org' ? (
          <motion.div
            key="tab-org"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 text-[#2ED9A3] animate-spin" />
                <span className="text-xs text-[#8891A3]">Loading company profile…</span>
              </div>
            )}

            {/* Error State */}
            {!isLoading && loadError && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-10 h-10 rounded-full bg-[#F0554C]/10 border border-[#F0554C]/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#F0554C]" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-semibold text-[#F4F6F8]">Unable to load company profile</p>
                  <p className="text-[11px] text-[#8891A3] max-w-xs">{loadError}</p>
                </div>
                <motion.button
                  whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.08)' }}
                  whileTap={reduceMotion ? {} : { scale: 0.97 }}
                  type="button"
                  onClick={fetchProfile}
                  className="h-8 px-4 text-xs font-semibold inline-flex items-center justify-center rounded-[6px] bg-[#171C27] border border-[#242B38] text-[#F4F6F8] hover:bg-[#1C2230] hover:border-[#8891A3] transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
                </motion.button>
              </div>
            )}

            {/* Company Profile Form */}
            {!isLoading && !loadError && (
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <Input
                  label="Company Name"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="focus:ring-2 focus:ring-[#2ED9A3]/20 focus:border-[#2ED9A3] transition-all duration-200"
                />
                <Input
                  label="Industry"
                  value={industry}
                  onChange={e => setIndustry(e.target.value)}
                  className="focus:ring-2 focus:ring-[#2ED9A3]/20 focus:border-[#2ED9A3] transition-all duration-200"
                />

                {/* BRSR Compliance Status Dropdown */}
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-xs font-medium uppercase tracking-wider text-[#8891A3]">
                    BRSR Compliance Status
                  </label>
                  <select
                    value={brsrStatus}
                    onChange={e => setBrsrStatus(e.target.value as BrsrStatus)}
                    className="h-10 px-3.5 rounded-[6px] bg-[#12161F] border border-[#242B38] text-[#F4F6F8] text-sm focus:outline-none focus:border-[#2ED9A3] focus:ring-2 focus:ring-[#2ED9A3]/20 transition-all cursor-pointer"
                  >
                    {BRSR_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Metadata row */}
                {companyId && (
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-[10px] text-[#5B6472]">
                    <span className="font-data">ID: {companyId}</span>
                    {companyCreatedAt && (
                      <span className="font-data">
                        Registered: {new Date(companyCreatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-[#242B38] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-[#F4F6F8] block">API & ERP Integration Pipeline</span>
                    <span className="text-[10px] text-[#8891A3]">Connect SAP S/4HANA or IoT Energy Meters</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="emerald">CSV Upload: Ready</Badge>
                    <Badge variant="neutral">SAP / IoT Integration: Coming Soon</Badge>
                  </div>
                </div>

                {/* Save Error Feedback */}
                <AnimatePresence>
                  {saveError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2 p-3 rounded-[6px] bg-[#F0554C]/8 border border-[#F0554C]/30"
                    >
                      <AlertTriangle className="w-4 h-4 text-[#F0554C] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#F0554C]">Save failed</p>
                        <p className="text-[11px] text-[#8891A3]">{saveError}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2 flex items-center gap-3">
                  <motion.button
                    whileHover={reduceMotion ? {} : { y: -1, filter: 'brightness(1.08)' }}
                    whileTap={reduceMotion ? {} : { scale: 0.97 }}
                    transition={{ duration: 0.14 }}
                    type="submit"
                    disabled={isSaving}
                    className={cn(
                      'h-9 min-w-[190px] px-4 text-xs font-semibold inline-flex items-center justify-center rounded-[6px] shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400',
                      isSaving
                        ? 'bg-[#2ED9A3]/60 text-[#0A0E14]/60 cursor-wait'
                        : 'bg-[#2ED9A3] text-[#0A0E14] hover:bg-[#25C492]'
                    )}
                  >
                    {isSaving ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
                      </span>
                    ) : saveSuccess ? (
                      <motion.span
                        initial={reduceMotion ? { opacity: 1 } : { scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center"
                      >
                        <Check className="w-4 h-4 mr-1.5 text-[#0A0E14]" /> Configuration Saved
                      </motion.span>
                    ) : (
                      <span>Save Configuration</span>
                    )}
                  </motion.button>

                  {isDirty && !isSaving && !saveSuccess && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[10px] text-[#8891A3] italic"
                    >
                      Unsaved changes
                    </motion.span>
                  )}
                </div>
              </form>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="tab-team"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5"
          >
            {/* Team Management — Not Yet Available */}
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-[#3FB6E8]/10 border border-[#3FB6E8]/25 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#3FB6E8]" />
              </div>
              <div className="text-center space-y-1.5 max-w-sm">
                <p className="text-sm font-semibold text-[#F4F6F8]">Team Management</p>
                <p className="text-xs text-[#8891A3] leading-relaxed">
                  Team administration will be available in a future release. You'll be able to invite team members, assign roles, and manage facility-level access controls.
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#171C27] border border-[#242B38]">
                <Info className="w-3 h-3 text-[#3FB6E8]" />
                <span className="text-[10px] text-[#8891A3] font-medium">Coming Soon</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
