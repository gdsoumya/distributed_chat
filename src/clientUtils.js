const readline = require('readline');

const client = {}

client.messageConsoleLogger = (_data) => {
  //const data = JSON.parse(_data.toString ? _data.toString() : _data);
  const data = JSON.parse(_data)
  console.log('TYPE ' + data['type'])
  const msg = (data['msg']['type'] === 'Buffer') ?
    Buffer.from(data['msg']).toString() : JSON.stringify(data['msg'])

  //console.log(_data);
  if (data.type === 'msg') {
    console.log(`${data['uname']}: ${msg}`);
  }
  else if (data.type === 'error') {
    console.log(`ERROR : ${msg}`);
  }
  else if (data.type === 'success') {
    console.log(`${msg}`);
  }
}

client.BaseClient = class {

  constructor(connection, host, port) {
    this.uname = '';
    this.channel = '';
    this.connection = connection;
    this.host = host;
    this.port = port;
  }

  setUsername(newUname) {
    this.uname = newUname;
  }

  setChannel(newChannel) {
    this.channel = newChannel;
  }

  addMessageListener(listener) {
    throw new Error('Define this method in your subclass of BaseClient');
  }

  sendMessage(msg) {
    return this.connection.write(JSON.stringify({
      type  : 'msg',
      msg   : msg,
      uname : this.uname,
    }))
  }

  on(eventName, cb) {
    return this.connection.on(eventName, cb);
  }

  processLine(line) {
    if (line.toLowerCase() === 'exit') rl.close();
    const msg=line.split(' ');
    if (this.channel==''){
      if ((msg.length === 3) && (msg[0].toLowerCase() === 'join')) {
        const data={ type:'join', uname:msg[2], cname:msg[1] }
        this.channel = msg[1];
        this.uname = msg[2];
        console.log(`CHANNEL NAME : ${this.channel}  |   USERNAME : ${this.uname}`);
        this.connection.write(JSON.stringify(data));
      }
      else {
        console.log('PLEASE JOIN A CHANNEL FIRST')
      }
    }
    else {
      this.sendMessage(line);
    }
  }

  /**
   * Open the connection and start responding to event listeners.
   */
  start() {
    throw new Error('Override start() method in subclass to open and setup your connection.');
  }

  /**
   * Close the connection, to allow the client to end non-interactively.
   */
  stop() {
    this.connection.close();
  }

  /**
   * Register readline interactive REPL. (Don't use for tests)
   */
  startChat() {
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.prompt();
    rl.on('line', (line) => {
      this.processLine(line);
      rl.prompt();
    }).on('close',function(){
      process.exit(0);
    });
  }

}

module.exports = client;
