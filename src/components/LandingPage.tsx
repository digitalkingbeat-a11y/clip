import React, { useState } from "react";
import {
  Scissors, Captions, Sparkles, Film, CalendarClock, BarChart3, Palette, Upload, Wand2, Send,
  Check, ChevronDown, ArrowRight, PlayCircle, Menu, X,
} from "lucide-react";
import { Plan, CreditPack } from "../types";
import { ClipFlowLogo } from "./ClipFlowLogo";
import { LegalPageId } from "./LegalPages";

interface LandingPageProps {
  plans: Plan[];
  creditPacks: CreditPack[];
  onSignUp: () => void;
  onLogIn: () => void;
  onTryDemo: () => void;
  onOpenLegal: (page: LegalPageId) => void;
}

const FEATURES = [
  { icon: Scissors, title: "Long video to shorts", text: "Upload a podcast, webinar or stream and get vertical short clips of the strongest moments." },
  { icon: Captions, title: "Automatic captions", text: "Styled, burned-in captions on every clip, ready for silent autoplay feeds." },
  { icon: Sparkles, title: "AI scripts and scenes", text: "Describe a video and get a script and scene plan generated from your prompt." },
  { icon: Film, title: "Timeline editor", text: "Fine-tune clips in a multitrack timeline: trim, reorder, add media and transitions." },
  { icon: CalendarClock, title: "Schedule and auto-post", text: "Plan your calendar and publish to YouTube, TikTok and Instagram automatically." },
  { icon: BarChart3, title: "Analytics", text: "See how your clips perform across platforms in one place." },
  { icon: Palette, title: "Brand kit", text: "Save your fonts, colors and logo so every clip stays on brand." },
];

const STEPS = [
  { icon: Upload, title: "Upload or prompt", text: "Drop in a long video, or describe the video you want to create." },
  { icon: Wand2, title: "Let AI do the heavy lifting", text: "ClipFlow finds the best moments, crops to vertical and adds captions." },
  { icon: Send, title: "Edit, schedule, post", text: "Polish in the editor, then schedule or auto-post to your channels." },
];

const FAQ = [
  { q: "What kind of videos work best?", a: "Long-form talking content such as podcasts, interviews, webinars, livestreams and tutorials. ClipFlow pulls out short, self-contained moments and reframes them for vertical feeds." },
  { q: "Which platforms can I post to?", a: "You can connect YouTube, TikTok and Instagram to schedule and auto-publish clips. The number of connected accounts depends on your plan." },
  { q: "What are AI credits?", a: "AI credits power generative features like scripts, scenes and social copy. Each plan includes a monthly allowance, and you can top up with a one-time credit pack." },
  { q: "Can I cancel anytime?", a: "Yes. Plans are billed monthly and you can cancel whenever you like; you keep access until the end of the billing period." },
  { q: "Do I own my content?", a: "Yes. You keep ownership of everything you upload and create. See our Terms of Service for details." },
];

export const LandingPage: React.FC<LandingPageProps> = ({ plans, creditPacks, onSignUp, onLogIn, onTryDemo, onOpenLegal }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const paidPlans = plans.filter((p) => p.priceMonthly > 0 || p.id === "free");

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <div className="h-[100dvh] overflow-y-auto bg-[#080A0F] text-[#F7F8FA] font-sans antialiased scroll-smooth">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[#080A0F]/85 backdrop-blur border-b border-[#1C222E]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <ClipFlowLogo size="sm" />
          <nav className="hidden md:flex items-center gap-7 text-sm text-[#9CA5B5]">
            {navLinks.map((l) => <a key={l.href} href={l.href} className="hover:text-white">{l.label}</a>)}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={onLogIn} className="text-sm font-semibold text-[#9CA5B5] hover:text-white cursor-pointer">Log in</button>
            <button onClick={onSignUp} className="px-4 py-2 rounded-lg bg-clipflow-gradient-h text-white text-sm font-bold cursor-pointer">Sign up free</button>
          </div>
          <button className="md:hidden p-2 text-[#9CA5B5]" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[#1C222E] px-4 py-4 space-y-3 bg-[#0C0F16]">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm text-[#9CA5B5]">{l.label}</a>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={onLogIn} className="flex-1 py-2 rounded-lg border border-[#272D3A] text-sm font-semibold">Log in</button>
              <button onClick={onSignUp} className="flex-1 py-2 rounded-lg bg-clipflow-gradient-h text-sm font-bold">Sign up</button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(147,60,255,0.18),transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#16D9F5] px-3 py-1 rounded-full bg-[#16D9F5]/10 border border-[#16D9F5]/30">
            AI video studio for creators
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold leading-tight">
            Turn long videos into <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#933CFF] to-[#16D9F5]">scroll-stopping shorts</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[#9CA5B5] max-w-2xl mx-auto">
            ClipFlow Video finds the best moments in your podcasts and webinars, makes vertical captioned clips, writes AI scripts, and posts to YouTube, TikTok and Instagram for you.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onSignUp} className="px-6 py-3 rounded-xl bg-clipflow-gradient-h text-white font-bold flex items-center justify-center gap-2 cursor-pointer">
              Get started <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onTryDemo} className="px-6 py-3 rounded-xl border border-[#272D3A] bg-[#11151E] hover:bg-[#161B26] font-semibold flex items-center justify-center gap-2 cursor-pointer">
              <PlayCircle className="w-4 h-4" /> Try the demo
            </button>
          </div>
          <p className="mt-3 text-xs text-[#5C6577]">The demo uses sample data; nothing is saved to an account.</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center">Everything you need to repurpose video</h2>
        <p className="mt-3 text-center text-[#9CA5B5]">One workspace from raw footage to published clips.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="p-5 rounded-xl bg-[#11151E] border border-[#272D3A]">
              <f.icon className="w-6 h-6 text-[#16D9F5]" />
              <h3 className="mt-3 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-[#9CA5B5]">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[#0C0F16] border-y border-[#1C222E] scroll-mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center">How it works</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-clipflow-gradient-h flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <div className="mt-4 text-xs font-bold text-[#16D9F5]">STEP {i + 1}</div>
                <h3 className="mt-1 font-bold">{s.title}</h3>
                <p className="mt-1 text-sm text-[#9CA5B5]">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center">Simple monthly plans</h2>
        <p className="mt-3 text-center text-[#9CA5B5]">Billed monthly. Cancel anytime.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {paidPlans.map((p) => (
            <div key={p.id} className={`p-5 rounded-xl border flex flex-col ${p.badge ? "border-[#933CFF] bg-[#151026]" : "border-[#272D3A] bg-[#11151E]"}`}>
              {p.badge && <span className="self-start mb-2 text-[10px] font-bold text-[#16D9F5] uppercase tracking-wider">{p.badge}</span>}
              <h3 className="font-bold">{p.name}</h3>
              <div className="mt-2"><span className="text-3xl font-extrabold">${p.priceMonthly}</span><span className="text-sm text-[#9CA5B5]">/mo</span></div>
              {p.description && <p className="mt-2 text-xs text-[#9CA5B5]">{p.description}</p>}
              <ul className="mt-4 space-y-2 text-xs text-[#C9D0DC] flex-1">
                {(p.features || []).slice(0, 6).map((f) => (
                  <li key={f} className="flex gap-2"><Check className="w-3.5 h-3.5 text-[#16D9F5] flex-shrink-0 mt-0.5" />{f}</li>
                ))}
              </ul>
              <button onClick={onSignUp} className="mt-5 w-full py-2 rounded-lg bg-clipflow-gradient-h text-white text-sm font-bold cursor-pointer">Choose {p.name}</button>
            </div>
          ))}
        </div>
        {creditPacks.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-center">Need more AI credits? Top up anytime</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 max-w-3xl mx-auto">
              {creditPacks.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-[#11151E] border border-[#272D3A] text-center">
                  <div className="text-sm font-bold">{c.name}</div>
                  <div className="mt-1 text-amber-400 font-mono font-bold">{c.credits} credits</div>
                  <div className="mt-1 text-sm text-[#9CA5B5]">${c.priceUsd} one-time</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 scroll-mt-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="rounded-xl bg-[#11151E] border border-[#272D3A]">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm cursor-pointer">
                {f.q}
                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="px-4 pb-4 text-sm text-[#9CA5B5]">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-2xl p-8 sm:p-12 text-center bg-gradient-to-br from-[#933CFF]/25 to-[#16D9F5]/15 border border-[#272D3A]">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to make your next clip?</h2>
          <p className="mt-3 text-[#9CA5B5]">Create your account and turn your first long video into shorts.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={onSignUp} className="px-6 py-3 rounded-xl bg-clipflow-gradient-h text-white font-bold cursor-pointer">Sign up</button>
            <button onClick={onLogIn} className="px-6 py-3 rounded-xl border border-[#272D3A] bg-[#11151E] font-semibold cursor-pointer">Log in</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1C222E]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#9CA5B5]">
          <span>© {new Date().getFullYear()} Digital King Code · ClipFlow Video</span>
          <div className="flex gap-5">
            <button onClick={() => onOpenLegal("privacy")} className="hover:text-white cursor-pointer">Privacy</button>
            <button onClick={() => onOpenLegal("terms")} className="hover:text-white cursor-pointer">Terms</button>
            <button onClick={() => onOpenLegal("contact")} className="hover:text-white cursor-pointer">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
