import { useEffect, useRef, useState } from 'preact/hooks';
import { BOX, COL, ROW, UNITS, bit } from '../engine/grid';
import { completedUnits, type Game } from '../game/game';
import { addMulti, clearMulti, removeMulti, startMulti } from '../game/session';

interface Props {
  game: Game;
  selected: number | null;
  multi: number[];
  /** Hold-and-drag selects several cells (setting on and Pencil on). */
  canMulti: boolean;
  errors: Set<number>;
  onSelect: (i: number) => void;
}

/** How long a cell must be held before a multi-selection starts. */
const HOLD_MS = 350;

/** The cell under a pointer, if any. */
function cellAt(e: PointerEvent): number | null {
  const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-cell]');
  return el ? Number(el.dataset.cell) : null;
}

interface Gesture {
  start: number;
  last: number;
  /** 'pending' until a hold or a drag turns the press into a multi-selection. */
  kind: 'pending' | 'multi';
  moved: boolean;
  /** The press began on an already picked cell: releasing without dragging unpicks it. */
  startPicked: boolean;
  timer?: ReturnType<typeof setTimeout>;
}

export function Board({ game, selected, multi, canMulti, errors, onSelect }: Props) {
  const selValue = selected != null ? game.values[selected] : 0;
  const picked = new Set(multi);

  const gesture = useRef<Gesture | null>(null);
  const end = () => {
    clearTimeout(gesture.current?.timer);
    gesture.current = null;
  };
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const g = gesture.current;
      const i = g && cellAt(e);
      if (!g || i == null || i === g.last) return;
      g.last = i;
      if (g.kind === 'pending') {
        clearTimeout(g.timer);
        g.kind = 'multi';
        startMulti(g.start);
      }
      g.moved = true;
      addMulti(i);
    };
    const onUp = () => {
      const g = gesture.current;
      if (g?.kind === 'multi' && !g.moved && g.startPicked) removeMulti(g.start);
      end();
    };
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', end);
    return () => {
      end();
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', end);
    };
  }, []);
  useEffect(() => {
    if (canMulti) return;
    end();
    clearMulti();
  }, [canMulti]);

  const press = (i: number) => {
    if (!canMulti) return onSelect(i);
    end();
    if (multi.length) {
      // Already picking: a tap toggles the cell, a drag adds more cells.
      gesture.current = { start: i, last: i, kind: 'multi', moved: false, startPicked: picked.has(i) };
      addMulti(i);
      return;
    }
    onSelect(i);
    const g: Gesture = { start: i, last: i, kind: 'pending', moved: false, startPicked: false };
    g.timer = setTimeout(() => {
      g.kind = 'multi';
      startMulti(i);
    }, HOLD_MS);
    gesture.current = g;
  };

  // Briefly flash rows, columns and boxes the moment they are completed.
  const [flash, setFlash] = useState<Map<number, number>>(new Map());
  const prevUnits = useRef<Set<number> | null>(null);
  useEffect(() => {
    const now = completedUnits(game, UNITS);
    const prev = prevUnits.current;
    prevUnits.current = now;
    if (!prev) return;
    const fresh = [...now].filter((u) => !prev.has(u));
    if (!fresh.length || fresh.length > 6) return;
    const origin = selected ?? 40;
    const cells = new Map<number, number>();
    for (const u of fresh)
      for (const c of UNITS[u]) {
        const dist = Math.abs(ROW[c] - ROW[origin]) + Math.abs(COL[c] - COL[origin]);
        cells.set(c, Math.min(cells.get(c) ?? 99, dist));
      }
    setFlash(cells);
    const id = setTimeout(() => setFlash(new Map()), 900);
    return () => clearTimeout(id);
  }, [game.values]);

  return (
    <div class={`board${canMulti ? ' can-multi' : ''}`} role="grid" aria-label="Sudoku" onContextMenu={(e) => canMulti && e.preventDefault()}>
      {game.values.map((v, i) => {
        const related = selected != null && (ROW[i] === ROW[selected] || COL[i] === COL[selected] || BOX[i] === BOX[selected]);
        const cls = [
          'cell',
          game.givens[i] ? 'given' : v ? 'entered' : '',
          i === selected || picked.has(i) ? 'selected' : related ? 'related' : '',
          selValue && v === selValue && i !== selected ? 'same' : '',
          errors.has(i) ? 'error' : '',
          flash.has(i) ? 'flash' : '',
          COL[i] % 3 === 2 && COL[i] !== 8 ? 'edge-r' : '',
          ROW[i] % 3 === 2 && ROW[i] !== 8 ? 'edge-b' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button key={i} class={cls} role="gridcell" data-cell={i} aria-label={`R${ROW[i] + 1}C${COL[i] + 1}${v ? ` ${v}` : ''}`}
            style={flash.has(i) ? { animationDelay: `${flash.get(i)! * 35}ms` } : undefined}
            onPointerDown={() => press(i)}
          >
            {v ? (
              <span class="value" key={v}>
                {v}
              </span>
            ) : game.notes[i] ? (
              <span class="notes">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                  <span key={d} class={selValue === d ? 'hl' : ''}>
                    {game.notes[i] & bit(d) ? d : ''}
                  </span>
                ))}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
