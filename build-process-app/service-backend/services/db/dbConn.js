import { MongoClient, ServerApiVersion } from "mongodb";
import process from 'node:process';

const FILE = "dbConn.js ";

var p_db;

function MongoPool(){}

function initPool(uri, cb){
  const TAG = "FUNC initPool: ";

  new MongoClient(uri, 
    { 
      useNewUrlParser: true, 
      useUnifiedTopology: true, 
      serverApi: ServerApiVersion.v1,
    }
  ).connect(function(err, db) {
    if (err) {
      console.log(FILE + TAG + "Error connecting to MongoDB");
      console.log(FILE + TAG + "Error : ", err);
      process.exit(1);
    }

    p_db = db;
    if(cb && typeof(cb) == 'function')
        cb(p_db);
  });
  return MongoPool;
}
MongoPool.initPool = initPool;

function getInstance(cb){
  if(!p_db){
    initPool(cb)
  }
  else{
    if(cb && typeof(cb) == 'function')
      cb(p_db);
  }
}
MongoPool.getInstance = getInstance;

function endInstance(){
  if(p_db){
    client.close();
  }
}
MongoPool.endInstance = endInstance;

module.exports = MongoPool;