import * as RE from './simpleRegex';
import {SimpleRegex} from './simpleRegex';
import * as GL from './graphLayout';

// -----------------------------------------------------------------------------
// Data type
// -----------------------------------------------------------------------------

export type NodeID = number;

export interface Edge<T> {
  label: T;
  to: NodeID;
}

export interface Node<T> {
  edges : Edge<T>[];
  label : string;
  final : boolean;
}

class Automaton<T> {
  constructor(public nodes : Node<T>[], public initial : NodeID, public layout? : GL.NestedLayout) {}

  isFinalSet(nodes : NodeID[]) {
    for (const node of nodes) {
      if (this.nodes[node].final) return true;
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
  constructor(nodes : Node<string>[], initial : NodeID, public layout? : GL.NestedLayout) {
    super(nodes, initial, layout);
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
export function removeEmptyTransitions(nfa : NFA) : NFA {
}*/

// -----------------------------------------------------------------------------
// Regex to NFA
// -----------------------------------------------------------------------------

interface FinalAndLayout {
  final: NodeID[];
  layout: GL.NestedLayout;
}

class NFABuilder {
  nodes : Node<string>[] = [];

  addNode() : NodeID {
    let id = this.nodes.length;
    let label = "q" + id;
    this.nodes.push({edges:[], label, final:false});
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

  // Add a new single final node if needed
  joinFinal({final,layout} : FinalAndLayout) : {node: NodeID, layout: GL.NestedLayout} {
    if (final.length == 1) return {node:final[0], layout};
    let id = this.addNode();
    this.addEdges(final, id, "");
    return {node:id, layout:GL.sequence2(layout,GL.node(id))};
  }

  addRegex(start : NodeID, re : SimpleRegex) : FinalAndLayout {
    switch (re.type) {
      case "zero": return {final: [],      layout: GL.empty()};
      case "one":  return {final: [start], layout: GL.empty()};
      case "char": {
        let final = this.addNode();
        this.addEdge(start, final, re.char);
        return (
          { final:  [final]
          , layout: GL.node(final) });
      }
      case "plus": {
        let a = this.addRegex(start, re.a);
        let b = this.addRegex(start, re.b);
        return (
          { final:  a.final.concat(b.final)
          , layout: GL.parallel2(a.layout, b.layout) });
      }
      case "times": {
        let a = this.joinFinal(this.addRegex(start, re.a));
        let b = this.addRegex(a.node, re.b);
        return (
          { final:  b.final
          , layout: GL.sequence2(a.layout, b.layout) });
      }
      case "star": {
        let start2 = this.addNode();
        let a = this.addRegex(start2, re.a);
        this.addEdge(start, start2, "");
        this.addEdges(a.final, start2, "");
        return (
          { final:  [start2]
          , layout: GL.sequence2(GL.node(start2), a.layout) });
      }
    }
  }
}

export function regexToNFA(re : SimpleRegex) : NFA {
  let builder = new NFABuilder();
  let start = builder.addNode();
  let {final,layout} = builder.addRegex(start, re);
  for (const f of final) {
    builder.nodes[f].final = true;
  }
  layout = GL.sequence2(GL.node(start), layout);
  return new NFA(builder.nodes, start, layout);
}

// -----------------------------------------------------------------------------
// NFA to Regex
// -----------------------------------------------------------------------------

function nfaToNfarNode(node : Node<string>) : Node<SimpleRegex> {
  //return {...node, edges: node.edges.map((e : Edge<string>) => ({to:e.to, final:e.final, label:RE.char(e.label)}))};
  return {...node, edges: node.edges.map(({to,label}) => ({to, label:RE.char(label)}))};
}

export function nfaToNfar(nfa : NFA) : NFAr {
  return new Automaton<SimpleRegex>(nfa.nodes.map(nfaToNfarNode), nfa.initial, nfa.layout);
}

// -----------------------------------------------------------------------------
// Printing
// -----------------------------------------------------------------------------

function showNFANode(nfa : NFA, id : NodeID, node : Node<string>) {
  let out = [];
  for (const edge of node.edges) {
    out.push(edge.label + " " + nfa.nodes[edge.to].label);
  }
  if (node.final) out.push("1");
  return node.label + " -> " + out.join(" | ");
}

export function showNFA(nfa : NFA) {
  let out = [];
  for (let id = 0 ; id < nfa.nodes.length ; ++id) {
    out.push(showNFANode(nfa, id, nfa.nodes[id]));
  }
  return out.join(";\n");
}

