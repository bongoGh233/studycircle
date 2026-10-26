import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";
import { Card } from "../../components/ui/card";
import { useMock } from "../../store/MockContext";
import { GroupCard } from "../../components/GroupCard";
import { IconPlus, IconSearch, IconUsers } from "../../components/icons";

export function Discover() {
  const { groups, memberships, currentUser } = useMock();
  const studentEligible = Boolean(
    currentUser?.profile?.email_verified &&
      currentUser.profile.verification_status === "VERIFIED" &&
      currentUser.profile.department_id
  );
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [level, setLevel] = useState("ALL");
  const [availability, setAvailability] = useState("OPEN");

  const visibleGroups = useMemo(() => {
    if (!studentEligible) return [];
    const viewerDepartmentId = currentUser?.profile?.department_id;
    const search = query.trim().toLowerCase();
    return groups.filter((group) => {
      if (viewerDepartmentId && group.department_id !== viewerDepartmentId) return false;
      if (type !== "ALL" && group.group_type !== type) return false;
      if (level !== "ALL" && group.academic_level !== level) return false;
      if (availability === "OPEN" && group.status !== "OPEN") return false;
      if (search) {
        const haystack = `${group.name} ${group.course_name ?? ""} ${group.programme ?? ""}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      const members = memberships.filter((m) => m.group_id === group.id && m.status === "ACTIVE");
      if (availability === "OPEN" && members.length >= group.capacity) return false;
      return true;
    });
  }, [groups, memberships, query, type, level, availability, currentUser, studentEligible]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Discover study groups
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Find a group in your verified department, or start your own.
          </p>
        </div>
        <Link to="/groups/new">
          <Button size="sm">
            <IconPlus size={16} />
            Create a group
          </Button>
        </Link>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Input
              label="Search groups"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by group or course name"
              aria-label="Search"
              className="pl-10"
            />
            <span className="pointer-events-none absolute left-3 top-12 -translate-y-1/2 text-slate-400">
              <IconSearch size={16} />
            </span>
          </div>
          <Select
            label="Group type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={[
              { value: "ALL", label: "All types" },
              { value: "COURSE", label: "Course group" },
              { value: "GENERAL", label: "General group" },
            ]}
          />
          <Select
            label="Level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            options={[
              { value: "ALL", label: "All levels" },
              { value: "100 Level", label: "100 Level" },
              { value: "200 Level", label: "200 Level" },
              { value: "300 Level", label: "300 Level" },
              { value: "400 Level", label: "400 Level" },
            ]}
          />
          <Select
            label="Availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            options={[
              { value: "OPEN", label: "Accepting members" },
              { value: "ALL", label: "Any status" },
            ]}
          />
        </div>
      </Card>

      {!studentEligible ? (
        <EmptyState
          icon={<IconUsers size={28} />}
          title="Student verification required"
          description="Group discovery is limited to email-confirmed students whose UENR eligibility and department have been approved. The approved evidence process must be in place before approval."
          action={<Link to="/profile"><Button size="sm">View verification status</Button></Link>}
        />
      ) : visibleGroups.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={28} />}
          title="No study groups found"
          description={groups.length === 0 ? "There are no saved study groups in your verified department yet. Groups will appear after a student creates one." : "Try adjusting your search or filters to find a saved group."}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visibleGroups.map((group) => (
            <GroupCard key={group.id} groupId={group.id} />
          ))}
        </div>
      )}
    </div>
  );
}
