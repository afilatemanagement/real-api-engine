import type {
  ActivityEvent,
  AIObservation,
  CEOSuggestion,
  EcosystemMetrics,
  CEOOperationalData,
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
  systemActivityRate: 872,
  deploymentFrequency: 14,
  errorVelocity: 3,
  activeUsers: 2387,
  transactionsToday: 4638,
  apiLatency: 48
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

/** One deterministic, realistic demonstration snapshot used only when AIRA is unavailable. */
export const CEO_SEED_DATA: CEOOperationalData = {
  metrics: generateEcosystemMetrics(),
  observations: generateObservations(),
  activityEvents: generateActivityEvents(),
  liveActions: [
    { id: 'live-001', actor: 'CEO', action: 'Viewed revenue report', role: 'ceo', location: 'HQ', impact: 'low', risk: 5, time: 'Just now' },
    { id: 'live-002', actor: 'Admin #12', action: 'Created 5 new users', role: 'admin', location: 'Europe', impact: 'medium', risk: 25, time: '30s ago' },
    { id: 'live-003', actor: 'Franchise #101', action: 'Requested withdrawal $5,000', role: 'franchise', location: 'USA', impact: 'high', risk: 45, time: '1m ago' },
    { id: 'live-004', actor: 'Super Admin', action: 'Modified permission matrix', role: 'super_admin', location: 'HQ', impact: 'critical', risk: 70, time: '2m ago' },
    { id: 'live-005', actor: 'Country Head', action: 'Approved lead assignment', role: 'country_head', location: 'India', impact: 'low', risk: 10, time: '3m ago' },
    { id: 'live-006', actor: 'Reseller #45', action: 'Generated demo link', role: 'reseller', location: 'UK', impact: 'low', risk: 5, time: '4m ago' },
    { id: 'live-007', actor: 'Lead Manager', action: 'Bulk assigned 50 leads', role: 'lead_manager', location: 'Australia', impact: 'medium', risk: 30, time: '5m ago' },
    { id: 'live-008', actor: 'Developer #7', action: 'Deployed hotfix v2.3.1', role: 'developer', location: 'Remote', impact: 'high', risk: 55, time: '8m ago' },
  ],
  decisions: [
    { id: 'dec-001', action: 'Approve franchise payout request ($8,500)', requestedBy: 'Franchise #234', type: 'financial', aiDecision: 'approve', confidence: 94, reasoning: 'Clean transaction history, within limits, no fraud flags', historicalOutcome: '98% approval rate for similar requests' },
    { id: 'dec-002', action: 'Delay bulk user creation (150 users)', requestedBy: 'Admin #8', type: 'user_management', aiDecision: 'delay', confidence: 78, reasoning: 'Unusual volume; manual review recommended', historicalOutcome: '65% of similar requests required review' },
    { id: 'dec-003', action: 'Reject permission escalation request', requestedBy: 'Country Head APAC', type: 'security', aiDecision: 'reject', confidence: 89, reasoning: 'Request exceeds role boundaries and may violate policy', historicalOutcome: '92% of similar requests were rejected' },
    { id: 'dec-004', action: 'Escalate server access request to Boss', requestedBy: 'Developer #3', type: 'infrastructure', aiDecision: 'escalate', confidence: 85, reasoning: 'Production access requires explicit approval', historicalOutcome: '100% escalated under current policy' },
  ],
  riskCategories: [
    { id: 'risk-001', category: 'Security Risk', level: 'medium', score: 45, issues: 3, trend: 'stable', icon: 'shield' },
    { id: 'risk-002', category: 'Legal Risk', level: 'low', score: 18, issues: 1, trend: 'improving', icon: 'file' },
    { id: 'risk-003', category: 'Financial Exposure', level: 'high', score: 72, issues: 5, trend: 'worsening', icon: 'money' },
    { id: 'risk-004', category: 'SLA Breach', level: 'low', score: 12, issues: 0, trend: 'stable', icon: 'clock' },
    { id: 'risk-005', category: 'Policy Violation', level: 'medium', score: 38, issues: 2, trend: 'improving', icon: 'lock' },
  ],
  complianceItems: [
    { id: 'comp-001', policy: 'Data Protection (GDPR)', status: 'compliant', lastAudit: '2 days ago' },
    { id: 'comp-002', policy: 'Financial Regulations', status: 'warning', lastAudit: '1 week ago' },
    { id: 'comp-003', policy: 'User Privacy Policy', status: 'compliant', lastAudit: '3 days ago' },
    { id: 'comp-004', policy: 'Access Control Policy', status: 'compliant', lastAudit: 'Today' },
    { id: 'comp-005', policy: 'Incident Response Plan', status: 'review', lastAudit: '2 weeks ago' },
  ],
  preventiveSuggestions: [
    'Implement additional MFA for high-value transactions',
    'Review franchise payment thresholds; over-limit patterns were detected',
    'Schedule a security audit for APAC region servers',
  ],
  rolePerformance: [
    { role: 'Franchises', score: 87, trend: 'up', metric: 'Sales conversion', change: '+12%' },
    { role: 'Resellers', score: 72, trend: 'stable', metric: 'Lead closure', change: '+2%' },
    { role: 'Support Team', score: 94, trend: 'up', metric: 'Resolution time', change: '-18%' },
    { role: 'Sales Team', score: 68, trend: 'down', metric: 'New clients', change: '-8%' },
    { role: 'Developers', score: 91, trend: 'up', metric: 'Deploy success', change: '+5%' },
  ],
  productivityMetrics: [
    { metric: 'Avg Tasks/Day', value: '23.4', trend: 'up', target: '20' },
    { metric: 'Response Time', value: '4.2h', trend: 'up', target: '6h' },
    { metric: 'Quality Score', value: '8.7/10', trend: 'stable', target: '8.5/10' },
    { metric: 'Completion Rate', value: '94%', trend: 'up', target: '90%' },
  ],
  correctiveActions: [
    { team: 'Sales Team', issue: 'Below target for 3 weeks', action: 'Recommend training session', priority: 'high' },
    { team: 'Reseller #23', issue: 'Low engagement', action: 'Schedule check-in call', priority: 'medium' },
    { team: 'Region LATAM', issue: 'SLA approaching breach', action: 'Allocate additional resources', priority: 'high' },
  ],
  predictions: [
    { id: 'pred-001', title: 'Revenue Growth Expected', type: 'positive', timeline: 'Next 7 days', confidence: 89, detail: 'Current lead pipeline and conversion rates indicate a potential 15% revenue increase', icon: 'money' },
    { id: 'pred-002', title: 'System Overload Risk', type: 'warning', timeline: 'Next 30 days', confidence: 72, detail: 'Traffic patterns suggest server capacity may reach 85% during peak hours', icon: 'server' },
    { id: 'pred-003', title: 'Staff Burnout Detected', type: 'negative', timeline: 'Next quarter', confidence: 68, detail: 'Support team overtime is trending 40% above the healthy threshold', icon: 'users' },
    { id: 'pred-004', title: 'High-Risk Deal Identified', type: 'warning', timeline: 'Next 7 days', confidence: 81, detail: 'Client #456 shows payment-delay patterns similar to past defaults', icon: 'warning' },
    { id: 'pred-005', title: 'Feature Adoption Surge', type: 'positive', timeline: 'Next 30 days', confidence: 85, detail: 'Reporting-module adoption is trending three times above projection', icon: 'zap' },
  ],
  timelinePredictions: {
    sevenDays: [{ label: 'Revenue', prediction: '+12%', confidence: 89 }, { label: 'New Leads', prediction: '+45', confidence: 78 }, { label: 'Support Load', prediction: 'Normal', confidence: 92 }],
    thirtyDays: [{ label: 'Churn Risk', prediction: '2 clients', confidence: 71 }, { label: 'Expansion', prediction: '3 regions', confidence: 65 }, { label: 'Hiring Need', prediction: '+5 support', confidence: 82 }],
    quarter: [{ label: 'Market Share', prediction: '+2.3%', confidence: 58 }, { label: 'Infrastructure', prediction: 'Upgrade needed', confidence: 76 }, { label: 'Compliance', prediction: 'Audit due', confidence: 95 }],
  },
  reports: [
    { id: 'rep-001', title: 'Daily AI Summary', type: 'daily', generatedAt: 'Today, 6:00 AM', status: 'delivered', recipients: ['Boss', 'CEO'], highlights: ['872 actions monitored', '3 risks detected', '12 approvals pending'] },
    { id: 'rep-002', title: 'Weekly Executive Brief', type: 'weekly', generatedAt: 'Sunday, 8:00 PM', status: 'delivered', recipients: ['Boss', 'CEO'], highlights: ['Revenue +8%', 'New franchises: 12', 'SLA compliance: 99.2%'] },
    { id: 'rep-003', title: 'Monthly Risk Report', type: 'monthly', generatedAt: 'August 31, 2026', status: 'delivered', recipients: ['Boss'], highlights: ['45 risks addressed', '0 critical breaches', 'Fraud prevented: $24K'] },
    { id: 'rep-004', title: 'Decision Accuracy Report', type: 'monthly', generatedAt: 'August 31, 2026', status: 'delivered', recipients: ['Boss', 'CEO'], highlights: ['AI accuracy: 94%', 'False positives: 3%', 'Improvement: +2%'] },
  ],
  upcomingReports: [
    { title: 'Daily AI Summary', scheduled: 'Tomorrow 6:00 AM' },
    { title: 'Weekly Executive Brief', scheduled: 'Sunday 8:00 PM' },
    { title: 'Monthly Risk Report', scheduled: 'September 30, 2026' },
  ],
  learningLogs: [
    { id: 'learn-001', observation: 'Franchise #101 payment-delay pattern', suggestion: 'Flag for manual review', bossDecision: 'approved', outcome: 'Fraud prevented — $5,200 saved', timestamp: '2 hours ago', learned: true },
    { id: 'learn-002', observation: 'Bulk user creation request from Admin #8', suggestion: 'Delay for verification', bossDecision: 'overridden', outcome: 'Legitimate batch import — no issues', timestamp: '5 hours ago', learned: true },
    { id: 'learn-003', observation: 'Server CPU spike in APAC region', suggestion: 'Scale up resources', bossDecision: 'approved', outcome: 'Prevented downtime during peak', timestamp: 'Yesterday', learned: true },
    { id: 'learn-004', observation: 'New user login from unusual location', suggestion: 'Trigger MFA verification', bossDecision: 'approved', outcome: 'Legitimate travel — verified', timestamp: '2 days ago', learned: true },
    { id: 'learn-005', observation: 'Support ticket surge detected', suggestion: 'Allocate extra staff', bossDecision: 'partially_approved', outcome: 'Managed with 50% of suggested resources', timestamp: '3 days ago', learned: true },
  ],
  learningStats: { totalObservations: 12847, accuracyRate: 94.2, improvementThisMonth: 2.1, decisionsAnalyzed: 3421 },
  settings: [
    { category: 'Monitoring', icon: 'eye', settings: [{ label: 'Real-time action monitoring', value: true, locked: true }, { label: 'Risk detection alerts', value: true, locked: true }, { label: 'Performance tracking', value: true, locked: true }] },
    { category: 'Notifications', icon: 'bell', settings: [{ label: 'Daily summary to Boss', value: true, locked: true }, { label: 'Weekly report to CEO', value: true, locked: true }, { label: 'Critical alerts immediate', value: true, locked: true }] },
    { category: 'Security', icon: 'shield', settings: [{ label: 'Fraud detection enabled', value: true, locked: true }, { label: 'Anomaly flagging', value: true, locked: true }, { label: 'Audit logging', value: true, locked: true }] },
    { category: 'System', icon: 'globe', settings: [{ label: '24/7 active mode', value: true, locked: true }, { label: 'Auto-learning enabled', value: true, locked: true }, { label: 'Multi-region monitoring', value: true, locked: true }] },
  ],
  systemInfo: { aiVersion: 'v2.0.4', modelVersion: 'GPT-6 Astra', lastTraining: 'Provider managed' },
};
