import { fillArray } from "./util";

declare type NestedLayout = any;

// -----------------------------------------------------------------------------
// Generic automata
// -----------------------------------------------------------------------------

export type NodeID = number;

export interface Node {
  label: string;
  initial: boolean;
  final: boolean;
  edges: Edge[]; // usually at most one edge per 'to'
}

export interface Edge {
  to: NodeID;
  label: string;
  color?: string;
}

export class Automaton {
  constructor(public nodes: Node[] = [], public layout?: NestedLayout) {}

  toAutomaton() : Automaton {
    return this;
  }
}

// The parents of each node
export function getParents(a : Automaton) : NodeID[][] {
  let parents : NodeID[][] = [];
  for (let i=0; i < a.nodes.length; ++i) {
    parents.push([]); // Note: can't use Array.fill, because then we would be sharing the [] objects
  }
  a.nodes.forEach((node,id) => {
    node.edges.forEach(({to}) => parents[to].push(id));
  });
  return parents;
}

// -----------------------------------------------------------------------------
// Generic automata with layout
// -----------------------------------------------------------------------------

export interface NodeAt {
  label: string;
  initial: boolean;
  final: boolean;
  //edges: Map<NodeId,Edge>; // at most one edge per to
  edges: Edge[];

  x : number;
  y : number;
}
