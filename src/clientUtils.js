const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

let uname='', channel='';

const client = {}

client.setUsername = (newUname) => {
  uname = newUname;
}

client.getUsername = () => uname

client.setChannel = (newChannel) => {
  channel = newChannel;
}

client.getChannel = () => channel

client.startChat = (send)=>{
  rl.prompt();
  rl.on('line', function(line) {
    if (line.toLowerCase() === 'exit') rl.close();
    const msg=line.split(' ');
    if(channel==''){
      if(msg.length===3 && msg[0].toLowerCase()==='join'){
                
        const data={type:'join',uname:msg[2], cname:msg[1]}
        channel = msg[1];uname=msg[2];
        console.log(`CHANNEL NAME : ${channel}  |   USERNAME : ${uname}`);
        send(JSON.stringify(data));
      }else{
        console.log('PLEASE JOIN A CHANNEL FIRST')
      }
    }else{
      const data = {type:'msg', uname:uname, msg:line};
      send(JSON.stringify(data));
    }
    rl.prompt();
  }).on('close',function(){
    process.exit(0);
  });
}

module.exports = client;
