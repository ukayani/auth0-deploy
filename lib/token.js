const request = require('request-promise');

const get = (domain, client) => {

  const clientID = client.id;
  const clientSecret = client.secret;

  const body = {
    client_id: clientID,
    client_secret: clientSecret,
    audience: `https://${domain}/api/v2/`,
    grant_type: 'client_credentials'
  };
  const options = {
    method: 'POST',
    uri: `https://${domain}/oauth/token`,
    body: body,
    json: true
  };

  return request(options).then(result => {
    return result.access_token;
  }).catch(() => {
    throw new Error('Unable to get token');
  });

};

module.exports = {
  get
};
