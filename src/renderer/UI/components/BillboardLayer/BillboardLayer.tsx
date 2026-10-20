import styled from 'styled-components';
import { memo, useCallback, useEffect, useSyncExternalStore } from 'react';

import { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';
import { BillboardEntry } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardRegistry';

export type BillboardLayerProps = {
  view: BillboardView;
};

export function BillboardLayer({ view }: BillboardLayerProps) {
  const { registry } = view;
  const entries = useSyncExternalStore(registry.subscribe, registry.getSnapshot);

  useEffect(() => {
    view.attach();
    return () => {
      view.detach();
    };
  }, [view]);

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      const updateSize = () => {
        view.setSize(node.clientWidth, node.clientHeight);
      };
      updateSize();

      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(node);

      return () => {
        resizeObserver.disconnect();
      };
    },
    [view]
  );

  return (
    <StyledLayerWrapper ref={containerRef}>
      {entries.map((entry) => (
        <BillboardLayerEntry key={entry.id} entry={entry} view={view} />
      ))}
    </StyledLayerWrapper>
  );
}

const BillboardLayerEntry = memo(function BillboardLayerEntry({
  entry,
  view,
}: {
  entry: BillboardEntry;
  view: BillboardView;
}) {
  const { Component, props, id } = entry;

  const nodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      view.setNode(id, node);
    },
    [view, id]
  );

  return (
    <StyledLayerEntry ref={nodeRef}>
      <Component {...props} />
    </StyledLayerEntry>
  );
});

const StyledLayerWrapper = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`;

const StyledLayerEntry = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
`;
