// The one place leave touches the database (design §14): Reference C/D
// constants, the working-day count (L9), the overlap query (L4), the scoped
// list queries (L10) and the eight action functions — each starting with
// requireUser and enforcing L2–L8. Shape decided in docs/specs/02-design.md
// §9–§13; change the spec first.
import { Prisma } from "@prisma/client";
import { requireUser } from "./auth";
import { prisma } from "./users";

// Reference C — leave types, stored as text constrained to this list.
export const LEAVE_TYPES = [
  "Annual leave",
  "Maternity leave",
  "Unpaid leave",
  "Compassionate leave",
  "Other",
] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

// Reference D — request statuses.
export const STATUSES = [
  "PendingSupervisor",
  "Signed",
  "PendingHR",
  "Approved",
  "RejectedBySupervisor",
  "RejectedByHR",
] as const;
export type LeaveStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<LeaveStatus, string> = {
  PendingSupervisor: "Pending supervisor",
  Signed: "Signed",
  PendingHR: "Pending HR",
  Approved: "Approved",
  RejectedBySupervisor: "Rejected by supervisor",
  RejectedByHR: "Rejected by HR",
};

// L4 — open requests block an overlap; Approved/Rejected never do.
export const OPEN_STATUSES: LeaveStatus[] = [
  "PendingSupervisor",
  "Signed",
  "PendingHR",
];

const FORBIDDEN_ERROR = "You are not allowed to do that.";
const UNKNOWN_REQUEST_ERROR = "This request does not exist.";
const ALREADY_DECIDED_ERROR = "This request has already been decided.";
const DATE_ORDER_ERROR = "End date cannot be before the start date";
const DATES_INVALID_ERROR = "Please enter a valid start and end date";
const DATE_RANGE_ERROR = "Please enter dates within a reasonable range";
const TYPE_INVALID_ERROR = "Please choose a leave type from the list";
const OTHER_REQUIRED_ERROR = "Please write what the leave is for";
const SUPERVISOR_INVALID_ERROR =
  "Please choose a supervisor from your own division";
const OVERLAP_ERROR = "You already have a request covering those dates";
const REMARK_REQUIRED_ERROR = "A remark is required";

// Shown on /employee when the edit page bounces a row that is no longer
// editable (design §12: redirect to /employee with a message).
export const EDIT_WINDOW_ERROR = "That request can no longer be edited";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

// Success copy for the ?flashed= query after an action redirects home —
// server-side whitelist so a URL can never inject its own message.
export const FLASH_COPY: Record<string, string> = {
  submitted: "Leave request submitted",
  saved: "Changes saved",
  cancelled: "Request cancelled",
  sent: "Sent to HR",
  signed: "Request signed",
  rejected: "Request rejected",
  approved: "Request approved",
};

// A date-only value arrives as the yyyy-mm-dd string a date input produces;
// it is stored at UTC midnight so display never shifts days.
export function parseDateOnly(value: string | null): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// L9 — Mon–Fri days between start and end, inclusive. Never stored.
export function workingDays(start: Date, end: Date): number {
  let count = 0;
  const day = new Date(start);
  while (day <= end) {
    const weekday = day.getUTCDay();
    if (weekday >= 1 && weekday <= 5) count++;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return count;
}

// Shared select so every list and detail view carries the names the screens
// show (L10).
const requestInclude = {
  employee: { select: { id: true, name: true, division: true } },
  supervisor: { select: { id: true, name: true, division: true } },
  signedBy: { select: { id: true, name: true } },
  hrOfficer: { select: { id: true, name: true } },
} satisfies Prisma.LeaveRequestInclude;

export type LeaveRow = Prisma.LeaveRequestGetPayload<{
  include: typeof requestInclude;
}>;

// — scoped lists (L10) — the page's own requireUser already gated the role.

export async function listForEmployee(employeeId: number): Promise<LeaveRow[]> {
  return prisma.leaveRequest.findMany({
    where: { employeeId },
    orderBy: { submittedAt: "desc" },
    include: requestInclude,
  });
}

export async function listForSupervisor(division: string): Promise<LeaveRow[]> {
  return prisma.leaveRequest.findMany({
    where: { supervisor: { division } },
    orderBy: { submittedAt: "desc" },
    include: requestInclude,
  });
}

export async function listForHr(): Promise<LeaveRow[]> {
  return prisma.leaveRequest.findMany({
    orderBy: { submittedAt: "desc" },
    include: requestInclude,
  });
}

export async function listForAdmin(
  status?: string,
  division?: string
): Promise<LeaveRow[]> {
  return prisma.leaveRequest.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(division ? { employee: { division } } : {}),
    },
    orderBy: { submittedAt: "desc" },
    include: requestInclude,
  });
}

// The division dropdown on /admin (L11): every division an employee belongs to.
export async function listEmployeeDivisions(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { role: "Employee" },
    select: { division: true },
    distinct: ["division"],
    orderBy: { division: "asc" },
  });
  return rows.map((row) => row.division);
}

// The dropdown on the form (L3): exactly the Supervisors of the division.
export async function listDivisionSupervisors(division: string) {
  return prisma.user.findMany({
    where: { role: "Supervisor", division },
    orderBy: { id: "asc" },
    select: { id: true, name: true, designation: true },
  });
}

// — submission validation (L3 + L4), shared by create and edit.

export type LeaveFormInput = {
  leaveType: string | null;
  otherLeaveType: string | null;
  note: string | null;
  startDate: string | null;
  endDate: string | null;
  supervisorId: string | null;
};

// 100 years of days is already nonsense on a leave form; the bound exists
// only so workingDays can never spin on hand-edited rows.
const MAX_SPAN_MS = 100 * 365.25 * 24 * 60 * 60 * 1000;

type SubmissionCheck =
  | { ok: true; values: Validated }
  | { ok: false; error: string };

async function validateSubmission(
  input: LeaveFormInput,
  employee: { id: number; division: string },
  excludeId?: number
): Promise<SubmissionCheck> {
  const leaveType = input.leaveType ?? "";
  if (!(LEAVE_TYPES as readonly string[]).includes(leaveType)) {
    return { ok: false, error: TYPE_INVALID_ERROR };
  }

  const startDate = parseDateOnly(input.startDate);
  const endDate = parseDateOnly(input.endDate);
  if (!startDate || !endDate) {
    return { ok: false, error: DATES_INVALID_ERROR };
  }
  if (endDate < startDate) {
    return { ok: false, error: DATE_ORDER_ERROR };
  }
  if (endDate.getTime() - startDate.getTime() > MAX_SPAN_MS) {
    return { ok: false, error: DATE_RANGE_ERROR };
  }

  const otherLeaveType = input.otherLeaveType?.trim() ?? "";
  if (leaveType === "Other" && otherLeaveType === "") {
    return { ok: false, error: OTHER_REQUIRED_ERROR };
  }

  const supervisorId = Number(input.supervisorId);
  if (!Number.isInteger(supervisorId) || supervisorId <= 0) {
    return { ok: false, error: SUPERVISOR_INVALID_ERROR };
  }
  const supervisor = await prisma.user.findUnique({
    where: { id: supervisorId },
  });
  if (
    !supervisor ||
    supervisor.role !== "Supervisor" ||
    supervisor.division !== employee.division
  ) {
    return { ok: false, error: SUPERVISOR_INVALID_ERROR };
  }

  const openOverlap = await prisma.leaveRequest.count({
    where: {
      employeeId: employee.id,
      status: { in: OPEN_STATUSES },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
    },
  });
  if (openOverlap > 0) {
    return { ok: false, error: OVERLAP_ERROR };
  }

  return {
    ok: true,
    values: {
      leaveType: leaveType as LeaveType,
      otherLeaveType: otherLeaveType === "" ? null : otherLeaveType,
      note: input.note?.trim() ? input.note.trim() : null,
      startDate,
      endDate,
      supervisorId,
    },
  };
}

type Validated = {
  leaveType: LeaveType;
  otherLeaveType: string | null;
  note: string | null;
  startDate: Date;
  endDate: Date;
  supervisorId: number;
};

// — the eight actions (design §13). Each starts with requireUser (L1).

export async function createLeave(input: LeaveFormInput): Promise<ActionResult> {
  const user = await requireUser(["Employee"]);
  if (!user) return { ok: false, error: FORBIDDEN_ERROR };

  const checked = await validateSubmission(input, user);
  if (!checked.ok) return { ok: false, error: checked.error };

  await prisma.leaveRequest.create({
    data: {
      employeeId: user.id,
      status: "PendingSupervisor",
      submittedAt: new Date(),
      ...checked.values,
    },
  });
  return { ok: true, message: "Leave request submitted" };
}

export async function editLeave(
  id: number,
  input: LeaveFormInput
): Promise<ActionResult> {
  const user = await requireUser(["Employee"]);
  if (!user) return { ok: false, error: FORBIDDEN_ERROR };

  // L2: the row is re-read and ownership checked against the database.
  const row = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!row) return { ok: false, error: UNKNOWN_REQUEST_ERROR };
  if (row.employeeId !== user.id) return { ok: false, error: FORBIDDEN_ERROR };
  // L5: only while PendingSupervisor.
  if (row.status !== "PendingSupervisor") {
    return { ok: false, error: FORBIDDEN_ERROR };
  }

  const checked = await validateSubmission(input, user, id);
  if (!checked.ok) return { ok: false, error: checked.error };

  await prisma.leaveRequest.update({ where: { id }, data: checked.values });
  return { ok: true, message: "Changes saved" };
}

export async function cancelLeave(id: number): Promise<ActionResult> {
  const user = await requireUser(["Employee"]);
  if (!user) return { ok: false, error: FORBIDDEN_ERROR };

  const row = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!row) return { ok: false, error: UNKNOWN_REQUEST_ERROR };
  if (row.employeeId !== user.id) return { ok: false, error: FORBIDDEN_ERROR };
  if (row.status !== "PendingSupervisor") {
    return { ok: false, error: FORBIDDEN_ERROR };
  }

  await prisma.leaveRequest.delete({ where: { id } });
  return { ok: true, message: "Request cancelled" };
}

// The L6 gate: role Supervisor, division of the named supervisor, status
// PendingSupervisor.
type Gate = { ok: true; actorId: number } | { ok: false; error: string };

async function requireDivisionSupervisor(id: number): Promise<Gate> {
  const supervisor = await requireUser(["Supervisor"]);
  if (!supervisor) return { ok: false, error: FORBIDDEN_ERROR };
  const row = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { supervisor: { select: { division: true } } },
  });
  if (!row) return { ok: false, error: UNKNOWN_REQUEST_ERROR };
  if (row.supervisor.division !== supervisor.division) {
    return { ok: false, error: FORBIDDEN_ERROR };
  }
  if (row.status !== "PendingSupervisor") {
    return { ok: false, error: FORBIDDEN_ERROR };
  }
  return { ok: true, actorId: supervisor.id };
}

export async function signRequest(id: number): Promise<ActionResult> {
  const gate = await requireDivisionSupervisor(id);
  if (!gate.ok) return { ok: false, error: gate.error };

  await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: "Signed",
      signedById: gate.actorId,
      signedAt: new Date(),
    },
  });
  return { ok: true, message: "Request signed" };
}

export async function rejectBySupervisor(
  id: number,
  remark: string | null
): Promise<ActionResult> {
  const gate = await requireDivisionSupervisor(id);
  if (!gate.ok) return { ok: false, error: gate.error };
  if (!remark?.trim()) return { ok: false, error: REMARK_REQUIRED_ERROR };

  await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: "RejectedBySupervisor",
      supervisorRemark: remark.trim(),
      decidedAt: new Date(),
    },
  });
  return { ok: true, message: "Request rejected" };
}

export async function sendToHr(id: number): Promise<ActionResult> {
  const user = await requireUser(["Employee"]);
  if (!user) return { ok: false, error: FORBIDDEN_ERROR };

  const row = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!row) return { ok: false, error: UNKNOWN_REQUEST_ERROR };
  if (row.employeeId !== user.id) return { ok: false, error: FORBIDDEN_ERROR };
  // L7: only the owner's own Signed row joins the HR queue.
  if (row.status !== "Signed") {
    return { ok: false, error: FORBIDDEN_ERROR };
  }

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: "PendingHR" },
  });
  return { ok: true, message: "Sent to HR" };
}

// L8: any HR officer, only PendingHR, and the update is conditional on the
// status still being PendingHR — first decision wins, never overwritten.
type HrGate = { ok: true; officerId: number } | { ok: false; error: string };

async function requirePendingHr(id: number): Promise<HrGate> {
  const officer = await requireUser(["HR"]);
  if (!officer) return { ok: false, error: FORBIDDEN_ERROR };
  const row = await prisma.leaveRequest.findUnique({ where: { id } });
  if (!row) return { ok: false, error: UNKNOWN_REQUEST_ERROR };
  if (row.status !== "PendingHR") {
    return { ok: false, error: ALREADY_DECIDED_ERROR };
  }
  return { ok: true, officerId: officer.id };
}

async function decideAsHr(
  id: number,
  data: Prisma.LeaveRequestUncheckedUpdateInput
) {
  const result = await prisma.leaveRequest.updateMany({
    where: { id, status: "PendingHR" },
    data,
  });
  return result.count > 0;
}

export async function approveRequest(id: number): Promise<ActionResult> {
  const gate = await requirePendingHr(id);
  if (!gate.ok) return { ok: false, error: gate.error };

  const won = await decideAsHr(id, {
    status: "Approved",
    hrOfficerId: gate.officerId,
    decidedAt: new Date(),
  });
  if (!won) return { ok: false, error: ALREADY_DECIDED_ERROR };
  return { ok: true, message: "Request approved" };
}

export async function rejectByHr(
  id: number,
  remark: string | null
): Promise<ActionResult> {
  const gate = await requirePendingHr(id);
  if (!gate.ok) return { ok: false, error: gate.error };
  if (!remark?.trim()) return { ok: false, error: REMARK_REQUIRED_ERROR };

  const won = await decideAsHr(id, {
    status: "RejectedByHR",
    hrRemark: remark.trim(),
    hrOfficerId: gate.officerId,
    decidedAt: new Date(),
  });
  if (!won) return { ok: false, error: ALREADY_DECIDED_ERROR };
  return { ok: true, message: "Request rejected" };
}
