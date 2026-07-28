/**
 * עמוד אדמין נסתר — פניות מהאתר
 * ראוט מוצע: /lidim-9f2b  (לא מקושר משום מקום, noindex)
 *
 * הסיסמה נבדקת ב-Edge Function בצד שרת בלבד. לדפדפן אין הרשאת קריאה לטבלה,
 * כך שגם מי שיפתח את קוד המקור לא יוכל לשלוף פניות.
 */

import { useEffect, useMemo, useState } from "react";
import { Lock, RefreshCw, Search, LogOut, Phone, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const ADMIN_ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-leads`;

type Lead = {
  id: string;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  amount: string | null;
  message: string | null;
  source: string;
  status: "new" | "contacted" | "done" | "archived";
};

const STATUS: Record<Lead["status"], { label: string; cls: string }> = {
  new:       { label: "חדש",    cls: "border-gold/30 bg-gold/10 text-gold-2" },
  contacted: { label: "בטיפול", cls: "border-sky-400/30 bg-sky-400/10 text-sky-300" },
  done:      { label: "נסגר",   cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  archived:  { label: "בארכיון", cls: "border-[hsl(var(--line))] bg-fg/5 text-mu2" },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function Admin() {
  const { toast } = useToast();
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Lead["status"]>("all");

  /* חוסם אינדוקס של העמוד במנועי חיפוש */
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = "ניהול פניות";
    return () => { document.head.removeChild(meta); document.title = prevTitle; };
  }, []);

  async function call(payload: Record<string, unknown>) {
    const res = await fetch(ADMIN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw, ...payload }),
    });
    if (res.status === 401) throw new Error("סיסמה שגויה");
    if (!res.ok) throw new Error("שגיאת שרת");
    return res.json();
  }

  async function load(isLogin = false) {
    setBusy(true);
    try {
      const { leads } = await call({});
      setLeads(leads ?? []);
      setAuthed(true);
    } catch (e) {
      if (isLogin) toast({ title: (e as Error).message, variant: "destructive" });
      else toast({ title: "הרענון לא הצליח", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id: string, status: Lead["status"]) {
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    try {
      await call({ action: "set_status", id, status });
    } catch {
      setLeads(prev);
      toast({ title: "העדכון לא נשמר", variant: "destructive" });
    }
  }

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads
      .filter((l) => filter === "all" || l.status === filter)
      .filter((l) =>
        !needle ||
        [l.name, l.phone, l.email, l.amount, l.message].some((v) => v?.toLowerCase().includes(needle)),
      );
  }, [leads, q, filter]);

  const counts = useMemo(
    () => ({
      total: leads.length,
      new: leads.filter((l) => l.status === "new").length,
    }),
    [leads],
  );

  /* ── מסך סיסמה ── */
  if (!authed) {
    return (
      <div dir="rtl" className="grid min-h-[100dvh] place-items-center bg-bg px-6 font-sans text-fg">
        <form
          onSubmit={(e) => { e.preventDefault(); if (pw) load(true); }}
          className="w-full max-w-sm rounded-3xl border border-[hsl(var(--line))] bg-s1 p-9"
        >
          <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-gold/20 bg-gold/[0.07]">
            <Lock className="h-6 w-6 text-gold" strokeWidth={1.8} />
          </div>
          <h1 className="text-center font-display text-2xl font-extrabold tracking-[-0.03em]">ניהול פניות</h1>
          <p className="mt-2 text-center text-sm font-light text-mu">אזור מוגן. נדרשת סיסמה.</p>

          <Label htmlFor="pw" className="mb-2.5 mt-8 block text-[13px] font-medium text-mu">סיסמה</Label>
          <Input
            id="pw"
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••"
            className="h-auto w-full rounded-2xl border-[hsl(var(--line))] bg-bg/70 px-[17px] py-[15px] text-center text-lg tracking-[0.3em] text-fg placeholder:text-mu2 focus-visible:border-gold focus-visible:ring-4 focus-visible:ring-gold/[0.12] focus-visible:ring-offset-0"
          />

          <Button
            type="submit"
            disabled={busy || !pw}
            className="mt-5 h-auto w-full rounded-full bg-[linear-gradient(120deg,hsl(var(--gold-2)),hsl(var(--gold))_55%,hsl(var(--gold-3)))] py-3.5 font-display text-base font-semibold text-[#100C02] transition hover:opacity-95"
          >
            {busy ? "בודק…" : "כניסה"}
          </Button>
        </form>
      </div>
    );
  }

  /* ── לוח הפניות ── */
  return (
    <div dir="rtl" className="min-h-[100dvh] bg-bg px-[clamp(1rem,4vw,3rem)] py-8 font-sans text-fg">
      <div className="mx-auto w-full max-w-[1240px]">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-[-0.03em]">פניות מהאתר</h1>
            <p className="mt-1.5 text-sm font-light text-mu">
              <span className="tabular-nums">{counts.total}</span> פניות · <span className="tabular-nums">{counts.new}</span> חדשות
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button
              onClick={() => load()}
              disabled={busy}
              variant="outline"
              className="h-auto gap-2 rounded-full border-[hsl(var(--line))] bg-transparent px-5 py-2.5 text-sm text-fg hover:border-gold hover:bg-transparent hover:text-gold-2"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> רענון
            </Button>
            <Button
              onClick={() => { setAuthed(false); setPw(""); setLeads([]); }}
              variant="outline"
              className="h-auto gap-2 rounded-full border-[hsl(var(--line))] bg-transparent px-5 py-2.5 text-sm text-mu hover:border-gold hover:bg-transparent hover:text-gold-2"
            >
              <LogOut className="h-4 w-4" /> יציאה
            </Button>
          </div>
        </header>

        <div className="mt-7 flex flex-wrap gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mu2" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="חיפוש בשם, טלפון, אימייל או הודעה"
              className="h-auto w-full rounded-2xl border-[hsl(var(--line))] bg-s1 py-3 pe-11 ps-4 text-[15px] text-fg placeholder:text-mu2 focus-visible:border-gold focus-visible:ring-4 focus-visible:ring-gold/[0.12] focus-visible:ring-offset-0"
            />
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger dir="rtl" className="h-auto w-[170px] rounded-2xl border-[hsl(var(--line))] bg-s1 px-4 py-3 text-[15px] text-fg [&>svg]:text-gold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl" className="rounded-2xl border-[hsl(var(--line))] bg-s2 text-fg">
              <SelectItem value="all">הכול</SelectItem>
              <SelectItem value="new">חדש</SelectItem>
              <SelectItem value="contacted">בטיפול</SelectItem>
              <SelectItem value="done">נסגר</SelectItem>
              <SelectItem value="archived">בארכיון</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {shown.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-3xl border border-[hsl(var(--line))] bg-s1 px-6 py-20 text-center">
            <AlertCircle className="mb-4 h-8 w-8 text-mu2" strokeWidth={1.5} />
            <p className="font-light text-mu">{leads.length === 0 ? "עוד לא הגיעו פניות." : "אין תוצאות לחיפוש הזה."}</p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-[hsl(var(--line))]">
            <table className="w-full min-w-[900px] border-collapse text-start">
              <thead>
                <tr className="bg-s2 text-[13px] font-medium text-mu2">
                  <th className="p-4 text-start font-medium">תאריך</th>
                  <th className="p-4 text-start font-medium">שם</th>
                  <th className="p-4 text-start font-medium">יצירת קשר</th>
                  <th className="p-4 text-start font-medium">סכום</th>
                  <th className="p-4 text-start font-medium">הודעה</th>
                  <th className="p-4 text-start font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.id} className="border-t border-[hsl(var(--line))] bg-s1 align-top transition-colors hover:bg-s2">
                    <td className="whitespace-nowrap p-4 text-[13px] tabular-nums text-mu2">{fmtDate(l.created_at)}</td>
                    <td className="p-4 text-[15px] font-medium">{l.name}</td>
                    <td className="p-4">
                      <a href={`tel:${l.phone}`} className="flex items-center gap-2 text-[14px] text-mu transition-colors hover:text-gold-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.8} />
                        <span dir="ltr">{l.phone}</span>
                      </a>
                      <a href={`mailto:${l.email}`} className="mt-1.5 flex items-center gap-2 text-[14px] text-mu transition-colors hover:text-gold-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.8} />
                        <span dir="ltr">{l.email}</span>
                      </a>
                    </td>
                    <td className="whitespace-nowrap p-4 text-[14px] text-mu">{l.amount || "—"}</td>
                    <td className="max-w-[320px] p-4 text-[14px] font-light leading-relaxed text-mu">{l.message || "—"}</td>
                    <td className="p-4">
                      <select
                        value={l.status}
                        onChange={(e) => setStatus(l.id, e.target.value as Lead["status"])}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-[12.5px] font-semibold outline-none ${STATUS[l.status].cls}`}
                      >
                        {(Object.keys(STATUS) as Lead["status"][]).map((s) => (
                          <option key={s} value={s} className="bg-s2 text-fg">{STATUS[s].label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
