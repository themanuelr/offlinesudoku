import { createStore } from '../game/store';

export type Screen = { name: 'home' } | { name: 'settings' } | { name: 'game' } | { name: 'stats' };

/** A tiny stack-based navigator. Overlay screens push on top of the current one. */
export const nav = createStore<Screen[]>([{ name: 'home' }]);

export const push = (s: Screen) => nav.set((st) => [...st, s]);
export const pop = () => nav.set((st) => (st.length > 1 ? st.slice(0, -1) : st));
export const reset = (s: Screen) => nav.set([s]);
