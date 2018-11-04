import * as NFA from './nfa';

// -----------------------------------------------------------------------------
// Data type
// -----------------------------------------------------------------------------

type State = string;

interface DFANode {
  //edges : {[label:string] : State};
  edges : Map<string, State>;
  final : boolean;
}

class DFA {
  //nodes : {[key:string] : DFANode};
  nodes : Map<State, DFANode>;
  initial : string;

  constructor(nodes : Map<State, DFANode>, initial: State) {
    this.nodes = nodes;
    this.initial = initial;
  }

  step(from : State, char : string) : State {
    return this.nodes.get(from)!.edges.get(char)!;
  }

  steps(state : State, string : string) : State {
    for (let i = 0; i < string.length; i++) {
      state = this.step(state, string[i]);
    }
    return state;
  }
}

// -----------------------------------------------------------------------------
// Comparison and transformation
// -----------------------------------------------------------------------------

// Does a DFA have reachable final states? If so, with what word
function reachableWord(dfa : DFA) : string | null {
  let reachable : State[] = [dfa.initial];
  let words : {[state:string] : string} = {};
  words[dfa.initial] = "";
  let pos = 0;
  while (pos < reachable.length) {
    let cur = reachable[pos++];
    let node = dfa.nodes.get(cur)!;
    if (node.final) {
      return words[cur];
    } else {
      for (const [char,to] of node.edges) {
        if (reachable.indexOf(to) == -1) {
          reachable.push(to);
          words[to] = words[cur] + char;
        }
      }
    }
  }
  return null;
}

function notDfa(dfa : DFA) {
  return new DFA(mapMap(dfa.nodes, (node) => ({edges:node.edges, final: !node.final})), dfa.initial);
}

function zipDfa(a : DFA, b : DFA, fun : (x : boolean, y : boolean) => boolean) {
  
}

function diffDfa() {
  
}

// -----------------------------------------------------------------------------
// Conversion
// -----------------------------------------------------------------------------

function nfaToDfa(nfa : NFA.NFA) {
  
}
