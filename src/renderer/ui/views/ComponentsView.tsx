import { useState } from 'react';
import styled from 'styled-components';
import { InternalFlex, InternalText } from '@tgdf';

import {
  Button,
  ButtonIcon,
  Banner,
  Checkbox,
  Text,
  TextInput,
  Dropdown,
  SmallPanel,
  BarSimple,
  BarOrnament,
  ScrollableWrapper,
  PanelScalable,
} from 'UI';

import { COLORS, GRADIENTS } from '../../constants';
import { BackToViewLayout } from '../layouts/BackToViewLayout';

const TEXT_SIZES = ['sm', 'md', 'lg', 'xl', 'xxl'] as const;
const DROPDOWN_OPTIONS = [
  { label: 'Option 1', value: 'option-1' },
  { label: 'Option 2', value: 'option-2' },
  { label: 'Option 3', value: 'option-3' },
];
const TEXT_COLOR_SAMPLES = [
  { name: 'Font color primary', value: COLORS.FONT_COLOR_PRIMARY },
  { name: 'Font color highlight', value: COLORS.FONT_COLOR_HIGHLIGHT },
  { name: 'Font color dimmed', value: COLORS.FONT_COLOR_DIMMED },
  { name: 'Golden', value: COLORS.GOLDEN },
] as const;

type ComponentSectionProps = {
  title: string;
  children: React.ReactNode;
};

function ComponentSection({ title, children }: ComponentSectionProps) {
  return (
    <InternalFlex
      direction="column"
      align="center"
      gap={15}
      style={{ width: '100%', maxWidth: '800px' }}
    >
      <InternalText size="lg" weight="semibold" color={COLORS.FONT_COLOR_PRIMARY}>
        {title}
      </InternalText>
      <InternalFlex
        direction="column"
        align="center"
        justify="center"
        gap={15}
        style={{
          width: '100%',
          padding: '20px',
          border: `1px solid ${COLORS.FONT_COLOR_DIMMED}`,
          background: COLORS.BG_COLOR_HIGHLIGHTED,
        }}
      >
        {children}
      </InternalFlex>
    </InternalFlex>
  );
}

export function ComponentsView() {
  const [dropdownValue, setDropdownValue] = useState<string | undefined>(undefined);
  const [checked, setChecked] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <BackToViewLayout backToView="MenuView">
      <StyledScrollableWrapper>
        <InternalFlex
          direction="column"
          align="center"
          gap={40}
          style={{
            padding: '80px 20px',
            background: GRADIENTS.BACKGROUND,
          }}
        >
          <Text size="xl" color={COLORS.FONT_COLOR_PRIMARY}>
            Components
          </Text>
          <ComponentSection title="Button">
            <InternalFlex gap={20} align="center">
              <Button label="Button" onClick={() => {}} />
              <Button label="Disabled" onClick={() => {}} disabled />
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="Banner">
            <InternalFlex gap={20} align="center" wrap="wrap">
              <Banner label="Game Over" />
              <Banner label="Victory" />
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="Dropdown">
            <InternalFlex gap={20} align="start">
              <Dropdown
                options={DROPDOWN_OPTIONS}
                value={dropdownValue}
                onChange={setDropdownValue}
                placeholder="Select..."
              />
              <Dropdown options={DROPDOWN_OPTIONS} placeholder="Disabled" disabled />
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="Panel">
            <InternalFlex gap={20} align="start" wrap="wrap">
              <PanelScalable>{''}</PanelScalable>

              <PanelScalable>
                <Text nowrap>Short</Text>
              </PanelScalable>

              <PanelScalable>
                <Text>A somewhat longer piece of panel content</Text>
              </PanelScalable>

              <PanelScalable style={{ width: '300px' }}>
                <Text>
                  This panel has an explicit width, so its content wraps across multiple lines while
                  the border segments stretch to match.
                </Text>
              </PanelScalable>

              <PanelScalable>
                <Button label="Button" />
              </PanelScalable>
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="Bars">
            <Text>Bar Simple</Text>
            <InternalFlex direction="column" align="start" gap={12}>
              <BarSimple progress={1} fillColor={COLORS.SOFT_FAWN} />
              <BarSimple progress={0.6} fillColor="#c0392b" scale={2} />
              <BarSimple progress={0.2} fillColor="#3498db" scale={1.5} />
            </InternalFlex>
            <br />
            <Text>Bar Simple (short)</Text>
            <InternalFlex direction="column" align="start" gap={12}>
              <BarSimple short progress={1} fillColor={COLORS.SOFT_FAWN} />
              <BarSimple short progress={0.6} fillColor="#c0392b" scale={2} />
              <BarSimple short progress={0.2} fillColor="#3498db" scale={1.5} />
            </InternalFlex>
            <br />
            <Text>Bar Ornament</Text>
            <InternalFlex direction="column" align="start" gap={12}>
              <BarOrnament progress={1} fillColor={COLORS.SOFT_FAWN} />
              <BarOrnament progress={0.6} fillColor="#c0392b" scale={2} />
              <BarOrnament progress={0.2} fillColor="#3498db" scale={1.5} />
            </InternalFlex>
            <br />
            <Text>Bar Ornament (short)</Text>
            <InternalFlex direction="column" align="start" gap={12}>
              <BarOrnament short progress={1} fillColor={COLORS.SOFT_FAWN} />
              <BarOrnament short progress={0.6} fillColor="#c0392b" scale={2} />
              <BarOrnament short progress={0.2} fillColor="#3498db" scale={1.5} />
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="SmallPanel">
            <InternalFlex gap={20} align="center">
              <SmallPanel>{''}</SmallPanel>
              <SmallPanel active>{''}</SmallPanel>
              <SmallPanel>
                <Text size="sm">i</Text>
              </SmallPanel>
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="ButtonIcon">
            <InternalFlex gap={20} align="center">
              <ButtonIcon icon={<Text size="sm">+</Text>} onClick={() => {}} />
              <ButtonIcon icon={<Text size="sm">+</Text>} onClick={() => {}} disabled />
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="Checkbox">
            <InternalFlex gap={20} align="center">
              <Checkbox checked={checked} onChange={setChecked} />
              <Checkbox checked disabled />
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="TextInput">
            <InternalFlex gap={20} align="center">
              <TextInput value={inputValue} onChange={setInputValue} placeholder="Your name" />
              <TextInput value="Disabled" disabled />
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="Scrollbar">
            <InternalFlex gap={20} align="start" wrap="wrap">
              <div style={{ height: '150px', width: '220px' }}>
                <ScrollableWrapper direction="vertical">
                  <InternalFlex direction="column" gap={10} style={{ padding: '4px' }}>
                    {Array.from({ length: 20 }, (_, i) => (
                      <Text key={i} nowrap>
                        Line {i + 1} of scrollable content
                      </Text>
                    ))}
                  </InternalFlex>
                </ScrollableWrapper>
              </div>

              <div style={{ height: '90px', width: '300px' }}>
                <ScrollableWrapper direction="horizontal">
                  <InternalFlex gap={10} style={{ padding: '4px', width: 'max-content' }}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <Text key={i} nowrap>
                        Item {i + 1}
                      </Text>
                    ))}
                  </InternalFlex>
                </ScrollableWrapper>
              </div>
            </InternalFlex>
          </ComponentSection>

          <ComponentSection title="Text">
            <InternalFlex direction="column" align="start" gap={10}>
              {TEXT_SIZES.map((size) => (
                <Text key={size} size={size}>
                  {size.toUpperCase()} — The quick brown fox
                </Text>
              ))}
            </InternalFlex>

            <InternalFlex direction="column" align="start" gap={10}>
              {TEXT_COLOR_SAMPLES.map(({ name, value }) => (
                <Text key={name} color={value}>
                  {name} — {value}
                </Text>
              ))}
            </InternalFlex>
          </ComponentSection>
        </InternalFlex>
      </StyledScrollableWrapper>
    </BackToViewLayout>
  );
}

const StyledScrollableWrapper = styled(ScrollableWrapper)`
  background: ${COLORS.BG_COLOR};
  width: 100vw;
  height: 100vh;
`;
