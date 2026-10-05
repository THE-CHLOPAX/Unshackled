import { useMemo } from 'react';
import { ThreeDViewer, ThreeDViewerProps } from '@tgdf';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { RenderPixelatedPass } from 'three/examples/jsm/postprocessing/RenderPixelatedPass';

import { BillboardOverlay } from './BillboardOverlay/BillboardOverlay';

const PIXEL_SIZE = 4;

export function ThreeDViewerPixelated({
  scene,
  resX,
  resY,
  debug,
  isPaused,
}: ThreeDViewerProps & {
  resX: number;
  resY: number;
}) {
  const postProcessingPassesMemo = useMemo(() => {
    const renderPixelatedPass = new RenderPixelatedPass(PIXEL_SIZE, scene, scene.camera, {
      depthEdgeStrength: 0.7,
      normalEdgeStrength: 0.3,
    });
    const outputPass = new OutputPass();
    return [renderPixelatedPass, outputPass];
  }, []);

  return (
    <ThreeDViewer
      scene={scene}
      debug={debug}
      resX={resX}
      resY={resY}
      isPaused={isPaused}
      postProcessingPasses={postProcessingPassesMemo}
      overlay={<BillboardOverlay />}
    />
  );
}
