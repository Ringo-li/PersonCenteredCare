import React, { useMemo, useState } from 'react';
import {
  CheckSquare,
  History,
  MessageSquarePlus,
  Plus,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import { useCareStore } from '../context/CareStoreContext';
import {
  CONFIRMATION_STATUSES,
  ConfirmationStatus,
  PREFERENCE_CATEGORIES,
  PreferenceCategory,
  PreferenceSource,
  ResidentPreference,
} from '../types';
import { Avatar } from './Avatar';
import { ConfirmationStatusLabel } from './StatusText';

interface ResidentDirectoryProps {
  initialResidentId?: string;
}

export const ResidentDirectory: React.FC<ResidentDirectoryProps> = ({
  initialResidentId,
}) => {
  const {
    data,
    addResident,
    addPreference,
    reviewAndUpdatePreference,
    updateResidentSupportFlag,
  } = useCareStore();

  const [selectedResidentId, setSelectedResidentId] = useState<string>(
    initialResidentId || data.residents[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [wingFilter, setWingFilter] = useState<string>('All');
  const [profileTab, setProfileTab] = useState<
    'preferences' | 'history' | 'review'
  >('preferences');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Modals
  const [showAddResident, setShowAddResident] = useState(false);
  const [showAddPref, setShowAddPref] = useState(false);
  const [reviewingPref, setReviewingPref] = useState<ResidentPreference | null>(null);

  // Add Resident form state
  const [newResName, setNewResName] = useState('');
  const [newResPreferred, setNewResPreferred] = useState('');
  const [newResRoom, setNewResRoom] = useState('');
  const [newResWing, setNewResWing] = useState('Kōwhai Wing');
  const [newResAge, setNewResAge] = useState('80');
  const [newResLanguage, setNewResLanguage] = useState('English');
  const [newResWhanau, setNewResWhanau] = useState('');
  const [newResFocus, setNewResFocus] = useState('');
  const [newResSummary, setNewResSummary] = useState('');

  // Add Preference form state
  const [prefCategory, setPrefCategory] = useState<PreferenceCategory>('Daily Routine');
  const [prefSource, setPrefSource] = useState<PreferenceSource>('Staff Observation');
  const [prefDescription, setPrefDescription] = useState('');
  const [prefStatus, setPrefStatus] = useState<ConfirmationStatus>('Pending Review');
  const [prefConfirmedBy, setPrefConfirmedBy] = useState('');
  const [prefTags, setPrefTags] = useState('personal care');
  const [prefReviewDue, setPrefReviewDue] = useState('2027-02-21');

  // Review Preference form state
  const [revDescription, setRevDescription] = useState('');
  const [revStatus, setRevStatus] = useState<ConfirmationStatus>('Confirmed by Resident');
  const [revSource, setRevSource] = useState<PreferenceSource>('Resident / Whānau Feedback');
  const [revConfirmedBy, setRevConfirmedBy] = useState('');
  const [revReason, setRevReason] = useState('');
  const [revIsActive, setRevIsActive] = useState(true);

  const filteredResidents = useMemo(() => {
    return data.residents.filter((r) => {
      const matchesWing = wingFilter === 'All' || r.wing === wingFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.preferredName.toLowerCase().includes(q) ||
        r.room.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q);
      return matchesWing && matchesSearch;
    });
  }, [data.residents, searchQuery, wingFilter]);

  const selectedResident =
    data.residents.find((r) => r.id === selectedResidentId) ??
    filteredResidents[0] ??
    data.residents[0];

  const residentPrefs = useMemo(() => {
    if (!selectedResident) return [];
    return data.preferences.filter((p) => {
      const matchRes = p.residentId === selectedResident.id;
      const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
      return matchRes && matchCat;
    });
  }, [data.preferences, selectedResident, categoryFilter]);

  const pendingReviewPrefs = useMemo(() => {
    if (!selectedResident) return [];
    return data.preferences.filter(
      (p) =>
        p.residentId === selectedResident.id &&
        (p.confirmationStatus === 'Pending Review' ||
          p.confirmationStatus === 'Not Confirmed' ||
          p.confirmationStatus === 'Outdated')
    );
  }, [data.preferences, selectedResident]);

  const residentHistory = useMemo(() => {
    if (!selectedResident) return [];
    return data.preferenceHistory.filter((h) => h.residentId === selectedResident.id);
  }, [data.preferenceHistory, selectedResident]);

  const handleCreateResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResName.trim() || !newResRoom.trim()) return;
    const created = addResident({
      name: newResName.trim(),
      preferredName: newResPreferred.trim() || newResName.trim().split(' ')[0],
      room: newResRoom.trim(),
      wing: newResWing,
      age: Number(newResAge) || 80,
      summary:
        newResSummary.trim() ||
        'Resident life story and preferences are being collaboratively documented.',
      primaryLanguage: newResLanguage.trim() || 'English',
      whanauContact: newResWhanau.trim() || 'Family contact to be added',
      whanauRelationship: 'Authorised Representative',
      supportFocus: newResFocus.trim() || 'Getting to know daily rhythm',
      extraSupportNeeded: false,
    });
    setSelectedResidentId(created.id);
    setShowAddResident(false);
    setNewResName('');
    setNewResPreferred('');
    setNewResRoom('');
    setNewResSummary('');
    setNewResWhanau('');
    setNewResFocus('');
  };

  const openAddPreference = (defaultSource: PreferenceSource) => {
    setPrefSource(defaultSource);
    setPrefStatus(
      defaultSource === 'Resident / Whānau Feedback'
        ? 'Confirmed by Resident'
        : 'Pending Review'
    );
    setPrefDescription('');
    setPrefConfirmedBy(
      defaultSource === 'Resident / Whānau Feedback' && selectedResident
        ? selectedResident.name
        : ''
    );
    setShowAddPref(true);
  };

  const handleAddPreference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResident || !prefDescription.trim()) return;
    addPreference({
      residentId: selectedResident.id,
      category: prefCategory,
      description: prefDescription.trim(),
      source: prefSource,
      confirmationStatus: prefStatus,
      confirmedBy: prefConfirmedBy.trim() || undefined,
      reviewDueDate: prefReviewDue,
      relatedTaskTags: prefTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });
    setShowAddPref(false);
    setPrefDescription('');
  };

  const startReview = (pref: ResidentPreference) => {
    setReviewingPref(pref);
    setRevDescription(pref.description);
    setRevStatus(
      pref.confirmationStatus === 'Pending Review'
        ? 'Confirmed by Resident'
        : pref.confirmationStatus
    );
    setRevSource(pref.source);
    setRevConfirmedBy(
      pref.confirmedBy || (selectedResident ? selectedResident.name : '')
    );
    setRevReason('');
    setRevIsActive(pref.isActive);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingPref || !revDescription.trim()) return;
    reviewAndUpdatePreference({
      preferenceId: reviewingPref.id,
      description: revDescription.trim(),
      confirmationStatus: revStatus,
      source: revSource,
      confirmedBy: revConfirmedBy.trim() || undefined,
      reason: revReason.trim() || 'Reviewed and updated with resident',
      isActive: revIsActive,
    });
    setReviewingPref(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">
            Resident Life Profiles
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Living profiles distinguishing verified resident choices from daily staff observations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddResident(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          New Resident Profile
        </button>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Resident Roster */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search residents or rooms..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {['All', 'Kōwhai Wing', 'Rimu Wing'].map((wing) => (
                <button
                  key={wing}
                  type="button"
                  onClick={() => setWingFilter(wing)}
                  className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    wingFilter === wing
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {wing === 'All' ? 'All Wings' : wing.replace(' Wing', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-200 max-h-[640px] overflow-y-auto">
            {filteredResidents.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                No residents match your search.
              </div>
            ) : (
              filteredResidents.map((res) => {
                const isSelected = selectedResident?.id === res.id;
                const pendingCount = data.preferences.filter(
                  (p) =>
                    p.residentId === res.id &&
                    p.confirmationStatus === 'Pending Review'
                ).length;

                return (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => setSelectedResidentId(res.id)}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected ? 'bg-teal-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Avatar name={res.name} src={res.photoUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-sm text-slate-900 truncate">
                          {res.name}
                        </span>
                        <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                          {res.room}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Prefers “{res.preferredName}” · {res.wing}
                      </p>
                      {(pendingCount > 0 || res.extraSupportNeeded) && (
                        <p className="text-xs mt-1.5 text-amber-700 font-medium">
                          {pendingCount > 0
                            ? `${pendingCount} awaiting confirmation`
                            : ''}
                          {pendingCount > 0 && res.extraSupportNeeded ? ' · ' : ''}
                          {res.extraSupportNeeded ? 'Extra support today' : ''}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Resident Profile Detail */}
        {selectedResident ? (
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Profile Hero Banner */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    name={selectedResident.name}
                    src={selectedResident.photoUrl}
                    size="xl"
                  />
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                      <h2 className="text-xl font-display font-semibold text-slate-900">
                        {selectedResident.name}
                      </h2>
                      <span className="text-sm text-slate-500">
                        Known as “{selectedResident.preferredName}”
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 tabular-nums">
                      {selectedResident.room} · {selectedResident.wing} · Age{' '}
                      {selectedResident.age} · {selectedResident.primaryLanguage}
                    </p>
                    <p className="text-sm text-slate-700 mt-3 leading-relaxed max-w-2xl">
                      {selectedResident.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Clean metadata strip (unboxed) */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Whānau / Representative</span>
                  <span className="text-slate-900 font-medium mt-0.5 block">
                    {selectedResident.whanauContact}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Daily Support Focus</span>
                  <span className="text-slate-900 font-medium mt-0.5 block">
                    {selectedResident.supportFocus}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedResident.extraSupportNeeded}
                      onChange={(e) =>
                        updateResidentSupportFlag(selectedResident.id, e.target.checked)
                      }
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    Needs extra support today
                  </label>
                </div>
              </div>

              {/* Action & Tab Bar */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setProfileTab('preferences')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      profileTab === 'preferences'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Preferences ({data.preferences.filter((p) => p.residentId === selectedResident.id).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileTab('review')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      profileTab === 'review'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Review Queue ({pendingReviewPrefs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileTab('history')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      profileTab === 'history'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Preference History ({residentHistory.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAddPreference('Staff Observation')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Staff Observation
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddPreference('Resident / Whānau Feedback')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    Resident / Whānau Feedback
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {profileTab === 'preferences' && (
              <div>
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-slate-600">
                    Filter by life profile category
                  </span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="All">All 8 Profile Categories</option>
                    {PREFERENCE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="divide-y divide-slate-200">
                  {residentPrefs.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No preferences recorded in this category yet.
                    </div>
                  ) : (
                    residentPrefs.map((pref) => (
                      <div
                        key={pref.id}
                        className={`p-5 transition-colors hover:bg-slate-50/70 ${
                          !pref.isActive ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                              <span className="font-mono tabular-nums text-slate-500">
                                {pref.id}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-slate-700">
                                {pref.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  pref.source === 'Resident / Whānau Feedback'
                                    ? 'text-teal-800 font-medium'
                                    : 'text-slate-600'
                                }
                              >
                                {pref.source}
                              </span>
                              {!pref.isActive && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-slate-500">Inactive</span>
                                </>
                              )}
                            </div>

                            <p className="text-sm text-slate-900 leading-relaxed">
                              {pref.description}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-slate-500 tabular-nums">
                              <ConfirmationStatusLabel status={pref.confirmationStatus} />
                              <span aria-hidden="true">·</span>
                              <span>Recorded by {pref.recordedBy} on {pref.dateRecorded}</span>
                              {pref.confirmedBy && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>Confirmed by {pref.confirmedBy}</span>
                                </>
                              )}
                              <span aria-hidden="true">·</span>
                              <span>Review due {pref.reviewDueDate}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => startReview(pref)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            Review / Update
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {profileTab === 'review' && (
              <div className="divide-y divide-slate-200">
                <div className="px-6 py-4 bg-slate-50 text-xs text-slate-600">
                  Preferences below were logged from staff observations or marked due for review. Confirm directly with the resident or authorised representative wherever possible.
                </div>
                {pendingReviewPrefs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    All preferences for {selectedResident.preferredName} are currently verified and up to date.
                  </div>
                ) : (
                  pendingReviewPrefs.map((pref) => (
                    <div key={pref.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="font-mono tabular-nums">{pref.id}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">{pref.category}</span>
                          <span>·</span>
                          <span>{pref.source}</span>
                        </div>
                        <p className="text-sm text-slate-900">{pref.description}</p>
                        <div className="pt-1 flex items-center gap-3 text-xs text-slate-500">
                          <ConfirmationStatusLabel status={pref.confirmationStatus} />
                          <span>·</span>
                          <span>Recorded by {pref.recordedBy}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => startReview(pref)}
                        className="px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Verify &amp; Confirm
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {profileTab === 'history' && (
              <div className="divide-y divide-slate-200">
                <div className="px-6 py-4 bg-slate-50 text-xs text-slate-600 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  Audit trail preserving preference changes, sources, and reasons—respecting that resident choices evolve over time.
                </div>
                {residentHistory.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No historical updates recorded yet for {selectedResident.preferredName}.
                  </div>
                ) : (
                  residentHistory.map((h) => (
                    <div key={h.id} className="p-5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 tabular-nums">
                        <span>
                          <strong className="text-slate-800 font-medium">{h.category}</strong> · {h.preferenceId} · {h.source}
                        </span>
                        <span>
                          Updated by {h.changedBy} · {h.changedAt}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-slate-500 block mb-1">Previous ({h.previousStatus})</span>
                          <p className="text-slate-700">{h.previousDescription}</p>
                        </div>
                        <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200">
                          <span className="text-teal-800 block mb-1">Updated ({h.updatedStatus})</span>
                          <p className="text-slate-900 font-medium">{h.updatedDescription}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">
                        Reason: {h.reason}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        ) : (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-10 text-center text-sm text-slate-500">
            Select a resident or create a new Resident Life Profile.
          </div>
        )}
      </div>

      {/* Modal: Create New Resident */}
      {showAddResident && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Create Resident Life Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowAddResident(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateResident} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newResName}
                    onChange={(e) => setNewResName(e.target.value)}
                    placeholder="e.g., Wiremu Te Kanawa"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Preferred Name
                  </label>
                  <input
                    type="text"
                    value={newResPreferred}
                    onChange={(e) => setNewResPreferred(e.target.value)}
                    placeholder="e.g., Matua Wiremu"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Room
                  </label>
                  <input
                    required
                    type="text"
                    value={newResRoom}
                    onChange={(e) => setNewResRoom(e.target.value)}
                    placeholder="Room 112"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Wing
                  </label>
                  <select
                    value={newResWing}
                    onChange={(e) => setNewResWing(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="Kōwhai Wing">Kōwhai Wing</option>
                    <option value="Rimu Wing">Rimu Wing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={newResAge}
                    onChange={(e) => setNewResAge(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Primary Language(s)
                  </label>
                  <input
                    type="text"
                    value={newResLanguage}
                    onChange={(e) => setNewResLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Whānau / Authorised Contact
                  </label>
                  <input
                    type="text"
                    value={newResWhanau}
                    onChange={(e) => setNewResWhanau(e.target.value)}
                    placeholder="Name & phone"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Daily Support Focus
                </label>
                <input
                  type="text"
                  value={newResFocus}
                  onChange={(e) => setNewResFocus(e.target.value)}
                  placeholder="e.g., Unhurried morning pace & music during breakfast"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Life Story &amp; Individual Summary
                </label>
                <textarea
                  rows={3}
                  value={newResSummary}
                  onChange={(e) => setNewResSummary(e.target.value)}
                  placeholder="Share background, routines, and what helps them feel at home..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddResident(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Staff Observation or Resident / Whānau Feedback */}
      {showAddPref && selectedResident && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Record Preference for {selectedResident.preferredName}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPref(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPreference} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Information Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'Staff Observation',
                      'Resident / Whānau Feedback',
                    ] as PreferenceSource[]
                  ).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => {
                        setPrefSource(src);
                        setPrefStatus(
                          src === 'Resident / Whānau Feedback'
                            ? 'Confirmed by Resident'
                            : 'Pending Review'
                        );
                      }}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                        prefSource === src
                          ? 'border-teal-700 bg-teal-50 text-teal-900'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Profile Category
                  </label>
                  <select
                    value={prefCategory}
                    onChange={(e) =>
                      setPrefCategory(e.target.value as PreferenceCategory)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {PREFERENCE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirmation Status
                  </label>
                  <select
                    value={prefStatus}
                    onChange={(e) =>
                      setPrefStatus(e.target.value as ConfirmationStatus)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {CONFIRMATION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Preference / Observation Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={prefDescription}
                  onChange={(e) => setPrefDescription(e.target.value)}
                  placeholder="Describe what the resident prefers or what was noticed in daily care..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Related Daily Task Keywords
                  </label>
                  <input
                    type="text"
                    value={prefTags}
                    onChange={(e) => setPrefTags(e.target.value)}
                    placeholder="e.g., shower, linen, personal care"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Used to surface this preference inside matching daily tasks.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Review Due Date
                  </label>
                  <input
                    type="date"
                    value={prefReviewDue}
                    onChange={(e) => setPrefReviewDue(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {prefSource === 'Resident / Whānau Feedback' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirmed By (Resident or Authorised Representative)
                  </label>
                  <input
                    type="text"
                    value={prefConfirmedBy}
                    onChange={(e) => setPrefConfirmedBy(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPref(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Save to Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review & Confirm Preference (Preserving History) */}
      {reviewingPref && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-semibold text-slate-900">
                Review &amp; Confirm Preference ({reviewingPref.id})
              </h3>
              <button
                type="button"
                onClick={() => setReviewingPref(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Resident preferences are living choices—never permanent instructions. Any update preserves the previous version in Preference History.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Updated Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={revDescription}
                  onChange={(e) => setRevDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Verification Status
                  </label>
                  <select
                    value={revStatus}
                    onChange={(e) =>
                      setRevStatus(e.target.value as ConfirmationStatus)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    {CONFIRMATION_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Source
                  </label>
                  <select
                    value={revSource}
                    onChange={(e) => setRevSource(e.target.value as PreferenceSource)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="Resident / Whānau Feedback">
                      Resident / Whānau Feedback
                    </option>
                    <option value="Staff Observation">Staff Observation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirmed By
                </label>
                <input
                  type="text"
                  value={revConfirmedBy}
                  onChange={(e) => setRevConfirmedBy(e.target.value)}
                  placeholder="Resident name, family representative, or staff verifier"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Change / Review Note
                </label>
                <input
                  required
                  type="text"
                  value={revReason}
                  onChange={(e) => setRevReason(e.target.value)}
                  placeholder="e.g., Confirmed directly with Whaea Maggie during afternoon tea"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={revIsActive}
                  onChange={(e) => setRevIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                Preference remains active
              </label>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingPref(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  Save Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
