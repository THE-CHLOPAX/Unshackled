import { logger } from '@tgdf';

import { ButtonIcon, Icon } from 'UI';
import { removeSaveFile } from 'renderer/utils/removeSaveFile';

export type DeleteSaveButtonProps = {
  runId: string;
  onDeleted?: () => void;
  disabled?: boolean;
  className?: string;
};

export const DeleteSaveButton = ({
  runId,
  onDeleted,
  disabled,
  className,
}: DeleteSaveButtonProps) => {
  const handleClick = () => {
    removeSaveFile(runId)
      .then(() => onDeleted?.())
      .catch((error) => {
        logger({ message: 'Failed to remove save file: ' + error.message, type: 'error' });
      });
  };

  return (
    <ButtonIcon
      icon={<Icon icon="trashCan" />}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    />
  );
};
