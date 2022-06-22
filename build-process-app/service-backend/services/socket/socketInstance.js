import { Server } from "socket.io";
import socketDefinition from "../../routes/socketio_routes/socketio_worker";

const FILE = "socketInstance.js";

var socket;
let io;

function socketInstance(){}

//Need to pass an httpServer to initialize the socketio instance
function initInstance(server, cb){
    const TAG = "FUNC initInstance";

    //TODO: Do not deploy in production without defining server entry calls
    io = new Server({
        cors: {
          origin: "*",
        },
        reconnect: true
      }).attach(server);

    //Define socket connection and routing
    socket = socketDefinition(io);

    if(cb && typeof(cb) == 'function')
        cb(socket);
}
socketInstance.initInstance = initInstance;

function getInstance(){
    if(socket){
        return socket
    }else{
        console.log("no socketIO server");
    }

}
socketInstance.getInstance = getInstance;

module.exports = socketInstance;