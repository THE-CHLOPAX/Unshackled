import styled from 'styled-components';
import { useGraphicsStore } from '@tgdf';
import { useMemo, useState } from 'react';

import { FMOD_EVENTS, FMODAudio } from 'renderer/FMOD';
import { TestScene } from '3D/classes/scenes/TestScene';
import { useLoadScene } from 'renderer/hooks/useLoadScene';
import { BackToViewLayout } from 'UI/layouts/BackToViewLayout';
import { createEventLoggerSource, EventLogger, GameUIOverlay } from 'UI';
import { ThreeDViewerPixelated } from 'UI/components/ThreeDViewerPixelated';

import { LoadingView } from './LoadingView';

export function TestView() {
  const { resolution } = useGraphicsStore();
  const { scene, loadingProgress, emitter } = useLoadScene((emitter) => new TestScene(emitter));

  const [loadingFinished, setLoadingFinished] = useState(false);

  const eventLoggerSources = useMemo(() => {
    return [
      createEventLoggerSource(
        FMODAudio.events,
        ['event-started', 'event-stopped', 'event-failed'],
        (entry) => {
          if (
            entry.payload.eventPath !== FMOD_EVENTS.GENERIC_SPAWN.path &&
            entry.payload.eventPath !== FMOD_EVENTS.DOOR_SCREECH.path &&
            entry.payload.eventPath !== FMOD_EVENTS.GENERIC_PRE_SPAWN.path
          ) {
            return null;
          }
          switch (entry.event) {
            case 'event-started':
              return `Started: ${entry.payload.eventPath}`;
            case 'event-stopped':
              return `Stopped: ${entry.payload.eventPath}`;
            case 'event-failed':
              return `Failed: ${entry.payload.eventPath}`;
          }
        }
      ),
    ];
  }, []);

  return (
    <BackToViewLayout backToView="MenuView">
      {!loadingFinished || scene === null ? (
        <LoadingView progress={loadingProgress} onComplete={() => setLoadingFinished(true)} />
      ) : (
        <>
          <ThreeDViewerPixelated
            scene={scene}
            resX={resolution.width}
            resY={resolution.height}
            debug
          />
          <GameUIOverlay emitter={emitter} />
          <EventLoggerStyled sources={eventLoggerSources} />
        </>
      )}
    </BackToViewLayout>
  );
}

const EventLoggerStyled = styled(EventLogger)`
  position: absolute;
  bottom: 22px;
  left: 22px;
  height: 200px;
  width: 500px;
`;
