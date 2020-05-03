const cliClient = require('./src/cliClient')
const cliServer = require('./src/cliServer')
const fullServer = require('./src/fullServer')

module.exports = {
  ...cliClient,
  ...cliServer,
  ...fullServer,
}
