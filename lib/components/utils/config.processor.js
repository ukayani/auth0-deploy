const placeholderPattern = /^@@(.*)@@$/;

const getKey = (str) => {
  const match = str.match(placeholderPattern);

  return (match) ? match[1] : undefined;
};

const hasKey = (str) => {
  return getKey(str) ? true : false;
};

const basicMatcher = {
  getKey,
  hasKey
};

const processConfig = (matcher, obj, config) => {

  const parsed = JSON.parse(obj);

  const process = (obj) => {
    if (obj instanceof Array) {
      return obj.map(e => process(e));
    } else if (typeof(obj) === 'object' && obj != null) {
      const keys = Object.keys(obj);

      keys.forEach(k => {
        obj[k] = process(obj[k]);
      });

      return obj;
    } else if (typeof(obj) === 'string' && matcher.hasKey(obj)) {
      return config.get(matcher.getKey(obj));
    }

    return obj;
  };

  return process(parsed);
};

module.exports = {
  process: processConfig,
  matcher: {
    basic: basicMatcher
  }
};
