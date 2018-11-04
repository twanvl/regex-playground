import * as RE from './simpleRegex';
import {SimpleRegex} from './simpleRegex';

// -----------------------------------------------------------------------------
// Data type
// -----------------------------------------------------------------------------

export type NodeID = number;

interface Edge<T> {
  label: T;
  to: NodeID;
};

interface Node<T> {
  edges : Edge<T>[];
  label : string;
}

class Automaton<T> {
  nodes   : Node<T>[];
  initial : NodeID;
  final   : NodeID[];
  
  constructor(nodes : Node<T>[], initial : NodeID, final : NodeID[]) {
    this.nodes = nodes;
    this.initial = initial;
    this.final = final;
  }
  
  isFinal(node : NodeID) {
    return this.final.includes(node);
  }

  isFinalSet(nodes : NodeID[]) {
    for (const node of nodes) {
      if (this.isFinal(node)) return true;
    }
    return false;
  }

  step(froms : NodeID[], label : T) : NodeID[] {
    let states : NodeID[] = [];
    for (const from of froms) {
      for (const edge of this.nodes[from].edges) {
        if (edge.label == label) {
          if (!states.includes(edge.to)) {
            states.push(edge.to);
          }
        }
      }
    }
    return states.sort();
  }
}

export class NFA extends Automaton<string> {
  constructor(nodes : Node<string>[], initial : NodeID, final : NodeID[]) {
    super(nodes, initial, final);
  }

  private lambdaClosureInPlace(states : NodeID[]) {
    let seen = 0;
    while (seen < states.length) {
      let node = states[seen++];
      for (const edge of this.nodes[node].edges) {
        if (edge.label == "" && !states.includes(edge.to)) {
          states.push(edge.to);
        }
      }
    }
  }

  lambdaClosure(statesIn : ReadonlyArray<NodeID>) {
    let states = statesIn.slice();
    this.lambdaClosureInPlace(states);
    states = states.sort();
    return states;
  }

  initialClosure() : NodeID[] {
    return this.lambdaClosure([this.initial]);
  }
  
  stepClosure(froms : NodeID[], label : string) : NodeID[] {
    return this.lambdaClosure(this.step(froms,label));
  }

  alphabet() : string[] {
    let labels = new Set<string>();
    for (const node of this.nodes) {
      for (const edge of node.edges) {
        if (edge.label !== "") labels.add(edge.label);
      }
    }
    if (labels.size < 2) labels.add("a");
    if (labels.size < 2) labels.add("b");
    return Array.from(labels);
  }
}

export type NFAr = Automaton<SimpleRegex>;

// -----------------------------------------------------------------------------
// Remove "" edges
// -----------------------------------------------------------------------------


/*
export function removeLambdaTransitions(nfa : NFA) : NFA {
  
}*/

// -----------------------------------------------------------------------------
// Regex to NFA
// -----------------------------------------------------------------------------

class NFABuilder {
  nodes : Node<string>[] = [];

  addNode() : NodeID {
    let id = this.nodes.length;
    let label = "q" + id;
    this.nodes.push({edges:[], label});
    return id;
  }

  addEdge(from : NodeID, to : NodeID, label : string) {
    this.nodes[from].edges.push({label,to});
  }

  addEdges(froms : NodeID[], to : NodeID, label : string) {
    for (const from of froms) {
      this.addEdge(from, to, label);
    }
  }

  joinFinal(starts : NodeID[]) : NodeID {
    if (starts.length == 1) return starts[0];
    let id = this.addNode();
    this.addEdges(starts, id, "");
    return id;
  }

  addRegex(start : NodeID, re : SimpleRegex) : NodeID[] {
    switch (re.type) {
      case "zero": return [];
      case "one":  return [start];
      case "char": {
        let final = this.addNode();
        this.addEdge(start, final, re.char);
        return [final];
      }
      case "plus": {
        let final1 = this.addRegex(start, re.a);
        let final2 = this.addRegex(start, re.b);
        return final1.concat(final2);
      }
      case "times": {
        let final1 = this.addRegex(start, re.a);
        let start2 = this.joinFinal(final1);
        let final2 = this.addRegex(start2, re.b);
        return final2;
      }
      case "star": {
        let start2 = this.addNode();
        let finals = this.addRegex(start2, re.a);
        this.addEdge(start, start2, "");
        this.addEdges(finals, start2, "");
        return [start2];
      }
    }
  }
}

export function regexToNFA(re : SimpleRegex) : NFA {
  let nfa = new NFABuilder();
  let start = nfa.addNode();
  let finals = nfa.addRegex(start, re);
  return new NFA(nfa.nodes, start, finals);
}

// -----------------------------------------------------------------------------
// NFA to Regex
// -----------------------------------------------------------------------------

function nfaToNfarNode(node : Node<string>) : Node<SimpleRegex> {
  return {...node, edges: node.edges.map((e : Edge<string>) => ({to:e.to, label:RE.char(e.label)}))};
}

export function nfaToNfar(nfa : NFA) : NFAr {
  return new Automaton<SimpleRegex>(nfa.nodes.map(nfaToNfarNode), nfa.initial, nfa.final);
}

// -----------------------------------------------------------------------------
// Printing
// -----------------------------------------------------------------------------

function showNFANode(nfa : NFA, id : NodeID, node : Node<string>) {
  let out = [];
  for (const edge of node.edges) {
    out.push(edge.label + " " + nfa.nodes[edge.to].label)
  }
  if (nfa.isFinal(id)) out.push("1");
  return node.label + " -> " + out.join(" | ");
}

export function showNFA(nfa : NFA) {
  let out = [];
  for (let id = 0 ; id < nfa.nodes.length ; ++id) {
    out.push(showNFANode(nfa, id, nfa.nodes[id]));
  }
  return out.join(";\n");
}

