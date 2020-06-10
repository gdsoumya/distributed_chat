import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
const { WebSocketClient } = require('darkchat');

function App() {

  const [mode           , changeMode         ] = useState('joinChannel');
  const [channel        , setChannel         ] = useState('');
  const [username       , setUsername        ] = useState('');
  const [message        , setMessage         ] = useState('');
  const [webSocketClient, setWebSocketClient ] = useState(null);

  const appendChat = (text: string) => {
    let li = document.createElement('li');
    li.innerText = text;
    const chat = document.querySelector('#chat')
    chat && chat.append(li);
  }

  const registerWebSocketClient = ({username, channel}: {username: string, channel: string}) => {
    const wsc = new WebSocketClient({
      host: 'capetown.arcology.nyc',
      port: 8547,
      useWSS: true,
    });

    wsc.on('close', (data: any) => {
      console.error('disconnected', data);
      let li = document.createElement('li');
      li.innerText = "Disconnected From Server";
      const chat = document.querySelector('#chat')
      chat && chat.append(li);
    });

    wsc.on('error', (error: any) => {
      console.error('failed to connect', error);
    });

    wsc.on('message', async (event : any) => {
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

    wsc.on('open', () => {
      wsc.send(JSON.stringify({
        type: 'join', uname: username, cname: channel,
      }));
      appendChat(`Connected to ${wsc.url}`);
      console.log('connected');
    });

    setWebSocketClient(wsc);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Darkchat</h1>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>

        { (mode === 'joinChannel') ? (
          <form id="start">
            <input
              type="text"
              id="uname"
              placeholder="USERNAME"
              onChange={(evt) => setUsername(evt.target.value)}
            />
            <input
              type="text"
              id="cname"
              placeholder="CHANNEL NAME"
              onChange={(evt) => setChannel(evt.target.value)}
            />
            <button
              type="submit"
              onClick={() => {
                changeMode('chat');

                registerWebSocketClient({
                  username: username,
                  channel: channel,
                })
              }}
             >
               Start Chat
             </button>
          </form>
        ) : ( 
          <div>
            <ul id="chat"></ul>

            <form id="input">
              <input type="text" id="message"
                onChange={(evt) => setMessage(evt.target.value)}
              ></input>
              <br/>
              <button
                type="submit"
                onClick={(evt) => {
                  evt.preventDefault();
                  appendChat(message);
                  
                }}
              >Send</button>
            </form>
          </div>
        )
        }
      </header>
    </div>
  );
}

export default App;
