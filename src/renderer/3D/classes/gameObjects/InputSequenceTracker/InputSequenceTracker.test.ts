import type { State } from '3D/classes/states';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PlayerActionType, SequenceInputType, SequenceSkill } from '3D/types';

import { InputSequenceTracker } from './InputSequenceTracker';

vi.mock('electron', () => ({
  ipcRenderer: { send: vi.fn(), on: vi.fn(), removeListener: vi.fn(), once: vi.fn() },
}));

const { ACTION_UP, ACTION_DOWN, ACTION_LEFT, ACTION_RIGHT } = PlayerActionType;

const TIMEOUT_MS = 500;

const createSkill = (sequence: SequenceInputType[]): SequenceSkill => ({
  sequence,
  availableIn: [],
  cooldownMs: 0,
  getState: () => ({}) as State,
});

// The `now` argument is only recorded for bookkeeping - actual expiry is
// driven by a real setTimeout, controlled below via vi's fake timers.
let now = 0;
const nextTimestamp = () => (now += 100);

describe('InputSequenceTracker', () => {
  beforeEach(() => {
    now = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null while the sequence is incomplete', () => {
    const skill = createSkill([ACTION_UP, ACTION_DOWN, ACTION_LEFT]);
    const tracker = new InputSequenceTracker(TIMEOUT_MS);

    expect(tracker.push(ACTION_UP, nextTimestamp(), [skill])).toBeNull();
    expect(tracker.push(ACTION_DOWN, nextTimestamp(), [skill])).toBeNull();
  });

  it('returns the skill once its full sequence is entered in order', () => {
    const skill = createSkill([ACTION_UP, ACTION_DOWN, ACTION_LEFT]);
    const tracker = new InputSequenceTracker(TIMEOUT_MS);

    tracker.push(ACTION_UP, nextTimestamp(), [skill]);
    tracker.push(ACTION_DOWN, nextTimestamp(), [skill]);

    expect(tracker.push(ACTION_LEFT, nextTimestamp(), [skill])).toBe(skill);
  });

  it('returns null when the entered inputs do not match any skill sequence', () => {
    const skill = createSkill([ACTION_UP, ACTION_DOWN]);
    const tracker = new InputSequenceTracker(TIMEOUT_MS);

    expect(tracker.push(ACTION_DOWN, nextTimestamp(), [skill])).toBeNull();
    expect(tracker.push(ACTION_UP, nextTimestamp(), [skill])).toBeNull();
  });

  it('matches the skill corresponding to the entered sequence among multiple skills', () => {
    const kickSkill = createSkill([ACTION_UP, ACTION_UP]);
    const healSkill = createSkill([ACTION_DOWN, ACTION_RIGHT]);
    const tracker = new InputSequenceTracker(TIMEOUT_MS);
    const skills = [kickSkill, healSkill];

    tracker.push(ACTION_DOWN, nextTimestamp(), skills);

    expect(tracker.push(ACTION_RIGHT, nextTimestamp(), skills)).toBe(healSkill);
  });

  it('matches only against the skills provided for that push', () => {
    const skill = createSkill([ACTION_UP, ACTION_DOWN]);
    const tracker = new InputSequenceTracker(TIMEOUT_MS);

    tracker.push(ACTION_UP, nextTimestamp(), [skill]);

    // The completing input arrives while the skill is not eligible - no match,
    // even though the buffered sequence matches the skill's sequence.
    expect(tracker.push(ACTION_DOWN, nextTimestamp(), [])).toBeNull();
  });

  it('discards progress when reset is called', () => {
    const skill = createSkill([ACTION_UP, ACTION_DOWN]);
    const tracker = new InputSequenceTracker(TIMEOUT_MS);

    tracker.push(ACTION_UP, nextTimestamp(), [skill]);
    tracker.reset();

    expect(tracker.push(ACTION_DOWN, nextTimestamp(), [skill])).toBeNull();
  });

  it('resets after a match', () => {
    const skill = createSkill([ACTION_UP, ACTION_DOWN]);
    const tracker = new InputSequenceTracker(TIMEOUT_MS);

    const resetSpy = vi.spyOn(tracker, 'reset');

    tracker.push(ACTION_UP, nextTimestamp(), [skill]);
    expect(tracker.push(ACTION_DOWN, nextTimestamp(), [skill])).toBe(skill);
    expect(resetSpy).toHaveBeenCalledOnce();
  });

  describe('inactivity timeout', () => {
    it('keeps tracking progress if the next input arrives before the timeout elapses', () => {
      const skill = createSkill([ACTION_UP, ACTION_DOWN, ACTION_LEFT]);
      const tracker = new InputSequenceTracker(TIMEOUT_MS);

      tracker.push(ACTION_UP, nextTimestamp(), [skill]);
      vi.advanceTimersByTime(TIMEOUT_MS - 1);
      tracker.push(ACTION_DOWN, nextTimestamp(), [skill]);

      expect(tracker.push(ACTION_LEFT, nextTimestamp(), [skill])).toBe(skill);
    });

    it('clears the buffer once the timeout elapses with no further input', () => {
      const skill = createSkill([ACTION_UP, ACTION_DOWN]);
      const tracker = new InputSequenceTracker(TIMEOUT_MS);

      tracker.push(ACTION_UP, nextTimestamp(), [skill]);
      vi.advanceTimersByTime(TIMEOUT_MS);

      // ACTION_UP was discarded by the timeout, so ACTION_DOWN alone must not complete the sequence.
      expect(tracker.push(ACTION_DOWN, nextTimestamp(), [skill])).toBeNull();
    });

    it('reschedules the timeout on every push, rather than expiring from the first input', () => {
      const skill = createSkill([ACTION_UP, ACTION_DOWN, ACTION_LEFT]);
      const tracker = new InputSequenceTracker(TIMEOUT_MS);

      tracker.push(ACTION_UP, nextTimestamp(), [skill]);
      vi.advanceTimersByTime(TIMEOUT_MS - 1);
      // Still a valid (incomplete) prefix - reschedules the timeout rather
      // than letting the deadline from the first input expire.
      tracker.push(ACTION_DOWN, nextTimestamp(), [skill]);
      vi.advanceTimersByTime(TIMEOUT_MS - 1);

      // Total elapsed time exceeds TIMEOUT_MS, but each individual gap
      // between pushes stayed under it, so the sequence still completes.
      expect(tracker.push(ACTION_LEFT, nextTimestamp(), [skill])).toBe(skill);
    });

    it('matches a fresh sequence entered after a timeout reset', () => {
      const skill = createSkill([ACTION_UP, ACTION_DOWN]);
      const tracker = new InputSequenceTracker(TIMEOUT_MS);

      tracker.push(ACTION_UP, nextTimestamp(), [skill]);
      vi.advanceTimersByTime(TIMEOUT_MS);

      tracker.push(ACTION_UP, nextTimestamp(), [skill]);

      expect(tracker.push(ACTION_DOWN, nextTimestamp(), [skill])).toBe(skill);
    });
  });

  describe('recovery from a non-matching input', () => {
    it('allows retrying immediately after a wrong input, without waiting for the timeout', () => {
      const skill = createSkill([ACTION_UP, ACTION_DOWN, ACTION_LEFT]);
      const tracker = new InputSequenceTracker(TIMEOUT_MS);

      tracker.push(ACTION_UP, nextTimestamp(), [skill]);
      // Mistake: breaks the prefix of the only eligible skill.
      expect(tracker.push(ACTION_RIGHT, nextTimestamp(), [skill])).toBeNull();

      // Retried immediately (no timers advanced) and still completes.
      tracker.push(ACTION_UP, nextTimestamp(), [skill]);
      tracker.push(ACTION_DOWN, nextTimestamp(), [skill]);
      expect(tracker.push(ACTION_LEFT, nextTimestamp(), [skill])).toBe(skill);
    });

    it('restarts tracking from a wrong input if it is itself a valid start for a different eligible skill', () => {
      const skillA = createSkill([ACTION_UP, ACTION_DOWN, ACTION_LEFT]);
      const skillB = createSkill([ACTION_RIGHT, ACTION_RIGHT]);
      const tracker = new InputSequenceTracker(TIMEOUT_MS);
      const skills = [skillA, skillB];

      tracker.push(ACTION_UP, nextTimestamp(), skills);
      // Breaks skillA's prefix, but is itself skillB's first input.
      expect(tracker.push(ACTION_RIGHT, nextTimestamp(), skills)).toBeNull();

      expect(tracker.push(ACTION_RIGHT, nextTimestamp(), skills)).toBe(skillB);
    });

    it('fully discards the buffer if a wrong input does not start any eligible skill either', () => {
      const skill = createSkill([ACTION_UP, ACTION_DOWN]);
      const tracker = new InputSequenceTracker(TIMEOUT_MS);

      tracker.push(ACTION_UP, nextTimestamp(), [skill]);
      // ACTION_LEFT neither continues UP,DOWN nor starts any eligible skill.
      expect(tracker.push(ACTION_LEFT, nextTimestamp(), [skill])).toBeNull();

      expect(tracker.push(ACTION_DOWN, nextTimestamp(), [skill])).toBeNull();
      expect(tracker.push(ACTION_UP, nextTimestamp(), [skill])).toBeNull();
      expect(tracker.push(ACTION_DOWN, nextTimestamp(), [skill])).toBe(skill);
    });
  });
});
