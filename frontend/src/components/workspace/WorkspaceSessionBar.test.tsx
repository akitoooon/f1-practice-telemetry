import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WorkspaceSessionBar } from './WorkspaceSessionBar';
import { useSessionListStore } from '../../store/useSessionListStore';
import { makeSessionListItem } from '../../test/wireFactories';

describe('Workspace session bar', () => {
  it('uses the selected recording, showing missing assists explicitly', () => {
    window.history.replaceState(null,'','/dashboard?sa=9');
    useSessionListStore.setState({sessions:[makeSessionListItem({id:9,track_name:'Suzuka',session_type:'Practice 1',ai_difficulty:80})]});
    render(<WorkspaceSessionBar />);
    expect(screen.getByText('Suzuka')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Not recorded')).toBeInTheDocument();
    expect(screen.getByText('RECORDED SESSION')).toBeInTheDocument();
  });
});
