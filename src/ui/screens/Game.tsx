import { useEffect } from 'preact/hooks';
import { errorCells, remaining } from '../../game/game';
import { enterDigit, eraseSelected, select, session, toggleMode, undoLast } from '../../game/session';
import { settings } from '../../game/settings';
import { useStore } from '../../game/store';
import { useT } from '../../i18n';
import { Board } from '../Board';
import { IconBack, IconErase, IconPencil, IconUndo } from '../icons';
import { pop } from '../nav';

export function GameScreen() {
  const t = useT();
  const { game, selected, mode } = useStore(session);
  const { errorMode } = useStore(settings);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = session.get();
      if (e.key >= '1' && e.key <= '9') enterDigit(+e.key);
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') eraseSelected();
      else if (e.key === 'n' || e.key === 'p') toggleMode();
      else if ((e.key === 'z' && (e.ctrlKey || e.metaKey)) || e.key === 'u') undoLast();
      else if (e.key.startsWith('Arrow')) {
        const i = s.selected ?? 40;
        const r = Math.floor(i / 9);
        const c = i % 9;
        const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key] ?? [0, 0];
        select(((r + dr + 9) % 9) * 9 + ((c + dc + 9) % 9));
        e.preventDefault();
      } else return;
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  if (!game) return null;
  const left = remaining(game);
  const errors = errorCells(game, errorMode);

  return (
    <main class="screen game">
      <div class="topbar">
        <button class="icon-btn" aria-label={t.back} onClick={pop}>
          <IconBack />
        </button>
        <h1>{t.difficulty[game.difficulty]}</h1>
      </div>

      <div class="play">
        <Board game={game} selected={selected} errors={errors} onSelect={select} />

        <div class="controls">
          <div class="toolbar">
            <button class="tool" onClick={undoLast} disabled={!game.history.length || game.completed}>
              <IconUndo />
              <span>{t.undo}</span>
            </button>
            <button class="tool" onClick={eraseSelected} disabled={game.completed}>
              <IconErase />
              <span>{t.erase}</span>
            </button>
            <button class="tool" aria-pressed={mode === 'pencil'} onClick={toggleMode} disabled={game.completed}>
              <IconPencil />
              <span>{t.pencil}</span>
              <em class="badge">{mode === 'pencil' ? t.on : t.off}</em>
            </button>
          </div>

          <div class="numpad" data-mode={mode}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button key={d} class={left[d] <= 0 ? 'done' : ''} onClick={() => enterDigit(d)} disabled={game.completed} aria-label={`${d}`}>
                <span class="digit">{d}</span>
                <span class="left">{Math.max(left[d], 0)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {game.completed && <p class="solved">{t.solved}</p>}
    </main>
  );
}
