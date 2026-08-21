import { useMemo } from 'react';
import {
  useSoundsStore,
  useGraphicsStore,
  MAIN_SOUND_CHANNEL,
  AVAILABLE_RESOLUTIONS,
  setChannelVolume,
  InternalCheckbox,
  InternalFlex,
  InternalSelect,
  InternalSlider,
  InternalText,
  setChannelMuted,
} from '@tgdf';

import { COLORS, GRADIENTS } from '../../constants';
import { BackToViewLayout } from '../layouts/BackToViewLayout';

export function SettingsView() {
  const { soundChannels } = useSoundsStore();

  const mainVolumeChannel = useMemo(() => soundChannels.get(MAIN_SOUND_CHANNEL), [soundChannels]);

  const { fullscreen, resolution, antialiasing, setResolution, setFullscreen, setAntialiasing } =
    useGraphicsStore();

  return (
    <BackToViewLayout backToView="MenuView">
      <InternalFlex
        direction="column"
        align="center"
        justify="center"
        style={{ gap: '20px', background: GRADIENTS.BACKGROUND, height: '100vh' }}
      >
        <InternalText size="xl" weight="bold" color={COLORS.FONT_COLOR_PRIMARY}>
          Settings
        </InternalText>

        {/* Resolution Selector */}
        <InternalFlex direction="row" justify="between" gap={10} align="center">
          <InternalText size="lg" color={COLORS.FONT_COLOR_PRIMARY}>
            Resolution:
          </InternalText>
          <InternalSelect
            options={AVAILABLE_RESOLUTIONS.map((res) => ({
              value: res,
              label: `${res.width} x ${res.height}`,
            }))}
            value={resolution}
            onChange={(value) => {
              setResolution(value);
            }}
          />
        </InternalFlex>

        {/* Fullscreen Toggle */}
        <InternalFlex direction="row" justify="between" gap={10} align="center">
          <InternalText size="lg" color={COLORS.FONT_COLOR_PRIMARY}>
            Fullscreen:
          </InternalText>
          <InternalCheckbox checked={fullscreen} onChange={() => setFullscreen(!fullscreen)} />
        </InternalFlex>

        {/* Antialiasing Toggle */}
        <InternalFlex direction="row" justify="between" gap={10} align="center">
          <InternalText size="lg" color={COLORS.FONT_COLOR_PRIMARY}>
            Antialiasing:
          </InternalText>
          <InternalCheckbox
            checked={antialiasing}
            onChange={() => setAntialiasing(!antialiasing)}
          />
        </InternalFlex>

        {/* Main volume slider */}
        <InternalFlex direction="column" align="center" justify="center" style={{ width: '150px' }}>
          <InternalText size="lg" color={COLORS.FONT_COLOR_PRIMARY}>
            Main Volume: {mainVolumeChannel?.volume}
          </InternalText>
          <InternalSlider
            value={mainVolumeChannel?.volume}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(value) => {
              setChannelVolume(MAIN_SOUND_CHANNEL, value);
            }}
          />
          <InternalCheckbox
            checked={mainVolumeChannel?.muted ?? false}
            onChange={() => setChannelMuted(MAIN_SOUND_CHANNEL, !mainVolumeChannel?.muted)}
          />
        </InternalFlex>
      </InternalFlex>
    </BackToViewLayout>
  );
}
