'use strict';
const co = require('bluebird').coroutine;
const fs = require('mz/fs');
const path = require('path');
const _ = require('lodash');
const confProcessor = require('./utils/config.processor.js');
const fsUtils = require('./utils/file.utils.js');

const SCRIPTS = ['login.js', 'create.js', 'verify.js', 'change_password.js', 'delete.js', 'get_user.js'];
const CONFIG = 'config.json';

const baseConnectionConfig = {
  strategy: 'auth0',
  options: {
    brute_force_protection: true,
    enabledDatabaseCustomization: true,
    customScripts: {}
  }
};

const create = (client, dir, config) => {
  return co(function*() {

    const connectionData = yield getConnectionData(dir, config);
    return yield createConnection(client, connectionData);

  })();
};

const getConnectionData = (dir, config) => {
  return co(function*() {
    const files = yield fs.readdir(dir);

    const scripts = files.filter(f => SCRIPTS.indexOf(f) > -1);
    const configFile = files.find(f => f === CONFIG);

    const scriptData = {};
    for (let i in scripts) {
      const script = scripts[i];
      const scriptKey = path.basename(script, '.js');
      const content = yield fsUtils.getFileContent(path.join(dir, script));
      scriptData[scriptKey] = confProcessor.processRaw(confProcessor.matcher.basic, content, config);
    }

    const configData = (configFile) ? yield fsUtils.getFileContent(path.join(dir, configFile)) : '{}';

    return {
      name: path.basename(dir),
      config: confProcessor.processJSON(confProcessor.matcher.basic, configData, config),
      data: scriptData
    };

  })();
};

const createConnection = (client, connectionInfo) => {
  return co(function*() {

    const connections = yield client.connections.getAll();

    const existingConnection = connections.find(conn => {
      return conn.name === connectionInfo.name;
    });

    if (existingConnection) {
      console.log(`Updating connection: ${connectionInfo.name}`);

      const delta = _.merge({}, baseConnectionConfig, connectionInfo.config);

      delta.options.enabledDatabaseCustomization = true;
      delete delta.strategy;

      // update custom script
      delta.options.customScripts = connectionInfo.data;

      yield client.connections.update({id: existingConnection.id}, delta);

      console.log('Updated connection');

    } else {
      console.log(`Creating connection: ${connectionInfo.name}`);
      const connection = _.merge({}, baseConnectionConfig, connectionInfo.config);
      connection.name = connectionInfo.name;
      connection.options.customScripts = connectionInfo.data;

      yield client.connections.create(connection);

      console.log('Created connection');
    }

  })();
};

module.exports = {
  create
};
