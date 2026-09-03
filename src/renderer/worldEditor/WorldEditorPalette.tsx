import styled from 'styled-components';
import { InternalButton, InternalFlex, InternalInput, InternalText } from '@tgdf';

import { COLORS } from '../constants';
import {
  CELL_ROTATIONS,
  codeToCssHex,
  EMPTY_CELL_CODE,
  WORLD_GEN_TILE_DEFINITIONS,
} from './const';

type WorldEditorPaletteProps = {
  selectedCode: number;
  onSelectCode: (code: number) => void;
  brushRotation: number;
  onSelectRotation: (rotation: number) => void;
  mapName: string;
  onMapNameChange: (name: string) => void;
  onSave: () => void;
  onClear: () => void;
  onLoad: () => void;
  saving: boolean;
  saveStatus: string | null;
};

export function WorldEditorPalette({
  selectedCode,
  onSelectCode,
  brushRotation,
  onSelectRotation,
  mapName,
  onMapNameChange,
  onSave,
  onClear,
  onLoad,
  saving,
  saveStatus,
}: WorldEditorPaletteProps) {
  return (
    <InternalFlex direction="column" gap={16} style={{ width: 260 }}>
      <InternalText size="lg" weight="semibold" color={COLORS.FONT_COLOR_PRIMARY}>
        Tiles
      </InternalText>

      <InternalFlex direction="column" gap={4}>
        <PaletteRow
          $active={selectedCode === EMPTY_CELL_CODE}
          onClick={() => onSelectCode(EMPTY_CELL_CODE)}
        >
          <Swatch style={{ background: 'transparent', borderStyle: 'dashed' }} />
          <InternalText size="sm" color={COLORS.FONT_COLOR_HIGHLIGHT}>
            Eraser
          </InternalText>
        </PaletteRow>

        {WORLD_GEN_TILE_DEFINITIONS.map((definition) => (
          <PaletteRow
            key={definition.code}
            $active={selectedCode === definition.code}
            onClick={() => onSelectCode(definition.code)}
          >
            <Swatch style={{ background: codeToCssHex(definition.code) }} />
            <InternalFlex direction="column">
              <InternalText size="sm" color={COLORS.FONT_COLOR_HIGHLIGHT}>
                {definition.label}
              </InternalText>
              <InternalText size="xs" color={COLORS.FONT_COLOR_PRIMARY}>
                {codeToCssHex(definition.code)}
                {definition.modelId ? ` · ${definition.modelId}` : ' · marker'}
              </InternalText>
            </InternalFlex>
          </PaletteRow>
        ))}
      </InternalFlex>

      <InternalFlex direction="column" gap={6}>
        <InternalText size="sm" weight="medium">
          Brush rotation
        </InternalText>
        <InternalFlex direction="row" gap={4}>
          {CELL_ROTATIONS.map((rotation) => (
            <InternalButton
              key={rotation}
              label={`${rotation}°`}
              variant={brushRotation === rotation ? 'solid' : 'outline'}
              onClick={() => onSelectRotation(rotation)}
            />
          ))}
        </InternalFlex>
        <InternalText size="xs" color={COLORS.FONT_COLOR_DIMMED}>
          Right-drag erases · hover a cell and press R to rotate it
        </InternalText>
      </InternalFlex>

      <InternalFlex direction="column" gap={6}>
        <InternalText size="sm" weight="medium">
          Map name
        </InternalText>
        <InternalInput
          value={mapName}
          onChange={(event) => onMapNameChange(event.target.value)}
          placeholder="untitled"
        />
      </InternalFlex>

      <InternalFlex direction="row" gap={8}>
        <InternalButton label="Load" onClick={onLoad} />
        <InternalButton label={saving ? 'Saving…' : 'Save'} onClick={onSave} disabled={saving} />
        <InternalButton label="Clear" variant="outline" onClick={onClear} />
      </InternalFlex>

      {saveStatus ? (
        <InternalText size="xs" color={COLORS.FONT_COLOR_DIMMED} style={{ wordBreak: 'break-all' }}>
          {saveStatus}
        </InternalText>
      ) : null}
    </InternalFlex>
  );
}

const PaletteRow = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border: 1px solid ${({ $active }) => ($active ? COLORS.GOLDEN : 'rgba(255, 255, 255, 0.12)')};
  background: ${({ $active }) => ($active ? COLORS.BG_COLOR_HIGHLIGHTED : 'transparent')};
  cursor: pointer;
  text-align: left;
`;

const Swatch = styled.span`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.4);
`;
