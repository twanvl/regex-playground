
declare class vec2 extends Float32Array {}

type Vec2Like = vec2 | [number,number];

interface CanvasRenderingContext2D {
  lineToVec(p : Vec2Like) : void;
  moveToVec(p : Vec2Like) : void;
  bezierCurveToVec(cp1 : Vec2Like, cp2 : Vec2Like, p : Vec2Like) : void;
}
