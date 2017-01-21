'use strict';

const co = require('bluebird').coroutine;
const path = require('path');
const components = require('./components');

const componentDirMapping = {
  client: 'clients',
  connection: 'connections',
  resource: 'resource-servers'
};

const deploy = (client, type, dir, config) => {
  return co(function* () {

    const component = components[type];

    if (!component) {
      throw new Error('Invalid component type specified: valid [client, connection, resource]');
    }

    component.create(client, path.join(dir, componentDirMapping[type]), config);

  })();
};

module.exports = deploy;
