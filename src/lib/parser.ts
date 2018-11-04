import {locale} from './localization';

// -----------------------------------------------------------------------------
// Parser utilities
// -----------------------------------------------------------------------------

export class ParseError {
  type     : "error" = "error";
  position : number;
  message  : string;

  constructor(message : string, position : number) {
    this.message = message;
    this.position = position;
  }

  toString() {
    return this.message +" at " + this.position;
  }
};

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
}
