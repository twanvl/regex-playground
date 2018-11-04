import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as RE from './lib/simpleRegex';
import * as NFA from './lib/nfa';
import * as DFA from './lib/dfa';
import {ParseError} from './lib/parser';
import {setLocale,dutch,english} from './lib/localization';
import RailroadDiagram from './components/RailroadDiagram';

//setLocale(dutch);

let r1 = RE.parseRegex("(a)b+c(d+e)***(*)");

//

// -----------------------------------------------------------------------------
// Automaton rendering
// -----------------------------------------------------------------------------

/*

Layout:
 * topological sort
   * then parallel
   * but: how to see what is first?
 * for regex->nfa, the order should be clear
 * start from initial state
   * if there is one "next" state, then that one is next
   * if there are multiple "next" states
     * if A is an ancestor of B, but not vice-versa then A is next
     * if A and B are independent, both are next (branch)
     * ancestor relations don't pass through visited nodes
     * if A and B are ancestors of eachother
       * if only two: grid layout
       * if 3: pick at random?

*/
interface DrawnNode {
  x : Number;
  y : Number;
  
}
interface DrawnAutomaton {
}


interface AutomatonRenderProps {
  automaton: NFA.NFA;
};
interface AutomatonRenderState {
};

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
          <div>NFA: {NFA.showNFA(nfa)}</div>
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
