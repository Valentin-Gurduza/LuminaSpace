import type { RoomLayout } from '../types/room';

export interface LayoutHistory {
  past: RoomLayout[];
  present: RoomLayout;
  future: RoomLayout[];
  editStart: RoomLayout | null;
}

export type HistoryAction =
  | { type: 'update'; update: (layout: RoomLayout) => RoomLayout }
  | { type: 'replace'; layout: RoomLayout }
  | { type: 'begin' | 'commit' | 'undo' | 'redo' };

export function createHistory(layout: RoomLayout): LayoutHistory {
  return { past: [], present: layout, future: [], editStart: null };
}

function unchanged(a: RoomLayout, b: RoomLayout) {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

function commit(history: LayoutHistory): LayoutHistory {
  if (!history.editStart) return history;
  if (unchanged(history.editStart, history.present)) return { ...history, editStart: null };
  return { past: [...history.past, history.editStart].slice(-100), present: history.present, future: [], editStart: null };
}

export function historyReducer(history: LayoutHistory, action: HistoryAction): LayoutHistory {
  if (action.type === 'replace') return createHistory(action.layout);
  if (action.type === 'begin') return history.editStart ? history : { ...history, editStart: history.present };
  if (action.type === 'commit') return commit(history);
  if (action.type === 'update') {
    const present = action.update(history.present);
    if (unchanged(present, history.present)) return history;
    if (history.editStart) return { ...history, present };
    return { past: [...history.past, history.present].slice(-100), present, future: [], editStart: null };
  }
  const current = commit(history);
  if (action.type === 'undo' && current.past.length) {
    return { past: current.past.slice(0, -1), present: current.past.at(-1)!, future: [current.present, ...current.future], editStart: null };
  }
  if (action.type === 'redo' && current.future.length) {
    return { past: [...current.past, current.present].slice(-100), present: current.future[0], future: current.future.slice(1), editStart: null };
  }
  return current;
}
