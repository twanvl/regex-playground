// Regex Playground: Regular expressions

import {locale} from './localization';
import {Parser,ParseError, ParseResult} from './parser';

// -----------------------------------------------------------------------------
// Data types
// -----------------------------------------------------------------------------

export type SimpleRegex
  = { readonly type: "zero" }
  | { readonly type: "one" }
  | { readonly type: "char"; readonly char: string }
  | { readonly type: "star"; readonly a: SimpleRegex }
  | { readonly type: "plus"; readonly a: SimpleRegex; readonly b: SimpleRegex }
  | { readonly type: "times"; readonly a: SimpleRegex; readonly b: SimpleRegex };

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

// Does a regex match the empty string?
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

// Find any word that is matched by the regex
export function makeWord(x : SimpleRegex) : string | null {
  switch (x.type) {
    case "zero": return null;
    case "one":  return "";
    case "char": return x.char;
    case "star": return "";
    case "plus": {
      let a = makeWord(x.a);
      if (a != null) return a;
      let b = makeWord(x.b);
      return b;
    }
    case "times": {
      let a = makeWord(x.a);
      let b = makeWord(x.b);
      if (a == null || b == null) return null;
      return a + b;
    }
  }
}

export function getSumParts(x : SimpleRegex) : SimpleRegex[] {
  if (x.type == "plus") {
    return getSumParts(x.a).concat(getSumParts(x.b));
  } else {
    return [x];
  }
}

export function getProductParts(x : SimpleRegex) : SimpleRegex[] {
  if (x.type == "times") {
    return getProductParts(x.a).concat(getProductParts(x.b));
  } else {
    return [x];
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

function parsePrimRegex(p : Parser) : ParseResult<SimpleRegex> {
  p.skipWhitespace();
  if (p.eof()) {
    return new ParseResult(one).addError(p.expected(locale.regularExpression));
  } else if (p.token("(")) {
    let a = parseRegexPrivate(p,0);
    p.skipWhitespace();
    if (!p.token(")")) a.addError(p.expected("')'"));
    return a;
  } else if (p.token("0")) {
    return new ParseResult(zero);
  } else if (p.token("1")) {
    return new ParseResult(one);
  } else if ("+*|?)".indexOf(p.peek()) == -1) {
    return new ParseResult(char(p.anyChar()));
  } else {
    return new ParseResult(one).addError(p.expected(locale.regularExpression));
  }
}

function parseRegexPrivate(p : Parser, level : number) : ParseResult<SimpleRegex> {
  var a = parsePrimRegex(p);
  p.skipWhitespace();
  while (!p.eof()) {
    if (level <= 0 && p.token("+")) {
      let b = parseRegexPrivate(p, 1);
      a = a.map2(b,plus);
    } else if (level <= 10 && p.token("|")) {
      let err = p.error(locale.warnRegexPipe);
      let b = parseRegexPrivate(p, 1);
      a = a.map2(b,plus).addError(err);
    } else if (level <= 11 && p.token("*")) {
      a = a.map(star);
    } else if (level <= 11 && p.token("?")) {
      let err = p.error(locale.warnRegexQuestionmark);
      a = a.map((x) => plus(x,one)).addError(err);
    } else if (level <= 10 && "+*|?)".indexOf(p.peek()) == -1) {
      let b = parseRegexPrivate(p, 10);
      a = a.map2(b,times);
    } else {
      break;
    }
    p.skipWhitespace();
  }
  return a;
}

export function parseRegex(x : string) : ParseResult<SimpleRegex> {
  let parser = new Parser(x);
  let result = parseRegexPrivate(parser, 0);
  if (!parser.eof()) result.addError(parser.expected("end-of-input"));
  return result;
}
