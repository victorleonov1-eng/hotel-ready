import type { UserProfile, Department } from '../content/types';

const STORAGE_KEY = 'hotelready.profiles';

export function loadProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: UserProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function findProfile(firstName: string, lastName: string): UserProfile | null {
  const profiles = loadProfiles();
  const fNorm = firstName.trim().toLowerCase();
  const lNorm = lastName.trim().toLowerCase();
  return profiles.find((p) => p.firstName.toLowerCase() === fNorm && p.lastName.toLowerCase() === lNorm) || null;
}

export function loginOrCreateProfile(
  firstName: string,
  lastName: string,
  pin: string,
  position: string,
  department: Department
): UserProfile | null {
  const profiles = loadProfiles();
  const fNorm = firstName.trim().toLowerCase();
  const lNorm = lastName.trim().toLowerCase();

  let profile = profiles.find((p) => p.firstName.toLowerCase() === fNorm && p.lastName.toLowerCase() === lNorm);

  if (profile) {
    // Existing profile — PIN must match
    if (profile.pin !== pin) return null;
  } else {
    // New profile
    profile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      pin,
      position: position.trim(),
      department,
      attempts: [],
      bestByScenario: {},
      bestTimeByScenario: {},
    };
    profiles.push(profile);
  }
  saveProfiles(profiles);
  return profile;
}

export function recordAttempt(
  firstName: string,
  lastName: string,
  scenarioId: string,
  score: number,
  seconds: number,
  usedCards: boolean,
  recordingId?: string
) {
  const profiles = loadProfiles();
  const fNorm = firstName.trim().toLowerCase();
  const lNorm = lastName.trim().toLowerCase();
  const profile = profiles.find((p) => p.firstName.toLowerCase() === fNorm && p.lastName.toLowerCase() === lNorm);
  if (!profile) return;

  profile.attempts.push({
    scenarioId,
    score,
    seconds,
    usedCards,
    at: new Date().toISOString(),
    recordingId,
  });

  const prevScore = profile.bestByScenario[scenarioId] ?? 0;
  if (score > prevScore) profile.bestByScenario[scenarioId] = score;

  const prevTime = profile.bestTimeByScenario[scenarioId];
  if (!prevTime || seconds < prevTime) profile.bestTimeByScenario[scenarioId] = seconds;

  saveProfiles(profiles);
}

export function deleteProfile(firstName: string, lastName: string) {
  const profiles = loadProfiles();
  const fNorm = firstName.trim().toLowerCase();
  const lNorm = lastName.trim().toLowerCase();
  const filtered = profiles.filter((p) => !(p.firstName.toLowerCase() === fNorm && p.lastName.toLowerCase() === lNorm));
  saveProfiles(filtered);
}
