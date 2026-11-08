import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardCoach } from './DashboardCoach';
import { RaceEngineerStreamContext } from '../../context/RaceEngineerContext';

vi.mock('../../context/RaceEngineerContext', async importOriginal => {
  const mod = await importOriginal<typeof import('../../context/RaceEngineerContext')>();
  return {...mod};
});

describe('Dashboard coach evidence', () => {
  it('shows a real reply only for the exact selected laps, excluding greetings and other comparisons', () => {
    const messages = [{id:'a',role:'assistant' as const,content:'Review the braking trace at T1.',timestamp:new Date(),context:{context_mode:'comparator' as const,lap_a_id:11,lap_b_id:12}}];
    const {rerender} = render(<RaceEngineerStreamContext.Provider value={{messages,isGenerating:false}}><DashboardCoach lapA={11} lapB={12} /></RaceEngineerStreamContext.Provider>);
    expect(screen.getByText('Review the braking trace at T1.')).toBeInTheDocument();
    rerender(<RaceEngineerStreamContext.Provider value={{messages,isGenerating:false}}><DashboardCoach lapA={11} lapB={13} /></RaceEngineerStreamContext.Provider>);
    expect(screen.queryByText('Review the braking trace at T1.')).not.toBeInTheDocument();
    expect(screen.getByText('No analysis generated')).toBeInTheDocument();
  });
});
