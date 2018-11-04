import * as RE from './simpleRegex';
import {SimpleRegex} from './simpleRegex';

// -----------------------------------------------------------------------------
// Data type
// -----------------------------------------------------------------------------

type NodeID = string;
type Edge<T> = {label: T, to: string};

interface AutomatonNode<T> {
  edges : Edge<T>[];
}

interface Automaton<T> {
  nodes : Map<string, AutomatonNode<T>>;
  initial : string;
  final   : string[];
}

export type NFA = Automaton<string>;
export type NFAr = Automaton<SimpleRegex>;

// -----------------------------------------------------------------------------
// Remove "" edges
// -----------------------------------------------------------------------------

function lambdaClosure(nfa : NFA, state : string) : string[] {
  let states = [state];
  let seen = 0;
  while (seen < states.length) {
    let node = states[seen++];
    for (const edge of nfa.nodes.get(node)!.edges) {
      if (edge.label == "" && states.indexOf(edge.to) < 0) {
        states.push(edge.to);
      }
    }
  }
  states = states.sort();
  return states;
}

/*
export function removeLambdaTransitions(nfa : NFA) : NFA {
  
}*/

// -----------------------------------------------------------------------------
// Regex to NFA
// -----------------------------------------------------------------------------

class NFABuilder {
  nodes : Map<string, AutomatonNode<string>> = new Map<string,AutomatonNode<string>>();
  nextId : number = 0;

  addNode() : string {
    let id = "q" + (this.nextId++);
    this.nodes.set(id, {edges:[]});
    return id;
  }

  addEdge(from : string, to : string, label : string) {
    this.nodes.get(from)!.edges.push({label:label, to:to});
  }

  addEdges(froms : string[], to : string, label : string) {
    for (const from of froms) {
      this.addEdge(from, to, label);
    }
  }

  joinFinal(starts : string[]) : string {
    if (starts.length == 1) return starts[0];
    let id = this.addNode();
    this.addEdges(starts, id, "");
    return id;
  }

  addRegex(start : string, re : SimpleRegex) : string[] {
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
        this.addEdge(start, start2, "");
        let finals2 = this.addRegex(start, re.a);
        let final = this.addNode();
        this.addEdges(finals2, final, "");
        this.addEdge(start, final, "");
        this.addEdge(final, start2, "");
        return [final];
      }
    }
  }
}

export function regexToNFA(re : SimpleRegex) : NFA {
  let nfa = new NFABuilder();
  let start = nfa.addNode();
  let finals = nfa.addRegex(start, re);
  return {nodes: nfa.nodes, initial:start, final:finals};
}

// -----------------------------------------------------------------------------
// NFA to Regex
// -----------------------------------------------------------------------------

function nfaToNfarNode(node : AutomatonNode<string>) : AutomatonNode<SimpleRegex> {
  return {edges: node.edges.map((e : Edge<string>) => ({to:e.to, label:RE.char(e.label)}))};
}

export function nfaToNfar(nfa : NFA) : NFAr {
  return {...nfa, nodes: mapMap(nfa.nodes, nfaToNfarNode)};
}

// -----------------------------------------------------------------------------
// Printing
// -----------------------------------------------------------------------------

function showNFANode(node : AutomatonNode<string>, final : boolean) {
  let out = [];
  for (const edge of node.edges) {
    out.push(edge.label + " " + edge.to)
  }
  if (final) out.push("1");
  return out.join(" | ");
}

export function showNFA(nfa : NFA) {
  let out = [];
  for (const [k,node] of nfa.nodes.entries()) {
    out.push(k + " -> " + showNFANode(node, nfa.final.indexOf(k) > -1));
  }
  return out.join(";\n");
}

