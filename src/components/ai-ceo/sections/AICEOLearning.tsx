import { motion } from "framer-motion";
import { PageBanner, PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Database, 
  Brain,
  CheckCircle,
  XCircle,
  HelpCircle,
  TrendingUp,
  Clock,
  Zap
} from "lucide-react";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";

const getDecisionStyle = (decision: string) => {
  switch (decision) {
    case 'approved': return { bg: 'bg-accent-emerald/20', text: 'text-accent-emerald', icon: CheckCircle };
    case 'overridden': return { bg: 'bg-accent-amber/20', text: 'text-accent-amber', icon: HelpCircle };
    case 'partially_approved': return { bg: 'bg-primary/20', text: 'text-primary-glow', icon: CheckCircle };
    default: return { bg: 'bg-destructive/20', text: 'text-destructive', icon: XCircle };
  }
};

const AICEOLearning = () => {
  const { data, isPersisted } = useCEOData();
  const { learningLogs, learningStats } = data;
  return (
    <PageShell>
      <PageBanner
        icon={Database}
        title="System Learning Log"
        subtitle="Every AI observation, decision and outcome recorded for continuous model learning."
        status={dataSourceStatus(isPersisted, "continuous learning")}
      />

      {/* Learning Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="card3d premium-halo enter-soft rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary-glow" />
              <div>
                <p className="text-2xl font-bold text-foreground">{learningStats.totalObservations.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Observations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card3d premium-halo enter-soft rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-accent-emerald" />
              <div>
                <p className="text-2xl font-bold text-accent-emerald">{learningStats.accuracyRate}%</p>
                <p className="text-xs text-muted-foreground">Accuracy Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card3d premium-halo enter-soft rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-accent-amber" />
              <div>
                <p className="text-2xl font-bold text-accent-amber">+{learningStats.improvementThisMonth}%</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card3d premium-halo enter-soft rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-accent-pink" />
              <div>
                <p className="text-2xl font-bold text-foreground">{learningStats.decisionsAnalyzed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Decisions Analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning History */}
      <Card className="card3d premium-halo hover-lift shimmer-sweep enter-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-accent-pink" />
            Learning History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px]">
            <div className="space-y-4">
              {learningLogs.map((log, i) => {
                const decisionStyle = getDecisionStyle(log.bossDecision);
                const DecisionIcon = decisionStyle.icon;
                
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 rounded-xl bg-surface border border-border hover:border-accent-pink/30 transition-all"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      {/* Observation */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">AI Observed</p>
                        <p className="text-sm text-foreground">{log.observation}</p>
                      </div>

                      {/* Suggestion */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">AI Suggested</p>
                        <p className="text-sm text-primary-glow">{log.suggestion}</p>
                      </div>

                      {/* Boss Decision */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Boss Decided</p>
                        <Badge className={`${decisionStyle.bg} ${decisionStyle.text}`}>
                          <DecisionIcon className="w-3 h-3 mr-1" />
                          {log.bossDecision.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Outcome */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Outcome</p>
                        <p className="text-sm text-accent-emerald">{log.outcome}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                      </div>
                      {log.learned && (
                        <Badge className="bg-accent-pink/20 text-accent-pink">
                          <Brain className="w-3 h-3 mr-1" />
                          Pattern Learned
                        </Badge>
                      )}
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
            <strong>Learning System:</strong> AI continuously learns from Boss/CEO decisions to improve future suggestions. All learnings are transparent and auditable.
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default AICEOLearning;
