import { useState } from 'preact/hooks';
import { DIFFICULTIES, type Difficulty } from '../../engine/generator';
import { formatTime } from '../../game/format';
import { inProgress, session, startGame } from '../../game/session';
import { useStore } from '../../game/store';
import { useT } from '../../i18n';
import { Dialog } from '../Dialog';
import { IconSettings, IconStats } from '../icons';
import { push } from '../nav';

export function Home() {
  const t = useT();
  useStore(session);
  const saved = inProgress();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Difficulty | null>(null);

  const start = async (d: Difficulty) => {
    setConfirm(null);
    if (busy) return;
    setBusy(true);
    await startGame(d);
    setBusy(false);
    push({ name: 'game' });
  };

  return (
    <main class="screen home">
      <div class="topbar">
        <h1>{t.appName}</h1>
        <button class="icon-btn" aria-label={t.stats} onClick={() => push({ name: 'stats' })}>
          <IconStats />
        </button>
        <button class="icon-btn" aria-label={t.settings} onClick={() => push({ name: 'settings' })}>
          <IconSettings />
        </button>
      </div>
      <div class="home-body">
        <div class="logo" aria-hidden="true">
          {[...Array(9)].map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 40}ms` }} />
          ))}
        </div>
        {saved && (
          <button class="btn primary continue" onClick={() => push({ name: 'game' })}>
            {t.continue}
            <span>
              {t.difficulty[saved.difficulty]} · {formatTime(saved.elapsedMs)}
            </span>
          </button>
        )}
        <p class="muted">{saved ? t.orNewGame : t.chooseDifficulty}</p>
        <div class="difficulties">
          {DIFFICULTIES.map((d) => (
            <button key={d} class="btn" onClick={() => (saved ? setConfirm(d) : start(d))} disabled={busy}>
              {t.difficulty[d]}
            </button>
          ))}
        </div>
      </div>
      {confirm && (
        <Dialog
          title={t.newGameConfirmTitle}
          onClose={() => setConfirm(null)}
          actions={[
            { label: t.newGameConfirm, onClick: () => start(confirm), primary: true },
            { label: t.cancel, onClick: () => setConfirm(null) },
          ]}
        >
          <p>{t.newGameConfirmBody}</p>
        </Dialog>
      )}
    </main>
  );
}
