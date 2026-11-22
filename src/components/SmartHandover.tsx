import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FilePlus2,
  Info,
  X,
} from 'lucide-react';
import { useCareStore } from '../context/CareStoreContext';
import { ShiftPeriod } from '../types';
import { TaskStatusLabel } from './StatusText';

export const SmartHandover: React.FC = () => {
  const { data, activeStaff, createHandoverBrief, acknowledgeHandover } =
    useCareStore();

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [fromShift, setFromShift] = useState<ShiftPeriod>('Morning');
  const [toShift, setToShift] = useState<ShiftPeriod>('Afternoon');
  const [customUpdate, setCustomUpdate] = useState('');
  const [opNotes, setOpNotes] = useState('');

  // Live compiled continuity data across shifts
  const liveExceptions = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          t.exception &&
          t.exception.followUpRequested &&
          !t.exception.resolved
      ),
    [data.tasks]
  );

  const outstandingTasks = useMemo(
    () =>
      data.tasks.filter(
        (t) =>
          t.status === 'Not Started' ||
          t.status === 'In Progress' ||
          t.status === 'Deferred' ||
          t.status === 'Unable to Complete'
      ),
    [data.tasks]
  );

  const openSupport = useMemo(
    () => data.supportRequests.filter((r) => r.status !== 'Resolved'),
    [data.supportRequests]
  );

  const recentPrefChanges = useMemo(
    () => data.preferenceHistory.slice(0, 4),
    [data.preferenceHistory]
  );

  // Next Shift Preview for the currently signed-in employee
  const upcomingEmployeeShifts = useMemo(() => {
    return data.shifts.map((shift) => {
      const isAssigned = shift.assignedStaffIds.includes(activeStaff.id);
      const alloc = shift.residentAllocations.find(
        (a) => a.staffId === activeStaff.id
      );
      const routes = shift.housekeepingRoutes.filter(
        (r) => r.staffId === activeStaff.id
      );
      const myTasks = data.tasks.filter(
        (t) => t.shift === shift.period && t.assignedStaffId === activeStaff.id
      );
      return {
        shift,
        isAssigned,
        residents: alloc
          ? alloc.residentIds
              .map((id) => data.residents.find((r) => r.id === id))
              .filter(Boolean)
          : [],
        routes,
        myTasks,
      };
    });
  }, [data.shifts, data.residents, data.tasks, activeStaff.id]);

  const handleGenerateBrief = (e: React.FormEvent) => {
    e.preventDefault();
    const compiledUpdates: string[] = [];
    if (customUpdate.trim()) {
      compiledUpdates.push(customUpdate.trim());
    }
    liveExceptions.forEach((t) => {
      const res = data.residents.find((r) => r.id === t.residentId);
      compiledUpdates.push(
        `${res ? res.preferredName : t.location}: ${t.title} (${t.status} — ${t.exception?.reason})`
      );
    });
    if (compiledUpdates.length === 0) {
      compiledUpdates.push('All scheduled resident preferences and routines proceeding calmly.');
    }

    createHandoverBrief({
      fromShift,
      toShift,
      residentUpdates: compiledUpdates,
      operationalNotes:
        opNotes.trim() ||
        `Compiled ${outstandingTasks.length} active/deferred tasks and ${openSupport.length} open support requests for ${toShift} Shift review.`,
    });
    setShowGenerateModal(false);
    setCustomUpdate('');
    setOpNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">
            Smart Handover &amp; Shift Continuity
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Continuity across Morning, Afternoon, and Night shifts—preserving resident preferences, exceptions, and support needs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowGenerateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FilePlus2 className="w-4 h-4" />
          Generate Handover Brief
        </button>
      </div>

      {/* Clinical Boundary Notice */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
        <span>
          Digital handover complements, and does not replace, mandatory clinical handover or urgent direct verbal communication between shifts.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Handover Briefs & Acknowledgements */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Handover Briefs */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900">
                Shift Handover Briefs
              </h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {data.handovers.length} brief{data.handovers.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="divide-y divide-slate-200">
              {data.handovers.map((ho) => {
                const alreadyAck = ho.acknowledgements.some(
                  (a) => a.staffId === activeStaff.id
                );

                return (
                  <div key={ho.id} className="p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-display font-semibold text-slate-900">
                        <span>{ho.fromShift} Shift</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span>{ho.toShift} Shift</span>
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {ho.date} · Prepared by {ho.preparedBy}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-slate-700">
                        Relevant Resident Updates
                      </h3>
                      <ul className="space-y-1.5 text-sm text-slate-800 list-disc pl-4">
                        {ho.residentUpdates.map((upd, idx) => (
                          <li key={idx}>{upd}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-700 mb-1">
                        Operational Notes
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {ho.operationalNotes}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        {ho.acknowledgements.length === 0 ? (
                          <span>Awaiting incoming team acknowledgement</span>
                        ) : (
                          <span>
                            Acknowledged by:{' '}
                            {ho.acknowledgements
                              .map((a) => `${a.staffName} (${a.acknowledgedAt.slice(11)})`)
                              .join(', ')}
                          </span>
                        )}
                      </div>

                      {alreadyAck ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 whitespace-nowrap">
                          <CheckCircle2 className="w-4 h-4" />
                          Acknowledged by you
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acknowledgeHandover(ho.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          Acknowledge Handover
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Next Shift Preview */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-display font-semibold text-slate-900">
                Next Shift Preview for {activeStaff.name}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Advance visibility into upcoming shift allocations, cleaning routes, and resident tasks.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {upcomingEmployeeShifts.map(
                ({ shift, isAssigned, residents, routes, myTasks }) => (
                  <div key={shift.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">
                        {shift.period} Shift ({shift.timeRange})
                      </span>
                      <span
                        className={
                          isAssigned
                            ? 'text-teal-700 font-medium'
                            : 'text-slate-500'
                        }
                      >
                        {isAssigned ? 'You are rostered' : 'View only'}
                      </span>
                    </div>

                    {residents.length > 0 && (
                      <p className="text-xs text-slate-700">
                        Allocated residents:{' '}
                        {residents
                          .map((r) => `${r!.preferredName} (${r!.room})`)
                          .join(' · ')}
                      </p>
                    )}

                    {routes.length > 0 && (
                      <p className="text-xs text-slate-700">
                        Housekeeping route: {routes.map((rt) => rt.routeName).join(', ')}
                      </p>
                    )}

                    {myTasks.length > 0 ? (
                      <div className="pt-1 space-y-1">
                        {myTasks.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs text-slate-600"
                          >
                            <span>
                              {t.plannedTime} · {t.title} ({t.location})
                            </span>
                            <TaskStatusLabel status={t.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        No individual tasks assigned to you on this shift.
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        </div>

        {/* Right 5 cols: Live Shift Continuity Feed */}
        <aside className="lg:col-span-5 space-y-6">
          {/* Exceptions & Follow-ups */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-display font-semibold text-slate-900">
                Exceptions Requiring Follow-Up ({liveExceptions.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {liveExceptions.length === 0 ? (
                <div className="p-5 text-xs text-slate-500">
                  No unresolved task exceptions currently flagged.
                </div>
              ) : (
                liveExceptions.map((t) => (
                  <div key={t.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-900">
                        {t.title} ({t.location})
                      </span>
                      <span className="text-amber-700 font-medium">
                        {t.exception?.reason}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{t.exception?.notes}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Important Preference Changes */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-display font-semibold text-slate-900">
                Recent Preference Changes
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {recentPrefChanges.map((ch) => {
                const res = data.residents.find((r) => r.id === ch.residentId);
                return (
                  <div key={ch.id} className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 tabular-nums">
                      <span className="font-medium text-slate-900">
                        {res?.preferredName || 'Resident'} · {ch.category}
                      </span>
                      <span>{ch.changedAt}</span>
                    </div>
                    <p className="text-xs text-slate-700">{ch.updatedDescription}</p>
                    <p className="text-[11px] text-slate-500">
                      Status: {ch.updatedStatus} · By {ch.changedBy}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Outstanding Tasks & Open Support */}
          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-display font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-700" />
                Active Support &amp; Deferred Work
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {openSupport.map((req) => (
                <div key={req.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-900">
                      Support: {req.requestType}
                    </span>
                    <span className="text-amber-700 font-medium">{req.status}</span>
                  </div>
                  <p className="text-xs text-slate-600">{req.details}</p>
                </div>
              ))}
              <div className="p-4 text-xs text-slate-600 tabular-nums">
                {outstandingTasks.length} scheduled or deferred tasks visible across upcoming shifts.
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Modal: Generate Handover Brief */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Generate Smart Handover Brief
              </h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerateBrief} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Automatically includes {liveExceptions.length} open exception(s), recent preference changes, and {openSupport.length} support request(s).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Outgoing Shift
                  </label>
                  <select
                    value={fromShift}
                    onChange={(e) => setFromShift(e.target.value as ShiftPeriod)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Incoming Shift
                  </label>
                  <select
                    value={toShift}
                    onChange={(e) => setToShift(e.target.value as ShiftPeriod)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                    <option value="Morning">Morning</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resident Continuity Highlight
                </label>
                <textarea
                  rows={2}
                  value={customUpdate}
                  onChange={(e) => setCustomUpdate(e.target.value)}
                  placeholder="e.g., Eleanor enjoyed classical music after morning tea and is resting calmly."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Operational &amp; Housekeeping Notes
                </label>
                <textarea
                  rows={2}
                  value={opNotes}
                  onChange={(e) => setOpNotes(e.target.value)}
                  placeholder="Supplies, deferred room refreshes, or staffing notes..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Publish Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
