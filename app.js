const { phoneNumberFormatter } = require('./helpers/formatter');
const { Client, LocalAuth } = require('whatsapp-web.js');
const basicAuth = require('express-basic-auth')
const express = require('express')
const socket = require('socket.io')
const qrcode = require('qrcode')
const http = require('http')

// port and api url
const port = process.env.PORT || 2117

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']},
  authStrategy: new LocalAuth()
});

const app = express()
const server = http.createServer(app)
const io = socket(server)

app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

app.get('/', (req, res) => {
    res.sendfile('public/index.html', {
        root: __dirname
    })
})

client.on('message', msg => {
	if(msg.body) {
    msg.reply('👋 hallo, ini adalah bot 🤖 whatsapp *Kahar rahman*, bot ini hanya mengirim notifikasi' + '\n' + '\n' + 'web: kaharrahman.ponpes.id');
   } 
});

client.initialize()

// Socket IO
io.on('connection', function(socket) {
  socket.emit('message', 'Connecting...');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received, scan please!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
  });

  client.on('authenticated', () => {
    socket.emit('authenticated', 'Whatsapp is authenticated!');
    socket.emit('message', 'Whatsapp is authenticated!');
    console.log('AUTHENTICATED');
  });

  client.on('auth_failure', function(session) {
    socket.emit('message', 'Auth failure, restarting...');
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp is disconnected!');
    client.destroy();
    client.initialize();
  });
});

app.use(basicAuth({
  users: { 'apiwaKR': 'Adh1706#' }
}))

// Send message api
app.post('/send-message', (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;

  client.sendMessage(number, message).then(response => {
     res.status(200).json({ 
         status: true,
         response: response
     })
  }).catch(err => {
     res.status(500).json({
         status: false,
         response: err
     })
  })
})

server.listen(port, function () {
    console.log('App running on :' + port)
})
