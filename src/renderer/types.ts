import { Emitter } from '@tgdf';

export type GameEventsMap = {
  'game-over': undefined;
  'level-complete': undefined;
  'player-damage-taken': undefined;
};

export type GameEventsEmitter = Emitter<GameEventsMap>;
