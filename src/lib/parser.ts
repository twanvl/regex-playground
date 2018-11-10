import {locale} from './localization';

// -----------------------------------------------------------------------------
// Parser utilities
// -----------------------------------------------------------------------------

export class ParseError {
  constructor(public message : string, public position : number) {}

  toString() {
    return this.message +" at " + this.position;
  }
}

export class ParseResult<A> {
  constructor(public value : A, public errors : ParseError[] = []) {}

  addError(err : ParseError) : ParseResult<A> {
    this.errors.push(err);
    return this;
  }

  failed() : boolean {
    return this.errors.length > 0;
  }

  map<B> (f : (x : A) => B) : ParseResult<B> {
    return new ParseResult(f(this.value), this.errors);
  }
  map2<B,C> (b : ParseResult<B>, f : (x : A, y : B) => C) : ParseResult<C> {
    return new ParseResult(f(this.value, b.value), this.errors.concat(b.errors));
  }
}

export class Parser {
  string : string;
  position : number;

  constructor(x : string) {
    this.string = x;
    this.position = 0;
  }

  skipWhitespace() : void {
    while (this.position < this.string.length && " \t\n\r\v".indexOf(this.string[this.position]) > -1) {
      this.position++;
    }
  }

  eof() : boolean {
    return this.position >= this.string.length;
  }

  token(tok : string) : boolean {
    if (this.position < this.string.length && this.string[this.position] == tok) {
      this.position++;
      return true;
    } else {
      return false;
    }
  }

  anyChar() : string {
    return this.string[this.position++];
  }

  peek() : string {
    return this.string[this.position];
  }

  // Error messages
  expected(thing : string) : ParseError {
    return new ParseError(locale.expected(thing, this.tokenMessage()), this.position);
  }

  tokenMessage() : string {
    if (this.eof()) {
      return locale.endOfInput;
    } else {
      return this.peek();
    }
  }

  error(message : string) : ParseError {
    return new ParseError(message, this.position);
  }
}
