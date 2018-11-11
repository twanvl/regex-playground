// -----------------------------------------------------------------------------
// Localization
// -----------------------------------------------------------------------------

// dictionary
export type Locale =
  // parsing
  { expected: (want:string,got:string) => string
  , endOfInput: string
  , regularExpression: string
  , warnRegexQuestionmark: string
  , warnRegexPipe: string

  // simple languages
  };

// -----------------------------------------------------------------------------
// English
// -----------------------------------------------------------------------------

export const english : Locale =
  { expected: (want,got) => "Expected " + want + " instead of " + got
  , endOfInput: "end-of-input"
  , regularExpression: "Regular expression"
  , warnRegexQuestionmark: "The '?' symbol in regular expressions is not standard, use '+1' instead."
  , warnRegexPipe:         "The '|' symbol in regular expressions is not standard, use '+' instead."
  };

// -----------------------------------------------------------------------------
// Dutch
// -----------------------------------------------------------------------------

export const dutch : Locale =
  { expected: (want,got) => want + " verwacht in plaats van " + got
  , endOfInput: "einde van de invoer"
  , regularExpression: "Reguliere expressie"
  , warnRegexQuestionmark: "Gebruik in plaats daarvan '+1' in plaats van '?'."
  , warnRegexPipe:         "Gebruik in plaats daarvan '+' in plaats van '|'."
  };

// -----------------------------------------------------------------------------
// The locale
// -----------------------------------------------------------------------------

export var locale : Locale = english;

export function setLocale(l : Locale) : void {
  locale = l;
}

