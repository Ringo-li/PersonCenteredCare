import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  LifeBuoy,
  MapPin,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { useCareStore } from '../context/CareStoreContext';
import {
  ShiftPeriod,
  SUPPORT_REQUEST_TYPES,
  SupportRequestType,
} from '../types';
import { Avatar } from './Avatar';

export const WorkforceCoordination: React.FC = () => {
  const {
    data,
    activeStaff,
    updateShiftStaff,
    createOrUpdateShift,
    allocateResidentToStaff,
    addHousekeepingRoute,
    submitSupportRequest,
    respondToSupportRequest,
  } = useCareStore();

  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    data.shifts[0]?.id || ''
  );
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showNewShiftModal, setShowNewShiftModal] = useState(false);

  // Support Request Form
  const [reqType, setReqType] = useState<SupportRequestType>(
    SUPPORT_REQUEST_TYPES[0]
  );
  const [reqShift, setReqShift] = useState<ShiftPeriod>('Morning');
  const [reqResidentId, setReqResidentId] = useState('');
  const [reqDetails, setReqDetails] = useState('');

  // Manager Response state
  const [respondingReqId, setRespondingReqId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // Housekeeping Route Form
  const [routeStaffId, setRouteStaffId] = useState(
    data.staff.find((s) => s.department === 'Housekeeping')?.id || ''
  );
  const [routeName, setRouteName] = useState('');
  const [routeAreas, setRouteAreas] = useState('');

  // New Shift Form
  const [newShiftDate, setNewShiftDate] = useState('2026-11-22');
  const [newShiftPeriod, setNewShiftPeriod] = useState<ShiftPeriod>('Morning');
  const [newShiftTime, setNewShiftTime] = useState('07:00 – 15:00');
  const [newShiftSup, setNewShiftSup] = useState('st-grace');
  const [newShiftNotes, setNewShiftNotes] = useState('');

  const selectedShift =
    data.shifts.find((s) => s.id === selectedShiftId) ?? data.shifts[0];

  // Workload balance calculation (strictly supportive, never ranking staff)
  const shiftWorkloadStats = useMemo(() => {
    if (!selectedShift) return [];
    return selectedShift.assignedStaffIds.map((staffId) => {
      const member = data.staff.find((s) => s.id === staffId);
      const alloc = selectedShift.residentAllocations.find(
        (a) => a.staffId === staffId
      );
      const residentCount = alloc ? alloc.residentIds.length : 0;
      const extraNeedsCount = alloc
        ? alloc.residentIds.filter(
            (rid) => data.residents.find((r) => r.id === rid)?.extraSupportNeeded
          ).length
        : 0;
      const tasksForStaff = data.tasks.filter(
        (t) => t.shift === selectedShift.period && t.assignedStaffId === staffId
      );
      const totalMinutes = tasksForStaff.reduce(
        (acc, t) => acc + t.estimatedMinutes,
        0
      );
      const openSupport = data.supportRequests.filter(
        (r) =>
          r.staffId === staffId &&
          r.shift === selectedShift.period &&
          r.status !== 'Resolved'
      ).length;

      const isHeavy =
        (member && member.maxResidentsPerShift > 0 && residentCount > member.maxResidentsPerShift) ||
        extraNeedsCount >= 2 ||
        openSupport > 0;

      return {
        staffId,
        member,
        residentCount,
        extraNeedsCount,
        taskCount: tasksForStaff.length,
        totalMinutes,
        openSupport,
        isHeavy,
      };
    });
  }, [selectedShift, data.staff, data.residents, data.tasks, data.supportRequests]);

  // Detect unassigned residents or multi-assigned conflicts
  const allocationInsights = useMemo(() => {
    if (!selectedShift) return { unassignedResidents: [], doubleBookedStaff: [] };
    const assignedResIds = new Set(
      selectedShift.residentAllocations.flatMap((a) => a.residentIds)
    );
    const unassignedResidents = data.residents.filter(
      (r) => !assignedResIds.has(r.id)
    );
    return { unassignedResidents };
  }, [selectedShift, data.residents]);

  const toggleStaffOnShift = (staffId: string) => {
    if (!selectedShift) return;
    const exists = selectedShift.assignedStaffIds.includes(staffId);
    const nextIds = exists
      ? selectedShift.assignedStaffIds.filter((id) => id !== staffId)
      : [...selectedShift.assignedStaffIds, staffId];
    updateShiftStaff(
      selectedShift.id,
      nextIds,
      selectedShift.supervisorId,
      selectedShift.notes
    );
  };

  const handleSubmitSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqDetails.trim()) return;
    submitSupportRequest({
      requestType: reqType,
      residentId: reqResidentId || undefined,
      details: reqDetails.trim(),
      shift: reqShift,
    });
    setShowSupportModal(false);
    setReqDetails('');
  };

  const handleRespondSupport = (
    requestId: string,
    status: 'Acknowledged' | 'Resolved'
  ) => {
    respondToSupportRequest(
      requestId,
      status,
      responseText.trim() ||
        (status === 'Resolved'
          ? 'Support arranged and workload adjusted.'
          : 'Manager notified and coordinating assistance.')
    );
    setRespondingReqId(null);
    setResponseText('');
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift || !routeName.trim() || !routeStaffId) return;
    addHousekeepingRoute(
      selectedShift.id,
      routeStaffId,
      routeName.trim(),
      routeAreas
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
    );
    setShowRouteModal(false);
    setRouteName('');
    setRouteAreas('');
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    createOrUpdateShift({
      date: newShiftDate,
      period: newShiftPeriod,
      timeRange: newShiftTime,
      supervisorId: newShiftSup,
      assignedStaffIds: [newShiftSup],
      residentAllocations: [],
      housekeepingRoutes: [],
      notes: newShiftNotes.trim() || 'Planned shift schedule',
    });
    setShowNewShiftModal(false);
    setNewShiftNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">
            Workforce &amp; Shift Coordination
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Coordinate Morning, Afternoon, and Night shifts, balance care allocations, and respond to staff support requests.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSupportModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-teal-700" />
            Request Support
          </button>
          <button
            type="button"
            onClick={() => setShowNewShiftModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            Add Shift
          </button>
        </div>
      </div>

      {/* Three-Shift Selector Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.shifts.map((shift) => {
          const isSelected = selectedShift?.id === shift.id;
          const sup = data.staff.find((s) => s.id === shift.supervisorId);
          return (
            <button
              key={shift.id}
              type="button"
              onClick={() => setSelectedShiftId(shift.id)}
              className={`text-left p-5 rounded-xl border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-white border-teal-700 ring-1 ring-teal-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-base font-display font-semibold text-slate-900">
                  {shift.period} Shift
                </span>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {shift.timeRange}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                {shift.date} · Supervisor: {sup?.name || 'Unassigned'}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 tabular-nums">
                <span>{shift.assignedStaffIds.length} staff rostered</span>
                <span>
                  {shift.housekeepingRoutes.length} cleaning route
                  {shift.housekeepingRoutes.length === 1 ? '' : 's'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Shift Workspace */}
      {selectedShift && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 cols: Staffing, Workload Balance & Resident Allocations */}
          <div className="lg:col-span-7 space-y-6">
            {/* Workload Balance Indicator Panel */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-display font-semibold text-slate-900">
                    {selectedShift.period} Shift Workload Balance
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Designed to support safe staffing decisions and identify uneven loads—never to rank staff.
                  </p>
                </div>
                {allocationInsights.unassignedResidents.length > 0 && (
                  <span className="text-xs font-medium text-amber-700 whitespace-nowrap">
                    {allocationInsights.unassignedResidents.length} resident unallocated
                  </span>
                )}
              </div>

              <div className="divide-y divide-slate-200">
                {shiftWorkloadStats.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500 text-center">
                    No employees assigned to this shift yet.
                  </div>
                ) : (
                  shiftWorkloadStats.map((item) => {
                    if (!item.member) return null;
                    return (
                      <div
                        key={item.staffId}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={item.member.name}
                            src={item.member.photoUrl}
                            size="sm"
                          />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {item.member.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.member.role} · {item.member.department}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
                          <span className="text-slate-700">
                            {item.residentCount} resident
                            {item.residentCount === 1 ? '' : 's'}
                          </span>
                          <span className="text-slate-500">
                            {item.taskCount} tasks ({item.totalMinutes} min)
                          </span>
                          {item.isHeavy ? (
                            <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Needs support / check-in
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Balanced
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Roster Editor */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-700">
                    Assign / Replace Employees on {selectedShift.period} Shift
                  </span>
                  <select
                    aria-label="Shift supervisor"
                    value={selectedShift.supervisorId}
                    onChange={(e) =>
                      updateShiftStaff(
                        selectedShift.id,
                        selectedShift.assignedStaffIds,
                        e.target.value,
                        selectedShift.notes
                      )
                    }
                    className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
                  >
                    {data.staff
                      .filter((s) => s.role !== 'System Administrator')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          Supervisor: {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-2">
                  {data.staff
                    .filter(
                      (s) =>
                        s.role !== 'System Administrator' &&
                        s.role !== 'Manager'
                    )
                    .map((s) => {
                      const onShift = selectedShift.assignedStaffIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleStaffOnShift(s.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                            onShift
                              ? 'bg-teal-700 border-teal-700 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {s.name} ({s.department === 'Caregiving' ? 'Care' : 'Housekeeping'})
                        </button>
                      );
                    })}
                </div>
              </div>
            </section>

            {/* Resident Allocation Matrix */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-700" />
                  Resident Care Allocations
                </h2>
                <span className="text-xs text-slate-500">
                  Click to assign or balance resident load
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="py-2.5 px-4 font-medium">Resident</th>
                      {selectedShift.assignedStaffIds
                        .map((id) => data.staff.find((s) => s.id === id))
                        .filter((s) => s && s.department === 'Caregiving')
                        .map((staff) => (
                          <th key={staff!.id} className="py-2.5 px-3 font-medium text-center">
                            {staff!.name.split(' ')[0]}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.residents.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-slate-900">
                            {res.preferredName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {res.room}
                            {res.extraSupportNeeded ? ' · Extra support' : ''}
                          </div>
                        </td>
                        {selectedShift.assignedStaffIds
                          .map((id) => data.staff.find((s) => s.id === id))
                          .filter((s) => s && s.department === 'Caregiving')
                          .map((staff) => {
                            const isAssigned = selectedShift.residentAllocations
                              .find((a) => a.staffId === staff!.id)
                              ?.residentIds.includes(res.id);
                            return (
                              <td key={staff!.id} className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(isAssigned)}
                                  aria-label={`Assign ${res.name} to ${staff!.name}`}
                                  onChange={(e) =>
                                    allocateResidentToStaff(
                                      selectedShift.id,
                                      staff!.id,
                                      res.id,
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
                                />
                              </td>
                            );
                          })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Housekeeping Routes */}
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  Housekeeping Routes
                </h2>
                <button
                  type="button"
                  onClick={() => setShowRouteModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Route
                </button>
              </div>
              <div className="divide-y divide-slate-200">
                {selectedShift.housekeepingRoutes.length === 0 ? (
                  <div className="p-6 text-xs text-slate-500 text-center">
                    No housekeeping routes scheduled for this shift.
                  </div>
                ) : (
                  selectedShift.housekeepingRoutes.map((rt) => {
                    const hk = data.staff.find((s) => s.id === rt.staffId);
                    return (
                      <div key={rt.id} className="p-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">
                            {rt.routeName}
                          </span>
                          <span className="text-xs text-slate-600">
                            Assigned: {hk?.name || 'Unassigned'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Areas: {rt.areas.join(' · ')}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Right 5 cols: Staff Support Requests */}
          <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-teal-700" />
                  Staff Support Requests
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Timely assistance requests from caregiving &amp; housekeeping staff.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(true)}
                className="text-xs font-medium text-teal-700 hover:underline whitespace-nowrap cursor-pointer"
              >
                + New Request
              </button>
            </div>

            <div className="divide-y divide-slate-200">
              {data.supportRequests.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No open support requests right now.
                </div>
              ) : (
                data.supportRequests.map((req) => {
                  const res = req.residentId
                    ? data.residents.find((r) => r.id === req.residentId)
                    : undefined;
                  return (
                    <div key={req.id} className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium text-slate-900">
                          {req.staffName} · {req.department}
                        </span>
                        <span
                          className={`font-medium ${
                            req.status === 'Open'
                              ? 'text-amber-700'
                              : req.status === 'Acknowledged'
                              ? 'text-teal-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-slate-900">
                        {req.requestType}
                        {res ? ` — ${res.preferredName} (${res.room})` : ''}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {req.details}
                      </p>

                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {req.shift} Shift · Logged {req.createdAt}
                      </div>

                      {req.managerResponse && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                          <span className="font-medium text-slate-900">
                            Response ({req.respondedBy}):
                          </span>{' '}
                          {req.managerResponse}
                        </div>
                      )}

                      {req.status !== 'Resolved' && (
                        <div className="pt-1">
                          {respondingReqId === req.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Write supportive response or action taken..."
                                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRespondSupport(req.id, 'Acknowledged')
                                  }
                                  className="px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-md cursor-pointer"
                                >
                                  Acknowledge
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRespondSupport(req.id, 'Resolved')
                                  }
                                  className="px-2.5 py-1 text-xs font-medium text-white bg-teal-700 rounded-md cursor-pointer"
                                >
                                  Mark Resolved
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRespondingReqId(null)}
                                  className="px-2 py-1 text-xs text-slate-500 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRespondingReqId(req.id);
                                setResponseText('');
                              }}
                              className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                            >
                              Respond / Coordinate Support
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Modal: Submit Support Request */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Submit Staff Support Request
              </h3>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitSupport} className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                Submitting as {activeStaff.name} ({activeStaff.role}). Requests alert supervisors immediately so help can be arranged.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  What support do you need?
                </label>
                <select
                  value={reqType}
                  onChange={(e) =>
                    setReqType(e.target.value as SupportRequestType)
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  {SUPPORT_REQUEST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Shift
                  </label>
                  <select
                    value={reqShift}
                    onChange={(e) => setReqShift(e.target.value as ShiftPeriod)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Resident (Optional)
                  </label>
                  <select
                    value={reqResidentId}
                    onChange={(e) => setReqResidentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="">General / Wing</option>
                    {data.residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.preferredName} ({r.room})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Details
                </label>
                <textarea
                  required
                  rows={3}
                  value={reqDetails}
                  onChange={(e) => setReqDetails(e.target.value)}
                  placeholder="Briefly describe what would help right now..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Send Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Housekeeping Route */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Allocate Housekeeping Route
              </h3>
              <button
                type="button"
                onClick={() => setShowRouteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRoute} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Route Name
                </label>
                <input
                  required
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="e.g., Rimu Wing Periodic Refresh"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assigned Housekeeper
                </label>
                <select
                  value={routeStaffId}
                  onChange={(e) => setRouteStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  {data.staff
                    .filter((s) => s.department === 'Housekeeping')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Rooms / Areas (comma-separated)
                </label>
                <input
                  required
                  type="text"
                  value={routeAreas}
                  onChange={(e) => setRouteAreas(e.target.value)}
                  placeholder="Rooms 202, 205, Rimu Sunroom"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Shift */}
      {showNewShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Create Daily Shift
              </h3>
              <button
                type="button"
                onClick={() => setShowNewShiftModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateShift} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newShiftDate}
                    onChange={(e) => setNewShiftDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Shift Period
                  </label>
                  <select
                    value={newShiftPeriod}
                    onChange={(e) =>
                      setNewShiftPeriod(e.target.value as ShiftPeriod)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Time Range
                </label>
                <input
                  type="text"
                  value={newShiftTime}
                  onChange={(e) => setNewShiftTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Shift Supervisor
                </label>
                <select
                  value={newShiftSup}
                  onChange={(e) => setNewShiftSup(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  {data.staff
                    .filter((s) => s.role !== 'System Administrator')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Shift Notes
                </label>
                <textarea
                  rows={2}
                  value={newShiftNotes}
                  onChange={(e) => setNewShiftNotes(e.target.value)}
                  placeholder="Key focus or coverage notes..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewShiftModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Create Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
