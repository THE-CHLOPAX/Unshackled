import styled from 'styled-components';
import { useGraphicsStore } from '@tgdf';
import { useCallback, useMemo } from 'react';

import { GameUIOverlay } from 'renderer/UI';
import { Player } from 'renderer/3D/classes/gameObjects/players/Player';
import { GameScene } from 'renderer/3D/classes/scenes/GameScene/GameScene';
import { ThreeDViewerPixelated } from 'renderer/UI/components/ThreeDViewerPixelated';
import { BillboardLayer } from 'renderer/UI/components/BillboardLayer/BillboardLayer';
import { ViewerContext, ViewerContextValue } from 'renderer/UI/contexts/ViewerContext';
import { BillboardView } from 'renderer/3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';

type SceneViewerProps = {
  scene: GameScene;
  player: Player;
  isGameOver: boolean;
};

export function SceneViewer({ scene, player, isGameOver }: SceneViewerProps) {
  const { resolution } = useGraphicsStore();

  const viewerContextValue = useMemo<ViewerContextValue>(
    () => ({ player, inputType: player.inputType, camera: scene.camera }),
    [player, scene]
  );

  const billboardView = useMemo(() => new BillboardView(scene.billboards), [scene]);

  const handleAfterRender = useCallback(() => {
    billboardView.updatePositions(viewerContextValue.camera);
  }, [billboardView, viewerContextValue]);

  return (
    <ViewerContext.Provider value={viewerContextValue}>
      <Wrapper>
        <ThreeDViewerPixelated
          scene={scene}
          resX={resolution.width}
          resY={resolution.height}
          overlay={<BillboardLayer view={billboardView} />}
          onAfterRender={handleAfterRender}
          debug
        />
        <GameUIOverlay
          emitter={scene.options.emitter}
          player={player}
          objectiveType={scene.options.objective?.type}
          isGameOver={isGameOver}
        />
      </Wrapper>
    </ViewerContext.Provider>
  );
}

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;
