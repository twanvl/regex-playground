
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

