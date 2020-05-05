const WebSocket = require('ws')
const readline = require('readline');
const rl = readline.createInterface(process.stdin, process.stdout);

let uname='', channel='';

const startChat = ()=>{
  rl.prompt();
  rl.on('line', function(line) {
    if (line.toLowerCase() === 'exit') rl.close();
    const msg=line.split(' ');
    if(channel==''){
      if(msg.length===3 && msg[0].toLowerCase()==='join'){
                
        const data={type:'join',uname:msg[2], cname:msg[1]}
        channel = msg[1];uname=msg[2];
        console.log(`CHANNEL NAME : ${channel}  |   USERNAME : ${uname}`);
        ws.send(JSON.stringify(data));
      }else{
        console.log('PLEASE JOIN A CHANNEL FIRST')
      }
    }else{
      const data = {type:'msg', uname:uname, msg:line};
      ws.send(JSON.stringify(data));
    }
    rl.prompt();
  }).on('close',function(){
    process.exit(0);
  });
}

const client = {}

client.WebSocketClient = ({ host, port }) => {

  const ws = new WebSocket(`ws://${host}:${port}`)

  ws.on('open', () => {
    console.log(`Client connected to: ${host}:${port}`);
    startChat();
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

module.exports = client
