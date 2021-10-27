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
var connection, channel;
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
      //Connection avec socket.io pour communication avec le frontend
      io.on("connection", (socket) => {
        console.log("Client is connected");
        socket.emit("FromBPAll", message);
        console.log("emitted");

        //Connexion to rabbitMQ server
        try {
          //Creating connection with rabbitMQ server
          amqp.connect(server_path, function(error0, conn) {
            if (error0) {
              throw error0;
            }
            connection = conn;
            connection.createChannel(function(error1, chan) {
              if (error1) {
                throw error1;
              }
              channel = chan;
              var exchange = 'sequencer';
          
              channel.assertExchange(exchange, 'topic', {
                durable: false
              });
          
              channel.assertQueue('', {
              }, function(error2, q) {
                if (error2) {
                  throw error2;
                }
                console.log(' [*] Waiting for logs. To exit press CTRL+C');
                key = 'buildp.all';
                key2 = 'buildp.report';
                channel.bindQueue(q.queue, exchange, key);
                channel.bindQueue(q.queue, exchange, key2);
                
                channel.consume(q.queue, function(msg) {
                  // Emitting a new message. Will be consumed by the client
                  if(msg.fields.routingKey == key){
                    message = JSON.parse(msg.content);
                    socket.emit("FromBPAll", message);
                    console.log("%s message sent : ",msg.fields.routingKey, message);
                  }else if (msg.fields.routingKey == key2){
                    if(msg.content.toString() == "return home movement"){
                      socket.emit("FromBPAdv", msg.content.toString());
                      console.log("%s message sent : ",msg.fields.routingKey, msg.content.toString());
                      message = "Attente de la Recette";
                      socket.emit("FromBPAll", message);
                      console.log("%s message sent : ", message);
                    }else{
                      socket.emit("FromBPAdv", msg.content.toString());
                      console.log("%s message sent : ",msg.fields.routingKey, msg.content.toString());
                    }
                    
                  }
                }, {
                  noAck: true
                });

              });
            });
          });
          
        } catch (e) {
          console.error(e);
        }
        //Called when the client disconnect from the socketio link
        socket.on("disconnect", () => {
          channel.close();
          connection.close();
          console.log("Client disconnected");
        });
      });

      server.listen(port, () => console.log(`Listening on port ${port}`));
}

