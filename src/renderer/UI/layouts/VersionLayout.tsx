import styled from 'styled-components';

import { Text } from 'UI';
import { APP_VERSION, COLORS } from 'renderer/constants';

export function VersionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="version-layout">
      {children}
      <VersionLabel size="md" color={COLORS.FONT_COLOR_DIMMED}>
        v.{APP_VERSION}
      </VersionLabel>
    </div>
  );
}

const VersionLabel = styled(Text)`
  position: fixed;
  bottom: 22px;
  right: 22px;
`;
