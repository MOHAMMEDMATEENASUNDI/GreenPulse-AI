/**
 * @license
 * GreenPulse AI — Premium Enterprise Onboarding Wizard ("Mission Initialization")
 * Fully preserved 4-step architecture with enterprise glass visual system,
 * directional MotionView horizontal depth transitions, specular "thunder" energy conduit buttons,
 * diagnostic telemetry pipeline, and cinematic Green Score reveal.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ScoreGaugeArc } from '../../components/ui/score-gauge-arc';
import { JellyBlobMascot, JellyBlobMood } from '../../components/guardian/greenpulse-mascot';
import {
  Building2,
  Upload,
  Target,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Check,
  Zap,
  Leaf,
  ShieldCheck,
  Sliders,
  Cpu,
  Award,
  Loader2,
  Lock,
  Layers,
  AlertCircle,
  Download,
  HelpCircle,
} from 'lucide-react';
import { uploadService, UploadJob, validateUploadFile } from '../../services/upload-service';

export interface OnboardingWizardProps {
  onComplete: () => void;
}

// Directional MotionView-inspired horizontal transition variants
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 32 : -32,
    opacity: 0,
    scale: 0.98,
    filter: 'blur(2px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -32 : 32,
    opacity: 0,
    scale: 0.98,
    filter: 'blur(2px)',
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

// Staggered child reveals for crisp enterprise cadence
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// Premium Onboarding Primary Action Button with specular "thunder" energy conduit effect
interface PrimaryButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  id?: string;
}

const OnboardingPrimaryButton: React.FC<PrimaryButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  children,
  className = '',
  icon,
  id,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      id={id}
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      whileHover={!disabled && !loading ? { y: -2 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`relative group overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 rounded-[10px] text-xs sm:text-sm font-semibold tracking-wide transition-all select-none ${
        disabled
          ? 'bg-[#171C27] text-[#8891A3] border border-[#242B38] cursor-not-allowed opacity-60'
          : 'bg-gradient-to-r from-[#2ED9A3] via-[#26c793] to-[#20aa7d] text-[#0A0E14] shadow-[0_0_20px_rgba(46,217,163,0.22)] hover:shadow-[0_0_30px_rgba(46,217,163,0.38)] border border-[#2ED9A3]/50 active:shadow-[0_0_15px_rgba(46,217,163,0.18)] cursor-pointer'
      } ${className}`}
    >
      {/* Specular Energy Sweep Conduit */}
      {!disabled && (
        <motion.div
          initial={{ x: '-150%', opacity: 0 }}
          animate={isHovered ? { x: '250%', opacity: [0, 0.45, 0] } : { x: '-150%', opacity: 0 }}
          transition={{ duration: 0.65, ease: 'easeInOut' }}
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] pointer-events-none"
        />
      )}

      {/* Luminous Top Ridge Accent */}
      {!disabled && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-80" />
      )}

      {/* Click Energy Conduit Pulse */}
      <AnimatePresence>
        {isPressed && !disabled && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-[#3FB6E8]/30 rounded-[10px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <span className="relative z-10 flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : null}
        {children}
        {!loading && icon ? (
          <motion.span
            animate={isHovered ? { x: 3 } : { x: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="inline-flex items-center"
          >
            {icon}
          </motion.span>
        ) : null}
      </span>
    </motion.button>
  );
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState<number>(1);
  const [subStep4, setSubStep4] = useState<'processing' | 'revealed'>('processing');

  // Step 1: Profile State
  const [companyName, setCompanyName] = useState('Apex Manufacturing Ltd.');
  const [sector, setSector] = useState('Automotive & Heavy Engineering');
  const [headcount, setHeadcount] = useState('1,250 Employees');
  const [facilityLocation, setFacilityLocation] = useState('Pune Chakan Hub, Maharashtra (West Grid)');
  const [scopesDeclared, setScopesDeclared] = useState<{ scope1: boolean; scope2: boolean; scope3: boolean }>({
    scope1: true,
    scope2: true,
    scope3: true,
  });

  // Step 2: Telemetry Data & Upload State
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadJob, setUploadJob] = useState<UploadJob | null>(null);
  const [fileName, setFileName] = useState('');
  const [recordCount, setRecordCount] = useState<number>(0);
  const [csvDataRows, setCsvDataRows] = useState<
    Array<{ timestamp: string; facility: string; meterId: string; kwh: number; fuelLiters: number; wasteKg: number }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3: Target State
  const [targetYear, setTargetYear] = useState('2035');
  const [reductionTargetPct, setReductionTargetPct] = useState(45);
  const [sebiPrinciplesChecked, setSebiPrinciplesChecked] = useState(true);

  // Step 4: Processing State & Diagnostic Stages
  const [processingStage, setProcessingStage] = useState(0);
  const [processingPct, setProcessingPct] = useState(0);
  const [animatedGreenScore, setAnimatedGreenScore] = useState(0);

  // Navigation handlers with explicit direction tracking
  const goToStep = (newStep: 1 | 2 | 3 | 4) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  // Guardian Mascot Mood mapping to match step context
  const getGuardianMood = (): JellyBlobMood => {
    if (uploadError) return 'sideEye';
    if (isUploading) return 'neutral';
    if (step === 1) return 'neutral'; // curious & attentive
    if (step === 2) return fileUploaded ? 'happy' : 'hmm'; // focused data observer
    if (step === 3) return 'happy'; // encouraging target partner
    if (step === 4) {
      return subStep4 === 'revealed' ? 'happy' : 'hmm';
    }
    return 'neutral';
  };

  // Real backend file upload processor
  const processRealFileUpload = async (file: File) => {
    if (isUploading) return;

    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format or size.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setFileUploaded(false);
    setFileName(file.name);

    try {
      // 1. Dispatch file to backend POST /api/v1/upload
      const uploadRes = await uploadService.uploadFile(file);
      const jobId = uploadRes.jobId;

      // 2. Poll job status until completed or failed
      const completedJob = await uploadService.pollJobUntilDone(
        jobId,
        (job) => {
          setUploadJob(job);
        }
      );

      // 3. Backend reported completed
      setUploadJob(completedJob);
      setFileUploaded(true);
      const count = completedJob.processedCount || completedJob.rowCount || 0;
      setRecordCount(count);

      // Render preview rows if CSV
      if (file.name.toLowerCase().endsWith('.csv')) {
        try {
          const text = await file.text();
          const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
          if (lines.length > 1) {
            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const deptIdx = header.findIndex(h => h.includes('dept'));
            const periodIdx = header.findIndex(h => h.includes('period') || h.includes('date') || h.includes('month'));
            const kwhIdx = header.findIndex(h => h.includes('kwh') || h.includes('energy') || h.includes('consumption'));

            const previewRows = lines.slice(1, 6).map((line, idx) => {
              const cols = line.split(',').map(c => c.trim());
              return {
                timestamp: periodIdx >= 0 ? cols[periodIdx] : '2026-07',
                facility: deptIdx >= 0 ? cols[deptIdx] : 'Press & Stamping Shop',
                meterId: `MTR-${101 + idx}`,
                kwh: kwhIdx >= 0 ? parseFloat(cols[kwhIdx]) || 0 : 45000,
                fuelLiters: 0,
                wasteKg: 0,
              };
            });
            setCsvDataRows(previewRows);
          }
        } catch {
          // Keep preview graceful
        }
      } else {
        // Excel file preview
        setCsvDataRows([
          { timestamp: '2026-08', facility: 'Press & Stamping Shop', meterId: 'XLSX-01', kwh: 45000, fuelLiters: 0, wasteKg: 0 },
          { timestamp: '2026-08', facility: 'Paint & Coating Facility', meterId: 'XLSX-02', kwh: 68400, fuelLiters: 0, wasteKg: 0 },
        ]);
      }
    } catch (err: any) {
      const msg = err?.message || 'Upload failed. Please check the file format and try again.';
      setUploadError(msg);
      setFileUploaded(false);
    } finally {
      setIsUploading(false);
    }
  };

  // Download real GreenPulse Data Template (.xlsx)
  const handleDownloadTemplate = () => {
    uploadService.downloadTemplate();
  };

  // Load sample dataset through real backend upload
  const handleLoadSampleCSV = async () => {
    if (isUploading) return;
    const sampleFile = uploadService.createSampleCsvFile();
    await processRealFileUpload(sampleFile);
  };

  // Drag and drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !isUploading) {
      processRealFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Step 4 Processing Pipeline simulation
  useEffect(() => {
    if (step !== 4) {
      setSubStep4('processing');
      setProcessingStage(0);
      setProcessingPct(0);
      setAnimatedGreenScore(0);
      return;
    }

    setSubStep4('processing');
    setProcessingStage(0);
    setProcessingPct(0);

    const interval = setInterval(() => {
      setProcessingPct(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setSubStep4('revealed');
          }, 350);
          return 100;
        }

        const nextPct = prev + 2;
        if (nextPct > 20 && nextPct <= 45) setProcessingStage(1);
        else if (nextPct > 45 && nextPct <= 70) setProcessingStage(2);
        else if (nextPct > 70 && nextPct <= 90) setProcessingStage(3);
        else if (nextPct > 90) setProcessingStage(4);

        return nextPct;
      });
    }, 38);

    return () => clearInterval(interval);
  }, [step]);

  // Smooth Count-Up for Green Score upon reveal
  useEffect(() => {
    if (step === 4 && subStep4 === 'revealed') {
      let current = 0;
      const targetScore = 84;
      const stepTime = 16;
      const duration = 1000;
      const increment = targetScore / (duration / stepTime);

      const timer = setInterval(() => {
        current += increment;
        if (current >= targetScore) {
          setAnimatedGreenScore(targetScore);
          clearInterval(timer);
        } else {
          setAnimatedGreenScore(Math.floor(current));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [step, subStep4]);

  const diagnosticStages = [
    { title: 'Telemetry Schema Validation', desc: 'Validating hourly power & fuel timestamps against CEA grid standards' },
    { title: 'Emission Factor Lookup', desc: 'Querying IPCC v20.0 & West Grid regional carbon intensity factors' },
    { title: 'Neural Anomaly Scanner', desc: 'Running baseline deviation models on chiller and compressor loads' },
    { title: 'SEBI BRSR Compliance Audit', desc: 'Synthesizing Principle 6 environmental KPI disclosure matrices' },
    { title: 'Green Score Synthesis', desc: 'Generating certified Enterprise Sustainability & Credit Rating' },
  ];

  const phaseNames = ['CONFIGURE', 'INGEST', 'TARGET', 'ACTIVATE'];

  return (
    <div className="relative min-h-screen py-10 px-4 sm:px-6 flex flex-col justify-center items-center overflow-hidden">
      {/* Refined Ambient Atmospheric Light Backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Soft emerald atmospheric aura */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-b from-[#2ED9A3]/10 via-[#3FB6E8]/5 to-transparent blur-[120px] rounded-full" />
        {/* Deep cyan/violet grounding aura */}
        <div className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-gradient-to-t from-[#8B7FFF]/8 via-[#2ED9A3]/5 to-transparent blur-[140px] rounded-full" />
        {/* Subtle technical background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#242B38_1px,transparent_1px)] [background-size:28px_28px] opacity-25" />
      </div>

      <div className="w-full max-w-3xl mx-auto space-y-6">
        {/* Wizard Mission Header & Progress System */}
        <div className="relative p-5 sm:p-6 rounded-[16px] bg-[#0d121c]/80 backdrop-blur-xl border border-[#242B38]/80 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
          {/* Top Row: Brand, Phase Badge & Interactive Guardian Companion */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-[#2ED9A3] to-[#3FB6E8] flex items-center justify-center shadow-[0_0_15px_rgba(46,217,163,0.3)]">
                <Leaf className="w-5 h-5 text-[#0A0E14]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-semibold text-[#F4F6F8] font-display tracking-tight">
                    GreenPulse Enterprise OS
                  </h1>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#171C27] text-[#3FB6E8] border border-[#3FB6E8]/30 font-semibold">
                    {phaseNames[step - 1]}
                  </span>
                </div>
                <p className="text-xs text-[#8891A3]">Mission Initialization & Telemetry Setup</p>
              </div>
            </div>

            {/* Guardian Mascot Floating Companion */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] font-mono text-[#8891A3] uppercase tracking-wider">AI Guardian</span>
                <span className="text-xs font-semibold text-[#2ED9A3]">
                  {step === 1 && 'Attentive'}
                  {step === 2 && 'Ingesting'}
                  {step === 3 && 'Encouraging'}
                  {step === 4 && (subStep4 === 'revealed' ? 'Verified!' : 'Analyzing')}
                </span>
              </div>
              <div className="w-12 h-12 relative flex items-center justify-center p-1 rounded-full bg-[#12161F] border border-[#2ED9A3]/30 shadow-[0_0_15px_rgba(46,217,163,0.15)]">
                <JellyBlobMascot
                  mood={getGuardianMood()}
                  happyEyes={subStep4 === 'revealed' ? 'star' : 'smile'}
                  className="w-10 h-10"
                />
              </div>
            </div>
          </div>

          {/* Mission Progress Indicator Sequence */}
          <div className="relative pt-2">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 relative z-10">
              {[
                { id: 1, number: '01', label: 'Company Profile', phase: 'CONFIGURE' },
                { id: 2, number: '02', label: 'Data Ingestion', phase: 'INGEST' },
                { id: 3, number: '03', label: 'Net-Zero Target', phase: 'TARGET' },
                { id: 4, number: '04', label: 'Score Generation', phase: 'ACTIVATE' },
              ].map(s => {
                const isCompleted = step > s.id;
                const isActive = step === s.id;

                return (
                  <div key={s.id} className="space-y-2">
                    {/* Track Line with Glowing Head */}
                    <div className="relative h-1.5 w-full bg-[#171C27] rounded-full overflow-hidden">
                      <motion.div
                        initial={false}
                        animate={{
                          width: isCompleted ? '100%' : isActive ? '100%' : '0%',
                          opacity: isCompleted || isActive ? 1 : 0.2,
                        }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          isCompleted
                            ? 'bg-[#2ED9A3]'
                            : isActive
                            ? 'bg-gradient-to-r from-[#2ED9A3] via-[#3FB6E8] to-[#2ED9A3] shadow-[0_0_10px_#2ED9A3]'
                            : 'bg-transparent'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono text-[10px] font-bold transition-colors ${
                          isActive
                            ? 'text-[#2ED9A3]'
                            : isCompleted
                            ? 'text-[#3FB6E8]'
                            : 'text-[#5A6478]'
                        }`}
                      >
                        {isCompleted ? '✓' : s.number}
                      </span>
                      <span
                        className={`text-[11px] font-medium truncate block transition-colors ${
                          isActive
                            ? 'text-[#F4F6F8] font-semibold'
                            : isCompleted
                            ? 'text-[#8891A3]'
                            : 'text-[#5A6478]'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Step Container with MotionView Directional Slide & Depth */}
        <div className="relative overflow-hidden min-h-[480px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {/* STEP 1: COMPANY PROFILE */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={reduceMotion ? {} : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-[16px] bg-[#0d121c]/80 backdrop-blur-xl border border-[#242B38] shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_50px_rgba(46,217,163,0.04)] border-t border-t-[#2ED9A3]/30 p-6 sm:p-8 space-y-6"
                >
                  {/* Step Header */}
                  <motion.div variants={itemVariants} className="border-b border-[#1A1F2A] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[8px] bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-[#2ED9A3]" />
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[#F4F6F8] font-display">
                        01 — Company Profile & Boundaries
                      </h2>
                    </div>
                    <p className="text-xs text-[#8891A3] mt-1.5 pl-9">
                      Establish organizational accounting boundaries for SEBI BRSR and GHG Protocol standards.
                    </p>
                  </motion.div>

                  {/* Form Inputs Grid */}
                  <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#F4F6F8] flex items-center justify-between">
                        <span>Company / Entity Name</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3]" />
                      </label>
                      <div className="relative group">
                        <input
                          id="company-name-input"
                          type="text"
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0A0E14] border border-[#242B38] text-xs text-[#F4F6F8] transition-all duration-200 focus:outline-none focus:border-[#2ED9A3] focus:shadow-[0_0_15px_rgba(46,217,163,0.15)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#F4F6F8] flex items-center justify-between">
                        <span>Industry Sector</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3]" />
                      </label>
                      <select
                        id="industry-sector-select"
                        value={sector}
                        onChange={e => setSector(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0A0E14] border border-[#242B38] text-xs text-[#F4F6F8] transition-all duration-200 focus:outline-none focus:border-[#2ED9A3] focus:shadow-[0_0_15px_rgba(46,217,163,0.15)]"
                      >
                        <option value="Automotive & Heavy Engineering">Automotive & Heavy Engineering</option>
                        <option value="Steel & Metallurgy">Steel & Metallurgy</option>
                        <option value="Datacenters & Cloud Infrastructure">Datacenters & Cloud Infrastructure</option>
                        <option value="Pharmaceuticals & Chemicals">Pharmaceuticals & Chemicals</option>
                        <option value="Textiles & Garment Exports">Textiles & Garment Exports</option>
                        <option value="FMCG & Food Processing">FMCG & Food Processing</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#F4F6F8] flex items-center justify-between">
                        <span>Enterprise Headcount</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3]" />
                      </label>
                      <input
                        id="headcount-input"
                        type="text"
                        value={headcount}
                        onChange={e => setHeadcount(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0A0E14] border border-[#242B38] text-xs text-[#F4F6F8] transition-all duration-200 focus:outline-none focus:border-[#2ED9A3] focus:shadow-[0_0_15px_rgba(46,217,163,0.15)]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#F4F6F8] flex items-center justify-between">
                        <span>Primary Facility Location</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2ED9A3]" />
                      </label>
                      <input
                        id="facility-location-input"
                        type="text"
                        value={facilityLocation}
                        onChange={e => setFacilityLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-[8px] bg-[#0A0E14] border border-[#242B38] text-xs text-[#F4F6F8] transition-all duration-200 focus:outline-none focus:border-[#2ED9A3] focus:shadow-[0_0_15px_rgba(46,217,163,0.15)]"
                      />
                    </div>
                  </motion.div>

                  {/* Scopes Boundary Selector */}
                  <motion.div variants={itemVariants} className="pt-2 border-t border-[#1A1F2A] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#F4F6F8] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#2ED9A3]" /> GHG Emissions Boundary Scope
                      </label>
                      <span className="text-[10px] text-[#8891A3] font-mono">SEBI Principle 6 Auditable</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'scope1', label: 'Scope 1 (Direct Fuels)', desc: 'Furnaces, Gensets, Fleet' },
                        { key: 'scope2', label: 'Scope 2 (Electricity)', desc: 'Grid Power, Substation' },
                        { key: 'scope3', label: 'Scope 3 (Value Chain)', desc: 'Suppliers, Logistics' },
                      ].map(sc => {
                        const isSelected = scopesDeclared[sc.key as keyof typeof scopesDeclared];
                        return (
                          <motion.button
                            id={`scope-toggle-${sc.key}`}
                            key={sc.key}
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              setScopesDeclared(prev => ({
                                ...prev,
                                [sc.key]: !prev[sc.key as keyof typeof prev],
                              }))
                            }
                            className={`p-3.5 rounded-[10px] border text-left transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#171C27] border-[#2ED9A3] shadow-[0_0_15px_rgba(46,217,163,0.12)]'
                                : 'bg-[#0A0E14] border-[#242B38] hover:border-[#2ED9A3]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-[#F4F6F8]">{sc.label}</span>
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-[#2ED9A3] text-[#0A0E14]'
                                    : 'bg-[#171C27] border border-[#242B38]'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                            <span className="text-[10px] text-[#8891A3] font-mono block">{sc.desc}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Primary Action Button */}
                  <motion.div variants={itemVariants} className="flex justify-end pt-2">
                    <OnboardingPrimaryButton
                      id="continue-to-step-2"
                      onClick={() => goToStep(2)}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Continue to Data Ingestion
                    </OnboardingPrimaryButton>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 2: DATA INTEGRATION & TELEMETRY */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={reduceMotion ? {} : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-[16px] bg-[#0d121c]/80 backdrop-blur-xl border border-[#242B38] shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_50px_rgba(46,217,163,0.04)] border-t border-t-[#3FB6E8]/30 p-6 sm:p-8 space-y-6"
                >
                  {/* Step Header */}
                  <motion.div
                    variants={itemVariants}
                    className="border-b border-[#1A1F2A] pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-[8px] bg-[#3FB6E8]/10 border border-[#3FB6E8]/30 flex items-center justify-center">
                          <Upload className="w-4 h-4 text-[#3FB6E8]" />
                        </div>
                        <h2 className="text-base sm:text-lg font-semibold text-[#F4F6F8] font-display">
                          02 — Upload Energy & Operations Telemetry
                        </h2>
                      </div>
                      <p className="text-xs text-[#8891A3] mt-1.5 pl-9">
                        Upload facility CSV/Excel logs or load our verified Pune manufacturing telemetry sample.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Download Template Button */}
                      <motion.button
                        id="quick-download-template-btn"
                        type="button"
                        whileHover={{ y: -1, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDownloadTemplate}
                        className="relative overflow-hidden group px-3 py-2 rounded-[8px] bg-[#171C27] hover:bg-[#1C2230] border border-[#3FB6E8]/40 hover:border-[#3FB6E8] text-xs font-semibold text-[#3FB6E8] transition-all flex items-center gap-1.5 shrink-0 shadow-[0_0_10px_rgba(63,182,232,0.1)] cursor-pointer"
                      >
                        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:translate-x-[300%] transition-transform duration-700 pointer-events-none" />
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Template</span>
                      </motion.button>

                      {/* Load Sample Data Button */}
                      <motion.button
                        id="load-sample-csv-btn"
                        type="button"
                        whileHover={{ y: -1, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLoadSampleCSV}
                        disabled={isUploading}
                        className="relative overflow-hidden group px-3.5 py-2 rounded-[8px] bg-[#171C27] hover:bg-[#1C2230] border border-[#2ED9A3]/40 hover:border-[#2ED9A3] text-xs font-semibold text-[#2ED9A3] transition-all flex items-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(46,217,163,0.1)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {/* Specular Sweep on Hover */}
                        <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:translate-x-[300%] transition-transform duration-700 pointer-events-none" />
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploading ? 'Ingesting Telemetry...' : 'Load Sample Dataset'}</span>
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Backend Error Alert Banner */}
                  {uploadError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg bg-[#F0554C]/10 border border-[#F0554C]/30 text-[#F0554C] text-xs flex items-start gap-2.5 text-left"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#F0554C] mt-0.5" />
                      <div>
                        <span className="font-semibold block">Upload Validation Error</span>
                        <span className="text-[11px] opacity-90 leading-relaxed block mt-0.5">{uploadError}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processRealFileUpload(file);
                      }
                      e.target.value = '';
                    }}
                  />

                  {/* Drag & Drop Energy Zone */}
                  <motion.div
                    variants={itemVariants}
                    onDragOver={e => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (!isUploading) fileInputRef.current?.click();
                    }}
                    className={`relative rounded-[12px] p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden border-2 border-dashed ${
                      fileUploaded
                        ? 'border-[#2ED9A3] bg-[#2ED9A3]/5 shadow-[0_0_25px_rgba(46,217,163,0.08)]'
                        : isDragOver
                        ? 'border-[#3FB6E8] bg-[#3FB6E8]/10 scale-[1.01]'
                        : isUploading
                        ? 'border-[#3FB6E8]/60 bg-[#12161F]/80'
                        : 'border-[#242B38] bg-[#0A0E14] hover:border-[#2ED9A3]/60 hover:bg-[#12161F]'
                    }`}
                  >
                    {/* Active Energy Pulse Along Border */}
                    {isDragOver && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.2, 0.6, 0.2] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="absolute inset-0 bg-gradient-to-r from-[#2ED9A3]/10 via-[#3FB6E8]/15 to-[#2ED9A3]/10 pointer-events-none"
                      />
                    )}

                    {isUploading ? (
                      <div className="space-y-3 py-2">
                        <div className="w-12 h-12 rounded-full bg-[#171C27] border border-[#3FB6E8]/40 mx-auto flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-[#3FB6E8] animate-spin" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#F4F6F8]">
                            Ingesting & Processing Telemetry...
                          </p>
                          <p className="text-xs text-[#8891A3] mt-1 font-mono">
                            {uploadJob?._id
                              ? `Backend Job #${uploadJob._id.slice(-6)} [Status: ${uploadJob.status}]`
                              : 'Dispatching to GreenPulse Ingestion Pipeline...'}
                          </p>
                        </div>
                        <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded bg-[#171C27] text-[#3FB6E8] border border-[#3FB6E8]/20 animate-pulse">
                          Validating against GHG Protocol & SEBI BRSR schemas...
                        </span>
                      </div>
                    ) : !fileUploaded ? (
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#171C27] border border-[#242B38] mx-auto flex items-center justify-center shadow-inner group-hover:border-[#2ED9A3]/50 transition-colors">
                          <Upload className="w-6 h-6 text-[#2ED9A3]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#F4F6F8]">
                            Drag & drop operational CSV, XLSX, or JSON telemetry logs
                          </p>
                          <p className="text-xs text-[#8891A3] mt-1">
                            Supports smart meter kWh, Genset diesel liters, HVAC logs, and scrap streams.
                          </p>
                        </div>
                        <span className="inline-block text-[11px] font-mono px-2.5 py-1 rounded bg-[#171C27] text-[#3FB6E8] border border-[#3FB6E8]/20">
                          Click to browse files or drop a file here
                        </span>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-2.5"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2ED9A3] to-[#3FB6E8] mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(46,217,163,0.3)]">
                          <Check className="w-5 h-5 text-[#0A0E14] stroke-[3]" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#2ED9A3] block font-mono">{fileName}</span>
                          <span className="text-xs text-[#8891A3] font-mono mt-0.5 block">
                            {recordCount > 0
                              ? `${recordCount} telemetry records validated & ingested into GreenPulse Telemetry Engine`
                              : 'Telemetry dataset successfully validated and processed'}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Ready-to-Fill Data Template Guidance & Action */}
                  <motion.div
                    variants={itemVariants}
                    className="p-4 rounded-[12px] bg-[#0A0E14] border border-[#242B38] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-[#2ED9A3]/30 transition-all duration-200"
                  >
                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F4F6F8]">
                        <HelpCircle className="w-3.5 h-3.5 text-[#3FB6E8]" />
                        <span>Not sure what to upload?</span>
                      </div>
                      <p className="text-[11px] text-[#8891A3] leading-relaxed max-w-xl">
                        Use our ready-to-fill Excel template so your data is entered in the correct format. Fill the highlighted columns and upload the completed file.
                      </p>
                    </div>

                    <motion.button
                      id="download-template-btn"
                      type="button"
                      whileHover={{ y: -1, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownloadTemplate}
                      className="relative overflow-hidden group px-4 py-2.5 rounded-[8px] bg-[#171C27] hover:bg-[#1C2230] border border-[#2ED9A3]/50 hover:border-[#2ED9A3] text-xs font-semibold text-[#2ED9A3] transition-all flex items-center gap-2 shrink-0 shadow-[0_0_12px_rgba(46,217,163,0.12)] cursor-pointer"
                    >
                      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:translate-x-[300%] transition-transform duration-700 pointer-events-none" />
                      <Download className="w-4 h-4 text-[#2ED9A3]" />
                      <span>Download GreenPulse Data Template</span>
                    </motion.button>
                  </motion.div>

                  {/* Parsed CSV Telemetry Preview Table */}
                  {fileUploaded && (
                    <motion.div
                      variants={itemVariants}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 pt-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#F4F6F8] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-[#2ED9A3]" /> Parsed Telemetry Stream (Sample Records)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2ED9A3]/10 text-[#2ED9A3] border border-[#2ED9A3]/30">
                          Valid Schema ✓
                        </span>
                      </div>

                      <div className="overflow-x-auto rounded-[10px] border border-[#1A1F2A] bg-[#0A0E14]">
                        <table className="w-full text-left text-xs text-[#8891A3] font-mono">
                          <thead className="bg-[#12161F] text-[#F4F6F8] text-[11px] border-b border-[#1A1F2A]">
                            <tr>
                              <th className="p-2.5">Timestamp</th>
                              <th className="p-2.5">Facility</th>
                              <th className="p-2.5">Meter ID</th>
                              <th className="p-2.5">Grid (kWh)</th>
                              <th className="p-2.5">Fuel (L)</th>
                              <th className="p-2.5">Scrap (kg)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1A1F2A]">
                            {csvDataRows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-[#12161F]/60 transition-colors">
                                <td className="p-2.5 text-[#F4F6F8]">{row.timestamp}</td>
                                <td className="p-2.5">{row.facility}</td>
                                <td className="p-2.5 text-[#3FB6E8]">{row.meterId}</td>
                                <td className="p-2.5 text-[#2ED9A3]">{row.kwh}</td>
                                <td className="p-2.5">{row.fuelLiters}</td>
                                <td className="p-2.5">{row.wasteKg}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <motion.div variants={itemVariants} className="flex items-center justify-between pt-2">
                    <button
                      id="back-to-step-1"
                      type="button"
                      onClick={() => goToStep(1)}
                      className="px-4 py-2.5 rounded-[8px] bg-[#171C27] hover:bg-[#1C2230] border border-[#242B38] text-xs font-semibold text-[#8891A3] hover:text-[#F4F6F8] transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <OnboardingPrimaryButton
                      id="continue-to-step-3"
                      disabled={!fileUploaded || isUploading}
                      onClick={() => goToStep(3)}
                      icon={<ArrowRight className="w-4 h-4" />}
                    >
                      Set Net-Zero Reduction Targets
                    </OnboardingPrimaryButton>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 3: NET-ZERO TARGET */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={reduceMotion ? {} : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="rounded-[16px] bg-[#0d121c]/80 backdrop-blur-xl border border-[#242B38] shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_50px_rgba(46,217,163,0.04)] border-t border-t-[#8B7FFF]/30 p-6 sm:p-8 space-y-6"
                >
                  {/* Step Header */}
                  <motion.div variants={itemVariants} className="border-b border-[#1A1F2A] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-[8px] bg-[#8B7FFF]/10 border border-[#8B7FFF]/30 flex items-center justify-center">
                        <Target className="w-4 h-4 text-[#8B7FFF]" />
                      </div>
                      <h2 className="text-base sm:text-lg font-semibold text-[#F4F6F8] font-display">
                        03 — Net-Zero & BRSR Reduction Targets
                      </h2>
                    </div>
                    <p className="text-xs text-[#8891A3] mt-1.5 pl-9">
                      Define enterprise carbon intensity milestones aligned with SBTi and SEBI BRSR Principle 6.
                    </p>
                  </motion.div>

                  {/* Net-Zero Target Year Buttons */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-xs font-semibold text-[#F4F6F8] block">Target Net-Zero Year</label>
                    <div className="grid grid-cols-4 gap-3">
                      {['2030', '2035', '2040', '2050'].map(yr => {
                        const isSelected = targetYear === yr;
                        return (
                          <motion.button
                            id={`target-year-${yr}`}
                            key={yr}
                            type="button"
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTargetYear(yr)}
                            className={`p-3.5 rounded-[10px] border font-mono text-sm font-bold transition-all duration-200 ${
                              isSelected
                                ? 'bg-[#171C27] border-[#8B7FFF] text-[#8B7FFF] shadow-[0_0_15px_rgba(139,127,255,0.2)]'
                                : 'bg-[#0A0E14] border-[#242B38] text-[#8891A3] hover:text-[#F4F6F8] hover:border-[#8B7FFF]/40'
                            }`}
                          >
                            {yr}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Reduction Slider */}
                  <motion.div
                    variants={itemVariants}
                    className="p-4 rounded-[12px] bg-[#0A0E14] border border-[#242B38] space-y-3 shadow-inner"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#F4F6F8] flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#2ED9A3]" /> Carbon Intensity Reduction Trajectory
                      </span>
                      <span className="font-mono text-[#2ED9A3] font-bold text-sm bg-[#2ED9A3]/10 px-2 py-0.5 rounded border border-[#2ED9A3]/30">
                        {reductionTargetPct}% Reduction
                      </span>
                    </div>

                    <input
                      id="reduction-slider"
                      type="range"
                      min="20"
                      max="100"
                      step="5"
                      value={reductionTargetPct}
                      onChange={e => setReductionTargetPct(Number(e.target.value))}
                      className="w-full h-2 bg-[#171C27] rounded-lg appearance-none cursor-pointer accent-[#2ED9A3]"
                    />

                    <div className="flex justify-between text-[10px] text-[#8891A3] font-mono">
                      <span>20% (Baseline)</span>
                      <span className="text-[#2ED9A3] font-semibold">45% (SBTi Recommended)</span>
                      <span>100% (Absolute Zero)</span>
                    </div>
                  </motion.div>

                  {/* SEBI Compliance Switch */}
                  <motion.div
                    variants={itemVariants}
                    className="p-4 rounded-[12px] bg-[#0A0E14] border border-[#242B38] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[8px] bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#F4F6F8] block">
                          Automated SEBI BRSR Principle 6 Disclosures
                        </span>
                        <span className="text-[10px] text-[#8891A3] block">
                          Auto-generate mandatory environmental KPI tables for top 1000 listed entities.
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="sebi-compliance-toggle"
                        type="checkbox"
                        checked={sebiPrinciplesChecked}
                        onChange={e => setSebiPrinciplesChecked(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-[#171C27] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2ED9A3]" />
                    </label>
                  </motion.div>

                  {/* Navigation Buttons */}
                  <motion.div variants={itemVariants} className="flex items-center justify-between pt-2">
                    <button
                      id="back-to-step-2"
                      type="button"
                      onClick={() => goToStep(2)}
                      className="px-4 py-2.5 rounded-[8px] bg-[#171C27] hover:bg-[#1C2230] border border-[#242B38] text-xs font-semibold text-[#8891A3] hover:text-[#F4F6F8] transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <OnboardingPrimaryButton
                      id="compute-first-green-score-btn"
                      onClick={() => goToStep(4)}
                      icon={<Sparkles className="w-4 h-4" />}
                    >
                      Compute Enterprise Green Score
                    </OnboardingPrimaryButton>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}

            {/* STEP 4: SCORE GENERATION & CINEMATIC GREEN SCORE REVEAL */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={reduceMotion ? {} : stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                {subStep4 === 'processing' ? (
                  /* Processing Sequence Stage */
                  <div className="rounded-[16px] bg-[#0d121c]/90 backdrop-blur-xl border border-[#242B38] shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(46,217,163,0.06)] p-6 sm:p-8 space-y-6 text-center">
                    <div className="relative w-16 h-16 mx-auto">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#2ED9A3] via-[#3FB6E8] to-[#8B7FFF] p-1 flex items-center justify-center shadow-[0_0_25px_rgba(46,217,163,0.3)]"
                      >
                        <div className="w-full h-full bg-[#0A0E14] rounded-full flex items-center justify-center">
                          <Cpu className="w-7 h-7 text-[#2ED9A3]" />
                        </div>
                      </motion.div>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-semibold text-[#2ED9A3] uppercase tracking-widest block mb-1">
                        NEURAL TELEMETRY SYNTHESIS ENGINE
                      </span>
                      <h2 className="text-lg sm:text-xl font-semibold text-[#F4F6F8] font-display">
                        Evaluating Enterprise Telemetry
                      </h2>
                      <p className="text-xs text-[#8891A3] mt-1 font-mono">
                        {diagnosticStages[processingStage]?.title || 'Synthesizing verified score...'}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#0A0E14] rounded-full h-2.5 overflow-hidden border border-[#242B38] p-0.5 max-w-md mx-auto">
                      <div
                        className="h-full bg-gradient-to-r from-[#2ED9A3] via-[#3FB6E8] to-[#8B7FFF] rounded-full transition-all duration-100 ease-out"
                        style={{ width: `${processingPct}%` }}
                      />
                    </div>

                    <span className="text-xs font-mono font-bold text-[#2ED9A3] block">
                      {processingPct}% Processing Complete
                    </span>

                    {/* Diagnostic Pipeline Stages */}
                    <div className="space-y-2 pt-2 text-left max-w-lg mx-auto">
                      {diagnosticStages.map((stg, idx) => {
                        const isDone = processingStage > idx;
                        const isCurrent = processingStage === idx;

                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-[8px] border transition-all duration-200 flex items-center justify-between ${
                              isDone
                                ? 'bg-[#12161F] border-[#2ED9A3]/30 text-[#F4F6F8]'
                                : isCurrent
                                ? 'bg-[#171C27] border-[#3FB6E8] text-[#F4F6F8] shadow-[0_0_15px_rgba(63,182,232,0.1)]'
                                : 'bg-[#0A0E14] border-[#1A1F2A] text-[#5A6478]'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold block">{stg.title}</span>
                              <span className="text-[10px] text-[#8891A3] font-mono block">{stg.desc}</span>
                            </div>

                            <div className="shrink-0 pl-2">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-[#2ED9A3]" />
                              ) : isCurrent ? (
                                <Loader2 className="w-4 h-4 text-[#3FB6E8] animate-spin" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-[#242B38]" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Green Score Reveal Climax */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-[16px] bg-[#0d121c]/90 backdrop-blur-xl border border-[#2ED9A3]/40 shadow-[0_15px_50px_rgba(0,0,0,0.6),0_0_60px_rgba(46,217,163,0.12)] p-6 sm:p-8 space-y-7 text-center"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12161F] border border-[#2ED9A3]/30 text-xs font-mono text-[#2ED9A3]">
                      <Award className="w-3.5 h-3.5 text-[#2ED9A3]" />
                      SEBI BRSR Principle 6 & GHGP Audit Complete
                    </div>

                    {/* Animated Score Gauge Arc with Count-Up */}
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ScoreGaugeArc score={animatedGreenScore} size="hero" />
                      <Badge variant="emerald" className="mt-2 text-xs font-mono">
                        Tier 1 Grade A Enterprise Rating
                      </Badge>
                    </div>

                    {/* Scope Breakdown Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3.5 rounded-[10px] bg-[#0A0E14] border border-[#242B38]">
                        <span className="text-[10px] text-[#8891A3] uppercase font-mono block">Scope 1 (Direct)</span>
                        <span className="font-mono text-base font-bold text-[#F4F6F8]">184.2 t CO₂e</span>
                      </div>

                      <div className="p-3.5 rounded-[10px] bg-[#0A0E14] border border-[#242B38]">
                        <span className="text-[10px] text-[#8891A3] uppercase font-mono block">Scope 2 (Grid Power)</span>
                        <span className="font-mono text-base font-bold text-[#2ED9A3]">340.8 t CO₂e</span>
                      </div>

                      <div className="p-3.5 rounded-[10px] bg-[#0A0E14] border border-[#242B38]">
                        <span className="text-[10px] text-[#8891A3] uppercase font-mono block">Net-Zero Gap</span>
                        <span className="font-mono text-base font-bold text-[#8B7FFF]">Target 2035 On-Track</span>
                      </div>
                    </div>

                    {/* Generated AI Optimization Insight */}
                    <div className="p-4 rounded-[10px] bg-[#12161F] border border-[#242B38] text-left flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-[#2ED9A3] shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <span className="font-semibold text-[#F4F6F8] block">AI Optimization Insight</span>
                        <p className="text-[#8891A3] leading-relaxed">
                          Shifting 30% of Floor 3 Chiller load to off-peak solar hours will boost your Green Score from 84 to 92 and save ₹1,25,000 monthly.
                        </p>
                      </div>
                    </div>

                    {/* Climax CTA: Enter Mission Control */}
                    <OnboardingPrimaryButton
                      id="enter-mission-control-btn"
                      onClick={onComplete}
                      className="w-full h-12 text-sm font-semibold"
                      icon={<ArrowRight className="w-4 h-4 ml-1" />}
                    >
                      Enter GreenPulse Mission Control
                    </OnboardingPrimaryButton>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
