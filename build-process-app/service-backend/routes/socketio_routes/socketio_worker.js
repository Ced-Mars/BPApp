'use-strict'

function socketDefinition(io){
  return io.on("connection", (socket) => {
    console.log("Client is connected - sending data");
    //socket.emit("FromBPAll", message);
    //socket.emit("ActiveStep", activeStep);
    //socket.emit("FromBPAdv", action);
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