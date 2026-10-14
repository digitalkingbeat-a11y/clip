import React from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { ClipFlowLogo } from "./ClipFlowLogo";

export type LegalPageId = "privacy" | "terms" | "contact";

const CONTACT_EMAIL = "digitalkingbeat@gmail.com";
const COMPANY = "Digital King Code";
const PRODUCT = "ClipFlow Video";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-bold text-white">{title}</h2>
    <div className="text-sm text-[#9CA5B5] leading-relaxed space-y-2">{children}</div>
  </section>
);

const ReviewNote = () => (
  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs">
    Starter template: this page has not been reviewed by a lawyer. Review and adapt it before relying on it.
  </div>
);

const Privacy = () => (
  <>
    <h1 className="text-2xl font-extrabold text-white">Privacy Policy</h1>
    <ReviewNote />
    <p className="text-sm text-[#9CA5B5]">
      This policy explains how {COMPANY} ("we", "us") collects and uses information when you use {PRODUCT} (the "Service").
    </p>
    <Section title="Information we collect">
      <p>Account details you provide (such as name, email and password), the videos, audio, images and text you upload or generate, information about connected social accounts you authorize, billing information processed by our payment provider, and basic usage and device data needed to run the Service.</p>
    </Section>
    <Section title="How we use it">
      <p>To provide and improve the Service, process your media with AI features, publish content to platforms you connect, handle payments, provide support, keep the Service secure and comply with legal obligations. We do not sell your personal information.</p>
    </Section>
    <Section title="Third-party services">
      <p>We rely on service providers such as hosting and storage, AI model providers, payment processing (Stripe) and the social platforms you connect (for example YouTube, TikTok and Instagram). They process data on our behalf or under their own policies when you connect them.</p>
    </Section>
    <Section title="Retention and deletion">
      <p>We keep your data while your account is active and as needed to provide the Service. You can ask us to delete your account and data at any time by contacting us.</p>
    </Section>
    <Section title="Your rights">
      <p>Depending on where you live, you may have rights to access, correct, export or delete your personal data, or to object to certain processing. Contact us to make a request.</p>
    </Section>
    <Section title="Security">
      <p>We use reasonable technical and organizational measures to protect your data, but no system is completely secure.</p>
    </Section>
    <Section title="Changes and contact">
      <p>We may update this policy and will post the new version here. Questions? Email <a className="text-[#16D9F5]" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </Section>
  </>
);

const Terms = () => (
  <>
    <h1 className="text-2xl font-extrabold text-white">Terms of Service</h1>
    <ReviewNote />
    <p className="text-sm text-[#9CA5B5]">
      These terms govern your use of {PRODUCT}, operated by {COMPANY}. By creating an account or using the Service you agree to them.
    </p>
    <Section title="Your account">
      <p>You must provide accurate information and keep your login secure. You are responsible for activity under your account.</p>
    </Section>
    <Section title="Your content">
      <p>You keep ownership of the content you upload and create. You grant us the limited permission needed to store, process and publish it on your behalf to operate the Service. You confirm you have the rights to the content you upload.</p>
    </Section>
    <Section title="Acceptable use">
      <p>Do not use the Service for illegal, infringing, harmful or abusive content, to violate the rules of connected platforms, or to interfere with the Service.</p>
    </Section>
    <Section title="AI output">
      <p>AI-generated scripts, clips and captions may be inaccurate or unsuitable. Review output before publishing; you are responsible for what you publish.</p>
    </Section>
    <Section title="Plans, billing and cancellation">
      <p>Paid plans renew monthly until cancelled. You can cancel anytime; access continues until the end of the billing period. Credit packs are one-time purchases. Prices may change with notice.</p>
    </Section>
    <Section title="Disclaimers and liability">
      <p>The Service is provided "as is" without warranties. To the extent permitted by law, {COMPANY} is not liable for indirect or consequential damages, and our total liability is limited to the amount you paid in the last 12 months.</p>
    </Section>
    <Section title="Termination and changes">
      <p>We may suspend accounts that break these terms. We may update these terms and will post changes here. Contact: <a className="text-[#16D9F5]" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </Section>
  </>
);

const Contact = () => (
  <>
    <h1 className="text-2xl font-extrabold text-white">Contact</h1>
    <p className="text-sm text-[#9CA5B5]">
      Questions, support, billing or privacy requests for {PRODUCT}? Reach {COMPANY} by email and we'll get back to you.
    </p>
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-clipflow-gradient-h text-white font-bold text-sm"
    >
      <Mail className="w-4 h-4" /> {CONTACT_EMAIL}
    </a>
  </>
);

export const LegalPage: React.FC<{ page: LegalPageId; onBack: () => void }> = ({ page, onBack }) => (
  <div className="fixed inset-0 z-[200] overflow-y-auto bg-[#080A0F] text-[#F7F8FA] select-text">
    <header className="sticky top-0 bg-[#080A0F]/90 backdrop-blur border-b border-[#1C222E]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <ClipFlowLogo size="sm" />
        <button onClick={onBack} className="text-sm text-[#9CA5B5] hover:text-white flex items-center gap-1 cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>
    </header>
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {page === "privacy" && <Privacy />}
      {page === "terms" && <Terms />}
      {page === "contact" && <Contact />}
      <p className="text-xs text-[#5C6577] pt-6 border-t border-[#1C222E]">© {new Date().getFullYear()} {COMPANY}. {PRODUCT}.</p>
    </main>
  </div>
);
