//Data Models
import Process from "../../../models/process";
import BuildProcess from "../../../models/buildProcess";

import socketInstance from "../../socket/socketInstance";

//Function of Service Layer - Processing data
import {UpdateArrayUserElementsV2, updateArraySequenceElementsV2} from "../buildProcessUpdate";

const FILE = "handleBuildProcess.js ";

function handleBuildProcess(build_process){
    const TAG = "FUNCTION handleBuildProcess: ";

    //Get socket instance
    let socket = socketInstance.getInstance();

    //parse the full build process received from the sequencer over the rabbitMQ server on sequencer.report.process.all
    build_process = parsingreceivedBuildProcess(build_process);

    //Function rearanging USER actions in the build process for frontend
    //Callback rearanging all actions between APPROACH and CLEARANCE
    build_process = UpdateArrayUserElementsV2(build_process, updateArraySequenceElementsV2);

    //Initialiser classes Process et Build Process
    new Process("MARS_1", 0, 0).saveProcess();
    new BuildProcess("MARS_1", build_process).dbSaveBuildProcess();

    //emit the build process via socketio to all client in room FromBPAll 
    console.log(FILE + TAG + "modifed stepstages: ", build_process);
    socket.emit("FromBPAll", build_process);
}

function parsingreceivedBuildProcess(data){
    return JSON.parse(data.content);
  }

module.exports = handleBuildProcess;