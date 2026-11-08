import { useState } from 'react';
import { useRoute } from '../router/router';
import { LIVE_VIEW_MODES } from '../constants/f1';
import { RaceControlDashboard } from './RaceControlDashboard';
import { PracticeDashboard } from './dashboard/PracticeDashboard';
import { Button } from './ui/Button';
import styles from './dashboard/PracticeDashboard.module.css';

export const Dashboard = () => {
  const route = useRoute();
  const [raceControl, setRaceControl] = useState(false);
  if (route.page === 'live' && route.mode !== LIVE_VIEW_MODES.DASHBOARD) return <RaceControlDashboard />;
  return <>
    <div className={styles.viewSwitch}>
      <Button size="sm" aria-pressed={!raceControl} onClick={() => setRaceControl(false)}>Dashboard</Button>
      <Button size="sm" aria-pressed={raceControl} onClick={() => setRaceControl(true)}>Race Control</Button>
    </div>
    {raceControl ? <RaceControlDashboard /> : <PracticeDashboard />}
  </>;
};
