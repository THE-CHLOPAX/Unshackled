import styled from 'styled-components';
import { useCallback, useState } from 'react';

import { saveWorldMap } from '3D/utils/saveWorldMap';
import { loadWorldMap } from '3D/utils/loadWorldMap';
import { WORLD_TILE_DEFINITIONS } from '3D/worldDefinitions';

import { GRADIENTS } from '../constants';
import { WorldGridCanvas } from './WorldGridCanvas';
import { useWorldGrid } from './hooks/useWorldGrid';
import { WorldEditorPalette } from './WorldEditorPalette';
import { BackToViewLayout } from '../ui/layouts/BackToViewLayout';

const FIRST_TILE_CODE = WORLD_TILE_DEFINITIONS[0]?.code ?? 0;

export function WorldEditorView() {
  const grid = useWorldGrid();

  const [selectedCode, setSelectedCode] = useState(FIRST_TILE_CODE);
  const [brushRotation, setBrushRotation] = useState(0);
  const [mapName, setMapName] = useState('untitled');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const paintAt = useCallback(
    (index: number) => grid.paint(index, selectedCode, brushRotation),
    [grid, selectedCode, brushRotation]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus('Saving…');
    const result = await saveWorldMap(mapName, grid.toOutput());
    setSaving(false);
    setSaveStatus(result.ok ? `Saved to ${result.path}` : `Save failed: ${result.error}`);
  }, [mapName, grid]);

  const handleLoad = useCallback(async () => {
    try {
      const result = await loadWorldMap();
      grid.clear();
      grid.paintBatch(Array.from(result.data.values()));
    } catch (error) {
      window.alert(error);
    }
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('Clear the whole grid?')) grid.clear();
  }, [grid]);

  return (
    <BackToViewLayout backToView="MenuView">
      <StyledWrapper>
        <CanvasArea>
          <WorldGridCanvas
            cellsRef={grid.cellsRef}
            version={grid.version}
            gridSize={grid.gridSize}
            paintAt={paintAt}
            eraseAt={grid.erase}
            rotateAt={grid.rotateAt}
          />
        </CanvasArea>

        <PaletteArea>
          <WorldEditorPalette
            selectedCode={selectedCode}
            onSelectCode={setSelectedCode}
            brushRotation={brushRotation}
            onSelectRotation={setBrushRotation}
            mapName={mapName}
            onMapNameChange={setMapName}
            onSave={handleSave}
            onLoad={handleLoad}
            onClear={handleClear}
            saving={saving}
            saveStatus={saveStatus}
          />
        </PaletteArea>
      </StyledWrapper>
    </BackToViewLayout>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  background: ${GRADIENTS.BACKGROUND};
`;

const CanvasArea = styled.div`
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 56px 24px 24px;
`;

const PaletteArea = styled.div`
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  padding: 56px 20px 24px;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
`;
