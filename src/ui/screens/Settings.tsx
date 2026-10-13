import { settings, updateSettings, type Language, type Theme } from '../../game/settings';
import { useStore } from '../../game/store';
import { useT } from '../../i18n';
import { IconBack } from '../icons';
import { pop } from '../nav';

function Segmented<T extends string>(props: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div class="segmented" role="group" aria-label={props.label}>
      {props.options.map(([v, label]) => (
        <button key={v} aria-pressed={props.value === v} onClick={() => props.onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}

export function SettingsScreen() {
  const t = useT();
  const s = useStore(settings);
  return (
    <main class="screen settings">
      <div class="topbar">
        <button class="icon-btn" aria-label={t.back} onClick={pop}>
          <IconBack />
        </button>
        <h1>{t.settings}</h1>
      </div>

      <div class="section-title">{t.appearance}</div>
      <div class="list">
        <div class="list-row">
          <span>{t.theme}</span>
          <Segmented<Theme>
            label={t.theme}
            value={s.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              ['system', t.themeSystem],
              ['light', t.themeLight],
              ['dark', t.themeDark],
            ]}
          />
        </div>
        <div class="list-row">
          <span>{t.language}</span>
          <Segmented<Language>
            label={t.language}
            value={s.language}
            onChange={(language) => updateSettings({ language })}
            options={[
              ['auto', t.languageAuto],
              ['en', 'English'],
              ['es', 'Español'],
            ]}
          />
        </div>
      </div>

      <p class="version" data-testid="version">
        {__APP_VERSION__}
      </p>
    </main>
  );
}
