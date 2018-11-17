import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './style.css';
import * as RE from './lib/simpleRegex';
import * as NFA from './lib/nfa';
import * as DFA from './lib/dfa';
import {ParseError, ParseResult} from './lib/parser';
import {setLocale,dutch,english, locale} from './lib/localization';
import RailroadDiagram from './components/RailroadDiagram';
import AutomatonDiagram from './components/AutomatonDiagram';
import RailroadDiagramSVG from './components/RailroadDiagramSVG';
import RegexToNFADerivation from './components/RegexToNfaDerivation';

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
        <div className="alert alert-danger">
          <ul className="errors">
            {this.props.errors.map((e,i) => <li key={i}>{e.toString()}</li>)}
          </ul>
        </div>
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
          <RegexToNFADerivation regex={re.value} />
        </div>
      );
      //
    }
  }
  handleChange = (event : React.FormEvent<HTMLInputElement>) => {
    let target = event.target as HTMLInputElement;
    let unparsed = target.value;
    this.setState({ unparsed:unparsed, parsed:RE.parseRegex(unparsed) });
  }
  public render() : React.ReactNode {
    return (
      <div className="container">
        <div className="form-group">
          <input className="form-control" type="text" placeholder={locale.regularExpression} value={this.state.unparsed} onChange={this.handleChange}/>
        </div>
        {this.result()}
      </div>
    );
  }
}

ReactDOM.render(
  <REEditor/>,
  document.getElementById('root') as HTMLElement
);
