import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { LayoutDashboard, Radio, ChartNoAxesCombined, History, Bot, Settings, ArrowUpRight } from 'lucide-react';
import { AppProviders } from './AppProviders';
import { AiRaceEngineer } from './components/AiRaceEngineer';
import { useRaceEngineerActions } from './context/RaceEngineerContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';
import { SettingsSync } from './components/common/SettingsSync';
import { LiveSessionToast } from './components/common/LiveSessionToast';
import { PerformanceModeToggle } from './components/common/PerformanceModeToggle';
import { WorkspaceSessionBar } from './components/workspace/WorkspaceSessionBar';
import { useAppUpdateStore } from './store/useAppUpdateStore';
import { useRadioSettingsStore } from './store/useRadioSettingsStore';
import { useTelemetryEndpointStore } from './store/useTelemetryEndpointStore';
import { useLiveStatus } from './hooks/useLiveStatus';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useNavHeightVar } from './hooks/useNavHeightVar';
import { useNativeWindowLinks } from './hooks/useNativeWindowLinks';
import { useDeviceSettingsSync } from './hooks/useDeviceSettingsSync';
import { usePerformanceModeAttribute } from './hooks/usePerformanceMode';
import { PHONE_MEDIA } from './styles/breakpoints';
import { LIVE_STATUS, LIVE_VIEW_MODES } from './constants/f1';
import { Link } from './router/Link';
import { navigate, useRoute, useUrl } from './router/router';
import { buildPath, settingsPath, storeLastPage, storedLiveMode, type Page } from './router/routes';
import { storage } from './utils/storage';
import { SkeletonPage } from './components/ui/Skeleton';
import styles from './App.module.css';

const SessionHistory = lazy(() => import('./components/SessionHistory').then(m => ({ default: m.SessionHistory })));
const LapComparator = lazy(() => import('./components/LapComparator').then(m => ({ default: m.LapComparator })));
const TrackProgress = lazy(() => import('./components/progress/TrackProgress').then(m => ({ default: m.TrackProgress })));
const SettingsPage = lazy(() => import('./components/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Live = lazy(() => import('./components/RaceControlDashboard').then(m => ({ default: m.RaceControlDashboard })));
const ReleaseNotesModal = lazy(() => import('./components/ReleaseNotesModal').then(m => ({ default: m.ReleaseNotesModal })));

const NAV_ITEMS: ReadonlyArray<{page: Page; label: string; icon: typeof Bot}> = [
  {page:'dashboard', label:'Dashboard', icon:LayoutDashboard},
  {page:'live', label:'Live', icon:Radio},
  {page:'compare', label:'Analysis', icon:ChartNoAxesCombined},
  {page:'history', label:'Lap History', icon:History},
  {page:'coach', label:'AI Coach', icon:Bot},
  {page:'settings', label:'Settings', icon:Settings},
];
const DISMISSED_UPDATE_KEY = 'f1_telemetry_dismissed_update';

function AppContent() {
  const route = useRoute();
  const url = useUrl();
  const activePage = route.page;
  const canonicalUrl = buildPath(route);
  useEffect(() => { if (canonicalUrl !== url) navigate(canonicalUrl, {replace:true}); }, [canonicalUrl, url]);
  useEffect(() => { storeLastPage(activePage); }, [activePage]);
  const lastCompareUrl = useRef('/compare');
  const lastSettingsUrl = useRef(settingsPath());
  if (activePage === 'compare') lastCompareUrl.current = canonicalUrl;
  if (activePage === 'settings') lastSettingsUrl.current = canonicalUrl;
  const topNavRef = useRef<HTMLElement>(null);
  useNavHeightVar(topNavRef);
  useNativeWindowLinks();
  useDeviceSettingsSync();
  usePerformanceModeAttribute();
  const isPhone = useMediaQuery(PHONE_MEDIA);
  const driverFocus = isPhone && route.page === 'live' && route.mode === LIVE_VIEW_MODES.DRIVER;
  const liveStatus = useLiveStatus();
  const udpPort = useTelemetryEndpointStore(s => s.endpoint.udp_port);
  const version = useAppUpdateStore(s => s.version);
  const release = useAppUpdateStore(s => s.release);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(() => storage.get(DISMISSED_UPDATE_KEY, null));
  const { closeChat } = useRaceEngineerActions();
  useEffect(() => { if (activePage === 'coach' || activePage === 'dashboard') closeChat(); }, [activePage, closeChat]);
  useEffect(() => {
    void useAppUpdateStore.getState().load();
    useRadioSettingsStore.getState().loadConfigFromBackend();
    useRadioSettingsStore.getState().loadVoiceFromBackend();
    useTelemetryEndpointStore.getState().loadEndpoint();
  }, []);
  const href = (page: Page) => page === 'compare' ? lastCompareUrl.current : page === 'settings' ? lastSettingsUrl.current
    : page === 'live' ? buildPath({page:'live',mode:route.page === 'live' ? route.mode : storedLiveMode()})
    : page === 'history' ? '/history' : `/${page}`;
  const buildVersion = version?.version || release?.current_version || 'dev';
  const channel = version?.is_dev || buildVersion.startsWith('dev') ? 'dev' : version?.is_beta || /beta|rc/.test(buildVersion) ? 'beta' : undefined;
  return <div className={styles.app} data-driver-focus={driverFocus || undefined}>
    <aside className={styles.sidebar} hidden={driverFocus}>
      <Link href="/dashboard" className={styles.brand} aria-label="MORE PACE home">
        <strong>MORE <span>PACE</span></strong><small>TELEMETRY & PERFORMANCE</small>
      </Link>
      <nav className={styles.navigation} aria-label="Main Navigation">
        {NAV_ITEMS.map(({page,label,icon:Icon}) => <Link key={page} href={href(page)}
          aria-current={(activePage === page || page === 'compare' && activePage === 'progress') ? 'page' : undefined}>
          <Icon size={17} aria-hidden="true" /><span>{label}</span>
          {page === 'live' && (liveStatus === LIVE_STATUS.LIVE || liveStatus === LIVE_STATUS.STALE) &&
            <span className={styles.liveBadge} data-testid="nav-live-badge">{liveStatus === LIVE_STATUS.STALE ? 'NO SIGNAL' : 'LIVE'}</span>}
        </Link>)}
      </nav>
      <div className={styles.sidebarFooter}>
        <span className={styles.connection}><i data-state={liveStatus} />{liveStatus === 'live' ? 'Receiving telemetry' : liveStatus === 'listening' ? 'UDP listening' : liveStatus === 'stale' ? 'Telemetry paused' : 'Server offline'}</span>
        <span className={styles.port}>UDP {udpPort}</span>
        <div className={styles.utilities}>
          <button type="button" data-testid="nav-version-badge" data-channel={channel} aria-label="About & Version Details"
            title={version ? `Commit: ${version.commit}${version.build_date ? ` • Build: ${version.build_date}` : ''}` : 'Current Version'}
            onClick={() => setReleaseOpen(true)}>{buildVersion}</button>
          <PerformanceModeToggle />
        </div>
        {release?.update_available && dismissedVersion !== release.latest_version && <button type="button" data-testid="nav-update-chip" aria-label="Update Available" data-prerelease={release.is_prerelease || undefined}
          onClick={() => setReleaseOpen(true)}>Update available <ArrowUpRight size={12} /></button>}
      </div>
    </aside>
    <div className={styles.workspace}>
      <header ref={topNavRef} className={styles.topBar} hidden={driverFocus}><WorkspaceSessionBar /></header>
      <main className={styles.main}>
        <ErrorBoundary level="section" onReset={() => {}}><Suspense fallback={<SkeletonPage label="Loading workspace" />}>
          {activePage === 'dashboard' ? <Dashboard /> : activePage === 'live' ? <Live />
            : activePage === 'history' ? <SessionHistory /> : activePage === 'compare' ? <><div className={styles.analysisLinks}><Link href="/progress">Track progress ↗</Link></div><LapComparator /></>
            : activePage === 'progress' ? <TrackProgress /> : activePage === 'settings' ? <SettingsPage />
            : <div className={styles.coachPage}><AiRaceEngineer embedded isOpenOverride onCloseOverride={() => navigate('/dashboard')} /></div>}
        </Suspense></ErrorBoundary>
      </main>
    </div>
    <Suspense fallback={null}>{releaseOpen && <ReleaseNotesModal isOpen onClose={() => setReleaseOpen(false)} updateData={release} systemVersion={version}
      onDismissVersion={v => { setDismissedVersion(v); storage.set(DISMISSED_UPDATE_KEY,v); }} />}</Suspense>
    <ToastContainer /><LiveSessionToast /><SettingsSync />
    {activePage !== 'coach' && <ErrorBoundary level="widget"><AiRaceEngineer hideLauncher /></ErrorBoundary>}
  </div>;
}
export default function App() { return <AppProviders><AppContent /></AppProviders>; }
