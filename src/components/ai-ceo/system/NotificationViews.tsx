import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Archive, Bell, Eye, EyeOff, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SeverityBadge, Unavailable } from "@/components/ai-ceo/governance/shared";
import { useNotifications, type Notif, type NotifCategory } from "./notifications";

const CATS: NotifCategory[] = ["Critical", "Risk", "Approval", "Decision", "Task", "Agent", "Automation", "Research", "Knowledge", "System"];

function Card({ n, read, onOpen, compact }: { n: Notif; read: boolean; onOpen: () => void; compact?: boolean }) {
  return (
    <button onClick={onOpen} className={cn("w-full rounded-xl border p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", read ? "border-border bg-surface/40" : "border-primary/30 bg-primary/5")}>
      <div className="flex items-start gap-2">
        {!read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] uppercase tracking-wider text-muted-foreground">{n.category}</span><SeverityBadge level={n.severity} />{n.escalated && <span className="text-[10px] font-semibold text-destructive">ESCALATED</span>}</div>
          <p className={cn("mt-1 text-sm", !read && "font-semibold")}>{n.title}</p>
          {!compact && <p className="line-clamp-2 text-xs text-muted-foreground">{n.summary}</p>}
          <p className="mt-1 text-[10px] text-muted-foreground">{n.source} · {n.module}{n.at ? ` · ${new Date(n.at).toLocaleString()}` : ""}</p>
        </div>
      </div>
    </button>
  );
}

export function NotificationDetail({ n, onClose }: { n: Notif | null; onClose: () => void }) {
  const { state, setRead, setArchived } = useNotifications();
  if (!n) return null;
  const read = state.read.includes(n.id); const archived = state.archived.includes(n.id);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{n.title}</DialogTitle><DialogDescription>{n.category} · {n.source} · {n.module}</DialogDescription></DialogHeader>
        <div className="space-y-3 text-sm"><div className="flex gap-2"><SeverityBadge level={n.severity} />{n.escalated && <span className="text-xs text-destructive">Escalated</span>}</div><p className="text-muted-foreground">{n.summary}</p>{n.at && <p className="text-xs text-muted-foreground">{new Date(n.at).toLocaleString()}</p>}</div>
        <div className="flex flex-wrap gap-2">
          <Button asChild onClick={onClose}><a href={n.to}>{n.action}</a></Button>
          <Button variant="outline" onClick={() => setRead(n.id, !read)}>{read ? "Mark unread" : "Mark read"}</Button>
          <Button variant="ghost" onClick={() => { setArchived(n.id, !archived); onClose(); }}>{archived ? "Unarchive" : "Archive"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function NotificationDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { all, state, setRead, markAllRead, unread } = useNotifications();
  const [detail, setDetail] = useState<Notif | null>(null);
  const list = all.filter((n) => !state.archived.includes(n.id)).slice(0, 15);
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle>Notifications</SheetTitle><SheetDescription>{unread} unread · derived from your operational record</SheetDescription></SheetHeader>
          <div className="my-3 flex justify-between"><Button size="sm" variant="ghost" onClick={markAllRead}>Mark all read</Button><Button asChild size="sm" variant="outline" onClick={() => onOpenChange(false)}><Link to="/ai-ceo/notifications">Open Notification Center</Link></Button></div>
          <div className="space-y-2">{list.length === 0 ? <Unavailable>You're all caught up.</Unavailable> : list.map((n) => <Card key={n.id} n={n} compact read={state.read.includes(n.id)} onOpen={() => { setRead(n.id, true); setDetail(n); }} />)}</div>
        </SheetContent>
      </Sheet>
      <NotificationDetail n={detail} onClose={() => setDetail(null)} />
    </>
  );
}

export function NotificationCenter() {
  const { all, state, setRead, setArchived, markAllRead, unread } = useNotifications();
  const [q, setQ] = useState(""); const [cat, setCat] = useState<string>("all"); const [view, setView] = useState<"inbox" | "unread" | "archived">("inbox");
  const [detail, setDetail] = useState<Notif | null>(null);
  const list = all.filter((n) => view === "archived" ? state.archived.includes(n.id) : !state.archived.includes(n.id))
    .filter((n) => view !== "unread" || !state.read.includes(n.id))
    .filter((n) => cat === "all" || n.category === cat)
    .filter((n) => !q || `${n.title} ${n.summary}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <PageShell>
      <section className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Bell className="h-3.5 w-3.5" /> Founder AI · System</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Notification Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">{unread} unread. Alerts are derived from your operational record; delivery (email, push) isn't connected yet.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={markAllRead}>Mark all read</Button><Button asChild variant="ghost"><Link to="/ai-ceo/settings" hash="notifications">Preferences</Link></Button></div>
      </section>
      <div className="flex flex-wrap gap-2">
        {(["inbox", "unread", "archived"] as const).map((v) => <Button key={v} size="sm" variant={view === v ? "default" : "outline"} onClick={() => setView(v)} className="capitalize">{v}</Button>)}
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3"><Search className="h-3.5 w-3.5 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications..." aria-label="Search notifications" className="h-9 border-0 bg-transparent px-0 focus-visible:ring-0" /></div>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">{["all", ...CATS].map((c) => <button key={c} onClick={() => setCat(c)} className={cn("rounded-full border px-2.5 py-1 text-[11px]", cat === c ? "border-primary bg-primary/15 text-primary-glow" : "border-border text-muted-foreground")}>{c === "all" ? "All" : c} {c !== "all" && `(${all.filter((n) => n.category === c && !state.archived.includes(n.id)).length})`}</button>)}</div>
      <div className="space-y-2">{list.length === 0 ? <Unavailable>No notifications in this view.</Unavailable> : list.map((n) => (
        <div key={n.id} className="flex gap-2"><div className="flex-1"><Card n={n} read={state.read.includes(n.id)} onOpen={() => { setRead(n.id, true); setDetail(n); }} /></div>
          <div className="flex flex-col gap-1"><Button size="icon" variant="ghost" aria-label={state.read.includes(n.id) ? "Mark unread" : "Mark read"} onClick={() => setRead(n.id, !state.read.includes(n.id))}>{state.read.includes(n.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
            <Button size="icon" variant="ghost" aria-label={view === "archived" ? "Unarchive" : "Archive"} onClick={() => setArchived(n.id, view !== "archived")}><Archive className="h-4 w-4" /></Button></div></div>))}</div>
      <NotificationDetail n={detail} onClose={() => setDetail(null)} />
    </PageShell>
  );
}
