var app = require('../app');
import debug from 'debug';
import { config } from "../config";
import fs from 'fs';
import path from 'path';
import https from 'httpolyglot';
import * as mediasoup from 'mediasoup';

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

var port = normalizePort(config.server.listen.port);
app.set('port', port);

const options = {
    cert: fs.readFileSync(path.join(__dirname,  config.server.ssl.cert), 'utf-8'),
    key: fs.readFileSync(path.join(__dirname, config.server.ssl.key), 'utf-8'),
};

var server = https.createServer(options, app);

let worker :any;

const createAndStartWorker = async () => {
    
  worker = await mediasoup.createWorker({
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
  })

  worker.on('died', error => {
    console.log('mediasoup worker has died')
    setTimeout(() => process.exit(1), 2000) // exit in 2 seconds
  })

  return worker
}

// ####################################################
// WORKERS
// ####################################################
(async () => {
    try {
        worker = await createAndStartWorker();
        console.log(`Worker PID: ${worker.pid}`);
    } catch (error) {
        console.error('Failed to create worker:', error);
    }
})()

const io = require("socket.io")(server, config.server.corsOptions)

io.on('connection', (socket) => {
  require('../socketHandler')(socket, io, worker);
});

server.listen(port, () => {
    console.log('Ready on port %d with process id: %s', port, process.pid);
});

server.on('error', onError);
server.on('listening', onListening);
