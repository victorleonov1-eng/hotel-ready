import type { ScenarioPack } from './types';
import frontdesk from './packs/frontdesk.json';
import fbservice from './packs/fbservice.json';
import housekeeping from './packs/housekeeping.json';
import roomservice from './packs/roomservice.json';
import concierge from './packs/concierge.json';

const packs: ScenarioPack[] = [
  frontdesk as ScenarioPack,
  fbservice as ScenarioPack,
  housekeeping as ScenarioPack,
  roomservice as ScenarioPack,
  concierge as ScenarioPack,
];

export function getAllPacks(): ScenarioPack[] {
  return packs;
}

export function getPack(id: string): ScenarioPack | null {
  return packs.find((p) => p.id === id) || null;
}

export function getAllScenarios() {
  return packs.flatMap((p) => p.scenarios);
}

export function getScenario(id: string) {
  return getAllScenarios().find((s) => s.id === id);
}

export function getScenariosByPack(packId: string) {
  const pack = getPack(packId);
  return pack ? pack.scenarios : [];
}
