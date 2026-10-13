import { BOX, COL, ROW, bit } from '../engine/grid';
import type { Game } from '../game/game';

interface Props {
  game: Game;
  selected: number | null;
  errors: Set<number>;
  onSelect: (i: number) => void;
}

export function Board({ game, selected, errors, onSelect }: Props) {
  const selValue = selected != null ? game.values[selected] : 0;
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
          COL[i] % 3 === 2 && COL[i] !== 8 ? 'edge-r' : '',
          ROW[i] % 3 === 2 && ROW[i] !== 8 ? 'edge-b' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button key={i} class={cls} role="gridcell" data-cell={i} aria-label={`R${ROW[i] + 1}C${COL[i] + 1}${v ? ` ${v}` : ''}`} onPointerDown={() => onSelect(i)}>
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
