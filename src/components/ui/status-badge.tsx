import { Badge, type BadgeVariant } from "./badge";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Pending", variant: "warning" },
  ACCEPTED: { label: "Accepted", variant: "success" },
  REJECTED: { label: "Rejected", variant: "danger" },
  WITHDRAWN: { label: "Withdrawn", variant: "neutral" },
  ACTIVE: { label: "Active", variant: "success" },
  LEFT: { label: "Left", variant: "neutral" },
  OPEN: { label: "Open", variant: "success" },
  CLOSED: { label: "Closed", variant: "neutral" },
  VERIFIED: { label: "Verified", variant: "success" },
  UNVERIFIED: { label: "Unverified", variant: "danger" },
  PENDING_VERIFICATION: { label: "Pending verification", variant: "warning" },
  REJECTED_VERIFICATION: { label: "Verification rejected", variant: "danger" },
  REVIEWED: { label: "Reviewed", variant: "info" },
  RESOLVED: { label: "Resolved", variant: "success" },
  SCHEDULED: { label: "Scheduled", variant: "info" },
  COMPLETED: { label: "Completed", variant: "neutral" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusConfig[status] ?? { label: status, variant: "neutral" as BadgeVariant };
  return <Badge variant={config.variant} className={className}>{config.label}</Badge>;
}
