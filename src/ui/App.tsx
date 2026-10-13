import { useStore } from '../game/store';
import { nav } from './nav';
import { Home } from './screens/Home';
import { SettingsScreen } from './screens/Settings';
import { GameScreen } from './screens/Game';

export function App() {
  const stack = useStore(nav);
  const top = stack[stack.length - 1];
  switch (top.name) {
    case 'game':
      return <GameScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <Home />;
  }
}
