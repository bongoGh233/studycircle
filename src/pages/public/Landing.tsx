import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "../../components/brand";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Alert } from "../../components/ui/alert";
import { useMock } from "../../store/MockContext";
import { IconPause, IconPlay, IconPlus, IconShieldCheck, IconUsers } from "../../components/icons";

const HERO_VIDEO = "/media/uenr-campus-loop.mp4";
const HERO_POSTER = "/media/uenr-campus-poster.jpg";

function HeroBackdrop() {
  const [motionAllowed, setMotionAllowed] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setMotionAllowed(!query.matches);
    syncPreference();
    query.addEventListener?.("change", syncPreference);
    return () => query.removeEventListener?.("change", syncPreference);
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-slate-950">
        <img src={HERO_POSTER} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {motionAllowed ? (
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            poster={HERO_POSTER}
            tabIndex={-1}
            onCanPlay={() => setVideoReady(true)}
            onPlaying={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>
        ) : null}
        <div className="absolute inset-0 bg-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/45 to-brand-900/80" />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(ellipse at center, rgba(2,6,23,0) 0%, rgba(2,6,23,0.55) 100%)" }}
        />
      </div>
      {motionAllowed ? (
        <button
          type="button"
          onClick={togglePlayback}
          className="absolute bottom-3 left-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/40 px-2.5 py-1.5 text-[10px] font-semibold text-white/70 backdrop-blur-md transition hover:bg-slate-950/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {playing ? <IconPause size={10} /> : <IconPlay size={10} />}
          {playing ? "Pause background" : "Play background"}
        </button>
      ) : null}
    </>
  );
}

const features = [
  {
    icon: IconUsers,
    title: "Department circles",
    text: "Discover study groups only after student eligibility is verified for the connected project.",
  },
  {
    icon: IconPlus,
    title: "Student-led groups",
    text: "Create course or general study groups and manage membership requests.",
  },
  {
    icon: IconShieldCheck,
    title: "Private membership",
    text: "Group records, requests and notifications are stored in Supabase with database access rules.",
  },
];

export function Landing() {
  const { authMode, configError } = useMock();
  const accountReady = authMode === "supabase";
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Brand />
          <nav className="ml-6 hidden items-center gap-5 md:flex">
            <Link to="/discover" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors">
              Discover
            </Link>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors">
              How it works
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {accountReady ? (
              <>
                <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link to="/register"><Button size="sm">Get started</Button></Link>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" disabled title="Supabase setup required">
                  Sign-in unavailable
                </Button>
                <Button size="sm" disabled title="Supabase setup required">
                  Registration unavailable
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate flex min-h-[34rem] items-center overflow-hidden md:min-h-[42rem] lg:min-h-[calc(100vh-3.5rem)]">
          <HeroBackdrop />
          <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-20 text-center md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
              <IconShieldCheck size={13} className="text-brand-200" />
              Independent student project · UENR pilot
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_18px_rgba(2,6,23,0.55)] sm:text-5xl md:text-6xl lg:text-7xl">
              Study smarter with your classmates
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-slate-100/95 drop-shadow-[0_1px_10px_rgba(2,6,23,0.6)] md:text-xl">
              UENR StudyCircle is a student-led place to discover department-based study circles,
              create groups and manage join requests. Student-only access depends on an approved
              eligibility check.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {accountReady ? (
                <Link to="/discover" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full shadow-xl shadow-slate-950/40 focus-visible:ring-offset-slate-950 sm:w-auto">
                    Find a study group
                  </Button>
                </Link>
              ) : (
                <Button size="lg" disabled className="w-full shadow-xl shadow-slate-950/40 sm:w-auto">
                  Student access unavailable
                </Button>
              )}
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button size="lg" variant="glass" className="w-full focus-visible:ring-offset-slate-950 sm:w-auto">
                  See how it works
                </Button>
              </a>
            </div>
            <p className="mt-6 text-xs text-white/70">Free to use · Built by students · Not officially affiliated with UENR</p>
          </div>
          <a
            href="https://commons.wikimedia.org/wiki/Category:University_of_Energy_and_Natural_Resources_(Ghana)"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-4 z-10 hidden text-[10px] font-medium text-white/55 transition-colors hover:text-white/80 sm:block"
          >
            Campus media: Noahalorwu / Wikimedia Commons · CC BY-SA 4.0
          </a>
        </section>

        {!accountReady ? (
          <section className="mx-auto max-w-5xl px-4 pt-10">
            <Alert variant="warning" title="Student accounts are not connected">
              {configError ?? "Sign-in and registration are unavailable until Supabase is configured. No demo account or sample student data is provided."}
            </Alert>
          </section>
        ) : null}

        <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 py-16 md:grid-cols-3">
            {[
              {
                title: "Department-scoped",
                text: "After UENR eligibility is approved, group access is limited by department and membership.",
              },
              {
                title: "Saved requests",
                text: "Join requests and decisions are persisted in Supabase when connected.",
              },
              {
                title: "Student-led pilot",
                text: "The student eligibility check must be approved before accounts open.",
              },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 mb-4">
                  <IconShieldCheck size={18} />
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100">{feature.title}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-5xl px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight md:text-4xl">
              Everything a study group needs
            </h2>
            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Real tools for real study circles — built for UENR students, by students.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const IconCmp = feature.icon;
              return (
                <Card key={feature.title} className="p-7 hover:shadow-md transition-all group">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 mb-5 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <IconCmp size={20} />
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.text}</p>
                </Card>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="bg-white dark:bg-slate-900">
          <div className="mx-auto max-w-5xl px-4 py-20">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight md:text-4xl">
                How UENR StudyCircle works
              </h2>
              <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                From your first sign-in to your first study session.
              </p>
            </div>
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Create your profile",
                  text: "Tell us your department, programme and academic level. We verify you through the approved process.",
                },
                {
                  step: "2",
                  title: "Find or start a group",
                  text: "Search course-specific groups or start a general study circle in your department.",
                },
                {
                  step: "3",
                  title: "Study together",
                  text: "Your group request and membership status are saved to your account.",
                },
              ].map((step) => (
                <li key={step.title} className="rounded-3xl border border-slate-200 p-7 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white mb-4">
                    {step.step}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-14 text-white md:px-12 md:py-16 shadow-lg shadow-brand-600/25">
            <h2 className="text-2xl font-bold md:text-3xl tracking-tight">Ready to study together?</h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-brand-100 md:text-base">
              {accountReady
                ? "Create an account after the pilot's student eligibility process is approved."
                : "Real student accounts will open after Supabase and the eligibility process are configured."}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              {accountReady ? (
                <Link to="/register"><Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50 shadow-lg">Create an account</Button></Link>
              ) : (
                <Button size="lg" disabled className="bg-white text-brand-700 shadow-lg">
                  Registration unavailable
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-12 text-sm text-slate-400 dark:text-slate-500">
          <p className="leading-relaxed">
            UENR StudyCircle is an independent student project. It is not affiliated with, endorsed by,
            or operated by the University of Energy and Natural Resources (UENR). The UENR name and
            crest belong to UENR and are used only to identify the university; this use does not imply
            endorsement.
          </p>
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-600 leading-relaxed">
            Hero campus photography by{" "}
            <a
              href="https://commons.wikimedia.org/wiki/Category:University_of_Energy_and_Natural_Resources_(Ghana)"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600 dark:decoration-slate-600 dark:hover:text-slate-300"
            >
              Noahalorwu via Wikimedia Commons
            </a>
            , licensed CC BY-SA 4.0. The hero video is a derivative of those photos (cropped, colour-graded and animated).
          </p>
          <div className="mt-8 flex flex-wrap gap-6">
            <Link to="/privacy" className="font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
