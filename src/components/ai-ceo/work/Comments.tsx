import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Unavailable } from "@/components/ai-ceo/governance/shared";
import { MENTIONABLE, wid, type Comment } from "./store";

/** Comments with @mentions. Mentions are highlighted only — no notifications are sent (NOTIFICATIONS_API_REQUIRED). */
export function Comments({ comments, onAdd }: { comments: Comment[]; onAdd: (c: Comment) => void }) {
  const [text, setText] = useState("");
  const m = /@([\w ]*)$/.exec(text);
  const suggestions = m ? MENTIONABLE.filter((n) => n.toLowerCase().startsWith((m[1] ?? "").toLowerCase())) : [];
  const render = (t: string) => t.split(/(@(?:[A-Z][\w]*(?: [A-Z][\w]*)*))/g).map((p, i) => p.startsWith("@") ? <span key={i} className="rounded bg-primary/15 px-1 text-primary-glow">{p}</span> : p);
  return (
    <div className="space-y-3">
      {comments.length === 0 ? <Unavailable>No comments yet.</Unavailable> : <ul className="space-y-2">{comments.map((c) => (
        <li key={c.id} className="rounded-lg border border-border p-2 text-xs"><p className="text-[10px] text-muted-foreground">{c.author} · {new Date(c.at).toLocaleString()}</p><p className="mt-1 text-foreground">{render(c.text)}</p></li>))}</ul>}
      <div className="relative">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Comment — type @ to mention" aria-label="Add comment" />
        {suggestions.length > 0 && <ul className="absolute z-10 mt-1 w-64 rounded-lg border border-border bg-popover p-1 text-xs shadow">{suggestions.map((n) => (
          <li key={n}><button type="button" className="w-full rounded px-2 py-1 text-left hover:bg-muted" onClick={() => setText(text.replace(/@[\w ]*$/, `@${n} `))}>{n}</button></li>))}</ul>}
      </div>
      <div className="flex items-center justify-between"><p className="text-[10px] text-muted-foreground">Mentions don't send notifications yet.</p>
        <Button size="sm" disabled={!text.trim()} onClick={() => { onAdd({ id: wid("c"), at: new Date().toISOString(), author: "Founder", text: text.trim() }); setText(""); }}>Comment</Button></div>
    </div>
  );
}
