import { useState } from 'preact/hooks';
import { DIFFICULTIES, type Difficulty } from '../../engine/generator';
import { startGame } from '../../game/session';
import { useT } from '../../i18n';
import { IconSettings } from '../icons';
import { push } from '../nav';

export function Home() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const start = async (d: Difficulty) => {
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
        <p class="muted">{t.chooseDifficulty}</p>
        <div class="difficulties">
          {DIFFICULTIES.map((d) => (
            <button key={d} class="btn" onClick={() => start(d)} disabled={busy}>
              {t.difficulty[d]}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
