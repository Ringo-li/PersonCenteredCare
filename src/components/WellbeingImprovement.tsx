import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Clock,
  HeartHandshake,
  MessageSquareHeart,
  Plus,
  Shield,
  X,
} from 'lucide-react';
import { useCareStore } from '../context/CareStoreContext';
import {
  Department,
  FEEDBACK_CATEGORIES,
  FeedbackCategory,
  StaffFeedback,
} from '../types';

export const WellbeingImprovement: React.FC = () => {
  const {
    data,
    activeStaff,
    portalMode,
    submitFeedback,
    manageFeedback,
    submitSurveyResponse,
  } = useCareStore();

  const [activeTab, setActiveTab] = useState<'feedback' | 'survey' | 'timeforcare'>(
    'feedback'
  );
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Submit Feedback Modal
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [fbCategory, setFbCategory] = useState<FeedbackCategory>('Workload');
  const [fbMessage, setFbMessage] = useState('');
  const [fbAnonymous, setFbAnonymous] = useState(false);
  const [fbDept, setFbDept] = useState<Department>(
    activeStaff.department === 'Management' ? 'Caregiving' : activeStaff.department
  );

  // Manager Review Feedback Modal
  const [editingFb, setEditingFb] = useState<StaffFeedback | null>(null);
  const [mgrStatus, setMgrStatus] = useState<StaffFeedback['status']>('Under Review');
  const [mgrFollowUp, setMgrFollowUp] = useState('');
  const [mgrResponse, setMgrResponse] = useState('');
  const [mgrRecurringTag, setMgrRecurringTag] = useState('');
  const [mgrTimeOpportunity, setMgrTimeOpportunity] = useState('');

  // Survey Form state (all 6 PRD questions)
  const [surveyAnon, setSurveyAnon] = useState(true);
  const [surveyDept, setSurveyDept] = useState<Department>(
    activeStaff.department === 'Management' ? 'Caregiving' : activeStaff.department
  );
  const [qTime, setQTime] = useState(4);
  const [qWorkload, setQWorkload] = useState(4);
  const [qResponsibilities, setQResponsibilities] = useState(5);
  const [qSupport, setQSupport] = useState(4);
  const [qCommunication, setQCommunication] = useState(4);
  const [qEasier, setQEasier] = useState('');
  const [surveySubmitted, setSurveySubmitted] = useState(false);

  const filteredFeedbacks = useMemo(() => {
    return data.feedbacks.filter(
      (f) => statusFilter === 'All' || f.status === statusFilter
    );
  }, [data.feedbacks, statusFilter]);

  // Recurring issue summary
  const recurringThemes = useMemo(() => {
    const map = new Map<string, number>();
    data.feedbacks.forEach((f) => {
      const key = f.recurringIssueTag || f.category;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [data.feedbacks]);

  // Aggregated survey averages (to improve workflows, never to rank staff)
  const surveyAverages = useMemo(() => {
    const n = data.surveyResponses.length;
    if (n === 0) {
      return {
        count: 0,
        time: 0,
        workload: 0,
        responsibilities: 0,
        support: 0,
        communication: 0,
      };
    }
    const sum = data.surveyResponses.reduce(
      (acc, r) => ({
        time: acc.time + r.answers.enoughTimeForQualityCare,
        workload: acc.workload + r.answers.reasonableWorkload,
        responsibilities: acc.responsibilities + r.answers.understandResponsibilities,
        support: acc.support + r.answers.receiveEnoughSupport,
        communication: acc.communication + r.answers.shiftCommunicationEffective,
      }),
      { time: 0, workload: 0, responsibilities: 0, support: 0, communication: 0 }
    );
    return {
      count: n,
      time: (sum.time / n).toFixed(1),
      workload: (sum.workload / n).toFixed(1),
      responsibilities: (sum.responsibilities / n).toFixed(1),
      support: (sum.support / n).toFixed(1),
      communication: (sum.communication / n).toFixed(1),
    };
  }, [data.surveyResponses]);

  const handleCreateFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbMessage.trim()) return;
    submitFeedback({
      category: fbCategory,
      message: fbMessage.trim(),
      isAnonymous: fbAnonymous,
      department: fbDept,
    });
    setShowFeedbackModal(false);
    setFbMessage('');
  };

  const openManageFeedback = (fb: StaffFeedback) => {
    setEditingFb(fb);
    setMgrStatus(fb.status);
    setMgrFollowUp(fb.assignedFollowUp || '');
    setMgrResponse(fb.managerResponse || '');
    setMgrRecurringTag(fb.recurringIssueTag || '');
    setMgrTimeOpportunity(fb.timeForCareOpportunity || '');
  };

  const handleSaveFeedbackManagement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFb) return;
    manageFeedback({
      feedbackId: editingFb.id,
      status: mgrStatus,
      assignedFollowUp: mgrFollowUp.trim() || undefined,
      managerResponse: mgrResponse.trim() || undefined,
      recurringIssueTag: mgrRecurringTag.trim() || undefined,
      timeForCareOpportunity: mgrTimeOpportunity.trim() || undefined,
    });
    setEditingFb(null);
  };

  const handleSurveySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSurveyResponse({
      isAnonymous: surveyAnon,
      department: surveyDept,
      answers: {
        enoughTimeForQualityCare: qTime,
        reasonableWorkload: qWorkload,
        understandResponsibilities: qResponsibilities,
        receiveEnoughSupport: qSupport,
        shiftCommunicationEffective: qCommunication,
        whatWouldMakeWorkEasier:
          qEasier.trim() || 'No additional suggestions this cycle.',
      },
    });
    setQEasier('');
    setSurveySubmitted(true);
    setTimeout(() => setSurveySubmitted(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">
            Staff Wellbeing &amp; Continuous Improvement
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Listening to Caregiving and Housekeeping teams to remove friction, improve workflows, and create more time for residents.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFeedbackModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Share Daily Feedback
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Feedback ({data.feedbacks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('survey')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'survey'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly Staff Survey ({data.surveyResponses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeforcare')}
          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'timeforcare'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Time for Care Insights
        </button>
      </div>

      {/* Tab 1: Daily Feedback & Manager Review */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-medium text-slate-700">
                Team Feedback Log (Anonymous &amp; Identified)
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Under Review">Under Review</option>
                <option value="Action Assigned">Action Assigned</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="divide-y divide-slate-200">
              {filteredFeedbacks.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No feedback entries in this status.
                </div>
              ) : (
                filteredFeedbacks.map((fb) => (
                  <div key={fb.id} className="p-5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-slate-500 flex flex-wrap items-center gap-2 tabular-nums">
                        <span className="font-medium text-slate-800">{fb.category}</span>
                        <span>·</span>
                        <span>{fb.department}</span>
                        <span>·</span>
                        <span>
                          {fb.isAnonymous ? 'Anonymous Staff' : fb.submittedBy}
                        </span>
                        <span>·</span>
                        <span>{fb.submittedAt}</span>
                      </div>
                      <span
                        className={`font-medium ${
                          fb.status === 'New'
                            ? 'text-amber-700'
                            : fb.status === 'Resolved'
                            ? 'text-emerald-700'
                            : 'text-teal-700'
                        }`}
                      >
                        {fb.status}
                      </span>
                    </div>

                    <p className="text-sm text-slate-900 leading-relaxed">
                      {fb.message}
                    </p>

                    {(fb.assignedFollowUp || fb.managerResponse) && (
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                        {fb.assignedFollowUp && (
                          <div className="text-slate-800">
                            <span className="font-medium">Follow-up Action:</span>{' '}
                            {fb.assignedFollowUp}
                          </div>
                        )}
                        {fb.managerResponse && (
                          <div className="text-slate-600">
                            <span className="font-medium text-slate-800">
                              Manager Response:
                            </span>{' '}
                            {fb.managerResponse}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-slate-500">
                        {fb.recurringIssueTag
                          ? `Theme: ${fb.recurringIssueTag}`
                          : 'Uncategorised theme'}
                      </span>
                      {portalMode === 'manager' && (
                        <button
                          type="button"
                          onClick={() => openManageFeedback(fb)}
                          className="text-xs font-medium text-teal-700 hover:underline cursor-pointer"
                        >
                          Review &amp; Assign Follow-Up
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Right: Recurring Themes & Unresolved Tracker */}
          <aside className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-sm font-display font-semibold text-slate-900">
                  Recurring Operational Themes
                </h2>
              </div>
              <div className="divide-y divide-slate-200">
                {recurringThemes.map(([theme, count]) => (
                  <div
                    key={theme}
                    className="px-5 py-3 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-800 font-medium">{theme}</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      {count} report{count === 1 ? '' : 's'}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sm font-display font-semibold text-slate-900">
                <Shield className="w-4 h-4 text-teal-700" />
                Safe, Non-Punitive Listening
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Feedback and surveys exist strictly to ease workloads, resolve equipment bottlenecks, and strengthen communication between shifts—never to evaluate or rank employees.
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Tab 2: Regular Staff Survey (6 PRD Questions) */}
      {activeTab === 'survey' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Survey Submission Form */}
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-display font-semibold text-slate-900">
                November 2026 Staff Wellbeing Survey
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Takes under 2 minutes. Choose anonymous or identified submission.
              </p>
            </div>

            <form onSubmit={handleSurveySubmit} className="p-6 space-y-5">
              {surveySubmitted && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                  Thank you—your survey response has been recorded.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={surveyAnon}
                    onChange={(e) => setSurveyAnon(e.target.checked)}
                    className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  Submit anonymously
                </label>
                <select
                  value={surveyDept}
                  onChange={(e) => setSurveyDept(e.target.value as Department)}
                  className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5"
                >
                  <option value="Caregiving">Caregiving</option>
                  <option value="Housekeeping">Housekeeping</option>
                </select>
              </div>

              {(
                [
                  {
                    label: '1. Do you have enough time to provide quality care?',
                    val: qTime,
                    set: setQTime,
                  },
                  {
                    label: '2. Is your workload reasonable?',
                    val: qWorkload,
                    set: setQWorkload,
                  },
                  {
                    label: '3. Do you understand your daily responsibilities?',
                    val: qResponsibilities,
                    set: setQResponsibilities,
                  },
                  {
                    label: '4. Do you receive enough support?',
                    val: qSupport,
                    set: setQSupport,
                  },
                  {
                    label: '5. Is communication between shifts effective?',
                    val: qCommunication,
                    set: setQCommunication,
                  },
                ] as const
              ).map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-800">
                    <span>{item.label}</span>
                    <span className="font-mono tabular-nums text-teal-800">
                      {item.val} / 5
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => item.set(n)}
                        className={`py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                          item.val === n
                            ? 'bg-teal-700 border-teal-700 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1.5">
                  6. What would make your work easier?
                </label>
                <textarea
                  rows={3}
                  value={qEasier}
                  onChange={(e) => setQEasier(e.target.value)}
                  placeholder="Share any workflow change, supply improvement, or handover idea..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
              >
                Submit Survey Response
              </button>
            </form>
          </section>

          {/* Survey Pulse Summary */}
          <section className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-teal-700" />
                  Team Pulse Summary ({surveyAverages.count} responses)
                </h2>
                <span className="text-xs text-slate-500">Scale 1.0 – 5.0</span>
              </div>

              <div className="divide-y divide-slate-200">
                {[
                  {
                    q: 'Enough time for quality care',
                    score: surveyAverages.time,
                  },
                  { q: 'Reasonable workload', score: surveyAverages.workload },
                  {
                    q: 'Clear daily responsibilities',
                    score: surveyAverages.responsibilities,
                  },
                  { q: 'Receive enough support', score: surveyAverages.support },
                  {
                    q: 'Effective shift communication',
                    score: surveyAverages.communication,
                  },
                ].map((row) => (
                  <div
                    key={row.q}
                    className="px-6 py-3.5 flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-700">{row.q}</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {row.score} / 5.0
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="text-sm font-display font-semibold text-slate-900">
                  Recent Ideas: “What would make your work easier?”
                </h3>
              </div>
              <div className="divide-y divide-slate-200">
                {data.surveyResponses.map((sr) => (
                  <div key={sr.id} className="p-4 space-y-1">
                    <p className="text-sm text-slate-800">
                      “{sr.answers.whatWouldMakeWorkEasier}”
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {sr.isAnonymous ? 'Anonymous' : sr.respondentName} ·{' '}
                      {sr.department} · {sr.submittedAt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tab 3: Time for Care Insights */}
      {activeTab === 'timeforcare' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-display font-semibold text-slate-900">
              <Clock className="w-5 h-5 text-teal-700" />
              Removing Unnecessary Administrative Friction
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every improvement below comes directly from staff observations and reduces repetitive searching, backtracking, or handover gaps—creating calmer time with residents rather than pushing staff to work faster.
            </p>
            <div className="divide-y divide-slate-200 border-t border-slate-200">
              {data.feedbacks
                .filter((f) => f.timeForCareOpportunity)
                .map((f) => (
                  <div key={f.id} className="py-3.5 space-y-1">
                    <div className="text-xs font-medium text-teal-800">
                      {f.recurringIssueTag || f.category}
                    </div>
                    <p className="text-sm text-slate-900">
                      {f.timeForCareOpportunity}
                    </p>
                    <p className="text-xs text-slate-500">
                      From {f.department} feedback ({f.submittedAt})
                    </p>
                  </div>
                ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-base font-display font-semibold text-slate-900">
              <HeartHandshake className="w-5 h-5 text-teal-700" />
              Contextual Guidance Impact
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              By surfacing resident preferences directly inside daily tasks, caregivers and housekeepers no longer need to dig through full binders before entering a room.
            </p>
            <dl className="divide-y divide-slate-200 border-t border-slate-200 text-sm">
              <div className="py-3.5 flex items-center justify-between">
                <dt className="text-slate-600">Active Resident Preferences Linked to Tasks</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900">
                  {data.preferences.filter((p) => p.isActive).length}
                </dd>
              </div>
              <div className="py-3.5 flex items-center justify-between">
                <dt className="text-slate-600">Verified Resident / Whānau Choices</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900">
                  {
                    data.preferences.filter(
                      (p) =>
                        p.confirmationStatus === 'Confirmed by Resident' ||
                        p.confirmationStatus ===
                          'Confirmed through authorised representative'
                    ).length
                  }
                </dd>
              </div>
              <div className="py-3.5 flex items-center justify-between">
                <dt className="text-slate-600">Open Staff Improvement Actions</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900">
                  {data.feedbacks.filter((f) => f.status !== 'Resolved').length}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}

      {/* Modal: Submit Daily Feedback */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquareHeart className="w-4 h-4 text-teal-700" />
                Submit Daily Feedback
              </h3>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFeedback} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={fbCategory}
                    onChange={(e) =>
                      setFbCategory(e.target.value as FeedbackCategory)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={fbDept}
                    onChange={(e) => setFbDept(e.target.value as Department)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Caregiving">Caregiving</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Feedback or Suggestion
                </label>
                <textarea
                  required
                  rows={4}
                  value={fbMessage}
                  onChange={(e) => setFbMessage(e.target.value)}
                  placeholder="Share what is working well or what would make care calmer and easier..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fbAnonymous}
                  onChange={(e) => setFbAnonymous(e.target.checked)}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                Submit anonymously (name hidden from manager view)
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manager Review & Follow-Up */}
      {editingFb && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Manage Staff Feedback ({editingFb.id})
              </h3>
              <button
                type="button"
                onClick={() => setEditingFb(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFeedbackManagement} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                “{editingFb.message}”
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={mgrStatus}
                    onChange={(e) =>
                      setMgrStatus(e.target.value as StaffFeedback['status'])
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="New">New</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Action Assigned">Action Assigned</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Recurring Theme Tag
                  </label>
                  <input
                    type="text"
                    value={mgrRecurringTag}
                    onChange={(e) => setMgrRecurringTag(e.target.value)}
                    placeholder="e.g., Morning pacing"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assigned Follow-Up Action
                </label>
                <input
                  type="text"
                  value={mgrFollowUp}
                  onChange={(e) => setMgrFollowUp(e.target.value)}
                  placeholder="Who will follow up and what workflow adjustment will help?"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Manager Response (Visible to Team)
                </label>
                <textarea
                  rows={2}
                  value={mgrResponse}
                  onChange={(e) => setMgrResponse(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Time for Care Opportunity
                </label>
                <input
                  type="text"
                  value={mgrTimeOpportunity}
                  onChange={(e) => setMgrTimeOpportunity(e.target.value)}
                  placeholder="How does fixing this give staff calmer time with residents?"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFb(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Save Follow-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
