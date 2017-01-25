#!/usr/bin/env node
'use strict';

const pkg = require('../package.json');
const co = require('bluebird').coroutine;
const path = require('path');
const program = require('commander');
const nconf = require('nconf');
const ManagementClient = require('auth0').ManagementClient;
const deploy = require('../lib/deploy');
const token = require('../lib/token');

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const hasToken = options => options.token;
const hasClient = options => options.clientId && options.clientSecret;

const checkRequired = options => {
  if (!options.auth0Domain) {
    fail('domain is required');
  }
  if (!hasToken(options) && !hasClient(options)) {
    fail('need to specify one of token or (client-id, client-secret)');
  }
};

const getClientInfo = (options) => {
  return {
    id: options.clientId,
    secret: options.clientSecret
  };
};

const AUTH0_DOMAIN = 'AUTH0_DOMAIN';

const run = (type, options) => {
  return co(function*() {

    const defaults = {};
    defaults[AUTH0_DOMAIN] = options.auth0Domain;

    // make domain available in config
    nconf.argv().env().defaults(defaults);


    const authToken = (hasToken(options)) ? options.token : yield token.get(options.auth0Domain,
      getClientInfo(options));
    const client = new ManagementClient({
      token: authToken,
      domain: options.auth0Domain
    });

    const workingDir = options.workingDir ? path.resolve(options.workingDir) : process.cwd();

    deploy(client, type, workingDir, nconf);
  })();
};

const setupProgram = (program, type, description) => {
  program
    .command(type)
    .allowUnknownOption(true)
    .description(description)
    .action(() => {
      checkRequired(program);
      run(type, program);
    });
};

program
  .version(pkg.version)
  .allowUnknownOption(true)
  .option('-t, --token <token>', 'Auth0 Management API token')
  .option('-c, --client-id <id>', 'Auth0 Client ID')
  .option('-s, --client-secret <secret>', 'Auth0 Client Secret')
  .option('-d, --auth0-domain <domain>', 'Auth0 Domain')
  .option('-w, --working-dir <workingdir>', 'working directory for auth0 components');

setupProgram(program, 'resource', 'Create resource servers');
setupProgram(program, 'connection', 'Create connections');
setupProgram(program, 'client', 'Create clients');

program.parse(process.argv);
