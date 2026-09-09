import Stats from 'stats.js';
import * as THREE from 'three';
import { useEffect, useState, useRef } from 'react';

export type RendererState = {
  resolutionX: number;
  resolutionY: number;
  antialiasing: boolean;
  sceneObjects?: number;
  drawCalls?: number;
  triangles?: number;
  geometries?: number;
  textures?: number;
  programsCount?: number;
};

export type ThreeDViewerDebugInfoProps = {
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene;
  onStatsChange: (stats: Stats | null) => void;
};

export function ThreeDViewerDebugInfo({
  renderer,
  scene,
  onStatsChange,
}: ThreeDViewerDebugInfoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [debugState, setDebugState] = useState<RendererState | null>(null);

  useEffect(() => {
    if (!renderer) {
      setDebugState(null);
      return;
    }

    const updateDebugStats = () => {
      const size = renderer.getSize(new THREE.Vector2());
      setDebugState({
        resolutionX: size.x,
        resolutionY: size.y,
        sceneObjects: scene.children.length,
        antialiasing: renderer.getContext().getContextAttributes()?.antialias || false,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        programsCount: renderer.info.programs?.length ?? 0,
      });
    };

    const interval = setInterval(updateDebugStats, 100);
    updateDebugStats();
    return () => clearInterval(interval);
  }, [renderer, scene]);

  useEffect(() => {
    if (!ref.current) return;
    const stats = new Stats();
    stats.dom.style.position = 'static';
    ref.current.prepend(stats.dom);
    onStatsChange(stats);
    return () => {
      stats.dom.remove();
      onStatsChange(null);
    };
  }, [onStatsChange]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        zIndex: 1,
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '10px',
        color: 'white',
        fontSize: '10px',
      }}
    >
      <br />
      {debugState &&
        Object.entries(debugState)
          .slice(0, 2)
          .map(([key, value]) => <pre key={key} style={{ margin: 0 }}>{`${key}: ${value}`}</pre>)}
      <br />
      {debugState &&
        Object.entries(debugState)
          .slice(3)
          .map(([key, value]) => <pre key={key} style={{ margin: 0 }}>{`${key}: ${value}`}</pre>)}
    </div>
  );
}
