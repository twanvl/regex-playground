import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as RE from './lib/simpleRegex';
import * as NFA from './lib/nfa';
import * as DFA from './lib/dfa';
import {ParseError} from './lib/parser';
import {setLocale,dutch,english} from './lib/localization';
import RailroadDiagram from './components/RailroadDiagram';
import AutomatonDiagram from './components/AutomatonDiagram';

//setLocale(dutch);

let r1 = RE.parseRegex("(a)b+c(d+e)***(*)");

//

// -----------------------------------------------------------------------------
// Automaton rendering
// -----------------------------------------------------------------------------


// -----------------------------------------------------------------------------
// Regex Editor
// -----------------------------------------------------------------------------

interface EditorProps {
};
interface EditorState {
  unparsed: string;
  parsed?:  ParseError | RE.SimpleRegex
};
class REEditor extends React.Component<EditorProps,EditorState> {
  /*state : State = {
    unparsed: ""
  };*/
  constructor(props : EditorProps) {
    super(props);
    this.state = {unparsed:""};
  }
  result() {
    let re = this.state.parsed;
    if (!re) {
      return "Enter a regular expression";
    } else if (re.type == "error") {
      return re.toString();
    } else {
      let nfa = NFA.regexToNFA(re);
      let dfa = DFA.nfaToDfa(nfa);
      return (
        <div>
          <RailroadDiagram regex={re} />
          <div>{RE.showRegex(re)}</div>
          <div>NFA: <AutomatonDiagram automaton={nfa} /></div>
          <div>Alphabet: {"{"+nfa.alphabet().join(", ")+"}"}</div>
          <div>Word: {RE.makeWord(re)}</div>
          <div>DFA: {NFA.showNFA(DFA.dfaToNfa(dfa))}</div>
        </div>
      );
    }
  }
  handleChange = (event : React.FormEvent<HTMLTextAreaElement>) => {
    let target = event.target as HTMLTextAreaElement
    let unparsed = target.value;
    this.setState({ unparsed:unparsed, parsed:RE.parseRegex(unparsed) });
  }
  public render() : React.ReactNode {
    return (
      <div>
        <textarea value={this.state.unparsed} onChange={this.handleChange}/><br/>
        {this.result()}
      </div>
    );
  }
}

ReactDOM.render(
//  <div>{r1.type == "error" ? r1.toString() : RE.showRegex(r1)}</div>,
  <REEditor/>,
  document.getElementById('root') as HTMLElement
);
