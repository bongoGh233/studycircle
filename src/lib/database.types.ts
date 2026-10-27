/**
 * Hand-written subset of the Supabase schema used by Phases 2 and 3.
 *
 * Regenerate this file with the Supabase CLI once the project is linked:
 *   supabase gen types typescript --project-id <project-ref> --schema public > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRoleDb = "STUDENT" | "MODERATOR";
export type VerificationStatusDb = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
export type AcademicLevelDb = "100 Level" | "200 Level" | "300 Level" | "400 Level";

export type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  department_id: string | null;
  programme: string | null;
  academic_level: AcademicLevelDb | null;
  email_verified: boolean;
  verification_status: VerificationStatusDb;
  role: UserRoleDb;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DepartmentRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type DepartmentCodeRow = {
  department_id: string;
  code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type GroupPostRow = {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type VerificationReviewRow = {
  id: string;
  profile_id: string;
  reviewer_id: string | null;
  decision: VerificationStatusDb;
  note: string | null;
  created_at: string;
};

export type GroupTypeDb = "COURSE" | "GENERAL";
export type GroupStatusDb = "OPEN" | "CLOSED";
export type MembershipRoleDb = "ADMIN" | "MEMBER";
export type MembershipStatusDb = "ACTIVE" | "LEFT";
export type JoinRequestStatusDb = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
export type NotificationTypeDb =
  | "JOIN_REQUEST_RECEIVED"
  | "JOIN_REQUEST_WITHDRAWN"
  | "JOIN_REQUEST_DECIDED"
  | "ANNOUNCEMENT"
  | "SESSION_SCHEDULED"
  | "SESSION_UPDATED"
  | "SESSION_CANCELLED"
  | "RULE_ACKNOWLEDGEMENT_REQUIRED"
  | "REPORT"
  | "MODERATION_ACTION";

export type GroupRow = {
  id: string;
  name: string;
  description: string;
  department_id: string;
  group_type: GroupTypeDb;
  course_name: string | null;
  programme: string | null;
  academic_level: AcademicLevelDb | null;
  created_by: string | null;
  capacity: number;
  status: GroupStatusDb;
  created_at: string;
  updated_at: string;
};

export type GroupMembershipRow = {
  id: string;
  group_id: string;
  student_id: string;
  role: MembershipRoleDb;
  status: MembershipStatusDb;
  joined_at: string;
  left_at: string | null;
};

export type JoinRequestRow = {
  id: string;
  group_id: string;
  student_id: string;
  status: JoinRequestStatusDb;
  message: string | null;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationTypeDb;
  payload: Json;
  read_at: string | null;
  created_at: string;
};

/** The narrow profile fields exposed to group members by list_profile_cards(). */
export type ProfileCardRow = {
  id: string;
  display_name: string;
  department_id: string | null;
  programme: string | null;
  academic_level: AcademicLevelDb | null;
};

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      department_codes: TableDefinition<
        DepartmentCodeRow,
        {
          department_id: string;
          code: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<DepartmentCodeRow>
      >;
      group_posts: TableDefinition<
        GroupPostRow,
        {
          id?: string;
          group_id: string;
          author_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<GroupPostRow>
      >;
      departments: TableDefinition<
        DepartmentRow,
        { id: string; name: string; is_active?: boolean; created_at?: string },
        { id?: string; name?: string; is_active?: boolean; created_at?: string }
      >;
      profiles: TableDefinition<
        ProfileRow,
        {
          id: string;
          email?: string;
          display_name?: string;
          department_id?: string | null;
          programme?: string | null;
          academic_level?: AcademicLevelDb | null;
          email_verified?: boolean;
          verification_status?: VerificationStatusDb;
          role?: UserRoleDb;
          verified_at?: string | null;
          verified_by?: string | null;
        },
        {
          email?: string;
          display_name?: string;
          department_id?: string | null;
          programme?: string | null;
          academic_level?: AcademicLevelDb | null;
          email_verified?: boolean;
          verification_status?: VerificationStatusDb;
          role?: UserRoleDb;
          verified_at?: string | null;
          verified_by?: string | null;
        }
      >;
      verification_reviews: TableDefinition<
        VerificationReviewRow,
        {
          id?: string;
          profile_id: string;
          reviewer_id?: string | null;
          decision: VerificationStatusDb;
          note?: string | null;
          created_at?: string;
        }
      >;
      groups: TableDefinition<
        GroupRow,
        {
          id?: string;
          name: string;
          description: string;
          department_id: string;
          group_type: GroupTypeDb;
          course_name?: string | null;
          programme?: string | null;
          academic_level?: AcademicLevelDb | null;
          created_by?: string | null;
          capacity?: number;
          status?: GroupStatusDb;
        },
        Partial<GroupRow>
      >;
      group_memberships: TableDefinition<
        GroupMembershipRow,
        {
          id?: string;
          group_id: string;
          student_id: string;
          role?: MembershipRoleDb;
          status?: MembershipStatusDb;
          joined_at?: string;
          left_at?: string | null;
        },
        Partial<GroupMembershipRow>
      >;
      join_requests: TableDefinition<
        JoinRequestRow,
        {
          id?: string;
          group_id: string;
          student_id: string;
          status?: JoinRequestStatusDb;
          message?: string | null;
          decision_reason?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
        },
        Partial<JoinRequestRow>
      >;
      notifications: TableDefinition<
        NotificationRow,
        {
          id?: string;
          user_id: string;
          type: NotificationTypeDb;
          payload?: Json;
          read_at?: string | null;
        },
        Partial<NotificationRow>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      is_moderator: {
        Args: { p_user_id?: string | null };
        Returns: boolean;
      };
      submit_verification: {
        Args: Record<string, never>;
        Returns: null;
      };
      redeem_department_code: {
        Args: { p_code: string };
        Returns: Json;
      };
      review_verification: {
        Args: {
          p_student_id: string;
          p_status: VerificationStatusDb;
          p_note?: string | null;
        };
        Returns: null;
      };
      is_group_admin: {
        Args: { p_group_id: string; p_user_id?: string | null };
        Returns: boolean;
      };
      is_group_member: {
        Args: { p_group_id: string; p_user_id?: string | null };
        Returns: boolean;
      };
      current_department_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      group_in_my_department: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      list_profile_cards: {
        Args: Record<string, never>;
        Returns: ProfileCardRow[];
      };
      create_group: {
        Args: {
          p_name: string;
          p_description: string;
          p_group_type: GroupTypeDb;
          p_course_name?: string | null;
          p_programme?: string | null;
          p_academic_level?: AcademicLevelDb | null;
          p_capacity?: number;
        };
        Returns: GroupRow;
      };
      send_join_request: {
        Args: { p_group_id: string; p_message?: string | null };
        Returns: string;
      };
      withdraw_join_request: {
        Args: { p_request_id: string };
        Returns: null;
      };
      decide_join_request: {
        Args: { p_request_id: string; p_decision: string; p_reason?: string | null };
        Returns: null;
      };
      mark_notification_read: {
        Args: { p_notification_id: string };
        Returns: null;
      };
      mark_all_notifications_read: {
        Args: Record<string, never>;
        Returns: null;
      };
    };
    Enums: {
      user_role: UserRoleDb;
      verification_status: VerificationStatusDb;
      academic_level: AcademicLevelDb;
      group_type: GroupTypeDb;
      group_status: GroupStatusDb;
      membership_role: MembershipRoleDb;
      membership_status: MembershipStatusDb;
      join_request_status: JoinRequestStatusDb;
      notification_type: NotificationTypeDb;
    };
    CompositeTypes: Record<string, never>;
  };
};
