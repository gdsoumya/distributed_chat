const cliClient = require('./src/cliClient')
const server = require('./src/server')

module.exports = {
  ...cliClient,
  ...server,
}
