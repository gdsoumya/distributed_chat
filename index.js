const cliClient = require('./src/cliClient')
const wsClient = require('./src/websockClient')
const server = require('./src/server')

module.exports = {
  ...cliClient,
  ...wsClient,
  ...server,
}
