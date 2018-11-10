import { Automaton, getParents } from "./automaton";

// -----------------------------------------------------------------------------
// Nested graph layout
// -----------------------------------------------------------------------------

type NodeID = number;

export type NestedLayout
  = {type: "sequence"; children: NestedLayout[]; } // invariant: children.length != 1, no sequence children
  | {type: "parallel"; children: NestedLayout[]; } // invariant: children.length > 1, no parallel children
  | {type: "node"; node: NodeID; };

export function empty() : NestedLayout {
  return {type:"sequence", children:[]};
}

export function node(node : NodeID) : NestedLayout {
  return {type:"node", node};
}

export function sequence(layouts : NestedLayout[]) : NestedLayout {
  let out = [];
  for (const x of layouts) {
    if (x.type == "sequence") {
      for (const y of x.children) out.push(y);
    } else {
      out.push(x);
    }
  }
  return sequenceUnchecked(out);
}
function sequenceUnchecked(children : NestedLayout[]) : NestedLayout {
  if (children.length == 1) return children[0];
  return {type:"sequence", children};
}
export function sequence2(a : NestedLayout, b : NestedLayout) : NestedLayout {
  if (a.type == "sequence" && a.children.length == 0) return b;
  if (b.type == "sequence" && b.children.length == 0) return a;
  return sequence([a,b]);
}

export function parallel(layouts : NestedLayout[]) : NestedLayout {
  let out = [];
  for (const x of layouts) {
    if (x.type == "parallel") {
      for (const y of x.children) out.push(y);
    } else if (x.type == "sequence" && x.children.length == 0) {
      // skip
    } else {
      out.push(x);
    }
  }
  return parallelUnchecked(out);
}
function parallelUnchecked(children : NestedLayout[]) : NestedLayout {
  if (children.length == 0) {
    return {type:"sequence", children: []};
  } else if (children.length == 1) {
    return children[0];
  } else {
    return {type:"parallel", children};
  }
}
export function parallel2(a : NestedLayout, b : NestedLayout) : NestedLayout {
  if (a.type == "sequence" && a.children.length == 0) return b;
  return parallel([a,b]);
}

// -----------------------------------------------------------------------------
// Automatic layout
// -----------------------------------------------------------------------------

// Place 'toAdd' after its parents (in sequence), but parallel to as many other things as possible
// (input may be modified)
export function insertAfter(root : NestedLayout, toAdd : NestedLayout, parents : NodeID[]) : NestedLayout {
  interface AddedNode {
    here : boolean;
    add  : () => NestedLayout;
  }
  function shouldAdd(x : NestedLayout) : AddedNode {
    switch (x.type) {
      case "node": {
        return {here: parents.includes(x.node), add: () => sequence2(x,toAdd)};
      }
      case "sequence": {
        const children = x.children.map(shouldAdd);
        const numChildren = children.reduce((n,c) => c.here ? n+1 : n, 0);
        return {here: numChildren > 0, add: () => {
          if (children[children.length-1].here) {
            if (numChildren == 1) {
              // add to last child
              let before = sequenceUnchecked(x.children.slice(0,x.children.length-1));
              return sequence2(before,children[children.length-1].add());
            } else {
              // add after last child
              return sequence2(x,toAdd);
            }
          } else {
            // when adding after x2 and x3:
            // [x1,x2,x3,x4,x5]
            //  -->
            // [x1,x2,x3,[x4,x5] || toAdd]]
            for (let i = children.length-1 ; i >= 0 ; --i) {
              if (children[i].here) {
                let before = sequenceUnchecked(x.children.slice(0,i+1));
                let after  = sequenceUnchecked(x.children.slice(i+1));
                return sequence2(before, parallel2(after,toAdd));
              }
            }
          }
          console.log("HUH",{x,toAdd});
          return sequence2(x,toAdd);
        }};
      }
      case "parallel": {
        const children = x.children.map(shouldAdd);
        const numChildren = children.reduce((n,c) => c.here ? n+1 : n, 0);
        return {here: numChildren > 0, add: () => {
          if (numChildren == 1) {
            // add item to 1 child
            x.children = x.children.map((y,i) => children[i].here ? children[i].add() : y);
            for (let i = 0 ; i < children.length ; ++i) {
              if (children[i].here) {
                x.children[i] = children[i].add();
              }
            }
            return parallel(x.children);
          } else if (numChildren < children.length) {
            // split children, add after some
            let yes : NestedLayout[] = [];
            let no  : NestedLayout[] = [];
            for (let i = 0 ; i < children.length ; ++i) {
              if (children[i].here) {
                yes.push(x.children[i]);
              } else {
                no.push(x.children[i]);
              }
            }
            return parallel2(parallelUnchecked(no),sequence2(parallelUnchecked(yes),toAdd));
          } else {
            return sequence2(x,toAdd);
          }
        }};
      }
    }
  }
  let addRoot = shouldAdd(root);
  if (addRoot.here) {
    return addRoot.add();
  } else {
    return parallel2(root,toAdd);
  }
}

export function automatonLayout(a : Automaton) : NestedLayout {
  // parents of each node
  let parents = getParents(a);
  // add nodes
  let out = empty();
  for (const i of a.nodes.keys()) {
    out = insertAfter(out, node(i), parents[i]);
  }
  return out;
}

// -----------------------------------------------------------------------------
// Concrete graph layout
// -----------------------------------------------------------------------------

export interface NodePosition {
  node : NodeID;
  x : number;
  y : number;
}
export interface GraphLayout {
  width  : number;
  height : number;
  positions: NodePosition[];
}

export function nestedLayoutPositions(l : NestedLayout, first : boolean = true, last : boolean = true) : GraphLayout {
  console.log("Layout:",l);
  switch (l.type) {
    case "node":  {
      return {width: 1, height: 1, positions: [{node:l.node, x:0.5, y:0.5}] };
    }
    case "sequence": {
      const children = l.children.map((c,i) => nestedLayoutPositions(c, first && i == 0, last && i == l.children.length-1));
      const width = children.reduce((w,c) => w + c.width, 0);
      const height = children.reduce((h,c) => Math.max(h, c.height), 1);
      let positions = [];
      let x0 = 0;
      for (const c of children) {
        for (const pos of c.positions) {
          pos.x += x0;
          pos.y += (height - c.height) / 2;
          positions.push(pos);
        }
        x0 += c.width;
      }
      return {width,height,positions};
    }
    case "parallel": {
      const children = l.children.map((c,i) => nestedLayoutPositions(c, first, last));
      const width = children.reduce((w,c) => Math.max(w, c.width), 1);
      const height = children.reduce((h,c) => h + c.height, 0);
      let positions = [];
      let y0 = 0;
      for (const c of children) {
        for (const pos of c.positions) {
          if (first && !last) {
            pos.x += (width - c.width);
          } else if (last && !first) {
            pos.x += 0;
          } else {
            pos.x *= width / c.width;
          }
          pos.y += y0;
          positions.push(pos);
        }
        y0 += c.height;
      }
      return {width,height,positions};
    }
  }
}
