const express = require("express");
const http = require("http");
const amqp = require("amqplib/callback_api");
const index = require("./routes/index.js");

const port = process.env.PORT || 4001;
const app = express();
app.use(express.static("dist"));
const server = http.createServer(app);

//Global variables where are stored informations about the messaging server and the channel
var message = [];
var percentage = 0;
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
  var nextaction = {};
  var weardata = {}; //{"current":STRING, "next":STRING, "time":INT}
  var activeStep = 0;
  var newStepStages = [];
  var stages = [];
  var newUserArray = [];
  var exchange = 'mars';
  key = 'sequencer.report.process.all';
  key2 = 'sequencer.report.process.status';
  key3 = 'hmi.process.reset';
  const count_path = "/count";
  const count_key = "count_key";
  const action_path = "/action";
  const action_key = "action_key";
  const sequence_path = "/sequence";
  const sequence_key = "sequence_key";
  const alerte_path = "/alerte";
  const alerte_key = "alerte_key";
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
              //parse the full build process received from the sequencer over the rabbitMQ server on sequencer.report.process.all
              message = JSON.parse(msg.content);
              //modifying the build process to match the data we need on the client side - User objects only
              message.map((value, i, arr) => {
                if(value.stepStages.length > 1){
                  if(value.target == "USER"){
                    value["stepStages"].map((v) => {
                      newUserArray.push({
                        "stepStages":[v],
                        "target":"USER"
                      });
                    });
                    newUserArray.map((v1, j) => {
                      if(j == 0){
                        message.splice(i, 1, v1);
                      }else{
                        message.splice(i+1, 0, v1);
                      }
                    });
                    newUserArray.length = 0;
                  }
                }
              });
              console.log("modified users target objects in received array : ", message);
              
              //modifying the build process to match the data we need on the client side - Stepstages arrays only
              message.map((value, i, arr) => {
                value.status="WAITING";
                value.total=value.stepStages.length;
                value.duration = value.total;
                value["stepStages"].map((v) => {
                  v.status="WAITING";
                  if(v.type == "MOVE.STATION.WORK" || v.type == "MOVE.ARM.APPROACH" || v.type == "MOVE.ARM.WORK" || v.type == "WORK.DRILL" || v.type == "WORK.FASTEN"){
                    stages.push(v);
                  }else{
                    stages.push(v);
                    if(stages.length == 1){
                      newStepStages.push(...stages);
                    }else{
                      newStepStages[newStepStages.push([]) - 1].push(...stages);
                    }
                    stages.length = 0;
                  }
                });
                value.stepStages.length = 0;
                value.stepStages.push(...newStepStages);
                newStepStages.length = 0;
              });
              //emit the build process via socketio to all client in room FromBPAll
              socket.emit("FromBPAll", message);
              console.log("modifed stepstages in each Robot sequences to push into an array each actions between  : ", message);
            }else if (msg.fields.routingKey == key2){ // Receiving the status of the action in progress
              action = JSON.parse(msg.content); // Parse the message
              console.log("action reçue",action);
              if(action.id == 'begin' || action.id == 'end' || action.id == 'home'){ // Check if beginning/end of sequence
                if(action.id == 'home'){
                  console.log("Going home position");
                }else{
                  console.log("reception notification début ou fin de séquence");
                  socket.emit("InfoSeq", action.id);
                }
                
              }else{
                //Change status to "SUCCESS" for the received action
                checkAction(message, action, socket, percentage);
                //Change activeStep if status has been changed for the current step
                if(message[activeStep].status == "SUCCESS" && activeStep < message.length){
                  activeStep++;
                  percentage = 0;
                  socket.emit("Percentage", percentage);
                  console.log("activestep : ", activeStep);
                  //Renvoyer la totalité du build process pour update -- à modifier
                  socket.emit("FromBPAll", message);
                  //Envoyer le numéro du step en cours
                  socket.emit("ActiveStep", activeStep);
                
                  if(activeStep+1 < message.length){
                    if(message[activeStep].target == "ROBOT"){
                      //Envoyer la prochaine action Robot
                      weardata.current = message[activeStep].target;
                      weardata.next = message[activeStep+1].target;
                      weardata.time = message[activeStep].duration;
                      socket.emit("ProchaineAction", weardata, action_path, action_key);
                    }else if (message[activeStep].target == "USER"){
                      //Envoyer la prochaine action USER
                      weardata.current = message[activeStep].stepStages[0].type;
                      if(message[activeStep+1].target == "USER"){
                        weardata.next = message[activeStep+1].stepStages[0].type;
                      }else{
                        weardata.next = message[activeStep+1].target;
                      }
                      weardata.time = 0;
                      socket.emit("TempsAction", weardata, count_path, count_key);
                    }else{
                      console.log("Not in USER or ROBOT target - didn't send info about next action");
                    }
                  }else{
                    weardata.current = "Fin de séquence";
                    weardata.next = "";
                    weardata.time = 0;
                    socket.emit("ProchaineAction", weardata , sequence_path, sequence_key);
                  }
                }
                socket.emit("FromBPAdv", action);
              }
            }else if (msg.fields.routingKey == key3){
              activeStep = 0;
              socket.emit("ResetFromBackend", "reset");
              message = [];
            }
          }, {
            noAck: true
          });
          //Connection avec socket.io pour communication avec le frontend
          const socket = io.on("connection", (socket) => {
            console.log("Client is connected");
            socket.emit("FromBPAll", message);
            socket.emit("ActiveStep", activeStep);
            socket.emit("FromBPAdv", action);

            socket.on("ResetFromClient", (a) => {
              activeStep = 0;
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

function checkAction(array, action, socket){
  for (const [key, value] of Object.entries(array)) { //loop through the array of objects and get key - value pair
    if(value.status != "SUCCESS"){
      for (const [key1, value1] of Object.entries(value.stepStages)) { // Loop through an array of arrays
        if(Array.isArray(value1)){
          for (const [key2, value2] of Object.entries(value1)) {  //loop through an array of objects and get key1 - value pair
            if(action.id == value2.id){
              if(value.stepStages.indexOf(value1) == (value.stepStages.length - 1)){
                value.status = "SUCCESS";
              }
              percentage+=1/value.total;
              socket.emit("Percentage", percentage);
              return value1.status = "SUCCESS";
            }
          }
        }else{
          if(action.id == value1.id){
            if(value.stepStages.indexOf(value1) == (value.stepStages.length - 1)){
              value.status = "SUCCESS";
            }
            percentage+=1/value.total;
            socket.emit("Percentage", percentage);
            return value1.status = "SUCCESS";
          }
        }
        

      }

    }
  }
}