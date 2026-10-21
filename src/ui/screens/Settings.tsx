import type { ErrorMode } from '../../game/game';
import { ACCENTS, settings, updateSettings, type Language, type Theme } from '../../game/settings';
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

export function Toggle(props: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button class="switch" role="switch" aria-checked={props.checked} aria-label={props.label} onClick={() => props.onChange(!props.checked)} />;
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
          <span>{t.accent}</span>
          <div class="swatches" role="radiogroup" aria-label={t.accent}>
            {ACCENTS.map((a) => (
              <button
                key={a}
                class="swatch"
                data-swatch={a}
                role="radio"
                aria-checked={s.accent === a}
                aria-label={t.accents[a]}
                title={t.accents[a]}
                onClick={() => updateSettings({ accent: a })}
              />
            ))}
          </div>
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

      <div class="section-title">{t.game}</div>
      <div class="list">
        <div class="list-row stack">
          <span>
            {t.errors}
            <span class="hint">{t.errorsHint}</span>
          </span>
          <Segmented<ErrorMode>
            label={t.errors}
            value={s.errorMode}
            onChange={(errorMode) => updateSettings({ errorMode })}
            options={[
              ['immediate', t.errorsImmediate],
              ['conflicts', t.errorsConflicts],
              ['off', t.errorsOff],
            ]}
          />
        </div>
        <div class="list-row">
          <span>{t.showTimer}</span>
          <Toggle label={t.showTimer} checked={s.showTimer} onChange={(showTimer) => updateSettings({ showTimer })} />
        </div>
        <div class="list-row">
          <span>{t.showMistakes}</span>
          <Toggle label={t.showMistakes} checked={s.showMistakes} onChange={(showMistakes) => updateSettings({ showMistakes })} />
        </div>
        <div class="list-row">
          <span>
            {t.vibrate}
            <span class="hint">{t.vibrateHint}</span>
          </span>
          <Toggle label={t.vibrate} checked={s.vibrate} onChange={(vibrate) => updateSettings({ vibrate })} />
        </div>
      </div>

      <div class="section-title">{t.assists}</div>
      <div class="list">
        <div class="list-row">
          <span>
            {t.hintsSetting}
            <span class="hint">{t.hintsHint}</span>
          </span>
          <Toggle label={t.hintsSetting} checked={s.hints} onChange={(hints) => updateSettings({ hints })} />
        </div>
        <div class="list-row">
          <span>
            {t.autoNotesSetting}
            <span class="hint">{t.autoNotesHint}</span>
          </span>
          <Toggle label={t.autoNotesSetting} checked={s.autoNotes} onChange={(autoNotes) => updateSettings({ autoNotes })} />
        </div>
      </div>

      <p class="version" data-testid="version">
        {__APP_VERSION__}
      </p>
    </main>
  );
}
