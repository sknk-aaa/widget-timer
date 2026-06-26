import { create } from 'zustand';
import {
  listBoards,
  insertBoard,
  updateBoard as repoUpdateBoard,
  deleteBoard as repoDeleteBoard,
  listBoardPresets,
  setBoardPresets,
} from '../db/repo';
import { FREE_BOARDS, FREE_PRESETS_PER_BOARD, type Board } from '../domain/types';
import { uuid } from '../domain/uuid';
import { useProStore } from './pro';

type Membership = Record<string, string[]>;

interface BoardsState {
  boards: Board[];
  /** boardId -> 所属プリセットIDの順序つき配列。 */
  membership: Membership;
  currentBoardId: string | null;
  load: () => void;
  setCurrent: (id: string) => void;
  /** 新規ボード作成。無料上限を超える場合は null（呼び出し側でペイウォール）。 */
  createBoard: () => Board | null;
  renameBoard: (id: string, name: string) => void;
  removeBoard: (id: string) => void;
  /** ボードの所属プリセットを順序つきで置き換える（並べ替え/追加/削除の共通経路）。無料上限超過なら false。 */
  setBoardOrder: (boardId: string, presetIds: string[]) => boolean;
  /** マスターから現在のボードへ追加。重複は無視。無料上限超過なら false。 */
  addToBoard: (boardId: string, presetId: string) => boolean;
  removeFromBoard: (boardId: string, presetId: string) => void;
}

function buildMembership(): Membership {
  const m: Membership = {};
  for (const row of listBoardPresets()) {
    (m[row.boardId] ??= []).push(row.presetId);
  }
  return m;
}

function nextOrder(boards: Board[]): number {
  return boards.reduce((max, b) => Math.max(max, b.sortOrder), -1) + 1;
}

export const useBoardsStore = create<BoardsState>((set, get) => ({
  boards: [],
  membership: {},
  currentBoardId: null,

  load: () => {
    const boards = listBoards();
    const membership = buildMembership();
    const prev = get().currentBoardId;
    const currentBoardId =
      prev && boards.some((b) => b.id === prev) ? prev : (boards[0]?.id ?? null);
    set({ boards, membership, currentBoardId });
  },

  setCurrent: (id) => set({ currentBoardId: id }),

  createBoard: () => {
    const boards = get().boards;
    const isPro = useProStore.getState().isPro;
    if (!isPro && boards.length >= FREE_BOARDS) return null;
    const board: Board = { id: uuid(), name: '', sortOrder: nextOrder(boards) };
    insertBoard(board);
    set({ boards: [...boards, board], currentBoardId: board.id });
    return board;
  },

  renameBoard: (id, name) => {
    repoUpdateBoard(id, { name });
    set({ boards: get().boards.map((b) => (b.id === id ? { ...b, name } : b)) });
  },

  removeBoard: (id) => {
    const boards = get().boards;
    if (boards.length <= 1) return; // 最低1欄は残す
    repoDeleteBoard(id);
    const next = boards.filter((b) => b.id !== id);
    const membership = { ...get().membership };
    delete membership[id];
    const currentBoardId = get().currentBoardId === id ? (next[0]?.id ?? null) : get().currentBoardId;
    set({ boards: next, membership, currentBoardId });
  },

  setBoardOrder: (boardId, presetIds) => {
    const isPro = useProStore.getState().isPro;
    const unique = [...new Set(presetIds)];
    if (!isPro && unique.length > FREE_PRESETS_PER_BOARD) return false;
    setBoardPresets(boardId, unique);
    set({ membership: { ...get().membership, [boardId]: unique } });
    return true;
  },

  addToBoard: (boardId, presetId) => {
    const current = get().membership[boardId] ?? [];
    if (current.includes(presetId)) return true;
    return get().setBoardOrder(boardId, [...current, presetId]);
  },

  removeFromBoard: (boardId, presetId) => {
    const current = get().membership[boardId] ?? [];
    get().setBoardOrder(boardId, current.filter((id) => id !== presetId));
  },
}));

/** 表示用のボード名（未設定なら「枠N」）。 */
export function boardLabel(board: Board, index: number, fallback: (n: number) => string): string {
  return board.name.trim().length > 0 ? board.name.trim() : fallback(index + 1);
}
