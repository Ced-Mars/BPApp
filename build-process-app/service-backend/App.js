"use-strict";

import process from 'node:process';
import config from "config";

import {server} from "./routes/express_routes/routes";

import rabbitmq_consumers from "./services/message_broker/rabbitmq_consumers";
import MongoPool from "./services/db/dbConn";
import socketInstance from "./services/socket/socketInstance";

const FILE = "App.js";

//Initialise config data
let host;
let port;
let rabbitMqUrl;
let exchange;
let rabbitMQOpts;
let dbUri;

//get config data
try {
  //get server configuration
  host = config.get('server.host');
  port = process.env.PORT || config.get('server.port');
  // get message broker configuration
  rabbitMqUrl = config.get('rabbitMq.url');
  exchange = config.get('rabbitMq.exchange');
  rabbitMQOpts = config.get("rabbitMQRouting.opts");
  //get db configuration
  dbUri = config.get('mongoDB.url');
} catch (error) {
  console.log(FILE, " Error loading config data");
  process.exit(1);
}

//Initialize connection to MongoDB
MongoPool.initPool(dbUri, (pool) => { console.log("Connected to MongoDB pool \n", pool.s)});

//Initialize socketIO connection mounted on express server
socketInstance.initInstance(server, (socket) => console.log("socket created \n", socket));

//Launching RabbitMQ consummer
rabbitmq_consumers(rabbitMqUrl, exchange, rabbitMQOpts);

//Launching httpserver on defined port in main functin that will be called in index.js
//in index.js we use babel to be able to use ES6 syntax on any files related to App.js
function main(){
  //launching express server
  server.listen(port, () => console.log(`Listening on port ${port}`));
}

module.exports = main;