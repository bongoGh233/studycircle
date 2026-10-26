import { Link } from "react-router-dom";
import { Brand } from "../../components/brand";
import { Button } from "../../components/ui/button";

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Brand />
          <Link to="/">
            <Button variant="ghost" size="sm">Back home</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Last updated: October 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">1. Overview</h2>
            <p className="mt-2">UENR StudyCircle is an independent student project. This policy describes how we handle information while the platform is in pilot.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">2. Information we collect</h2>
            <p className="mt-2">When real account registration is enabled, information entered at registration or profile completion may include display name, email address, department, programme and academic level. Do not submit sensitive documents in this prototype.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">3. How we use information</h2>
            <p className="mt-2">Connected account, profile, group, membership-request and notification data are used to provide the corresponding features. Unconnected features are not collecting or saving content in this release.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">4. Data storage and security</h2>
            <p className="mt-2">Real account and group data are stored in the configured Supabase project and access is governed by its database policies. If Supabase is not configured, sign-in and registration are unavailable; this local build does not substitute demo accounts or simulated sessions. Theme preference may be stored in this browser.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">5. Your choices</h2>
            <p className="mt-2">Profile changes are available only through the connected account flow. Account deletion is not yet available; contact the project maintainers for data requests. Review the final policy and retention details before inviting students.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">6. Contact</h2>
            <p className="mt-2">Questions about this policy can be raised through the project maintainers.</p>
          </section>
        </div>
      </main>
    </div>
  );
}

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Brand />
          <Link to="/">
            <Button variant="ghost" size="sm">Back home</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Last updated: October 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">1. Acceptance of terms</h2>
            <p className="mt-2">By using UENR StudyCircle you agree to these terms.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">2. Acceptable use</h2>
            <p className="mt-2">You may not use UENR StudyCircle to harass others, share unlawful content, or attempt to access private group content without authorisation.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">3. Not a university service</h2>
            <p className="mt-2">UENR StudyCircle is an independent student project and is not a University of Energy and Natural Resources service.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
