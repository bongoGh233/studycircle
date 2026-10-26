export type Department = {
  id: string;
  name: string;
  is_active: boolean;
};

export type AcademicLevel = "100 Level" | "200 Level" | "300 Level" | "400 Level";

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export type UserRole = "STUDENT" | "MODERATOR";

export type Profile = {
  id: string;
  display_name: string;
  department_id: string | null;
  programme: string | null;
  academic_level: AcademicLevel | null;
  email_verified: boolean;
  verification_status: VerificationStatus;
  /** Set for profiles loaded from Supabase. */
  role?: UserRole;
};

export type User = {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  profile: Profile | null;
};

export type GroupType = "COURSE" | "GENERAL";

export type GroupStatus = "OPEN" | "CLOSED";

export type Group = {
  id: string;
  name: string;
  description: string;
  department_id: string;
  group_type: GroupType;
  course_name: string | null;
  programme: string | null;
  academic_level: string | null;
  created_by: string;
  capacity: number;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
};

export type MembershipRole = "ADMIN" | "MEMBER";
export type MembershipStatus = "ACTIVE" | "LEFT";

export type GroupMembership = {
  id: string;
  group_id: string;
  student_id: string;
  role: MembershipRole;
  status: MembershipStatus;
  joined_at: string;
};

export type JoinRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export type JoinRequest = {
  id: string;
  group_id: string;
  student_id: string;
  status: JoinRequestStatus;
  message: string | null;
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GroupRule = {
  id: string;
  group_id: string;
  version: number;
  content: string;
  created_by: string;
  created_at: string;
};

export type RuleAcknowledgement = {
  group_id: string;
  student_id: string;
  rule_version: number;
  acknowledged_at: string;
};

export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export type StudySession = {
  id: string;
  group_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  location: string;
  meeting_url: string | null;
  status: SessionStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type ResourceType = "PDF" | "IMAGE" | "LINK" | "NOTES";

export type Resource = {
  id: string;
  group_id: string;
  uploaded_by: string;
  title: string;
  description: string;
  storage_path: string;
  resource_type: ResourceType;
  file_size: number;
  created_at: string;
};

export type NotificationType =
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

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type ReportStatus = "PENDING" | "REVIEWED" | "RESOLVED";

export type Report = {
  id: string;
  reporter_id: string;
  group_id: string | null;
  reported_user_id: string | null;
  content_reference: string | null;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
};

export type AuditAction =
  | "GROUP_CREATED"
  | "JOIN_REQUEST_SENT"
  | "JOIN_REQUEST_ACCEPTED"
  | "JOIN_REQUEST_REJECTED"
  | "JOIN_REQUEST_WITHDRAWN"
  | "RULES_PUBLISHED"
  | "RULE_ACKNOWLEDGED"
  | "SESSION_CREATED"
  | "SESSION_CANCELLED"
  | "POST_CREATED"
  | "RESOURCE_UPLOADED"
  | "REPORT_SUBMITTED"
  | "MODERATION_ACTION"
  | "PROFILE_UPDATED";

export type AuditLog = {
  id: string;
  actor_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CreateGroupInput = {
  name: string;
  description: string;
  department_id: string;
  group_type: GroupType;
  course_name: string | null;
  programme: string | null;
  academic_level: string | null;
  capacity: number;
};

export type SessionInput = {
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  location: string;
  meeting_url: string | null;
  status: "SCHEDULED";
};

export type ResourceInput = {
  title: string;
  description: string;
  storage_path: string;
  resource_type: ResourceType;
  file_size: number;
};

export type ReportInput = {
  group_id: string | null;
  reported_user_id: string | null;
  content_reference: string | null;
  reason: string;
};
