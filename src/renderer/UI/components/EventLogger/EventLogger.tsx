import type { CSSProperties } from 'react';

import styled from 'styled-components';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { TextSize } from 'UI/types';

import { Text } from '../Text/Text';
import { PanelScalable } from '../PanelScalable/PanelScalable';
import { ScrollableWrapper } from '../ScrollableWrapper/ScrollableWrapper';

const DEFAULT_MAX_MESSAGES = 100;

type LogMessage = {
  id: number;
  text: string;
};

export type EventLoggerEntry<T, K extends keyof T> = {
  [E in K]: { event: E; payload: T[E] };
}[K];

export type EventLoggerFormatter<T, K extends keyof T> = (entry: EventLoggerEntry<T, K>) => string;

export type EventLoggerSource = {
  subscribe: (log: (text: string) => void) => () => void;
};

export type EventLoggerProps = {
  sources: readonly EventLoggerSource[];
  maxMessages?: number;
  textSize?: TextSize;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

export const EventLogger = ({
  sources,
  maxMessages = DEFAULT_MAX_MESSAGES,
  textSize = 'md',
  color,
  className,
  style,
}: EventLoggerProps) => {
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const nextIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = (text: string) => {
      const id = nextIdRef.current++;
      setMessages((prev) => [...prev, { id, text }].slice(-maxMessages));
    };
    const unsubscribes = sources.map((source) => source.subscribe(log));
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [sources, maxMessages]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  return (
    <Wrapper className={className} style={style} color={color}>
      <ScrollableWrapper>
        <MessagesList>
          {messages.map(({ id, text }) => (
            <Text key={id} size={textSize}>
              {text}
            </Text>
          ))}
          <div ref={bottomRef} />
        </MessagesList>
      </ScrollableWrapper>
    </Wrapper>
  );
};

const Wrapper = styled(PanelScalable)`
  position: relative;
  width: 400px;
  height: 200px;

  > .panel-scalable-content {
    height: 100%;
    width: 100%;
    padding-block: 0px;
    padding-inline: 20px;
  }

  .scrollable-track-vertical {
    position: relative;
    margin-left: -2px;
    left: 8px;
    padding-block: 16px;
  }
`;

const MessagesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-block: 18px;
  word-break: break-word;
`;
