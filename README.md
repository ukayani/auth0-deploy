# Auth0 Deploy

A module which allows easy convention-based deployment of Auth0 components

### Supported Components

Currently the module supports the following components:

- Clients (with client grants) - Create/Update
- Resource Servers (API) - Create/Update
- Connections - Create/Update
- Rules - Create/Update

## Installation

```javascript
npm install -g auth0-deploy
```

# Usage (CLI)

To create components in Auth0 you must create a folder for each
component, with the folder name corresponding to the component name.

Each component is grouped under a component type folder.

The following is an example structure of components:

```
components
├── clients
│   └── my-client
│       ├── config.json
│       └── grants.json
│       └── login.html
├── connections
│   └── member-idp
│       ├── config.json
│       └── login.js
├── rules
│   └── member-rule
│       ├── config.json
│       └── rule.js
└── resource-servers
    └── members
        └── config.json

```

Each component type has its own folder. Within this folder are folders corresponding to the names of each component of that type.

In the above example we expect the following components:

- Client
    - my-client
- Connection
    - member-idp
- Resource Server
    - members
- Rules
    - member-rule

### Common Conventions

1. The **name** of a component is determined by its folder name
2. The options for the component are specified via a `config.json` in the components folder
    - The `config.json` should match the JSON body format for the component as described in the [Management API](https://auth0.com/docs/api/management/v2#!/Connections/post_connections)
    - Each component has sensible defaults for the JSON body, properties included in `config.json` override the defaults

### General CLI Usage

```bash
auth0-deploy <component-type> [name] [options]
```

**component-type** : Can be any of the following: `resource`, `connection`, `client`, `rule`

**options**

```
Options:

    -h, --help                      output usage information
    -V, --version                   output the version number
    -t, --token <token>             Auth0 Management API token
    -c, --client-id <id>            Auth0 Client ID
    -s, --client-secret <secret>    Auth0 Client Secret
    -d, --auth0-domain <domain>     Auth0 Domain
    -w, --working-dir <workingdir>  working directory for auth0 components (defaults to current working directory)
```

Specifying the name of the component is optional. If the name is not specified, all components under the component type's folder will be
created/updated.

**Authorization**

In order to allow the API calls to the management API to succeed you must:

- Create a client which has grants for the appropriate scopes (see: [Auth0 Deploy Cli](https://github.com/auth0/auth0-deploy-cli#to-create-client-by-hand))
    - Specify `--client-id` and `--client-secret` via cli
    - Specify Auth0 Domain for the account via `--auth0-domain`

**OR**

- Create a token from the Management API page with appropriate scopes
    - Specify `token` via cli
    - Specify Auth0 Domain for the account via `--auth0-domain`

### Scopes

The client/token used with the tool must have the following scopes:

```
# For Resource Servers
read:resource_servers
update:resource_servers
create:resource_servers

# For connections
read:connections
update:connections
create:connections

# For Clients
read:clients
update:clients
create:clients

read:client_grants
update:client_grants
create:client_grants
delete:client_grants

read:rules
update:rules
create:rules
```

## Connections

In addition to the common conventions, creation of connection resources allows specification of custom script code.

In order for your custom scripts to be included as a part of the connection creation, you must create
`.js` files corresponding to the custom script.

The following scripts are supported:

- **Login** -> login.js
- **Create** -> create.js
- **Verify** -> verify.js
- **Change** Password -> change_password.js
- **Delete** -> delete.js
- **Get User** -> get_user.js

From the above example, you can see that only the `login.js` custom script is specified.
Any of the scripts which are specified will be added to the connection during creation.

Example `config.json`

```json
{
  "options": {
    "bareConfiguration":{
      "hostname": "https://myidpurl.com"
    }
  }
}
```

The above `config.json` specifies some configuration properties for the custom scripts to access

### Command

Change directory to components folder (ie. your folder should contain `connections`, `clients`, etc.

```bash
auth0-deploy connection --token <your-access-token> --auth0-domain <yourhost.auth0.com>
```

The above example uses the token Authorization method

## Resource Servers

To create a resource server you must specify a `config.json` which describes the body of the resource for the management API.

Lets say we have the following directory structure:

```
components
├── resource-servers
│   └── members
│       └── config.json

```


An example `config.json` would look like:

```json
{
  "identifier": "https://members.mydomain.com",
  "scopes": [
    {"value": "read:email"},
    {"value": "read:friends"}
  ],
  "signing_alg": "RS256"
}
```

This would create a resource named `members` with scopes: `read:email` and `read:friends`

```bash
auth0-deploy resource --token <your-access-token> --auth0-domain <yourhost.auth0.com>
```

## Client

Clients follow the same convention as resources except you can specify **client-grants** via
the file `grants.json` and a login hosted page via `login.html`

This file must consist of an array of grants which conform to the grant body as per the [Management API](https://auth0.com/docs/api/management/v2#!/Client_Grants/post_client_grants) requirements.
Each grant must omit the `client_id` property as this will be automatically filled based on the given client.

An example `grants.json` would look like:

```json
[
  {
    "audience": "https://some-host.auth0.com/api/v2/",
    "scope": [
      "read:users"
    ]
  }
]
```

As you can see, the grant specifies the `audience` and `scope`, but not the `client_id`

```bash
auth0-deploy client --token <your-access-token> --auth0-domain <yourhost.auth0.com>
```

## Rule

To create rules you must specify a `rule.js` file which contains your rule code. In addition to the `rule.js`
you can also specify a `config.json` similar to other components.

An example `config.json` would look like:

```json
{
  "order": 2,
  "stage": "login_success"
}
```


```bash
auth0-deploy rule <rule-name> --token <your-access-token> --auth0-domain <yourhost.auth0.com>
# <rule-name> is optional
```

## Environment specific overrides

You may want to have differing values for certain configuration options based on the environment you
are deploying to.

For example, if we want to create a connection which contacts our own IDP server to authenticate users, you
may want to specify different URIs for the IDP server for each environment.

To do so, you can add placeholders to your `config.json` files in the form: `@@PLACEHOLDER_NAME@@`

Going back to the connection example, lets look at an example `config.json`

### Environment Specific config

```json
{
  "options": {
    "bareConfiguration":{
      "hostname": "@@IDP_URI@@"
    }
  }
}
```

Here we have a placeholder for the value of the `hostname` config property.
The placeholders name is `IDP_URI`

To specify values for this placeholder you can:

- Export an environment variable with the name `IDP_URI` before executing the deploy command

**OR**

- Specify an argument `--IDP_URI <uri>` with the deploy command

Example:

```bash
auth0-deploy connection --token <your-access-token> --auth0-domain <yourhost.auth0.com> --IDP_URI https://myidp.organization.com
```

The above command will replace all instances of the placeholder `IDP_URI` with the given url (which may be specific to the environment)

#### For Rules
If you want environment specific values for your rule, you can create an `env.json` file inside your rule folder like the following

```
components
|
├── rules
│   └── member-rule
│       ├── config.json
│       ├── rule.js
|       └── env.json

```
example env.json
```json
{
  "MY_CLAIM_KEY": "https://example.com/channel",
  "MY_CLAIM_VALUE": "WEBSITE",
  "MY_CLIENT_ID": "@@MY_CLIENT_ID@@" //placeholder value
}
```

You can then reference the env. variables you define in `env.json` inside your rule script via `configuration` object.
```javascript
# rule.js

function injectMyClaim(user, context, callback) {
  const mobileClientId = configuration.MOBILE_CLIENT_ID
  const claimKey = configuration.MY_CLAIM_KEY
  const claimValue = configuration.MY_CLAIM_VALUE
  if (context.clientID === mobileClientId) {
    context.accessToken[claimKey] = claimValue;
  }

  callback(null, user, context);
}
```


# Usage (as a node module)

...

# License

MIT
