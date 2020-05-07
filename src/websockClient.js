const WebSocket = require('ws')
const { BaseClient } = require('./clientUtils');

const client = {}

client.WebSocketClient = class extends BaseClient {
  constructor({ host, port }) {
    super();

    const ws = new WebSocket(`ws://${host}:${port}`)

    ws.on('open', () => {
      console.log(`Client connected to: ${host}:${port}`);
      ws.write = ws.send;
      this.startChat(ws);
    });

    ws.on('message', (data) => {
      data = JSON.parse(data)
      if(data.type==='msg')
        console.log(`${data['uname']}: ${data['msg']}`);
      else if(data.type==='error')
        console.log(`ERROR : ${data['msg']}`);
      else if(data.type==='success')
        console.log(`${data['msg']}`);
    });

    ws.on('close', ()=>{
      console.log('Client closed');
      process.exit();
    });

    ws.on('error', (err)=>{
      console.error(err);
      process.exit();
    });

  }
}

module.exports = client
