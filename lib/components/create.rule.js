'use strict';
const co = require('bluebird').coroutine;
const fs = require('mz/fs');
const path = require('path');
const _ = require('lodash');
const confProcessor = require('./utils/config.processor.js');
const fsUtils = require('./utils/file.utils.js');

const RULE = 'rule.js';
const ENV = 'env.json';
const CONFIG = 'config.json';

const baseRuleConfig = {
  enabled: true,
  stage: 'login_success'
};

const create = (client, dir, config) => {
  return co(function*() {

    const connectionData = yield getRuleData(dir, config);
    return yield createRule(client, connectionData);

  })();
};

const getRuleData = (dir, config) => {
  return co(function*() {
    const files = yield fs.readdir(dir);

    const ruleFile = files.find(f => f === RULE);
    const configFile = files.find(f => f === CONFIG);
    const envFile = files.find(f => f === ENV);

    const ruleData = (ruleFile) ? yield fsUtils.getFileContent(path.join(dir, ruleFile)) : '';
    const envData = (envFile) ? yield fsUtils.getFileContent(path.join(dir, envFile)) : '{}';
    const configData = (configFile) ? yield fsUtils.getFileContent(path.join(dir, configFile)) : '{}';

    return {
      name: path.basename(dir),
      config: confProcessor.processJSON(confProcessor.matcher.basic, configData, config),
      envVars: confProcessor.processJSON(confProcessor.matcher.basic, envData, config),
      rule: confProcessor.processRaw(confProcessor.matcher.basic, ruleData, config)
    };

  })();
};

const createRule = (client, ruleInfo) => {
  return co(function*() {

    const rules = yield client.rules.getAll();

    const existingRule = rules.find(r => {
      return r.name === ruleInfo.name;
    });

    if (existingRule) {
      console.log(`Updating rule: ${ruleInfo.name}`);

      const delta = _.merge({}, baseRuleConfig, ruleInfo.config);

      delta.script = ruleInfo.rule;
      delete delta.stage;

      const envVars = ruleInfo.envVars;
      for (const key in envVars) {
        if (envVars.hasOwnProperty(key)) {
          const value = envVars[key];
          yield client.rulesConfigs.set({ key }, { value });
        }
      }

      yield client.rules.update({id: existingRule.id}, delta);

      console.log('Updated rule');

    } else {
      console.log(`Creating rule: ${ruleInfo.name}`);
      const rule = _.merge({}, baseRuleConfig, ruleInfo.config);
      rule.name = ruleInfo.name;
      rule.script = ruleInfo.rule;

      const envVars = ruleInfo.envVars;
      for (const key in envVars) {
        if (envVars.hasOwnProperty(key)) {
          const value = envVars[key];
          yield client.rulesConfigs.set({ key }, { value });
        }
      }
      
      yield client.rules.create(rule);
      console.log('Created rule');
    }

  })();
};

module.exports = {
  create
};
