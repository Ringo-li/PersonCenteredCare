import React, { useMemo } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  HeartHandshake,
  LifeBuoy,
  MessageSquareHeart,
  Sparkles,
} from 'lucide-react';
import { useCareStore } from '../context/CareStoreContext';
import { AppSection, DailyTask, Resident, ResidentPreference } from '../types';
import { Avatar } from './Avatar';
import { TaskStatusLabel } from './StatusText';

interface StaffPortalHomeProps {
  onNavigate: (
    section: AppSection,
    residentId?: string,
    taskId?: string
  ) => void;
}

function getTimePhase(plannedTime: string, shiftPeriod: string): string {
  const hour = Number(plannedTime.split(':')[0] || 0);
  if (shiftPeriod === 'Afternoon') {
    if (hour < 17) return '14:45 – 17:00 · Afternoon Handover & Personal Care';
    if (hour < 20) return '17:00 – 20:00 · Evening Meal & Hydration';
    return '20:00 – 22:45 · Settling & Night Handover';
  }
  if (shiftPeriod === 'Night') {
    if (hour >= 22 || hour < 4) return '22:30 – 04:00 · Quiet Rounds & Comfort';
    return '04:00 – 07:15 · Early Risers & Morning Handover';
  }
  if (hour < 9) return '07:00 – 09:00 · Arrival, Handover & Early Morning Care';
  if (hour < 12) return '09:00 – 12:00 · Mid-Morning Routines, Activities & Rooms';
  return '12:00 – 15:00 · Midday Meals, Quiet Rest & Shift Handover';
}

export const StaffPortalHome: React.FC<StaffPortalHomeProps> = ({
  onNavigate,
}) => {
  const { data, activeStaff, setActiveStaffId, updateTaskStatus } = useCareStore();

  const staffViewOptions = useMemo(
    () =>
      data.staff.filter(
        (s) => s.role === 'Caregiver' || s.role === 'Housekeeper' || s.role === 'Supervisor'
      ),
    [data.staff]
  );

  const myShifts = useMemo(
    () => data.shifts.filter((s) => s.assignedStaffIds.includes(activeStaff.id)),
    [data.shifts, activeStaff.id]
  );

  const primaryShift = myShifts[0];
  const morningShift = data.shifts.find((s) => s.period === 'Morning');

  const morningResidentIds = useMemo(() => {
    if (!morningShift) return [];
    return (
      morningShift.residentAllocations.find((a) => a.staffId === activeStaff.id)
        ?.residentIds || []
    );
  }, [morningShift, activeStaff.id]);

  const myResidentIds = useMemo(
    () =>
      Array.from(
        new Set(
          myShifts.flatMap(
            (s) =>
              s.residentAllocations.find((a) => a.staffId === activeStaff.id)
                ?.residentIds || []
          )
        )
      ),
    [myShifts, activeStaff.id]
  );

  const myResidents: Resident[] = useMemo(
    () => data.residents.filter((r) => myResidentIds.includes(r.id)),
    [data.residents, myResidentIds]
  );

  const myRoutes = useMemo(
    () =>
      myShifts.flatMap((s) =>
        s.housekeepingRoutes
          .filter((rt) => rt.staffId === activeStaff.id)
          .map((rt) => ({ ...rt, shiftPeriod: s.period }))
      ),
    [myShifts, activeStaff.id]
  );

  const myTasks = useMemo(
    () =>
      data.tasks
        .filter((t) => t.assignedStaffId === activeStaff.id)
        .slice()
        .sort((a, b) => a.plannedTime.localeCompare(b.plannedTime)),
    [data.tasks, activeStaff.id]
  );

  const myOpenTasks = myTasks.filter((t) => t.status !== 'Completed');
  const totalMinutesToday = myTasks.reduce((acc, t) => acc + t.estimatedMinutes, 0);

  // Residents whose rooms or care fall under this staff member today (including housekeeping routes)
  const relevantResidentsForSpecials: Resident[] = useMemo(() => {
    if (activeStaff.department === 'Housekeeping') {
      const taskResIds = new Set(
        myTasks.map((t) => t.residentId).filter(Boolean) as string[]
      );
      return data.residents.filter((r) => taskResIds.has(r.id));
    }
    return myResidents;
  }, [activeStaff.department, data.residents, myResidents, myTasks]);

  const specialConsiderations = useMemo(() => {
    const items: {
      id: string;
      resident: Resident;
      title: string;
      detail: string;
      kind: 'priority' | 'preference';
    }[] = [];

    relevantResidentsForSpecials.forEach((res) => {
      if (res.extraSupportNeeded) {
        items.push({
          id: `extra-${res.id}`,
          resident: res,
          title: 'Extra support needed today',
          detail: res.supportFocus,
          kind: 'priority',
        });
      }

      const resPrefs = data.preferences.filter(
        (p) => p.residentId === res.id && p.isActive
      );

      resPrefs.forEach((pref) => {
        const isHousekeepingMatch =
          activeStaff.department === 'Housekeeping' &&
          pref.relatedTaskTags.some((tag) =>
            ['bedroom', 'cleaning', 'linen', 'bed', 'vacuum', 'bathroom', 'room comfort'].includes(
              tag.toLowerCase()
            )
          );
        const isCaregivingMatch = activeStaff.department !== 'Housekeeping';

        if (isHousekeepingMatch || isCaregivingMatch) {
          items.push({
            id: pref.id,
            resident: res,
            title: `${pref.category} (${pref.source})`,
            detail: pref.description,
            kind:
              pref.confirmationStatus === 'Pending Review'
                ? 'priority'
                : 'preference',
          });
        }
      });
    });

    return items;
  }, [relevantResidentsForSpecials, data.preferences, activeStaff.department]);

  const groupedWholeDayTasks = useMemo(() => {
    const period = primaryShift?.period || 'Morning';
    const groups = new Map<string, DailyTask[]>();
    myTasks.forEach((task) => {
      const phase = getTimePhase(task.plannedTime, task.shift || period);
      const existing = groups.get(phase) || [];
      existing.push(task);
      groups.set(phase, existing);
    });
    return Array.from(groups.entries());
  }, [myTasks, primaryShift]);

  const getMatchingTaskPreference = (
    task: DailyTask
  ): ResidentPreference | undefined => {
    if (!task.residentId) return undefined;
    const resPrefs = data.preferences.filter(
      (p) => p.residentId === task.residentId && p.isActive
    );
    const taskWords = new Set([
      ...task.relatedTags.map((x) => x.toLowerCase()),
      task.category.toLowerCase(),
      ...task.title.toLowerCase().split(/\s+/),
    ]);
    return (
      resPrefs.find((pref) =>
        pref.relatedTaskTags.some((tag) => {
          const low = tag.toLowerCase();
          return (
            taskWords.has(low) ||
            Array.from(taskWords).some((w) => w.includes(low) || low.includes(w))
          );
        })
      ) || resPrefs[0]
    );
  };

  const unackHandovers = data.handovers.filter(
    (h) => !h.acknowledgements.some((a) => a.staffId === activeStaff.id)
  );

  const isMorningRostered = Boolean(
    morningShift?.assignedStaffIds.includes(activeStaff.id)
  );
  const morningCount =
    activeStaff.department === 'Housekeeping'
      ? myRoutes.filter((r) => r.shiftPeriod === 'Morning').length > 0
        ? data.residents.length
        : 0
      : morningResidentIds.length;

  return (
    <div className="space-y-6">
      {/* Staff Welcome Header + Quick Staff Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            name={activeStaff.name}
            src={activeStaff.photoUrl}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">
              Whole-Day Work Guideline — {activeStaff.name}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {activeStaff.role} · {activeStaff.department} ·{' '}
              {primaryShift
                ? `${primaryShift.period} Shift (${primaryShift.timeRange})`
                : 'Shift Overview'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Preview staff member whole-day view"
            value={activeStaff.id}
            onChange={(e) => setActiveStaffId(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            {staffViewOptions.map((s) => (
              <option key={s.id} value={s.id}>
                Staff View: {s.name} ({s.role})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onNavigate('workforce')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-teal-700" />
            Request Support
          </button>
          <button
            type="button"
            onClick={() => onNavigate('operations')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Open Task Guidance
          </button>
        </div>
      </div>

      {/* Shift & Morning Load Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Today&apos;s Shift</span>
            <CalendarDays className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2 text-xl font-display font-semibold text-slate-900">
            {primaryShift ? `${primaryShift.period} Shift` : 'Not Rostered'}
          </div>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {primaryShift
              ? `${primaryShift.timeRange} · ${primaryShift.date}`
              : 'See Handover for upcoming shifts'}
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {activeStaff.department === 'Housekeeping'
                ? 'Morning Shift Rooms'
                : 'Morning Shift Residents'}
            </span>
            <HeartHandshake className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2 text-xl font-display font-semibold text-slate-900 tabular-nums">
            {activeStaff.department === 'Housekeeping'
              ? isMorningRostered
                ? `${morningCount} resident rooms + 2 lounges`
                : 'Afternoon / Off morning'
              : isMorningRostered
              ? `${morningCount} resident${morningCount === 1 ? '' : 's'} assigned`
              : `${myResidents.length} resident${myResidents.length === 1 ? '' : 's'} (${primaryShift?.period || 'Next'} shift)`}
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {activeStaff.department === 'Housekeeping'
              ? myRoutes[0]?.areas.join(' · ') || 'See route details below'
              : myResidents.length > 0
              ? myResidents.map((r) => r.preferredName).join(', ')
              : 'No residents assigned'}
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Special Considerations</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-display font-semibold text-slate-900 tabular-nums">
            {specialConsiderations.length} note
            {specialConsiderations.length === 1 ? '' : 's'} to keep in mind
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {
              relevantResidentsForSpecials.filter((r) => r.extraSupportNeeded)
                .length
            }{' '}
            resident requiring extra support today
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Whole-Day Task Plan</span>
            <ClipboardList className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2 text-xl font-display font-semibold text-slate-900 tabular-nums">
            {myTasks.length} tasks ({totalMinutesToday} min)
          </div>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {myOpenTasks.length} remaining ·{' '}
            {unackHandovers.length === 0
              ? 'Handover acknowledged'
              : `${unackHandovers.length} handover pending`}
          </p>
        </div>
      </div>

      {/* Main Two-Column Staff Whole-Day View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Chronological Whole-Day Work Guideline */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-display font-semibold text-slate-900">
                Your Whole-Day Work Guideline
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Step-by-step daily rhythm from shift arrival to handover, with resident preferences surfaced inline.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('operations')}
              className="text-xs font-medium text-teal-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Full task workspace <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {primaryShift?.notes && (
            <div className="px-5 py-3 bg-teal-50/60 border-b border-slate-200 text-xs text-teal-900">
              <span className="font-semibold">Shift Briefing Note:</span>{' '}
              {primaryShift.notes}
            </div>
          )}

          {groupedWholeDayTasks.length === 0 ? (
            <div className="p-8 text-sm text-slate-500 text-center">
              No individual tasks scheduled for {activeStaff.name} right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {groupedWholeDayTasks.map(([phaseLabel, phaseTasks]) => (
                <div key={phaseLabel}>
                  <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      {phaseLabel}
                    </span>
                    <span className="font-mono tabular-nums font-normal text-slate-500">
                      {phaseTasks.length} item{phaseTasks.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {phaseTasks.map((task) => {
                      const res = task.residentId
                        ? data.residents.find((r) => r.id === task.residentId)
                        : undefined;
                      const matchedPref = getMatchingTaskPreference(task);

                      return (
                        <div key={task.id} className="p-5 space-y-3 hover:bg-slate-50/60">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                                <span className="font-mono font-medium text-slate-800">
                                  {task.plannedTime}
                                </span>
                                <span>·</span>
                                <span>~{task.estimatedMinutes} min</span>
                                <span>·</span>
                                <span>
                                  {res
                                    ? `${res.preferredName} (${task.location})`
                                    : task.location}
                                </span>
                                <span>·</span>
                                <span>{task.category}</span>
                              </div>
                              <h3 className="text-sm font-semibold text-slate-900 mt-1">
                                {task.title}
                              </h3>
                            </div>
                            <TaskStatusLabel status={task.status} />
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {task.description}
                          </p>

                          {/* Special / Preference Note directly in the daily guideline */}
                          {(matchedPref || task.extraTimeFlag || res?.extraSupportNeeded) && (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                              {res?.extraSupportNeeded && (
                                <div className="font-medium text-amber-800">
                                  Special consideration: {res.supportFocus}
                                </div>
                              )}
                              {matchedPref && (
                                <div className="text-slate-700 flex items-start gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                                  <span>
                                    <span className="font-medium text-slate-900">
                                      Preference ({matchedPref.confirmationStatus}):
                                    </span>{' '}
                                    {matchedPref.description}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {task.exception && (
                            <div className="text-xs text-amber-800">
                              Exception logged ({task.exception.reason}):{' '}
                              {task.exception.notes}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex items-center gap-2">
                              {task.status !== 'In Progress' &&
                                task.status !== 'Completed' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateTaskStatus(task.id, 'In Progress')
                                    }
                                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer"
                                  >
                                    Start
                                  </button>
                                )}
                              {task.status !== 'Completed' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateTaskStatus(task.id, 'Completed')
                                  }
                                  className="px-2.5 py-1 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-md cursor-pointer"
                                >
                                  Complete
                                </button>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onNavigate('operations', task.residentId, task.id)
                              }
                              className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                            >
                              Full Care Guidance &amp; Exceptions
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right 5 cols: Morning Residents / Routes + Special Considerations + Wellbeing */}
        <div className="lg:col-span-5 space-y-6">
          {/* Allocated Residents / Cleaning Routes */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  {activeStaff.department === 'Housekeeping'
                    ? 'My Cleaning Routes & Rooms'
                    : `My Residents (${myResidents.length})`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeStaff.department === 'Housekeeping'
                    ? 'Follow room order & resident timing preferences'
                    : isMorningRostered
                    ? `Handling ${morningCount} residents on the Morning Shift`
                    : 'Click any resident to open their full Life Profile'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('residents')}
                className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
              >
                All profiles
              </button>
            </div>

            {activeStaff.department === 'Housekeeping' ? (
              <div className="divide-y divide-slate-200">
                {myRoutes.length === 0 ? (
                  <div className="p-6 text-xs text-slate-500">
                    No housekeeping routes allocated yet.
                  </div>
                ) : (
                  myRoutes.map((rt) => (
                    <div key={rt.id} className="p-4 space-y-1.5">
                      <div className="text-sm font-medium text-slate-900">
                        {rt.routeName} ({rt.shiftPeriod} Shift)
                      </div>
                      <p className="text-xs text-slate-600">
                        Areas: {rt.areas.join(' · ')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {myResidents.length === 0 ? (
                  <div className="p-6 text-xs text-slate-500">
                    No residents allocated on this shift yet.
                  </div>
                ) : (
                  myResidents.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => onNavigate('residents', res.id)}
                      className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={res.name} src={res.photoUrl} size="sm" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {res.preferredName} ({res.room})
                            {res.extraSupportNeeded ? ' · Extra Support' : ''}
                          </div>
                          <p className="text-xs text-slate-500">
                            {res.supportFocus}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Special Considerations & Individual Preferences Summary */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-display font-semibold text-slate-900">
                Special Considerations for Today&apos;s Shift
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Key individual details, timing preferences, and dignity notes across your assigned rooms.
              </p>
            </div>

            <div className="divide-y divide-slate-200 max-h-[380px] overflow-y-auto">
              {specialConsiderations.length === 0 ? (
                <div className="p-5 text-xs text-slate-500">
                  No special flags recorded for your current assignments.
                </div>
              ) : (
                specialConsiderations.map((item) => (
                  <div key={item.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900">
                        {item.resident.preferredName} ({item.resident.room})
                      </span>
                      <span
                        className={
                          item.kind === 'priority'
                            ? 'text-amber-700 font-medium'
                            : 'text-teal-700 font-medium'
                        }
                      >
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Handover & Wellbeing Quick Card */}
          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-teal-700" />
                Handover &amp; Staff Voice
              </h2>
              {unackHandovers.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigate('handover')}
                  className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                >
                  Acknowledge Handover
                </button>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Need help with a transfer, more time for a resident, or want to flag a new observation? You can submit a support request or feedback anytime.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('wellbeing')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Submit Feedback or Survey
              </button>
              <button
                type="button"
                onClick={() => onNavigate('handover')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Next Shift Preview
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
