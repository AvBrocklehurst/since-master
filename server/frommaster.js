//tweaked from https://github.com/domharrington/node-gitlog to support needs better
/****** 
 * Original Lisence of software before modification.
 * 
 * Copyright (c) 2016, Dominic Harrington
 * 
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer. 
   2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution. 
   
    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
  ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

  The views and conclusions contained in the software and documentation are those
  of the authors and should not be interpreted as representing official policies,
  either expressed or implied, of the FreeBSD Project.
*****/


module.exports = {
  gitlog: gitlog,
  getLastMaster: getLastMaster,
  getCommitsFromRepos: getCommitsFromRepos
}
var exec = require('child_process').exec
  , execSync = require('child_process').execSync
  , async = require("async")
  , debug = require('debug')('frommaster')
  , extend = require('lodash.assign')
  , delimiter = '\t'
  , fields =
    { hash: '%H'
    , abbrevHash: '%h'
    , branch: '%d'
    , treeHash: '%T'
    , abbrevTreeHash: '%t'
    , parentHashes: '%P'
    , abbrevParentHashes: '%P'
    , authorName: '%an'
    , authorEmail: '%ae'
    , authorDate: '%ai'
    , authorDateRel: '%ar'
    , committerName: '%cn'
    , committerEmail: '%ce'
    , committerDate: '%cd'
    , committerDateRel: '%cr'
    , subject: '%s'
    , body: '%B'
    }
  , notOptFields = [ 'status', 'files' ]


function toTime(from) {
  let dateTimeParts = from.split(' '),
  date;
  let timezone = dateTimeParts[2]
  timezone = '' + timezone
  let zone = timezone.substr(1,2)
  //From 2017-08-16 16:47:10 +0100
  //To 2014-02-12T16:36:00-07:00
  date = dateTimeParts[0] + "T" + dateTimeParts[1] + "-" + zone + ":00" //time zone
  //date = new Date(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2]);
  //return date.getTime();
  return date
}


function getCommitsFromRepos(repos, callback) {
  let data = [];
  repos.forEach(function(repo) {
    try {
        gitlog({
        repo: repo.repo,
        all: false,
        number: 100, //max commit count
        since: repo.last,
        fields: ['abbrevHash', 'branch', 'subject', 'authorDate', 'authorName'],
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


//gets timestamps of last master commit for all branches supplied
function getLastMaster(repos, callback) {
  let data = []
  repos.forEach(function(repo){
    let last = 0;
    try {
      gitlog({
      repo: repo,
      all: true,
      number: 100, //max commit count
      since: `100 days ago`,
      fields: ['abbrevHash', 'branch', 'subject', 'authorDate', 'authorName']
    }, (err, logs) => {
      if (err) {
        console.log("ERROR")
        console.log(err)
      }
      logs.forEach(c => {
        if (c.branch.includes("master")) {
          last = toTime(c.authorDate)
        }          
      });
      data.push({last: last, repo: repo});
      if(data.length === repos.length) {
        callback(null, data);
      }
    });
    } catch(err) {
      callback(err, null);
      return 
    }
  });
}

function gitlog(options, cb) {
  if (!options.repo) throw new Error('Repo required!')

  var defaultOptions =
    { number: 10
    , fields: [ 'abbrevHash', 'branch', 'hash', 'subject', 'authorName' ]
    , nameStatus:true
    , all:false
    , execOptions: {}
    }

  // Set defaults
  options = extend(defaultOptions, options)

  var prevWorkingDir =  process.cwd()
  try {
    process.chdir(options.repo)
  } catch (e) {
    throw new Error('Repo location does not exist')
  }

  // Start constructing command
  var command = 'git log '

  if (options.all){
    command += '--all '
  }

  command += '-n ' + options.number


  command += " --since='" + options["since"] + "'";

  // Start of custom format
  command += ' --pretty="@begin@'

  // Iterating through the fields and adding them to the custom format
  options.fields.forEach(function(field) {
    if (!fields[field] && field.indexOf(notOptFields) === -1) throw new Error('Unknown field: ' + field)
    command += delimiter + fields[field]
  })

  // Close custom format
  command += '@end@"'

  // Append branch if specified
  if (options.branch) {
    command += ' ' + options.branch
  }

  if (options.file) {
    command += ' -- ' + options.file
  }

  //File and file status
  command += fileNameAndStatus(options)

  debug('command', options.execOptions, command)

  exec(command, options.execOptions, function(err, stdout, stderr) {
    debug('stdout',stdout)
    var commits = stdout.split('\n@begin@')
    if (commits.length === 1 && commits[0] === '' ){
      commits.shift()
    }
    debug('commits',commits)

    commits = parseCommits(commits, options.fields, options.nameStatus)

    cb(stderr || err, commits)
  })

  process.chdir(prevWorkingDir);
}

function fileNameAndStatus(options) {
  return options.nameStatus ? ' --name-status' : '';
}

function parseCommits(commits, fields, nameStatus) {
  return commits.map(function(commit) {
    var parts = commit.split('@end@\n\n')

    commit = parts[0].split(delimiter)

    if (parts[1]) {
      var parseNameStatus = parts[1].split('\n');

      // Removes last empty char if exists
      if (parseNameStatus[parseNameStatus.length - 1] === ''){
        parseNameStatus.pop()
      }

      // Split each line into it's own delimitered array
      parseNameStatus.forEach(function(d, i) {
        parseNameStatus[i] = d.split(delimiter);
      });

      // 0 will always be status, last will be the filename as it is in the commit,
      // anything inbetween could be the old name if renamed or copied
      parseNameStatus = parseNameStatus.reduce(function(a, b) {
        var tempArr = [ b[ 0 ], b[ b.length - 1 ] ];

        // If any files in between loop through them
        for (var i = 1, len = b.length - 1; i < len; i++) {
          // If status R then add the old filename as a deleted file + status
          // Other potentials are C for copied but this wouldn't require the original deleting
          if (b[ 0 ].slice(0, 1) === 'R'){
            tempArr.push('D', b[ i ]);
          }
        }

        return a.concat(tempArr);
      }, [])

      commit = commit.concat(parseNameStatus)
    }

    debug('commit', commit)

    // Remove the first empty char from the array
    commit.shift()

    var parsed = {}

    if (nameStatus){
      // Create arrays for non optional fields if turned on
      notOptFields.forEach(function(d) {
        parsed[d] = [];
      })
    }

    commit.forEach(function(commitField, index) {
      if (fields[index]) {
        parsed[fields[index]] = commitField
      } else {
        if (nameStatus){
          var pos = (index - fields.length) % notOptFields.length

          debug('nameStatus', (index - fields.length) ,notOptFields.length,pos,commitField)
          parsed[notOptFields[pos]].push(commitField)
        }
      }
    })

    return parsed
  })
}