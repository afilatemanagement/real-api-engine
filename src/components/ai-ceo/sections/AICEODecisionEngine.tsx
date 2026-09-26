import { motion } from "framer-motion";
import { PageBanner, PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Send
} from "lucide-react";

// Mock decisions data
const decisions = [
  { 
    id: 1, 
    action: "Approve franchise payout request ($8,500)", 
    requestedBy: "Franchise #234",
    type: "financial",
    aiDecision: "approve",
    confidence: 94,
    reasoning: "Clean transaction history, within limits, no fraud flags",
    historicalOutcome: "98% approval rate for similar"
  },
  { 
    id: 2, 
    action: "Delay bulk user creation (150 users)", 
    requestedBy: "Admin #8",
    type: "user_management",
    aiDecision: "delay",
    confidence: 78,
    reasoning: "Unusual volume, recommend manual review",
    historicalOutcome: "65% delayed for review historically"
  },
  { 
    id: 3, 
    action: "Reject permission escalation request", 
    requestedBy: "Country Head APAC",
    type: "security",
    aiDecision: "reject",
    confidence: 89,
    reasoning: "Request exceeds role boundaries, potential policy violation",
    historicalOutcome: "92% rejected for similar patterns"
  },
  { 
    id: 4, 
    action: "Escalate server access request to Boss", 
    requestedBy: "Developer #3",
    type: "infrastructure",
    aiDecision: "escalate",
    confidence: 85,
    reasoning: "Production access request requires explicit approval",
    historicalOutcome: "100% escalated per policy"
  },
];

const getDecisionColor = (decision: string) => {
  switch (decision) {
    case 'approve': return { bg: 'bg-accent-emerald/20', text: 'text-accent-emerald', border: 'border-accent-emerald/30' };
    case 'reject': return { bg: 'bg-destructive/20', text: 'text-destructive', border: 'border-destructive/30' };
    case 'delay': return { bg: 'bg-accent-amber/20', text: 'text-accent-amber', border: 'border-accent-amber/30' };
    case 'escalate': return { bg: 'bg-accent-pink/20', text: 'text-accent-pink', border: 'border-accent-pink/30' };
    default: return { bg: 'bg-muted/20', text: 'text-muted-foreground', border: 'border-muted/30' };
  }
};

const getDecisionIcon = (decision: string) => {
  switch (decision) {
    case 'approve': return CheckCircle;
    case 'reject': return XCircle;
    case 'delay': return Clock;
    case 'escalate': return Send;
    default: return AlertTriangle;
  }
};

const AICEODecisionEngine = () => {
  return (
    <PageShell>
      <PageBanner
        icon={Brain}
        title="Decision Engine"
        subtitle="AI-powered decision recommendations scored by the ML model with full reasoning trails."
        status="ML Model v3.2 · live scoring"
      />

      {/* Decision Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Approve", count: 156, icon: CheckCircle, color: "text-accent-emerald" },
          { label: "Delay", count: 23, icon: Clock, color: "text-accent-amber" },
          { label: "Reject", count: 12, icon: XCircle, color: "text-destructive" },
          { label: "Escalate", count: 8, icon: Send, color: "text-accent-pink" },
        ].map((stat, i) => (
          <Card key={stat.label} className="card3d premium-halo enter-soft rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-lg font-bold text-foreground">{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.label} Today</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Decision Queue */}
      <Card className="card3d premium-halo hover-lift shimmer-sweep enter-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent-pink" />
            Active Decision Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px]">
            <div className="space-y-4">
              {decisions.map((decision, i) => {
                const colors = getDecisionColor(decision.aiDecision);
                const Icon = getDecisionIcon(decision.aiDecision);
                
                return (
                  <motion.div
                    key={decision.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-5 rounded-xl bg-surface border ${colors.border} hover:shadow-lg transition-all`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{decision.action}</h3>
                          <p className="text-sm text-muted-foreground">Requested by: {decision.requestedBy}</p>
                        </div>
                      </div>
                      <Badge className={`${colors.bg} ${colors.text} uppercase`}>
                        {decision.aiDecision}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">AI Confidence:</span>
                        <div className="flex-1 flex items-center gap-2">
                          <Progress value={decision.confidence} className="h-2 flex-1" />
                          <span className={`text-sm font-medium ${colors.text}`}>{decision.confidence}%</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-card border border-border">
                        <p className="text-sm text-muted-foreground">
                          <Brain className="w-4 h-4 inline mr-2 text-accent-pink" />
                          <strong className="text-accent-pink">AI Reasoning:</strong> {decision.reasoning}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                        <span>Historical: {decision.historicalOutcome}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-end gap-2">
                      <p className="text-xs text-muted-foreground flex-1">Awaiting Boss/CEO approval</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI Notice */}
      <div className="p-4 rounded-lg bg-accent-pink/5 border border-accent-pink/20">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-accent-pink" />
          <p className="text-sm text-accent-pink/80">
            <strong>Decision Engine Notice:</strong> AI provides recommendations only. All decisions require explicit approval from Boss or CEO.
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default AICEODecisionEngine;
