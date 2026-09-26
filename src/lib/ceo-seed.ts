import type {
  ActivityEvent,
  AIObservation,
  CEOSuggestion,
  EcosystemMetrics,
} from './ceo-types';

/** Seed suggestions used only until the Prisma-backed API is connected. */
export const generateSeedSuggestions = (): CEOSuggestion[] => [
  {
    id: 'sug-001',
    type: 'growth',
    title: 'Expand to Southeast Asia Market',
    description: 'Based on market analysis, Vietnam and Indonesia show 40% YoY growth potential in our sector. Recommend initiating market research.',
    confidence: 92,
    impact: 'high',
    impactArea: 'Revenue Growth',
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: 'AI-CEO'
  },
  {
    id: 'sug-002',
    type: 'risk',
    title: 'Middle East Revenue Decline Alert',
    description: 'Revenue dropped 2.1% this quarter. Recommend reviewing local franchise operations and market conditions.',
    confidence: 87,
    impact: 'medium',
    impactArea: 'Risk Mitigation',
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: 'AI-CEO'
  },
  {
    id: 'sug-003',
    type: 'cost',
    title: 'Optimize Cloud Infrastructure Costs',
    description: 'AI analysis shows 18% over-provisioning in APAC servers. Recommend right-sizing to save $4,200/month.',
    confidence: 94,
    impact: 'medium',
    impactArea: 'Cost Reduction',
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: 'AI-CEO'
  },
  {
    id: 'sug-004',
    type: 'efficiency',
    title: 'Implement AI Chatbot for Support',
    description: 'AI chatbot implementation could reduce support costs by 35% while maintaining satisfaction scores.',
    confidence: 91,
    impact: 'high',
    impactArea: 'Operational Efficiency',
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: 'AI-CEO'
  },
  {
    id: 'sug-005',
    type: 'product',
    title: 'Enterprise Solution Gap Identified',
    description: 'Competitors gaining traction with enterprise solutions. Consider expanding product portfolio to capture B2B market.',
    confidence: 78,
    impact: 'high',
    impactArea: 'Market Position',
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: 'Analytics'
  }
];

export const generateEcosystemMetrics = (): EcosystemMetrics => ({
  systemActivityRate: 847 + Math.floor(Math.random() * 50),
  deploymentFrequency: 12 + Math.floor(Math.random() * 5),
  errorVelocity: 3 + Math.floor(Math.random() * 2),
  activeUsers: 2340 + Math.floor(Math.random() * 100),
  transactionsToday: 4521 + Math.floor(Math.random() * 200),
  apiLatency: 45 + Math.floor(Math.random() * 10)
});

export const generateObservations = (): AIObservation[] => [
  {
    id: 'obs-001',
    category: 'change',
    title: 'New deployment in Production',
    detail: 'v2.4.1 deployed successfully with 0 errors. 3 new features activated.',
    severity: 'info',
    timestamp: '15 min ago'
  },
  {
    id: 'obs-002',
    category: 'attention',
    title: 'Support ticket surge detected',
    detail: 'Ticket volume up 34% in last 2 hours. May need additional staffing.',
    severity: 'warning',
    timestamp: '28 min ago'
  },
  {
    id: 'obs-003',
    category: 'revenue',
    title: 'High-value deal approaching close',
    detail: 'Enterprise client #892 showing strong buy signals. Estimated value: $45K ARR.',
    severity: 'info',
    timestamp: '1 hour ago'
  },
  {
    id: 'obs-004',
    category: 'attention',
    title: 'API latency spike in EU region',
    detail: 'Response times increased 23% in Frankfurt datacenter. Monitoring.',
    severity: 'warning',
    timestamp: '2 hours ago'
  },
  {
    id: 'obs-005',
    category: 'revenue',
    title: 'Subscription renewal rate declining',
    detail: 'Monthly renewal rate dropped from 94% to 91%. Churn risk increasing.',
    severity: 'critical',
    timestamp: '3 hours ago'
  }
];

export const generateActivityEvents = (): ActivityEvent[] => [
  {
    id: 'act-001',
    type: 'revenue',
    actor: 'Franchise #101',
    action: 'Closed deal',
    target: 'Enterprise Client',
    timestamp: '5 min ago',
    impact: 'positive'
  },
  {
    id: 'act-002',
    type: 'risk',
    actor: 'System',
    action: 'Flagged unusual pattern',
    target: 'User #45892',
    timestamp: '12 min ago',
    impact: 'negative'
  },
  {
    id: 'act-003',
    type: 'operations',
    actor: 'DevOps',
    action: 'Deployed hotfix',
    target: 'Payment Module',
    timestamp: '23 min ago',
    impact: 'positive'
  },
  {
    id: 'act-004',
    type: 'security',
    actor: 'AI-Security',
    action: 'Blocked suspicious login',
    target: 'Admin account',
    timestamp: '45 min ago',
    impact: 'positive'
  },
  {
    id: 'act-005',
    type: 'compliance',
    actor: 'Legal Bot',
    action: 'Updated terms',
    target: 'Privacy Policy',
    timestamp: '1 hour ago',
    impact: 'neutral'
  },
  {
    id: 'act-006',
    type: 'revenue',
    actor: 'Reseller #23',
    action: 'Lost client',
    target: 'SMB Account',
    timestamp: '2 hours ago',
    impact: 'negative'
  }
];
