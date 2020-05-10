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

  constructor() {
    this.uname = '';
    this.channel = '';
  }

  setUsername(newUname) {
    this.uname = newUname;
  }

  setChannel(newChannel) {
    this.channel = newChannel;
  }

  startChat(client) {
    const rl = readline.createInterface(process.stdin, process.stdout);
    rl.prompt();
    rl.on('line', (line) => {
      if (line.toLowerCase() === 'exit') rl.close();
      const msg=line.split(' ');
      if(this.channel==''){
        if(msg.length===3 && msg[0].toLowerCase()==='join'){
                  
          const data={type:'join',uname:msg[2], cname:msg[1]}
          this.channel = msg[1];
          this.uname=msg[2];
          console.log(`CHANNEL NAME : ${this.channel}  |   USERNAME : ${this.uname}`);
          client.write(JSON.stringify(data));
        }
        else{
          console.log('PLEASE JOIN A CHANNEL FIRST')
        }
      }
      else{
        const data = {type:'msg', uname:this.uname, msg:line};
        client.write(JSON.stringify(data));
      }
      rl.prompt();
    }).on('close',function(){
      process.exit(0);
    });
  }

}

module.exports = client;
