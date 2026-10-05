import { ButtonIcon, Icon } from 'UI';

export type EditSaveButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
};

export const EditSaveButton = ({ onClick, disabled, className }: EditSaveButtonProps) => {
  return (
    <ButtonIcon
      icon={<Icon icon="quill" />}
      onClick={onClick}
      disabled={disabled}
      className={className}
    />
  );
};
