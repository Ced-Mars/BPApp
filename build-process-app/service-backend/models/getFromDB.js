import MongoPool from "../services/db/dbConn";

const FILE = "getFromDB.js ";

var myPromise = (DB_NAME, COLLECTION, target) => (
  new Promise((resolve, reject) => {
    MongoPool.getInstance(function(db){
      db.db(DB_NAME).collection(COLLECTION).findOne({})
      .then(function(result){
          resolve(result);
      });
    })
  })
);

module.exports = myPromise;