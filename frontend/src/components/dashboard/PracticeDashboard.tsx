import { useI18n } from '../../context/I18nContext';
import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useSessionListStore } from '../../store/useSessionListStore';
import { useSlotTelemetry } from '../../hooks/useSlotTelemetry';
import { useMergedTelemetry } from '../../hooks/useMergedTelemetry';
import { useLiveRadio } from '../../hooks/useLiveRadio';
import { useLiveStatus } from '../../hooks/useLiveStatus';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useUnits } from '../../hooks/useUnits';
import { useRaceEngineerActions } from '../../context/RaceEngineerContext';
import { analyzeCorners, type CornerAnalysis } from '../../utils/trackTurns';
import { pointsInSpeedUnit } from '../../utils/units';
import { formatLapTime, formatSignedDelta } from '../../utils/formatters';
import { invalidateSessionLapData } from '../../utils/sessionDataCache';
import { buildPath } from '../../router/routes';
import { navigate, useRoute } from '../../router/router';
import { Link } from '../../router/Link';
import { Panel, PanelHeader } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Select } from '../ui/Field';
import { EmptyState } from '../ui/EmptyState';
import { ComparatorChart } from '../lap_comparator/charts/ComparatorChart';
import { StripCharts } from '../lap_comparator/charts/StripCharts';
import { DashboardCoach } from './DashboardCoach';
import { DashboardLiveVehicle } from './DashboardLiveVehicle';
import { TIME_CONSTANTS } from '../../constants/f1';
import type { Lap } from '../../types/session';
import styles from './PracticeDashboard.module.css';

const lapTime = (ms?: number) => ms && ms > 0 ? formatLapTime(ms) : '—';
const delta = (ms: number | null) => ms === null ? '—' : `${formatSignedDelta(ms)} s`;

/** Dedicated recorded-data workspace. The existing live tools have their own route. */
export const PracticeDashboard = () => {
  const { t } = useI18n();
  useDocumentTitle(t('workspace.dashboard'));
  useLiveRadio();
  const liveStatus = useLiveStatus();
  const sessions = useSessionListStore(s => s.sessions);
  const loading = useSessionListStore(s => s.loading);
  const error = useSessionListStore(s => s.error);
  const route = useRoute();
  const [initial] = useState(() => route.page === 'dashboard' ? route : undefined);
  const [sessionId, setSessionId] = useState<number | ''>(initial?.sessionA ?? '');
  const [refreshKey, setRefreshKey] = useState(0);
  const selected = sessions.find(s => s.id === sessionId);
  const units = useUnits();
  const { openChat } = useRaceEngineerActions();
  useEffect(() => { void useSessionListStore.getState().fetchSessions(); }, []);
  const [autoSelected, setAutoSelected] = useState(!!initial?.sessionA);
  useEffect(() => {
    if (!autoSelected && sessions.length) {
      const newest = [...sessions].sort((x,y) => Date.parse(y.created_at) - Date.parse(x.created_at))[0];
      setSessionId(newest.id); setAutoSelected(true);
    }
  }, [sessions, autoSelected]);

  const a = useSlotTelemetry({sessionId,refreshKey,preloadLapId:initial?.lapA,defaultDriverName:t('workspace.lapA'),playerCarIndex:selected?.player_car_index});
  const b = useSlotTelemetry({sessionId,refreshKey,preloadLapId:initial?.lapB,defaultDriverName:t('workspace.lapB'),isSlotB:true,
    isSameSessionAsSlotA:true,referenceDriver:a.driver,referenceLapId:a.lapId,playerCarIndex:selected?.player_car_index});
  const available = sessionId !== '' && a.loadedSessionId === sessionId && b.loadedSessionId === sessionId && !a.loading && !b.loading && !a.error && !b.error;
  const lapA = available && a.selectedLap && a.selectedLap.lap_time_ms > 0 ? a.selectedLap : undefined;
  const lapB = available && b.selectedLap && b.selectedLap.lap_time_ms > 0 && b.lapId !== a.lapId ? b.selectedLap : undefined;
  const merged = useMergedTelemetry({lapAId:lapA?.id,lapBId:lapB?.id,lapAObj:lapA,lapBObj:lapB});
  const ready = !!lapA && !!lapB && !merged.loading && !merged.error;
  const busy = loading || a.loading || b.loading || merged.loading;
  const dataError = error || a.error || b.error || merged.error;
  const corners = useMemo(() => ready ? analyzeCorners(merged.comparisonData,merged.detectedTurns) : [],[ready,merged.comparisonData,merged.detectedTurns]);
  const timed = useMemo(() => available ? a.laps.filter(l => l.lap_time_ms > 0 && (selected?.player_car_index == null || l.car_index === selected.player_car_index)) : [],[available,a.laps,selected?.player_car_index]);
  const valid = timed.filter(l => l.is_valid);
  const best = valid.length ? Math.min(...valid.map(l => l.lap_time_ms)) : undefined;
  const last = [...timed].sort((x,y) => y.lap_number - x.lap_number)[0];
  const sectors = ['sector1_ms','sector2_ms','sector3_ms'] as const;
  const theoretical = valid.length && sectors.every(k => valid.some(l => l[k] > 0)) ? sectors.reduce((sum,k) => sum + Math.min(...valid.filter(l => l[k] > 0).map(l => l[k])),0) : undefined;
  const url = buildPath({page:'dashboard',sessionA:sessionId || undefined,lapA:lapA?.id,lapB:lapB?.id,zoom:merged.zoomDomain ?? undefined});
  // Explicit identifiers keep the information bar and the shared AI provider on the same recording.
  useEffect(() => {
    if (route.page === 'dashboard' && (available || sessionId === '')) navigate(url,{replace:true});
  }, [url,available,sessionId,route.page]);
  const comparePath = buildPath({page:'compare',sessionA:sessionId || undefined,lapA:lapA?.id,lapB:lapB?.id,zoom:merged.zoomDomain ?? undefined});
  const pickSession = (value:string) => {
    setAutoSelected(true); a.setLapId(''); b.setLapId(''); merged.setZoomDomain(null); merged.setHoverDistance(null); setSessionId(value ? Number(value) : '');
    navigate(buildPath({page:'dashboard',sessionA:value ? Number(value) : undefined}),{replace:true});
  };
  const refresh = () => { if (sessionId) invalidateSessionLapData([sessionId]); setRefreshKey(x => x+1); void useSessionListStore.getState().fetchSessions({force:true}); };
  const options = (laps:Lap[], other?:number) => laps.filter(l => l.lap_time_ms > 0).map(l => <option key={l.id} value={l.id} disabled={l.id === other}>
    {t('workspace.l')}{l.lap_number} · {a.participants.find(p => p.car_index === l.car_index)?.name || `Car ${l.car_index}`} · {lapTime(l.lap_time_ms)}{l.is_valid ? '' : ' · Invalid'}{l.has_telemetry ? '' : ' · No telemetry'}
  </option>);
  const zoomCorner = (corner:CornerAnalysis) => { merged.setZoomDomain(corner.range); merged.setHoverDistance(corner.turn.distance); };
  const speedPoints = useMemo(() => pointsInSpeedUnit(merged.chartData, units.prefs.speed), [merged.chartData, units.prefs.speed]);
  const hasSpeed = ready && merged.chartData.some(p => p.speedA != null || p.speedB != null);
  const empty = (title:string, description:string) => <EmptyState className={styles.empty} compact title={busy ? t('workspace.loadingAnalysis') : title} description={dataError ? `${t('workspace.sessionsUnavailable')}: ${dataError}` : description} tone={dataError ? 'danger' : 'neutral'} />;

  return <div className={styles.page}>
    <header className={styles.heading}><div><h1>{t('workspace.dashboard')}</h1><span>{t('workspace.dashboardDescription')}</span></div>
      <div className={styles.actions}><label className={styles.sessionSelect}><span className="sr-only">{t('workspace.recordedSession')}</span><Select aria-label={t('workspace.recordedSession')} value={sessionId} onChange={e => pickSession(e.target.value)} disabled={loading}>
        <option value="">{t('workspace.selectARecordedSession')}</option>{sessions.map(s => <option key={s.id} value={s.id}>{s.track_name} · {s.session_type} · {units.dateAndTime(s.created_at)}</option>)}
      </Select></label><Button size="sm" loading={loading} icon={<RefreshCw size={13} />} onClick={refresh}>{t('workspace.refreshSessions')}</Button></div>
    </header>
    <div className={styles.grid}>
      <div className={styles.topRow}>
        <Panel className={styles.summary}><PanelHeader title={t('workspace.sessionSummary')} level={2} className={styles.panelHeader} actions={selected && <Link href={`/history/${selected.id}`}>{t('workspace.openSession')}</Link>} />
          {selected && available ? <><p className={styles.meta}>{selected.track_name} · {selected.session_type} <span>{selected.player_car_index == null ? t('workspace.allCars') : t('workspace.yourRecordedLaps')}</span></p>
            <dl className={styles.summaryStats}><div><dt>{t('workspace.bestValidLap')}</dt><dd>{lapTime(best)}</dd></div><div><dt>{t('workspace.theoreticalSectors')}</dt><dd>{lapTime(theoretical || undefined)}</dd></div><div><dt>{t('workspace.lastTimedLap')}</dt><dd>{lapTime(last?.lap_time_ms)}</dd></div></dl>
            <table className={styles.sectorTable}><caption className="sr-only">{t('workspace.lapAAgainstLapBSectorTimes')}</caption><thead><tr><th>{t('workspace.sector')}</th><th>{t('workspace.lapA')}</th><th>{t('workspace.lapB')}</th><th>{t('workspace.aB')}</th></tr></thead><tbody>{sectors.map((k,i) => <tr key={k}><th>{t('workspace.s')}{i+1}</th><td>{lapA?.[k] ? `${(lapA[k]/TIME_CONSTANTS.MS_PER_SECOND).toFixed(3)}` : '—'}</td><td>{lapB?.[k] ? `${(lapB[k]/TIME_CONSTANTS.MS_PER_SECOND).toFixed(3)}` : '—'}</td><td>{delta(lapA?.[k] && lapB?.[k] ? lapA[k]-lapB[k] : null)}</td></tr>)}</tbody></table>
          </> : empty(error ? t('workspace.sessionsUnavailable') : t('workspace.noSessionSelected'),t('workspace.noSessionHelp'))}
        </Panel>
        <Panel className={styles.coach}><PanelHeader title={t('workspace.aiCoach')} level={2} className={styles.panelHeader} subtitle={t('workspace.coachDescription')} /><DashboardCoach lapA={ready ? lapA?.id : undefined} lapB={ready ? lapB?.id : undefined} /></Panel>
      </div>
      <div className={styles.analysisRow}>
        <Panel className={styles.comparison}><PanelHeader title={t('workspace.lapComparison')} level={2} className={styles.panelHeader} actions={<Link href={comparePath}>{t('workspace.openAnalysis')}</Link>} />
          <div className={styles.lapPickers}>
            <label>{t('workspace.lapAReference')}<Select aria-label={t('workspace.lapAReference')} value={lapA?.id || ''} disabled={!available} onChange={e => {a.setLapId(e.target.value ? Number(e.target.value) : '');merged.setZoomDomain(null);}}><option value="">{t('workspace.selectLapA')}</option>{available && options(a.laps,lapB?.id)}</Select></label>
            <label>{t('workspace.lapBComparison')}<Select aria-label={t('workspace.lapBComparison')} value={lapB?.id || ''} disabled={!available} onChange={e => {b.setLapId(e.target.value ? Number(e.target.value) : '');merged.setZoomDomain(null);}}><option value="">{t('workspace.selectLapB')}</option>{available && options(b.laps,lapA?.id)}</Select></label>
          </div>
          {ready && <div className={styles.duel}><span>{t('workspace.a')}{lapTime(lapA.lap_time_ms)}</span><span>{t('workspace.b')}{lapTime(lapB.lap_time_ms)}</span><strong>{delta(merged.totalDeltaMs)}</strong></div>}
          {hasSpeed ? <div className={styles.speedPlot}><ComparatorChart chartData={speedPoints} nameA={`A · L${lapA?.lap_number}`} nameB={`B · L${lapB?.lap_number}`} title={`Speed · ${units.speedUnit}`} height={175} dataKeyA="speedA" dataKeyB="speedB" sector1Distance={null} sector2Distance={null} hoverDistance={merged.hoverDistance} onMouseMove={merged.handleMouseMove} onHoverDistanceChange={merged.setHoverDistance} /></div>
            : empty(ready ? t('workspace.noSpeedTelemetryRecorded') : t('workspace.twoLapsMakeAComparison'),t('workspace.comparisonHelp'))}
        </Panel>
        <Panel className={styles.corners}><PanelHeader title={t('workspace.cornerDelta')} level={2} className={styles.panelHeader} subtitle={t('workspace.cornerHelp')} />
          {corners.length ? <div className={styles.cornerList}><table><caption className="sr-only">{t('workspace.measuredCornerTimeDifferences')}</caption><thead><tr><th>{t('workspace.corner')}</th><th>{t('workspace.aB')}</th><th>{t('workspace.review')}</th></tr></thead><tbody>{corners.map(c => <tr key={c.turn.name} data-selected={merged.zoomDomain?.[0] === c.range[0] || undefined}><th><button type="button" onClick={() => zoomCorner(c)} aria-label={`Zoom ${c.turn.name}`}>{c.turn.name}</button></th><td>{c.timeDelta == null ? '—' : delta(c.timeDelta*TIME_CONSTANTS.MS_PER_SECOND)}</td><td><button type="button" aria-label={`Ask coach about ${c.turn.name}`} onClick={() => {zoomCorner(c); openChat(`Analyze ${c.turn.name} using these selected laps. State any missing telemetry.`);}}>{t('workspace.askCoach')}</button></td></tr>)}</tbody></table></div>
            : empty(t('workspace.noCornerAnalysisAvailable'),t('workspace.noCornersHelp'))}
        </Panel>
      </div>
      <div className={styles.analysisRow}>
        <Panel className={styles.telemetry}><PanelHeader title={t('workspace.telemetryComparison')} level={2} className={styles.panelHeader} subtitle={t('workspace.traceHelp')} actions={merged.zoomDomain && <Button size="sm" onClick={() => merged.setZoomDomain(null)}>{t('workspace.resetZoom')}</Button>} />
          {ready && hasSpeed ? <StripCharts compact chartData={merged.chartData} nameA={t('workspace.lapA')} nameB={t('workspace.lapB')} formatA={selected?.packet_format} formatB={selected?.packet_format} available={['speed','throttle','brake','gear']}
            sector1Distance={null} sector2Distance={null} hoverDistance={merged.hoverDistance} onMouseMove={merged.handleMouseMove} onHoverDistanceChange={merged.setHoverDistance} onZoomDomainChange={merged.setZoomDomain} />
            : empty(t('workspace.noTelemetryToCompare'),t('workspace.noTelemetryHelp'))}
        </Panel>
        <Panel className={styles.vehicle}><PanelHeader title={t('workspace.vehicleSessionStatus')} level={2} className={styles.panelHeader} />
          <dl className={styles.statusList}><div><dt>{t('workspace.telemetryConnection')}</dt><dd>{liveStatus}</dd></div><div><dt>{t('workspace.selectedRecording')}</dt><dd>{selected?.track_name || '—'}</dd></div><div><dt>{t('workspace.sessionType')}</dt><dd>{selected?.session_type || '—'}</dd></div><div><dt>{t('workspace.gameFormat')}</dt><dd>{selected?.packet_format ? `F1 ${selected.packet_format}` : '—'}</dd></div><div><dt>{t('workspace.aiDifficulty')}</dt><dd>{selected && selected.ai_difficulty > 0 ? selected.ai_difficulty : '—'}</dd></div><div><dt>{t('workspace.timedLapsSelectedDriver')}</dt><dd>{available ? timed.length : '—'}</dd></div><div><dt>{t('workspace.recordedWeather')}</dt><dd>{selected?.weather || '—'}</dd></div><div><dt>{t('workspace.assists')}</dt><dd>{t('workspace.notRecorded')}</dd></div></dl>
          {liveStatus === 'live' && <DashboardLiveVehicle />}
          <p className={styles.note}>{t('workspace.recordedStatusHelp')}</p><Link href="/live/dashboard">{t('workspace.openLiveVehicle')}</Link>
        </Panel>
      </div>
    </div>
  </div>;
};
