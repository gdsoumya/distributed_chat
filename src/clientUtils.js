const readline = require('readline');

const client = {}

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
        }else{
          console.log('PLEASE JOIN A CHANNEL FIRST')
        }
      }else{
        const data = {type:'msg', uname:this.uname, msg:line};
        client.write(JSON.stringify(data));
      }
      rl.prompt();
    }).on('close',function(){
      process.exit(0);
    });
  }

  handleServerData(data){
     data = JSON.parse(data)
      if(data.type==='msg')
        return `${data['uname']}: ${data['msg']}`;
      else if(data.type==='error')
        return `ERROR : ${data['msg']}`;
      else if(data.type==='success')
        return `${data['msg']}`;
    }

}

module.exports = client;
