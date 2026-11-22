export type UserRole =
  | 'Manager'
  | 'Supervisor'
  | 'Caregiver'
  | 'Housekeeper'
  | 'System Administrator';

export type PortalMode = 'manager' | 'staff';

export type Department = 'Caregiving' | 'Housekeeping' | 'Management';

export type ShiftPeriod = 'Morning' | 'Afternoon' | 'Night';

export const PREFERENCE_CATEGORIES = [
  'Daily Routine',
  'Personal Preferences',
  'Communication Preferences',
  'Independence and Abilities',
  'Privacy and Dignity',
  'Culture and Identity',
  'Interests and Social Activities',
  'Relevant Support Requirements',
] as const;

export type PreferenceCategory = (typeof PREFERENCE_CATEGORIES)[number];

export type PreferenceSource =
  | 'Staff Observation'
  | 'Resident / Whānau Feedback';

export const CONFIRMATION_STATUSES = [
  'Pending Review',
  'Confirmed by Resident',
  'Confirmed through authorised representative',
  'Staff Verified',
  'Not Confirmed',
  'Outdated',
  'Inactive',
] as const;

export type ConfirmationStatus = (typeof CONFIRMATION_STATUSES)[number];

export interface ResidentPreference {
  id: string;
  residentId: string;
  category: PreferenceCategory;
  description: string;
  source: PreferenceSource;
  recordedBy: string;
  dateRecorded: string;
  confirmationStatus: ConfirmationStatus;
  confirmedBy?: string;
  lastReviewed?: string;
  reviewDueDate: string;
  isActive: boolean;
  relatedTaskTags: string[];
}

export interface PreferenceHistoryEntry {
  id: string;
  preferenceId: string;
  residentId: string;
  category: PreferenceCategory;
  previousDescription: string;
  updatedDescription: string;
  previousStatus: ConfirmationStatus;
  updatedStatus: ConfirmationStatus;
  source: PreferenceSource;
  changedBy: string;
  changedAt: string;
  reason: string;
}

export interface Resident {
  id: string;
  name: string;
  preferredName: string;
  room: string;
  wing: string;
  age: number;
  photoUrl?: string;
  summary: string;
  primaryLanguage: string;
  whanauContact: string;
  whanauRelationship: string;
  supportFocus: string;
  extraSupportNeeded: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: UserRole;
  department: Department;
  photoUrl?: string;
  availability: 'On Duty' | 'Available' | 'Off Duty' | 'On Leave';
  preferredShift: ShiftPeriod;
  maxResidentsPerShift: number;
}

export type HousekeepingCategory =
  | 'Resident bedrooms'
  | 'Bathrooms'
  | 'Common areas'
  | 'Periodic cleaning';

export type CaregivingCategory =
  | 'Personal care'
  | 'Mobility assistance'
  | 'Independence support'
  | 'Meals and hydration'
  | 'Room comfort'
  | 'Observation and reporting';

export type TaskCategory = HousekeepingCategory | CaregivingCategory;

export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed'
  | 'Unable to Complete'
  | 'Deferred'
  | 'Reassigned';

export const EXCEPTION_REASONS = [
  'Resident declined',
  'Resident unavailable',
  'Task no longer required',
  'Safety concern',
  'Equipment unavailable',
  'Insufficient time or staffing',
  'Other',
] as const;

export type ExceptionReason = (typeof EXCEPTION_REASONS)[number];

export interface TaskException {
  reason: ExceptionReason;
  notes: string;
  followUpRequested: boolean;
  recordedBy: string;
  recordedAt: string;
  resolved?: boolean;
}

export interface CareGuidanceDetails {
  supportRequired: string;
  approvedCareInstructions: string;
  independenceGuidance: string;
  privacyDignity: string;
  whatToRecord: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  department: 'Caregiving' | 'Housekeeping';
  category: TaskCategory;
  shift: ShiftPeriod;
  plannedTime: string;
  estimatedMinutes: number;
  assignedStaffId: string;
  residentId?: string;
  location: string;
  completionStandard: string;
  status: TaskStatus;
  guidance: CareGuidanceDetails;
  exception?: TaskException;
  relatedTags: string[];
  extraTimeFlag?: boolean;
}

export interface ResidentAllocation {
  staffId: string;
  residentIds: string[];
}

export interface HousekeepingRoute {
  id: string;
  staffId: string;
  routeName: string;
  areas: string[];
}

export interface ShiftSchedule {
  id: string;
  date: string;
  period: ShiftPeriod;
  timeRange: string;
  supervisorId: string;
  assignedStaffIds: string[];
  residentAllocations: ResidentAllocation[];
  housekeepingRoutes: HousekeepingRoute[];
  notes: string;
}

export const SUPPORT_REQUEST_TYPES = [
  'I need more time for a resident',
  'I need help with a transfer',
  'My workload is too heavy',
  'I need clarification about a care instruction',
  'Equipment or supplies are unavailable',
] as const;

export type SupportRequestType = (typeof SUPPORT_REQUEST_TYPES)[number];

export interface StaffSupportRequest {
  id: string;
  staffId: string;
  staffName: string;
  department: 'Caregiving' | 'Housekeeping';
  shift: ShiftPeriod;
  requestType: SupportRequestType;
  residentId?: string;
  details: string;
  status: 'Open' | 'Acknowledged' | 'Resolved';
  createdAt: string;
  managerResponse?: string;
  respondedBy?: string;
  respondedAt?: string;
}

export interface HandoverBrief {
  id: string;
  fromShift: ShiftPeriod;
  toShift: ShiftPeriod;
  date: string;
  preparedBy: string;
  residentUpdates: string[];
  operationalNotes: string;
  acknowledgements: {
    staffId: string;
    staffName: string;
    role: UserRole;
    acknowledgedAt: string;
  }[];
}

export const FEEDBACK_CATEGORIES = [
  'Workload',
  'Resident support',
  'Workflow improvement',
  'Equipment and supplies',
  'Communication',
  'Training needs',
  'Safety concerns',
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export interface StaffFeedback {
  id: string;
  category: FeedbackCategory;
  message: string;
  isAnonymous: boolean;
  submittedBy?: string;
  department: Department;
  submittedAt: string;
  status: 'New' | 'Under Review' | 'Action Assigned' | 'Resolved';
  assignedFollowUp?: string;
  managerResponse?: string;
  recurringIssueTag?: string;
  timeForCareOpportunity?: string;
}

export interface StaffSurveyResponse {
  id: string;
  cycle: string;
  isAnonymous: boolean;
  respondentName?: string;
  department: Department;
  submittedAt: string;
  answers: {
    enoughTimeForQualityCare: number; // 1-5
    reasonableWorkload: number; // 1-5
    understandResponsibilities: number; // 1-5
    receiveEnoughSupport: number; // 1-5
    shiftCommunicationEffective: number; // 1-5
    whatWouldMakeWorkEasier: string;
  };
}

export type AppSection =
  | 'overview'
  | 'residents'
  | 'workforce'
  | 'operations'
  | 'handover'
  | 'wellbeing';
