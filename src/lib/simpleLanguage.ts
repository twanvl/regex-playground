
// -----------------------------------------------------------------------------
// Data ty[es
// -----------------------------------------------------------------------------

// Regular languages as set comprehensions
type Condition
  = {type:"ends-with", string:string}
  | {type:"starts-with", string:string}
  | {type:"contains", string:string, minCopies:number, maxCopies:number}
  | {type:"not", a:Condition}
  | {type:"and", a:Condition, b:Condition}
  | {type:"or", a:Condition, b:Condition};

type SimpleLanguage
  = {type:"simple-language", alphabet:Alphabet, condition:Condition};

export type Alphabet = ReadonlyArray<string>;

// -----------------------------------------------------------------------------
// Show
// -----------------------------------------------------------------------------

function showSimpleLanguage(l : SimpleLanguage) {
  return "{" + "w in " + showAlphabet(l.alphabet) + " | " + showCondition(l.condition,"w") + "}";
}
function showCondition(c : Condition, w : string) {
  switch(c.type) {
    case "ends-with": return w + " ends with " + c.string;
  }
  return "TODO";
}
function showAlphabet(a : Alphabet) {
  return "{" + a.join(",") + "}";
}

// -----------------------------------------------------------------------------
// Generate random languages
// -----------------------------------------------------------------------------

function randomAlphabet(complexity : number) : Alphabet {
  if (complexity < 0.5 || Math.random() < 0.5) {
    return ["a","b"];
  } else {
    return ["a","b","c"];
  }
}
function randomLanguage(complexity : number) {
  return {type:"ends-with", string:randomString()};
}
function randomString() {
  return "a";
}
