import {Regex,char as re_char} from './regex';
import * as A from './automaton';
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

  toAutomaton() : A.Automaton {
    return nfaToAutomaton(this);
  }
}

export type NFAr = Automaton<Regex>;

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

interface FinalAndLayout2 {
  final: NodeID;
  layout: GL.NestedLayout;
  parts: FinalAndLayout2[];
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

  addRegex(start : NodeID, re : Regex) : FinalAndLayout2 {
    switch (re.type) {
      case "char": {
        let final = this.addNode();
        this.addEdge(start, final, re.char);
        let layout = GL.node(final);
        return {final, layout, parts:[]};
      }
      case "sum": {
        let parts = re.children.map((c) => this.addRegex(start, c));
        let final = this.addNode();
        for (let p of parts) {
          this.addEdge(p.final, final, "");
        }
        let layout = GL.sequence2(GL.parallel(parts.map((p) => p.layout)), GL.node(final));
        return {final, layout, parts};
      }
      case "product": {
        let final = start;
        let parts = [];
        for (const c of re.children) {
          let part = this.addRegex(start, c);
          final = part.final;
          parts.push(part);
        }
        let layout = GL.sequence(parts.map((p) => p.layout));
        return {final, layout, parts};
      }
      case "star": {
        let final = this.addNode();
        let part = this.addRegex(final, re.child);
        this.addEdge(start, final, "");
        this.addEdge(part.final, final, "");
        let layout = GL.sequence2(GL.node(final), part.layout);
        return {final, layout, parts:[part]};
      }
    }
  }
}

export function regexToNFA(re : Regex) : NFA {
  let builder = new NFABuilder();
  let start = builder.addNode();
  let {final,layout} = builder.addRegex(start, re);
  builder.nodes[final].final = true;
  layout = GL.sequence2(GL.node(start), layout);
  return new NFA(builder.nodes, start, layout);
}

// -----------------------------------------------------------------------------
// NFA to Regex
// -----------------------------------------------------------------------------

function nfaToNfarNode(node : Node<string>) : Node<Regex> {
  //return {...node, edges: node.edges.map((e : Edge<string>) => ({to:e.to, final:e.final, label:RE.char(e.label)}))};
  return {...node, edges: node.edges.map(({to,label}) => ({to, label:re_char(label)}))};
}

export function nfaToNfar(nfa : NFA) : NFAr {
  return new Automaton<Regex>(nfa.nodes.map(nfaToNfarNode), nfa.initial, nfa.layout);
}


const emptyLabel = "ε";

function nfaToAutomatonNode(node : Node<string>, initial:boolean) : A.Node {
  let edgesTo : Map<number,string[]> = new Map();
  for (const e of node.edges) {
    if (!edgesTo.has(e.to)) edgesTo.set(e.to,[]);
    edgesTo.get(e.to)!.push(e.label == "" ? emptyLabel : e.label);
  }
  let edges : A.Edge[] = [];
  for (const [to,labels] of edgesTo.entries()) {
    if (labels.length > 0) {
      edges.push({to,label:labels.join(',')});
    }
  }
  return {...node, initial, edges};
}

export function nfaToAutomaton(nfa : NFA) : A.Automaton {
  return new A.Automaton(nfa.nodes.map((node,i) => nfaToAutomatonNode(node,i==nfa.initial)), nfa.layout);
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

