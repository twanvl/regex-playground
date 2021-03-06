import * as RE from '../lib/regex';
import * as React from 'react';

// -----------------------------------------------------------------------------
// Railroad diagrams
// -----------------------------------------------------------------------------

interface Part {
  baseline: number;
  width: number;
  height: number;
  body: React.ReactNode;
}

function pathBackRoad(x1 : number, y1 : number, x2 : number, y2 : number, radius : number) {
  return `
    M ${x1-radius} ${y1}
    A ${radius} ${radius} 0 0 1  ${x1} ${y1+radius}
    L ${x1} ${y2-radius}
    A ${radius} ${radius} 0 0 1  ${x1-radius} ${y2}
    L ${x2+radius} ${y2}
    A ${radius} ${radius} 0 0 1  ${x2} ${y2-radius}
    L ${x2} ${y1+radius}
    A ${radius} ${radius} 0 0 1  ${x2+radius} ${y1}
  `;
}

function pathForkRoad(x1:number, y1:number, x2:number, y2:number, x3:number, radius:number) {
  radius = Math.min(radius, Math.min(Math.abs(y1-y2)/2, Math.abs(x1-x2)/2));
  let xm = (x1+x2)/2;
  let x1a = xm - radius*Math.sign(x2-x1);
  let x2a = xm + radius*Math.sign(x2-x1);
  let y1a = y1 + radius*Math.sign(y2-y1);
  let y2a = y2 - radius*Math.sign(y2-y1);
  let sweep = (x2>x1) == (y2>y1) ? 1 : 0;
  return `
    M ${x1} ${y1}
    L ${x1a} ${y1}
    A ${radius} ${radius} 0 0 ${sweep} ${xm} ${y1a}
    L ${xm} ${y2a}
    A ${radius} ${radius} 0 0 ${1-sweep} ${x2a} ${y2}
    L ${x3} ${y2}
  `;
}

function translate(dx : number, dy : number) {
  return `translate(${dx} ${dy})`;
}

function railroadLayout(re : RE.Regex) : Part {
  const rowHeight = 30;
  const cellWidth = 50;
  const crossSize = 8;
  switch (re.type) {
    case "char": {
      const rowHeight = 40;
      const center = cellWidth / 2;
      const radius = 15;
      return {width:cellWidth, height: rowHeight, baseline: rowHeight/2, body: (
        <g className="node">
          <line x1={0} y1={0} x2={cellWidth} y2={0} />
          <circle cx={cellWidth/2} cy={0} r={radius} stroke='#006' fill='#fff' />
          <text x={cellWidth/2} y={0} stroke="none" fill="#000" textAnchor="middle" className="node-label" dominantBaseline="central">{re.char}</text>
        </g>
      )};
    }
    case "product": {
      if (re.children.length == 0) {
        return {width:cellWidth, height: rowHeight, baseline: rowHeight/2, body: ( 
          <line x1={0} y1={0} x2={cellWidth} y2={0} />
        )};
      }
      const layouts = re.children.map(railroadLayout);
      const width    = layouts.reduce((w,a) => w + a.width, 0);
      const baseline = layouts.reduce((h,a) => Math.max(h,a.baseline), rowHeight / 2);
      const height   = layouts.reduce((h,a) => Math.max(h,a.height-a.baseline), rowHeight / 2) + baseline;
      // parts
      let left = 0;
      let bodyParts : React.ReactNode[] = [];
      for(const part of layouts) {
        bodyParts.push(<g transform={translate(left, 0)}>{part.body}</g>);
        left += part.width;
      }
      return {width,height,baseline, body: <>{...bodyParts}</>};
    }
    case "sum": {
      if (re.children.length == 0) {
        return {width: cellWidth, height: rowHeight, baseline: rowHeight/2, body: (
          <>
            <line x1={0} y1={0} x2={5} y2={0} />
            <line x1={cellWidth-5} y1={0} x2={cellWidth} y2={0} />
            <line x1={cellWidth/2-crossSize} y1={-crossSize} x2={cellWidth/2+crossSize} y2={+crossSize} stroke="red" />
            <line x1={cellWidth/2-crossSize} y1={+crossSize} x2={cellWidth/2+crossSize} y2={-crossSize} stroke="red" />
          </>
        )};
      }
      const layouts = re.children.map(railroadLayout);
      const xspace = 20;
      const yspace = 0;
      const radius = 10;
      const width = layouts.reduce((w,a) => Math.max(w,a.width), cellWidth) + 2*xspace;
      const height = layouts.reduce((h,a) => h + a.height, 0) + 2*yspace;
      // baselines relative to our top
      let topInner = 0;
      for(let part of layouts) {
        part.baseline += topInner;
        topInner += part.height;
      }
      // put baseline midway between first and last baselines
      const baseline = layouts.length == 0 ? 0 : (layouts[0].baseline + layouts[layouts.length-1].baseline) / 2;
      let bodyParts : React.ReactNode[] = [];
      for(const part of layouts) {
        let leftInner = (width-part.width)/2;
        let rightInner = leftInner + part.width;
        let yInner = part.baseline - baseline;
        bodyParts.push(<g transform={translate(leftInner, yInner)}>{part.body}</g>);
        bodyParts.push(<path d={pathForkRoad(0,0, xspace,yInner, leftInner, radius)} fill="none"/>);
        bodyParts.push(<path d={pathForkRoad(width,0, width-xspace,yInner, rightInner, radius)} fill="none"/>);
        topInner += part.height;
      }
      return {width,height,baseline, body: <>{...bodyParts}</>};
    }
    case "star": {
      const a = railroadLayout(re.child);
      const xspace = 20;
      const yspace = 20;
      const radius = 10;
      const width = a.width + 2*xspace;
      const height = a.height + yspace;
      const baseline = a.baseline;
      const backy = a.height - a.baseline + yspace/2;
      const innerleft = xspace;
      const innerright = a.width + xspace;
      const left = xspace/2;
      const right = a.width + xspace*3/2;
      return {width,height,baseline, body: (
        <>
          <line x1={0} y1={0} x2={innerleft} y2={0} />
          <g transform={translate(innerleft,0)}>{a.body}</g>
          <line x1={innerright} y1={0} x2={width} y2={0} />
          <path d={pathBackRoad(right,0,left,backy,radius)} fill="none" stroke="#600" />
        </>
      )};
    }
  }
}

function railroadRender(x : RE.Regex) : Part {
  const layout = railroadLayout(x);
  const boxWidth = 2;
  const boxHeight = 16;
  const width = layout.width + 2*boxWidth;
  const height = Math.max(layout.height, boxHeight);
  return {width, height, baseline:0, body: (
    <g transform={translate(boxWidth,layout.baseline)} stroke="black" strokeWidth="2">
      {layout.body}
      <rect x={-boxWidth} y={-boxHeight/2} width={boxWidth} height={boxHeight} />
      <rect x={layout.width} y={-boxHeight/2} width={boxWidth} height={boxHeight} />
    </g>
  )};
}

interface RailroadDiagramProps {
  regex : RE.Regex;
}

export default class RailroadDiagramSVG extends React.Component<RailroadDiagramProps> {
  render() {
    let layout = railroadRender(this.props.regex);
    return (
      <svg width={layout.width} height={layout.height} className="railroad">
        {layout.body}
      </svg>
    );
  }
}

