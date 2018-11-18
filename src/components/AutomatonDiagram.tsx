import {Renderable,RenderableCanvas} from './RenderableCanvas';
import * as NFA from '../lib/nfa';
import {Automaton,Node,NodeID} from '../lib/automaton';
import * as GL from '../lib/graphLayout';
import * as React from 'react';
import {vec2, BezierCurve} from '../lib/util';

// -----------------------------------------------------------------------------
// Automaton rendering
// -----------------------------------------------------------------------------

// draw an arrowhead in direction dir, pointing at p2
function drawArrowHead(ctx : CanvasRenderingContext2D, p : vec2, dir : vec2, arrowWidth  = 8, arrowHeight = 5) {
  ctx.moveToVec(vec2.addInDirection(p, dir,[-arrowWidth,arrowHeight]));
  ctx.lineToVec(p);
  ctx.lineToVec(vec2.addInDirection(p, dir,[-arrowWidth,-arrowHeight]));
}

function automatonRender(props : AutomatonDiagramProps) : Renderable {
  const scale = 90;
  const nodeRadius = 20;
  const nodeRadiusFinal = nodeRadius + 4;
  const leftMargin = 20;

  let automaton = props.automaton.toAutomaton();
  if (!automaton.layout) automaton.layout = GL.automatonLayout(automaton);
  let layout = GL.nestedLayoutPositions(automaton.layout);

  let width  = layout.width * scale;
  let height = layout.height * scale;
  let positions : vec2[] = [];
  for (const p of layout.positions) {
    positions[p.node] = [p.x * scale + leftMargin, p.y * scale];
  }

  return { width, height, render: (ctx) => {
    function drawNode([x,y] : vec2, node : Node) {
      ctx.beginPath();
      ctx.arc(x,y, nodeRadius, 0,2*Math.PI);
      ctx.stroke();
      if (node.final) {
        ctx.beginPath();
        ctx.arc(x,y, nodeRadiusFinal, 0,2*Math.PI);
        ctx.stroke();
      }
      if (props.nodeLabels) {
        ctx.fillText(node.label, x,y);
      }
    }

    function drawCurvedEdge(curve : BezierCurve, label : string = "") {
      let dir12 = vec2.direction(curve.p1,curve.p2);
      let dir34 = vec2.direction(curve.p3,curve.p4);
      ctx.beginPath();
      ctx.moveToVec(curve.p1);
      ctx.bezierCurveToVec(curve.p2, curve.p3, curve.p4);
      drawArrowHead(ctx, curve.p4, dir34);
      if (false) {
        ctx.moveToVec(curve.p1);
        ctx.lineToVec(curve.p2);
        ctx.lineToVec(curve.p3);
        ctx.lineToVec(curve.p4);
      }
      ctx.stroke();
      let labelPos = vec2.addInDirection(curve.p1, dir12, [20,12]);
      ctx.fillText(label, labelPos[0],labelPos[1]);
    }

    function drawStraightEdge(p1 : vec2, p2 : vec2, r1 : number, r2 : number, label : string = "") {
      let dir = vec2.direction(p1,p2);
      p1 = vec2.addMul(p1,dir,r1);
      p2 = vec2.addMul(p2,dir,-(r2+2));
      ctx.beginPath();
      ctx.moveToVec(p1);
      ctx.lineToVec(p2);
      drawArrowHead(ctx, p2, dir);
      ctx.stroke();
      let labelPos = vec2.addInDirection(p1, dir, [20,12]);
      ctx.fillText(label, labelPos[0],labelPos[1]);
    }

    function drawEdge(p1 : vec2, p2 : vec2, r1 : number, r2 : number, label : string = "") {
      if (p1 === undefined || p2 === undefined) {
        throw "bork";
      }
      if (true) {
        // bezier curve between centers of nodes, clipped to the node edges
        let d = vec2.distance(p1,p2) / scale;
        let angle : vec2 = [0.3 - 0.05*d, 0.25 + 0.05*d];
        let dir = vec2.sub(p2,p1);
        let pa = vec2.addInDirection(p1, dir, angle);
        let pb = vec2.addInDirection(p1, dir, vec2.add([1,0],vec2.mul([-1,1],angle)));
        let curve = new BezierCurve(p1, pa, pb, p2);
        curve = curve.sliceIntersectCircle(r1);
        curve = curve.reverse().sliceIntersectCircle(r2+2).reverse();
        drawCurvedEdge(curve, label);
      } else if (true) {
        // curve offset in the given direction
        let angle : vec2 = [0.45,0.25];
        let dir = vec2.sub(p2,p1);
        let pa = vec2.addInDirection(p1, dir, angle);
        let pb = vec2.addInDirection(p1, dir, vec2.add([1,0],vec2.mul([-1,1],angle)));
        p1 = vec2.addMul(p1,vec2.direction(p1,pa),r1);
        p2 = vec2.addMul(p2,vec2.direction(p2,pb),r2+2);
        let curve = new BezierCurve(p1, pa, pb, p2);
        drawCurvedEdge(curve, label);
      } else {
        drawStraightEdge(p1, p2, r1, r2, label);
      }
    }

    ctx.lineWidth = 1.5;
    ctx.font = '16px serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';

    automaton.nodes.forEach((node,i) => {
      let pos = positions[i];
      let r1 = node.final ? nodeRadiusFinal : nodeRadius;
      drawNode(pos,node);
      if (node.initial) {
        drawEdge(vec2.add(pos,[-60,0]), pos, 0, r1);
      }
      for (const edge of node.edges) {
        let r2 = automaton.nodes[edge.to].final ? nodeRadiusFinal : nodeRadius;
        drawEdge(pos, positions[edge.to], r1, r2, edge.label);
      }
    });
  }};
}

// -----------------------------------------------------------------------------
// Automaton diagrams
// -----------------------------------------------------------------------------

interface AutomatonDiagramProps {
  automaton: Automaton | NFA.NFA;
  nodeLabels: boolean;
}

export default class AutomatonDiagram extends React.Component<AutomatonDiagramProps> {
  static defaultProps = {
    nodeLabels: true
  };
  render() {
    let render = automatonRender(this.props);
    return <RenderableCanvas {...render} className="automaton" />;
  }
}

