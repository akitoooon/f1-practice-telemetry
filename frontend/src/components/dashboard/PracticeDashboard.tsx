import { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { useSessionListStore } from '../../store/useSessionListStore';
import { useSessionStatusStore } from '../../store/useSessionStatusStore';
import { useTelemetryDataStore } from '../../store/useTelemetryDataStore';
import { useUnits } from '../../hooks/useUnits';
import { TIME_CONSTANTS } from '../../constants/f1';
import { useSlotTelemetry } from '../../hooks/useSlotTelemetry';
import { useMergedTelemetry } from '../../hooks/useMergedTelemetry';
import { useLiveRadio } from '../../hooks/useLiveRadio';
import { useLiveStatus } from '../../hooks/useLiveStatus';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useRaceEngineerActions, useRaceEngineerState, providerIsReady } from '../../context/RaceEngineerContext';
import { analyzeCorners, type CornerAnalysis } from '../../utils/trackTurns';
import { formatLapTime } from '../../utils/formatters';
import { invalidateSessionLapData } from '../../utils/sessionDataCache';
import { buildPath } from '../../router/routes';
import { navigate } from '../../router/router';
import { Link } from '../../router/Link';
import { Panel, PanelHeader } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Select } from '../ui/Field';
import { EmptyState } from '../ui/EmptyState';
import { CornerTable } from '../lap_comparator/CornerTable';
import { StripCharts } from '../lap_comparator/charts/StripCharts';
import { STRIP_TRACE_IDS, STRIP_TRACES } from '../lap_comparator/charts/stripTraces';
import type { Lap } from '../../types/session';
import styles from './PracticeDashboard.module.css';

const lapTime = (ms?: number) => ms && ms > 0 ? formatLapTime(ms) : '—';
const delta = (ms: number | null) => ms === null ? '—' : `${ms > 0 ? '+' : ''}${(ms / TIME_CONSTANTS.MS_PER_SECOND).toFixed(3)} s`;

export const PracticeDashboard = () => {
  useDocumentTitle('Dashboard');
  useLiveRadio();
  const liveStatus = useLiveStatus();
  const liveSession = useSessionStatusStore(s => s.session);
  const sessions = useSessionListStore(s => s.sessions);
  const loading = useSessionListStore(s => s.loading);
  const error = useSessionListStore(s => s.error);
  const [sessionId, setSessionId] = useState<number | ''>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const selected = sessions.find(s => s.id === sessionId);
  const { openChat } = useRaceEngineerActions();
  const { config, keyStatus } = useRaceEngineerState();
  const aiReady = providerIsReady(config, keyStatus, config.provider);
  const units = useUnits();
  useEffect(() => { void useSessionListStore.getState().fetchSessions(); }, []);

  const a = useSlotTelemetry({ sessionId, refreshKey, defaultDriverName: 'Lap A', playerCarIndex: selected?.player_car_index });
  const b = useSlotTelemetry({ sessionId, refreshKey, defaultDriverName: 'Lap B', isSlotB: true,
    isSameSessionAsSlotA: true, referenceDriver: a.driver, referenceLapId: a.lapId,
    playerCarIndex: selected?.player_car_index });
  // Hide previous recordings while the selected session loads or fails.
  const available = sessionId !== '' && a.loadedSessionId === sessionId && b.loadedSessionId === sessionId
    && !a.loading && !b.loading && !a.error && !b.error;
  const lapA = available ? a.selectedLap : undefined;
  const lapB = available ? b.selectedLap : undefined;
  const setLapBId = b.setLapId;
  useEffect(() => {
    if (available && a.lapId && a.lapId === b.lapId) setLapBId('');
  }, [available, a.lapId, b.lapId, setLapBId]);
  const merged = useMergedTelemetry({ lapAId: lapA?.id, lapBId: lapB?.id, lapAObj: lapA, lapBObj: lapB });
  const ready = !!lapA && !!lapB && !merged.loading && !merged.error;
  const corners = useMemo(() => ready ? analyzeCorners(merged.comparisonData, merged.detectedTurns) : [],
    [ready, merged.comparisonData, merged.detectedTurns]);
  const busy = loading || a.loading || b.loading || merged.loading;
  const dataError = error || a.error || b.error || merged.error;
  const traces = STRIP_TRACE_IDS.filter(id => merged.comparisonData.some(point =>
    STRIP_TRACES[id].lines.some(line => typeof point[line.dataKey] === 'number' && Number.isFinite(point[line.dataKey]))));
  const comparePath = (corner?: CornerAnalysis) => buildPath({ page: 'compare', sessionA: sessionId || undefined,
    lapA: lapA?.id, lapB: lapB?.id, zoom: corner?.range });
  const askCoach = (corner?: CornerAnalysis) => {
    if (!ready) return;
    // The existing coach resolves its context from the comparison route's IDs.
    navigate(comparePath(corner));
    openChat(corner ? `Analyze ${corner.turn.name}. What should I practice based on these two laps?`
      : 'Compare these two laps and identify the most useful improvement to practice.');
  };
  const chooseSession = (value: string) => {
    a.setLapId(''); b.setLapId('');
    merged.setZoomDomain(null); merged.setHoverDistance(null);
    setSessionId(value ? Number(value) : '');
  };
  const refresh = () => {
    if (sessionId) invalidateSessionLapData([sessionId]);
    setRefreshKey(key => key + 1);
    void useSessionListStore.getState().fetchSessions({ force: true });
  };
  const lapOptions = (laps: Lap[]) => laps.filter(l => l.lap_time_ms > 0).map(l => <option key={l.id} value={l.id}>
    Lap {l.lap_number} · {a.participants.find(p => p.car_index === l.car_index)?.name ?? `Car ${l.car_index}`} · {lapTime(l.lap_time_ms)}{l.is_valid ? '' : ' · Invalid'}{l.has_telemetry ? '' : ' · No telemetry'}
  </option>);

  return <div className={styles.page}>
    <header className={styles.heading}>
      <div><h1>Dashboard</h1><p>Your session, measured.</p></div>
      <div className={styles.actions}>
        <span className={styles.feed}><Activity size={14} aria-hidden="true" />Feed: {liveStatus}</span>
        <Button size="sm" loading={loading} icon={<RefreshCw size={14} />} onClick={refresh}>Refresh sessions</Button>
      </div>
    </header>
    <div className={styles.grid}>
      <Panel className={styles.summary}>
        <PanelHeader title="Session Summary" level={2} />
        <label className={styles.field}>Recorded session
          <Select value={sessionId} onChange={e => chooseSession(e.target.value)} disabled={loading}>
            <option value="">Select a recorded session</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.track_name} · {s.session_type} · {units.dateAndTime(s.created_at)}</option>)}
          </Select>
        </label>
        {error ? <EmptyState compact tone="danger" title="Sessions unavailable" description={error} /> : selected ? <>
          <div className={styles.sessionIdentity}><strong>{selected.track_name}</strong><span>{selected.session_type} · F1 {selected.packet_format}</span></div>
          <dl className={styles.stats}>
            <div><dt>Recorded laps / all cars</dt><dd>{available ? a.laps.length : '—'}</dd></div>
            <div><dt>Lap A</dt><dd>{lapTime(lapA?.lap_time_ms)}</dd></div>
            <div><dt>A − B</dt><dd className={styles.accent}>{delta(ready ? merged.totalDeltaMs : null)}</dd></div>
          </dl>
          <Link href={buildPath({page: 'history', sessionId: selected.id, tab: 'story'})}>Open session ↗</Link>
        </> : <EmptyState compact title={loading ? 'Loading recorded sessions…' : 'No session selected'} description="Choose a recording to review laps, corners and telemetry. New sessions are recorded when the game sends data." />}
      </Panel>
      <Panel className={styles.coach}>
        <PanelHeader title="AI Coach" level={2} />
        <span className={styles.eyebrow}>{aiReady ? 'Provider configured' : 'Setup required'}</span>
        <h3>{ready ? 'Review your comparison' : 'Build your next practice focus'}</h3>
        <p>{ready ? 'Ask the coach to analyze the selected laps. Advice is generated only when requested.' : 'Select two recorded laps to give the coach a comparison to analyze.'}</p>
        <div className={styles.actions}>
          <Button size="sm" variant="primary" disabled={!ready || !aiReady} onClick={() => askCoach()}>Analyze selected laps</Button>
          <Button size="sm" onClick={() => openChat()}>Open coach</Button>
          {!aiReady && <Link href="/settings/ai">Configure AI</Link>}
        </div>
        <p className={styles.note}>Live radio and push-to-talk remain available through the race engineer.</p>
      </Panel>
      <Panel className={styles.comparison}>
        <PanelHeader title="Lap Comparison" level={2} actions={<Link href={comparePath()}>Full comparison ↗</Link>} />
        <div className={styles.lapPickers}>
          <label className={styles.field}>Lap A · reference
            <Select value={available ? a.lapId : ''} disabled={!available} onChange={e => { a.setLapId(e.target.value ? Number(e.target.value) : ''); merged.setZoomDomain(null); }}>
              <option value="">Select lap A</option>{available && lapOptions(a.laps)}
            </Select>
          </label>
          <label className={styles.field}>Lap B · comparison
            <Select value={available ? b.lapId : ''} disabled={!available} onChange={e => { b.setLapId(e.target.value ? Number(e.target.value) : ''); merged.setZoomDomain(null); }}>
              <option value="">Select lap B</option>{available && lapOptions(b.laps)}
            </Select>
          </label>
        </div>
        {dataError ? <EmptyState compact tone="danger" title="Analysis unavailable" description={dataError} /> : ready ? <dl className={styles.stats}>
          <div><dt>Lap A · {a.driverName}</dt><dd>{lapTime(lapA.lap_time_ms)}</dd></div>
          <div><dt>Lap B · {b.driverName}</dt><dd>{lapTime(lapB.lap_time_ms)}</dd></div>
          <div><dt>Sector 1 · A − B</dt><dd>{delta(merged.s1Delta)}</dd></div>
          <div><dt>Sector 2 · A − B</dt><dd>{delta(merged.s2Delta)}</dd></div>
          <div><dt>Sector 3 · A − B</dt><dd>{delta(merged.s3Delta)}</dd></div>
        </dl> : <EmptyState compact title={busy ? 'Loading analysis…' : 'Two laps make a comparison'} description="Select a recorded session and two laps. Positive delta means lap A is slower than lap B." />}
      </Panel>
      <section className={styles.corners} aria-label="Corner Delta">
        <PanelHeader title="Corner Delta" level={2} />
        {corners.length ? <CornerTable corners={corners} nameA={a.driverName} nameB={b.driverName} zoomDomain={merged.zoomDomain}
          onZoom={c => { merged.setZoomDomain(c.range); merged.setHoverDistance(c.turn.distance); }} onAskAi={c => askCoach(c)} />
          : <EmptyState compact title={busy ? 'Loading corner analysis…' : 'No corner analysis available'} description={dataError || 'Select two laps with recorded telemetry. Detected corners and time differences appear here.'} tone={dataError ? 'danger' : 'neutral'} />}
      </section>
      <Panel className={styles.telemetry}>
        <PanelHeader title="Telemetry Comparison" level={2} subtitle="Distance-aligned traces · drag to zoom" actions={merged.zoomDomain && <Button size="sm" onClick={() => merged.setZoomDomain(null)}>Reset zoom</Button>} />
        {ready && traces.length > 0 ? <StripCharts chartData={merged.chartData} nameA={a.driverName} nameB={b.driverName}
          formatA={selected?.packet_format} formatB={selected?.packet_format} available={traces}
          sector1Distance={null} sector2Distance={null} hoverDistance={merged.hoverDistance} onMouseMove={merged.handleMouseMove}
          onHoverDistanceChange={merged.setHoverDistance} onZoomDomainChange={merged.setZoomDomain} />
          : <EmptyState icon={<Activity size={24} />} title={busy ? 'Loading telemetry…' : 'No telemetry to compare'} description={dataError || 'Speed, throttle, brake and other recorded channels appear after selecting laps with telemetry.'} tone={dataError ? 'danger' : 'neutral'} />}
      </Panel>
      <section className={styles.vehicle} aria-label="Vehicle & Session Status">
        <PanelHeader title="Vehicle & Session Status" level={2} />
        <p className={styles.note}>Live feed · {liveStatus}. Recorded analysis above is independent of the live vehicle.</p>
        {liveStatus === 'live' && liveSession ? <VehicleValues /> : <EmptyState compact title={liveStatus === 'stale' ? 'Telemetry paused' : 'Waiting for vehicle data'} description="Start a game session and enable UDP telemetry to inspect the current vehicle. No current vehicle values are shown without an active feed." />}
      </section>
    </div>

  </div>;
};

/** Read only channels actually received for the player's car; absent packets stay empty. */
const VehicleValues = () => {
  const lap = useTelemetryDataStore(s => s.allLaps[s.playerCarIndex]);
  const status = useTelemetryDataStore(s => s.allCarStatus[s.playerCarIndex]);
  const telemetry = useTelemetryDataStore(s => s.allTelemetry[s.playerCarIndex]);
  const session = useSessionStatusStore(s => s.session);
  const units = useUnits();
  return <dl className={styles.stats}>
    <div><dt>Current lap</dt><dd>{lap?.CurrentLapNum ?? '—'}</dd></div>
    <div><dt>Last lap</dt><dd>{lapTime(lap?.LastLapTimeInMS)}</dd></div>
    <div><dt>Speed</dt><dd>{units.speed(telemetry?.Speed, 0, '—')}</dd></div>
    <div><dt>Fuel in tank</dt><dd>{status ? `${status.FuelInTank.toFixed(1)} kg` : '—'}</dd></div>
    <div><dt>Tyre age</dt><dd>{status ? `${status.TyresAgeLaps} laps` : '—'}</dd></div>
    <div><dt>Track temperature</dt><dd>{units.temperature(session?.TrackTemperature, 0, '—')}</dd></div>
  </dl>;
};
