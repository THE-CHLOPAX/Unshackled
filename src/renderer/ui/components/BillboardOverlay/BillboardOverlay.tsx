import styled from 'styled-components';
import { memo, useCallback } from 'react';

import { BILLBOARD_OVERLAY_ELEMENT_ID } from 'renderer/constants';
import {
  useOverlayStore,
  overlayElementRefs,
  overlayContainerSize,
  OverlayEntry,
} from 'renderer/store/useOverlayStore';

// Single owning React tree for every billboard entity. Mounted once by the 3D viewer;
// individual billboards register themselves via BillboardRenderer -> useOverlayStore
// instead of each mounting their own React root.
export function BillboardOverlay() {
  const entries = useOverlayStore((state) => state.entries);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const updateSize = () => {
      overlayContainerSize.width = node.clientWidth;
      overlayContainerSize.height = node.clientHeight;
    };
    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(node);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <StyledOverlayWrapper id={BILLBOARD_OVERLAY_ELEMENT_ID} ref={containerRef}>
      {Array.from(entries.values()).map((entry) => (
        <BillboardOverlayEntry key={entry.id} entry={entry} />
      ))}
    </StyledOverlayWrapper>
  );
}

// Memoized so that updating one billboard's props (a new `entry` object reference for its
// id) doesn't re-render the others, whose `entry` reference is unchanged.
const BillboardOverlayEntry = memo(function BillboardOverlayEntry({
  entry,
}: {
  entry: OverlayEntry;
}) {
  const { Component, props, id } = entry;

  return (
    <StyledOverlayEntry
      ref={(node) => {
        if (node) {
          overlayElementRefs.set(id, node);
        } else {
          overlayElementRefs.delete(id);
        }
      }}
    >
      <Component {...props} />
    </StyledOverlayEntry>
  );
});

const StyledOverlayWrapper = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

const StyledOverlayEntry = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
`;
