import { useState } from 'preact/hooks';
import { DIFFICULTIES, type Difficulty } from '../../engine/generator';
import { formatTime } from '../../game/format';
import { averageMs, resetStats, stats } from '../../game/stats';
import { useStore } from '../../game/store';
import { useT } from '../../i18n';
import { Dialog } from '../Dialog';
import { IconBack } from '../icons';
import { pop } from '../nav';

export function StatsScreen() {
  const t = useT();
  const all = useStore(stats);
  const [tab, setTab] = useState<Difficulty>('easy');
  const [confirm, setConfirm] = useState(false);
  const s = all[tab];
  const avg = averageMs(s);
  const rows: [string, string][] = [
    [t.played, String(s.played)],
    [t.won, String(s.won)],
    [t.bestTime, s.bestMs == null ? '–' : formatTime(s.bestMs)],
    [t.avgTime, avg == null ? '–' : formatTime(avg)],
    [t.streak, String(s.streak)],
    [t.hintsUsed, String(s.hintsUsed)],
  ];
  return (
    <main class="screen stats">
      <div class="topbar">
        <button class="icon-btn" aria-label={t.back} onClick={pop}>
          <IconBack />
        </button>
        <h1>{t.stats}</h1>
      </div>
      <div class="segmented tabs" role="group" aria-label={t.stats}>
        {DIFFICULTIES.map((d) => (
          <button key={d} aria-pressed={tab === d} onClick={() => setTab(d)}>
            {t.difficulty[d]}
          </button>
        ))}
      </div>
      <div class="stat-grid" key={tab}>
        {rows.map(([label, value]) => (
          <div class="stat" key={label}>
            <span class="stat-value">{value}</span>
            <span class="stat-label">{label}</span>
          </div>
        ))}
      </div>
      <button class="btn reset" onClick={() => setConfirm(true)}>
        {t.resetStats}
      </button>
      {confirm && (
        <Dialog
          title={t.resetConfirmTitle}
          onClose={() => setConfirm(false)}
          actions={[
            {
              label: t.reset,
              danger: true,
              onClick: () => {
                resetStats();
                setConfirm(false);
              },
            },
            { label: t.cancel, onClick: () => setConfirm(false) },
          ]}
        >
          <p>{t.resetConfirmBody}</p>
        </Dialog>
      )}
    </main>
  );
}
