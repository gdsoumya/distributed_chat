const { CommandLineClient, messageConsoleLogger } = require('..');
const args = process.argv.slice(2);
// Configuration parameters
const host = args[0];
const port = args[1];

const c = new CommandLineClient({ host, port });

// net TCP connections
c.on('connect', () => {
	c.startChat();
});

c.start();
c.addMessageListener(messageConsoleLogger);
