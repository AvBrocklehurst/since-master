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

/**
 * returns all commits of the last given `days`.
 * Calls `callback` with line-seperated-strings of the formatted commits.
 */

function getCommitsFromRepos(repos, callback) {
  let data = [];
  repos.forEach(function(repo) {
    try {
        frommaster.gitlog({
        repo: repo.repo,
        all: false,
        number: 100, //max commit count
        since: repo.last,
        fields: ['abbrevHash', 'branch', 'subject', 'authorDate', 'authorName'],
        author: gitUsername
      }, (err, logs) => {
        if (err) {
          console.log(err)
        }
        let commits = [];
        let last = "";
        logs.forEach(c => {
          if (c.branch != "") {
              last = c.branch
          }
          if (!last.includes("master")) {
            if (c.status && c.status.length) {
                commits.push({hash: c.abbrevHash, subject: c.subject, author: c.authorName.replace('@end@\n','')});
            }
        }        
        });
        if (commits.length >= 1) {
          data.push({about: repo, commits: commits});
        }
        if (data.length == repos.length) {
            callback(null, data)
        }
      });
    } catch(err) {
      callback(err, null);
    }
  })
}

const hostname = '127.0.0.1';
const port = 3000;

// Add headers
app.use(function (req, res, next) {
    
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    // Pass to next layer of middleware
    next();
});

app.get("/repos", function(reqt, resp) {
    frommaster.getLastMaster(allRepos, (err, data) => {  
        if (err) {
            console.log(err) 
            return 
        } 
        getCommitsFromRepos(data, (err, data) => {  
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