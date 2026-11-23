import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftRight,
  CalendarClock,
  ClipboardCheck,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquareHeart,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';
import { Avatar } from './components/Avatar';
import { DailyOperations } from './components/DailyOperations';
import { ManagerOverview } from './components/ManagerOverview';
import { ResidentDirectory } from './components/ResidentDirectory';
import { SmartHandover } from './components/SmartHandover';
import { StaffPortalHome } from './components/StaffPortalHome';
import { WellbeingImprovement } from './components/WellbeingImprovement';
import { WorkforceCoordination } from './components/WorkforceCoordination';
import { CareStoreProvider, useCareStore } from './context/CareStoreContext';
import { AppSection, PortalMode } from './types';

interface NavSnapshot {
  section: AppSection;
  portalMode: PortalMode;
  residentId?: string;
  taskId?: string;
}

const NAV_ITEMS: {
  id: AppSection;
  managerLabel: string;
  staffLabel: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'overview',
    managerLabel: 'Daily Overview',
    staffLabel: 'My Schedule & Residents',
    icon: LayoutDashboard,
  },
  {
    id: 'residents',
    managerLabel: 'Resident Life Profiles',
    staffLabel: 'Resident Profiles',
    icon: Users,
  },
  {
    id: 'operations',
    managerLabel: 'Daily Operations & Guidance',
    staffLabel: 'Daily Tasks & Guidance',
    icon: ListChecks,
  },
  {
    id: 'workforce',
    managerLabel: 'Workforce & Shifts',
    staffLabel: 'Shift & Support Requests',
    icon: CalendarClock,
  },
  {
    id: 'handover',
    managerLabel: 'Smart Handover',
    staffLabel: 'Handover & Next Shift',
    icon: ClipboardCheck,
  },
  {
    id: 'wellbeing',
    managerLabel: 'Wellbeing & Improvement',
    staffLabel: 'Staff Feedback & Survey',
    icon: MessageSquareHeart,
  },
];

function WorkspaceShell() {
  const {
    data,
    activeStaff,
    portalMode,
    setActiveStaffId,
    setPortalMode,
    resetDemoData,
  } = useCareStore();

  const [section, setSection] = useState<AppSection>('overview');
  const [focusedResidentId, setFocusedResidentId] = useState<string | undefined>(
    undefined
  );
  const [focusedTaskId, setFocusedTaskId] = useState<string | undefined>(
    undefined
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const pushHistory = useCallback((next: NavSnapshot) => {
    try {
      window.history.pushState(next, '', `#/${next.portalMode}/${next.section}`);
    } catch {
      // Ignore history push restrictions if any
    }
  }, []);

  useEffect(() => {
    try {
      window.history.replaceState(
        { section: 'overview', portalMode: 'manager' } satisfies NavSnapshot,
        '',
        '#/manager/overview'
      );
    } catch {
      // Ignore history replace restrictions
    }
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as NavSnapshot | null;
      if (state && state.section) {
        setSection(state.section);
        setPortalMode(state.portalMode);
        setFocusedResidentId(state.residentId);
        setFocusedTaskId(state.taskId);
      } else {
        setSection('overview');
        setFocusedResidentId(undefined);
        setFocusedTaskId(undefined);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setPortalMode]);

  const handleNavigate = (
    target: AppSection,
    residentId?: string,
    taskId?: string
  ) => {
    if (
      target === section &&
      residentId === focusedResidentId &&
      taskId === focusedTaskId
    ) {
      setMobileNavOpen(false);
      return;
    }
    pushHistory({
      section: target,
      portalMode,
      residentId: residentId ?? focusedResidentId,
      taskId,
    });
    setSection(target);
    if (residentId) {
      setFocusedResidentId(residentId);
    }
    setFocusedTaskId(taskId);
    setMobileNavOpen(false);
  };

  const handleSwitchPortal = (mode: PortalMode) => {
    if (mode === portalMode) return;
    pushHistory({
      section,
      portalMode: mode,
      residentId: focusedResidentId,
      taskId: focusedTaskId,
    });
    setPortalMode(mode);
  };

  const currentNav = NAV_ITEMS.find((item) => item.id === section) ?? NAV_ITEMS[0];
  const currentBreadcrumb =
    portalMode === 'manager' ? currentNav.managerLabel : currentNav.staffLabel;

  const personaOptions = [
    'st-claire', // Manager
    'st-grace', // Supervisor
    'st-sarah', // Caregiver
    'st-mateusz', // Housekeeper
    'st-tessa', // System Administrator
  ]
    .map((id) => data.staff.find((s) => s.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="px-5 h-16 border-b border-slate-200 flex items-center gap-2.5">
          <HeartHandshake className="w-5 h-5 text-teal-700 shrink-0" aria-hidden="true" />
          <span className="font-display font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">
            People First Care
          </span>
        </div>

        {/* Portal Mode Switch */}
        <div className="p-4 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleSwitchPortal('manager')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                portalMode === 'manager'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manager Portal
            </button>
            <button
              type="button"
              onClick={() => handleSwitchPortal('staff')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                portalMode === 'staff'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Portal
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            const label =
              portalMode === 'manager' ? item.managerLabel : item.staffLabel;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-900'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-teal-700' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Role / User Footer */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={activeStaff.name} src={activeStaff.photoUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-900 truncate">
                {activeStaff.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {activeStaff.role} · {activeStaff.department}
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="desktop-role-select"
              className="block text-[11px] text-slate-500 mb-1"
            >
              Switch Active Role
            </label>
            <select
              id="desktop-role-select"
              value={activeStaff.id}
              onChange={(e) => setActiveStaffId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              {personaOptions.map((member) => (
                <option key={member!.id} value={member!.id}>
                  {member!.name} ({member!.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="px-5 h-16 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-teal-700" />
                <span className="font-display font-bold text-base text-slate-900">
                  People First Care
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-200">
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleSwitchPortal('manager')}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    portalMode === 'manager'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchPortal('staff')}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md cursor-pointer ${
                    portalMode === 'staff'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  Staff
                </button>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.id;
                const label =
                  portalMode === 'manager' ? item.managerLabel : item.staffLabel;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-left cursor-pointer ${
                      isActive
                        ? 'bg-teal-50 text-teal-900'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200">
              <label className="block text-[11px] text-slate-500 mb-1">
                Active Role
              </label>
              <select
                value={activeStaff.id}
                onChange={(e) => setActiveStaffId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5"
              >
                {personaOptions.map((member) => (
                  <option key={member!.id} value={member!.id}>
                    {member!.name} ({member!.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm text-slate-500 truncate">
              <span className="hidden sm:inline whitespace-nowrap">
                Kōwhai Grove
              </span>
              <span className="hidden sm:inline" aria-hidden="true">
                /
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('overview')}
                className="whitespace-nowrap hover:text-slate-900 cursor-pointer"
              >
                {portalMode === 'manager' ? 'Manager Portal' : 'Staff Portal'}
              </button>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-900 truncate">
                {currentBreadcrumb}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleSwitchPortal(
                  portalMode === 'manager' ? 'staff' : 'manager'
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-teal-700" />
              Switch to {portalMode === 'manager' ? 'Staff' : 'Manager'} View
            </button>
            <button
              type="button"
              onClick={resetDemoData}
              title="Restore initial fictional rest home data"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo Data</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1280px] w-full mx-auto">
          {section === 'overview' &&
            (portalMode === 'manager' ? (
              <ManagerOverview onNavigate={handleNavigate} />
            ) : (
              <StaffPortalHome onNavigate={handleNavigate} />
            ))}

          {section === 'residents' && (
            <ResidentDirectory
              key={focusedResidentId || 'default-res'}
              initialResidentId={focusedResidentId}
            />
          )}

          {section === 'operations' && (
            <DailyOperations
              key={focusedTaskId || 'default-task'}
              initialTaskId={focusedTaskId}
              onOpenResident={(residentId) =>
                handleNavigate('residents', residentId)
              }
            />
          )}

          {section === 'workforce' && <WorkforceCoordination />}

          {section === 'handover' && <SmartHandover />}

          {section === 'wellbeing' && <WellbeingImprovement />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CareStoreProvider>
      <WorkspaceShell />
    </CareStoreProvider>
  );
}
