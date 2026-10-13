import { useEffect } from 'preact/hooks';
import { formatTime } from '../../game/format';
import { errorCells, remaining } from '../../game/game';
import { addTime, enterDigit, eraseSelected, select, session, setPaused, toggleMode, undoLast } from '../../game/session';
import { settings } from '../../game/settings';
import { useStore } from '../../game/store';
import { useT } from '../../i18n';
import { Board } from '../Board';
import { IconBack, IconErase, IconPause, IconPencil, IconSettings, IconUndo } from '../icons';
import { pop, push, reset } from '../nav';

/**
 * Counts play time only while this screen is mounted (no other screen over the board),
 * the page is visible and the game is not paused.
 */
function useClock() {
  useEffect(() => {
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      const s = session.get();
      if (document.visibilityState === 'visible' && !s.paused && s.game && !s.game.completed) addTime(dt);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') tick();
      else last = performance.now();
    };
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      tick();
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}

export function GameScreen() {
  const t = useT();
  const { game, selected, mode, paused } = useStore(session);
  const { errorMode, showTimer } = useStore(settings);
  useClock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = session.get();
      if (s.paused) return;
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
        {showTimer && (
          <span class="timer" data-testid="timer">
            {formatTime(game.elapsedMs)}
          </span>
        )}
        <button class="icon-btn" aria-label={t.pause} onClick={() => setPaused(true)} disabled={game.completed}>
          <IconPause />
        </button>
        <button class="icon-btn" aria-label={t.settings} onClick={() => push({ name: 'settings' })}>
          <IconSettings />
        </button>
      </div>

      <div class={`play${paused ? ' is-paused' : ''}`}>
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

      {paused && (
        <div class="scrim">
          <div class="dialog pause" role="dialog" aria-modal="true" aria-label={t.paused}>
            <h2>{t.paused}</h2>
            <p class="pause-time">{formatTime(game.elapsedMs)}</p>
            <div class="dialog-actions">
              <button class="btn primary" onClick={() => setPaused(false)}>
                {t.resume}
              </button>
              <button
                class="btn"
                onClick={() => {
                  setPaused(false);
                  reset({ name: 'home' });
                }}
              >
                {t.home}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
