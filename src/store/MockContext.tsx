import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, User as SupabaseUser } from "@supabase/supabase-js";
import type {
  AcademicLevel,
  AppNotification,
  AuditLog,
  CreateGroupInput,
  Department,
  Group,
  GroupMembership,
  GroupRule,
  JoinRequest,
  Post,
  Profile,
  Report,
  Resource,
  RuleAcknowledgement,
  StudySession,
  User,
  VerificationStatus,
} from "../data/types";
import { supabase, supabaseConfigError, authRedirectUrl } from "../lib/supabase";
import { normalizeAuthError, normalizeDataError } from "../lib/error-messages";
import type {
  Database,
  GroupMembershipRow,
  GroupRow,
  JoinRequestRow,
  NotificationRow,
  ProfileCardRow,
  ProfileRow,
} from "../lib/database.types";

export type AuthMode = "unavailable" | "supabase";

export type ActionResult = {
  ok: boolean;
  error?: string;
  /** Normalised auth error code, e.g. `email_not_confirmed`. */
  code?: string;
  requestId?: string;
  needsEmailConfirmation?: boolean;
};

export type CreateGroupResult = ActionResult & {
  group?: Group;
};

/** A department's shared access code, visible to moderators only. */
export type DepartmentCode = {
  department_id: string;
  code: string;
};

export type RedeemCodeResult = ActionResult & {
  department?: string;
};

export type RotateCodeResult = ActionResult & {
  newCode?: string;
};

type ProfilePatch = Partial<
  Pick<Profile, "display_name" | "department_id" | "programme" | "academic_level">
>;

type AppContextValue = {
  authMode: AuthMode;
  authReady: boolean;
  configError: string | null;
  profileError: string | null;
  profilesLoading: boolean;
  communityLoading: boolean;
  communityError: string | null;
  currentUserId: string | null;
  currentUser: User | null;
  users: User[];
  departments: Department[];
  groups: Group[];
  joinRequests: JoinRequest[];
  notifications: AppNotification[];
  reports: Report[];
  auditLogs: AuditLog[];
  sessions: StudySession[];
  posts: Post[];
  resources: Resource[];
  rules: GroupRule[];
  acknowledgements: RuleAcknowledgement[];
  memberships: GroupMembership[];
  profiles: Profile[];
  signIn: (email: string, password: string) => Promise<ActionResult>;
  signOut: () => Promise<void>;
  signUp: (input: {
    display_name: string;
    email: string;
    password: string;
    department_id: string;
    programme: string;
    academic_level: string;
  }) => Promise<ActionResult>;
  verifyEmail: (userId: string) => Promise<ActionResult>;
  resendVerificationEmail: (email: string) => Promise<ActionResult>;
  requestPasswordReset: (email: string) => Promise<ActionResult>;
  updatePassword: (password: string) => Promise<ActionResult>;
  refreshAuth: () => Promise<ActionResult>;
  updateProfile: (userId: string, patch: ProfilePatch) => Promise<ActionResult>;
  requestVerification: () => Promise<ActionResult>;
  departmentCodes: DepartmentCode[];
  redeemDepartmentCode: (code: string) => Promise<RedeemCodeResult>;
  refreshDepartmentCodes: () => Promise<void>;
  rotateDepartmentCode: (departmentId: string) => Promise<RotateCodeResult>;
  refreshCommunity: () => Promise<void>;
  createGroup: (creatorId: string, input: CreateGroupInput) => Promise<CreateGroupResult>;
  sendJoinRequest: (
    studentId: string,
    groupId: string,
    message: string
  ) => Promise<ActionResult>;
  withdrawJoinRequest: (requestId: string, studentId: string) => Promise<ActionResult>;
  decideJoinRequest: (
    requestId: string,
    decision: "ACCEPT" | "REJECT",
    reason: string,
    actorId: string
  ) => Promise<ActionResult>;
  markNotificationRead: (notificationId: string, userId: string) => Promise<ActionResult>;
  markAllNotificationsRead: (userId: string) => Promise<ActionResult>;
  reviewVerification: (
    studentId: string,
    status: VerificationStatus,
    reviewerId: string
  ) => Promise<ActionResult>;
};

const AppContext = createContext<AppContextValue | null>(null);

const ACADEMIC_LEVELS: AcademicLevel[] = ["100 Level", "200 Level", "300 Level", "400 Level"];

/**
 * Builds a shareable department code such as `CLIM-7K2P`.
 *
 * Deliberately avoids characters that are easy to misread when read aloud or
 * copied from a WhatsApp message (0/O, 1/I/L).
 */
function generateDepartmentCode(departmentId: string): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const prefix =
    departmentId.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "UENR";
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let suffix = "";
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length];
  return `${prefix}-${suffix}`;
}

function asAcademicLevel(value: unknown): AcademicLevel | null {
  return typeof value === "string" && ACADEMIC_LEVELS.includes(value as AcademicLevel)
    ? (value as AcademicLevel)
    : null;
}

function metadataString(user: SupabaseUser, key: string): string | null {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    display_name: row.display_name,
    department_id: row.department_id,
    programme: row.programme,
    academic_level: row.academic_level,
    email_verified: row.email_verified,
    verification_status: row.verification_status,
    role: row.role,
  };
}

function mergeUsers(base: User[], additions: User[]): User[] {
  const merged = new Map(base.map((user) => [user.id, user]));
  additions.forEach((user) => merged.set(user.id, user));
  return Array.from(merged.values());
}

function mapGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    department_id: row.department_id,
    group_type: row.group_type,
    course_name: row.course_name,
    programme: row.programme,
    academic_level: row.academic_level,
    created_by: row.created_by ?? "",
    capacity: row.capacity,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapMembership(row: GroupMembershipRow): GroupMembership {
  return {
    id: row.id,
    group_id: row.group_id,
    student_id: row.student_id,
    role: row.role,
    status: row.status,
    joined_at: row.joined_at,
  };
}

function mapJoinRequest(row: JoinRequestRow): JoinRequest {
  return {
    id: row.id,
    group_id: row.group_id,
    student_id: row.student_id,
    status: row.status,
    message: row.message,
    decision_reason: row.decision_reason,
    decided_by: row.decided_by,
    decided_at: row.decided_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapNotification(row: NotificationRow): AppNotification {
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    payload,
    read_at: row.read_at,
    created_at: row.created_at,
  };
}

function cardToUser(card: ProfileCardRow): User {
  return {
    id: card.id,
    email: "",
    display_name: card.display_name,
    role: "STUDENT",
    profile: null,
  };
}

/**
 * Adds the narrow group-member directory on top of the full profiles the
 * signed-in student is allowed to read. Full profile rows always win, so a
 * member card can never replace the viewer's own account details.
 */
function mergeCardUsers(
  base: User[],
  profilesList: Profile[],
  cards: ProfileCardRow[]
): User[] {
  const knownProfileIds = new Set(profilesList.map((profile) => profile.id));
  return mergeUsers(
    base,
    cards.filter((card) => !knownProfileIds.has(card.id)).map(cardToUser)
  );
}

function validateGroupInput(input: CreateGroupInput): string | null {
  const name = input.name.trim();
  const description = input.description.trim();
  const courseName = input.course_name?.trim() ?? "";
  const programme = input.programme?.trim() ?? "";

  if (name.length < 3 || name.length > 80) {
    return "Group name must be between 3 and 80 characters.";
  }
  if (description.length < 10 || description.length > 2000) {
    return "Description must be between 10 and 2000 characters.";
  }
  if (
    !Number.isInteger(input.capacity) ||
    input.capacity < 2 ||
    input.capacity > 50
  ) {
    return "Capacity must be a whole number between 2 and 50 students.";
  }
  if (input.group_type === "COURSE" && !courseName) {
    return "Add the course name for a course group.";
  }
  if (courseName.length > 120) {
    return "Course name must be 120 characters or fewer.";
  }
  if (programme.length > 120) {
    return "Programme must be 120 characters or fewer.";
  }
  return null;
}

function buildProfileState(
  rows: ProfileRow[],
  authUser: SupabaseUser | null
): { profiles: Profile[]; users: User[] } {
  // Only profiles returned by the database are shown. Auth metadata alone is
  // not treated as a saved application profile.
  const profileList = rows.map(mapProfile);

  const rowById = new Map(rows.map((row) => [row.id, row]));
  const realUsers: User[] = profileList.map((profile) => ({
    id: profile.id,
    email:
      rowById.get(profile.id)?.email ??
      (profile.id === authUser?.id ? authUser?.email ?? "" : ""),
    display_name: profile.display_name,
    role: profile.role ?? "STUDENT",
    profile,
  }));

  return { profiles: profileList, users: realUsers };
}

async function fetchProfiles(client: SupabaseClient<Database>): Promise<ProfileRow[] | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("Could not load profiles:", error.message);
    return null;
  }

  return data ?? [];
}

async function ensureProfile(
  client: SupabaseClient<Database>,
  authUser: SupabaseUser
): Promise<ProfileRow | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (data) return data;
  if (error && error.code !== "PGRST116") {
    console.warn("Could not read the signed-in profile:", error.message);
    return null;
  }

  const departmentId = metadataString(authUser, "department_id");
  const displayName =
    metadataString(authUser, "display_name") ?? authUser.email?.split("@")[0] ?? "Student";

  const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: authUser.id,
    email: authUser.email ?? "",
    display_name: displayName.slice(0, 80),
    department_id: departmentId,
    programme: metadataString(authUser, "programme"),
    academic_level: asAcademicLevel(authUser.user_metadata?.academic_level),
    email_verified: Boolean(authUser.email_confirmed_at),
    verification_status: departmentId ? "PENDING" : "UNVERIFIED",
  };

  let result = await client.from("profiles").insert(payload).select("*").single();

  // A stale department in user metadata must not block the whole account.
  if (result.error?.code === "23503") {
    payload.department_id = null;
    payload.verification_status = "UNVERIFIED";
    result = await client.from("profiles").insert(payload).select("*").single();
  }

  if (result.error) {
    console.warn("Could not create the missing profile:", result.error.message);
    return null;
  }

  return result.data;
}

export function MockProvider({ children }: { children: ReactNode }) {
  const authMode: AuthMode = supabase ? "supabase" : "unavailable";

  // Authentication is always sourced from Supabase; there is no local session fallback.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentAuthUser, setCurrentAuthUser] = useState<SupabaseUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentCodes, setDepartmentCodes] = useState<DepartmentCode[]>([]);
  const [authReady, setAuthReady] = useState(!supabase);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileCards, setProfileCards] = useState<ProfileCardRow[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<GroupMembership[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  // These domains intentionally remain empty until they have persisted APIs.
  const rules: GroupRule[] = [];
  const acknowledgements: RuleAcknowledgement[] = [];
  const sessions: StudySession[] = [];
  const posts: Post[] = [];
  const resources: Resource[] = [];
  const reports: Report[] = [];
  const auditLogs: AuditLog[] = [];
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const profilesRef = useRef<Profile[]>(profiles);
  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const resetSupabaseState = useCallback(() => {
    setCurrentAuthUser(null);
    setCurrentUserId(null);
    setProfiles([]);
    setUsers([]);
    setProfileError(null);
    setProfilesLoading(false);
    setProfileCards([]);
    setCommunityLoading(false);
    setCommunityError(null);
    setGroups([]);
    setMemberships([]);
    setJoinRequests([]);
    setNotifications([]);
    setAuthReady(true);
  }, []);

  const syncSupabaseSession = useCallback(
    async (session: Session | null) => {
      const client = supabase;
      if (!client) return;

      if (!session?.user) {
        resetSupabaseState();
        return;
      }

      const authUser = session.user;
      setCurrentAuthUser(authUser);
      setCurrentUserId(authUser.id);
      setProfilesLoading(true);

      try {
        const ownRow = await ensureProfile(client, authUser);
        const rows = (await fetchProfiles(client)) ?? [];

        if (ownRow && !rows.some((row) => row.id === ownRow.id)) {
          rows.unshift(ownRow);
        }

        const state = buildProfileState(rows, authUser);
        setProfiles(state.profiles);
        setUsers(state.users);
        setProfileError(
          rows.length === 0
            ? "Your profile could not be loaded. Check that the Phase 2 database migration has been run."
            : null
        );
      } catch (error) {
        console.error("Unexpected profile sync error:", error);
        setProfiles([]);
        setUsers([]);
        setProfileError("We could not load your saved profile. Please retry after checking the database setup.");
      } finally {
        setProfilesLoading(false);
        setAuthReady(true);
      }
    },
    [resetSupabaseState]
  );

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;

    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error("Could not restore the Supabase session:", error.message);
        setAuthReady(true);
        return;
      }
      void syncSupabaseSession(data.session);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      // Defer the profile fetch so it never runs inside the Supabase auth lock.
      window.setTimeout(() => {
        if (active) void syncSupabaseSession(session);
      }, 0);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [syncSupabaseSession]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let active = true;

    void client
      .from("departments")
      .select("id, name, is_active")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          console.warn("Could not load departments from Supabase:", error.message);
          return;
        }
        if (data && data.length > 0) setDepartments(data);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentUser = useMemo<User | null>(() => {
    if (!currentUserId) return null;

    if (authMode === "supabase") {
      const authUser = currentAuthUser?.id === currentUserId ? currentAuthUser : null;
      const profile = profiles.find((item) => item.id === currentUserId);

      if (!profile) return null;

      return {
        id: currentUserId,
        email: authUser?.email ?? "",
        display_name: profile.display_name,
        role: profile.role ?? "STUDENT",
        profile,
      };
    }

    return null;
  }, [authMode, currentAuthUser, currentUserId, profiles]);

  const refreshProfiles = useCallback(async () => {
    const client = supabase;
    if (!client || !currentAuthUser) return;

    const rows = await fetchProfiles(client);
    if (!rows) return;

    const state = buildProfileState(rows, currentAuthUser);
    setProfiles(state.profiles);
    setUsers(mergeCardUsers(state.users, state.profiles, profileCards));
    setProfileError(null);
  }, [currentAuthUser, profileCards]);

  const refreshCommunity = useCallback(async () => {
    const client = supabase;
    if (!client || !currentUserId) return;

    setCommunityLoading(true);
    setCommunityError(null);

    try {
      const [groupsResult, membershipsResult, requestsResult, notificationsResult, cardsResult] =
        await Promise.all([
          client.from("groups").select("*").order("created_at", { ascending: false }),
          client.from("group_memberships").select("*").order("joined_at", { ascending: false }),
          client.from("join_requests").select("*").order("created_at", { ascending: false }),
          client.from("notifications").select("*").order("created_at", { ascending: false }),
          client.rpc("list_profile_cards"),
        ]);

      const firstError =
        groupsResult.error ??
        membershipsResult.error ??
        requestsResult.error ??
        notificationsResult.error;

      if (firstError) {
        const friendly = normalizeDataError(firstError);
        setCommunityError(friendly.message);
        setGroups([]);
        setMemberships([]);
        setJoinRequests([]);
        setNotifications([]);
        return;
      }

      setGroups((groupsResult.data ?? []).map(mapGroup));
      setMemberships((membershipsResult.data ?? []).map(mapMembership));
      setJoinRequests((requestsResult.data ?? []).map(mapJoinRequest));
      setNotifications((notificationsResult.data ?? []).map(mapNotification));

      if (cardsResult.error) {
        // Names are cosmetic; a directory failure must not hide the groups.
        console.warn("Could not load group member names:", cardsResult.error.message);
      } else {
        const cards = cardsResult.data ?? [];
        setProfileCards(cards);
        setUsers((previous) =>
          mergeCardUsers(previous, profilesRef.current, cards)
        );
      }
    } catch (error) {
      console.error("Unexpected study-group sync error:", error);
      setCommunityError(
        "We could not load your study groups. Check your internet connection and try again."
      );
    } finally {
      setCommunityLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (authMode !== "supabase" || !authReady || !currentUserId) return;
    void refreshCommunity();
  }, [authMode, authReady, currentUserId, refreshCommunity]);

  const signIn = async (email: string, password: string): Promise<ActionResult> => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const friendly = normalizeAuthError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    await syncSupabaseSession(data.session);
    return { ok: true };
  };

  const signOut = async (): Promise<void> => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Sign out warning:", error.message);
        // Clear the local session even if the server could not be reached.
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // Ignore: resetSupabaseState still clears the UI session.
        }
      }
    }
    resetSupabaseState();
  };

  const signUp: AppContextValue["signUp"] = async (input) => {
    const email = input.email.trim().toLowerCase();

    if (input.display_name.trim().length < 2) {
      return { ok: false, error: "Please enter your full display name." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Enter a valid email address." };
    }
    if (!departments.some((department) => department.id === input.department_id)) {
      return { ok: false, error: "Select a valid department." };
    }

    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: {
          display_name: input.display_name.trim(),
          department_id: input.department_id,
          programme: input.programme.trim(),
          academic_level: input.academic_level,
        },
        emailRedirectTo: authRedirectUrl("/verify-email"),
      },
    });

    if (error) {
      const friendly = normalizeAuthError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    if (data.session) {
      await syncSupabaseSession(data.session);
      return { ok: true, needsEmailConfirmation: false };
    }

    return { ok: true, needsEmailConfirmation: true };
  };

  const refreshAuth = async (): Promise<ActionResult> => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      const friendly = normalizeAuthError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    await syncSupabaseSession(data.session);

    if (!data.session) {
      return {
        ok: false,
        error:
          "No signed-in session was found. Open the confirmation link from your email, then return to this page.",
      };
    }

    if (!data.session.user.email_confirmed_at) {
      return {
        ok: false,
        error:
          "Your email is not confirmed yet. Open the confirmation link we sent you, or resend the email below.",
        code: "email_not_confirmed",
      };
    }

    return { ok: true };
  };

  const verifyEmail = async (_userId: string): Promise<ActionResult> => refreshAuth();

  const resendVerificationEmail = async (email: string): Promise<ActionResult> => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { ok: false, error: "Enter the email address you registered with." };
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: authRedirectUrl("/verify-email") },
    });

    if (error) {
      const friendly = normalizeAuthError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    return { ok: true };
  };

  /**
   * Sends a Supabase recovery email. The caller must not reveal whether the
   * address exists: the UI always shows the same neutral message.
   */
  const requestPasswordReset = async (email: string): Promise<ActionResult> => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { ok: false, error: "Enter the email address you registered with." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: authRedirectUrl("/reset-password"),
    });

    if (error) {
      const friendly = normalizeAuthError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    return { ok: true };
  };

  /** Completes the recovery flow for the session created by the email link. */
  const updatePassword = async (password: string): Promise<ActionResult> => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }
    if (password.length < 8) {
      return { ok: false, error: "Use at least 8 characters for your new password." };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      const friendly = normalizeAuthError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    await refreshAuth();
    return { ok: true };
  };

  const updateProfile = async (
    userId: string,
    patch: ProfilePatch
  ): Promise<ActionResult> => {
    if (patch.display_name !== undefined && patch.display_name.trim().length < 2) {
      return { ok: false, error: "Please enter your full display name." };
    }
    if (patch.programme && patch.programme.trim().length > 120) {
      return { ok: false, error: "Programme must be 120 characters or fewer." };
    }

    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }
    if (userId !== currentUserId) {
      return { ok: false, error: "You can only update your own profile." };
    }

    const payload: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (patch.display_name !== undefined) payload.display_name = patch.display_name.trim();
    if ("department_id" in patch) payload.department_id = patch.department_id ?? null;
    if ("programme" in patch) payload.programme = patch.programme?.trim() || null;
    if ("academic_level" in patch) payload.academic_level = patch.academic_level ?? null;

    if (Object.keys(payload).length === 0) return { ok: true };

    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    await refreshProfiles();
    return { ok: true };
  };

  const requestVerification = async (): Promise<ActionResult> => {
    if (!currentUserId) {
      return { ok: false, error: "Sign in to request verification." };
    }

    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const { error } = await supabase.rpc("submit_verification");
    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    await refreshProfiles();
    return { ok: true };
  };

  const createGroup: AppContextValue["createGroup"] = async (creatorId, input) => {
    if (creatorId !== currentUserId) {
      return { ok: false, error: "Sign in to create a study group." };
    }

    const profile = profiles.find((item) => item.id === creatorId);
    if (!profile) {
      return { ok: false, error: "Your profile could not be loaded. Refresh and try again." };
    }
    if (!profile.email_verified) {
      return {
        ok: false,
        error: "Verify your email address before creating a study group.",
      };
    }
    if (profile.verification_status !== "VERIFIED") {
      return {
        ok: false,
        error: "Your department must be verified before you can create a study group.",
      };
    }
    if (!profile.department_id) {
      return { ok: false, error: "Add your department before creating a study group." };
    }
    if (input.department_id !== profile.department_id) {
      return {
        ok: false,
        error: "Study groups can only be created in your verified department.",
      };
    }

    const validationError = validateGroupInput(input);
    if (validationError) return { ok: false, error: validationError };

    const name = input.name.trim();
    const description = input.description.trim();
    const courseName =
      input.group_type === "COURSE" ? input.course_name?.trim() || null : null;
    const capacity = Math.round(input.capacity);

    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const { data, error } = await supabase.rpc("create_group", {
      p_name: name,
      p_description: description,
      p_group_type: input.group_type,
      p_course_name: courseName,
      p_programme: input.programme?.trim() || null,
      p_academic_level: asAcademicLevel(input.academic_level),
      p_capacity: capacity,
    });

    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }
    if (!data) {
      return { ok: false, error: "The group was created but could not be loaded. Refresh the page." };
    }

    await refreshCommunity();
    return { ok: true, group: mapGroup(data) };
  };

  const sendJoinRequest: AppContextValue["sendJoinRequest"] = async (
    studentId,
    groupId,
    message
  ) => {
    if (studentId !== currentUserId) {
      return { ok: false, error: "Sign in to request to join a group." };
    }

    const group = groups.find((item) => item.id === groupId);
    if (!group) return { ok: false, error: "Group not found." };
    if (group.status !== "OPEN") {
      return { ok: false, error: "This group is not accepting new members." };
    }

    const studentProfile = profiles.find((profile) => profile.id === studentId);
    if (!studentProfile || !studentProfile.email_verified) {
      return {
        ok: false,
        error:
          "Your email address is not verified. Please verify your email before joining a group.",
      };
    }
    if (studentProfile.verification_status !== "VERIFIED") {
      return {
        ok: false,
        error: "Your department affiliation is still awaiting moderator verification.",
      };
    }
    if (studentProfile.department_id !== group.department_id) {
      return {
        ok: false,
        error: "You can only join study groups within your verified department.",
      };
    }

    if (
      memberships.some(
        (membership) =>
          membership.group_id === groupId &&
          membership.student_id === studentId &&
          membership.status === "ACTIVE"
      )
    ) {
      return { ok: false, error: "You are already a member of this group." };
    }

    const existing = joinRequests.find(
      (request) =>
        request.group_id === groupId &&
        request.student_id === studentId &&
        request.status === "PENDING"
    );
    if (existing) return { ok: false, error: "You already have a pending request for this group." };

    const activeMembers = memberships.filter(
      (membership) => membership.group_id === groupId && membership.status === "ACTIVE"
    ).length;
    if (activeMembers >= group.capacity) {
      return { ok: false, error: "This group is full." };
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 500) {
      return { ok: false, error: "Your introduction must be 500 characters or fewer." };
    }

    if (authMode === "supabase") {
      if (!supabase) {
        return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
      }

      const { data, error } = await supabase.rpc("send_join_request", {
        p_group_id: groupId,
        p_message: trimmedMessage || null,
      });

      if (error) {
        const friendly = normalizeDataError(error);
        return { ok: false, error: friendly.message, code: friendly.code };
      }

      await refreshCommunity();
      return { ok: true, requestId: data ?? undefined };
    }

    return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
  };

  const withdrawJoinRequest: AppContextValue["withdrawJoinRequest"] = async (
    requestId,
    studentId
  ) => {
    if (studentId !== currentUserId) {
      return { ok: false, error: "Sign in to withdraw a join request." };
    }

    const request = joinRequests.find((item) => item.id === requestId);
    if (!request || request.student_id !== studentId)
      return { ok: false, error: "Join request not found." };
    if (request.status !== "PENDING")
      return { ok: false, error: "Only pending requests can be withdrawn." };

    if (authMode === "supabase") {
      if (!supabase) {
        return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
      }

      const { error } = await supabase.rpc("withdraw_join_request", {
        p_request_id: requestId,
      });

      if (error) {
        const friendly = normalizeDataError(error);
        return { ok: false, error: friendly.message, code: friendly.code };
      }

      await refreshCommunity();
      return { ok: true };
    }

    return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
  };

  const decideJoinRequest: AppContextValue["decideJoinRequest"] = async (
    requestId,
    decision,
    reason,
    actorId
  ) => {
    if (actorId !== currentUserId) return { ok: false, error: "Sign in to decide join requests." };
    if (!supabase) return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };

    const trimmedReason = reason.trim();
    if (decision === "REJECT" && trimmedReason.length < 5) {
      return { ok: false, error: "A clear rejection reason is required (at least 5 characters)." };
    }
    if (decision === "REJECT" && trimmedReason.length > 500) {
      return { ok: false, error: "The rejection reason must be 500 characters or fewer." };
    }

    // The database re-checks request state, permissions, eligibility and capacity.
    const { error } = await supabase.rpc("decide_join_request", {
      p_request_id: requestId,
      p_decision: decision,
      p_reason: decision === "REJECT" ? trimmedReason : null,
    });
    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }
    await refreshCommunity();
    return { ok: true };
  };

  const markNotificationRead: AppContextValue["markNotificationRead"] = async (
    notificationId,
    userId
  ) => {
    if (userId !== currentUserId) {
      return { ok: false, error: "Sign in to update notifications." };
    }

    if (!supabase) return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };

    const { error } = await supabase.rpc("mark_notification_read", {
      p_notification_id: notificationId,
    });
    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }
    await refreshCommunity();
    return { ok: true };
  };

  const markAllNotificationsRead: AppContextValue["markAllNotificationsRead"] = async (
    userId
  ) => {
    if (userId !== currentUserId) {
      return { ok: false, error: "Sign in to update notifications." };
    }

    if (!supabase) return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };

    const { error } = await supabase.rpc("mark_all_notifications_read");
    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }
    await refreshCommunity();
    return { ok: true };
  };

  const reviewVerification = async (
    studentId: string,
    status: VerificationStatus,
    reviewerId: string
  ): Promise<ActionResult> => {
    if (reviewerId !== currentUserId) return { ok: false, error: "Sign in to review verification requests." };
    if (status !== "VERIFIED" && status !== "REJECTED") {
      return { ok: false, error: "Decision must be verified or rejected." };
    }

    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const { error } = await supabase.rpc("review_verification", {
      p_student_id: studentId,
      p_status: status,
      p_note: null,
    });

    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    await refreshProfiles();
    return { ok: true };
  };

  const refreshDepartmentCodes = useCallback(async () => {
    const client = supabase;
    if (!client) return;

    // RLS only returns rows to moderators; students get an empty list, not an error.
    const { data, error } = await client
      .from("department_codes")
      .select("department_id, code");

    if (error) {
      console.warn("Could not load department codes:", error.message);
      return;
    }
    setDepartmentCodes(data ?? []);
  }, []);

  const redeemDepartmentCode: AppContextValue["redeemDepartmentCode"] = async (rawCode) => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const trimmed = rawCode.trim();
    if (trimmed.length < 4) {
      return { ok: false, error: "Enter the code your class moderator shared with you." };
    }

    const { data, error } = await supabase.rpc("redeem_department_code", { p_code: trimmed });
    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    const payload = (data ?? {}) as {
      ok?: boolean;
      department?: string;
      already_verified?: boolean;
    };

    if (!payload.ok) {
      return {
        ok: false,
        error:
          "That code is not valid. Ask your class moderator for the current code and try again.",
      };
    }

    // The RPC writes the profile; reload so the UI reflects VERIFIED immediately.
    await refreshProfiles();
    return { ok: true, department: payload.department };
  };

  const rotateDepartmentCode: AppContextValue["rotateDepartmentCode"] = async (departmentId) => {
    if (!supabase) {
      return { ok: false, error: supabaseConfigError ?? "Supabase is not configured." };
    }

    const nextCode = generateDepartmentCode(departmentId);
    const { error } = await supabase.from("department_codes").upsert(
      {
        department_id: departmentId,
        code: nextCode,
        created_by: currentUserId,
      },
      { onConflict: "department_id" }
    );

    if (error) {
      const friendly = normalizeDataError(error);
      return { ok: false, error: friendly.message, code: friendly.code };
    }

    await refreshDepartmentCodes();
    return { ok: true, newCode: nextCode };
  };

  // Moderators need the codes loaded to share them; students never see this list.
  useEffect(() => {
    if (authMode !== "supabase" || !authReady) return;
    if (currentUser?.role !== "MODERATOR") return;
    void refreshDepartmentCodes();
  }, [authMode, authReady, currentUser?.role, refreshDepartmentCodes]);

  const value: AppContextValue = {
    authMode,
    authReady,
    configError: supabaseConfigError,
    profileError,
    profilesLoading,
    communityLoading,
    communityError,
    currentUserId,
    currentUser,
    users,
    departments,
    groups,
    joinRequests,
    notifications,
    reports,
    auditLogs,
    sessions,
    posts,
    resources,
    rules,
    acknowledgements,
    memberships,
    profiles,
    signIn,
    signOut,
    signUp,
    verifyEmail,
    resendVerificationEmail,
    requestPasswordReset,
    updatePassword,
    refreshAuth,
    updateProfile,
    requestVerification,
    departmentCodes,
    redeemDepartmentCode,
    refreshDepartmentCodes,
    rotateDepartmentCode,
    refreshCommunity,
    createGroup,
    sendJoinRequest,
    withdrawJoinRequest,
    decideJoinRequest,
    markNotificationRead,
    markAllNotificationsRead,
    reviewVerification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Legacy export names remain temporarily to avoid a broad import rename.
 * All account and persisted application data must come from Supabase; absent
 * configuration intentionally leaves protected state empty.
 */
export function useMock(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useMock must be used within a MockProvider");
  return ctx;
}
