const WebSocket = require('ws')

const PORT = process.argv[2]
console.log('Port ', PORT)
const ws = new WebSocket(`ws://localhost:${PORT}`)

ws.on('message', (data) => {
  console.log(data)
})

ws.on('connection', (wss) => {
  ws.send('join wizards')
})
