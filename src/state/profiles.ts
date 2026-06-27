import type { UserProfile, Department } from '../content/types';
import { supabase } from '../lib/supabase';

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
  console.log('[PROFILE] loginOrCreateProfile called:', { firstName, lastName, pin, department });
  const profiles = loadProfiles();
  console.log('[PROFILE] Loaded profiles:', profiles);
  const fNorm = firstName.trim().toLowerCase();
  const lNorm = lastName.trim().toLowerCase();
  console.log('[PROFILE] Looking for:', { fNorm, lNorm });

  let profile = profiles.find((p) => p.firstName.toLowerCase() === fNorm && p.lastName.toLowerCase() === lNorm);
  console.log('[PROFILE] Found existing profile:', profile);

  if (profile) {
    // Existing profile — PIN must match
    console.log('[PROFILE] Checking PIN:', { stored: profile.pin, provided: pin, match: profile.pin === pin });
    if (profile.pin !== pin) {
      console.log('[PROFILE] PIN mismatch, returning null');
      return null;
    }
  } else {
    // New profile
    console.log('[PROFILE] Creating new profile');
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
    console.log('[PROFILE] New profile created:', profile);
    profiles.push(profile);
  }
  console.log('[PROFILE] Saving profiles...');
  saveProfiles(profiles);
  console.log('[PROFILE] Returning profile:', profile);
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

  // Sync to Supabase
  syncAttemptToSupabase(firstName, lastName, scenarioId, score, seconds, usedCards, recordingId);
}

async function syncAttemptToSupabase(
  firstName: string,
  lastName: string,
  scenarioId: string,
  score: number,
  seconds: number,
  usedCards: boolean,
  recordingId?: string
) {
  try {
    console.log('[SYNC] Starting attempt sync for:', `${firstName} ${lastName}`, 'Scenario:', scenarioId, 'Score:', score);

    // Look up staff member by name to get their ID (case-insensitive)
    console.log('[SYNC] Looking up staff member:', `${firstName} ${lastName}`);
    const { data: staffMember, error: lookupError } = await supabase
      .from('staff_members')
      .select('id')
      .ilike('name', `${firstName} ${lastName}`)
      .single();

    console.log('[SYNC] Lookup result:', { data: staffMember, error: lookupError });

    if (lookupError) {
      console.error('[SYNC] Lookup error details:', {
        message: lookupError.message,
        code: lookupError.code,
        details: lookupError.details,
        hint: lookupError.hint,
      });
      return;
    }

    if (!staffMember) {
      console.warn('[SYNC] Staff member not found (no error but no data)');
      return;
    }

    console.log('[SYNC] Found staff member with ID:', staffMember.id);

    // Insert session record
    console.log('[SYNC] Inserting session record...');
    const { data: insertedData, error: insertError } = await supabase
      .from('sessions')
      .insert({
        staff_id: staffMember.id,
        scenario_id: scenarioId,
        score,
        duration_seconds: seconds,
        used_cards: usedCards,
        recording_id: recordingId,
        created_at: new Date().toISOString(),
      })
      .select();

    console.log('[SYNC] Insert result:', { data: insertedData, error: insertError });

    if (insertError) {
      console.error('[SYNC] Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
    } else {
      console.log('[SYNC] ✅ Successfully synced training attempt to Supabase', insertedData);
    }
  } catch (error) {
    console.error('[SYNC] Exception in syncAttemptToSupabase:', error);
  }
}

export function deleteProfile(firstName: string, lastName: string) {
  const profiles = loadProfiles();
  const fNorm = firstName.trim().toLowerCase();
  const lNorm = lastName.trim().toLowerCase();
  const filtered = profiles.filter((p) => !(p.firstName.toLowerCase() === fNorm && p.lastName.toLowerCase() === lNorm));
  saveProfiles(filtered);
}

export function updatePin(firstName: string, lastName: string, newPin: string): boolean {
  const profiles = loadProfiles();
  const fNorm = firstName.trim().toLowerCase();
  const lNorm = lastName.trim().toLowerCase();
  const profile = profiles.find((p) => p.firstName.toLowerCase() === fNorm && p.lastName.toLowerCase() === lNorm);

  if (!profile) return false;

  profile.pin = newPin;
  saveProfiles(profiles);
  return true;
}
