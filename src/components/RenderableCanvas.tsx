import * as React from 'react';

// -----------------------------------------------------------------------------
// Canvas rendering
// -----------------------------------------------------------------------------

export interface Renderable {
  width: number;
  height: number;
  render: (ctx : CanvasRenderingContext2D, x : number, y : number) => void;
  className?: string;
}

export class RenderableCanvas extends React.Component<Renderable> {
  canvas : React.RefObject<HTMLCanvasElement>;

  constructor(props : Readonly<Renderable>) {
    super(props);
    this.canvas = React.createRef<HTMLCanvasElement>();
  }

  render() {
    return <canvas ref={this.canvas} width={this.props.width} height={this.props.height} className={this.props.className} />;
  }

  componentDidMount() {
    this.draw();
  }

  componentDidUpdate() {
    this.draw();
  }

  draw() {
    if (!this.canvas.current) return;
    let ctx = this.canvas.current.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, this.props.width, this.props.height);
    this.props.render(ctx, 0, 0);
  }
}

