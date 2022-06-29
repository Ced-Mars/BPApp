import express from 'express';
import { createServer } from "http";

const app = express();
const server = createServer(app);

app.use("/", express.static('./dist'));

app.get("/connexion", function (req, res) {
  res.send('Page to say user is not connected or has not access to the machine');
});

//health check route
app.get('/_health', (req, res) => {
  res.status(200).send('ok')
});

module.exports = {app, server};
