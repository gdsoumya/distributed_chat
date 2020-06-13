# Distributed Chat

[![darkchat](https://circleci.com/gh/gdsoumya/distributed_chat.svg?style=svg)](https://app.circleci.com/projects/project-dashboard/github/gdsoumya)<br>
A simple distributed chat system, still under construction!

In less than 300 lines total a distributed chat client with channels, a server that can manually peer with other servers and use rudimentary peer discovery to auto-connect with more peers. All clients connected to a specific channel can communicate even if they are connected to different servers, as long as the servers are peered together.

There are 3 types of Servers :

1. **CLI-SERVER** : Only clients using CLI-CLient can connect to this server.
2. **WEBSOCK-SERVER** : Only Browser clients or WEBSOCK-Client can connect to this server.
3. **FULL-SERVER**: Any of the above clients can connect to this server.

Even if the servers are of different types they can be peered together ensuring that clients of any type can communicate with clients of any other type, eg : client on browser communicating with cli-clients or websock-clients and vice-versa.

A server can communicate with the network even if it is behind a NAT or Firewall, other peers may not be able to discover a server behind a NAT but as long as the server is peered to a public node/server all local clients connected to it will be able to communicate throughout the network.

**No data is stored on the servers all messages recieved are propagated and forgotten. (Currently the messages are logged in Server prompt for debugging purposes but nothing is stored in the memory)**

## TRY IT OUT

To try this out follow the steps, our test node can be used to try out the system.

SERVER : capetown.arcology.nyc<br>
WEBSOCK-CLIENT/WEB CLIENT PORT : 8546<br>
CLI-CLIENT PORT : 8545<br>
PEER PORT : 30303<br>

### INTIAL SETUP

```
git clone https://github.com/gdsoumya/distributed_chat.git
cd distributed_chat
npm install
```

### SERVER SETUP

Depending on the requirement one can start up either a cli-server, websoc-server or a full-server, to start a server use the following command :

**1. CLI-SERVER**

```
node scripts/cliServer.js <ip> <port1> <port2>
```

-   ip : IP used by server to listen
-   port1 : Port used for cli-client connections
-   port2 : Port used for peer connections

**2. WEBSOCK-SERVER**

```
node scripts/websockServer.js <ip> <port1> <port2>
```

-   ip : IP used by server to listen
-   port1 : Port used for websock-client or browser connections
-   port2 : Port used for peer connections

**3. FULL-SERVER**

```
node scripts/fullServer.js <ip> <port1> <port2> <port3>
```

-   ip : IP used by server to listen
-   port1 : Port used for cli-client connections
-   port2 : Port used for websock-client or browser connections
-   port3 : Port used for peer connections

#### PEER CONNECTION

To connect to the peer-network, a server will need to peer with at least one server which is already connected to the network. To connect to a peer use the following command in the Server CLI Promt:

```
> connect <peer-ip> <peer-port>
```

-   peer-ip : IP of Peer Server
-   peer-port : Port used by peer server for peer connections (`port2` in case of cli and websock servers and `port3` for full servers)

#### PEER LIST

To view all connected peers use the following command in the Server CLI Promt:

```
> peers
```

### CLIENT SETUP

There are 2 clients : cli-client and websock-client each used for a different type of server. Both use the same command for connecting to the server :

```
node scripts/<type>Client.js <server-ip> <server-port>
```

-   type : Type of client - cli or websock
-   server-ip : IP of Server to connect
-   server-port : Port used by server for client connections

#### CLIENT JOIN CHANNEL

To make a successful connection to a node/server you need to verify your identity (Key-Pair ownership), start the connection using

```bash
> connect
```

The server will send a random string htat you need to sign and send back to the server for verification

```bash
#server responsse
> VERIFY : "<random_string>"
```

Sign the random string inbetween the quotes

```bash
> sign <random_string>
> <signed_string_generated>
```

Transfer the signature to the server for verification

```bash
verify <signed_string_generated>
```

If the verification is successfull the connection will be established else a **MALFORMED ERROR** error will be thrown.

After succesful connection to the server the client ncan join an no. of channels using the command :

```bash
> join <channel-name> <username>
```

-   channel-name : Name of channel to join

After a client has joined, it can send/recieve messages on that particular channel, to send messages use the CLI Prompt.

eg.

```bash
> <channel-name> this is a message from the client
> user@<channel-name> -  message from channel to client
```

The user can also send direct messages using the known publickey of another user :

```bash
private <public_key_of_user2> hello world
```

**A Malformed error will be thrown by the server if any message is sent before joining a channel.**
