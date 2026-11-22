import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useCareStore } from '../context/CareStoreContext';
import {
  CaregivingCategory,
  DailyTask,
  EXCEPTION_REASONS,
  ExceptionReason,
  HousekeepingCategory,
  ShiftPeriod,
  TaskCategory,
  TaskStatus,
} from '../types';
import { Avatar } from './Avatar';
import { ConfirmationStatusLabel, TaskStatusLabel } from './StatusText';

interface DailyOperationsProps {
  onOpenResident?: (residentId: string) => void;
}

const CAREGIVING_CATEGORIES: CaregivingCategory[] = [
  'Personal care',
  'Mobility assistance',
  'Independence support',
  'Meals and hydration',
  'Room comfort',
  'Observation and reporting',
];

const HOUSEKEEPING_CATEGORIES: HousekeepingCategory[] = [
  'Resident bedrooms',
  'Bathrooms',
  'Common areas',
  'Periodic cleaning',
];

export const DailyOperations: React.FC<DailyOperationsProps> = ({
  onOpenResident,
}) => {
  const {
    data,
    activeStaff,
    portalMode,
    updateTaskStatus,
    reassignTask,
    recordTaskException,
    resolveTaskException,
    addTask,
    submitSupportRequest,
  } = useCareStore();

  const [shiftFilter, setShiftFilter] = useState<'All' | ShiftPeriod>('All');
  const [deptFilter, setDeptFilter] = useState<'All' | 'Caregiving' | 'Housekeeping'>(
    portalMode === 'staff' && activeStaff.department !== 'Management'
      ? activeStaff.department
      : 'All'
  );
  const [onlyMine, setOnlyMine] = useState<boolean>(portalMode === 'staff');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    data.tasks[0]?.id || ''
  );

  // Exception Modal
  const [exceptionTask, setExceptionTask] = useState<DailyTask | null>(null);
  const [excStatus, setExcStatus] = useState<'Unable to Complete' | 'Deferred'>('Deferred');
  const [excReason, setExcReason] = useState<ExceptionReason>('Resident declined');
  const [excNotes, setExcNotes] = useState('');
  const [excFollowUp, setExcFollowUp] = useState(true);

  // Add Task Modal
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDept, setNewDept] = useState<'Caregiving' | 'Housekeeping'>('Caregiving');
  const [newCat, setNewCat] = useState<TaskCategory>('Personal care');
  const [newShift, setNewShift] = useState<ShiftPeriod>('Morning');
  const [newTime, setNewTime] = useState('10:00');
  const [newStaffId, setNewStaffId] = useState(activeStaff.id);
  const [newResidentId, setNewResidentId] = useState(data.residents[0]?.id || '');
  const [newStandard, setNewStandard] = useState('');
  const [newSupport, setNewSupport] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newIndependence, setNewIndependence] = useState('');
  const [newDignity, setNewDignity] = useState('');
  const [newRecord, setNewRecord] = useState('');

  // Quick Support Request toast/confirmation
  const [supportSentNotice, setSupportSentNotice] = useState<string | null>(null);

  const visibleTasks = useMemo(() => {
    return data.tasks.filter((t) => {
      if (shiftFilter !== 'All' && t.shift !== shiftFilter) return false;
      if (deptFilter !== 'All' && t.department !== deptFilter) return false;
      if (onlyMine && t.assignedStaffId !== activeStaff.id) return false;
      return true;
    });
  }, [data.tasks, shiftFilter, deptFilter, onlyMine, activeStaff.id]);

  const selectedTask =
    data.tasks.find((t) => t.id === selectedTaskId) ??
    visibleTasks[0] ??
    data.tasks[0];

  const selectedResident = selectedTask?.residentId
    ? data.residents.find((r) => r.id === selectedTask.residentId)
    : undefined;

  const assignedMember = selectedTask
    ? data.staff.find((s) => s.id === selectedTask.assignedStaffId)
    : undefined;

  // Match relevant preferences from Module 1 automatically
  const contextualPreferences = useMemo(() => {
    if (!selectedTask || !selectedTask.residentId) return [];
    const residentPrefs = data.preferences.filter(
      (p) => p.residentId === selectedTask.residentId && p.isActive
    );
    const taskWords = new Set([
      ...selectedTask.relatedTags.map((x) => x.toLowerCase()),
      selectedTask.category.toLowerCase(),
      ...selectedTask.title.toLowerCase().split(/\s+/),
    ]);

    const matched = residentPrefs.filter((pref) =>
      pref.relatedTaskTags.some((tag) => {
        const low = tag.toLowerCase();
        return (
          taskWords.has(low) ||
          Array.from(taskWords).some((w) => w.includes(low) || low.includes(w))
        );
      })
    );
    return matched.length > 0 ? matched : residentPrefs.slice(0, 2);
  }, [data.preferences, selectedTask]);

  const openExceptionModal = (task: DailyTask, defaultStatus: 'Unable to Complete' | 'Deferred') => {
    setExceptionTask(task);
    setExcStatus(defaultStatus);
    setExcReason('Resident declined');
    setExcNotes('');
    setExcFollowUp(true);
  };

  const handleSaveException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionTask) return;
    recordTaskException({
      taskId: exceptionTask.id,
      status: excStatus,
      reason: excReason,
      notes: excNotes.trim() || `${excReason} — resident choice respected.`,
      followUpRequested: excFollowUp,
    });
    setExceptionTask(null);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const res = data.residents.find((r) => r.id === newResidentId);
    addTask({
      title: newTitle.trim(),
      description: newDesc.trim() || newTitle.trim(),
      department: newDept,
      category: newCat,
      shift: newShift,
      plannedTime: newTime,
      estimatedMinutes: 20,
      assignedStaffId: newStaffId,
      residentId: newResidentId || undefined,
      location: res ? res.room : 'Common Area',
      completionStandard:
        newStandard.trim() || 'Completed calmly respecting resident pace and dignity.',
      status: 'Not Started',
      relatedTags: [
        newCat.toLowerCase(),
        ...newTitle.toLowerCase().split(/\s+/).slice(0, 3),
      ],
      guidance: {
        supportRequired: newSupport.trim() || 'Check resident comfort before beginning.',
        approvedCareInstructions:
          newInstructions.trim() || 'Follow standard facility care & infection-control guidelines.',
        independenceGuidance:
          newIndependence.trim() || 'Invite resident participation in small choices.',
        privacyDignity:
          newDignity.trim() || 'Knock softly, greet by preferred name, and protect privacy.',
        whatToRecord:
          newRecord.trim() || 'Note any preference changes or follow-up needed.',
      },
    });
    setShowAddTask(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleQuickMoreTime = (task: DailyTask) => {
    submitSupportRequest({
      requestType: 'I need more time for a resident',
      residentId: task.residentId,
      shift: task.shift,
      details: `Requested extra time for "${task.title}" (${task.location}) to support unhurried care.`,
    });
    setSupportSentNotice(`Support request sent for ${task.title}`);
    setTimeout(() => setSupportSentNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">
            Daily Operations &amp; Care Guidance
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Relevant resident preferences appear automatically inside each task—supporting dignity, independence, and calm pacing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddTask(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Daily Task
        </button>
      </div>

      {supportSentNotice && (
        <div className="px-4 py-3 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-900 flex items-center justify-between">
          <span>{supportSentNotice}</span>
          <button
            type="button"
            onClick={() => setSupportSentNotice(null)}
            className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['All', 'Morning', 'Afternoon', 'Night'] as const).map((sh) => (
              <button
                key={sh}
                type="button"
                onClick={() => setShiftFilter(sh)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  shiftFilter === sh
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sh === 'All' ? 'All Shifts' : `${sh} Shift`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['All', 'Caregiving', 'Housekeeping'] as const).map((dept) => (
              <button
                key={dept}
                type="button"
                onClick={() => setDeptFilter(dept)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  deptFilter === dept
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dept === 'All' ? 'Both Departments' : dept}
              </button>
            ))}
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 px-2 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
            className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          />
          Only tasks assigned to {activeStaff.name.split(' ')[0]}
        </label>
      </div>

      {/* Main Split: Task Queue + Personalised Care Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Task List */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">
              Scheduled Tasks ({visibleTasks.length})
            </span>
            <span className="text-xs text-slate-500">
              Incomplete tasks never penalise staff
            </span>
          </div>

          <div className="divide-y divide-slate-200 max-h-[680px] overflow-y-auto">
            {visibleTasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No tasks match the current shift or assignment filters.
              </div>
            ) : (
              visibleTasks.map((task) => {
                const res = task.residentId
                  ? data.residents.find((r) => r.id === task.residentId)
                  : undefined;
                const staff = data.staff.find((s) => s.id === task.assignedStaffId);
                const isSelected = selectedTask?.id === task.id;

                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900">
                        {task.title}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                        {task.plannedTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1">
                      {res ? `${res.preferredName} (${task.location})` : task.location} ·{' '}
                      {task.department} · {task.category}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <TaskStatusLabel status={task.status} />
                      <span className="text-xs text-slate-500 truncate">
                        {staff ? staff.name : 'Unassigned'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Personalised Care Guidance & Actions */}
        {selectedTask ? (
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Task Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                <span>
                  {selectedTask.id} · {selectedTask.shift} Shift · Planned{' '}
                  {selectedTask.plannedTime} (~{selectedTask.estimatedMinutes} min)
                </span>
                <TaskStatusLabel status={selectedTask.status} />
              </div>

              <h2 className="text-xl font-display font-semibold text-slate-900 mt-2">
                {selectedTask.title}
              </h2>
              <p className="text-sm text-slate-600 mt-1">{selectedTask.description}</p>

              {/* Resident Summary Strip */}
              {selectedResident && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={selectedResident.name}
                      src={selectedResident.photoUrl}
                      size="md"
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {selectedResident.name} (“{selectedResident.preferredName}”)
                      </div>
                      <div className="text-xs text-slate-500">
                        {selectedResident.room} · {selectedResident.primaryLanguage}
                      </div>
                    </div>
                  </div>
                  {onOpenResident && (
                    <button
                      type="button"
                      onClick={() => onOpenResident(selectedResident.id)}
                      className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline whitespace-nowrap cursor-pointer"
                    >
                      Open full Life Profile
                    </button>
                  )}
                </div>
              )}

              {/* Contextual Preferences Automatically Surfaced (Module 2 Core Feature) */}
              <div className="mt-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 mb-2">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  Contextual Resident Preferences for This Task
                </div>

                {contextualPreferences.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">
                    No specific task-linked preferences recorded yet. Check full profile or log an observation if you notice a preference.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 border border-teal-200 bg-teal-50/40 rounded-lg">
                    {contextualPreferences.map((pref) => (
                      <div key={pref.id} className="p-3.5 space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-700">
                            {pref.category} · {pref.source}
                          </span>
                          <ConfirmationStatusLabel status={pref.confirmationStatus} />
                        </div>
                        <p className="text-sm text-slate-900 font-medium">
                          {pref.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Structured Care Guidance (PRD 5.3) */}
            <div className="p-6 divide-y divide-slate-200">
              <div className="pb-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-display font-semibold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-700" aria-hidden="true" />
                    Personalised Care Guidance
                  </h3>
                  <span className="text-xs text-slate-500">
                    Supports professional judgement · Does not replace clinical care plans
                  </span>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Support That May Be Required
                    </dt>
                    <dd className="text-slate-800 mt-1 text-xs leading-relaxed">
                      {selectedTask.guidance.supportRequired}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Approved Care &amp; Safety Instructions
                    </dt>
                    <dd className="text-slate-800 mt-1 text-xs leading-relaxed">
                      {selectedTask.guidance.approvedCareInstructions}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      How to Support Independence
                    </dt>
                    <dd className="text-slate-800 mt-1 text-xs leading-relaxed">
                      {selectedTask.guidance.independenceGuidance}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Privacy &amp; Dignity Considerations
                    </dt>
                    <dd className="text-slate-800 mt-1 text-xs leading-relaxed">
                      {selectedTask.guidance.privacyDignity}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      Completion Standard
                    </dt>
                    <dd className="text-slate-800 mt-1 text-xs leading-relaxed">
                      {selectedTask.completionStandard}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">
                      What to Record if Circumstances Change
                    </dt>
                    <dd className="text-slate-800 mt-1 text-xs leading-relaxed">
                      {selectedTask.guidance.whatToRecord}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Exception Record (if present) */}
              {selectedTask.exception && (
                <div className="py-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Exception Recorded: {selectedTask.exception.reason}
                      </span>
                      <span className="text-xs text-amber-800 tabular-nums">
                        {selectedTask.exception.recordedAt}
                      </span>
                    </div>
                    <p className="text-xs text-amber-950">
                      {selectedTask.exception.notes}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-xs text-amber-800">
                      <span>
                        Logged by {selectedTask.exception.recordedBy} ·{' '}
                        {selectedTask.exception.followUpRequested
                          ? selectedTask.exception.resolved
                            ? 'Follow-up completed'
                            : 'Follow-up requested'
                          : 'No follow-up needed'}
                      </span>
                      {selectedTask.exception.followUpRequested &&
                        !selectedTask.exception.resolved && (
                          <button
                            type="button"
                            onClick={() => resolveTaskException(selectedTask.id)}
                            className="font-medium text-teal-800 hover:underline cursor-pointer"
                          >
                            Mark follow-up resolved
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* Task Actions & Outcome Controls */}
              <div className="pt-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    Assigned to:{' '}
                    <span className="font-medium text-slate-900">
                      {assignedMember?.name || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      aria-label="Reassign task to colleague"
                      value={selectedTask.assignedStaffId}
                      onChange={(e) => reassignTask(selectedTask.id, e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      {data.staff
                        .filter((s) => s.role !== 'System Administrator')
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            Reassign: {s.name} ({s.role})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateTaskStatus(selectedTask.id, 'In Progress')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      selectedTask.status === 'In Progress'
                        ? 'bg-teal-50 border-teal-600 text-teal-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    In Progress
                  </button>

                  <button
                    type="button"
                    onClick={() => updateTaskStatus(selectedTask.id, 'Completed')}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      selectedTask.status === 'Completed'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-teal-700 hover:bg-teal-800 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Completed
                  </button>

                  <button
                    type="button"
                    onClick={() => openExceptionModal(selectedTask, 'Deferred')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Defer / Resident Choice
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openExceptionModal(selectedTask, 'Unable to Complete')
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    Record Exception
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickMoreTime(selectedTask)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-teal-800 hover:bg-teal-50 transition-colors ml-auto cursor-pointer"
                  >
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Need More Time
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
            Select a task on the left to view personalised care guidance.
          </div>
        )}
      </div>

      {/* Modal: Record Exception */}
      {exceptionTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Record Task Exception
              </h3>
              <button
                type="button"
                onClick={() => setExceptionTask(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveException} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  Resident choice always comes first. Deferring or declining a task is logged to preserve continuity, never treated as staff failure.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Outcome Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Deferred', 'Unable to Complete'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setExcStatus(st)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border cursor-pointer ${
                        excStatus === st
                          ? 'border-teal-700 bg-teal-50 text-teal-900'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason
                </label>
                <select
                  value={excReason}
                  onChange={(e) => setExcReason(e.target.value as ExceptionReason)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  {EXCEPTION_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Context &amp; Handover Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={excNotes}
                  onChange={(e) => setExcNotes(e.target.value)}
                  placeholder="Share what happened or when the resident would prefer to try again..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excFollowUp}
                  onChange={(e) => setExcFollowUp(e.target.checked)}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                Flag for follow-up in Smart Handover
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setExceptionTask(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Save Exception
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Task */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Create Daily Task with Care Guidance
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => {
                      const d = e.target.value as 'Caregiving' | 'Housekeeping';
                      setNewDept(d);
                      setNewCat(
                        d === 'Caregiving'
                          ? CAREGIVING_CATEGORIES[0]
                          : HOUSEKEEPING_CATEGORIES[0]
                      );
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Caregiving">Caregiving</option>
                    <option value="Housekeeping">Housekeeping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Task Category
                  </label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {(newDept === 'Caregiving'
                      ? CAREGIVING_CATEGORIES
                      : HOUSEKEEPING_CATEGORIES
                    ).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Task Title
                </label>
                <input
                  required
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Afternoon bed linen refresh"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Shift
                  </label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value as ShiftPeriod)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Planned Time
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Resident
                  </label>
                  <select
                    value={newResidentId}
                    onChange={(e) => setNewResidentId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="">Common Area</option>
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
                  Assigned Employee
                </label>
                <select
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                >
                  {data.staff
                    .filter((s) => s.role !== 'System Administrator')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Description &amp; Completion Standard
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Practical summary of what good support looks like"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Independence Guidance
                  </label>
                  <input
                    type="text"
                    value={newIndependence}
                    onChange={(e) => setNewIndependence(e.target.value)}
                    placeholder="How to encourage resident choice"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Privacy &amp; Dignity
                  </label>
                  <input
                    type="text"
                    value={newDignity}
                    onChange={(e) => setNewDignity(e.target.value)}
                    placeholder="Knock, preferred greeting, etc."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
