import {Renderable,RenderableCanvas} from './RenderableCanvas';
import * as NFA from '../lib/nfa';
import * as GL from '../lib/graphLayout';
import * as React from 'react';

// -----------------------------------------------------------------------------
// Automaton rendering
// -----------------------------------------------------------------------------

type vec2 = [number,number];

function addMul([x1,y1] : vec2, [x2,y2] : vec2, s : number = 1) : vec2 {
  return [x1+x2*s, y1+y2*s];
}
function normalize([x,y] : vec2) : vec2 {
  const l = Math.sqrt(x*x + y*y);
  return [x / l, y / l];
}

const emptyLabel = "ε";

function automatonRender(props : AutomatonDiagramProps) : Renderable {
  const scale = 90;
  const nodeRadius = 20;
  const nodeRadiusFinal = nodeRadius + 4;
  const leftMargin = 20;

  let automaton = props.automaton;
  if (!automaton.layout) return { width:scale, height:scale, render: ()=>{} };
  let layout = GL.nestedLayoutPositions(automaton.layout);

  let width  = layout.width * scale;
  let height = layout.height * scale;
  let positions : vec2[] = [];
  for (const p of layout.positions) {
    positions[p.node] = [p.x * scale + leftMargin, p.y * scale];
  }

  return { width, height, render: (ctx) => {
    function drawNode([x,y] : vec2, node : NFA.Node<string>) {
      ctx.beginPath();
      ctx.arc(x,y, nodeRadius, 0,2*Math.PI);
      ctx.stroke();
      if (node.final) {
        ctx.beginPath();
        ctx.arc(x,y, nodeRadiusFinal, 0,2*Math.PI);
        ctx.stroke();
      }
      ctx.fillText(node.label, x,y);
    }
    function drawEdge(p1 : vec2, p2 : vec2, r1 : number, r2 : number, label : string = "") {
      let dir = normalize(addMul(p2,p1,-1));
      let perp : vec2 = [dir[1],-dir[0]];
      p1 = addMul(p1,dir,r1);
      p2 = addMul(p2,dir,-(r2+2));
      const arrowWidth  = 8;
      const arrowHeight = 5;
      let ar1 = addMul(addMul(p2, dir,-arrowWidth), perp,arrowHeight);
      let ar2 = addMul(addMul(p2, dir,-arrowWidth), perp,-arrowHeight);
      ctx.beginPath();
      ctx.moveTo(p1[0],p1[1]);
      ctx.lineTo(p2[0],p2[1]);
      ctx.moveTo(ar1[0],ar1[1]);
      ctx.lineTo(p2[0],p2[1]);
      ctx.lineTo(ar2[0],ar2[1]);
      ctx.stroke();
      let labelPos = addMul(addMul(p1, dir,20), perp,12);
      ctx.fillText(label, labelPos[0],labelPos[1]);
    }

    ctx.lineWidth = 2;
    ctx.font = '16px serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';

    automaton.nodes.forEach((node,i) => {
      let pos = positions[i];
      let r1 = node.final ? nodeRadiusFinal : nodeRadius;
      drawNode(pos,node);
      if (automaton.initial == i) {
        drawEdge(addMul(pos,[-60,0]), pos, 0, r1)
      }
      for (const edge of node.edges) {
        let r2 = automaton.nodes[edge.to].final ? nodeRadiusFinal : nodeRadius;
        let label = edge.label == "" ? emptyLabel : edge.label;
        drawEdge(pos, positions[edge.to], r1, r2, label);
      }
    })
  }};
}

// -----------------------------------------------------------------------------
// Automaton diagrams
// -----------------------------------------------------------------------------

interface AutomatonDiagramProps {
  automaton: NFA.NFA;
}

export default class AutomatonDiagram extends React.Component<AutomatonDiagramProps> {
  render() {
    let render = automatonRender(this.props);
    return <RenderableCanvas {...render}/>;
  }
}

