/**
 * דף נחיתה — צחי בוזגלו, ייעוץ השקעות
 * React + Tailwind + shadcn/ui + lucide-react · RTL מלא
 *
 * ── index.html <head> ──────────────────────────────────────────────────────
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 * <link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800;900&family=Assistant:wght@200;300;400;500;600;700&display=swap" rel="stylesheet">
 * ועל תגית <html>: dir="rtl" lang="he"
 *
 * ── src/index.css (בתוך @layer base) ───────────────────────────────────────
 * :root{
 *   --bg:220 33% 4%;  --s1:220 26% 7%;  --s2:222 34% 11%;  --s3:220 30% 14%;
 *   --gold:43 84% 61%;  --gold-2:44 100% 83%;  --gold-3:42 73% 44%;
 *   --fg:44 20% 94%;  --mu:222 11% 60%;  --mu2:222 12% 41%;
 *   --line:44 20% 94% / .09;  --line-gold:43 84% 61% / .22;
 * }
 * body{ background:hsl(var(--bg)); color:hsl(var(--fg)); font-family:Assistant,system-ui,sans-serif }
 * @keyframes marquee{ to{ transform:translateX(50%) } }
 *
 * ── tailwind.config.ts → theme.extend ──────────────────────────────────────
 * colors:{ bg:"hsl(var(--bg))", s1:"hsl(var(--s1))", s2:"hsl(var(--s2))", s3:"hsl(var(--s3))",
 *          gold:"hsl(var(--gold))", "gold-2":"hsl(var(--gold-2))", "gold-3":"hsl(var(--gold-3))",
 *          fg:"hsl(var(--fg))", mu:"hsl(var(--mu))", mu2:"hsl(var(--mu2))" }
 * fontFamily:{ sans:["Assistant","system-ui","sans-serif"], display:["Rubik","system-ui","sans-serif"] }
 * animation:{ marquee:"marquee 40s linear infinite" }
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  TrendingUp, Building2, PiggyBank, Clock3, ShieldCheck, Receipt,
  ArrowLeft, Check, Star, Mail, Phone, ChevronDown, LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";

/** נקודת הקצה לשליחת הליד — Supabase Edge Function עם Resend. */
const LEAD_ENDPOINT = "/functions/v1/send-lead";

/* ═══════════════════════════ עזרים ═══════════════════════════ */

function useInView<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } },
      { threshold, rootMargin: "0px 0px -40px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] ${seen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.6);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 1500, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);
  return <span ref={ref} className="tabular-nums">{n.toLocaleString("he-IL")}{suffix}</span>;
}

const Tag = ({ children }: { children: ReactNode }) => (
  <p className="mb-5 flex items-center gap-3 font-display text-[12.5px] font-medium tracking-[0.2em] text-gold">
    <span className="h-px w-9 bg-gradient-to-l from-gold to-transparent" />
    {children}
  </p>
);

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="font-display text-[clamp(2.1rem,5vw,4.1rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">{children}</h2>
);

const H3 = ({ children }: { children: ReactNode }) => (
  <h3 className="font-display text-[clamp(1.35rem,2.2vw,1.75rem)] font-bold leading-[1.15] tracking-[-0.02em]">{children}</h3>
);

const Body = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[15.8px] font-light leading-[1.8] text-mu ${className}`}>{children}</p>
);

const Lead = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <p className={`text-[clamp(1.06rem,1.5vw,1.32rem)] font-light leading-[1.72] text-mu ${className}`}>{children}</p>
);

const goldBtn =
  "h-auto gap-2.5 rounded-full bg-[linear-gradient(120deg,hsl(var(--gold-2)),hsl(var(--gold))_55%,hsl(var(--gold-3)))] px-8 py-4 font-display text-base font-semibold tracking-[-0.01em] text-[#100C02] shadow-[0_14px_40px_-14px_hsl(var(--gold)/0.6)] transition-all duration-500 hover:-translate-y-0.5 hover:opacity-95 hover:shadow-[0_22px_54px_-14px_hsl(var(--gold)/0.75)] [&_svg]:transition-transform [&_svg]:duration-500 hover:[&_svg]:-translate-x-1.5";

/* ═══════════════════════════ תוכן ═══════════════════════════ */

const NAV = [
  { href: "#why", label: "למה עכשיו" },
  { href: "#tracks", label: "מסלולים" },
  { href: "#how", label: "איך זה עובד" },
  { href: "#about", label: "על צחי" },
  { href: "#faq", label: "שאלות" },
];

const METRICS = [
  { to: 12, suffix: "", label: "שנות ניסיון בשוק" },
  { to: 1400, suffix: "+", label: "תיקים אישיים שנבנו" },
  { to: 94, suffix: "%", label: "ממשיכים לשנה שנייה" },
  { to: 30, suffix: " דק׳", label: "לשיחת האבחון הראשונה" },
];

const MARQUEE = ["שוק ההון", "קרנות מחקות", "נדל״ן מניב", "קרן השתלמות", "תכנון מס", "השקעות אלטרנטיביות", "פנסיה חכמה"];

const PAINS = [
  { idx: "01 / שחיקה", t: "האינפלציה גובה שכר דירה", d: "100,000 ש״ח שיושבים בעו״ש חמש שנים שווים היום פחות ממה שהיו שווים ביום שהופקדו. השחיקה שקטה, אבל היא מדויקת." },
  { idx: "02 / שיתוק", t: "יותר מדי אפשרויות, אפס בחירה", d: "מדדים, קרנות, נדל״ן, קריפטו, פיקדונות. כל כיוון נשמע הגיוני, וזה בדיוק מה שמשתק. בסוף הכסף נשאר איפה שהיה." },
  { idx: "03 / רעש", t: "עצות מכולם, תוכנית מאף אחד", d: "בבנק מוכרים מוצר. חבר מספר סיפור הצלחה. אף אחד מהם לא ראה את המספרים שלך, את המשפחה שלך ואת מה שבאמת מדיר שינה." },
];

const TRACKS = [
  { n: "01", icon: TrendingUp, t: "שוק ההון ומדדים", d: "תיק מבוזר על מדדים גלובליים, עם דמי ניהול נמוכים ואסטרטגיה שלא מתרגשת מכותרות. הבסיס של רוב התיקים.", chip: "טווח בינוני־ארוך" },
  { n: "02", icon: Building2, t: "נדל״ן מניב", d: "בארץ ובחו״ל, לבד או בשותפות. בודקים תשואה נטו אחרי מס, ניהול ותחזוקה — לא את המספר שמופיע במודעה.", chip: "תזרים חודשי" },
  { n: "03", icon: PiggyBank, t: "קרן השתלמות ופנסיה", d: "הכסף הכי גדול שלך יושב שם, ורוב האנשים לא נגעו בו מעולם. מסלול נכון ודמי ניהול נמוכים שווים מאות אלפי שקלים.", chip: "הרווח הכי מהיר" },
  { n: "04", icon: Clock3, t: "תיק סולידי לטווח קצר", d: "כסף שמיועד לדירה, לחתונה או לרזרבה צריך להיות נזיל ובטוח — ועדיין לעבוד. יש דרכים טובות בהרבה מעו״ש.", chip: "נזילות גבוהה" },
  { n: "05", icon: ShieldCheck, t: "השקעות אלטרנטיביות", d: "קרנות חוב, אשראי חוץ־בנקאי, תשתיות. רכיב שמוסיף יציבות ותשואה — כשהוא נבחר בזהירות ובמינון הנכון.", chip: "פיזור מתקדם" },
  { n: "06", icon: Receipt, t: "תכנון מס ומשיכה חכמה", d: "לא רק כמה מרוויחים — כמה נשאר אחרי מס. מתי מושכים, ממה, ובאיזה סדר. כאן נמצאים הרווחים ששוכחים לספור.", chip: "שומרים על הרווח" },
];

const STEPS = [
  { n: "01", t: "שיחת אבחון", d: "30 דקות בזום או בטלפון. מיפוי מלא: מה יש, מה נכנס, מה מתוכנן ומה מלחיץ. בסוף השיחה כבר יש כיוון ברור — גם אם לא ממשיכים יחד.", note: "חינם · בלי התחייבות" },
  { n: "02", t: "תוכנית אישית", d: "מסמך אחד שאפשר להבין בלי תואר בכלכלה: פיזור מדויק, טווחים, תרחישים, עלויות והשלכות מס. כולל מה עושים כבר בשבוע הראשון.", note: "תוך 7 ימי עסקים" },
  { n: "03", t: "ליווי שוטף", d: "ביצוע בפועל, איזון התיק כשצריך ופגישות מעקב קבועות. וכשהשוק מתנדנד — יש למי להתקשר לפני שעושים טעות יקרה.", note: "פגישות רבעוניות" },
];

const QUOTES = [
  { av: "ד", q: "שנתיים אמרתי לעצמי ׳בחודש הבא אני מטפל בזה׳. אחרי שיחה אחת עם צחי היה לי מסמך אחד ברור, וביום שאחרי כבר ביצענו. בפעם הראשונה הרגשתי שאני מבין מה קורה עם הכסף שלי.", n: "ד׳, בת 41 · ראשון לציון", r: "עצמאית · תיק מעורב" },
  { av: "ר", q: "הגעתי בשביל שוק ההון, ובדרך גילינו שקרן ההשתלמות שלי במסלול שגוי כבר שבע שנים. התיקון הזה לבדו החזיר את עלות הליווי פי כמה.", n: "ר׳, בן 53 · חיפה", r: "שכיר · פנסיה והשתלמות" },
  { av: "א", q: "מה שאהבתי זה שצחי לא ניסה למכור לי כלום. הוא אמר לי בפירוש על מסלול אחד שהוא לא מתאים לי, למרות שהיה קל לו לומר כן. מאז אני שולח אליו חברים.", n: "א׳, בן 36 · תל אביב", r: "הייטק · השקעה ראשונה" },
];

const FAQ = [
  { q: "מאיזה סכום זה מתחיל להיות רלוונטי?", a: "אין רף כניסה קשיח. לרוב, מ־50,000 ש״ח פנויים או מקרן השתלמות פעילה כבר יש מספיק חומר לתוכנית שמשנה תוצאה. ואם עוד לא הגעת לשם — נאמר את זה בשיחה, בלי לבזבז לך זמן." },
  { q: "אפשר להבטיח שהכסף יוכפל?", a: "לא, ומי שמבטיח — כדאי לברוח ממנו. מה שכן אפשר: לבנות פיזור נכון, לצמצם עלויות ומס, ולהיצמד לתוכנית לאורך זמן. זה בדיוק מה שמייצר את הפער הגדול בין תיק לתיק לאורך שנים." },
  { q: "כמה זה עולה?", a: "שיחת האבחון חינם. אחריה יש מודל תמחור אחד, ברור וקבוע מראש — שנאמר לך בסוף השיחה, לפני שמחליטים משהו. בלי עמלות נסתרות ובלי אחוזים שצצים בהמשך." },
  { q: "צריך להעביר את הכסף לצחי?", a: "לא. הכסף נשאר בחשבונות שלך, על שמך, בשליטה מלאה שלך. הליווי הוא ייעוץ, תכנון וביצוע מול הגופים — לא ניהול הכסף בידיים שלנו." },
  { q: "כבר יש לי יועץ בבנק. מה ההבדל?", a: "ליועץ בבנק יש מדף מוצרים שהוא עובד מולו. כאן הבחירה נעשית מכל השוק, כולל אפיקים שלבנק אין אינטרס להציע. ההבדל מתגלה בדרך כלל בעמלות ובמסלולים." },
];

const AMOUNTS = ["עד 100 אלף ש״ח", "100–300 אלף ש״ח", "300–700 אלף ש״ח", "700 אלף – 2 מיליון ש״ח", "מעל 2 מיליון ש״ח", "עדיין בבירור"];

const PERKS = ["מיפוי מלא של המצב הקיים", "כיוון פעולה ברור כבר בשיחה", "בלי התחייבות ובלי עלות", "הפרטים נשארים אצלנו בלבד"];

/* ═══════════════════════════ לוגו ═══════════════════════════ */

const Logo = () => (
  <a href="#top" className="flex items-center gap-3">
    <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-gold-2 to-gold-3">
      <LineChart className="h-[17px] w-[17px] text-[#100C02]" strokeWidth={2.4} />
    </span>
    <span>
      <b className="block font-display text-[16.5px] font-bold leading-[1.15] tracking-[-0.03em]">צחי בוזגלו</b>
      <span className="block text-[10.5px] font-medium tracking-[0.22em] text-gold">ייעוץ השקעות</span>
    </span>
  </a>
);

/* ═══════════════════════════ טופס ═══════════════════════════ */

function LeadForm() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", amount: "", message: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.email.trim() || !form.amount) {
      toast({ title: "חסרים פרטים", description: "שם, טלפון, אימייל וסכום — ואפשר לשלוח.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "landing-page", sentAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("send failed");
      setSent(true);
    } catch {
      toast({
        title: "השליחה לא הושלמה",
        description: "אפשר לנסות שוב, או לכתוב ישירות למייל שבתחתית העמוד.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  const fld =
    "h-auto w-full rounded-2xl border-[hsl(var(--line))] bg-bg/70 px-[17px] py-[15px] text-base font-normal text-fg placeholder:text-mu2 transition-all duration-300 focus-visible:border-gold focus-visible:bg-bg/90 focus-visible:ring-4 focus-visible:ring-gold/[0.12] focus-visible:ring-offset-0";
  const lbl = "mb-2.5 block text-[13px] font-medium text-mu";

  if (sent) {
    return (
      <div className="bg-s2 px-[clamp(2rem,4vw,3.5rem)] py-[clamp(3rem,8vh,4.5rem)] text-center">
        <div className="mx-auto mb-7 grid h-[78px] w-[78px] place-items-center rounded-full border border-gold/20 bg-gold/[0.08]">
          <Check className="h-[34px] w-[34px] text-gold" strokeWidth={2} />
        </div>
        <H3>הפרטים התקבלו</H3>
        <Body className="mx-auto mt-3.5 max-w-[38ch]">
          צחי יחזור אליך תוך יום עסקים אחד לתיאום שיחת האבחון. בינתיים — הכסף כבר יודע שמשהו עומד להשתנות.
        </Body>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="bg-s2 px-[clamp(2rem,4vw,3.5rem)] py-[clamp(2rem,4vw,3.5rem)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="f-name" className={lbl}>שם מלא</Label>
          <Input id="f-name" value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="ישראל ישראלי" className={fld} />
        </div>
        <div>
          <Label htmlFor="f-phone" className={lbl}>טלפון</Label>
          <Input id="f-phone" type="tel" dir="ltr" inputMode="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="050-0000000" className={`${fld} text-end`} />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="f-email" className={lbl}>אימייל</Label>
        <Input id="f-email" type="email" dir="ltr" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="name@email.com" className={`${fld} text-end`} />
      </div>

      <div className="mt-4">
        <Label className={lbl}>סכום להשקעה (משוער)</Label>
        <Select value={form.amount} onValueChange={set("amount")}>
          <SelectTrigger dir="rtl" className={`${fld} flex-row-reverse justify-between [&>svg]:text-gold`}>
            <SelectValue placeholder="בחירה מהרשימה" />
          </SelectTrigger>
          <SelectContent dir="rtl" className="rounded-2xl border-[hsl(var(--line))] bg-s2 text-fg">
            {AMOUNTS.map((a) => (
              <SelectItem key={a} value={a} className="text-start focus:bg-gold/15 focus:text-gold-2">{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <Label htmlFor="f-msg" className={lbl}>מה הכי חשוב לך לפתור? (לא חובה)</Label>
        <Textarea
          id="f-msg"
          value={form.message}
          onChange={(e) => set("message")(e.target.value)}
          placeholder="למשל: יש לי כסף בעו״ש כבר שנתיים ואני לא יודע מה לעשות איתו"
          className={`${fld} min-h-[104px] resize-y leading-[1.7]`}
        />
      </div>

      <Button type="submit" disabled={busy} className={`${goldBtn} mt-6 w-full`}>
        {busy ? "שולח…" : "שליחה וקביעת שיחה"}
        {!busy && <ArrowLeft className="h-[17px] w-[17px]" />}
      </Button>

      <p className="mt-[18px] text-center text-[12.5px] leading-[1.7] text-mu2">
        בשליחה מאשרים יצירת קשר בנוגע לפנייה. הפרטים אינם מועברים לצד שלישי.
      </p>
    </form>
  );
}

/* ═══════════════════════════ העמוד ═══════════════════════════ */

export default function TzahiLanding() {
  const [solid, setSolid] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setLoaded(true));
    const onScroll = () => {
      setSolid(window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const words = ["הכסף", "שלך", "כבר", "עובד.", "\n", "השאלה", "היא", "בשביל מי"];

  return (
    <div dir="rtl" className="relative min-h-[100dvh] w-full overflow-x-hidden bg-bg font-sans text-fg antialiased selection:bg-gold selection:text-[#0B0906]">
      {/* גרעין ורשת רקע */}
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 mx-auto hidden max-w-[1280px] opacity-50 lg:block"
        style={{ backgroundImage: "linear-gradient(to left, hsl(var(--line)) 1px, transparent 1px)", backgroundSize: "calc(100% / 6) 100%" }}
      />

      {/* פס התקדמות גלילה */}
      <div className="fixed inset-x-0 top-0 z-[120] h-0.5">
        <div className="h-full bg-gradient-to-l from-gold-3 via-gold to-gold-2" style={{ width: `${progress}%` }} />
      </div>

      {/* ניווט */}
      <header className={`fixed inset-x-0 top-0 z-90 transition-all duration-500 ${solid ? "border-b border-[hsl(var(--line))] bg-bg/80 backdrop-blur-xl backdrop-saturate-150" : ""}`}>
        <div className="mx-auto flex h-[78px] w-full max-w-[1280px] items-center justify-between px-[clamp(1.25rem,4vw,3.5rem)]">
          <Logo />
          <nav className="hidden gap-1.5 xl:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-[15px] py-2.5 text-[15px] text-mu transition-colors duration-300 hover:bg-fg/5 hover:text-fg">
                {n.label}
              </a>
            ))}
          </nav>
          <Button asChild className={`${goldBtn} hidden px-6 py-2.5 text-[14.5px] sm:inline-flex`}>
            <a href="#contact">שיחת אבחון חינם <ArrowLeft className="h-[17px] w-[17px]" /></a>
          </Button>
        </div>
      </header>

      {/* ═══ גיבור ═══ */}
      <section id="top" className="relative overflow-hidden pb-[clamp(4.5rem,10vh,7rem)] pt-[clamp(8rem,17vh,11rem)]">
        <div className="pointer-events-none absolute -top-[30%] start-[-15%] aspect-square w-[min(1000px,110vw)] rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.17),transparent_60%)] blur-[10px]" />
        <div className="pointer-events-none absolute -bottom-[40%] end-[-20%] aspect-square w-[min(760px,90vw)] rounded-full bg-[radial-gradient(circle,hsl(224_84%_61%/0.14),transparent_62%)] blur-[10px]" />

        {/* גרף מונפש */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[min(46vh,420px)] opacity-55">
          <svg viewBox="0 0 1200 380" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="tz-ln" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity="0" />
                <stop offset="35%" stopColor="hsl(var(--gold))" stopOpacity=".7" />
                <stop offset="100%" stopColor="hsl(var(--gold-2))" />
              </linearGradient>
              <linearGradient id="tz-ar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--gold))" stopOpacity=".16" />
                <stop offset="100%" stopColor="hsl(var(--gold))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M1200,330 C1060,320 1010,300 900,306 C800,312 760,258 660,268 C560,278 520,214 420,206 C320,198 270,140 160,120 C90,107 40,74 0,58 L0,380 L1200,380 Z"
              fill="url(#tz-ar)"
              className="transition-opacity duration-[1400ms] delay-[1500ms]"
              style={{ opacity: loaded ? 1 : 0 }}
            />
            <path
              d="M1200,330 C1060,320 1010,300 900,306 C800,312 760,258 660,268 C560,278 520,214 420,206 C320,198 270,140 160,120 C90,107 40,74 0,58"
              fill="none"
              stroke="url(#tz-ln)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="2400"
              className="transition-[stroke-dashoffset] duration-[2600ms] delay-[350ms] ease-[cubic-bezier(.16,1,.3,1)]"
              style={{ strokeDashoffset: loaded ? 0 : 2400 }}
            />
          </svg>
        </div>

        <div className="relative z-[1] mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3.5rem)]">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold/20 bg-gold/[0.05] py-2 pe-[18px] ps-2 text-[13.5px] font-medium text-gold-2">
              <span className="rounded-full bg-gold px-[11px] py-1 text-[11.5px] font-bold text-[#100C02]">4 מקומות</span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
              נותרו החודש לשיחות אבחון
            </div>
          </Reveal>

          <h1 className="mt-[clamp(1.6rem,4vh,2.6rem)] font-display text-[clamp(2.9rem,8.2vw,7rem)] font-extrabold leading-[0.94] tracking-[-0.035em]">
            {words.map((w, i) =>
              w === "\n" ? <br key={i} /> : (
                <span key={i} className="inline-block overflow-hidden align-top">
                  <span
                    className="inline-block transition-transform duration-1000 ease-[cubic-bezier(.16,1,.3,1)]"
                    style={{ transform: loaded ? "translateY(0)" : "translateY(105%)", transitionDelay: `${120 + i * 70}ms` }}
                  >
                    <span className={w === "בשביל מי" ? "bg-[linear-gradient(100deg,hsl(var(--gold-2))_10%,hsl(var(--gold))_50%,hsl(var(--gold-3))_95%)] bg-clip-text text-transparent" : ""}>
                      {w}
                    </span>
                  </span>
                  {i < words.length - 1 && " "}
                </span>
              ),
            )}
          </h1>

          <Reveal className="mt-[clamp(1.4rem,3vh,2.2rem)] max-w-[60ch]">
            <Lead>
              כל חודש שהכסף שוכב בעו״ש הוא חודש שבו מישהו אחר מרוויח ממנו. צחי בוזגלו בונה תוכנית השקעה אישית — לפי הסכום, הטווח ורמת הסיכון שמתאימה לך — ומלווה אותה עד שהמספרים בחשבון משתנים.
            </Lead>
            <div className="mt-[clamp(1.9rem,4vh,2.75rem)] flex flex-wrap gap-3.5">
              <Button asChild className={goldBtn}>
                <a href="#contact">לשיחת אבחון חינם <ArrowLeft className="h-[17px] w-[17px]" /></a>
              </Button>
              <Button asChild variant="outline" className="h-auto rounded-full border-[hsl(var(--line))] bg-transparent px-8 py-4 font-display text-base font-semibold text-fg transition-all duration-500 hover:-translate-y-0.5 hover:border-gold hover:bg-transparent hover:text-gold-2">
                <a href="#tracks">לראות את המסלולים</a>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={120} className="mt-[clamp(3rem,7vh,5rem)]">
            <div className="grid gap-px overflow-hidden rounded-[22px] border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-2 lg:grid-cols-4">
              {METRICS.map((m) => (
                <div key={m.label} className="bg-s1 px-6 py-[26px]">
                  <b className="block font-display text-[clamp(1.9rem,3.4vw,2.7rem)] font-extrabold leading-none tracking-[-0.04em] text-gold-2">
                    <Counter to={m.to} suffix={m.suffix} />
                  </b>
                  <span className="mt-2.5 block text-[13.5px] text-mu2">{m.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ פס נע ═══ */}
      <div className="relative z-[1] overflow-hidden border-y border-[hsl(var(--line))] bg-s1 py-[26px]">
        <div className="flex w-max animate-marquee gap-11">
          {[...MARQUEE, ...MARQUEE].map((t, i) => (
            <span
              key={i}
              className={`flex items-center gap-4 whitespace-nowrap font-display text-[clamp(18px,2.4vw,30px)] font-semibold tracking-[-0.03em] ${
                i % 5 === 1 || i % 5 === 4 ? "text-gold" : "text-transparent [-webkit-text-stroke:1px_hsl(var(--fg)/0.28)]"
              }`}
            >
              {t}
              <span className="h-[7px] w-[7px] shrink-0 rotate-45 rounded-[2px] bg-gold" />
            </span>
          ))}
        </div>
      </div>

      {/* ═══ למה עכשיו ═══ */}
      <section id="why" className="relative py-[clamp(5rem,12vh,8.75rem)]">
        <div className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3.5rem)]">
          <Reveal className="max-w-[800px]">
            <Tag>01 — למה עכשיו</Tag>
            <H2>כסף שעומד במקום<br />לא נשאר במקום.</H2>
            <Lead className="mt-5">
              אין דבר כזה ״לא להחליט״. גם חוסר החלטה היא החלטה — פשוט אחת שגובה מחיר בכל חודש שעובר.
            </Lead>
          </Reveal>

          <div className="mt-[clamp(2.75rem,6vh,4.5rem)] grid gap-px overflow-hidden rounded-[22px] border border-[hsl(var(--line))] bg-[hsl(var(--line))] md:grid-cols-3">
            {PAINS.map((p, i) => (
              <Reveal key={p.idx} delay={i * 80}>
                <div className="group relative h-full bg-s1 p-[clamp(1.75rem,3.2vw,2.6rem)] transition-colors duration-500 hover:bg-s2">
                  <p className="mb-[26px] font-display text-[13px] font-semibold tracking-[0.14em] text-gold-3">{p.idx}</p>
                  <H3>{p.t}</H3>
                  <Body className="mt-3.5">{p.d}</Body>
                  <span className="absolute bottom-0 start-0 h-0.5 w-0 bg-gold transition-[width] duration-[550ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:w-full" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ מסלולים ═══ */}
      <section id="tracks" className="relative py-[clamp(5rem,12vh,8.75rem)]">
        <div className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3.5rem)]">
          <Reveal className="max-w-[800px]">
            <Tag>02 — מסלולי השקעה</Tag>
            <H2>
              אין מסלול אחד נכון.<br />יש{" "}
              <span className="bg-[linear-gradient(100deg,hsl(var(--gold-2))_10%,hsl(var(--gold))_50%,hsl(var(--gold-3))_95%)] bg-clip-text text-transparent">אחד שנכון לך</span>.
            </H2>
            <Lead className="mt-5">
              צחי לא מוכר מוצר. הוא בוחר מתוך כל המגרש — ומרכיב שילוב שמתאים לסכום, לטווח ולשקט הנפשי שלך.
            </Lead>
          </Reveal>

          <div className="mt-[clamp(2.75rem,6vh,4.5rem)] grid gap-px overflow-hidden rounded-[22px] border border-[hsl(var(--line))] bg-[hsl(var(--line))] sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((t, i) => (
              <Reveal key={t.n} delay={(i % 3) * 80}>
                <div className="group relative h-full overflow-hidden bg-s1 p-[clamp(1.75rem,3vw,2.5rem)] transition-colors duration-500 hover:bg-s2">
                  <span className="pointer-events-none absolute -top-[60%] end-[-30%] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.2),transparent_65%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative mb-[26px] flex items-start justify-between gap-4">
                    <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-[14px] border border-gold/20 bg-gold/[0.06] transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:-rotate-6 group-hover:border-gold group-hover:bg-gold">
                      <t.icon className="h-[23px] w-[23px] text-gold transition-colors duration-500 group-hover:text-[#100C02]" strokeWidth={1.6} />
                    </span>
                    <span className="font-display text-[12.5px] font-medium tracking-[0.14em] text-mu2">{t.n}</span>
                  </div>
                  <div className="relative">
                    <H3>{t.t}</H3>
                    <Body className="mt-3">{t.d}</Body>
                    <span className="mt-[22px] inline-flex items-center rounded-full border border-gold/20 bg-gold/[0.09] px-3.5 py-1.5 text-[12.5px] font-semibold text-gold-2">
                      {t.chip}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ התהליך ═══ */}
      <section id="how" className="relative py-[clamp(5rem,12vh,8.75rem)]">
        <div className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3.5rem)]">
          <Reveal className="max-w-[800px]">
            <Tag>03 — התהליך</Tag>
            <H2>שלושה צעדים.<br />הראשון עולה לך חצי שעה.</H2>
          </Reveal>

          <div className="mt-[clamp(2.75rem,6vh,4.5rem)] grid gap-px border-y border-[hsl(var(--line))] bg-[hsl(var(--line))]">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="group grid grid-cols-[auto_1fr] items-start gap-[clamp(1.25rem,4vw,3.5rem)] bg-bg py-[clamp(1.9rem,4vh,3rem)] transition-colors duration-500 hover:bg-s1 md:grid-cols-[auto_1fr_auto]">
                  <span className="min-w-[1.4ch] font-display text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.85] tracking-[-0.06em] text-transparent transition-all duration-500 [-webkit-text-stroke:1.5px_hsl(var(--gold)/0.22)] group-hover:text-gold/10 group-hover:[-webkit-text-stroke:1.5px_hsl(var(--gold))]">
                    {s.n}
                  </span>
                  <div>
                    <H3>{s.t}</H3>
                    <Body className="mt-3 max-w-[62ch]">{s.d}</Body>
                    <span className="mt-4 inline-flex rounded-full border border-gold/20 px-[15px] py-1.5 text-[13px] font-semibold text-gold md:hidden">
                      {s.note}
                    </span>
                  </div>
                  <span className="hidden shrink-0 self-center whitespace-nowrap rounded-full border border-gold/20 px-[15px] py-1.5 text-[13px] font-semibold text-gold md:inline-flex">
                    {s.note}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ על צחי ═══ */}
      <section id="about" className="relative py-[clamp(5rem,12vh,8.75rem)]">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-[clamp(2.25rem,5vw,5rem)] px-[clamp(1.25rem,4vw,3.5rem)] lg:grid-cols-[0.82fr_1.18fr]">
          <Reveal>
            <div className="relative grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[22px] border border-[hsl(var(--line))] bg-gradient-to-b from-s3 to-bg">
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,hsl(var(--gold)/0.14),transparent_60%)]" />
              {/* להחליף בתמונה: <img src="/tzahi.jpg" alt="צחי בוזגלו" className="absolute inset-0 h-full w-full object-cover" /> */}
              <span className="font-display text-[clamp(4rem,11vw,8rem)] font-extrabold tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_hsl(var(--gold)/0.3)]">צב</span>
              <span className="absolute bottom-5 start-5 text-[12px] tracking-[0.14em] text-mu2">תמונה של צחי</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <Tag>04 — על צחי</Tag>
            <H2>מספרים זה החלק הקל.<br />אנשים זה העבודה.</H2>
            <Lead className="mt-5">
              צחי בוזגלו מלווה משפחות, עצמאים ובעלי עסקים בהחלטות הכספיות הגדולות של החיים — מהשקעה ראשונה של 50,000 ש״ח ועד תיקים מורכבים עם נדל״ן, קרנות ותכנון מס. הגישה שלו פשוטה: בלי ז׳רגון, בלי הבטחות, ובלי מוצר שצריך למכור.
            </Lead>
            <ul className="mt-[30px] grid gap-px border-y border-[hsl(var(--line))] bg-[hsl(var(--line))]">
              {[
                "יועץ השקעות בעל רישיון מטעם רשות ניירות ערך",
                "ליווי אישי — אותו אדם בשיחת האבחון ובפגישה הרבעונית",
                "שקיפות מלאה: כל עמלה ועלות על השולחן מראש",
                "עבודה מול כל הגופים — בלי מחויבות לבית השקעות אחד",
              ].map((li) => (
                <li key={li} className="flex items-start gap-4 bg-bg py-4 text-base font-light text-mu">
                  <Check className="mt-1 h-[19px] w-[19px] shrink-0 text-gold" strokeWidth={2} />
                  {li}
                </li>
              ))}
            </ul>
            <Button asChild className={`${goldBtn} mt-8`}>
              <a href="#contact">לקבוע שיחת אבחון <ArrowLeft className="h-[17px] w-[17px]" /></a>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* ═══ עדויות ═══ */}
      <section className="relative py-[clamp(5rem,12vh,8.75rem)]">
        <div className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3.5rem)]">
          <Reveal className="max-w-[800px]">
            <Tag>05 — לקוחות מספרים</Tag>
            <H2>מה שקורה כשהכסף<br />מפסיק לחכות.</H2>
          </Reveal>

          <div className="mt-[clamp(2.75rem,6vh,4.5rem)] grid gap-px overflow-hidden rounded-[22px] border border-[hsl(var(--line))] bg-[hsl(var(--line))] md:grid-cols-3">
            {QUOTES.map((q, i) => (
              <Reveal key={q.n} delay={i * 80}>
                <figure className="flex h-full flex-col bg-s1 p-[clamp(1.75rem,3vw,2.5rem)] transition-colors duration-500 hover:bg-s2">
                  <div className="mb-4 flex gap-[3px]">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="h-[15px] w-[15px] fill-gold text-gold" strokeWidth={0} />
                    ))}
                  </div>
                  <p className="mb-[18px] font-display text-[60px] font-extrabold leading-[0.6] text-gold opacity-[0.28]">״</p>
                  <blockquote className="flex-1 text-[16.6px] font-light leading-[1.85]">{q.q}</blockquote>
                  <figcaption className="mt-[26px] flex items-center gap-3.5 border-t border-[hsl(var(--line))] pt-[22px]">
                    <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border border-gold/20 bg-gold/[0.12] font-display text-[15px] font-bold text-gold-2">
                      {q.av}
                    </span>
                    <span>
                      <b className="block text-[15px] font-semibold">{q.n}</b>
                      <span className="text-[13px] text-mu2">{q.r}</span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ שאלות ═══ */}
      <section id="faq" className="relative py-[clamp(5rem,12vh,8.75rem)]">
        <div className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3.5rem)]">
          <Reveal className="max-w-[800px]">
            <Tag>06 — שאלות שחוזרות</Tag>
            <H2>מה ששואלים<br />לפני שמתחילים.</H2>
          </Reveal>

          <Reveal className="mt-[clamp(2.5rem,5vh,4rem)]">
            <Accordion type="single" collapsible defaultValue="q-0" className="w-full border-t border-[hsl(var(--line))]">
              {FAQ.map((f, i) => (
                <AccordionItem
                  key={f.q}
                  value={`q-${i}`}
                  className="border-b border-[hsl(var(--line))] transition-colors duration-500 data-[state=open]:bg-[linear-gradient(to_left,hsl(var(--gold)/0.035),transparent)]"
                >
                  <AccordionTrigger className="gap-5 py-[26px] text-start font-display text-[clamp(17px,1.6vw,20px)] font-medium tracking-[-0.02em] hover:no-underline [&>svg]:hidden">
                    <span className="hidden shrink-0 text-[12.5px] font-medium tracking-[0.14em] text-gold-3 sm:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{f.q}</span>
                    <ChevronDown className="h-[34px] w-[34px] shrink-0 rounded-full border border-[hsl(var(--line))] p-2 text-gold transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)]" />
                  </AccordionTrigger>
                  <AccordionContent className="max-w-[78ch] pb-7 text-[16.4px] font-light leading-[1.8] text-mu sm:ps-[52px]">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* ═══ יצירת קשר ═══ */}
      <section id="contact" className="relative overflow-hidden py-[clamp(5rem,12vh,8.75rem)]">
        <div className="pointer-events-none absolute start-1/2 top-1/4 aspect-square w-[min(1200px,120vw)] translate-x-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--gold)/0.13),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3.5rem)]">
          <Reveal>
            <div className="grid overflow-hidden rounded-[clamp(1.4rem,3vw,2rem)] border border-[hsl(var(--line))] bg-s1 shadow-[0_60px_130px_-60px_#000] lg:grid-cols-[0.88fr_1.12fr]">
              <div className="border-b border-[hsl(var(--line))] bg-[linear-gradient(200deg,hsl(var(--gold)/0.11),hsl(var(--gold)/0.01)_60%)] p-[clamp(2rem,4vw,3.5rem)] lg:border-b-0 lg:border-e lg:border-e-[hsl(var(--line))]">
                <Tag>07 — שיחת אבחון</Tag>
                <h2 className="font-display text-[clamp(1.8rem,3.4vw,2.7rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">
                  חצי שעה שיכולה לשנות את העשור הבא
                </h2>
                <Lead className="mt-4">
                  משאירים פרטים, וצחי חוזר תוך יום עסקים אחד לתיאום. בלי אוטומציות, בלי מוקד, בלי לחץ.
                </Lead>
                <ul className="mt-8 grid gap-4">
                  {PERKS.map((p) => (
                    <li key={p} className="flex items-start gap-3.5 text-[15.6px] font-light text-fg">
                      <Check className="mt-1 h-[18px] w-[18px] shrink-0 text-gold" strokeWidth={2.2} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <LeadForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ פוטר ═══ */}
      <footer className="relative z-[1] border-t border-[hsl(var(--line))] bg-s1 pb-8 pt-[clamp(2.75rem,6vh,4.4rem)]">
        <div className="mx-auto w-full max-w-[1280px] px-[clamp(1.25rem,4vw,3.5rem)]">
          <div className="flex flex-wrap items-start justify-between gap-8 border-b border-[hsl(var(--line))] pb-[34px]">
            <Logo />
            <nav className="flex flex-wrap gap-[26px] text-[15px] text-mu">
              {NAV.map((n) => (
                <a key={n.href} href={n.href} className="transition-colors duration-300 hover:text-gold-2">{n.label}</a>
              ))}
            </nav>
            <div className="flex flex-wrap gap-[22px] text-[15px] text-mu">
              <a href="mailto:tzahi@example.co.il" className="flex items-center gap-2.5 transition-colors duration-300 hover:text-gold-2">
                <Mail className="h-4 w-4 text-gold" strokeWidth={1.8} />
                <span dir="ltr">tzahi@example.co.il</span>
              </a>
              <a href="tel:+972500000000" className="flex items-center gap-2.5 transition-colors duration-300 hover:text-gold-2">
                <Phone className="h-4 w-4 text-gold" strokeWidth={1.8} />
                <span dir="ltr">050-000-0000</span>
              </a>
            </div>
          </div>

          <p className="mt-[30px] max-w-[96ch] text-[12.5px] font-light leading-[1.85] text-mu2">
            האמור באתר זה הוא מידע כללי ושיווקי בלבד, ואינו מהווה ייעוץ השקעות, ייעוץ פנסיוני, שיווק השקעות או תחליף לייעוץ המתחשב בנתונים ובצרכים המיוחדים של כל אדם. אין באמור התחייבות לתשואה כלשהי, ואין בתשואות עבר כדי להעיד על תשואות עתידיות. השקעה בניירות ערך ובנכסים פיננסיים כרוכה בסיכון, לרבות אובדן חלק מהקרן או כולה.
            <br />© <span className="tabular-nums">{new Date().getFullYear()}</span> צחי בוזגלו · כל הזכויות שמורות
          </p>
        </div>
      </footer>

      {/* CTA דביק במובייל */}
      <div className="fixed inset-x-0 bottom-0 z-[80] border-t border-[hsl(var(--line))] bg-bg/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <Button asChild className={`${goldBtn} w-full py-3.5`}>
          <a href="#contact">לשיחת אבחון חינם <ArrowLeft className="h-[17px] w-[17px]" /></a>
        </Button>
      </div>
      <div className="h-[82px] md:hidden" />
    </div>
  );
}
