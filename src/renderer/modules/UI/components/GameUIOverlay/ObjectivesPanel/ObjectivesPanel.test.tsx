import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { OBJECTIVE_LABELS } from 'renderer/constants';
import { ObjectivesPanel } from 'UI/components/GameUIOverlay/ObjectivesPanel/ObjectivesPanel';
import {
  OBJECTIVE_ENTITIES_KILLED,
  OBJECTIVE_SURVIVED_TIME,
} from '3D/classes/scenes/GameScene/ProgressTracker/constants';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

describe('ObjectivesPanel', () => {
  it('shows the title and the label for the current objective', () => {
    render(<ObjectivesPanel objectiveType={OBJECTIVE_ENTITIES_KILLED} />);

    expect(screen.getByText('Objectives')).toBeTruthy();
    expect(screen.getByText(`• ${OBJECTIVE_LABELS[OBJECTIVE_ENTITIES_KILLED]}`)).toBeTruthy();
  });

  it('shows the label matching the objective type', () => {
    render(<ObjectivesPanel objectiveType={OBJECTIVE_SURVIVED_TIME} />);

    expect(screen.getByText(`• ${OBJECTIVE_LABELS[OBJECTIVE_SURVIVED_TIME]}`)).toBeTruthy();
  });
});
