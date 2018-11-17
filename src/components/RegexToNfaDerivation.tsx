import * as RE from '../lib/simpleRegex';
import * as NFA from '../lib/nfa';
import { locale } from '../lib/localization';
import AutomatonDiagram from './AutomatonDiagram';
import React = require('react');

interface RegexToNFADerivationProps {
  regex: RE.SimpleRegex;
  showKey: boolean;
}

export default class RegexToNFADerivation extends React.Component<RegexToNFADerivationProps> {
  static defaultProps = {showKey: true};
  render() {
    let re = this.props.regex;
    let nfa = NFA.regexToNFA(re).toAutomaton();
    let key = this.props.showKey ? RE.showRegex(re) + ": " : null;
    switch (re.type) {
      case "zero": {
        return (
          <div className="nfa-derivation">
            {key}The NFA is trivial,
            <AutomatonDiagram nodeLabels={false} automaton={nfa} />
          </div>
        );
      }
      case "one": {
        return (
          <div className="nfa-derivation">
            {key}The NFA is trivial,
            <AutomatonDiagram nodeLabels={false} automaton={nfa} />
          </div>
        );
      }
      case "char": {
        return (
          <div className="nfa-derivation">
            {key}The NFA for a single character is
            <AutomatonDiagram nodeLabels={false} automaton={nfa} />
          </div>
        );
      }
      case "times": {
        let parts = RE.getProductParts(re);
        return (
          <div className="nfa-derivation">
            {key}Contruct an NFA for each of the {locale.number(parts.length)} parts:
            <ol>
              {parts.map((p,i) => (
                <li key={i}><RegexToNFADerivation regex={p} showKey={true} /></li>
              ))}
            </ol>
            Then these can be combined in series to give
            <AutomatonDiagram nodeLabels={false} automaton={nfa} />
          </div>
        );
      }
      case "plus": {
        let parts = RE.getSumParts(re);
        return (
          <div className="nfa-derivation">
            {key}Contruct an NFA for each of the {locale.number(parts.length)} parts:
            <ol>
              {parts.map((p,i) => (
                <li key={i}><RegexToNFADerivation regex={p} showKey={true} /></li>
              ))}
            </ol>
            Then these can be combined in parallel to give
            <AutomatonDiagram nodeLabels={false} automaton={nfa} />
          </div>
        );
      }
      case "star": {
        return (
          <div className="nfa-derivation">
            {key}Contruct an NFA for {RE.showRegex(re.a)}:
            <dl>
              <dt>{RE.showRegex(re.a)}</dt><dd><RegexToNFADerivation regex={re.a} /></dd>
            </dl>
            Then apply the construction for star, to give
            <AutomatonDiagram nodeLabels={false} automaton={nfa} />
          </div>
        )
      }
    }
  }
}
