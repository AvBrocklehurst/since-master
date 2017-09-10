const http = require( "http" );
const gitUsername = require('git-user-name')();
const resolve = require('resolve-dir');
const subdirs = require('subdirs');
const isGit = require('is-git');
const frommaster = require('./frommaster');
const path = require('path');
const async = require("async");
var express = require( "express" )
var bodyParser = require( "body-parser" )
var app = express()
app.use( bodyParser.json() )

const hostname = '127.0.0.1';
const port = 3000;

// Add headers
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.get("/repos", function(reqt, resp) {
    frommaster.getLastMaster(allRepos, (err, data) => {  
        if (err) {
            console.log(err) 
            return 
        } 
        frommaster.getCommitsFromRepos(data, (err, data) => {  
            if (err) {
                console.log(err) 
                return 
            } 
            resp.json( data)
        });
    });
    
})

//Respond to unknown pages with 404 header.
app.use(function(req, res){
    res.status(404);
    res.type('txt').send('Page not found\n');
});

var allRepos = ["/Users/adambrocklehurst/Documents/bubble/taskee/taskee", "/Users/adambrocklehurst/Documents/bubble/bubblestudent-ionic", "/Users/adambrocklehurst/Documents/bubble/taskee/taskee-api"]

app.listen( port, function () {
      console.log( "listening on port" , port )
})