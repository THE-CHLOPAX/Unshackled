import { useMemo } from 'react';
import styled from 'styled-components';
import { useGraphicsStore } from '@tgdf';

import { GameUIOverlay } from 'renderer/UI';
import { Player } from 'renderer/3D/classes/gameObjects/players/Player';
import { GameScene } from 'renderer/3D/classes/scenes/GameScene/GameScene';
import { ThreeDViewerPixelated } from 'renderer/UI/components/ThreeDViewerPixelated';
import { ViewerContext, ViewerContextValue } from 'renderer/UI/contexts/ViewerContext';

type SceneViewerProps = {
  scene: GameScene;
  player: Player;
};

export function SceneViewer({ scene, player }: SceneViewerProps) {
  const { resolution } = useGraphicsStore();

  const viewerContextValue = useMemo<ViewerContextValue>(
    () => ({ player, inputType: player.inputType, camera: scene.camera }),
    [player, scene]
  );

  return (
    <ViewerContext.Provider value={viewerContextValue}>
      <Wrapper>
        <ThreeDViewerPixelated
          scene={scene}
          resX={resolution.width}
          resY={resolution.height}
          debug
        />
        <GameUIOverlay
          emitter={scene.options.emitter}
          player={player}
          objectiveType={scene.options.objective?.type}
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
