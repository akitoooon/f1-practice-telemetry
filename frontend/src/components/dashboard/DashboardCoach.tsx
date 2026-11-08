import { useRaceEngineerActions, useRaceEngineerState, useRaceEngineerStream, providerIsReady } from '../../context/RaceEngineerContext';
import { Markdown } from '../ui/Markdown';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Link } from '../../router/Link';
import styles from './PracticeDashboard.module.css';

export const DashboardCoach = ({lapA,lapB}: {lapA?: number;lapB?: number}) => {
  const { sendMessage, openChat } = useRaceEngineerActions();
  const { config, keyStatus } = useRaceEngineerState();
  const { messages, isGenerating } = useRaceEngineerStream();
  const ready = providerIsReady(config,keyStatus,config.provider);
  const reply = [...messages].reverse().find(m => m.role === 'assistant' && m.context?.context_mode === 'comparator'
    && m.context.lap_a_id === lapA && m.context.lap_b_id === lapB && !!lapA && !!lapB);
  return <>
    <div className={styles.coachBody} aria-live="polite">
      {reply?.errorCode ? <EmptyState compact tone="danger" title="Analysis unavailable" description={reply.errorRaw || 'Open the coach to retry or check provider settings.'} />
        : reply?.content ? <Markdown content={reply.content} />
        : <EmptyState compact title={isGenerating && reply ? 'Analyzing selected laps…' : 'No analysis generated'}
          description={!ready ? 'Configure an AI provider to review your recorded driving.' : 'Select two laps and request an evidence-based review.'} />}
    </div>
    <div className={styles.panelFooter}>
      <Button size="sm" variant="primary" disabled={!ready || !lapA || !lapB || isGenerating}
        onClick={() => void sendMessage('Analyze these two laps. Give up to three specific practice priorities supported by the recorded data. State when telemetry is missing.')}>Analyze selected laps</Button>
      <Button size="sm" onClick={() => openChat()}>Open coach</Button>
      {!ready && <Link href="/settings/ai">Configure AI ↗</Link>}
    </div>
  </>;
};
