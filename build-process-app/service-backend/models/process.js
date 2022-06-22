import myPromise from "./getFromDB";
import addToDB from "./addToDB";

const DB = "MARS";
const COLLECTION = "process";

class Process {
    constructor(target, activeStep, percentage) {
        this.target = target;
        this.activeStep = activeStep;
        this.percentage = percentage;
    }
    get process() {
        return myPromise(DB, COLLECTION, this.target);
    }
    saveProcess() {
        addToDB("Process saveProcess", DB, COLLECTION, { target: this.target }, { $set: {target: this.target, activeStep: this.activeStep, percentage: this.percentage} }, { upsert: true });
    }
    saveProcessPercentage(percentage) {
        addToDB("Process saveProcessPercentage", DB, COLLECTION, { target: this.target }, { $set: { percentage: percentage } }, { upsert: true });
    }
    saveProcessActiveStep(activeStep) {
        addToDB("Process saveProcessActiveStep", DB, COLLECTION, { target: this.target }, { $set: { activeStep: activeStep } }, { upsert: true });
    }
}

module.exports = Process;