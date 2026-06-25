import type { ScenarioPack } from './types';
import frontdesk from './packs/frontdesk.json';

const packs: ScenarioPack[] = [frontdesk as ScenarioPack];

export function getAllPacks(): ScenarioPack[] {
  return packs;
}

export function getAllScenarios() {
  return packs.flatMap((p) => p.scenarios);
}

export function getScenario(id: string) {
  return getAllScenarios().find((s) => s.id === id);
}
