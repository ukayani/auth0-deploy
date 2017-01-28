'use strict';

const path = require('path');
const components = require('./components');

const componentDirMapping = {
  client: 'clients',
  connection: 'connections',
  resource: 'resource-servers',
  rule: 'rules'
};

const getComponent = type => {
  const component = components[type];

  if (!component) {
    throw new Error('Invalid component type specified: valid [client, connection, resource]');
  }

  return component;
};

const getComponentDirectory = (dir, type) => path.join(dir, componentDirMapping[type]);

const deploySingle = (client, type, dir, name, config) =>
  getComponent(type).createSingle(client, getComponentDirectory(dir, type), name, config);

const deployAll = (client, type, dir, config) =>
  getComponent(type).createAll(client, getComponentDirectory(dir, type), config);

module.exports = {
  single: deploySingle,
  all: deployAll
};
