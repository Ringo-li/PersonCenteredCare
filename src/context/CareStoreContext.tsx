import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CareStoreData, SEED_DATA } from '../data/seedData';
import {
  ConfirmationStatus,
  DailyTask,
  Department,
  ExceptionReason,
  FeedbackCategory,
  HandoverBrief,
  PortalMode,
  PreferenceCategory,
  PreferenceHistoryEntry,
  PreferenceSource,
  Resident,
  ResidentPreference,
  ShiftPeriod,
  ShiftSchedule,
  StaffFeedback,
  StaffMember,
  StaffSupportRequest,
  StaffSurveyResponse,
  SupportRequestType,
  TaskStatus,
} from '../types';

const STORAGE_KEY = 'people_first_care_prototype_v1';

interface CareStoreContextValue {
  data: CareStoreData;
  activeStaff: StaffMember;
  portalMode: PortalMode;
  setActiveStaffId: (staffId: string) => void;
  setPortalMode: (mode: PortalMode) => void;
  resetDemoData: () => void;

  // Module 1: Resident Life Profile
  addResident: (resident: Omit<Resident, 'id'>) => Resident;
  updateResidentSupportFlag: (residentId: string, extraSupportNeeded: boolean) => void;
  addPreference: (input: {
    residentId: string;
    category: PreferenceCategory;
    description: string;
    source: PreferenceSource;
    confirmationStatus: ConfirmationStatus;
    relatedTaskTags: string[];
    confirmedBy?: string;
    reviewDueDate: string;
  }) => void;
  reviewAndUpdatePreference: (input: {
    preferenceId: string;
    description: string;
    confirmationStatus: ConfirmationStatus;
    source: PreferenceSource;
    reason: string;
    isActive: boolean;
    confirmedBy?: string;
    reviewDueDate?: string;
  }) => void;

  // Module 3: Workforce Coordination
  updateShiftStaff: (shiftId: string, assignedStaffIds: string[], supervisorId: string, notes: string) => void;
  createOrUpdateShift: (shift: Omit<ShiftSchedule, 'id'> & { id?: string }) => void;
  allocateResidentToStaff: (shiftId: string, staffId: string, residentId: string, assigned: boolean) => void;
  addHousekeepingRoute: (shiftId: string, staffId: string, routeName: string, areas: string[]) => void;
  submitSupportRequest: (input: {
    requestType: SupportRequestType;
    residentId?: string;
    details: string;
    shift: ShiftPeriod;
  }) => void;
  respondToSupportRequest: (requestId: string, status: 'Acknowledged' | 'Resolved', response: string) => void;

  // Module 2 & 4: Daily Operations & Care Guidance
  addTask: (task: Omit<DailyTask, 'id'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  reassignTask: (taskId: string, newStaffId: string) => void;
  recordTaskException: (input: {
    taskId: string;
    status: 'Unable to Complete' | 'Deferred';
    reason: ExceptionReason;
    notes: string;
    followUpRequested: boolean;
  }) => void;
  resolveTaskException: (taskId: string) => void;

  // Module 5: Smart Handover
  createHandoverBrief: (input: {
    fromShift: ShiftPeriod;
    toShift: ShiftPeriod;
    residentUpdates: string[];
    operationalNotes: string;
  }) => void;
  acknowledgeHandover: (handoverId: string) => void;

  // Module 6: Staff Wellbeing & Continuous Improvement
  submitFeedback: (input: {
    category: FeedbackCategory;
    message: string;
    isAnonymous: boolean;
    department: Department;
  }) => void;
  manageFeedback: (input: {
    feedbackId: string;
    status: StaffFeedback['status'];
    assignedFollowUp?: string;
    managerResponse?: string;
    recurringIssueTag?: string;
    timeForCareOpportunity?: string;
  }) => void;
  submitSurveyResponse: (input: {
    isAnonymous: boolean;
    department: Department;
    answers: StaffSurveyResponse['answers'];
  }) => void;
}

const CareStoreContext = createContext<CareStoreContextValue | null>(null);

function nowTimestamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function todayDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function CareStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CareStoreData>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as CareStoreData;
      }
    } catch {
      // Fallback to seed data if storage is unavailable or corrupted
    }
    return SEED_DATA;
  });

  const [activeStaffId, setActiveStaffIdState] = useState<string>('st-claire');
  const [portalMode, setPortalMode] = useState<PortalMode>('manager');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore storage quota errors
    }
  }, [data]);

  const activeStaff = useMemo(
    () => data.staff.find((s) => s.id === activeStaffId) ?? data.staff[0],
    [data.staff, activeStaffId]
  );

  const setActiveStaffId = (staffId: string) => {
    setActiveStaffIdState(staffId);
    const member = data.staff.find((s) => s.id === staffId);
    if (member) {
      if (member.role === 'Caregiver' || member.role === 'Housekeeper') {
        setPortalMode('staff');
      } else {
        setPortalMode('manager');
      }
    }
  };

  const resetDemoData = () => {
    setData(SEED_DATA);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addResident = (residentInput: Omit<Resident, 'id'>): Resident => {
    const newResident: Resident = {
      ...residentInput,
      id: `res-${Date.now().toString(36)}`,
    };
    setData((prev) => ({
      ...prev,
      residents: [newResident, ...prev.residents],
    }));
    return newResident;
  };

  const updateResidentSupportFlag = (residentId: string, extraSupportNeeded: boolean) => {
    setData((prev) => ({
      ...prev,
      residents: prev.residents.map((r) =>
        r.id === residentId ? { ...r, extraSupportNeeded } : r
      ),
    }));
  };

  const addPreference: CareStoreContextValue['addPreference'] = (input) => {
    const newPref: ResidentPreference = {
      id: `PREF-${Math.floor(200 + Math.random() * 799)}`,
      residentId: input.residentId,
      category: input.category,
      description: input.description,
      source: input.source,
      recordedBy: activeStaff.name,
      dateRecorded: todayDate(),
      confirmationStatus: input.confirmationStatus,
      confirmedBy:
        input.confirmationStatus === 'Confirmed by Resident' ||
        input.confirmationStatus === 'Confirmed through authorised representative' ||
        input.confirmationStatus === 'Staff Verified'
          ? input.confirmedBy || activeStaff.name
          : undefined,
      lastReviewed:
        input.confirmationStatus !== 'Pending Review' && input.confirmationStatus !== 'Not Confirmed'
          ? todayDate()
          : undefined,
      reviewDueDate: input.reviewDueDate,
      isActive: input.confirmationStatus !== 'Inactive',
      relatedTaskTags: input.relatedTaskTags,
    };

    const historyItem: PreferenceHistoryEntry = {
      id: `HIST-${Date.now().toString(36)}`,
      preferenceId: newPref.id,
      residentId: input.residentId,
      category: input.category,
      previousDescription: 'Initial record created',
      updatedDescription: input.description,
      previousStatus: 'Not Confirmed',
      updatedStatus: input.confirmationStatus,
      source: input.source,
      changedBy: activeStaff.name,
      changedAt: nowTimestamp(),
      reason: `Recorded via ${input.source}`,
    };

    setData((prev) => ({
      ...prev,
      preferences: [newPref, ...prev.preferences],
      preferenceHistory: [historyItem, ...prev.preferenceHistory],
    }));
  };

  const reviewAndUpdatePreference: CareStoreContextValue['reviewAndUpdatePreference'] = (input) => {
    setData((prev) => {
      const existing = prev.preferences.find((p) => p.id === input.preferenceId);
      if (!existing) return prev;

      const updated: ResidentPreference = {
        ...existing,
        description: input.description,
        confirmationStatus: input.confirmationStatus,
        source: input.source,
        confirmedBy:
          input.confirmedBy ??
          (input.confirmationStatus === 'Staff Verified'
            ? activeStaff.name
            : existing.confirmedBy),
        lastReviewed: todayDate(),
        reviewDueDate: input.reviewDueDate ?? existing.reviewDueDate,
        isActive: input.isActive,
      };

      const historyEntry: PreferenceHistoryEntry = {
        id: `HIST-${Date.now().toString(36)}`,
        preferenceId: existing.id,
        residentId: existing.residentId,
        category: existing.category,
        previousDescription: existing.description,
        updatedDescription: input.description,
        previousStatus: existing.confirmationStatus,
        updatedStatus: input.confirmationStatus,
        source: input.source,
        changedBy: activeStaff.name,
        changedAt: nowTimestamp(),
        reason: input.reason || 'Routine preference review',
      };

      return {
        ...prev,
        preferences: prev.preferences.map((p) =>
          p.id === input.preferenceId ? updated : p
        ),
        preferenceHistory: [historyEntry, ...prev.preferenceHistory],
      };
    });
  };

  const updateShiftStaff: CareStoreContextValue['updateShiftStaff'] = (
    shiftId,
    assignedStaffIds,
    supervisorId,
    notes
  ) => {
    setData((prev) => ({
      ...prev,
      shifts: prev.shifts.map((s) =>
        s.id === shiftId
          ? { ...s, assignedStaffIds, supervisorId, notes }
          : s
      ),
    }));
  };

  const createOrUpdateShift: CareStoreContextValue['createOrUpdateShift'] = (shiftInput) => {
    setData((prev) => {
      if (shiftInput.id) {
        return {
          ...prev,
          shifts: prev.shifts.map((s) =>
            s.id === shiftInput.id ? { ...s, ...shiftInput } as ShiftSchedule : s
          ),
        };
      }
      const created: ShiftSchedule = {
        ...shiftInput,
        id: `SH-${Date.now().toString(36)}`,
      };
      return {
        ...prev,
        shifts: [...prev.shifts, created],
      };
    });
  };

  const allocateResidentToStaff: CareStoreContextValue['allocateResidentToStaff'] = (
    shiftId,
    staffId,
    residentId,
    assigned
  ) => {
    setData((prev) => ({
      ...prev,
      shifts: prev.shifts.map((shift) => {
        if (shift.id !== shiftId) return shift;
        const existingAlloc = shift.residentAllocations.find((a) => a.staffId === staffId);
        let nextAllocations = [...shift.residentAllocations];
        if (existingAlloc) {
          nextAllocations = nextAllocations.map((a) => {
            if (a.staffId !== staffId) return a;
            const nextIds = assigned
              ? Array.from(new Set([...a.residentIds, residentId]))
              : a.residentIds.filter((id) => id !== residentId);
            return { ...a, residentIds: nextIds };
          });
        } else if (assigned) {
          nextAllocations.push({ staffId, residentIds: [residentId] });
        }
        return { ...shift, residentAllocations: nextAllocations };
      }),
    }));
  };

  const addHousekeepingRoute: CareStoreContextValue['addHousekeepingRoute'] = (
    shiftId,
    staffId,
    routeName,
    areas
  ) => {
    setData((prev) => ({
      ...prev,
      shifts: prev.shifts.map((shift) => {
        if (shift.id !== shiftId) return shift;
        return {
          ...shift,
          housekeepingRoutes: [
            ...shift.housekeepingRoutes,
            {
              id: `RT-${Date.now().toString(36)}`,
              staffId,
              routeName,
              areas,
            },
          ],
        };
      }),
    }));
  };

  const submitSupportRequest: CareStoreContextValue['submitSupportRequest'] = (input) => {
    const req: StaffSupportRequest = {
      id: `REQ-${Math.floor(10 + Math.random() * 89)}`,
      staffId: activeStaff.id,
      staffName: activeStaff.name,
      department: activeStaff.department === 'Housekeeping' ? 'Housekeeping' : 'Caregiving',
      shift: input.shift,
      requestType: input.requestType,
      residentId: input.residentId || undefined,
      details: input.details,
      status: 'Open',
      createdAt: nowTimestamp(),
    };
    setData((prev) => ({
      ...prev,
      supportRequests: [req, ...prev.supportRequests],
    }));
  };

  const respondToSupportRequest: CareStoreContextValue['respondToSupportRequest'] = (
    requestId,
    status,
    response
  ) => {
    setData((prev) => ({
      ...prev,
      supportRequests: prev.supportRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              managerResponse: response,
              respondedBy: activeStaff.name,
              respondedAt: nowTimestamp(),
            }
          : r
      ),
    }));
  };

  const addTask: CareStoreContextValue['addTask'] = (taskInput) => {
    const newTask: DailyTask = {
      ...taskInput,
      id: `TSK-${Math.floor(100 + Math.random() * 899)}`,
    };
    setData((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  };

  const updateTaskStatus: CareStoreContextValue['updateTaskStatus'] = (taskId, status) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
  };

  const reassignTask: CareStoreContextValue['reassignTask'] = (taskId, newStaffId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, assignedStaffId: newStaffId, status: 'Reassigned' } : t
      ),
    }));
  };

  const recordTaskException: CareStoreContextValue['recordTaskException'] = (input) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === input.taskId
          ? {
              ...t,
              status: input.status,
              exception: {
                reason: input.reason,
                notes: input.notes,
                followUpRequested: input.followUpRequested,
                recordedBy: activeStaff.name,
                recordedAt: nowTimestamp(),
                resolved: false,
              },
            }
          : t
      ),
    }));
  };

  const resolveTaskException: CareStoreContextValue['resolveTaskException'] = (taskId) => {
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId && t.exception
          ? {
              ...t,
              exception: { ...t.exception, resolved: true },
            }
          : t
      ),
    }));
  };

  const createHandoverBrief: CareStoreContextValue['createHandoverBrief'] = (input) => {
    const brief: HandoverBrief = {
      id: `HO-${Date.now().toString(36)}`,
      fromShift: input.fromShift,
      toShift: input.toShift,
      date: todayDate(),
      preparedBy: activeStaff.name,
      residentUpdates: input.residentUpdates,
      operationalNotes: input.operationalNotes,
      acknowledgements: [],
    };
    setData((prev) => ({
      ...prev,
      handovers: [brief, ...prev.handovers],
    }));
  };

  const acknowledgeHandover: CareStoreContextValue['acknowledgeHandover'] = (handoverId) => {
    setData((prev) => ({
      ...prev,
      handovers: prev.handovers.map((h) => {
        if (h.id !== handoverId) return h;
        const already = h.acknowledgements.some((a) => a.staffId === activeStaff.id);
        if (already) return h;
        return {
          ...h,
          acknowledgements: [
            ...h.acknowledgements,
            {
              staffId: activeStaff.id,
              staffName: activeStaff.name,
              role: activeStaff.role,
              acknowledgedAt: nowTimestamp(),
            },
          ],
        };
      }),
    }));
  };

  const submitFeedback: CareStoreContextValue['submitFeedback'] = (input) => {
    const fb: StaffFeedback = {
      id: `FB-${Math.floor(10 + Math.random() * 89)}`,
      category: input.category,
      message: input.message,
      isAnonymous: input.isAnonymous,
      submittedBy: input.isAnonymous ? undefined : activeStaff.name,
      department: input.department,
      submittedAt: todayDate(),
      status: 'New',
    };
    setData((prev) => ({
      ...prev,
      feedbacks: [fb, ...prev.feedbacks],
    }));
  };

  const manageFeedback: CareStoreContextValue['manageFeedback'] = (input) => {
    setData((prev) => ({
      ...prev,
      feedbacks: prev.feedbacks.map((f) =>
        f.id === input.feedbackId
          ? {
              ...f,
              status: input.status,
              assignedFollowUp: input.assignedFollowUp,
              managerResponse: input.managerResponse,
              recurringIssueTag: input.recurringIssueTag,
              timeForCareOpportunity: input.timeForCareOpportunity,
            }
          : f
      ),
    }));
  };

  const submitSurveyResponse: CareStoreContextValue['submitSurveyResponse'] = (input) => {
    const response: StaffSurveyResponse = {
      id: `SUR-${Date.now().toString(36)}`,
      cycle: 'November 2026 Monthly Pulse',
      isAnonymous: input.isAnonymous,
      respondentName: input.isAnonymous ? undefined : activeStaff.name,
      department: input.department,
      submittedAt: todayDate(),
      answers: input.answers,
    };
    setData((prev) => ({
      ...prev,
      surveyResponses: [response, ...prev.surveyResponses],
    }));
  };

  return (
    <CareStoreContext.Provider
      value={{
        data,
        activeStaff,
        portalMode,
        setActiveStaffId,
        setPortalMode,
        resetDemoData,
        addResident,
        updateResidentSupportFlag,
        addPreference,
        reviewAndUpdatePreference,
        updateShiftStaff,
        createOrUpdateShift,
        allocateResidentToStaff,
        addHousekeepingRoute,
        submitSupportRequest,
        respondToSupportRequest,
        addTask,
        updateTaskStatus,
        reassignTask,
        recordTaskException,
        resolveTaskException,
        createHandoverBrief,
        acknowledgeHandover,
        submitFeedback,
        manageFeedback,
        submitSurveyResponse,
      }}
    >
      {children}
    </CareStoreContext.Provider>
  );
}

export function useCareStore() {
  const ctx = useContext(CareStoreContext);
  if (!ctx) {
    throw new Error('useCareStore must be used within CareStoreProvider');
  }
  return ctx;
}
