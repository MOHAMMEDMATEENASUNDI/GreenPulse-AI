/**
 * @license
 * GreenPulse AI — Phase 7H AI Recommendations Component
 * Dedicated full recommendations management interface.
 * Real backend-backed: GET /api/v1/recommendations & PATCH /api/v1/recommendations/:id
 * Strict compliance:
 * - Plain language (What we found / What to do / Why it matters)
 * - Real backend priorityScore
 * - Real status actions (Approve / Dismiss)
 * - Filters (All, Pending, Approved, Dismissed)
 * - Honest impact values (No fabricated numbers)
 * - Loading skeleton, API error state with Retry, empty state
 * - Human-in-the-loop: AI suggests -> human reviews -> Approve / Dismiss
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Check,
  CheckCircle2,
  X,
  AlertTriangle,
  RefreshCw,
  Building2,
  Activity,
  Filter,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Info,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  RecommendationService,
  BackendRecommendation,
} from '../../services/recommendation-service';
import {
  formatBackendRecommendation,
  FormattedRecommendation,
} from '../../utils/recommendation-helpers';

export const RecommendationsView: React.FC = () => {
  const [recommendations, setRecommendations] = useState<FormattedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'dismissed'>('all');
  const [actionInProgress, setActionInProgress] = useState<Record<string, 'approving' | 'dismissing'>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await RecommendationService.getRecommendations(activeFilter);
      const formatted = data.map(formatBackendRecommendation);
      setRecommendations(formatted);
    } catch (err: any) {
      console.error('Failed to load recommendations:', err);
      setError('Unable to load AI recommendations from the server. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [activeFilter]);

  const handleApprove = async (id: string) => {
    setActionInProgress((prev) => ({ ...prev, [id]: 'approving' }));
    setFeedbackMessage(null);
    try {
      const updated = await RecommendationService.updateRecommendationStatus(id, 'approved');
      const formattedUpdated = formatBackendRecommendation(updated);

      setRecommendations((prev) =>
        prev.map((r) => (r.id === id ? formattedUpdated : r))
      );

      setFeedbackMessage({
        id,
        type: 'success',
        text: 'Action approved. Energy and carbon reduction will be tracked in upcoming readings.',
      });
    } catch (err: any) {
      console.error('Failed to approve recommendation:', err);
      setFeedbackMessage({
        id,
        type: 'error',
        text: 'Failed to approve recommendation. Please try again.',
      });
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDismiss = async (id: string) => {
    setActionInProgress((prev) => ({ ...prev, [id]: 'dismissing' }));
    setFeedbackMessage(null);
    try {
      const updated = await RecommendationService.updateRecommendationStatus(id, 'dismissed');
      const formattedUpdated = formatBackendRecommendation(updated);

      if (activeFilter === 'pending') {
        // If viewing pending only, filter out
        setRecommendations((prev) => prev.filter((r) => r.id !== id));
      } else {
        setRecommendations((prev) =>
          prev.map((r) => (r.id === id ? formattedUpdated : r))
        );
      }

      setFeedbackMessage({
        id,
        type: 'success',
        text: 'Recommendation dismissed from active review queue.',
      });
    } catch (err: any) {
      console.error('Failed to dismiss recommendation:', err);
      setFeedbackMessage({
        id,
        type: 'error',
        text: 'Failed to dismiss recommendation. Please try again.',
      });
    } finally {
      setActionInProgress((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const pendingCount = recommendations.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1A1F2A] pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[#F4F6F8] tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#8B7FFF] via-[#3FB6E8] to-[#2ED9A3] p-[1.5px]">
              <div className="w-full h-full bg-[#0A0E14] rounded-[7px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#8B7FFF]" />
              </div>
            </div>
            Green Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-[#8891A3] mt-1">
            Clear operational actions derived from energy monitoring and facility equipment checks.
          </p>
        </div>

        {/* Filter Controls (All, Pending, Approved, Dismissed) */}
        <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-[#12161F] border border-[#242B38] self-start sm:self-auto">
          {(['all', 'pending', 'approved', 'dismissed'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-data transition-all cursor-pointer capitalize ${
                activeFilter === filterKey
                  ? 'bg-[#171C27] text-[#2ED9A3] font-semibold border border-[#2ED9A3]/30 shadow-sm'
                  : 'text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#1A1F2A]'
              }`}
            >
              {filterKey}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="flex items-center justify-between text-xs text-[#8891A3]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2ED9A3] animate-pulse" />
          <span>
            {pendingCount > 0
              ? `${pendingCount} actionable recommendation${pendingCount === 1 ? '' : 's'} waiting for human review`
              : 'All recommendations in this view have been reviewed'}
          </span>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-[#8891A3] hover:text-[#2ED9A3] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Global Feedback Alert */}
      {feedbackMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-[8px] border text-xs flex items-center justify-between ${
            feedbackMessage.type === 'success'
              ? 'bg-[#2ED9A3]/10 border-[#2ED9A3]/30 text-[#2ED9A3]'
              : 'bg-[#F0554C]/10 border-[#F0554C]/30 text-[#F0554C]'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-current hover:opacity-80 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <RecommendationsLoadingSkeleton />
      ) : error ? (
        <RecommendationsErrorState error={error} onRetry={fetchRecommendations} />
      ) : recommendations.length === 0 ? (
        <RecommendationsEmptyState activeFilter={activeFilter} />
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {recommendations.map((rec, idx) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                index={idx}
                isApproving={actionInProgress[rec.id] === 'approving'}
                isDismissing={actionInProgress[rec.id] === 'dismissing'}
                onApprove={() => handleApprove(rec.id)}
                onDismiss={() => handleDismiss(rec.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export const RecommendationCard: React.FC<{
  rec: FormattedRecommendation;
  index: number;
  isApproving: boolean;
  isDismissing: boolean;
  onApprove: () => void;
  onDismiss: () => void;
}> = ({ rec, index, isApproving, isDismissing, onApprove, onDismiss }) => {
  const isApproved = rec.status === 'approved';
  const isDismissed = rec.status === 'dismissed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`rounded-[12px] bg-[#12161F]/95 backdrop-blur-xl border transition-all duration-200 relative overflow-hidden shadow-lg ${
        isApproved
          ? 'border-[#2ED9A3]/50 bg-[#2ED9A3]/[0.02]'
          : isDismissed
          ? 'border-[#242B38] opacity-60'
          : 'border-[#242B38] hover:border-[#3A4559]'
      }`}
    >
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header Row: Category, Department, Priority */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="violet" className="text-[11px] font-medium tracking-wide">
              {rec.categoryLabel}
            </Badge>

            {rec.department && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] text-[11px] font-data bg-[#171C27] text-[#3FB6E8] border border-[#3FB6E8]/20">
                <Building2 className="w-3 h-3" />
                {rec.department}
              </span>
            )}
          </div>

          {/* Real Priority Badge (using real backend priorityScore) */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-[5px] text-xs font-data font-semibold tracking-wider border ${
                rec.priorityScore >= 75
                  ? 'bg-[#2ED9A3]/10 text-[#2ED9A3] border-[#2ED9A3]/30'
                  : rec.priorityScore >= 50
                  ? 'bg-[#3FB6E8]/10 text-[#3FB6E8] border-[#3FB6E8]/30'
                  : 'bg-[#8891A3]/10 text-[#8891A3] border-[#8891A3]/30'
              }`}
            >
              {rec.priorityLabel}
            </span>
          </div>
        </div>

        {/* Plain Language 3-Part Structure */}
        <div className="space-y-3 bg-[#0D1118]/60 rounded-[8px] p-4 border border-[#1A1F2A]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8891A3] block mb-0.5">
              What we found
            </span>
            <p className="text-xs sm:text-sm text-[#CAD1DB] leading-relaxed">
              {rec.found}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2ED9A3] block mb-0.5">
              What to do
            </span>
            <p className="text-xs sm:text-sm text-[#F4F6F8] font-medium leading-relaxed">
              {rec.todo}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3FB6E8] block mb-0.5">
              Why it matters
            </span>
            <p className="text-xs sm:text-sm text-[#8891A3] leading-relaxed">
              {rec.matters}
            </p>
          </div>
        </div>

        {/* Footer Row: Impact & Human-in-the-Loop Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          {/* Honest Impact Metrics */}
          <div className="flex flex-wrap items-center gap-5 text-xs font-data">
            {rec.hasImpactData ? (
              <>
                {rec.costSavingsFormatted && (
                  <div className="flex items-center gap-1.5 text-[#2ED9A3]">
                    <span className="text-[11px] text-[#8891A3]">Est. Savings:</span>
                    <span className="font-semibold tabular-nums">{rec.costSavingsFormatted}</span>
                  </div>
                )}
                {rec.co2ReductionFormatted && (
                  <div className="flex items-center gap-1.5 text-[#3FB6E8]">
                    <span className="text-[11px] text-[#8891A3]">CO₂ Reduction:</span>
                    <span className="font-semibold tabular-nums">{rec.co2ReductionFormatted}</span>
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-[#8891A3] italic flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#8891A3]/60" />
                {rec.impactUnavailableText}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {isApproved ? (
              <span className="text-xs font-data font-semibold text-[#2ED9A3] flex items-center gap-1.5 bg-[#2ED9A3]/10 border border-[#2ED9A3]/30 px-3 py-1.5 rounded-[6px]">
                <CheckCircle2 className="w-4 h-4 text-[#2ED9A3]" />
                ✓ Approved {rec.approvedAtFormatted ? `(${rec.approvedAtFormatted})` : ''}
              </span>
            ) : isDismissed ? (
              <span className="text-xs font-data text-[#8891A3] bg-[#171C27] border border-[#242B38] px-3 py-1.5 rounded-[6px]">
                Dismissed
              </span>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isApproving || isDismissing}
                  onClick={onDismiss}
                  className="h-8 px-3 text-xs font-data text-[#8891A3] hover:text-[#F4F6F8] hover:bg-[#1A1F2A] border border-transparent hover:border-[#242B38] transition-all cursor-pointer"
                >
                  {isDismissing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : null}
                  Dismiss
                </Button>

                <Button
                  size="sm"
                  disabled={isApproving || isDismissing}
                  onClick={onApprove}
                  className="h-8 px-3.5 bg-[#2ED9A3] hover:bg-[#28c493] text-[#0A0E14] font-semibold shadow-[0_0_12px_rgba(46,217,163,0.25)] hover:shadow-[0_0_18px_rgba(46,217,163,0.4)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isApproving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const RecommendationsLoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          className="rounded-[12px] bg-[#12161F]/60 border border-[#242B38] p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 bg-[#1A1F2A] rounded-[5px]" />
            <div className="h-5 w-20 bg-[#1A1F2A] rounded-[5px]" />
          </div>
          <div className="space-y-2 bg-[#0D1118]/40 p-4 rounded-[8px]">
            <div className="h-4 w-3/4 bg-[#1A1F2A] rounded" />
            <div className="h-4 w-full bg-[#1A1F2A] rounded" />
            <div className="h-4 w-2/3 bg-[#1A1F2A] rounded" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="h-4 w-40 bg-[#1A1F2A] rounded" />
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-[#1A1F2A] rounded-[6px]" />
              <div className="h-8 w-20 bg-[#1A1F2A] rounded-[6px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const RecommendationsErrorState: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  return (
    <div className="rounded-[12px] bg-[#12161F]/90 border border-[#F0554C]/30 p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-[#F0554C]/10 border border-[#F0554C]/30 flex items-center justify-center mx-auto text-[#F0554C]">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[#F4F6F8]">Failed to Load Recommendations</h3>
        <p className="text-xs text-[#8891A3] max-w-md mx-auto">{error}</p>
      </div>
      <Button
        onClick={onRetry}
        size="sm"
        className="bg-[#2ED9A3] hover:bg-[#28c493] text-[#0A0E14] font-semibold"
      >
        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
        Retry
      </Button>
    </div>
  );
};

export const RecommendationsEmptyState: React.FC<{
  activeFilter?: string;
}> = ({ activeFilter }) => {
  return (
    <div className="rounded-[12px] bg-[#12161F]/60 border border-[#242B38] p-10 sm:p-12 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-[#171C27] border border-[#242B38] flex items-center justify-center mx-auto text-[#8891A3]">
        <Sparkles className="w-6 h-6 text-[#8B7FFF]/70" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[#F4F6F8]">
          No recommendations yet
        </h3>
        <p className="text-xs sm:text-sm text-[#8891A3] max-w-md mx-auto leading-relaxed">
          GreenPulse will show actions when enough energy or sustainability data is available.
        </p>
      </div>
    </div>
  );
};
