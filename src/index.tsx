import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as RE from './lib/simpleRegex';
import * as NFA from './lib/nfa';
import * as DFA from './lib/dfa';
import {ParseError, ParseResult} from './lib/parser';
import {setLocale,dutch,english} from './lib/localization';
import RailroadDiagram from './components/RailroadDiagram';
import AutomatonDiagram from './components/AutomatonDiagram';
import RailroadDiagramSVG from './components/RailroadDiagramSVG';

//setLocale(dutch);

//

// -----------------------------------------------------------------------------
// Automaton rendering
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Parse errors
// -----------------------------------------------------------------------------

interface ErrorProps {
  errors: ParseError[];
}
class Errors extends React.Component<ErrorProps> {
  constructor(props : ErrorProps) { super(props); }
  render() {
    if (this.props.errors.length > 0) {
      return (
        <ul className="errors">
          {this.props.errors.map((e,i) => <li key={i}>{e.toString()}</li>)}
        </ul>
      );
    } else {
      return <></>;
    }
  }
}

// -----------------------------------------------------------------------------
// Regex Editor
// -----------------------------------------------------------------------------

interface EditorProps {
}
interface EditorState {
  unparsed: string;
  parsed?:  ParseResult<RE.SimpleRegex>;
}
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
    } else if (re.failed() && re.value == RE.one) {
      return <Errors {...re} />;
    } else {
      let nfa = NFA.regexToNFA(re.value);
      let dfa = DFA.nfaToDfa(nfa);
      return (
        <div>
          <Errors {...re} />
          <RailroadDiagram regex={re.value} />
          <RailroadDiagramSVG regex={re.value} />
          <div>{RE.showRegex(re.value)}</div>
          <div>NFA: <AutomatonDiagram automaton={nfa} /></div>
          <div>Layout: <AutomatonDiagram automaton={new NFA.NFA(nfa.nodes,nfa.initial)} /></div>
          <div>Alphabet: {"{"+nfa.alphabet().join(", ")+"}"}</div>
          <div>Word: {RE.makeWord(re.value)}</div>
          <div>DFA: {NFA.showNFA(DFA.dfaToNfa(dfa))}</div>
          <div>DFA: <AutomatonDiagram automaton={DFA.dfaToNfa(dfa)} /></div>
        </div>
      );
      //
    }
  }
  handleChange = (event : React.FormEvent<HTMLTextAreaElement>) => {
    let target = event.target as HTMLTextAreaElement;
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
