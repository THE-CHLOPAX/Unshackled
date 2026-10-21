import { assert, logger } from '@tgdf';

import { useRunStore } from 'Store/useRunStore';
import { LevelSession } from 'Views/GameView/LevelSession';
import { VersionLayout } from 'Views/layouts/VersionLayout';
import { writeSaveFile } from 'renderer/utils/writeSaveFile';
import { getUpdatedRun } from 'renderer/utils/getUpdatedRun';
import { Player } from '3D/classes/gameObjects/Player/Player';
import { BackToViewLayout } from 'Views/layouts/BackToViewLayout';

export function GameView() {
  const { currentRun, setCurrentRun } = useRunStore();
  const progress = currentRun?.progress;

  const handleLevelComplete = (levelId: string, players?: readonly Player[]) => {
    assert(currentRun, 'No current run found');
    assert(players && players.length > 0, 'No active players found');

    const updatedRun = getUpdatedRun(currentRun, levelId, players);

    setCurrentRun(updatedRun);
    writeSaveFile(updatedRun).catch((error) => {
      logger({ message: 'Failed to save run progress: ' + error.message, type: 'error' });
    });
  };

  return (
    <BackToViewLayout backToView="MenuView" backToViewProps={{ reloadSaveFiles: true }}>
      <VersionLayout>
        {progress && (
          <LevelSession
            key={`${progress.biomeId}:${progress.levelIndex}`}
            progress={progress}
            onLevelComplete={handleLevelComplete}
          />
        )}
      </VersionLayout>
    </BackToViewLayout>
  );
}
