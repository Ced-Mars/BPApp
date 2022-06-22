//Routing Handlers
import handleReceivedAction from "../../services/MARS/handler/handleAction";
import handleResetHMI from "../../services/MARS/handler/resetHMI";
import handleBuildProcess from "../../services/MARS/handler/handleBuildProcess";

//Name of the file for debugging purpose
const FILE = "rabbitMQRouting.js ";

async function handleRoutingServerData(data){
    const TAG = "FUNCTION handleRoutingServerData: ";
    const key = 'sequencer.report';
    const key1 = 'hmi.update';
    // Emitting a new message. Will be consumed by the client
    if(data.fields.routingKey == key){
      if(data.properties.headers.path == "/buildProcess/all"){
        handleBuildProcess(data);
      }else if (data.properties.headers.path == "/buildProcess/status"){
        handleReceivedAction(data);
      }else{
        console.log("Message received with routing key sequencer.report does not have a recognized path");
      }
    }
    //Sending a simple string on "ResetFromBackend" room that will be processed as a wipe/reset of data in other backend and thus frontend
    else if (data.fields.routingKey == key1){
      if(data.properties.headers.path == "/hmi/reset"){
        console.log(FILE + TAG + "Reset HMI");
        //handleResetHMI();
      }else{
        console.log("Message received with routing key hmi.update does not have a recognized path");
      } 
    }
    else{
      console.log(FILE + TAG + "Routing key not implemented in backend");
    }
}

module.exports = handleRoutingServerData;