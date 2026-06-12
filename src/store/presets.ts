import { create } from 'zustand';
import {
  listPresets,
  insertPreset,
  updatePreset as repoUpdate,
  deletePreset as repoDelete,
  bulkUpsertPresets,
} from '../db/repo';
import { FREE_WIDGET_SLOTS, type Preset } from '../domain/types';
import { uuid } from '../domain/uuid';
import { useProStore } from './pro';

export interface PresetInput {
  icon: string;
  color: string;
  durationSec: number;
  inWidget: boolean;
}

interface PresetsState {
  presets: Preset[];
  load: () => void;
  create: (input: PresetInput) => Preset | null;
  update: (id: string, patch: Partial<PresetInput>) => void;
  remove: (id: string) => void;
  /** ドラッグ結果を適用。Pro でない場合に widget 枠超過なら false を返し、変更しない。 */
  applyArrangement: (hiddenIds: string[], widgetIds: string[]) => boolean;
}

function sorted(items: Preset[]): Preset[] {
  return [...items].sort((a, b) => {
    if (a.inWidget !== b.inWidget) return a.inWidget ? 1 : -1;
    return a.sortOrder - b.sortOrder;
  });
}

function nextSortOrder(items: Preset[], inWidget: boolean): number {
  const inArea = items.filter((p) => p.inWidget === inWidget);
  return inArea.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;
}

export const usePresetsStore = create<PresetsState>((set, get) => ({
  presets: [],

  load: () => {
    set({ presets: sorted(listPresets()) });
  },

  create: (input) => {
    const items = get().presets;
    if (input.inWidget) {
      const isPro = useProStore.getState().isPro;
      const widgetCount = items.filter((p) => p.inWidget).length;
      if (!isPro && widgetCount >= FREE_WIDGET_SLOTS) {
        return null;
      }
    }
    const preset: Preset = {
      id: uuid(),
      icon: input.icon,
      color: input.color,
      durationSec: input.durationSec,
      inWidget: input.inWidget,
      sortOrder: nextSortOrder(items, input.inWidget),
    };
    insertPreset(preset);
    set({ presets: sorted([...items, preset]) });
    return preset;
  },

  update: (id, patch) => {
    repoUpdate(id, patch);
    set({
      presets: sorted(
        get().presets.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      ),
    });
  },

  remove: (id) => {
    repoDelete(id);
    set({ presets: get().presets.filter((p) => p.id !== id) });
  },

  applyArrangement: (hiddenIds, widgetIds) => {
    const isPro = useProStore.getState().isPro;
    if (!isPro && widgetIds.length > FREE_WIDGET_SLOTS) {
      return false;
    }
    const byId = new Map(get().presets.map((p) => [p.id, p]));
    const next: Preset[] = [];
    hiddenIds.forEach((id, i) => {
      const p = byId.get(id);
      if (p) next.push({ ...p, inWidget: false, sortOrder: i });
    });
    widgetIds.forEach((id, i) => {
      const p = byId.get(id);
      if (p) next.push({ ...p, inWidget: true, sortOrder: i });
    });
    bulkUpsertPresets(next);
    set({ presets: sorted(next) });
    return true;
  },
}));

export function selectHidden(presets: Preset[]): Preset[] {
  return presets.filter((p) => !p.inWidget).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function selectWidget(presets: Preset[]): Preset[] {
  return presets.filter((p) => p.inWidget).sort((a, b) => a.sortOrder - b.sortOrder);
}
