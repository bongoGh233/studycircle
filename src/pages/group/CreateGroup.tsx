import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input, Textarea } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { useMock } from "../../store/MockContext";
import type { AcademicLevel, GroupType } from "../../data/types";
import { IconArrowLeft, IconPlus } from "../../components/icons";

const LEVELS: Array<{ value: string; label: string }> = [
  { value: "", label: "No specific level" },
  { value: "100 Level", label: "100 Level" },
  { value: "200 Level", label: "200 Level" },
  { value: "300 Level", label: "300 Level" },
  { value: "400 Level", label: "400 Level" },
];

export function CreateGroup() {
  const { currentUser, createGroup, departments } = useMock();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({
    name: "",
    description: "",
    group_type: "COURSE" as GroupType,
    course_name: "",
    programme: currentUser?.profile?.programme ?? "",
    academic_level: (currentUser?.profile?.academic_level ?? "") as AcademicLevel | "",
    capacity: "10",
  }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const profile = currentUser.profile;
  const department = profile?.department_id ? departments.find((item) => item.id === profile.department_id) : undefined;
  const emailVerified = profile?.email_verified === true;
  const departmentVerified = profile?.verification_status === "VERIFIED";

  if (!profile?.department_id || !emailVerified || !departmentVerified) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors"
        >
          <IconArrowLeft size={16} />
          Back to discover
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Create a study group
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Both email and department verification are required before you can start a group.
          </p>
        </div>

        <Card className="p-8">
          <Alert variant="warning" title="Verification required">
            {!profile?.department_id
              ? "Add your department on your profile first."
              : !emailVerified
                ? "Verify your email address to continue."
                : "Your department is not verified yet. Enter the department code your class moderator shared, or ask a moderator to approve you."}
          </Alert>
          <div className="mt-6 flex flex-wrap gap-3">
            {!emailVerified ? (
              <Link to="/verify-email">
                <Button size="sm">Verify email</Button>
              </Link>
            ) : null}
            <Link to="/profile">
              <Button size="sm" variant="outline">
                Open profile
              </Button>
            </Link>
            <Link to="/discover">
              <Button size="sm" variant="ghost">
                Browse groups
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const capacity = Number(form.capacity);
    setError(null);

    if (form.name.trim().length < 3) {
      setError("Give the group a name of at least 3 characters.");
      return;
    }
    if (form.description.trim().length < 10) {
      setError("Describe the group in at least 10 characters.");
      return;
    }
    if (form.group_type === "COURSE" && !form.course_name.trim()) {
      setError("Add the course name for a course group.");
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 2 || capacity > 50) {
      setError("Capacity must be a whole number between 2 and 50 students.");
      return;
    }

    setBusy(true);
    const result = await createGroup(currentUser.id, {
      name: form.name,
      description: form.description,
      department_id: profile.department_id!,
      group_type: form.group_type,
      course_name: form.group_type === "COURSE" ? form.course_name : null,
      programme: form.programme || null,
      academic_level: (form.academic_level || null) as AcademicLevel | null,
      capacity,
    });
    setBusy(false);

    if (!result.ok || !result.group) {
      setError(result.error ?? "The group could not be created.");
      return;
    }

    navigate(`/groups/${result.group.id}`, { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors"
        >
          <IconArrowLeft size={16} />
          Back to discover
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Create a study group
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Everyone in your verified department can discover the group. You will be its administrator
          and can review join requests.
        </p>
      </div>

      <Card className="p-8">
        <div className="rounded-2xl bg-brand-50 border border-brand-100 px-5 py-4 text-sm text-brand-800 dark:bg-brand-900/20 dark:border-brand-800/30 dark:text-brand-200">
          <span className="font-semibold">Department:</span> {department?.name ?? "—"}
          <p className="mt-1 text-xs opacity-80">
            Groups can only be created in your verified department. Change your department on your
            profile if this is wrong.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
          {error ? (
            <Alert variant="error" title="Check the group details">{error}</Alert>
          ) : null}

          <Input
            label="Group name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. CS305 Database Revision Circle"
            maxLength={80}
            required
            hint={`${form.name.trim().length}/80 characters`}
          />

          <Textarea
            label="What is this group for?"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Describe the course, the study goals and how often you plan to meet."
            maxLength={2000}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Group type"
              value={form.group_type}
              onChange={(event) =>
                setForm({ ...form, group_type: event.target.value as GroupType })
              }
              options={[
                { value: "COURSE", label: "Course group" },
                { value: "GENERAL", label: "General group" },
              ]}
            />
            <Input
              label="Capacity"
              type="number"
              min={2}
              max={50}
              value={form.capacity}
              onChange={(event) => setForm({ ...form, capacity: event.target.value })}
              hint="How many active members can the group hold?"
              required
            />
          </div>

          {form.group_type === "COURSE" ? (
            <Input
              label="Course name or code"
              value={form.course_name}
              onChange={(event) => setForm({ ...form, course_name: event.target.value })}
              placeholder="e.g. CS305 – Database Systems"
              maxLength={120}
              required
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Programme (optional)"
              value={form.programme}
              onChange={(event) => setForm({ ...form, programme: event.target.value })}
              placeholder="e.g. BSc Computer Science"
              maxLength={120}
            />
            <Select
              label="Academic level (optional)"
              value={form.academic_level}
              onChange={(event) =>
                setForm({
                  ...form,
                  academic_level: event.target.value as AcademicLevel | "",
                })
              }
              options={LEVELS}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" loading={busy}>
              <IconPlus size={16} />
              Create group
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/discover")}
              disabled={busy}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
