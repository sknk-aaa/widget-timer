import { create } from 'zustand';
import {
  listPresets,
  insertPreset,
  updatePreset as repoUpdate,
  deletePreset as repoDelete,
  bulkUpsertPresets,
} from '../db/repo';
import type { Preset } from '../domain/types';
import { uuid } from '../domain/uuid';

export interface PresetInput {
  name: string;
  icon: string;
  color: string;
  durationSec: number;
  sound: string;
}

interface PresetsState {
  presets: Preset[];
  load: () => void;
  create: (input: PresetInput) => Preset;
  update: (id: string, patch: Partial<PresetInput>) => void;
  remove: (id: string) => void;
  /** 「全てのプリセット」の並び順を更新（ドラッグ結果）。 */
  reorder: (orderedIds: string[]) => void;
}

function sorted(items: Preset[]): Preset[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export const usePresetsStore = create<PresetsState>((set, get) => ({
  presets: [],

  load: () => {
    set({ presets: sorted(listPresets()) });
  },

  create: (input) => {
    const items = get().presets;
    const sortOrder = items.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;
    const preset: Preset = {
      id: uuid(),
      name: input.name,
      icon: input.icon,
      color: input.color,
      durationSec: input.durationSec,
      inWidget: false,
      sortOrder,
      sound: input.sound,
    };
    insertPreset(preset);
    set({ presets: sorted([...items, preset]) });
    return preset;
  },

  update: (id, patch) => {
    repoUpdate(id, patch);
    set({
      presets: sorted(get().presets.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    });
  },

  remove: (id) => {
    repoDelete(id);
    set({ presets: get().presets.filter((p) => p.id !== id) });
  },

  reorder: (orderedIds) => {
    const byId = new Map(get().presets.map((p) => [p.id, p]));
    const next = orderedIds
      .map((id, i) => {
        const p = byId.get(id);
        return p ? { ...p, sortOrder: i } : null;
      })
      .filter((p): p is Preset => p !== null);
    bulkUpsertPresets(next);
    set({ presets: sorted(next) });
  },
}));
