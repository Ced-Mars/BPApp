'use-strict'
import myPromise from "../../models/getFromDB";

function socketDefinition(io){
  return io.on("connection", (socket) => {

    console.log("Client is connected - sending data");

    //socket.emit("FromBPAll", build_process.data);
    //socket.emit("ActiveStep", process.activeStep);
    socket.on("ResetFromClient", (a) => {
      //activeStep = 0;
      //message = "Attente de la Recette";
      //socket.emit("FromBPAll", message);
      try {
        //channel.publish(exchange, key3, Buffer.from("reset"));
      } catch (error) {
        console.log(TAG, error)
      }
    });
    
    //Called when the client disconnect from the socketio link
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}

module.exports = socketDefinition;