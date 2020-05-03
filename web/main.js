let uname=""
let connection=""
const startConn = (url,data)=>{
  connection = new WebSocket("ws://"+url);
  connection.onopen = () => {
  connection.send(JSON.stringify(data));
  console.log('connected');
};

connection.onclose = () => {
  console.error('disconnected');
  let li = document.createElement('li');
  li.innerText = "Disconnected From Server";
  document.querySelector('#chat').append(li);

};

connection.onerror = (error) => {
  console.error('failed to connect', error);
};

connection.onmessage = async (event) => {
  console.log('received', event.data);
  let li = document.createElement('li');
  // This is a Blob in the browser for some WebSocket messages
  const jsonText = (event.data.text) ? await event.data.text() : event.data;
  const data = JSON.parse(jsonText);
  if(data.type==="msg")
    li.innerText = data['uname']+" : "+data['msg']
  else
    li.innerText = data["msg"]
  document.querySelector('#chat').append(li);
};
}

document.querySelector('#input').addEventListener('submit', (event) => {
  event.preventDefault();
  let message = document.querySelector('#message').value;
  data = {type:"msg", uname:uname, msg:message};
  connection.send(JSON.stringify(data));
  let li = document.createElement('li');
  li.innerText = "You : " + message;
  document.querySelector('#chat').append(li);
  document.querySelector('#message').value = '';
});

document.querySelector('#start').addEventListener('submit', (event) => {
  event.preventDefault();
  console.log("here");
  const url = uname = document.querySelector('#server').value;
  uname = document.querySelector('#uname').value;
  let cname = document.querySelector('#cname').value;
  let data={type:"join",uname:uname, cname:cname}
  startConn(url, data)
  document.getElementById('start').style.display="none"
  document.getElementById('input').style.display="block"
  document.getElementById('chat').style.display="block"
});
