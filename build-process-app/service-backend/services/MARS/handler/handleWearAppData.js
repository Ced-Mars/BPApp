  
  const FILE = "handleWearAppData.js ";
  //TODO: Managing case where the app is directly connected to the backend via WIFI or 4G - can't use DataLayerApi (refer to google documentation)
  //Packaging and sending data to be processed by the wear app
  function handleWearAppData(activeStep, message, socket){
    const TAG = "FUNCTION handleWearAppLogic: ";
    var weardata = {}; //{"current":STRING, "next":STRING, "time":INT}
    //Initializing all nodes used by the DataLayerApi in Android for updating data in the correct node for the wear app
    //User Actions
    const count_path = "/count";
    const count_key = "count_key";
    //Robot Sequence
    const action_path = "/action";
    const action_key = "action_key";
    //Other Sequence related informations
    const sequence_path = "/sequence";
    const sequence_key = "sequence_key";
    //Everything related to alertes -- waiting for implementation from backend and robot controller
    const alerte_path = "/alerte";
    const alerte_key = "alerte_key";
  
    if(activeStep < message.length){
      console.log(FILE + TAG + "TARGET :" + message[activeStep].target);
      if(message[activeStep].target == "ROBOT"){
        //Envoyer la prochaine action Robot
        weardata.current = message[activeStep].target;
        weardata.next = message[activeStep+1].target;
        weardata.time = message[activeStep].duration;
        socket.emit("ProchaineAction", weardata, action_path, action_key);
      }else if (message[activeStep].target == "USER"){
        //Envoyer la prochaine action USER
        weardata.current = message[activeStep].stepStages[0].type;
        if(activeStep+1 >= message.length){
          weardata.next = "";
        }else{
          if(message[activeStep+1].target == "USER"){
            weardata.next = message[activeStep+1].stepStages[0].type;
          }else{
            weardata.next = message[activeStep+1].target;
          }
        }
        weardata.time = 0;
        socket.emit("TempsAction", weardata, count_path, count_key);
      }else{
        console.log(FILE + TAG + "Not in USER or ROBOT target - didn't send info about next action");
      }
    }else{
      weardata.current = "Fin de séquence";
      weardata.next = "";
      weardata.time = 0;
      socket.emit("ProchaineAction", weardata , sequence_path, sequence_key);
    }
}

module.exports = handleWearAppData;