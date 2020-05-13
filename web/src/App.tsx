import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
const { WebSocketClient } = require('darkchat');

const wsc = new WebSocketClient({
  host: 'capetown.arcology.nyc',
  port: 8547,
  useWSS: true,
});

const initWebsocket = (conn: any) => {
  conn.start();

  conn.on('close', (data: any) => {
    console.error('disconnected', data);
    let li = document.createElement('li');
    li.innerText = "Disconnected From Server";
    const chat = document.querySelector('#chat')
    chat && chat.append(li);
  });

  conn.on('error', (error: any) => {
    console.error('failed to connect', error);
  });

  conn.on('message', async (event : any) => {
    console.log('received', event.data);
    let li = document.createElement('li');
    // This is a Blob in the browser for some WebSocket messages
    const jsonText = (event.data.text) ? await event.data.text() : event.data;
    const data = JSON.parse(jsonText);
    const msg = data['msg'];
    const isImage = msg.endsWith('jpg') || msg.endsWith('png') || msg.endsWith('gif');
    if(data.type==="msg")
      li.innerText = data['uname']+" : "+data['msg']
    else
      li.innerText = data["msg"]
    const chat = document.querySelector('#chat')
    chat && chat.append(li);
    if (data['msg'].startsWith('http') && isImage) {
      const img = document.createElement('img');
      img.setAttribute('src', msg);
      chat && chat.append(img);
    }
  });
}

// since they all have one source of truth
const emit = (conn: any, payload: object) => {
  console.log("Connection Object", conn, payload);
  conn.connection.send(JSON.stringify(payload));
}
// too much abstraction ?
const makeEmit = (type: string) => (conn: any, params: object) => {
  return emit(conn, { type, ...params });
}
const sendMessage = makeEmit('msg');
const joinChannel = makeEmit('join');

const openConnection = (conn: any, callback: Function) => conn.on('open', callback);

function App() {
  const [mode, changeMode] = useState('joinChannel');
  const [channel, setChannel] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  const sendMessageTo = (uname: string) => () => {
    sendMessage(wsc, { uname, msg: message })
  }

  const createConnection = React.useCallback((evt: any) => {
    evt.preventDefault(); // prevents the form from refreshing the page
    console.info('Opening WS Connection');
    initWebsocket(wsc)
    openConnection(wsc, () => {
      console.log('connected');
      // change chat mode when connection is successful
      changeMode('chat');
      joinChannel(wsc, { uname: username, cname: channel });
      let li = document.createElement('li');
      li.innerText = `Connected to ${wsc.url}`;
      const chat = document.querySelector('#chat')
      chat && chat.append(li);
    });
  }, [channel, username]);


  React.useEffect(() => {
    console.table({
      mode,
      channel,
      username
    });
  }) 

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Darkchat</h1>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>

        { (mode === 'joinChannel') ? (
          <form id="start" onSubmit={createConnection}>
            <input
              type="text"
              id="uname"
              placeholder="USERNAME"
              onChange={(evt) => {
                setUsername(evt.target.value)
              }}
            />
            <input
              type="text"
              id="cname"
              placeholder="CHANNEL NAME"
              onChange={(evt) => {
                setChannel(evt.target.value)
              }}
            />
            <button type="submit">Start Chat</button>
          </form>
        ) : ( 
          <div>
            <ul id="chat"></ul>
            <form onSubmit={sendMessageTo(username)}>
              <input 
                type="text" 
                value={message}
                onChange={(evt: any) => {
                  const { value } = evt.target;
                  if (!!value) setMessage(value)
                }} />
              <br/>
              <button type="submit">Send</button>
            </form>
          </div>
        )
        }
      </header>
    </div>
  );
}

export default App;
