import styled from 'styled-components';
import { InternalButton, InternalFlex, InternalInput, InternalText } from '@tgdf';

import { WorldObjectDefinition, WorldTileCodes } from 'renderer/3D/types';
import { WORLD_TILE_DEFINITIONS, WORLD_PROP_DEFINITIONS } from '3D/worldDefinitions';

import { COLORS } from '../constants';
import { CELL_ROTATIONS } from './const';
import { codeToCssHex } from './utils/codeToCssHex';

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

type DefinitionRowProps = {
  definition: WorldObjectDefinition;
  active: boolean;
  onSelect: (code: number) => void;
};

function DefinitionRow({ definition, active, onSelect }: DefinitionRowProps) {
  return (
    <PaletteRow $active={active} onClick={() => onSelect(definition.code)}>
      <Swatch style={{ background: codeToCssHex(definition.code) }} />
      <InternalFlex direction="column">
        <InternalText size="sm" color={COLORS.FONT_COLOR_HIGHLIGHT}>
          {definition.label}
        </InternalText>
        <InternalText size="xs" color={COLORS.FONT_COLOR_PRIMARY}>
          {codeToCssHex(definition.code)}
        </InternalText>
      </InternalFlex>
    </PaletteRow>
  );
}

type PaletteSectionProps = {
  title: string;
  definitions: WorldObjectDefinition[];
  selectedCode: number;
  onSelectCode: (code: number) => void;
  children?: React.ReactNode;
};

function PaletteSection({
  title,
  definitions,
  selectedCode,
  onSelectCode,
  children,
}: PaletteSectionProps) {
  return (
    <InternalFlex direction="column" gap={8}>
      <InternalText size="lg" weight="semibold" color={COLORS.FONT_COLOR_PRIMARY}>
        {title}
      </InternalText>
      <InternalFlex direction="column" gap={4}>
        {children}
        {definitions.map((definition) => (
          <DefinitionRow
            key={definition.code}
            definition={definition}
            active={selectedCode === definition.code}
            onSelect={onSelectCode}
          />
        ))}
      </InternalFlex>
    </InternalFlex>
  );
}

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
      <PaletteSection
        title="Tiles"
        definitions={WORLD_TILE_DEFINITIONS}
        selectedCode={selectedCode}
        onSelectCode={onSelectCode}
      >
        <PaletteRow
          $active={selectedCode === WorldTileCodes.Empty}
          onClick={() => onSelectCode(WorldTileCodes.Empty)}
        >
          <Swatch style={{ background: 'transparent', borderStyle: 'dashed' }} />
          <InternalText size="sm" color={COLORS.FONT_COLOR_HIGHLIGHT}>
            Eraser
          </InternalText>
        </PaletteRow>
      </PaletteSection>

      <PaletteSection
        title="Props"
        definitions={WORLD_PROP_DEFINITIONS}
        selectedCode={selectedCode}
        onSelectCode={onSelectCode}
      />

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
