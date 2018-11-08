
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
  export function addInDirection([x,y] : vec2, [dirX,dirY] : vec2, [u,v] : vec2) : vec2 {
    return [x + dirX*u + dirY*v, y + dirY*u - dirX*v];
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
  export function normalize(x : vec2) : vec2 {
    return scale(x, 1 / norm(x));
  }
}

interface CanvasRenderingContext2D {
  lineToVec(p : Vec2Like): void;
  moveToVec(p : Vec2Like): void;
}

CanvasRenderingContext2D.prototype.lineToVec = function(p) {
  this.lineTo(p[0], p[1]);
};
CanvasRenderingContext2D.prototype.moveToVec = function(p) {
  this.moveTo(p[0], p[1]);
};
