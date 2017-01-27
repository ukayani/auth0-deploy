'use strict';
const co = require('bluebird').coroutine;
const fsUtils = require('./utils/file.utils');
const path = require('path');

const createSingleFn = (component) =>
  (client, componentDir, name, config) => component.create(client, path.join(componentDir, name), config);

const createAllFn = (component) => (client, componentDir, config) => {
  return co(function* () {

    const directories = yield fsUtils.getDirectories(componentDir);

    for (let i in directories) {
      yield component.create(client, directories[i], config);
    }
  })();
};

const createModule = (component) => ({
  createSingle: createSingleFn(component),
  createAll: createAllFn(component)
});

module.exports = {
  client: createModule(require('./create.client')),
  connection: createModule(require('./create.connection')),
  resource: createModule(require('./create.resource'))
};
