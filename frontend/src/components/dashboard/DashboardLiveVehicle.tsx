import { useI18n } from '../../context/I18nContext';
import { useTelemetryDataStore } from '../../store/useTelemetryDataStore';
import { useSessionStatusStore } from '../../store/useSessionStatusStore';
import { useUnits } from '../../hooks/useUnits';
import styles from './PracticeDashboard.module.css';

export const DashboardLiveVehicle = () => {
  const { t } = useI18n();
  const connected = useSessionStatusStore(s => s.connected);
  const car = useTelemetryDataStore(s => s.allCarStatus[s.playerCarIndex]);
  const telemetry = useTelemetryDataStore(s => s.allTelemetry[s.playerCarIndex]);
  const units = useUnits();
  if (!connected) return null;
  return <div className={styles.liveVehicle}><span>{t('workspace.liveVehicle')}</span><dl className={styles.statusList}>
    <div><dt>{t('workspace.speed')}</dt><dd>{units.speed(telemetry?.Speed,0,'—')}</dd></div>
    <div><dt>{t('workspace.fuelInTank')}</dt><dd>{car ? `${car.FuelInTank.toFixed(1)} kg` : '—'}</dd></div>
    <div><dt>{t('workspace.tyreAge')}</dt><dd>{car ? `${car.TyresAgeLaps} laps` : '—'}</dd></div>
  </dl></div>;
};
