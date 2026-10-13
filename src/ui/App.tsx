import { useStore } from '../game/store';
import { nav } from './nav';
import { Home } from './screens/Home';
import { SettingsScreen } from './screens/Settings';

export function App() {
  const stack = useStore(nav);
  const top = stack[stack.length - 1];
  switch (top.name) {
    case 'settings':
      return <SettingsScreen />;
    default:
      return <Home />;
  }
}
