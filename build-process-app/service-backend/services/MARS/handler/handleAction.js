import addToDB from "../../../models/addToDB";
import {checkAction} from "../buildProcessUpdate";
import myPromise from "../../../models/getFromDB";
import handleWearAppData from "./handleWearAppData";
import Process from "../../../models/process";

import socketInstance from "../../socket/socketInstance";

const FILE = "handleAction.js";

async function handleReceivedAction(action){
  const TAG = "FUNCTION handleReceiveAction: ";

  let socket = socketInstance.getInstance();

  action = parsingreceivedAction(action); // Parse the message
  console.log(FILE + TAG + "Received Action : ", action);

  addToDB(action, "MARS", "actions", {_id : action.id}, { $set: { status: action.status }}, {upsert: true});

  var process = await myPromise("MARS", "process");
  var build_process = await myPromise("MARS", "buildprocess");
  
  switch (action.id) {
    case 'begin':
      console.log(FILE + TAG, "Début de séquence");
      socket.emit("InfoSeq", action.id);
      break;
    case 'end':
      console.log(FILE + TAG, "Fin de séquence");
      socket.emit("InfoSeq", action.id);
      break;
    case 'home':
      console.log(FILE + TAG, "Robot en position HOME");
      socket.emit("InfoSeq", action.id);
      break; 
    default:
      if(build_process != undefined) 
        inSequenceProcess(socket, action, build_process.data, process.percentage, process.activeStep);
      break;
  }
}

function parsingreceivedAction(data){
  return JSON.parse(data.content);
}

//Update the build process and update data to all frontends if change of sequence
function inSequenceProcess(socket, action, build_process, percentage, activeStep){
  const TAG = "FUNCTION inSequenceProcess: ";

  //TODO : get percentage and build process from db
  //Change status to "SUCCESS" for the received action or updating end of a sequence
  checkAction(build_process, action, socket, percentage, addToDB);

  //Change activeStep if status has been changed for the current step
  if(build_process != 'undefined' && build_process[activeStep].status == "SUCCESS" && activeStep < build_process.length){
    activeStep++;
    addToDB(activeStep, "MARS", "process", {target: "MARS_1"}, { $set: { activeStep: activeStep }}, {upsert: true});
    console.log(FILE + TAG + "activestep : ", activeStep);
    //Renvoyer la totalité du build process pour update
    //TODO: Ne pas renvoyer le Build Process à chaque update, faire un update directement sur le frontend
    socket.emit("FromBPAll", build_process);
    //Envoyer le numéro du step en cours
    socket.emit("ActiveStep", activeStep);
    //Envoyer le pourcentage de la séquence en cours
    socket.emit("Percentage", percentage);
  
    //Function called to populate and send data that will be send to the phone to be send and used by the wear app via the dataLayerApi
    handleWearAppData(activeStep, build_process, socket);
  }
}


module.exports = handleReceivedAction;