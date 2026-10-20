import '@radix-ui/themes/styles.css';
import '@tgdf/internal-ui/global.css';
import React from 'react';
import { ViewManager } from '@tgdf';
import { Theme } from '@radix-ui/themes';

import * as views from 'Views';

const App: React.FC = () => {
  return (
    <Theme>
      <ViewManager views={views} />
    </Theme>
  );
};

export default App;
