module.exports = {
  frommaster: frommaster,
  getLastMaster: getLastMaster
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

/***
    Add optional parameter to command
*/
function addOptional(command, options) {
  var cmdOptional = [ 'since', 'after', 'until', 'before', 'committer' ]
  for (var i = cmdOptional.length; i--;) {
    if (options[cmdOptional[i]]) {
      command += ' --' + cmdOptional[i] + '="' + options[cmdOptional[i]] + '"'
    }
  }
  return command
}

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

function getLastMaster(repos, callback) {
  console.log(repos)
  let data = []
  repos.forEach(function(repo){
    console.log(repo)
    let last = 0;
    try {
      frommaster({
      repo: repo,
      all: true,
      number: 100, //max commit count
      since: `100 days ago`,
      fields: ['abbrevHash', 'branch', 'subject', 'authorDate', 'authorName']
    }, (err, logs) => {
      console.log("done")
      // Error
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
  /*
  async.each(repos, (repo, repoDone) => {
    try {
        frommaster({
        repo: repo,
        all: true,
        number: 100, //max commit count
        since: `100 days ago`,
        fields: ['abbrevHash', 'branch', 'subject', 'authorDate', 'authorName']
      }, (err, logs) => {
        // Error
        if (err) {
          console.log(err)
        }
        logs.forEach(c => {
          if (c.branch.includes("master")) {
            last = toTime(c.authorDate)
          }          
        });
        repoDone();
      });
    } catch(err) {
      callback(err, null);
    }
  }, err => {
    callback(err, last);
  });
  */
}

function frommaster(options, cb) {
  if (!options.repo) throw new Error('Repo required!')

  var defaultOptions =
    { number: 10
    , fields: [ 'abbrevHash', 'branch', 'hash', 'subject', 'authorName' ]
    , nameStatus:true
    , findCopiesHarder:false
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

  if (options.findCopiesHarder){
    command += '--find-copies-harder '
  }

  if (options.all){
    command += '--all '
  }

  command += '-n ' + options.number

  command = addOptional(command, options)

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

  console.log(command)

  if (!cb) {
    // run Sync

    var stdout = execSync(command, options.execOptions).toString()
      , commits = stdout.split('\n@begin@')

    if (commits.length === 1 && commits[0] === '' ){
      commits.shift()
    }

    debug('commits',commits)

    commits = parseCommits(commits, options.fields,options.nameStatus)

    process.chdir(prevWorkingDir)

    return commits
  }

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