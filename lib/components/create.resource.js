'use strict';
const co = require('bluebird').coroutine;
const fs = require('mz/fs');
const path = require('path');
const _ = require('lodash');
const confProcessor = require('./utils/config.processor.js');
const fsUtils = require('./utils/file.utils.js');

const CONFIG = 'config.json';

const baseResourceConfig = {
  signing_alg: 'RS256'
};

const create = (client, dir, config) => {
  return co(function* () {

    const resources = yield fsUtils.getDirectories(dir);

    for (let i in resources) {
      const resourceData = yield getResourceData(resources[i], config);

      yield createResource(client, resourceData);
    }
  })();
};

const getResourceData = (dir, config) => {
  return co(function* () {
    const files = yield fs.readdir(dir);

    const configFile = files.find(f => f === CONFIG);

    const configData = (configFile) ? yield fsUtils.getFileContent(path.join(dir, configFile)) : '{}';

    return {
      name: path.basename(dir),
      config: confProcessor.process(confProcessor.matcher.basic, configData, config)
    };

  })();
};

const createResource = (client, resourceInfo) => {
  return co(function* () {

    const resources = yield client.resourceServers.getAll();

    const existingResource = resources.find(res => {
      return res.name === resourceInfo.name;
    });

    if (existingResource) {
      console.log(`Updating resource: ${resourceInfo.name}`);
      const delta = _.merge({}, baseResourceConfig, resourceInfo.config);

      delete delta.identifier;
      yield client.resourceServers.update({id: existingResource.id}, delta);

      console.log('Updated resource');

    } else {
      console.log(`Creating resource: ${resourceInfo.name}`);
      const resource = _.merge({}, baseResourceConfig, resourceInfo.config);
      resource.name = resourceInfo.name;

      yield client.resourceServers.create(resource);

      console.log('Created resource');
    }

  })();
};

module.exports = {
  create
};
