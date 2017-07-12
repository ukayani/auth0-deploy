'use strict';
const getMatches = (string, regex, index) => {
  // default to the first capturing group
  index || (index = 1);
  const matches = [];
  let match;
  while (match = regex.exec(string)) { // eslint-disable-line no-cond-assign
    matches.push(match[index]);
  }
  return matches;
};

const basicMatcher = {
  pattern: /@@(\w+)@@/g,
  toPlaceHolder: (str) => new RegExp(`@@${str}@@`, 'g')
};

const identity = (rendered) => {
  return rendered;
};

const processConfig = (parser) => (basicMatcher, raw, config) => {

  const parserFn = parser || identity;

  const matches = getMatches(raw, basicMatcher.pattern);

  const rendered = matches.reduce((acc, elem) => {
    const value = config.get(elem);
    if (value === undefined) throw new Error(`Could not find ${elem} in config`);

    const regex = basicMatcher.toPlaceHolder(elem);
    return acc.replace(regex, value);
  }, raw);

  return parserFn(rendered);
};

module.exports = {
  processJSON: processConfig(JSON.parse),
  processRaw: processConfig(identity),
  matcher: {
    basic: basicMatcher
  }
};
