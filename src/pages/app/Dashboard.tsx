import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { CardSoft } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { useMock } from "../../store/MockContext";
import { formatFullDateTime } from "../../lib/utils";
import { IconBell, IconClock, IconCompass, IconPause, IconPlay, IconUsers } from "../../components/icons";
import type { Group } from "../../data/types";

const dashboardPhotos = [
  {
    src: "/media/dashboard/entrance-sign.jpg",
    title: "UENR entrance sign",
    source: "https://commons.wikimedia.org/wiki/File:UENR_2.jpg",
    objectPosition: "72% 0%",
  },
  {
    src: "/media/dashboard/campus-grounds.jpg",
    title: "UENR campus grounds",
    source: "https://commons.wikimedia.org/wiki/File:UENR_1.jpg",
    objectPosition: "center 58%",
  },
  {
    src: "/media/dashboard/hostel-court.jpg",
    title: "GETFund hostel basketball court",
    source: "https://commons.wikimedia.org/wiki/File:UENR_5.jpg",
    objectPosition: "center 56%",
  },
  {
    src: "/media/dashboard/auditorium.jpg",
    title: "UENR auditorium",
    source: "https://commons.wikimedia.org/wiki/File:UENR_Auditorium.jpg",
    objectPosition: "center",
  },
];

const photoLicenseUrl = "https://creativecommons.org/licenses/by-sa/4.0/";

function DashboardWelcome({ greeting, name }: { greeting: string; name: string }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) setPlaying(false);
    };
    motionPreference.addEventListener?.("change", stopForReducedMotion);
    return () => motionPreference.removeEventListener?.("change", stopForReducedMotion);
  }, []);

  useEffect(() => {
    if (!playing || dashboardPhotos.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActivePhoto((current) => (current + 1) % dashboardPhotos.length);
    }, 7600);
    return () => window.clearInterval(timer);
  }, [playing]);

  const photo = dashboardPhotos[activePhoto];

  return (
    <section
      aria-label="Dashboard welcome"
      className="relative isolate min-h-[240px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-sm sm:min-h-[232px]"
    >
      <div aria-hidden="true" className="absolute inset-0">
        {dashboardPhotos.map((item, index) => (
          <img
            key={item.src}
            src={item.src}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            style={{ objectPosition: item.objectPosition }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none ${index === activePhoto ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/55 to-slate-950/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[240px] flex-col items-start justify-center gap-4 px-6 pb-16 pt-8 sm:min-h-[232px] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:pb-14 sm:pt-10">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-white md:text-3xl">{greeting}, {name}</h1>
          <p className="mt-2 text-sm text-white/90">
            Here is what is happening in your study circles.
          </p>
        </div>
        <Link to="/discover" className="shrink-0">
          <Button size="sm" className="shadow-lg shadow-slate-950/30">
            <IconCompass size={16} /> Discover groups
          </Button>
        </Link>
      </div>

      <div className="absolute inset-x-5 bottom-4 z-20 flex items-center justify-between gap-2 sm:inset-x-6">
        <button
          type="button"
          onClick={() => setPlaying((current) => !current)}
          aria-label={playing ? "Pause campus photo slideshow" : "Play campus photo slideshow"}
          aria-pressed={playing}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-slate-950/65 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur transition hover:bg-slate-950/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          {playing ? <IconPause size={12} /> : <IconPlay size={12} />}
          <span>{playing ? "Pause" : "Play"}</span>
        </button>
        <p className="min-w-0 text-right text-[9px] leading-4 text-white/85 sm:text-[10px]">
          <span className="hidden sm:inline">{photo.title} · </span>
          <a href={photo.source} target="_blank" rel="noreferrer" className="underline decoration-white/40 underline-offset-2 hover:text-white">
            Noahalorwu / Wikimedia Commons
          </a>
          <span> · </span>
          <a href={photoLicenseUrl} target="_blank" rel="noreferrer" className="underline decoration-white/40 underline-offset-2 hover:text-white">
            CC BY-SA 4.0
          </a>
        </p>
      </div>
    </section>
  );
}

export function Dashboard() {
  const { currentUser, groups, memberships, sessions, notifications, joinRequests, departments } = useMock();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const myMemberships = memberships.filter((m) => m.student_id === currentUser.id && m.status === "ACTIVE");
  const myGroups = myMemberships
    .map((m) => groups.find((g) => g.id === m.group_id))
    .filter((g): g is Group => Boolean(g));

  const upcomingSessions = sessions
    .filter((s) => {
      const membership = memberships.find(
        (m) => m.group_id === s.group_id && m.student_id === currentUser.id && m.status === "ACTIVE"
      );
      return Boolean(membership) && s.status === "SCHEDULED" && new Date(s.starts_at).getTime() > Date.now();
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 3);

  const myRequests = joinRequests.filter((r) => r.student_id === currentUser.id);
  const pendingRequests = myRequests.filter((r) => r.status === "PENDING");
  const unreadNotifications = notifications.filter((n) => n.user_id === currentUser.id && !n.read_at).length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const recommended = groups
    .filter((g) => {
      const departmentId = currentUser.profile?.department_id;
      if (!departmentId || g.department_id !== departmentId) return false;
      if (g.created_by === currentUser.id) return false;
      if (myMemberships.some((m) => m.group_id === g.id && m.status === "ACTIVE")) return false;
      const members = memberships.filter((m) => m.group_id === g.id && m.status === "ACTIVE");
      return g.status === "OPEN" && members.length < g.capacity;
    })
    .slice(0, 3);

  const stats = [
    { label: "My groups", value: myGroups.length, icon: IconUsers, to: "/my-groups", variant: "brand" },
    { label: "Pending requests", value: pendingRequests.length, icon: IconClock, to: "/my-requests", variant: "warning" },
    { label: "Unread notifications", value: unreadNotifications, icon: IconBell, to: "/notifications", variant: "info" },
  ];

  return (
    <div className="space-y-10">
      <DashboardWelcome
        greeting={greeting}
        name={currentUser.profile?.display_name ?? currentUser.display_name}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const IconCmp = stat.icon;
          return (
            <Card key={stat.label} className="p-6 hover:shadow-md transition-all group">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <IconCmp size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-7 lg:grid-cols-2">
        <CardSoft className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming sessions</h2>
            <Link to="/discover" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
              Find groups
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingSessions.length === 0 ? (
              <Alert variant="warning" title="Session scheduling unavailable">
                Session data is not connected to saved storage yet, so no schedule is shown.
              </Alert>
            ) : (
              upcomingSessions.map((session) => {
                const group = groups.find((g) => g.id === session.group_id);
                const department = group ? departments.find((item) => item.id === group.department_id) : undefined;
                return (
                  <div key={session.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{session.title}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{group?.name}</p>
                        <p className="mt-2 text-sm text-slate-900 dark:text-slate-100">
                          {formatFullDateTime(session.starts_at)} · {session.time_zone}
                        </p>
                        {department ? (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{department.name}</p>
                        ) : null}
                      </div>
                      <Badge variant="info" className="shrink-0">
                        Scheduled
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardSoft>

        <CardSoft className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recommended for you</h2>
            <Link to="/discover" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recommended.length === 0 ? (
              <Alert variant="info" title="No recommendations right now">
                Check back later for new groups in your department.
              </Alert>
            ) : (
              recommended.map((group) => (
                <div key={group.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{group.name}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {group.course_name ?? group.programme ?? "General study group"}
                      </p>
                    </div>
                    <Link to={`/groups/${group.id}`} className="mt-3 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
                      View group
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardSoft>
      </div>
    </div>
  );
}
