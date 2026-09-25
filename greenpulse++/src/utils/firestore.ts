/**
 * @license
 * GreenPulse AI — Firestore Event Stream Manager
 */

import { LiveFeedEvent } from '../types/domain';

export type FeedListenerCallback = (events: LiveFeedEvent[]) => void;

/**
 * Subscribes to live feed events stream with callback dispatcher
 */
export function subscribeToLiveFeed(companyId: string, callback: FeedListenerCallback): () => void {
  // Mock event stream dispatcher simulating live push socket
  const initialEvents: LiveFeedEvent[] = [
    {
      id: 'evt-101',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      type: 'ANOMALY_DETECTED',
      title: 'Floor 3 HVAC Spike (+40%)',
      description: 'Energy consumption exceeded baseline by 140 kWh between 14:00 and 16:00.',
      severity: 'CRITICAL',
      departmentId: 'dept-3',
    },
    {
      id: 'evt-102',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      type: 'RECOMMENDATION_ADDED',
      title: 'Reschedule Chiller Load',
      description: 'AI Copilot generated a new peak load optimization recommendation (₹85,000 potential savings).',
      severity: 'INFO',
    },
    {
      id: 'evt-103',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      type: 'SCORE_UPDATED',
      title: 'Green Score +4 Points',
      description: 'Waste diversion target milestone verified for Q3.',
      severity: 'SUCCESS',
    },
  ];

  callback(initialEvents);

  // Return unsubscribe handle
  return () => {
    // Clean up handle
  };
}
