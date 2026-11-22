import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  HeartHandshake,
  LifeBuoy,
  MessageSquareHeart,
} from 'lucide-react';
import { useCareStore } from '../context/CareStoreContext';
import { AppSection } from '../types';
import { Avatar } from './Avatar';
import { TaskStatusLabel } from './StatusText';

interface StaffPortalHomeProps {
  onNavigate: (section: AppSection, residentId?: string) => void;
}

export const StaffPortalHome: React.FC<StaffPortalHomeProps> = ({
  onNavigate,
}) => {
  const { data, activeStaff } = useCareStore();

  const myShifts = data.shifts.filter((s) =>
    s.assignedStaffIds.includes(activeStaff.id)
  );

  const myResidentIds = Array.from(
    new Set(
      myShifts.flatMap(
        (s) =>
          s.residentAllocations.find((a) => a.staffId === activeStaff.id)
            ?.residentIds || []
      )
    )
  );

  const myResidents = data.residents.filter((r) => myResidentIds.includes(r.id));

  const myRoutes = myShifts.flatMap((s) =>
    s.housekeepingRoutes
      .filter((rt) => rt.staffId === activeStaff.id)
      .map((rt) => ({ ...rt, shiftPeriod: s.period }))
  );

  const myTasks = data.tasks.filter((t) => t.assignedStaffId === activeStaff.id);
  const myOpenTasks = myTasks.filter((t) => t.status !== 'Completed');

  const unackHandovers = data.handovers.filter(
    (h) => !h.acknowledgements.some((a) => a.staffId === activeStaff.id)
  );

  return (
    <div className="space-y-6">
      {/* Staff Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            name={activeStaff.name}
            src={activeStaff.photoUrl}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">
              Kia ora, {activeStaff.name}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              {activeStaff.role} · {activeStaff.department} · Staff Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            Open My Tasks &amp; Guidance
          </button>
        </div>
      </div>

      {/* Staff Portal Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>My Schedule</span>
            <CalendarDays className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2 text-xl font-display font-semibold text-slate-900">
            {myShifts.length > 0
              ? `${myShifts[0].period} Shift`
              : 'No Shift Today'}
          </div>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {myShifts.length > 0
              ? `${myShifts[0].timeRange} · ${myShifts[0].date}`
              : 'Preview upcoming shifts in Handover'}
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {activeStaff.department === 'Housekeeping'
                ? 'My Cleaning Routes'
                : 'My Allocated Residents'}
            </span>
            <HeartHandshake className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2 text-xl font-display font-semibold text-slate-900 tabular-nums">
            {activeStaff.department === 'Housekeeping'
              ? `${myRoutes.length} route${myRoutes.length === 1 ? '' : 's'}`
              : `${myResidents.length} resident${myResidents.length === 1 ? '' : 's'}`}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Preferences linked directly inside each task
          </p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Handover Continuity</span>
            <ClipboardList className="w-4 h-4 text-teal-700" />
          </div>
          <div className="mt-2 text-xl font-display font-semibold text-slate-900 tabular-nums">
            {unackHandovers.length === 0
              ? 'Up to date'
              : `${unackHandovers.length} to acknowledge`}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {myOpenTasks.length} active task{myOpenTasks.length === 1 ? '' : 's'} remaining
          </p>
        </div>
      </div>

      {/* Main Two-Column Staff View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: My Daily Tasks */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-display font-semibold text-slate-900">
              My Daily Tasks &amp; Personalised Guidance
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('operations')}
              className="text-xs font-medium text-teal-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              View all &amp; guidance <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-200">
            {myTasks.length === 0 ? (
              <div className="p-6 text-sm text-slate-500 text-center">
                No tasks currently assigned to you today.
              </div>
            ) : (
              myTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {task.title}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      {task.plannedTime} · {task.location} · {task.category}
                    </p>
                  </div>
                  <TaskStatusLabel status={task.status} />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right: My Residents / Routes & Wellbeing */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900">
                {activeStaff.department === 'Housekeeping'
                  ? 'My Rooms & Cleaning Routes'
                  : 'My Residents Today'}
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('residents')}
                className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
              >
                Profiles
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
                    <div key={rt.id} className="p-4 space-y-1">
                      <div className="text-sm font-medium text-slate-900">
                        {rt.routeName} ({rt.shiftPeriod})
                      </div>
                      <p className="text-xs text-slate-600">
                        {rt.areas.join(' · ')}
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

          <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-display font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-teal-700" />
                Your Voice Matters
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
              Notice a resident preference, supply bottleneck, or heavy morning rush? Share observations or anonymous feedback anytime.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('wellbeing')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Submit Feedback or Survey
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
