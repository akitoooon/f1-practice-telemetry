import { useI18n } from '../../context/I18nContext';
import { useRaceEngineerActions, useRaceEngineerState, useRaceEngineerStream, providerIsReady } from '../../context/RaceEngineerContext';
import { Markdown } from '../ui/Markdown';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Link } from '../../router/Link';
import styles from './PracticeDashboard.module.css';

export const DashboardCoach = ({lapA,lapB}: {lapA?: number;lapB?: number}) => {
  const { t } = useI18n();
  const { sendMessage, openChat } = useRaceEngineerActions();
  const { config, keyStatus } = useRaceEngineerState();
  const { messages, isGenerating } = useRaceEngineerStream();
  const ready = providerIsReady(config,keyStatus,config.provider);
  const reply = [...messages].reverse().find(m => m.role === 'assistant' && m.context?.context_mode === 'comparator'
    && m.context.lap_a_id === lapA && m.context.lap_b_id === lapB && !!lapA && !!lapB);
  return <>
    <div className={styles.coachBody} aria-live="polite">
      {reply?.errorCode ? <EmptyState compact tone="danger" title={t('workspace.analysisUnavailable')} description={t('workspace.coachErrorHelp')} />
        : reply?.content ? <Markdown content={reply.content} />
        : <EmptyState compact title={isGenerating && reply ? t('workspace.analyzingSelectedLaps') : t('workspace.noAnalysisGenerated')}
          description={!ready ? t('workspace.coachSetupHelp') : t('workspace.coachReviewHelp')} />}
    </div>
    <div className={styles.panelFooter}>
      <Button size="sm" variant="primary" disabled={!ready || !lapA || !lapB || isGenerating}
        onClick={() => void sendMessage(t('workspace.analyzePrompt'))}>{t('workspace.analyzeSelectedLaps')}</Button>
      <Button size="sm" onClick={() => openChat()}>{t('workspace.openCoach')}</Button>
      {!ready && <Link href="/settings/ai">{t('workspace.configureAI')}</Link>}
    </div>
  </>;
};
