const express = require("express");
const http = require("http");
const amqp = require("amqplib/callback_api");
const index = require("./routes/index.js");

const port = process.env.PORT || 4001;
const app = express();
app.use(index);
const server = http.createServer(app);

app.use(express.static("dist"));
//Global variables where are stored informations about the messaging server and the channel
var message = "Attente de la Recette";
const server_path = "amqp://localhost";

//Pass the Cross Origin error, do not deploy
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});

main();


//Calling main function in socketio-connection.js
function main(){
  var exchange = 'sequencer';
  key = 'buildp.all';
  key2 = 'buildp.report';
  //Connexion to rabbitMQ server
  try {
    //Creating connection with rabbitMQ server
    amqp.connect(server_path, function(error0, connection) {
      if (error0) {
        throw error0;
      }
      connection.createChannel(function(error1, channel) {
        if (error1) {
          throw error1;
        }
        channel.assertExchange(exchange, 'topic', {
          durable: false
        });
        channel.assertQueue('', {
        }, function(error2, q) {
          if (error2) {
            throw error2;
          }
          console.log(' [*] Waiting for logs. To exit press CTRL+C');
          
          channel.bindQueue(q.queue, exchange, key);
          channel.bindQueue(q.queue, exchange, key2);
          
          channel.consume(q.queue, function(msg) {
            // Emitting a new message. Will be consumed by the client
            if(msg.fields.routingKey == key){
              message = JSON.parse(msg.content);
              socket.emit("FromBPAll", message);
              console.log("%s message sent BPALL : ",msg.fields.routingKey, message);
            }else if (msg.fields.routingKey == key2){
                console.log("dans report");
                socket.emit("FromBPAdv", JSON.parse(msg.content));
                console.log("%s message sent : ",msg.fields.routingKey, JSON.parse(msg.content));
            }
          }, {
            noAck: true
          });
          //Connection avec socket.io pour communication avec le frontend
          const socket = io.on("connection", (socket) => {
            console.log("Client is connected");
            socket.emit("FromBPAll", message);
            console.log("emitted");

            
            //Called when the client disconnect from the socketio link
            socket.on("disconnect", () => {
              console.log("Client disconnected");
            });
          });
        });
      });
    });
    
  } catch (e) {
    console.error(e);
  }
  server.listen(port, () => console.log(`Listening on port ${port}`));
}

