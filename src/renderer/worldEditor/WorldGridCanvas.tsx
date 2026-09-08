import styled from 'styled-components';
import { useCallback, useEffect, useRef, useState } from 'react';

import { vec2toIndex } from '3D/utils/vec2ToIndex';
import { WorldCell, WorldTileCodes } from '3D/types';

import { codeToCssHex } from './utils/codeToCssHex';

const CELL_PX = 12;
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.12)';
const ROTATION_TICK_COLOR = 'rgba(255, 255, 255, 0.85)';
const HOVER_COLOR = 'rgba(255, 255, 255, 0.6)';
const EMPTY_FILL = '#1b1712';

type WorldGridCanvasProps = {
  cellsRef: React.MutableRefObject<WorldCell[]>;
  version: number;
  gridSize: number;
  paintAt: (index: number) => void;
  eraseAt: (index: number) => void;
  rotateAt: (index: number) => void;
};

function drawRotationTick(
  ctx: CanvasRenderingContext2D,
  col: number,
  row: number,
  rotation: number
): void {
  const centerX = col * CELL_PX + CELL_PX / 2;
  const centerY = row * CELL_PX + CELL_PX / 2;
  const reach = CELL_PX / 2 - 1;

  const offsets: Record<number, [number, number]> = {
    0: [0, -reach],
    90: [reach, 0],
    180: [0, reach],
    270: [-reach, 0],
  };
  const [dx, dy] = offsets[((rotation % 360) + 360) % 360] ?? offsets[0];

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + dx, centerY + dy);
  ctx.stroke();
}

export function WorldGridCanvas({
  cellsRef,
  version,
  gridSize,
  paintAt,
  eraseAt,
  rotateAt,
}: WorldGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintingButtonRef = useRef<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);

  hoveredIndexRef.current = hoveredIndex;

  const pixelSize = gridSize * CELL_PX;

  const indexFromEvent = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((event.clientX - rect.left) / CELL_PX);
      const row = Math.floor((event.clientY - rect.top) / CELL_PX);
      if (col < 0 || row < 0 || col >= gridSize || row >= gridSize) return null;

      return vec2toIndex(col, row, gridSize);
    },
    [gridSize]
  );

  const applyAt = useCallback(
    (index: number, button: number) => {
      if (button === 2) {
        eraseAt(index);
      } else {
        paintAt(index);
      }
    },
    [paintAt, eraseAt]
  );

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    const cells = cellsRef.current;

    ctx.fillStyle = EMPTY_FILL;
    ctx.fillRect(0, 0, pixelSize, pixelSize);

    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      if (cell.code === WorldTileCodes.Empty) continue;

      const col = index % gridSize;
      const row = Math.floor(index / gridSize);

      ctx.fillStyle = codeToCssHex(cell.code);
      ctx.fillRect(col * CELL_PX, row * CELL_PX, CELL_PX, CELL_PX);
    }

    ctx.strokeStyle = ROTATION_TICK_COLOR;
    ctx.lineWidth = 2;
    for (let index = 0; index < cells.length; index++) {
      const cell = cells[index];
      if (cell.code === WorldTileCodes.Empty) continue;
      drawRotationTick(ctx, index % gridSize, Math.floor(index / gridSize), cell.rotation);
    }

    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 1;
    for (let line = 0; line <= gridSize; line++) {
      const position = line * CELL_PX + 0.5;
      ctx.beginPath();
      ctx.moveTo(position, 0);
      ctx.lineTo(position, pixelSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, position);
      ctx.lineTo(pixelSize, position);
      ctx.stroke();
    }

    if (hoveredIndex !== null) {
      ctx.strokeStyle = HOVER_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        (hoveredIndex % gridSize) * CELL_PX + 1,
        Math.floor(hoveredIndex / gridSize) * CELL_PX + 1,
        CELL_PX - 2,
        CELL_PX - 2
      );
    }
  }, [version, gridSize, pixelSize, cellsRef, hoveredIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r') return;
      const hoveredIndex = hoveredIndexRef.current;
      if (hoveredIndex !== null) rotateAt(hoveredIndex);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rotateAt]);

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const index = indexFromEvent(event);
    if (index === null) return;
    paintingButtonRef.current = event.button;
    event.currentTarget.setPointerCapture(event.pointerId);
    applyAt(index, event.button);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const index = indexFromEvent(event);
    setHoveredIndex((current) => (current === index ? current : index));

    if (paintingButtonRef.current !== null && index !== null) {
      applyAt(index, paintingButtonRef.current);
    }
  };

  const stopPainting = (event: React.PointerEvent<HTMLCanvasElement>) => {
    paintingButtonRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <StyledCanvas
      ref={canvasRef}
      width={pixelSize}
      height={pixelSize}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopPainting}
      onPointerLeave={() => setHoveredIndex(null)}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}

const StyledCanvas = styled.canvas`
  display: block;
  image-rendering: pixelated;
  touch-action: none;
  cursor: crosshair;
`;
