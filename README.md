# distributed_chat
A simple distributed chat system, under construction

In less than 300 lines total:
a distributed chat client with channels, a server that can manually peer with other servers by public IP address and port and re-broadcast user messages, and a very thin client.
https://github.com/gdsoumya/distributed_chat

To try it out (even inside a docker container or VM with NAT):
```
git clone https://github.com/gdsoumya/distributed_chat
cd distributed_chat
yarn
node server.js 0.0.0.0 <port1> <port2>
> connect 13.245.17.210 8545 # our EC2 server in Cape Town
```
In another terminal, connect a client
```
cd distributed_chat
node client.js localhost <port2>
> join wizards
> say hi, suggest a feature
```
