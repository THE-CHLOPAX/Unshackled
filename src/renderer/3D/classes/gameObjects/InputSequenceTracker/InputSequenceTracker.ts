import { arraysShallowCompare } from '@tgdf';

import { SequenceInputType, SequenceSkill } from '3D/types';

export type InputSequenceItem = {
  input: SequenceInputType;
  timestamp: number;
};

export class InputSequenceTracker {
  private _inputBuffer: InputSequenceItem[] = [];
  private _noInteractionTimeout: NodeJS.Timeout | null = null;

  constructor(private _timeOutMs: number) {}

  public push(
    input: SequenceInputType,
    now: number,
    skills: SequenceSkill[]
  ): SequenceSkill | null {
    if (this._noInteractionTimeout) clearTimeout(this._noInteractionTimeout);

    this._inputBuffer.push({ input, timestamp: now });

    const matchingSkill = skills.find((skill) =>
      arraysShallowCompare(this._currentSequence(), skill.sequence)
    );

    if (matchingSkill) {
      this.reset();
      return matchingSkill;
    }

    // The buffer is no longer a valid prefix of any eligible skill - drop the
    // stale history and restart tracking from just this input, so a single
    // wrong press doesn't block retrying until the buffer times out.
    if (!this._isValidPrefix(this._currentSequence(), skills)) {
      this._inputBuffer = [{ input, timestamp: now }];

      if (!this._isValidPrefix(this._currentSequence(), skills)) {
        this.reset();
      }
    }

    // Clear the buffer after _timeOutMs if no interaction was present
    this._noInteractionTimeout = setTimeout(() => {
      this.reset();
      this._noInteractionTimeout = null;
    }, this._timeOutMs);

    return null;
  }

  public reset() {
    this._inputBuffer = [];
  }

  private _currentSequence(): SequenceInputType[] {
    return this._inputBuffer.map((item) => item.input);
  }

  private _isValidPrefix(sequence: SequenceInputType[], skills: SequenceSkill[]): boolean {
    return skills.some(
      (skill) =>
        sequence.length <= skill.sequence.length &&
        sequence.every((sequenceInput, index) => sequenceInput === skill.sequence[index])
    );
  }
}
