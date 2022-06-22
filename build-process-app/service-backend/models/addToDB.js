import MongoPool from "../services/db/dbConn";

const FILE = "addToDB.js ";

function addToDB(data, DB_NAME, COLLECTION, filter, update, options) {
  const TAG = "FUNCTION addToDB: ";
  MongoPool.getInstance(function(db){
    db.db(DB_NAME).collection(COLLECTION).updateOne(filter, update, options, function(err, result){
      if(err) throw err;
      if(result.upsertedCount == 1){
        console.log(FILE + TAG + "Element Inserted in DB", data);
      }else if(result.matchedCount == 1 && result.modifiedCount == 1){
        console.log(FILE + TAG + "Element Matched and Modified", data);
      }else if(result.matchedCount == 1 && result.modifiedCount == 0){
        console.log(FILE + TAG + "Element matched but not modified", data);
      }else{
        console.log(FILE + TAG + "No Element Inserted or Matched", data);
      }
    });
  });
}

module.exports = addToDB;