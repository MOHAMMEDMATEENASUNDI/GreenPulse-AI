/**
 * @license
 * GreenPulse AI — Application Page Views
 */

import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import {
  LandingNavbar,
  LandingHeroSection,
  LandingFeaturesGrid,
  LandingStandardsBadges,
  LandingCtaBanner,
  LandingFooter,
  IntelligenceMetricsSection,
  ScopeKineticSection,
  UnderstandActSection,
  LivingNetworkSection,
  HowItWorksCardsSection,
} from '../features/landing';
import { CarbonFlowDiagram } from '../features/landing/carbon-flow';
import { InteractiveDashboardPreview } from '../features/landing/dashboard-preview';
import { AuthSuite } from '../features/auth/auth-components';
import { OnboardingWizard } from '../features/onboarding/onboarding-components';

export const AuthPage: React.FC<{
  initialView?: 'login' | 'signup' | 'forgot-password';
  onNavigate?: (path: string) => void;
}> = ({ initialView = 'login', onNavigate }) => {
  return (
    <AuthSuite
      initialView={initialView}
      onAuthSuccess={(_email, authType) => {
        if (authType === 'signup') {
          onNavigate?.('/onboarding');
        } else {
          onNavigate?.('/app/dashboard');
        }
      }}
      onNavigateToLanding={() => onNavigate?.('/')}
    />
  );
};
import {
  LiveEsgGauges,
  GreenScoreWidget,
  FloatingAiRecommendationsQueue,
} from '../features/dashboard/dashboard-components';
import {
  ScopeToggleSegment,
  CarbonKpiCards,
  CarbonTrendsChart,
  FloatingCarbonAiRecommendations,
  DepartmentCarbonBreakdown,
  DepartmentDrillDownModal,
  CarbonActivityLog,
} from '../features/carbon/carbon-components';
import { CarbonService, BackendRecommendation } from '../services/carbon-service';
import { CarbonSummaryData, DepartmentCarbonDetail, EnergyActivityItem } from '../types/domain';
import { HourlyEnergyHeatmap, AnomalyAlertCard } from '../features/energy/energy-components';
import { PenaltyShield } from '../features/esg';
import { WasteStreamAnalytics } from '../features/waste/waste-components';
import { CopilotFullWorkspace } from '../features/copilot';
import { ReportsHistoryView } from '../features/reports/reports-components';
import { SettingsView } from '../features/settings/settings-components';
import { RecommendationsView } from '../features/recommendations/recommendations-components';
import { ScopeType } from '../types/enums';
import { useMetricsStore } from '../stores';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertTriangle, RefreshCw, Info } from 'lucide-react';


export const LandingPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const handleLaunch = () => onNavigate?.('/onboarding');
  const handleSignIn = () => onNavigate?.('/login');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="min-h-screen bg-[#0A0E14] text-[#F4F6F8] selection:bg-[#2ED9A3] selection:text-[#0A0E14] relative">
      {/* Global Scroll Progress Spine */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#2ED9A3] via-[#3FB6E8] to-[#8B7FFF] origin-left z-50 pointer-events-none"
        style={{ scaleX }}
      />

      {/* Subtle Central Ambient Lighting Spine across the page */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[3000px] bg-gradient-to-b from-[#2ED9A3]/[0.03] via-[#3FB6E8]/[0.02] via-[#8B7FFF]/[0.03] to-transparent blur-[140px]" />
      </div>

      <LandingNavbar onGetStarted={handleLaunch} onSignIn={handleSignIn} />
      <main className="relative z-10">
        <LandingHeroSection onGetStarted={handleLaunch} />
        <IntelligenceMetricsSection />
        <ScopeKineticSection />
        <UnderstandActSection />
        <LivingNetworkSection />
        <HowItWorksCardsSection />
        
        <section id="flow" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[#1A1F2A]">
          <CarbonFlowDiagram />
        </section>

        <section id="sandbox" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[#1A1F2A]">
          <InteractiveDashboardPreview onLaunch={handleLaunch} />
        </section>

        <LandingFeaturesGrid onGetStarted={handleLaunch} />
        <LandingStandardsBadges />
        <LandingCtaBanner onGetStarted={handleLaunch} />
      </main>
      <LandingFooter />
    </div>
  );
};

export const OnboardingPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-[#0A0E14] text-[#F4F6F8]">
      <OnboardingWizard onComplete={() => onNavigate?.('/app/dashboard')} />
    </div>
  );
};

export const DashboardPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { fetchDashboardMetrics, isLoading, isLoaded, error, hasData } = useMetricsStore();

  React.useEffect(() => {
    fetchDashboardMetrics();
  }, [fetchDashboardMetrics]);

  return (
    <div className="space-y-6">
      {/* Telemetry Sync Error Banner */}
      {error && (
        <Card className="p-4 border-[#FF4D4D]/40 bg-[#12161F]/95 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[#FF4D4D]/15 text-[#FF4D4D] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#F4F6F8]">Telemetry Sync Disrupted</p>
              <p className="text-xs text-[#8891A3]">{error}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchDashboardMetrics(true)}
            className="text-xs flex items-center gap-1.5 shrink-0 border-[#242B38] hover:border-[#2ED9A3] hover:text-[#2ED9A3]"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Sync
          </Button>
        </Card>
      )}

      {/* Clean Empty State Banner for authenticated enterprise without uploaded data */}
      {isLoaded && !hasData && !error && (
        <div className="p-4 rounded-[12px] bg-[#12161F]/90 border border-[#242B38] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#3FB6E8]/10 text-[#3FB6E8] flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#F4F6F8]">Awaiting Operational Activity Data</h4>
              <p className="text-xs text-[#8891A3]">
                No energy or waste records uploaded yet for this enterprise. Green Score reflects baseline reference defaults.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (onNavigate) {
                onNavigate('/onboarding');
              } else {
                window.history.pushState({}, '', '/onboarding');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }}
            className="shrink-0 bg-[#2ED9A3] hover:bg-[#28c493] text-[#0A0E14] font-semibold text-xs h-8 px-3 rounded-[6px] transition-all cursor-pointer shadow-[0_0_12px_rgba(46,217,163,0.25)]"
          >
            Upload Data
          </button>
        </div>
      )}

      <GreenScoreWidget />
      <LiveEsgGauges />
      <FloatingAiRecommendationsQueue />
    </div>
  );
};

export const CarbonPage: React.FC = () => {
  const [scope, setScope] = React.useState<ScopeType>(ScopeType.TOTAL);
  const [facility, setFacility] = React.useState<string>('ALL');
  const [timeframe, setTimeframe] = React.useState<string>('ALL');

  // Real backend data states
  const [summary, setSummary] = React.useState<CarbonSummaryData | null>(null);
  const [activities, setActivities] = React.useState<EnergyActivityItem[]>([]);
  const [recommendations, setRecommendations] = React.useState<BackendRecommendation[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Department drill-down modal states
  const [selectedDeptId, setSelectedDeptId] = React.useState<string | null>(null);
  const [deptDetail, setDeptDetail] = React.useState<DepartmentCarbonDetail | null>(null);
  const [deptLoading, setDeptLoading] = React.useState<boolean>(false);
  const [deptError, setDeptError] = React.useState<string | null>(null);

  const fetchCarbonData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, actRes, recRes] = await Promise.all([
        CarbonService.getCarbonSummary(),
        CarbonService.getEnergyUsage(),
        CarbonService.getRecommendations(),
      ]);
      setSummary(sumRes);
      setActivities(actRes || []);
      setRecommendations(recRes || []);
    } catch (err: any) {
      console.error('Failed to load carbon telemetry:', err);
      setError('Carbon data could not be loaded. Please ensure you are logged in and your backend is reachable.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCarbonData();
  }, []);

  const handleSelectDepartment = async (deptId: string) => {
    setSelectedDeptId(deptId);
    setDeptLoading(true);
    setDeptError(null);
    try {
      const detail = await CarbonService.getDepartmentCarbon(deptId);
      setDeptDetail(detail);
    } catch (err: any) {
      console.error('Failed to load department detail:', err);
      setDeptError('Could not load department details. Please try again.');
    } finally {
      setDeptLoading(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedDeptId(null);
    setDeptDetail(null);
    setDeptError(null);
  };

  const handleExportCsv = () => {
    if (!summary?.departmentBreakdown || summary.departmentBreakdown.length === 0) {
      alert('No carbon telemetry data available to export.');
      return;
    }
    const headers = ['Department Name', 'Electricity Used (kWh)', 'Scope 2 Emissions (tCO2e)', 'Factor Version'];
    const rows = summary.departmentBreakdown.map((d) => [
      `"${d.departmentName.replace(/"/g, '""')}"`,
      d.kwhUsed,
      (d.totalCo2e / 1000).toFixed(2),
      `"${summary.factorVersion || 'CEA-2025.1'}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `greenpulse_carbon_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApproveRec = async (recId: string) => {
    try {
      await CarbonService.updateRecommendationStatus(recId, 'approved');
      setRecommendations((prev) =>
        prev.map((r) => (r._id === recId || r.id === recId ? { ...r, status: 'approved' } : r))
      );
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
    }
  };

  const handleDismissRec = async (recId: string) => {
    try {
      await CarbonService.updateRecommendationStatus(recId, 'dismissed');
      setRecommendations((prev) =>
        prev.filter((r) => r._id !== recId && r.id !== recId)
      );
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
    }
  };

  return (
    <div className="relative min-h-screen space-y-6">
      {/* Subtle Atmospheric Environmental Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -left-10 w-96 h-96 rounded-full bg-[#2ED9A3]/[0.035] blur-[80px] -z-10"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-48 right-0 w-96 h-96 rounded-full bg-[#3FB6E8]/[0.025] blur-[90px] -z-10"
      />

      {/* Upgraded Page Header with Real Scope 2 Indicator */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1A1F2A]/80 pb-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-[#2ED9A3]/10 text-[#2ED9A3] border border-[#2ED9A3]/30 text-[10px] font-data font-semibold flex items-center gap-1.5 shadow-[0_0_10px_rgba(46,217,163,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ED9A3] animate-pulse" />
              LIVE CARBON TELEMETRY
            </span>
            <span className="text-[11px] font-data text-[#8891A3]">
              SEBI BRSR Principle 6 &amp; GHG Protocol
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#F4F6F8] font-display tracking-tight">
            Carbon Footprint Intelligence
          </h2>
          <p className="text-xs text-[#8891A3] mt-1 max-w-2xl">
            Measure emissions. Identify hotspots. Act on the highest-impact opportunities with continuous Scope 2 electricity accounting.
          </p>
        </div>

        {/* Real Active Scope Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="px-3 py-1.5 rounded-[8px] bg-[#12161F] border border-[#242B38] text-xs font-data text-[#8891A3] flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#3FB6E8] animate-pulse" />
            <span className="text-[#F4F6F8] font-semibold">Scope 2 Active</span>
            <span className="text-[#3FB6E8] font-mono">
              {summary?.factorVersion ? `CEA Factor (${summary.factorVersion})` : 'Grid Electricity'}
            </span>
          </span>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-[#2ED9A3] animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F4F6F8]">Loading carbon data...</p>
            <p className="text-xs text-[#8891A3] mt-0.5">Fetching verified emissions telemetry from backend</p>
          </div>
        </div>
      ) : error ? (
        /* Error State with Retry */
        <div className="p-6 rounded-[12px] bg-[#12161F] border border-[#F0554C]/40 text-center space-y-3">
          <p className="text-sm font-semibold text-[#F0554C]">{error}</p>
          <button
            onClick={fetchCarbonData}
            className="px-4 py-2 rounded-[8px] bg-[#171C27] hover:bg-[#242B38] border border-[#242B38] text-xs font-data text-[#F4F6F8] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        /* Loaded Content */
        <>
          {/* Scope and Timeframe Filter Controls */}
          <ScopeToggleSegment
            activeScope={scope}
            onChange={setScope}
            selectedFacility={facility}
            onFacilityChange={setFacility}
            selectedTimeframe={timeframe}
            onTimeframeChange={setTimeframe}
            summary={summary}
            onExportCsv={handleExportCsv}
          />

          {/* KPI / Carbon Summary Cards */}
          <CarbonKpiCards
            summary={summary}
            activeScope={scope}
            selectedPeriod={timeframe}
            selectedFacility={facility}
          />

          {/* Real Historical Carbon Trends Chart */}
          <CarbonTrendsChart summary={summary} />

          {/* Real Department Carbon Accounting Breakdown */}
          <DepartmentCarbonBreakdown
            summary={summary}
            onSelectDepartment={handleSelectDepartment}
            selectedDepartmentId={selectedDeptId}
          />

          {/* Simple Judge-Friendly Carbon Reduction Recommendations */}
          <FloatingCarbonAiRecommendations
            summary={summary}
            recommendations={recommendations}
            onApprove={handleApproveRec}
            onDismiss={handleDismissRec}
          />

          {/* Real Carbon Activity Log */}
          <CarbonActivityLog activities={activities} isLoading={isLoading} />

          {/* Department Drill-Down Modal */}
          {selectedDeptId && (
            <DepartmentDrillDownModal
              departmentDetail={deptDetail}
              isLoading={deptLoading}
              error={deptError}
              onClose={handleCloseModal}
              onRetry={() => handleSelectDepartment(selectedDeptId)}
            />
          )}
        </>
      )}
    </div>
  );
};

export const EnergyPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#F4F6F8]">Energy Monitor & Anomaly Detection</h2>
      <HourlyEnergyHeatmap />
      <AnomalyAlertCard />
    </div>
  );
};

export const ESGPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#F4F6F8]">ESG Compliance & SEBI BRSR Engine</h2>
      <PenaltyShield />
    </div>
  );
};


export const WastePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#F4F6F8]">Waste Stream Analytics</h2>
      <WasteStreamAnalytics />
    </div>
  );
};

export const CopilotPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#F4F6F8] font-display flex items-center gap-2">
            GreenPulse AI Intelligence Copilot
          </h2>
          <p className="text-xs text-[#8891A3] mt-1">
            Grounded in SCADA telemetry, GHG Protocol accounting, SEBI BRSR Principle 6, and MSEDCL Time-of-Day energy tariffs.
          </p>
        </div>
      </motion.div>

      <CopilotFullWorkspace onNavigate={onNavigate} />
    </div>
  );
};

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#F4F6F8]">Audit-Ready Compliance Reports</h2>
      <ReportsHistoryView />
    </div>
  );
};

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-[#F4F6F8]">Settings</h2>
      <SettingsView />
    </div>
  );
};

export const RecommendationsPage: React.FC = () => {
  return <RecommendationsView />;
};
