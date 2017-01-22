const co = require('bluebird').coroutine;
const fs = require('mz/fs');
const path = require('path');
const _ = require('lodash');
const confProcessor = require('./utils/config.processor.js');
const fsUtils = require('./utils/file.utils.js');

const CONFIG = 'config.json';
const GRANTS = 'grants.json';

const baseClientConfig = {
  jwt_configuration: {
    alg: 'RS256',
    lifetime_in_seconds: 36000
  },
  token_endpoint_auth_method: 'none',
  app_type: 'regular_web'
};

const create = (client, dir, config) => {
  return co(function* () {

    const authClients = yield fsUtils.getDirectories(dir);

    for (let i in authClients) {
      const authClientData = yield getClientData(authClients[i], config);

      yield createAuthClient(client, authClientData);
    }
  })();
};

const getClientData = (dir, config) => {
  return co(function* () {
    const files = yield fs.readdir(dir);

    const configFile = files.find(f => f === CONFIG);
    const grantFile = files.find(f => f === GRANTS);

    const configData = (configFile) ? yield fsUtils.getFileContent(path.join(dir, configFile)) : '{}';
    const grantData = (grantFile) ? yield fsUtils.getFileContent(path.join(dir, configFile)) : '{}';

    return {
      name: path.basename(dir),
      config: confProcessor.process(confProcessor.matcher.basic, configData, config),
      grants: confProcessor.process(confProcessor.matcher.basic, grantData, config)
    };

  })();
};

const createAuthClient = (client, authClientInfo) => {
  return co(function* () {

    const authClients = yield client.clients.getAll();

    const existingAuthClient = authClients.find(res => {
      return res.name === authClientInfo.name;
    });

    if (existingAuthClient) {
      console.log(`Updating client: ${authClientInfo.name}`);

      const delta = _.merge({}, baseClientConfig, authClientInfo.config);

      yield client.clients.update({client_id: existingAuthClient.client_id}, delta);

      console.log('Updated client');

    } else {
      console.log(`Creating client: ${authClientInfo.name}`);
      const authClient = _.merge({}, baseClientConfig, authClientInfo.config);
      authClient.name = authClientInfo.name;

      yield client.clients.create(authClient);

      console.log('Created client');
    }

  })();
};

module.exports = {
  create
};
