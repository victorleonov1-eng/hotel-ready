import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './ui/AuthScreen';
import { Header } from './ui/Header';
import { Footer } from './ui/Footer';
import { WhoAreYou } from './ui/WhoAreYou';
import { PracticeAreaSelector } from './ui/PracticeAreaSelector';
import { ScenarioList } from './ui/ScenarioList';
import { RolePlay } from './ui/RolePlay';
import { ManagerView } from './ui/ManagerView';
import { AdminDashboard } from './ui/AdminDashboard';
import { AdminPinEntry } from './ui/AdminPinEntry';
import { loginOrCreateProfile, recordAttempt } from './state/profiles';
import { getAllPacks, getPack, getScenario, getScenariosByPack } from './content/registry';
import type { UserProfile } from './content/types';

type Screen =
  | { type: 'login' }
  | { type: 'practice-selector' }
  | { type: 'list'; packId: string }
  | { type: 'play'; scenarioId: string; packId: string }
  | { type: 'manager' }
  | { type: 'admin-pin' }
  | { type: 'admin' };

function AppContent() {
  const { user, profile, loading, logout } = useAuth();
  const [screen, setScreen] = useState<Screen>({ type: 'login' });
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const [muted, setMuted] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block bg-red-700 text-white px-8 py-4 rounded-lg mb-4">
            <h1 className="text-3xl font-bold">HOTEL Ready</h1>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // User is logged in - show staff training interface for now
  function handleLogin(firstName: string, lastName: string, pin: string, position: string, department: any) {
    const p = loginOrCreateProfile(firstName, lastName, pin, position, department);
    if (p) {
      setLocalProfile(p);
      setScreen({ type: 'practice-selector' });
    }
  }

  function selectPracticeArea(packId: string) {
    setScreen({ type: 'list', packId });
  }

  function selectScenario(scenarioId: string, packId: string) {
    setScreen({ type: 'play', scenarioId, packId });
  }

  function refreshProfile() {
    if (localProfile) {
      const p = loginOrCreateProfile(localProfile.firstName, localProfile.lastName, localProfile.pin, localProfile.position, localProfile.department);
      if (p) setLocalProfile(p);
    }
  }

  function handleScenarioDone(score: number, seconds: number, usedCards: boolean, recordingId: string) {
    if (!localProfile) return;
    const currentScreen = screen as any;
    recordAttempt(localProfile.firstName, localProfile.lastName, currentScreen.scenarioId, score, seconds, usedCards, recordingId);
    refreshProfile();
  }

  async function handleLogout() {
    await logout();
    setLocalProfile(null);
    setScreen({ type: 'login' });
  }

  const allPacks = getAllPacks();
  const currentPack = (screen as any).packId ? getPack((screen as any).packId) : null;
  const currentScenarios = (screen as any).packId ? getScenariosByPack((screen as any).packId) : [];
  const currentScenario = (screen as any).scenarioId ? getScenario((screen as any).scenarioId) : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header muted={muted} onMuteToggle={setMuted} onLogout={user ? handleLogout : undefined} />

      <main className="flex-1">
        {screen.type === 'login' && !localProfile && <WhoAreYou onSubmit={handleLogin} />}

        {screen.type === 'practice-selector' && localProfile && (
          <PracticeAreaSelector
            packs={allPacks}
            profile={localProfile}
            onSelect={selectPracticeArea}
            onLogout={handleLogout}
          />
        )}

        {screen.type === 'list' && localProfile && currentPack && (
          <ScenarioList
            profile={localProfile}
            packId={currentPack.id}
            scenarios={currentScenarios}
            onSelect={(id) => selectScenario(id, currentPack.id)}
            onManager={() => setScreen({ type: 'manager' })}
            onAdmin={() => setScreen({ type: 'admin-pin' })}
            onBack={() => {
              if (localProfile) {
                setLocalProfile(loginOrCreateProfile(localProfile.firstName, localProfile.lastName, localProfile.pin, localProfile.position, localProfile.department) || localProfile);
              }
              setScreen({ type: 'practice-selector' });
            }}
          />
        )}

        {screen.type === 'play' && localProfile && currentScenario && (
          <RolePlay
            key={currentScenario.id}
            scenario={currentScenario}
            bestTime={localProfile.bestTimeByScenario[currentScenario.id]}
            onDone={handleScenarioDone}
            onBack={() => {
              refreshProfile();
              const packId = (screen as any).packId;
              setScreen({ type: 'list', packId });
            }}
          />
        )}

        {screen.type === 'manager' && (
          <ManagerView onBack={() => {
            refreshProfile();
            setScreen({ type: 'practice-selector' });
          }} />
        )}

        {screen.type === 'admin-pin' && (
          <AdminPinEntry
            onSubmit={() => setScreen({ type: 'admin' })}
            onBack={() => setScreen({ type: 'practice-selector' })}
            correctPin="8739"
          />
        )}

        {screen.type === 'admin' && (
          <AdminDashboard
            onBack={() => {
              refreshProfile();
              setScreen({ type: 'practice-selector' });
            }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
