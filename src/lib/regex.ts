// Regex Playground: Regular expressions

import {locale} from './localization';
import {Parser,ParseError, ParseResult} from './parser';

// -----------------------------------------------------------------------------
// Data types
// -----------------------------------------------------------------------------

class RegexChar {
  public type: "char" = "char";
  constructor(public char : string) {}

  toString() : string { return showRegex(this); }
}

class RegexSum {
  public type: "sum" = "sum";
  constructor(public children : Regex[]) {}

  toString() : string { return showRegex(this); }
}

class RegexProduct {
  public type: "product" = "product";
  constructor(public children : Regex[]) {}

  toString() : string { return showRegex(this); }
}

class RegexStar {
  public type: "star" = "star";
  constructor(public child : Regex) {}

  toString() : string { return showRegex(this); }
}

export type Regex = RegexChar | RegexSum | RegexProduct | RegexStar;

// -----------------------------------------------------------------------------
// Construction
// -----------------------------------------------------------------------------

export const zero : Regex = new RegexSum([]);
export const one : Regex  = new RegexProduct([]);
export function char(x : string) : Regex {
  return new RegexChar(x);
}
export function star(a : Regex) : Regex {
  if ((a.type == "sum" || a.type == "product") && a.children.length == 0) return one;
  return new RegexStar(a);
}
export function sum(xs : Regex[]) : Regex {
  let out : Regex[] = [];
  for (let x of xs) {
    if (x.type == "sum") {
      for (let y of x.children) out.push(y);
    } else {
      out.push(x);
    }
  }
  return new RegexSum(out);
}
export function plus(a : Regex, b : Regex) : Regex {
  return sum([a,b]);
}
export function product(xs : Regex[]) : Regex {
  let out : Regex[] = [];
  for (let x of xs) {
    if (x.type == "product") {
      for (let y of x.children) out.push(y);
    } else if (x.type == "sum" && x.children.length == 0) {
      return zero;
    } else {
      out.push(x);
    }
  }
  return new RegexProduct(out);
}
export function times(a : Regex, b : Regex) : Regex {
  return product([a,b]);
}

// -----------------------------------------------------------------------------
// Properties
// -----------------------------------------------------------------------------

// Does a regex match the empty string?
export function containsEmpty(x : Regex) : boolean {
  switch (x.type) {
    case "char": return false;
    case "sum": return x.children.some(containsEmpty);
    case "product": return x.children.every(containsEmpty);
    case "star": return true;
  }
}

// Find any word that is matched by the regex
export function makeWord(x : Regex) : string | null {
  switch (x.type) {
    case "char": return x.char;
    case "star": return "";
    case "sum": {
      for (const c of x.children) {
        let word = makeWord(c);
        if (word !== null) return word;
      }
      return null;
    }
    case "product": {
      let parts = x.children.map(makeWord);
      if (parts.some((c) => c === null)) return null;
      return parts.join();
    }
  }
}

// -----------------------------------------------------------------------------
// Display
// -----------------------------------------------------------------------------

function showParen(show : boolean, x : string) : string {
  return show ? "(" + x + ")" : x;
}

export function showRegex(x : Regex, level = 0) : string {
  switch (x.type) {
    case "char":    return x.char;
    case "star":    return showRegex(x.child, 11) + "*";
    case "sum":     return x.children.length == 0 ? "0" : showParen(level > 0,  x.children.map((c) => showRegex(c,0)).join("+"));
    case "product": return x.children.length == 0 ? "1" : showParen(level > 10, x.children.map((c) => showRegex(c,10)).join());
  }
}

// -----------------------------------------------------------------------------
// Parsing
// -----------------------------------------------------------------------------

function parsePrimRegex(p : Parser) : ParseResult<Regex> {
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

function parseRegexPrivate(p : Parser, level : number) : ParseResult<Regex> {
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

export function parseRegex(x : string) : ParseResult<Regex> {
  let parser = new Parser(x);
  let result = parseRegexPrivate(parser, 0);
  if (!parser.eof()) result.addError(parser.expected("end-of-input"));
  return result;
}
