import { useI18n } from '../../context/I18nContext';
import { useRoute } from '../../router/router';
import { useSessionListStore } from '../../store/useSessionListStore';
import { useSessionStatusStore } from '../../store/useSessionStatusStore';
import { useLiveStatus } from '../../hooks/useLiveStatus';
import { TRACK_NAMES, SESSION_TYPE_LABELS } from '../../constants/f1';
import styles from './WorkspaceSessionBar.module.css';

/** Recorded selection and current connection are labelled separately so they cannot be confused. */
export const WorkspaceSessionBar = () => {
  const { t } = useI18n();
  const route = useRoute();
  const sessions = useSessionListStore(s => s.sessions);
  const liveSession = useSessionStatusStore(s => s.session);
  const status = useLiveStatus();
  const recordedId = route.page === 'dashboard' || route.page === 'compare' ? route.sessionA : route.page === 'history' ? route.sessionId : undefined;
  const recorded = sessions.find(s => s.id === recordedId);
  const activeLive = route.page === 'live' && status === 'live' ? liveSession : null;
  const circuit = recorded?.track_name || (activeLive ? TRACK_NAMES[activeLive.TrackId] : null);
  const sessionType = recorded?.session_type || (activeLive ? SESSION_TYPE_LABELS[activeLive.SessionType] : null);
  return <div className={styles.bar} aria-label={t('workspace.sessionInformation')}>
    <div className={styles.identity}><span className={styles.label}>{recorded ? t('workspace.recordedSessionBadge') : activeLive ? t('workspace.liveSessionBadge') : t('workspace.workspaceBadge')}</span><strong>{circuit || t('workspace.noSessionSelected')}</strong></div>
    <div><span className={styles.label}>{t('workspace.sessionBadge')}</span><span>{sessionType || '—'}</span></div>
    <div><span className={styles.label}>{t('workspace.aiDifficultyBadge')}</span><span>{recorded && recorded.ai_difficulty > 0 ? recorded.ai_difficulty : '—'}</span></div>
    <div><span className={styles.label}>{t('workspace.assistsBadge')}</span><span title={t('workspace.assistsHelp')}>{t('workspace.notRecorded')}</span></div>
    <div className={styles.status}><i data-state={status} /><span>{status === 'live' ? t('workspace.receiving') : status === 'listening' ? t('workspace.listening') : status === 'stale' ? t('workspace.noSignal') : t('workspace.offline')}</span></div>
  </div>;
};
