import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  HeartHandshake,
  LifeBuoy,
  MessageSquareHeart,
  Users,
} from 'lucide-react';
import { useCareStore } from '../context/CareStoreContext';
import { AppSection } from '../types';
import { Avatar } from './Avatar';
import { ConfirmationStatusLabel, TaskStatusLabel } from './StatusText';

interface ManagerOverviewProps {
  onNavigate: (section: AppSection, residentId?: string) => void;
}

export const ManagerOverview: React.FC<ManagerOverviewProps> = ({
  onNavigate,
}) => {
  const { data } = useCareStore();

  const pendingPreferences = data.preferences.filter(
    (p) =>
      p.isActive &&
      (p.confirmationStatus === 'Pending Review' ||
        p.confirmationStatus === 'Not Confirmed' ||
        p.confirmationStatus === 'Outdated')
  );

  const extraSupportResidents = data.residents.filter(
    (r) => r.extraSupportNeeded
  );

  const openSupportRequests = data.supportRequests.filter(
    (r) => r.status !== 'Resolved'
  );

  const activeExceptions = data.tasks.filter(
    (t) => t.exception && !t.exception.resolved
  );

  const unresolvedFeedback = data.feedbacks.filter(
    (f) => f.status !== 'Resolved'
  );

  const latestHandover = data.handovers[0];

  const onDutyStaff = data.staff.filter(
    (s) => s.availability === 'On Duty' && s.role !== 'System Administrator'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">
            Daily Overview — Kōwhai Grove Rest Home
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            People First, Tasks Second · Prioritising resident preferences, staff workload balance, and continuity across shifts.
          </p>
        </div>
        <div className="text-xs text-slate-500 tabular-nums shrink-0">
          Saturday, 21 November 2026 · 14-staff facility
        </div>
      </div>

      {/* Priority 1–4 Summary Strip (People & Support First) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('residents')}
          className="text-left p-5 bg-white border border-slate-200 hover:border-teal-600 rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>1. Resident Needs &amp; Preferences</span>
            <HeartHandshake className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2 text-2xl font-display font-semibold text-slate-900 tabular-nums">
            {pendingPreferences.length} to review
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {extraSupportResidents.length} residents needing extra support today
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('workforce')}
          className="text-left p-5 bg-white border border-slate-200 hover:border-teal-600 rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>2. Staff Availability &amp; Load</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2 text-2xl font-display font-semibold text-slate-900 tabular-nums">
            {onDutyStaff.length} on duty
          </div>
          <p className="mt-1 text-xs text-slate-600">
            3 daily shifts coordinated across Care &amp; Housekeeping
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('workforce')}
          className="text-left p-5 bg-white border border-slate-200 hover:border-teal-600 rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>4. Staff Support Requests</span>
            <LifeBuoy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-display font-semibold text-slate-900 tabular-nums">
            {openSupportRequests.length} active
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {openSupportRequests.filter((r) => r.status === 'Open').length} awaiting manager response
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('operations')}
          className="text-left p-5 bg-white border border-slate-200 hover:border-teal-600 rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>5. Important Exceptions</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-display font-semibold text-slate-900 tabular-nums">
            {activeExceptions.length} open
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Resident choices &amp; deferred items tracked gently
          </p>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Resident Needs & Preferences Pending Verification */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900">
                  Resident Preferences Awaiting Review
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Staff observations ready to be confirmed with residents or whānau.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('residents')}
                className="text-xs font-medium text-teal-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                All profiles <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-200">
              {pendingPreferences.length === 0 ? (
                <div className="p-6 text-sm text-slate-500 text-center">
                  All resident preferences are currently verified.
                </div>
              ) : (
                pendingPreferences.map((pref) => {
                  const res = data.residents.find((r) => r.id === pref.residentId);
                  return (
                    <div
                      key={pref.id}
                      className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70"
                    >
                      <div className="flex items-start gap-3">
                        {res && (
                          <Avatar name={res.name} src={res.photoUrl} size="sm" />
                        )}
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500">
                            <span className="font-medium text-slate-900">
                              {res?.name} ({res?.room})
                            </span>{' '}
                            · {pref.category} · {pref.source}
                          </div>
                          <p className="text-sm text-slate-800">
                            {pref.description}
                          </p>
                          <ConfirmationStatusLabel status={pref.confirmationStatus} />
                        </div>
                      </div>

                      {res && (
                        <button
                          type="button"
                          onClick={() => onNavigate('residents', res.id)}
                          className="text-xs font-medium text-teal-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Section 2 & 3: Care Allocation & Shift Overview */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-teal-700" />
                Three-Shift Care Allocation
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('workforce')}
                className="text-xs font-medium text-teal-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Adjust shifts <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-200">
              {data.shifts.map((sh) => {
                const sup = data.staff.find((s) => s.id === sh.supervisorId);
                return (
                  <div key={sh.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {sh.period} Shift ({sh.timeRange})
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Supervisor: {sup?.name || 'Unassigned'} · {sh.notes}
                      </p>
                    </div>
                    <div className="text-xs text-slate-700 tabular-nums shrink-0">
                      {sh.assignedStaffIds.length} staff · {sh.housekeepingRoutes.length} routes
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 5: Important Exceptions */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900">
                Recent Exceptions &amp; Deferred Support
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('operations')}
                className="text-xs font-medium text-teal-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Open tasks <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-slate-200">
              {activeExceptions.length === 0 ? (
                <div className="p-6 text-sm text-slate-500 text-center">
                  No unresolved exceptions today.
                </div>
              ) : (
                activeExceptions.map((task) => (
                  <div key={task.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {task.title} ({task.location})
                      </span>
                      <TaskStatusLabel status={task.status} />
                    </div>
                    <p className="text-xs text-slate-600">
                      {task.exception?.reason}: {task.exception?.notes}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section 4: Staff Support Requests */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900">
                Staff Support Requests
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('workforce')}
                className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
              >
                Respond
              </button>
            </div>
            <div className="divide-y divide-slate-200">
              {openSupportRequests.length === 0 ? (
                <div className="p-6 text-xs text-slate-500 text-center">
                  All staff support requests resolved.
                </div>
              ) : (
                openSupportRequests.map((req) => (
                  <div key={req.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-900">
                        {req.staffName} · {req.shift} Shift
                      </span>
                      <span
                        className={
                          req.status === 'Open'
                            ? 'text-amber-700 font-medium'
                            : 'text-teal-700 font-medium'
                        }
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800">
                      {req.requestType}
                    </p>
                    <p className="text-xs text-slate-600">{req.details}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Section 6: Handover Continuity */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900">
                Handover Continuity
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('handover')}
                className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
              >
                Open handover
              </button>
            </div>
            {latestHandover ? (
              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-900 font-medium">
                  <span>
                    {latestHandover.fromShift} → {latestHandover.toShift} Shift
                  </span>
                  <span className="text-slate-500 tabular-nums">
                    {latestHandover.acknowledgements.length} acknowledged
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {latestHandover.operationalNotes}
                </p>
              </div>
            ) : (
              <div className="p-6 text-xs text-slate-500">
                No handover brief generated yet today.
              </div>
            )}
          </section>

          {/* Section 7: Operational Improvement & Secondary Task Snapshot */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-teal-700" />
                Operational Improvement
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('wellbeing')}
                className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
              >
                Review feedback
              </button>
            </div>
            <div className="divide-y divide-slate-200">
              {unresolvedFeedback.slice(0, 2).map((fb) => (
                <div key={fb.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-800">
                      {fb.category} · {fb.department}
                    </span>
                    <span>{fb.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {fb.message}
                  </p>
                </div>
              ))}
              <div className="px-4 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>Daily task snapshot (secondary reference)</span>
                <span>
                  {data.tasks.filter((t) => t.status === 'Completed').length} of{' '}
                  {data.tasks.length} completed
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
