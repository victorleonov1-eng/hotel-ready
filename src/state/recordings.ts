import type { Recording } from '../content/types';

const STORAGE_KEY = 'hotelready.recordings';
const MAX_RECORDINGS = 50; // Limit to prevent localStorage overflow
const MAX_STORAGE_MB = 5; // ~5MB limit per recording

function getStorageSize(str: string): number {
  return new Blob([str]).size / (1024 * 1024); // MB
}

export function loadRecordings(): Recording[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecordings(recordings: Recording[]) {
  // Keep only the most recent recordings to prevent overflow
  const sorted = recordings.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  const trimmed = sorted.slice(0, MAX_RECORDINGS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function saveRecording(recording: Recording): boolean {
  const recordings = loadRecordings();

  // Check if recording already exists and remove it
  const filtered = recordings.filter((r) => r.attemptId !== recording.attemptId);

  // Check size before adding
  const recordingStr = JSON.stringify(recording);
  if (getStorageSize(recordingStr) > MAX_STORAGE_MB) {
    console.warn(`Recording too large (${getStorageSize(recordingStr).toFixed(2)}MB), skipping audio`);
    // Save without audio data
    recording.audioData = undefined;
  }

  filtered.push(recording);
  saveRecordings(filtered);
  return true;
}

export function getRecording(attemptId: string): Recording | null {
  const recordings = loadRecordings();
  return recordings.find((r) => r.attemptId === attemptId) || null;
}

export function deleteRecording(attemptId: string) {
  const recordings = loadRecordings();
  const filtered = recordings.filter((r) => r.attemptId !== attemptId);
  saveRecordings(filtered);
}
