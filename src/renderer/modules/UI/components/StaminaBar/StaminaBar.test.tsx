import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { StaminaBar } from 'UI/components/StaminaBar/StaminaBar';

describe('StaminaBar', () => {
  it('renders a bar without floating numbers', () => {
    const { container } = render(<StaminaBar progress={0.4} />);

    expect(container.querySelector('.bar-simple-fill')).toBeTruthy();
    expect(container.textContent).toBe('');
  });
});
