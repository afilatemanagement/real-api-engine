import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, ArrowUp, FileSearch, MessageSquare, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Paperclip, Pencil, Plus, RotateCcw, Search, Square, ThumbsDown, ThumbsUp, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useCEOData } from "@/hooks/useCEOData";
import { dataSourceStatus } from "@/components/ai-ceo/DataSourceStatus";
import { cn } from "@/lib/utils";
import { answer, type Citation } from "./engine";
import { createThread, dayBucket, useThreads, type ChatMessage, type Thread } from "./store";

const SUGGESTED = [
  "Give me today's operational overview", "What requires my attention?", "Explain recent performance changes",
  "What risks are emerging?", "Summarize recent decisions", "What should I review today?", "Show important operational trends",
];
const SCOPES = ["Company", "Operations", "Sales Operations", "Customer Operations", "Marketplace Operations", "Finance Operations", "Support Operations", "Product Operations", "Risk & Compliance", "Performance"];

export function ChatWorkspace({ threadId }: { threadId: string }) {
  const navigate = useNavigate();
  const { data, isPersisted } = useCEOData();
  const { threads, update, remove } = useThreads();
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileLeft, setMobileLeft] = useState(false);
  const [mobileRight, setMobileRight] = useState(false);
  const [q, setQ] = useState("");
  const [renaming, setRenaming] = useState<Thread | null>(null);
  const [deleting, setDeleting] = useState<Thread | null>(null);
  const [citation, setCitation] = useState<Citation | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLoaded(true); }, []);
  const thread = threads.find((t) => t.id === threadId);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [thread?.messages.length, pending]);
  useEffect(() => { inputRef.current?.focus(); }, [threadId, pending]);

  const visible = threads.filter((t) => !t.archived).filter((t) => !q || `${t.title} ${t.messages.map((m) => m.text).join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  const grouped = useMemo(() => {
    const g: Record<string, Thread[]> = {};
    visible.forEach((t) => { (g[dayBucket(t.updatedAt)] ??= []).push(t); });
    return g;
  }, [visible]);

  const respond = (question: string) => {
    setPending(true);
    timer.current = setTimeout(() => {
      const a = answer(question, data, thread?.context);
      update(threadId, (t) => ({ ...t, messages: [...t.messages, { id: `m${Date.now()}`, role: "assistant", text: a.summary, answer: a, status: "completed", at: new Date().toISOString() }] }));
      setPending(false);
    }, 650);
  };
  const send = (value = text) => {
    const v = value.trim().slice(0, 4000);
    if (!v || pending || !thread) return;
    const msg: ChatMessage = { id: `m${Date.now()}`, role: "user", text: v, at: new Date().toISOString(), ...(attachments.length ? { attachments } : {}) };
    update(threadId, (t) => ({ ...t, title: t.messages.length ? t.title : v.slice(0, 60), messages: [...t.messages, msg] }));
    setText(""); setAttachments([]);
    respond(v);
  };
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    setPending(false);
    update(threadId, (t) => ({ ...t, messages: [...t.messages, { id: `m${Date.now()}`, role: "assistant", text: "Response stopped.", status: "interrupted", at: new Date().toISOString() }] }));
  };
  const retry = () => {
    const lastUser = [...(thread?.messages ?? [])].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    update(threadId, (t) => ({ ...t, messages: t.messages.filter((m) => m.status !== "interrupted" && m.status !== "failed") }));
    respond(lastUser.text);
  };
  const newChat = () => { const t = createThread(); void navigate({ to: "/ai-ceo/chat/$threadId", params: { threadId: t.id } }); setMobileLeft(false); };

  const related = thread?.context ? answer(thread.context, data).citations : [];

  const history = (
    <div className="flex h-full flex-col gap-3">
      <Button onClick={newChat} size="sm"><Plus className="h-4 w-4" /> New Chat</Button>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2.5">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search conversations..." aria-label="Search conversations" className="h-8 border-0 bg-transparent px-0 text-xs focus-visible:ring-0" />
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {visible.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">{q ? "No conversations found." : "No conversations yet."}</p>}
        {["Today", "Yesterday", "This Week", "Earlier"].map((b) => grouped[b] && (
          <div key={b}>
            <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{b}</p>
            <ul className="space-y-0.5">
              {grouped[b].map((t) => (
                <li key={t.id} className={cn("group flex items-center rounded-lg", t.id === threadId ? "bg-primary/15" : "hover:bg-muted/40")}>
                  <Link to="/ai-ceo/chat/$threadId" params={{ threadId: t.id }} onClick={() => setMobileLeft(false)} className="min-w-0 flex-1 px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                    <p className="truncate text-sm">{t.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{t.context ? `${t.context} · ` : ""}{t.messages.at(-1)?.text ?? "Empty"}</p>
                  </Link>
                  <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <button className="p-1 text-muted-foreground hover:text-foreground" aria-label={`Rename ${t.title}`} onClick={() => setRenaming(t)}><Pencil className="h-3 w-3" /></button>
                    <button className="p-1 text-muted-foreground hover:text-foreground" aria-label={`Archive ${t.title}`} onClick={() => { update(t.id, (x) => ({ ...x, archived: true })); toast.success("Conversation archived"); }}><Archive className="h-3 w-3" /></button>
                    <button className="p-1 text-muted-foreground hover:text-destructive" aria-label={`Delete ${t.title}`} onClick={() => setDeleting(t)}><Trash2 className="h-3 w-3" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );

  const inspector = (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-muted-foreground">This conversation uses on-record Founder AI data ({dataSourceStatus(isPersisted, "operational data")}). Answers cite their sources.</p>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Business area</p>
        <Select value={thread?.context ?? "none"} onValueChange={(v) => update(threadId, (t) => { const { context: _c, ...rest } = t; return v === "none" ? rest : { ...rest, context: v }; })}>
          <SelectTrigger className="mt-1 h-9" aria-label="Change context"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="none">No specific context</SelectItem>{[...new Set([...SCOPES, ...(thread?.context ? [thread.context] : [])])].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Relevant records</p>
        {related.length ? <ul className="mt-1 space-y-1.5">{related.map((c) => <li key={c.type + c.id}><button onClick={() => navigate({ href: c.href })} className="text-left text-primary-glow hover:underline">{c.type}: {c.title}</button></li>)}</ul> : <p className="mt-1 text-xs text-muted-foreground">Pick a context to see the KPIs, insights, decisions and risks it covers.</p>}
      </div>
      <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Time period</p><p className="mt-1 text-xs">Current operating period</p></div>
    </div>
  );

  if (loaded && !thread) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Conversation not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">It may have been deleted or saved in another browser.</p>
        <Button className="mt-5" onClick={newChat}><Plus className="h-4 w-4" /> New Chat</Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-0">
      {leftOpen && <aside className="hidden w-[260px] shrink-0 border-r border-border p-3 lg:block" aria-label="Conversation history">{history}</aside>}

      <section className="flex min-w-0 flex-1 flex-col" aria-label="Conversation">
        <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <button className="hidden rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:block" onClick={() => setLeftOpen((o) => !o)} aria-label={leftOpen ? "Collapse history" : "Expand history"}>{leftOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</button>
          <button className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground lg:hidden" onClick={() => setMobileLeft(true)} aria-label="Open history"><PanelLeftOpen className="h-4 w-4" /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold">Ask Founder AI</h1>
            <p className="truncate text-xs text-muted-foreground">Operational intelligence for your company · {pending ? "Analyzing" : "Ready"}</p>
          </div>
          {thread?.context && (
            <span className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs">
              <button className="truncate" onClick={() => (window.innerWidth < 1280 ? setMobileRight(true) : setRightOpen(true))}>{thread.context}</button>
              <button aria-label="Remove context" onClick={() => update(threadId, (t) => { const { context: _c, ...rest } = t; return rest; })}><X className="h-3 w-3" /></button>
            </span>
          )}
          <Button size="sm" variant="outline" onClick={newChat}><Plus className="h-4 w-4" /> New Chat</Button>
          <button className="hidden rounded-lg p-1.5 text-muted-foreground hover:text-foreground xl:block" onClick={() => setRightOpen((o) => !o)} aria-label={rightOpen ? "Collapse context" : "Expand context"}>{rightOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}</button>
          <button className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground xl:hidden" onClick={() => setMobileRight(true)} aria-label="Open context"><PanelRightOpen className="h-4 w-4" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6" aria-live="polite">
          <div className="mx-auto max-w-3xl space-y-5">
            {thread && thread.messages.length === 0 && !pending && (
              <div className="py-10 text-center">
                <h2 className="text-xl font-semibold">What would you like to understand?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Answers are built from your on-record operational data, with sources.</p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTED.map((s) => <Button key={s} size="sm" variant="outline" className="rounded-full" onClick={() => send(s)}>{s}</Button>)}
                </div>
              </div>
            )}
            {thread?.messages.map((m) => m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.attachments && <p className="mt-1 text-[11px] opacity-80">Attached: {m.attachments.join(", ")} (not read — attachments connect later)</p>}
                </div>
              </div>
            ) : (
              <article key={m.id} className="space-y-3 text-sm">
                {m.status === "interrupted" ? (
                  <div className="flex items-center gap-2 text-muted-foreground">{m.text}<Button size="sm" variant="ghost" onClick={retry}><RotateCcw className="h-3.5 w-3.5" /> Retry</Button></div>
                ) : m.answer && (
                  <>
                    <p className="font-medium">{m.answer.summary}</p>
                    {m.answer.findings.length > 0 && (
                      <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Key findings</p>
                        <ul className="mt-1 space-y-1.5">{m.answer.findings.map((f, i) => <li key={i} className="text-muted-foreground">• {f}{m.answer?.citations[i] && <button onClick={() => setCitation(m.answer?.citations[i] ?? null)} className="ml-1 rounded border border-border px-1 text-[10px] text-primary-glow hover:border-primary/50" aria-label={`Source ${i + 1}`}>[{i + 1}]</button>}</li>)}</ul>
                      </div>
                    )}
                    {m.answer.citations.length > 0 && <p className="inline-flex items-center gap-1 text-xs text-muted-foreground"><FileSearch className="h-3.5 w-3.5" /> {m.answer.citations.length} source{m.answer.citations.length > 1 ? "s" : ""} · {dataSourceStatus(isPersisted, "operational data")}</p>}
                    <div className="flex flex-wrap gap-2">
                      {m.answer.next.map((n) => <Button key={n.label} size="sm" variant="secondary" onClick={() => navigate({ href: n.href })}>{n.label}</Button>)}
                    </div>
                    <div className="flex gap-1">
                      <button aria-label="Helpful" aria-pressed={m.feedback === "up"} className={cn("rounded p-1", m.feedback === "up" ? "text-accent-emerald" : "text-muted-foreground hover:text-foreground")} onClick={() => { update(threadId, (t) => ({ ...t, messages: t.messages.map((x) => x.id === m.id ? { ...x, feedback: "up" } : x) })); toast.success("Thanks for the feedback"); }}><ThumbsUp className="h-3.5 w-3.5" /></button>
                      <button aria-label="Not helpful" aria-pressed={m.feedback === "down"} className={cn("rounded p-1", m.feedback === "down" ? "text-destructive" : "text-muted-foreground hover:text-foreground")} onClick={() => { update(threadId, (t) => ({ ...t, messages: t.messages.map((x) => x.id === m.id ? { ...x, feedback: "down" } : x) })); toast.success("Feedback noted"); }}><ThumbsDown className="h-3.5 w-3.5" /></button>
                    </div>
                  </>
                )}
              </article>
            ))}
            {pending && <p className="animate-pulse text-sm text-muted-foreground" role="status">Analyzing operational data…</p>}
            <div ref={endRef} />
          </div>
        </div>

        <div className="border-t border-border p-3">
          <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface p-2 focus-within:border-primary/50">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1 px-1 pb-2">{attachments.map((a) => <span key={a} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs">{a}<button aria-label={`Remove ${a}`} onClick={() => setAttachments((x) => x.filter((y) => y !== a))}><X className="h-3 w-3" /></button></span>)}</div>
            )}
            <Textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Ask about operations, risks, decisions, performance…" aria-label="Message Founder AI"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="min-h-[48px] resize-none border-0 bg-transparent focus-visible:ring-0" />
            <div className="flex items-center gap-2 px-1">
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => { const names = Array.from(e.target.files ?? []).map((f) => f.name).slice(0, 5); setAttachments((a) => [...new Set([...a, ...names])]); e.target.value = ""; }} />
              <Button size="icon" variant="ghost" aria-label="Attach files" onClick={() => fileRef.current?.click()}><Paperclip className="h-4 w-4" /></Button>
              <span className="hidden text-[11px] text-muted-foreground sm:inline">Enter to send · Shift+Enter for a new line</span>
              {pending
                ? <Button size="icon" className="ml-auto" variant="secondary" onClick={stop} aria-label="Stop"><Square className="h-4 w-4" /></Button>
                : <Button size="icon" className="ml-auto" onClick={() => send()} disabled={!text.trim()} aria-label="Send"><ArrowUp className="h-4 w-4" /></Button>}
            </div>
          </div>
        </div>
      </section>

      {rightOpen && <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-border p-4 xl:block" aria-label="Current context"><h2 className="mb-3 text-sm font-semibold">Current Context</h2>{inspector}</aside>}

      <Sheet open={mobileLeft} onOpenChange={setMobileLeft}><SheetContent side="left" className="w-[290px]"><SheetHeader><SheetTitle>Conversations</SheetTitle></SheetHeader><div className="mt-4 h-[calc(100%-3rem)]">{history}</div></SheetContent></Sheet>
      <Sheet open={mobileRight} onOpenChange={setMobileRight}><SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto"><SheetHeader><SheetTitle>Current Context</SheetTitle></SheetHeader><div className="mt-4">{inspector}</div></SheetContent></Sheet>
      <Sheet open={!!citation} onOpenChange={(o) => !o && setCitation(null)}>
        <SheetContent>{citation && <><SheetHeader><SheetTitle>{citation.type}: {citation.title}</SheetTitle></SheetHeader><p className="mt-4 text-sm text-muted-foreground">{citation.detail}</p><p className="mt-2 text-xs text-muted-foreground">{dataSourceStatus(isPersisted, "operational data")}</p><Button className="mt-4" onClick={() => navigate({ href: citation.href })}>Open source</Button></>}</SheetContent>
      </Sheet>

      <RenameDialog thread={renaming} onClose={() => setRenaming(null)} onSave={(title) => renaming && update(renaming.id, (t) => ({ ...t, title }))} />
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete conversation?</DialogTitle><DialogDescription>“{deleting?.title}” will be removed from this browser. This can't be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={() => { if (!deleting) return; remove(deleting.id); const wasActive = deleting.id === threadId; setDeleting(null); if (wasActive) newChat(); }}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RenameDialog({ thread, onClose, onSave }: { thread: Thread | null; onClose: () => void; onSave: (t: string) => void }) {
  const [v, setV] = useState("");
  useEffect(() => { setV(thread?.title ?? ""); }, [thread]);
  return (
    <Dialog open={!!thread} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Rename conversation</DialogTitle></DialogHeader>
        <Input value={v} onChange={(e) => setV(e.target.value)} maxLength={80} aria-label="Conversation title" onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) { onSave(v.trim()); onClose(); } }} />
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!v.trim()} onClick={() => { onSave(v.trim()); onClose(); }}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
