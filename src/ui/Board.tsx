import { useEffect, useRef, useState } from 'preact/hooks';
import { BOX, COL, ROW, UNITS, bit } from '../engine/grid';
import { completedUnits, type Game } from '../game/game';

interface Props {
  game: Game;
  selected: number | null;
  errors: Set<number>;
  onSelect: (i: number) => void;
}

export function Board({ game, selected, errors, onSelect }: Props) {
  const selValue = selected != null ? game.values[selected] : 0;

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
    <div class="board" role="grid" aria-label="Sudoku">
      {game.values.map((v, i) => {
        const related = selected != null && (ROW[i] === ROW[selected] || COL[i] === COL[selected] || BOX[i] === BOX[selected]);
        const cls = [
          'cell',
          game.givens[i] ? 'given' : v ? 'entered' : '',
          i === selected ? 'selected' : related ? 'related' : '',
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
            onPointerDown={() => onSelect(i)}
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
