import myPromise from "./getFromDB";
import addToDB from "./addToDB";

const DB = "MARS";
const COLLECTION = "action";

class Action {
    constructor(id, status) {
        this.id = id;
        this.status = status;
    }
    saveAction(action) {
        addToDB("Action saveAction", DB, COLLECTION, {_id : action.id}, { $set: { status: action.status }}, { upsert: true });
    }
}

module.exports = Action;