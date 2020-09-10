import React, { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { WebSocketConnectionManager, integer, Stage, JSONDatum, PublicChannelClient } from 'darkchat-client';

const App: React.FunctionComponent = () => {

  const [mode           , changeMode      ] = useState('joinChannel');
  const [channel        , setChannel      ] = useState('');
  const [username       , setUsername     ] = useState('');
  const [message        , setMessage      ] = useState('');
  const [publicClient   , setPublicClient ] = useState<PublicChannelClient>();

  const appendChat = (text: string) => {
    let li = document.createElement('li');
    li.innerText = text;
    const chat = document.querySelector('#chat')
    chat && chat.append(li);
  }

  const registerWebSocketClient = ({username, channel}: {username: string, channel: string}) => {
    const wsc = new WebSocketConnectionManager({
      host: 'capetown.arcology.nyc',
      port: 8547 as integer,
      useWSS: true,
    });

    const client = new PublicChannelClient(channel, username, wsc, 1 as integer)

    /*
    wsc.on('close', (data: any) => {
      console.error('disconnected', data);
      let li = document.createElement('li');
      li.innerText = 'Disconnected From Server';
      const chat = document.querySelector('#chat')
      chat && chat.append(li);
    });

    wsc.on('error', (error: any) => {
      console.error('failed to connect', error);
    });
    */

    const messageListener = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
     console.log('received', JSON.stringify(userDatum));
      let li = document.createElement('li');
      const data = userDatum
      const msg = data['msg'];
      const isImage = msg && (msg.endsWith('jpg') || msg.endsWith('png') || msg.endsWith('gif'));
      if(data.type==='msg')
        li.innerText = data['uname']+' : '+data['msg']
      else
        li.innerText = data['msg'] || ''
      const chat = document.querySelector('#chat')
      chat && chat.append(li);
      if (data.msg && data.msg.startsWith('http') && isImage) {
        const img = document.createElement('img');
        img.setAttribute('src', data.msg);
        chat && chat.append(img);
      }
    };

    client.addStageListener('publicMessage', 'publicMessage', messageListener)

    const openListener = (preStage: Stage, postStage: Stage, userDatum: JSONDatum) => {
      appendChat(`Connected to ${wsc.url}`);
      console.log(JSON.stringify(userDatum))
      console.log('connected');
    };

    client.addStageListener('signChallenge','publicMessage', openListener)
    client.start()

    console.log(`Message queue`, client.flushLimit, client.isMessageQueueEmpty())

    setPublicClient(client);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Darkchat</h1>
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          To Enter a username and a channel to join below.
        </p>

        { (mode === 'joinChannel') ? (
          <form id="start">
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
              onChange={(evt) => setChannel(evt.target.value)}
            />
            <button
              type="submit"
              onClick={(evt) => {
                console.log("username", username)
                console.log("channel", channel)
                evt.preventDefault();
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
                  if (publicClient) {
                    publicClient.enqueueUserDatum({
                      fromPublicKey: publicClient.getBuilder().getClientState().keyPair.getPublicKey().toHexString(),
                      type: 'msg', uname: username, msg: message,
                    });
                  }
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
