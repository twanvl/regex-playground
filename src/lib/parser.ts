// -----------------------------------------------------------------------------
// Parser utilities
// -----------------------------------------------------------------------------

export type ParseError = {type:"error", position:number, message:string};

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
    return { type:"error", message:"Expected " + thing + " instead of " + this.tokenMessage(), position:this.position };
  }

  tokenMessage() : string {
    if (this.eof()) {
      return "end-of-input";
    } else {
      return this.peek();
    }
  }
}
