const MAX_HISTORY = 50;

export const createUndoMiddleware = (config) => (set, get, api) => {
  const past = [];
  const future = [];
  let isUndoRedoing = false;

  const wrappedSet = (updater, replace) => {
    const prevState = get();
    const prevArrangement = prevState.arrangement;

    set(updater, replace);

    if (isUndoRedoing) return;

    const nextState = get();
    const nextArrangement = nextState.arrangement;

    // Only record if arrangement reference changed
    if (nextArrangement !== prevArrangement) {
      past.push(prevArrangement);
      if (past.length > MAX_HISTORY) {
        past.shift();
      }
      future.length = 0;

      // Auto-increment version
      set({ _arrangementVersion: (nextState._arrangementVersion || 0) + 1 });
    }
  };

  const initialState = config(wrappedSet, get, api);

  return {
    ...initialState,
    _arrangementVersion: 0,

    undo: () => {
      if (past.length === 0) return;
      const state = get();
      future.push(state.arrangement);
      const prev = past.pop();
      isUndoRedoing = true;
      set({
        arrangement: prev,
        _arrangementVersion: (state._arrangementVersion || 0) + 1,
      });
      isUndoRedoing = false;
    },

    redo: () => {
      if (future.length === 0) return;
      const state = get();
      past.push(state.arrangement);
      const next = future.pop();
      isUndoRedoing = true;
      set({
        arrangement: next,
        _arrangementVersion: (state._arrangementVersion || 0) + 1,
      });
      isUndoRedoing = false;
    },

    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
};
