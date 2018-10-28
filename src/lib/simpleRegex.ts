// Regex Playground: Regular expressions

import {Parser,ParseError} from './parser';

// -----------------------------------------------------------------------------
// Data types
// -----------------------------------------------------------------------------

export type SimpleRegex
  = { readonly type: "zero" }
  | { readonly type: "one" }
  | { readonly type: "char"; readonly char: string }
  | { readonly type: "star"; readonly a: SimpleRegex }
  | { readonly type: "plus"; readonly a: SimpleRegex; readonly b: SimpleRegex }
  | { readonly type: "times"; readonly a: SimpleRegex; readonly b: SimpleRegex }

// -----------------------------------------------------------------------------
// Construction
// -----------------------------------------------------------------------------

export const zero : SimpleRegex = {type:"zero"};
export const one : SimpleRegex  = {type:"one"};
export function char(x : string) : SimpleRegex {
  return {type:"char", char:x};
}
export function star(a : SimpleRegex) : SimpleRegex {
  if (a.type == "zero" || a.type == "one") return one;
  return {type:"star", a:a};
}
export function plus(a : SimpleRegex, b : SimpleRegex) : SimpleRegex {
  if (a.type == "zero") return b;
  if (b.type == "zero") return a;
  return {type:"plus", a:a, b:b};
}
export function times(a : SimpleRegex, b : SimpleRegex) : SimpleRegex {
  if (a.type == "zero") return zero;
  if (b.type == "zero") return zero;
  if (a.type == "one") return b;
  if (b.type == "one") return a;
  return {type:"times", a:a, b:b};
}

// -----------------------------------------------------------------------------
// Properties
// -----------------------------------------------------------------------------

export function containsEmpty(x : SimpleRegex) : boolean {
  switch (x.type) {
    case "zero": return false;
    case "one":  return true;
    case "char": return false;
    case "star": return true;
    case "plus": return containsEmpty(x.a) || containsEmpty(x.b);
    case "times": return containsEmpty(x.a) && containsEmpty(x.b);
  }
}

// -----------------------------------------------------------------------------
// Display
// -----------------------------------------------------------------------------

export function showRegex(x : SimpleRegex, level? : number) : string {
  switch (x.type) {
    case "zero": return "0";
    case "one":  return "1";
    case "char": return x.char;
    case "star": return showRegex(x.a, 11) + "*";
    case "plus":
      if (level && level > 0) {
        return "(" + showRegex(x.a, 0) + "+" + showRegex(x.b, 0) + ")";
      } else {
        return showRegex(x.a, 0) + "+" + showRegex(x.b, 0);
      }
    case "times":
      if (level && level > 10) {
        return "(" + showRegex(x.a, 0) + showRegex(x.b, 0) + ")";
      } else {
        return showRegex(x.a, 10) + showRegex(x.b, 10);
      }
  }
}

// -----------------------------------------------------------------------------
// Parsing
// -----------------------------------------------------------------------------

function parsePrimRegex(p : Parser) : SimpleRegex | ParseError {
  p.skipWhitespace();
  if (p.eof()) {
    return p.expected("regular expression");
  } else if (p.token("(")) {
    let a = parseRegexPrivate(p,0);
    if (a.type == "error") return a;
    p.skipWhitespace();
    if (!p.token(")")) return p.expected("')'");
    return a;
  } else if (p.token("0")) {
    return zero;
  } else if (p.token("1")) {
    return one;
  } else if ("+*|?)".indexOf(p.peek()) == -1) {
    return char(p.anyChar());
  } else {
    return p.expected("regular expression");
  }
}

function parseRegexPrivate(p : Parser, level : number) : SimpleRegex | ParseError {
  var a = parsePrimRegex(p);
  if (a.type == "error") return a;
  p.skipWhitespace();
  while (!p.eof()) {
    if (level <= 0 && p.token("+")) {
      let b = parseRegexPrivate(p, 1);
      if (b.type == "error") return b;
      a = plus(a, b);
    } else if (level <= 11 && p.token("*")) {
      a = star(a);
    } else if (level <= 10 && "+*|?)".indexOf(p.peek()) == -1) {
      let b = parseRegexPrivate(p, 10);
      if (b.type == "error") return b;
      a = times(a, b);
    } else {
      break;
    }
    p.skipWhitespace();
  }
  return a;
}

export function parseRegex(x : string) : SimpleRegex | ParseError {
  let parser = new Parser(x);
  let result = parseRegexPrivate(parser, 0);
  if (result.type == "error") return result;
  if (!parser.eof) return parser.expected("end-of-input");
  return result;
}