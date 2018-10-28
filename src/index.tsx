import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as RE from './lib/simpleRegex';

let r1 = RE.parseRegex("(a)b+c(d+e)***(*)");

ReactDOM.render(
  <div>{r1.type == "error" ? r1.toString() : RE.showRegex(r1)}</div>,
  document.getElementById('root') as HTMLElement
);