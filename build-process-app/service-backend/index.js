//TODO : remove use of babel for using import
require("@babel/register");
require("@babel/polyfill");
var app = require('./App.js');
app();