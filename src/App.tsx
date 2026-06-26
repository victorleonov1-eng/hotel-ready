import { useState } from 'react';
import { Header } from './ui/Header';
import { Footer } from './ui/Footer';
import { WhoAreYou } from './ui/WhoAreYou';
import { PracticeAreaSelector } from './ui/PracticeAreaSelector';
import { ScenarioList } from './ui/ScenarioList';
import { RolePlay } from './ui/RolePlay';
import { ManagerView } from './ui/ManagerView';
import { loginOrCreateProfile, recordAttempt } from './state/profiles';
import { getAllPacks, getPack, getScenario, getScenariosByPack } from './content/registry';
import type { UserProfile } from './content/types';

type Screen =
  | { type: 'login' }
  | { type: 'practice-selector' }
  | { type: 'list'; packId: string }
  | { type: 'play'; scenarioId: string; packId: string }
  | { type: 'manager' }
  | { type: 'admin' };

function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'login' });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [muted, setMuted] = useState(false);

  function handleLogin(firstName: string, lastName: string, pin: string, position: string, department: any) {
    console.log('handleLogin called:', { firstName, lastName, pin, position, department });
    const p = loginOrCreateProfile(firstName, lastName, pin, position, department);
    console.log('loginOrCreateProfile returned:', p);
    if (p) {
      console.log('Setting profile and navigating to practice-selector');
      setProfile(p);
      setScreen({ type: 'practice-selector' });
    } else {
      console.log('Profile is null - PIN may be incorrect');
    }
  }

  function selectPracticeArea(packId: string) {
    setScreen({ type: 'list', packId });
  }

  function selectScenario(scenarioId: string, packId: string) {
    setScreen({ type: 'play', scenarioId, packId });
  }

  function refreshProfile() {
    if (profile) {
      const p = loginOrCreateProfile(profile.firstName, profile.lastName, profile.pin, profile.position, profile.department);
      if (p) setProfile(p);
    }
  }

  function handleScenarioDone(score: number, seconds: number, usedCards: boolean, recordingId: string) {
    if (!profile) return;
    const currentScreen = screen as any;
    recordAttempt(profile.firstName, profile.lastName, currentScreen.scenarioId, score, seconds, usedCards, recordingId);
    refreshProfile();
  }

  function logout() {
    setProfile(null);
    setScreen({ type: 'login' });
  }

  const allPacks = getAllPacks();
  const currentPack = (screen as any).packId ? getPack((screen as any).packId) : null;
  const currentScenarios = (screen as any).packId ? getScenariosByPack((screen as any).packId) : [];
  const currentScenario = (screen as any).scenarioId ? getScenario((screen as any).scenarioId) : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header muted={muted} onMuteToggle={setMuted} />

      <main className="flex-1">
        {screen.type === 'login' && <WhoAreYou onSubmit={handleLogin} />}

        {screen.type === 'practice-selector' && profile && (
          <PracticeAreaSelector
            packs={allPacks}
            onSelect={selectPracticeArea}
            onLogout={logout}
          />
        )}

        {screen.type === 'list' && profile && currentPack && (
          <ScenarioList
            profile={profile}
            packId={currentPack.id}
            scenarios={currentScenarios}
            onSelect={(id) => selectScenario(id, currentPack.id)}
            onManager={() => setScreen({ type: 'manager' })}
            onAdmin={() => setScreen({ type: 'admin' })}
            onBack={() => {
              if (profile) {
                setProfile(loginOrCreateProfile(profile.firstName, profile.lastName, profile.pin, profile.position, profile.department) || profile);
              }
              setScreen({ type: 'practice-selector' });
            }}
          />
        )}

        {screen.type === 'play' && profile && currentScenario && (
          <RolePlay
            key={currentScenario.id}
            scenario={currentScenario}
            bestTime={profile.bestTimeByScenario[currentScenario.id]}
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

        {screen.type === 'admin' && (
          <ManagerView
            startInAdmin
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

export default App;
