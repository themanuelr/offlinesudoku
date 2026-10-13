import { useT } from '../../i18n';
import { IconSettings } from '../icons';
import { push } from '../nav';

export function Home() {
  const t = useT();
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
        <button class="btn primary" disabled>
          {t.newGame}
        </button>
        <p class="muted">{t.comingSoon}</p>
      </div>
    </main>
  );
}
