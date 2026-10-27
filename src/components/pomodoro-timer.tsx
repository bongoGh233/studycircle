import { useEffect, useRef, useState } from "react";

type Mode = "focus" | "short" | "long";

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const LABELS: Record<Mode, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break",
};

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("focus");
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeLeft(DURATIONS[mode]);
    setRunning(false);
  }, [mode]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer finished
          if (mode === "focus") {
            setSessions((s) => s + 1);
            // Auto-switch to break
            const nextMode = (sessions + 1) % 4 === 0 ? "long" : "short";
            setMode(nextMode);
            return DURATIONS[nextMode];
          } else {
            setMode("focus");
            return DURATIONS.focus;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running, mode, sessions]);

  const toggle = () => setRunning((r) => !r);
  const reset = () => {
    setRunning(false);
    setTimeLeft(DURATIONS[mode]);
  };

  const progress = ((DURATIONS[mode] - timeLeft) / DURATIONS[mode]) * 100;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all hover:bg-brand-700 hover:shadow-xl"
        aria-label="Expand focus timer"
      >
        <span className="relative flex h-2 w-2">
          {running && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
        </span>
        {LABELS[mode]} {formatTime(timeLeft)}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Focus Timer
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Minimize"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative px-6 py-5">
        <div className="absolute left-0 top-0 h-1 bg-slate-100 dark:bg-slate-800" style={{ width: "100%" }}>
          <div
            className={cn(
              "h-full transition-all duration-1000",
              mode === "focus" ? "bg-brand-600" : "bg-emerald-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(Object.keys(DURATIONS) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all",
                mode === m
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {LABELS[m]}
            </button>
          ))}
        </div>

        <div className="mb-4 text-center">
          <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {formatTime(timeLeft)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {sessions} session{sessions !== 1 ? "s" : ""} completed
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggle}
            className={cn(
              "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
              running
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                : "bg-brand-600 text-white hover:bg-brand-700"
            )}
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            onClick={reset}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Reset"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
