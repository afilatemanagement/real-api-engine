import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DecisionItem } from "@/lib/ceo-types";
import { APPROVAL_KEY, useSessionMap, type ApprovalOutcome } from "./state";
import { SeverityBadge, decisionView } from "./shared";

export type GovernanceAction = { kind: "approve" | "reject" | "delegate"; item: DecisionItem } | null;

const REASONS = ["Not enough evidence", "Too risky", "Wrong recommendation", "Timing issue", "Need more information", "Other"];
const ROLES = ["Chief Operating Officer", "Finance Lead", "Head of Compliance", "Engineering Manager", "Customer Success Lead"];

/** Approve / Reject / Delegate confirmation flows. Outcomes are session-only until the approval write API is connected. */
export function GovernanceDialogs({ action, onClose }: { action: GovernanceAction; onClose: () => void }) {
  const [, setOutcome] = useSessionMap<ApprovalOutcome>(APPROVAL_KEY);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [role, setRole] = useState("");
  const [touched, setTouched] = useState(false);

  const reset = () => { setReason(""); setComment(""); setConfirmText(""); setRole(""); setTouched(false); onClose(); };
  if (!action) return null;
  const { item } = action;
  const v = decisionView(item);
  const highRisk = v.priority === "CRITICAL" || v.priority === "HIGH";
  const at = new Date().toLocaleString();

  const done = (outcome: ApprovalOutcome["outcome"], note?: string) => {
    setOutcome(item.id, { outcome, note, at });
    toast.success(`${outcome.charAt(0) + outcome.slice(1).toLowerCase()}: ${item.action}`, {
      description: "Recorded for this session. It will be saved permanently once approvals are connected.",
    });
    reset();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && reset()}>
      <DialogContent className="max-w-lg">
        {action.kind === "approve" && (
          <>
            <DialogHeader>
              <DialogTitle>Approve this action?</DialogTitle>
              <DialogDescription>Review what will happen before confirming.</DialogDescription>
            </DialogHeader>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-muted-foreground">What will happen</dt><dd>{item.action}</dd></div>
              <div><dt className="text-muted-foreground">Who is affected</dt><dd>{item.requestedBy} · {item.type}</dd></div>
              <div className="flex items-center gap-2"><dt className="text-muted-foreground">Risk</dt><dd><SeverityBadge level={v.priority} /></dd></div>
              <div><dt className="text-muted-foreground">Expected result / evidence</dt><dd>{item.historicalOutcome}</dd></div>
            </dl>
            {highRisk && (
              <div className="space-y-1.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                <Label htmlFor="confirm-approve" className="text-xs">High-risk approval — type <b>APPROVE</b> to confirm</Label>
                <Input id="confirm-approve" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button disabled={highRisk && confirmText.trim() !== "APPROVE"} onClick={() => done("APPROVED")}>Approve</Button>
            </DialogFooter>
          </>
        )}

        {action.kind === "reject" && (
          <>
            <DialogHeader>
              <DialogTitle>Reject this action</DialogTitle>
              <DialogDescription>The request stays in history — rejection is never destructive.</DialogDescription>
            </DialogHeader>
            <RadioGroup value={reason} onValueChange={setReason} aria-label="Rejection reason" className="grid gap-2 sm:grid-cols-2">
              {REASONS.map((r) => (
                <Label key={r} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-2.5 text-sm font-normal has-[[data-state=checked]]:border-primary/50">
                  <RadioGroupItem value={r} /> {r}
                </Label>
              ))}
            </RadioGroup>
            {touched && !reason && <p className="text-xs text-destructive" role="alert">Choose a reason to continue.</p>}
            <div className="space-y-1.5">
              <Label htmlFor="reject-comment">Additional comment</Label>
              <Textarea id="reject-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button variant="destructive" onClick={() => { setTouched(true); if (reason) done("REJECTED", [reason, comment.trim()].filter(Boolean).join(" — ")); }}>Reject</Button>
            </DialogFooter>
          </>
        )}

        {action.kind === "delegate" && (
          <>
            <DialogHeader>
              <DialogTitle>Delegate approval</DialogTitle>
              <DialogDescription>{item.action}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Risk</span><SeverityBadge level={v.priority} /></div>
            <div className="space-y-1.5">
              <Label>Authorized person or role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger aria-label="Select delegate"><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
              {touched && !role && <p className="text-xs text-destructive" role="alert">Select who should review this.</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button onClick={() => { setTouched(true); if (role) done("DELEGATED", role); }}>Delegate</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Create Decision form — UI only; drafts are kept for this session. DECISION_CREATE_API_REQUIRED. */
export function CreateDecisionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [form, setForm] = useState({ title: "", problem: "", context: "", priority: "", owner: "", deadline: "", kpi: "", info: "" });
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors = {
    title: !form.title.trim() ? "Title is required" : form.title.length > 140 ? "Keep the title under 140 characters" : "",
    problem: !form.problem.trim() ? "Describe the problem" : "",
    priority: !form.priority ? "Choose a priority" : "",
  };
  const valid = !Object.values(errors).some(Boolean);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (draft: boolean) => {
    setTouched(true);
    if (!draft && !valid) return;
    if (draft && !form.title.trim()) return;
    setSaving(true);
    try {
      const drafts = JSON.parse(sessionStorage.getItem("sv:founder:decision-drafts") ?? "[]");
      sessionStorage.setItem("sv:founder:decision-drafts", JSON.stringify([{ ...form, draft, at: new Date().toISOString() }, ...drafts].slice(0, 20)));
    } catch { /* ignore */ }
    setTimeout(() => {
      setSaving(false);
      toast.success(draft ? "Draft saved" : "Decision prepared", { description: "Kept for this session. Decisions save permanently once the decision source is connected." });
      setForm({ title: "", problem: "", context: "", priority: "", owner: "", deadline: "", kpi: "", info: "" });
      setTouched(false);
      onOpenChange(false);
    }, 300);
  };
  const Err = ({ k }: { k: keyof typeof errors }) => touched && errors[k] ? <p className="text-xs text-destructive" role="alert">{errors[k]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Decision</DialogTitle>
          <DialogDescription>Frame the decision. Founder AI will prepare evidence and options once connected.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label htmlFor="d-title">Decision title *</Label><Input id="d-title" value={form.title} onChange={set("title")} aria-invalid={touched && !!errors.title} /><Err k="title" /></div>
          <div className="space-y-1.5"><Label htmlFor="d-problem">Problem *</Label><Textarea id="d-problem" value={form.problem} onChange={set("problem")} aria-invalid={touched && !!errors.problem} /><Err k="problem" /></div>
          <div className="space-y-1.5"><Label htmlFor="d-context">Context</Label><Textarea id="d-context" value={form.context} onChange={set("context")} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Priority *</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger aria-label="Priority"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{["Low", "Medium", "High", "Critical"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Err k="priority" />
            </div>
            <div className="space-y-1.5"><Label htmlFor="d-owner">Owner</Label><Input id="d-owner" value={form.owner} onChange={set("owner")} /></div>
            <div className="space-y-1.5"><Label htmlFor="d-deadline">Deadline</Label><Input id="d-deadline" type="date" value={form.deadline} onChange={set("deadline")} /></div>
            <div className="space-y-1.5"><Label htmlFor="d-kpi">Related KPI / project</Label><Input id="d-kpi" value={form.kpi} onChange={set("kpi")} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="d-info">Additional information</Label><Textarea id="d-info" value={form.info} onChange={set("info")} /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="secondary" disabled={saving} onClick={() => submit(true)}>Save Draft</Button>
          <Button disabled={saving} onClick={() => submit(false)}>{saving ? "Saving…" : "Create Decision"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
