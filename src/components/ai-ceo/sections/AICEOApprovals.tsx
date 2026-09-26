import { motion } from "framer-motion";
import { PageBanner, PageShell } from "@/components/layout/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  User,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useCEOSuggestions, type CEOSuggestion } from "@/hooks/useCEOSuggestions";

type Rec = "approve" | "review" | "reject";

// Derive the AI recommendation from the suggestion's own confidence and impact
const recommend = (s: CEOSuggestion): Rec => {
  if (s.confidence >= 85 && s.impact !== "high") return "approve";
  if (s.confidence < 70) return "reject";
  return "review";
};

const riskOf = (s: CEOSuggestion) =>
  s.type === "risk" || s.type === "compliance" ? "high" : s.impact;

const getRecommendationStyle = (rec: Rec) => {
  switch (rec) {
    case "approve": return { bg: "bg-accent-emerald/20", text: "text-accent-emerald", icon: ThumbsUp };
    case "reject": return { bg: "bg-destructive/20", text: "text-destructive", icon: ThumbsDown };
    case "review": return { bg: "bg-accent-amber/20", text: "text-accent-amber", icon: Eye };
    default: return { bg: "bg-muted/20", text: "text-muted-foreground", icon: AlertTriangle };
  }
};

const getRiskStyle = (risk: string) => {
  switch (risk) {
    case "high": return "bg-destructive/20 text-destructive";
    case "medium": return "bg-accent-amber/20 text-accent-amber";
    default: return "bg-accent-emerald/20 text-accent-emerald";
  }
};

const AICEOApprovals = () => {
  const { suggestions, isLoading, isPersisted } = useCEOSuggestions();
  const queue = suggestions
    .filter((s) => s.status === "pending" || s.status === "reviewed")
    .map((s) => ({ s, rec: recommend(s), risk: riskOf(s) }));
  const count = (r: Rec) => queue.filter((q) => q.rec === r).length;

  return (
    <PageShell>
      <PageBanner
        icon={CheckSquare}
        title="Approval Suggestions"
        subtitle="AI-recommended approval decisions with confidence scoring, rationale and one-click escalation to the Boss queue."
        status={isPersisted ? "Live data · advisory only" : "Seed data · connect AIRA API for live figures"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {([
          ["approve", "Recommend Approve", ThumbsUp, "bg-accent-emerald/5 border-accent-emerald/20", "text-accent-emerald"],
          ["review", "Recommend Review", Eye, "bg-accent-amber/5 border-accent-amber/20", "text-accent-amber"],
          ["reject", "Recommend Reject", ThumbsDown, "bg-destructive/5 border-destructive/20", "text-destructive"],
        ] as const).map(([key, label, Icon, box, text]) => (
          <Card key={key} className={box}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`w-6 h-6 ${text}`} />
              <div>
                <p className={`text-2xl font-bold ${text}`}>{isLoading ? "–" : count(key)}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="card3d premium-halo hover-lift shimmer-sweep enter-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary-glow" />
            Pending Approval Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px]">
            <div className="space-y-4">
              {isLoading && <p className="text-sm text-muted-foreground">Loading approvals…</p>}
              {!isLoading && queue.length === 0 && (
                <p className="text-sm text-muted-foreground">No suggestions awaiting approval.</p>
              )}
              {queue.map(({ s, rec, risk }, i) => {
                const recStyle = getRecommendationStyle(rec);
                const RecIcon = recStyle.icon;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-xl bg-surface border border-border hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-foreground">{s.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{s.source}</span>
                          <Badge variant="outline" className="text-xs">{s.impactArea}</Badge>
                        </div>
                      </div>
                      <Badge className={getRiskStyle(risk)}>{risk} risk</Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${recStyle.bg}`}>
                        <RecIcon className={`w-4 h-4 ${recStyle.text}`} />
                        <span className={`text-sm font-medium ${recStyle.text} uppercase`}>{rec}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <Progress value={s.confidence} className="h-1.5 flex-1" />
                        <span className="text-xs font-medium text-primary-glow">{s.confidence}%</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground italic">"{s.description}"</p>

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{s.status === "reviewed" ? "Sent to Boss" : "Awaiting decision"}</span>
                      </div>
                      <span className="text-xs text-primary-glow/60">Boss/CEO decides final</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-5 h-5 text-primary-glow" />
          <p className="text-sm text-primary-glow/80">
            <strong>Approval Notice:</strong> AI only suggests. Boss/CEO makes all final approval decisions.
          </p>
        </div>
      </div>
    </PageShell>
  );
};

export default AICEOApprovals;
