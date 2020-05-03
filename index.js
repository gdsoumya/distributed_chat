const cliClient = require('./src/cliClient')
const fullServer = require('./src/fullServer')

module.exports = {
  ...cliClient,
  ...fullServer,
}
