import { useState, useEffect } from 'react';
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
import { ManagerPinEntry } from './ui/ManagerPinEntry';
import { CompanyDashboard } from './ui/CompanyDashboard';
import { CompanyLandingPage } from './ui/CompanyLandingPage';
import { ManagerDashboard } from './ui/ManagerDashboard';
import { loginOrCreateProfile, recordAttempt } from './state/profiles';
import { getAllPacks, getPack, getScenario, getScenariosByPack } from './content/registry';
import { supabase } from './lib/supabase';
import type { UserProfile } from './content/types';

type Screen =
  | { type: 'login' }
  | { type: 'company-landing' }
  | { type: 'staff-training' }
  | { type: 'practice-selector' }
  | { type: 'list'; packId: string }
  | { type: 'play'; scenarioId: string; packId: string }
  | { type: 'manager' }
  | { type: 'manager-pin' }
  | { type: 'manager-dashboard' }
  | { type: 'admin-pin' }
  | { type: 'admin' };

function AppContent() {
  const { user, profile, loading, logout } = useAuth();
  const [screen, setScreen] = useState<Screen>({ type: 'login' });
  const [localProfile, setLocalProfile] = useState<UserProfile | null>(null);
  const [muted, setMuted] = useState(false);
  const [orgPinExpired, setOrgPinExpired] = useState(false);
  const [adminPinVerified, setAdminPinVerified] = useState(() => {
    return localStorage.getItem('adminPinVerified') === 'true';
  });
  const [managerStaffId, setManagerStaffId] = useState<string | null>(null);
  const [staffLoginMode, setStaffLoginMode] = useState(false);
  const [managerOrgId, setManagerOrgId] = useState<string | null>(null);
  const [managerPin, setManagerPin] = useState<string>('1234');
  const [organizationName, setOrganizationName] = useState<string>('Hotel');

  const handleManagerView = () => {
    if (localProfile) {
      setScreen({ type: 'manager-pin' });
    }
  };

  const handleManagerPinSubmit = () => {
    if (localProfile) {
      // Use PIN as manager ID (unique identifier)
      const managerId = localProfile.pin;
      setManagerStaffId(managerId);
      setScreen({ type: 'manager-dashboard' });
    }
  };

  const handleManagerPinSubmitFromCompany = () => {
    if (profile?.organization_id) {
      setManagerOrgId(profile.organization_id);
      setScreen({ type: 'manager-dashboard' });
    }
  };

  useEffect(() => {
    const checkOrgData = async () => {
      if (user && profile?.organization_id) {
        try {
          const { data: org } = await supabase
            .from('organizations')
            .select('name, pin_expires_at, manager_pin')
            .eq('id', profile.organization_id)
            .single();

          if (org?.name) {
            setOrganizationName(org.name);
          }

          if (org?.pin_expires_at) {
            const expiryDate = new Date(org.pin_expires_at);
            const isExpired = expiryDate < new Date();
            setOrgPinExpired(isExpired);
          }

          if (org?.manager_pin) {
            setManagerPin(org.manager_pin);
          }
        } catch (error) {
          console.error('Error fetching organization data:', error);
        }
      }
    };

    checkOrgData();
  }, [user, profile]);

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

  // Show admin dashboard if PIN verified from login screen
  if (adminPinVerified && !user) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header muted={muted} onMuteToggle={setMuted} onLogout={() => {
          localStorage.removeItem('adminPinVerified');
          setAdminPinVerified(false);
        }} />
        <main className="flex-1">
          <AdminDashboard
            onBack={() => {
              localStorage.removeItem('adminPinVerified');
              setAdminPinVerified(false);
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // Show auth screen only if no Supabase user AND no local profile
  if (!user && !localProfile) {
    if (staffLoginMode) {
      // Show staff training interface - will render WhoAreYou when screen type is 'login'
      // Fall through to continue rendering
    } else {
      return <AuthScreen onStaffLogin={() => setStaffLoginMode(true)} />;
    }
  }

  // Show Company Landing Page for logged-in organization users (unless they've selected a screen)
  if (user && profile?.organization_id && !adminPinVerified && (screen.type === 'login' || screen.type === 'company-landing')) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header muted={muted} onMuteToggle={setMuted} onLogout={handleLogout} companyName={organizationName} />
        <CompanyLandingPage
          onStaffTraining={() => setScreen({ type: 'staff-training' })}
          onManagerDashboard={() => setScreen({ type: 'manager-pin' })}
        />
      </div>
    );
  }

  if (orgPinExpired && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-block bg-red-700 text-white px-8 py-4 rounded-lg mb-6">
            <h1 className="text-3xl font-bold">HOTEL Ready</h1>
          </div>
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <p className="text-6xl mb-4">🔒</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Awaiting Approval</h2>
            <p className="text-gray-600 mb-4">
              Your organization is pending admin approval. The administrator needs to authorize your access and set an expiration date for your PIN.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please contact your administrator to proceed.
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User is logged in - show staff training interface for now
  function handleLogin(firstName: string, lastName: string, pin: string, department: any) {
    console.log('[LOGIN] Starting login for:', firstName, lastName, 'Department:', department);
    try {
      console.log('[LOGIN] Calling loginOrCreateProfile...');
      const p = loginOrCreateProfile(firstName, lastName, pin, '', department);
      console.log('[LOGIN] loginOrCreateProfile returned:', p);

      if (p) {
        console.log('[LOGIN] Setting local profile...');
        setLocalProfile(p);
        console.log('[LOGIN] Profile set, changing screen to practice-selector...');
        setScreen({ type: 'practice-selector' });
        console.log('[LOGIN] ✅ Login complete');
      } else {
        console.warn('[LOGIN] loginOrCreateProfile returned null');
        alert('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('[LOGIN] Exception:', error);
      alert('An error occurred: ' + (error instanceof Error ? error.message : String(error)));
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
    setStaffLoginMode(true);
    setScreen({ type: 'login' });
  }

  const allPacks = getAllPacks();
  const currentPack = (screen as any).packId ? getPack((screen as any).packId) : null;
  const currentScenarios = (screen as any).packId ? getScenariosByPack((screen as any).packId) : [];
  const currentScenario = (screen as any).scenarioId ? getScenario((screen as any).scenarioId) : null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header muted={muted} onMuteToggle={setMuted} onLogout={user ? handleLogout : undefined} companyName={organizationName} />

      <main className="flex-1">
        {screen.type === 'staff-training' && !localProfile && (
          <WhoAreYou
            onSubmit={handleLogin}
            onSignOut={() => {
              setScreen({ type: 'company-landing' });
            }}
          />
        )}

        {screen.type === 'login' && !localProfile && (
          <WhoAreYou
            onSubmit={handleLogin}
            onSignOut={() => setStaffLoginMode(false)}
          />
        )}

        {screen.type === 'practice-selector' && localProfile && (
          <PracticeAreaSelector
            packs={allPacks}
            profile={localProfile}
            onSelect={selectPracticeArea}
            onLogout={handleLogout}
            onManagerView={handleManagerView}
          />
        )}

        {screen.type === 'list' && localProfile && currentPack && (
          <ScenarioList
            profile={localProfile}
            packId={currentPack.id}
            scenarios={currentScenarios}
            onSelect={(id) => selectScenario(id, currentPack.id)}
            onManager={handleManagerView}
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

        {screen.type === 'manager-pin' && (
          <ManagerPinEntry
            correctPin={user && profile ? managerPin : localProfile?.pin || ''}
            onSubmit={user && profile ? handleManagerPinSubmitFromCompany : handleManagerPinSubmit}
            onBack={() => {
              if (user && profile) {
                setScreen({ type: 'company-landing' });
              } else {
                setScreen({ type: 'practice-selector' });
              }
            }}
          />
        )}

        {screen.type === 'manager-dashboard' && (managerStaffId || managerOrgId) && (
          <ManagerDashboard
            managerId={managerStaffId || ''}
            managerName={localProfile ? `${localProfile.firstName} ${localProfile.lastName}` : 'Manager'}
            organizationId={managerOrgId}
            organizationName={organizationName}
            userId={user?.id}
            onBack={() => {
              setManagerStaffId(null);
              setManagerOrgId(null);
              if (user && profile) {
                setScreen({ type: 'company-landing' });
              } else {
                setScreen({ type: 'practice-selector' });
              }
            }}
          />
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
