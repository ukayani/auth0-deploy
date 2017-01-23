const getMatches = (string, regex, index) => {
  index || (index = 1); // default to the first capturing group
  const matches = [];
  let match;
  while (match = regex.exec(string)) {
    matches.push(match[index]);
  }
  return matches;
};

const basicMatcher = {
  pattern: /@@(\w+)@@/g,
  toPlaceHolder: (str) => new RegExp(`@@${str}@@`, 'g')
};

const processConfig = (basicMatcher, raw, config) => {

  const matches = getMatches(raw, basicMatcher.pattern);

  const rendered = matches.reduce((acc, elem) => {
    const value = config.get(elem);
    if (value === undefined) throw new Error(`Could not find ${elem} in config`);

    const regex = basicMatcher.toPlaceHolder(elem);
    return acc.replace(regex, value);
  }, raw);

  return JSON.parse(rendered);
};

module.exports = {
  process: processConfig,
  matcher: {
    basic: basicMatcher
  }
};
