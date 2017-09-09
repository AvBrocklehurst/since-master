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

function getCommitsFromRepos(repos, since, callback) {
  let cmts = [];
  async.each(repos, (repo, repoDone) => {
    try {
        frommaster.frommaster({
        repo: repo,
        all: false,
        number: 100, //max commit count
        since: since,
        fields: ['abbrevHash', 'branch', 'subject', 'authorDate', 'authorName'],
        author: gitUsername
      }, (err, logs) => {
        // Error
        if (err) {
          console.log(err)
        }
        // Find user commits
        let commits = [];
        let last = "";
        logs.forEach(c => {
          if (c.branch != "") {
              last = c.branch
          }
          if (!last.includes("master")) {
            if (c.status && c.status.length) {
                commits.push(`${c.abbrevHash} ${c.branch} - ${c.subject} (${c.authorDate}) <${c.authorName.replace('@end@\n','')}>`);
            }

        }         // filter simple merge commits
        });

        // Add repo name and commits
        if (commits.length >= 1) {
          // Repo name
          cmts.push(repo);
          cmts.push(...commits);
        }

        repoDone();
      });
    } catch(err) {
      callback(err, null);
    }
  }, err => {
    callback(err, cmts.length > 0 ? cmts.join('\n') : "Nothing yet. Start small!");
  });
}


const hostname = '127.0.0.1';
const port = 3000;

var repos = [{url: "github.com", name: "Bubble API"}, {url: "github.com", name: "Bubble Student App"}, {url: "github.com", name: "Bubble Blog"}];

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
    resp.json( repos )
})

//Respond to unknown pages with 404 header.
app.use(function(req, res){
    res.status(404);
    res.type('txt').send('Page not found\n');
});

var allRepos = ["/Users/adambrocklehurst/Documents/bubble/taskee/taskee"]

frommaster.getLastMaster(allRepos, (err, data) => {  
    if (err) {
        console.log(err) 
        return 
    } 
    getCommitsFromRepos(allRepos, data, (err, data) => {  
        if (err) {
            console.log(err) 
            return 
        } 
        console.log(data)
    });
});

app.listen( port, function () {
      console.log( "listening on port" , port )
})