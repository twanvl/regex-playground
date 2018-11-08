
// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function mapMap<K,V,V2>(map : Map<K,V>, fun : (v : V) => V2) : Map<K,V2> {
  let result = new Map<K,V2>();
  for (const [k,v] of map.entries()) {
    result.set(k, fun(v));
  }
  return result;
}

function fillArray<T>(n : number, value : T) : T[] {
  return Array(n).fill(value);
}

// remove duplicates (in place)
function removeDuplicates<T>(items : T[]) : T[] {
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
