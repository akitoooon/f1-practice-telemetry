import { render, screen, fireEvent, within, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { usePerformanceModeStore } from './store/usePerformanceModeStore';

vi.mock('./components/SessionHistory', () => ({SessionHistory:() => <div data-testid="history-view">Recorded sessions</div>}));
vi.mock('./components/LapComparator', () => ({LapComparator:() => <div data-testid="analysis-view">Lap analysis</div>}));
vi.mock('./components/progress/TrackProgress', () => ({TrackProgress:() => <div data-testid="progress-view">Track progress</div>}));
vi.mock('./components/Dashboard', () => ({Dashboard:() => <div data-testid="dashboard-view">Recorded analysis Dashboard</div>}));
vi.mock('./components/RaceControlDashboard', () => ({RaceControlDashboard:() => <div data-testid="live-view">Live telemetry</div>}));
const nav = () => within(screen.getByRole('navigation',{name:'Main Navigation'}));
const at = (url:string) => window.history.replaceState(null,'',url);

describe('MORE PACE desktop workspace', () => {
  beforeEach(() => {localStorage.clear(); at('/'); usePerformanceModeStore.setState({enabled:{driver:true,general:false}});});
  it('starts on the Dashboard despite a legacy saved Live or History page', async () => {
    localStorage.setItem('f1_active_tab','live');
    render(<App />);
    await screen.findByTestId('dashboard-view');
    expect(window.location.pathname).toBe('/dashboard');
    expect(nav().getByRole('link',{name:'Dashboard'})).toHaveAttribute('aria-current','page');
    expect(nav().getAllByRole('link').map(x=>x.textContent)).toEqual(['Dashboard','Live','Analysis','Lap History','AI Coach','Settings']);
    expect(nav().queryByText('Progress')).not.toBeInTheDocument();
  });
  it('keeps Live independent from the recorded Dashboard, including browser back', async () => {
    render(<App />); await screen.findByTestId('dashboard-view');
    fireEvent.click(nav().getByRole('link',{name:'Live'}));
    await screen.findByTestId('live-view');
    expect(screen.queryByTestId('dashboard-view')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/live/dashboard');
    act(()=>window.history.back());
    await screen.findByTestId('dashboard-view');
  });
  it('opens Analysis and Lap History from sidebar links', async () => {
    render(<App />); await screen.findByTestId('dashboard-view');
    fireEvent.click(nav().getByRole('link',{name:'Analysis'})); await screen.findByTestId('analysis-view');
    expect(window.location.pathname).toBe('/compare');
    fireEvent.click(nav().getByRole('link',{name:'Lap History'})); await screen.findByTestId('history-view');
    expect(window.location.pathname).toBe('/history');
  });
  it('retains bookmarked comparison IDs and the last Settings section', async () => {
    at('/compare?sa=3&a=4&b=5'); render(<App />); await screen.findByTestId('analysis-view');
    fireEvent.click(nav().getByRole('link',{name:'Settings'}));
    await screen.findByRole('heading',{level:1,name:'Settings'},{timeout:5000});
    fireEvent.click(screen.getByRole('link',{name:'Comparator'}));
    fireEvent.click(nav().getByRole('link',{name:'Analysis'})); await screen.findByTestId('analysis-view');
    expect(window.location.search).toBe('?sa=3&a=4&b=5');
    expect(nav().getByRole('link',{name:'Settings'})).toHaveAttribute('href','/settings/comparator');
  });
  it('provides the five required information-bar fields without inventing assists', async () => {
    render(<App />); await screen.findByTestId('dashboard-view');
    const bar = screen.getByLabelText('Session information');
    expect(bar).toHaveTextContent('No session selected'); expect(bar).toHaveTextContent('AI DIFFICULTY');
    expect(bar).toHaveTextContent('ASSISTS'); expect(bar).toHaveTextContent('Not recorded');
    expect(screen.getByTestId('nav-version-badge')).toBeInTheDocument();
  });
  it('keeps performance preferences separate for the Driver view', async () => {
    at('/dashboard'); const {unmount} = render(<App />); await screen.findByTestId('dashboard-view');
    expect(document.documentElement).not.toHaveAttribute('data-performance'); unmount();
    at('/live/driver'); render(<App />); await screen.findByTestId('live-view');
    expect(document.documentElement).toHaveAttribute('data-performance','on');
  });
});
