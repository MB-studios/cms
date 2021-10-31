const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const config = require('config');

const api_key = config.get('mailgunApiKey');

const mg = mailgun.client({
  username: 'api',
  key: api_key,
});

module.exports = mg;
