'use strict';
const co = require('bluebird').coroutine;
const fs = require('mz/fs');
const path = require('path');
const _ = require('lodash');
const confProcessor = require('./utils/config.processor.js');
const fsUtils = require('./utils/file.utils.js');

const CONFIG = 'config.json';
const GRANTS = 'grants.json';
const LOGIN = 'login.html';

const baseClientConfig = {
  jwt_configuration: {
    alg: 'RS256',
    lifetime_in_seconds: 36000
  },
  token_endpoint_auth_method: 'none',
  app_type: 'regular_web'
};

const create = (client, dir, config) => {
  return co(function*() {
    const authClientData = yield getClientData(dir, config);
    return yield createAuthClient(client, authClientData);
  })();
};

const getClientData = (dir, config) => {
  return co(function*() {
    const files = yield fs.readdir(dir);

    const configFile = files.find(f => f === CONFIG);
    const grantFile = files.find(f => f === GRANTS);
    const loginFile = files.find(f => f === LOGIN);

    const configData = (configFile) ? yield fsUtils.getFileContent(path.join(dir, configFile)) : '{}';
    const grantData = (grantFile) ? yield fsUtils.getFileContent(path.join(dir, grantFile)) : '[]';
    const loginData = (loginFile) ? yield fsUtils.getFileContent(path.join(dir, loginFile)) : '';

    return {
      name: path.basename(dir),
      config: confProcessor.processJSON(confProcessor.matcher.basic, configData, config),
      grants: confProcessor.processJSON(confProcessor.matcher.basic, grantData, config),
      login: loginData
    };

  })();
};

const contains = (source, elem) => source.indexOf(elem) > -1;

const createAuthClient = (client, authClientInfo) => {
  return co(function*() {

    const authClients = yield client.clients.getAll();

    const existingAuthClient = authClients.find(res => {
      return res.name === authClientInfo.name;
    });

    if (existingAuthClient) {
      console.log(`Updating client: ${authClientInfo.name}`);

      const delta = (existingAuthClient.global) ? _.merge({}, authClientInfo.config) : _.merge({}, baseClientConfig,
        authClientInfo.config);

      // check if login page is provided
      if (authClientInfo.login.length) {
        delta.custom_login_page = authClientInfo.login;
      }

      yield client.clients.update({client_id: existingAuthClient.client_id}, delta);

      // no grants for the global client
      if (!existingAuthClient.global) {
        const audiences = authClientInfo.grants.map(g => g.audience);

        const allGrants = yield client.clientGrants.getAll();
        const existingGrants = allGrants.filter(g => g.client_id === existingAuthClient.client_id);
        const existingAudiences = existingGrants.map(g => g.audience);

        const grantsToUpdate = existingGrants.filter(g => contains(audiences, g.audience));
        const grantsToDelete = existingGrants.filter(g => !contains(audiences, g.audience));

        const grantsToCreate = authClientInfo.grants.filter(g => !contains(existingAudiences, g.audience));

        for (let i in grantsToDelete) {
          const grant = grantsToDelete[i];
          console.log(`Deleting grant with audience: ${grant.audience}`);
          yield client.clientGrants.delete({id: grant.id});
        }

        for (let i in grantsToUpdate) {
          const existingGrant = grantsToUpdate[i];
          console.log(`Updating grant with audience: ${existingGrant.audience}`);
          const grant = authClientInfo.grants.find(g => g.audience === existingGrant.audience);
          delete grant.audience;
          yield client.clientGrants.update({id: existingGrant.id}, grant);
        }

        for (let i in grantsToCreate) {
          const grant = grantsToCreate[i];
          grant.client_id = existingAuthClient.client_id;
          console.log(`Creating grant for audience: ${grant.audience}`);
          yield client.clientGrants.create(grant);
          console.log('Created grant');
        }
      }

      console.log('Updated client');

    } else {
      console.log(`Creating client: ${authClientInfo.name}`);
      const authClient = _.merge({}, baseClientConfig, authClientInfo.config);
      authClient.name = authClientInfo.name;

      // check if login page is provided
      if (authClientInfo.login.length) {
        authClient.custom_login_page = authClientInfo.login;
      }

      const createdClient = yield client.clients.create(authClient);

      const grants = authClientInfo.grants.map(g => _.merge({client_id: createdClient.client_id}, g));

      for (let i in grants) {
        const grant = grants[i];
        console.log(`Creating grant for audience: ${grant.audience}`);
        yield client.clientGrants.create(grant);
        console.log('Created grant');
      }

      console.log('Created client');
    }

  })();
};

module.exports = {
  create
};
