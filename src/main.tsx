import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './ui/App';
import { prepareAll } from './engine/pool';
import { applyTheme, settings } from './game/settings';
import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/home.css';
import './ui/styles/game.css';

applyTheme(settings.get().theme);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(settings.get().theme));

registerSW({ immediate: true });

render(<App />, document.getElementById('app')!);

// Fill the ready-puzzle slots once the first screen is up.
setTimeout(() => void prepareAll(), 500);
