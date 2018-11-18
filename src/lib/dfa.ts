import * as NFA from './nfa';
import { removeDuplicates, fillArray } from './util';

// -----------------------------------------------------------------------------
// Data type
// -----------------------------------------------------------------------------

type NodeID = number;

interface Node<A> {
  edges : Map<string, NodeID>;
  final : A;
  label : string;
}

export class GenDFA<A> {
  nodes : Node<A>[];
  initial : NodeID;
  failFinal : A;

  constructor(nodes : Node<A>[], initial: NodeID, failFinal : A) {
    this.nodes = nodes;
    this.initial = initial;
    this.failFinal = failFinal;
  }

  getFinal(node : NodeID) : A {
    return node < 0 ? this.failFinal : this.nodes[node].final;
  }

  getLabel(node : NodeID) {
    return node < 0 ? "-" : this.nodes[node].label;
  }

  step(from : NodeID, char : string) : NodeID {
    if (from < 0) {
      return -1;
    } else {
      let to = this.nodes[from].edges.get(char);
      return to === undefined ? -1 : to;
    }
  }

  steps(state : NodeID, string : string) : NodeID {
    for (let i = 0; i < string.length; i++) {
      state = this.step(state, string[i]);
    }
    return state;
  }

  alphabet() : string[] {
    let labels = new Set<string>();
    for (const node of this.nodes) {
      for (const [x,_] of node.edges) {
        labels.add(x);
      }
    }
    if (labels.size < 2) labels.add("a");
    if (labels.size < 2) labels.add("b");
    return Array.from(labels);
  }
}

export type DFA = GenDFA<boolean>;

// -----------------------------------------------------------------------------
// Queries
// -----------------------------------------------------------------------------

// Does a DFA have reachable final states? If so, with what word
function reachableWord(dfa : DFA) : string | null {
  let words : Array<string|null> = fillArray(dfa.nodes.length, null);
  let queue : NodeID[] = [dfa.initial];
  words[dfa.initial] = "";
  let pos = 0;
  while (pos < queue.length) {
    let cur = queue[pos++];
    let node = dfa.nodes[cur];
    if (node.final) {
      return words[cur];
    } else {
      for (const [char,to] of node.edges) {
        if (words[to] === null) {
          queue.push(to);
          words[to] = words[cur] + char;
        }
      }
    }
  }
  return null;
}

// -----------------------------------------------------------------------------
// Building DFAs
// -----------------------------------------------------------------------------

interface BuildDFASpec<A,B> {
  key:   (info : A) => string;
  label: (info : A) => string;
  final: (info : A) => B;
  failFinal: B;
  edge:  (info : A, char : string) => A;
  alphabet: string[];
  initial: A;
}

function buildDFA<A,B>(spec : BuildDFASpec<A,B>) : GenDFA<B> {
  let ids : Map<string,NodeID> = new Map<string,NodeID>();
  let nodes : Node<B>[] = [];
  let queue : A[] = [];
  let queuePos = 0;
  function makeOrGet(info : A) : number {
    let key = spec.key(info);
    let id = ids.get(key);
    if (id !== undefined) {
      return id;
    } else {
      let id = nodes.length + queue.length - queuePos;
      queue.push(info);
      ids.set(key,id);
      return id;
    }
  }
  queue.push(spec.initial);
  ids.set(spec.key(spec.initial),0);
  while (queuePos < queue.length) {
    let info  = queue[queuePos++];
    let label = spec.label(info);
    let final = spec.final(info);
    let edges = new Map<string,NodeID>();
    nodes.push({edges,final,label});
    for (const x of spec.alphabet) {
      edges.set(x, makeOrGet(spec.edge(info,x)));
    }
  }
  return new GenDFA<B>(nodes,0,spec.failFinal);
}

// -----------------------------------------------------------------------------
// To/from NFA
// -----------------------------------------------------------------------------

export function nfaToDfa(nfa : NFA.NFA) : DFA {
  return buildDFA<NFA.NodeID[],boolean>({
    key:   (nodes) => nodes.join(","),
    label: (nodes) => "{" + nodes.map(i => nfa.nodes[i].label).join(",") + "}",
    final: (nodes) => nfa.isFinalSet(nodes),
    failFinal: false,
    edge:  (nodes, x) => nfa.stepClosure(nodes,x),
    alphabet: nfa.alphabet(),
    initial: nfa.initialClosure()
  });
}

function dfaToNfaNode({edges:dfaEdges,label,final} : Node<boolean>) : NFA.Node<string> {
  let edges = [];
  for (const [label,to] of dfaEdges.entries()) {
    edges.push({label,to});
  }
  return {edges,label,final};
}
export function dfaToNfa(dfa : DFA) : NFA.NFA {
  let nodes = dfa.nodes.map(dfaToNfaNode);
  return new NFA.NFA(nodes, dfa.initial);
}

// -----------------------------------------------------------------------------
// Transformation
// -----------------------------------------------------------------------------

export function mapDfa<A,B>(dfa : GenDFA<A>, f : (x:A) => B) : GenDFA<B> {
  return new GenDFA<B>(dfa.nodes.map((node) => ({...node, final: f(node.final)})), dfa.initial, f(dfa.failFinal));
}

export function notDfa(dfa : DFA) {
  return mapDfa(dfa, (x) => !x);
}

export function zipDfa<A,B,C>(a : GenDFA<A>, b : GenDFA<B>, f : (x : A, y : B) => C) : GenDFA<C> {
  return buildDFA<[NodeID,NodeID],C>({
    key:   ([na,nb]) => na + "," + nb,
    label: ([na,nb]) => "(" + a.nodes[na].label + b.nodes[nb].label + ")",
    final: ([na,nb]) => f(a.getFinal(na), b.getFinal(nb)),
    failFinal: f(a.failFinal, b.failFinal),
    edge:  ([na,nb],x) => [a.step(na,x),b.step(nb,x)],
    alphabet: removeDuplicates(a.alphabet().concat(b.alphabet())),
    initial: [a.initial, b.initial]
  });
}

export function diffDfa(a : DFA, b : DFA) : DFA {
  return zipDfa(a, b, (x,y) => x && !y);
}

export function unionDfa(a : DFA, b : DFA) : DFA {
  return zipDfa(a, b, (x,y) => x || y);
}

export function intersectDfa(a : DFA, b : DFA) : DFA {
  return zipDfa(a, b, (x,y) => x && y);
}

export interface ComparisonResult {
  equal   : boolean;
  onlyInA : string | null;
  onlyInB : string | null;
}

export function compareDfa(a : DFA, b : DFA) : ComparisonResult {
  let aMinB = diffDfa(a,b);
  let bMinA = diffDfa(b,a);
  let onlyInA = reachableWord(aMinB);
  let onlyInB = reachableWord(bMinA);
  let equal = onlyInA === null && onlyInB === null;
  return {equal,onlyInA,onlyInB};
}

