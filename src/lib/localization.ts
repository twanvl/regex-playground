// -----------------------------------------------------------------------------
// Localization
// -----------------------------------------------------------------------------

// dictionary
export type Locale =
  // parsing
  { expected: (want:string,got:string) => string
  , endOfInput: string
  , regularExpression: string

  // simple languages
  };

// -----------------------------------------------------------------------------
// English
// -----------------------------------------------------------------------------

export const english : Locale =
  { expected: (want,got) => "Expected " + want + " instead of " + got
  , endOfInput: "end-of-input"
  , regularExpression: "regular expression"
  };

// -----------------------------------------------------------------------------
// Dutch
// -----------------------------------------------------------------------------

export const dutch : Locale =
  { expected: (want,got) => want + " verwachte in plaats van " + got
  , endOfInput: "einde van de invoer"
  , regularExpression: "reguliere expressie"
  };

// -----------------------------------------------------------------------------
// The locale
// -----------------------------------------------------------------------------

export var locale : Locale = english;

export function setLocale(l : Locale) : void {
  locale = l;
}

