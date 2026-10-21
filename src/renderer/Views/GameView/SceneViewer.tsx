import styled from 'styled-components';
import { useGraphicsStore } from '@tgdf';
import { useCallback, useMemo } from 'react';

import { GameUIOverlay } from 'UI';
import { Player } from '3D/classes/gameObjects/Player/Player';
import { GameScene } from '3D/classes/scenes/GameScene/GameScene';
import { ThreeDViewerPixelated } from 'UI/components/ThreeDViewerPixelated';
import { BillboardLayer } from 'UI/components/BillboardLayer/BillboardLayer';
import { ViewerContext, ViewerContextValue } from 'UI/contexts/ViewerContext';
import { BillboardView } from '3D/classes/scenes/GameScene/BillboardRegistry/BillboardView';

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
