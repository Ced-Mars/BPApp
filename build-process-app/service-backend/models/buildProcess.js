import myPromise from "./getFromDB";
import addToDB from "./addToDB";

const DB = "MARS";
const COLLECTION = "buildprocess";

class BuildProcess {
    constructor(processus_target, data){
        this.processus_target = processus_target;
        this.data = data;
    }
    getBuildProcess(processus_target){
        return myPromise(DB, COLLECTION, processus_target);
    }
    dbSaveBuildProcess(){
        addToDB("BuildProcess setBuildProcess", DB, COLLECTION, {processus_target: "MARS_1"}, { $set: { processus_target: this.processus_target, data: this.data }}, {upsert: true});
    }
}

module.exports = BuildProcess;