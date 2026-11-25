import { useEffect, useMemo, useState } from 'react';
import { CommunityResponses } from './components/CommunityResponses';
import { EcoActions } from './components/EcoActions';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HomeHero } from './components/HomeHero';
import { LearnSection } from './components/LearnSection';
import { Navbar } from './components/Navbar';
import { ReportPollution } from './components/ReportPollution';
import { SafeCropChecker } from './components/SafeCropChecker';
import { SoilHealthChecker } from './components/SoilHealthChecker';
import { ECO_TASKS, INITIAL_REPORTS } from './data/soilData';
import { EcoActionPhoto, PollutionReport, SectionId } from './types';

const STORAGE_KEYS = {
  reports: 'mittimitra_reports_v1',
  tasks: 'mittimitra_eco_tasks_v1',
  ecoPhotos: 'mittimitra_eco_photos_v1',
  userName: 'mittimitra_username_v1',
};

function loadInitialReports(): PollutionReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.reports);
    if (!raw) return INITIAL_REPORTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_REPORTS;
  } catch {
    return INITIAL_REPORTS;
  }
}

function loadCompletedTasks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tasks);
    if (!raw) return ['compost'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadEcoPhotos(): EcoActionPhoto[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ecoPhotos);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadUserName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.userName) || 'Aarav Patel';
  } catch {
    return 'Aarav Patel';
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('home');
  const [reports, setReports] = useState<PollutionReport[]>(loadInitialReports);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(loadCompletedTasks);
  const [ecoPhotos, setEcoPhotos] = useState<EcoActionPhoto[]>(loadEcoPhotos);
  const [userName, setUserName] = useState<string>(loadUserName);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.reports, JSON.stringify(reports));
    } catch {
      // Ignore storage quota issues cleanly
    }
  }, [reports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(completedTaskIds));
    } catch {
      // Ignore storage quota issues cleanly
    }
  }, [completedTaskIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ecoPhotos, JSON.stringify(ecoPhotos));
    } catch {
      // Ignore storage quota issues cleanly
    }
  }, [ecoPhotos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.userName, userName);
    } catch {
      // Ignore storage quota issues cleanly
    }
  }, [userName]);

  const handleNavigate = (section: SectionId) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddReport = (report: PollutionReport) => {
    setReports((prev) => [report, ...prev]);
  };

  const handleDeleteReport = (id: string) => {
    setReports((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleTask = (taskId: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleResetTasks = () => {
    setCompletedTaskIds([]);
  };

  const handleAddEcoPhoto = (photo: EcoActionPhoto) => {
    setEcoPhotos((prev) => [photo, ...prev]);
  };

  const handleDeleteEcoPhoto = (id: string) => {
    setEcoPhotos((prev) => prev.filter((item) => item.id !== id));
  };

  const userPoints = useMemo(() => {
    const taskPts = ECO_TASKS.reduce(
      (sum, task) => (completedTaskIds.includes(task.id) ? sum + task.points : sum),
      0
    );
    const photoPts = ecoPhotos.length * 10;
    return taskPts + photoPts;
  }, [completedTaskIds, ecoPhotos.length]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#2C1E18]">
        <Navbar activeSection={activeSection} onNavigate={handleNavigate} />

        <main className="flex-1">
          {activeSection === 'home' && (
            <HomeHero
              onNavigate={handleNavigate}
              totalReports={reports.length}
              ecoPoints={userPoints}
            />
          )}

          {activeSection === 'report' && (
            <ReportPollution
              reports={reports}
              onAddReport={handleAddReport}
              onDeleteReport={handleDeleteReport}
            />
          )}

          {activeSection === 'health' && <SoilHealthChecker />}

          {activeSection === 'crops' && <SafeCropChecker />}

          {activeSection === 'responses' && <CommunityResponses />}

          {activeSection === 'eco' && (
            <EcoActions
              completedTaskIds={completedTaskIds}
              onToggleTask={handleToggleTask}
              onResetTasks={handleResetTasks}
              userName={userName}
              onChangeUserName={setUserName}
              userPoints={userPoints}
              ecoPhotos={ecoPhotos}
              onAddEcoPhoto={handleAddEcoPhoto}
              onDeleteEcoPhoto={handleDeleteEcoPhoto}
            />
          )}

          {activeSection === 'learn' && <LearnSection />}
        </main>

        <footer className="border-t border-[#E2D9C8] bg-[#3E2723] text-[#EFE7D6] pt-10 pb-24 md:pb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="font-display text-lg font-bold text-[#FAF7F0]">
                🌱 MittiMitra - SoilGuard
              </p>
              <p className="text-xs sm:text-sm text-[#D7CCC8] mt-1">
                Healthy Soil, Healthy Lives · स्वच्छ मिट्टी, स्वस्थ भारत
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm text-[#D7CCC8]">
              <button
                type="button"
                onClick={() => handleNavigate('home')}
                className="hover:text-[#FAF7F0] cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('report')}
                className="hover:text-[#FAF7F0] cursor-pointer"
              >
                Report Pollution
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('health')}
                className="hover:text-[#FAF7F0] cursor-pointer"
              >
                Soil Checker
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('responses')}
                className="hover:text-[#FAF7F0] cursor-pointer"
              >
                Response Form
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('eco')}
                className="hover:text-[#FAF7F0] cursor-pointer"
              >
                Eco Actions
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('learn')}
                className="hover:text-[#FAF7F0] cursor-pointer"
              >
                Learn
              </button>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
