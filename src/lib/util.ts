
// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

export function mapMap<K,V,V2>(map : Map<K,V>, fun : (v : V) => V2) : Map<K,V2> {
  let result = new Map<K,V2>();
  for (const [k,v] of map.entries()) {
    result.set(k, fun(v));
  }
  return result;
}

export function fillArray<T>(n : number, value : T) : T[] {
  return Array(n).fill(value);
}

// remove duplicates (in place)
export function removeDuplicates<T>(items : T[]) : T[] {
  items.sort();
  let pos = 0;
  for (let i = 1; i < items.length; ++i) {
    if (items[pos] != items[i]) {
      pos++;
      items[pos] = items[i];
    }
  }
  items.splice(pos+1);
  return items;
}

// -----------------------------------------------------------------------------
// Grahpics utilities
// -----------------------------------------------------------------------------

export type vec2 = [number,number];

export namespace vec2 {
  export function add([x1,y1] : vec2, [x2,y2] : vec2) : vec2 {
    return [x1+x2, y1+y2];
  }
  export function addMul([x1,y1] : vec2, [x2,y2] : vec2, scale : number) : vec2 {
    return [x1+x2*scale, y1+y2*scale];
  }
  export function sub([x1,y1] : vec2, [x2,y2] : vec2) : vec2 {
    return [x1-x2, y1-y2];
  }
  export function mul([x1,y1] : vec2, [x2,y2] : vec2) : vec2 {
    return [x1*x2, y1*y2];
  }
  export function addInDirection([x,y] : vec2, [dirX,dirY] : vec2, [u,v] : vec2) : vec2 {
    return [x + dirX*u + dirY*v, y + dirY*u - dirX*v];
  }
  export function lerp(a : vec2, b : vec2, t : number) : vec2 {
    return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  }
  export function direction([x1,y1] : vec2, [x2,y2] : vec2) : vec2 {
    return normalize([x2-x1,y2-y1]);
  }
  export function scale([x,y] : vec2, scale : number) : vec2 {
    return [x*scale, y*scale];
  }
  export function norm([x,y] : vec2) : number {
    return Math.sqrt(x*x + y*y);
  }
  export function normSquared([x,y] : vec2) : number {
    return (x*x + y*y);
  }
  export function normalize(x : vec2) : vec2 {
    return scale(x, 1 / norm(x));
  }
  export function distanceSquared(a : vec2, b : vec2) : number {
    return normSquared(sub(a,b));
  }
  export function distance(a : vec2, b : vec2) : number {
    return norm(sub(a,b));
  }
  export function dot(a : vec2, b : vec2) : number {
    return a[0]*b[0] + a[1]*b[1];
  }
}

CanvasRenderingContext2D.prototype.lineToVec = function(p) {
  this.lineTo(p[0], p[1]);
};
CanvasRenderingContext2D.prototype.moveToVec = function(p) {
  this.moveTo(p[0], p[1]);
};
CanvasRenderingContext2D.prototype.bezierCurveToVec = function(cp1,cp2,p) {
  this.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], p[0], p[1]);
};

// -----------------------------------------------------------------------------
// Bezier curves
// -----------------------------------------------------------------------------

function rootBisect(f : (t : number) => number, t1 : number, t2 : number, epsilon = 1e-3) : number {
  let x1 = f(t1);
  let x2 = f(t2);
  if ((x1 < 0) == (x2 < 0)) {
    return (t1 + t2) / 2;
  }
  for (let i = 0 ; i < 20 ; ++i) {
    let tm = (t1 + t2) / 2;
    let xm = f(tm);
    if (Math.abs(xm) < epsilon) return tm;
    if ((xm < 0) == (x1 < 0)) {
      t1 = tm; x1 = xm;
    } else {
      t2 = tm; x2 = xm;
    }
  }
  return (t1 + t2) / 2;
}

function rootNewton(f : (t : number) => [number,number], t : number, epsilon = 1e-3) : number {
  for (let i = 0 ; i < 20 ; ++i) {
    let [x,dx] = f(t);
    let dxe = (f(t+epsilon)[0] - x) / epsilon;
    if (Math.abs(x) < epsilon) return t;
    t -= x / dx;
  }
  return t;
}


export class BezierCurve {
  constructor(public p1 : vec2, public p2 : vec2, public p3 : vec2, public p4 : vec2) {}

  eval(t : number) : vec2 {
    let p12 = vec2.lerp(this.p1,this.p2,t);
    let p23 = vec2.lerp(this.p2,this.p3,t);
    let p34 = vec2.lerp(this.p3,this.p4,t);
    let p123 = vec2.lerp(p12,p23,t);
    let p234 = vec2.lerp(p23,p34,t);
    let p1234 = vec2.lerp(p123,p234,t);
    return p1234;
  }

  gradient(t : number) : vec2 {
    let d12 = vec2.sub(this.p2,this.p1);
    let d23 = vec2.sub(this.p3,this.p2);
    let d34 = vec2.sub(this.p4,this.p3);
    let d123 = vec2.lerp(d12,d23,t);
    let d234 = vec2.lerp(d23,d34,t);
    let d1234 = vec2.lerp(d123,d234,t);
    return vec2.scale(d1234, 3);
  }

  reverse() : BezierCurve {
    return new BezierCurve(this.p4, this.p3, this.p2, this.p1);
  }

  split(t : number) : [BezierCurve,BezierCurve] {
    let p12 = vec2.lerp(this.p1,this.p2,t);
    let p23 = vec2.lerp(this.p2,this.p3,t);
    let p34 = vec2.lerp(this.p3,this.p4,t);
    let p123 = vec2.lerp(p12,p23,t);
    let p234 = vec2.lerp(p23,p34,t);
    let p1234 = vec2.lerp(p123,p234,t);
    return [new BezierCurve(this.p1, p12, p123, p1234), new BezierCurve(p1234, p234, p34, this.p4)];
  }

  slice(t1 : number, t2 : number) : BezierCurve {
    return this.split(t1)[1].split(t2)[0];
  }

  // find t for which the distance from p1 to eval(t) is r
  findIntersectCircle(r : number) : number {
    //return rootBisect((t) => vec2.distanceSquared(this.eval(t),this.p1) - r*r, 0,1);
    return rootNewton((t) => {
      let p = this.eval(t);
      let dp = this.gradient(t);
      let dist = vec2.sub(p,this.p1);
      return [vec2.normSquared(dist) - r*r, 2 * vec2.dot(dist, dp)];
    }, 0.5);
  }

  sliceIntersectCircle(r : number) : BezierCurve {
    return this.split(this.findIntersectCircle(r))[1];
  }
}
