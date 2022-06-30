//Routing Handlers
import handleReceivedAction from "../../services/MARS/handler/handleAction";
import handleResetHMI from "../../services/MARS/handler/resetHMI";
import handleBuildProcess from "../../services/MARS/handler/handleBuildProcess";
import myPromise from "../../models/getFromDB";

//Name of the file for debugging purpose
const FILE = "rabbitMQRouting.js ";
const PUBLISHER = "build_processorHMI";

async function handleRoutingServerData(data, exchange, channel){
    const TAG = "FUNCTION handleRoutingServerData: ";
    const key = 'report.hmi';
    const key1 = 'hmi.update';
    // Emitting a new message. Will be consumed by the client
    if(data.fields.routingKey == key){
      if(data.properties.headers.path == "/buildProcess/all"){
        handleBuildProcess(data);
        responseSuccessToSender(exchange, channel, data, "SUCCESS");
      }else if (data.properties.headers.path == "/buildProcess/status"){
        handleReceivedAction(data);
        responseSuccessToSender(exchange, channel, data, "SUCCESS");
      }else{
        console.log("Message received with routing key sequencer.report does not have a recognized path");
      }
    }
    //Sending a simple string on "ResetFromBackend" room that will be processed as a wipe/reset of data in other backend and thus frontend
    else if (data.fields.routingKey == key1){
      if(data.properties.headers.path == "/hmi/reset"){
        console.log(FILE + TAG + "Reset HMI");
        //handleResetHMI();
      }else if (data.properties.headers.path == "/hmi/manipulation/info"){
        //Receive uid in content of the message -- String value
        console.log("resquest of manip info from sequencerHMI");
        var process = await myPromise("MARS", "process");
        var build_process = await myPromise("MARS", "buildprocess");
        var dataToSend = build_process.data[process.activeStep].stepStages;
        console.log(FILE + TAG + "data to send : ", dataToSend);
        responseManipInfo(exchange, channel, data, dataToSend);

      }else{
        console.log("Message received with routing key hmi.update does not have a recognized path");
      } 
    }
    else{
      console.log(FILE + TAG + "Routing key not implemented in backend");
    }
}

function responseSuccessToSender(exchange, channel, msg, status){
  const TAG = "FUNC responseSuccessToSender: ";
  try{
    channel.publish(exchange, msg.properties.headers.report_topic, Buffer.from(JSON.stringify({status: status})), { headers: {publisher : PUBLISHER}});
  }catch(e){
    console.log(FILE + TAG + "could not send response message to publisher : ", e);
  }
}

function responseManipInfo(exchange, channel, msg, dataToSend){
  const TAG = "FUNC responseManipInfo: ";
  try{
    channel.publish(exchange, msg.properties.headers.report_topic, Buffer.from(JSON.stringify({status: "SUCCESS"})), { headers: {publisher : PUBLISHER, path:"hmi/manipulation/response"}});
  }catch(e){
    console.log(FILE + TAG + "could not send response Manip Info to publisher : ", e);
  }
}

module.exports = handleRoutingServerData;