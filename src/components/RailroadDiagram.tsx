import {Renderable,RenderableCanvas} from './RenderableCanvas';
import * as RE from '../lib/regex';
import * as React from 'react';

// -----------------------------------------------------------------------------
// Railroad diagrams
// -----------------------------------------------------------------------------

interface RailroadRenderable extends Renderable {
  baseline: number;
}

function drawBackRoad(ctx : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number, radius : number) {
  ctx.moveTo(x1-radius,y1);
  ctx.arcTo(x1,y1, x1,y1+radius, radius);
  ctx.arcTo(x1,y2, x1-radius,y2, radius);
  ctx.arcTo(x2,y2, x2,y2-radius, radius);
  ctx.arcTo(x2,y1, x2+radius,y1, radius);
}

function drawForkRoad(ctx : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number, radius : number) {
  radius = Math.min(radius, Math.min(Math.abs(y1-y2)/2, Math.abs(x1-x2)/2));
  let xm = (x1+x2)/2;
  let ym = (y1+y2)/2;
  ctx.moveTo(x1,y1);
  ctx.arcTo(xm,y1, xm,ym, radius);
  ctx.arcTo(xm,y2, x2,y2, radius);
}

function railroadLayout(re : RE.Regex) : RailroadRenderable {
  const rowHeight = 30;
  const cellWidth = 50;
  const crossSize = 8;
  switch (re.type) {
    case "char": {
      const rowHeight = 40;
      const center = cellWidth / 2;
      const radius = 15;
      return {width:cellWidth, height: rowHeight, baseline: rowHeight/2, render: (ctx,x,y) => {
        ctx.beginPath();
        ctx.moveTo(x,y);
        ctx.lineTo(x+cellWidth,y);
        ctx.stroke();
        ctx.strokeStyle = '#006';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x+center,y, radius, 0,2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = 'black';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        ctx.fillText(re.char, x+center,y);
      }};
    }
    case "product": {
      const layouts = re.children.map(railroadLayout);
      const width    = layouts.reduce((w,a) => w + a.width, 0);
      const baseline = layouts.reduce((h,a) => Math.max(h,a.baseline), rowHeight / 2);
      const height   = layouts.reduce((h,a) => Math.max(h,a.height-a.baseline), rowHeight / 2) + baseline;
      return {width,height,baseline, render: (ctx,x,y) => {
        for (const a of layouts) {
          a.render(ctx,x,y);
          x += a.width;
        }
      }};
    }
    case "sum": {
      if (re.children.length == 0) {
        return {width: cellWidth, height: rowHeight, baseline: rowHeight/2, render: (ctx,x,y) => {
          ctx.beginPath();
          ctx.moveTo(x,y);
          ctx.lineTo(x+5,y);
          ctx.moveTo(x+cellWidth-5,y);
          ctx.lineTo(x+cellWidth,y);
          ctx.moveTo(x+cellWidth/2-crossSize,y-crossSize);
          ctx.lineTo(x+cellWidth/2+crossSize,y+crossSize);
          ctx.moveTo(x+cellWidth/2-crossSize,y+crossSize);
          ctx.lineTo(x+cellWidth/2+crossSize,y-crossSize);
          ctx.stroke();
        }};
      }
      const layouts = re.children.map(railroadLayout);
      const xspace = 20;
      const yspace = 0;
      const radius = 10;
      const width = layouts.reduce((w,a) => Math.max(w,a.width), cellWidth) + 2*xspace;
      const height = layouts.reduce((h,a) => h + a.height, 0) + 2*yspace;
      const baseline = height / 2;
      return {width,height,baseline, render: (ctx,x,y) => {
        let topInner = yspace - baseline;
        for (let i = 0 ; i < layouts.length ; ++i) {
          let part = layouts[i];
          let leftInner = (width-part.width)/2;
          let rightInner = leftInner + part.width;
          let yInner = topInner + part.baseline;
          part.render(ctx, x+leftInner, y+yInner);
          ctx.beginPath();
          drawForkRoad(ctx, x,y, x+xspace,y+yInner, radius);
          ctx.lineTo(x+leftInner,y+yInner);
          drawForkRoad(ctx, x+width,y, x+width-xspace,y+yInner, radius);
          ctx.lineTo(x+rightInner,y+yInner);
          ctx.stroke();
          topInner += part.height;
        }
      }};
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
      return {width,height,baseline, render: (ctx,x,y) => {
        a.render(ctx,x+innerleft,y);
        ctx.beginPath();
        ctx.moveTo(x,y); ctx.lineTo(x+innerleft,y);
        ctx.moveTo(x+innerright,y); ctx.lineTo(x+width,y);
        ctx.stroke();
        ctx.strokeStyle = "#600";
        ctx.beginPath();
        drawBackRoad(ctx, x+right,y, x+left,y+backy, radius);
        ctx.stroke();
        ctx.strokeStyle = "black";
      }};
    }
    default: return {width:cellWidth, height: rowHeight, baseline: rowHeight/2, render: (ctx,x,y) => {
      ctx.beginPath();
      ctx.moveTo(x,y);
      ctx.lineTo(x+cellWidth,y);
      ctx.stroke();
    }};
  }
}

function railroadRender(x : RE.Regex) : Renderable {
  const layout = railroadLayout(x);
  const circSize = 3;
  const circSpace = 10;
  const width = layout.width + 2*circSpace;
  const height = Math.max(layout.height, 2*circSpace);
  const baseline = layout.baseline;
  return {width, height, render: (ctx) => {
    ctx.lineWidth = 2;
    ctx.font = '16px serif';
    ctx.beginPath();
    ctx.arc(circSpace-circSize, baseline, circSize, 0,2*Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(circSpace+layout.width+circSize, baseline, circSize, 0,2*Math.PI);
    ctx.stroke();
    layout.render(ctx, circSpace, baseline);
  }};
}

interface RailroadDiagramProps {
  regex : RE.Regex;
}

export default class RailroadDiagram extends React.Component<RailroadDiagramProps> {
  layout? : Renderable;

  render() {
    this.layout = railroadRender(this.props.regex);
    return <RenderableCanvas {...this.layout}/>;
  }
}

