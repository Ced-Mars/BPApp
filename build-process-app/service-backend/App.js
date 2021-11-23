const express = require("express");
const http = require("http");
const amqp = require("amqplib/callback_api");
const index = require("./routes/index.js");

const port = process.env.PORT || 4001;
const app = express();
app.use(express.static("dist"));
const server = http.createServer(app);

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
  var action = {};
  var actionCompleted = [];
  var activeStep = 0;
  var completedStep = {};
  var exchange = 'mars';
  key = 'sequencer.report.process.all';
  key2 = 'sequencer.report.process.status';
  key3 = 'hmi.process.reset';
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
        channel.assertQueue('', { exclusive: true
        }, function(error2, q) {
          if (error2) {
            throw error2;
          }
          console.log(' [*] Waiting for logs. To exit press CTRL+C');
          
          channel.bindQueue(q.queue, exchange, key);
          channel.bindQueue(q.queue, exchange, key2);
          channel.bindQueue(q.queue, exchange, key3);
          
          channel.consume(q.queue, function(msg) {
            // Emitting a new message. Will be consumed by the client
            if(msg.fields.routingKey == key){
              message = JSON.parse(msg.content);
              socket.emit("FromBPAll", message);
            }else if (msg.fields.routingKey == key2){
              action = JSON.parse(msg.content);
              console.log("action reçue",action);
              if(action["id"] == 'begin' || action["id"] == 'end'){
                console.log("reception notification début ou fin de séquence");
              }else{
                actionCompleted.push(action["id"]);
                console.log("completed action", message);
                if(action["id"] == message[activeStep]["stepStages"][message[activeStep]["stepStages"].length -1]["id"]){
                  completedStep[activeStep]=true;
                  console.log("step ", activeStep, "completed");
                  console.log("completedStep : ", completedStep);
                  socket.emit("CompletedStep", completedStep);
                  if(activeStep < message.length - 1){
                    activeStep=activeStep+1;
                    console.log("activestep : ", activeStep);
                    socket.emit("ActiveStep", activeStep);
                  }
                }
                socket.emit("GetAction", actionCompleted);
                socket.emit("FromBPAdv", action);
              }
            }else if (msg.fields.routingKey == key3){
              actionCompleted = [];
              completedStep = {};
              activeStep = 0;
              socket.emit("ResetFromBackend", "reset");
              message = "Attente de la Recette";
              socket.emit("FromBPAll", message);
            }
          }, {
            noAck: true
          });
          //Connection avec socket.io pour communication avec le frontend
          const socket = io.on("connection", (socket) => {
            console.log("Client is connected");
            socket.emit("FromBPAll", message);
            socket.emit("GetAction", actionCompleted);
            socket.emit("ActiveStep", activeStep);
            socket.emit("CompletedStep", completedStep);
            socket.emit("FromBPAdv", action);

            console.log("emitted");

            socket.on("ResetFromClient", (a) => {
              actionCompleted = [];
              completedStep = {};
              activeStep = 0;
              console.log("action completed reset : ", actionCompleted);
              message = "Attente de la Recette";
              socket.emit("FromBPAll", message);
              channel.publish(exchange, key3, Buffer.from("reset"));
            });

            
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

