import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PracticeDashboard } from './PracticeDashboard';
import { useSessionListStore } from '../../store/useSessionListStore';
import { invalidateSessionLapData } from '../../utils/sessionDataCache';
import { api } from '../../utils/apiClient';
import { makeLap, makeParticipant, makeSessionListItem } from '../../test/wireFactories';

vi.mock('../../hooks/useLiveRadio', () => ({ useLiveRadio: () => ({}) }));
vi.mock('../../hooks/useLiveStatus', () => ({ useLiveStatus: () => 'listening' }));

describe('MORE PACE Dashboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSessionListStore.getState().reset();
    invalidateSessionLapData();
  });

  it('keeps all six analysis areas visible without inventing values or advice', async () => {
    vi.spyOn(api, 'get').mockResolvedValue([]);
    render(<PracticeDashboard />);
    for (const name of ['Session Summary', 'AI Coach', 'Lap Comparison', 'Corner Delta', 'Telemetry Comparison', 'Vehicle & Session Status']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    await screen.findByText('No session selected');
    expect(screen.getByRole('button', { name: 'Analyze selected laps' })).toBeDisabled();
    expect(screen.getByText('Waiting for vehicle data')).toBeInTheDocument();
    expect(screen.queryByText(/1:2[0-9]/)).not.toBeInTheDocument();
  });

  it('loads recorded laps through the existing API, calculates A minus B and clears on session change', async () => {
    const sessions = [makeSessionListItem({id: 1, track_name: 'Suzuka'}), makeSessionListItem({id: 2, track_name: 'Monaco'})];
    const laps = [makeLap({id: 11, session_id: 1, car_index: 0, lap_number: 1, lap_time_ms: 90000, is_valid: true}),
      makeLap({id: 12, session_id: 1, car_index: 0, lap_number: 2, lap_time_ms: 91000, is_valid: true})];
    vi.spyOn(api, 'get').mockImplementation(async (path) => {
      if (path === '/api/sessions') return sessions;
      if (path === '/api/sessions/1/laps') return laps;
      if (path === '/api/sessions/1/participants') return [makeParticipant({car_index: 0, name: 'Driver'})];
      if (path === '/api/comparator/merge') return {points: [], turns: []};
      return [];
    });
    render(<PracticeDashboard />);
    await screen.findByRole('option', { name: /Suzuka/ });
    fireEvent.change(screen.getByLabelText('Recorded session'), {target: {value: '1'}});
    await waitFor(() => expect(screen.getByLabelText('Lap A · reference')).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Lap A · reference'), {target: {value: '12'}});
    fireEvent.change(screen.getByLabelText('Lap B · comparison'), {target: {value: '11'}});
    await screen.findByText('+1.000 s');
    expect(screen.getByText('No telemetry to compare')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Recorded session'), {target: {value: '2'}});
    await waitFor(() => expect(screen.queryByText('+1.000 s')).not.toBeInTheDocument());
    expect(screen.queryByRole('option', {name: /Driver/})).not.toBeInTheDocument();
  });

  it('shows API failures and offers a session refresh', async () => {
    const get = vi.spyOn(api, 'get').mockRejectedValue(new Error('Server unavailable'));
    render(<PracticeDashboard />);
    await screen.findByText('Sessions unavailable');
    expect(screen.getAllByText('Server unavailable').length).toBeGreaterThan(0);
    get.mockResolvedValue([]);
    fireEvent.click(screen.getByRole('button', {name: 'Refresh sessions'}));
    await screen.findByText('No session selected');
  });
});
