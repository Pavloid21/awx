const express = require('express');
var app = express();
var Git = require("nodegit");
var cloneOptions = {};
cloneOptions.fetchOpts = {
  callbacks: {
    certificateCheck: function() { return 0; },
    credentials: function(url, userName) {
      console.log(userName)
      return Git.Cred.sshKeyFromAgent(userName);
    }
  }
};

let SSHStrings = process.env.REPOS.split(',')
let repos = SSHStrings.map(str => {
  return {
    ssh: str,
    repo: str.substring((str.lastIndexOf('/') + 1))
  }
});


repos.forEach(rep => {
  Git.Clone(rep.ssh, rep.repo, cloneOptions).then(function(repository) {
    // Work with the repository object here.
  }).catch(e => {
    console.log(e)
  });
})



var getMostRecentCommit = function(repository) {
  return repository.getBranchCommit("master");
};

var getCommitMessage = function(commit) {
  return commit.message();
};


Git.Repository.open("sql2excel")
  .then(getMostRecentCommit)
  .then(getCommitMessage)
  .then(function(message) {
    data = message
    console.log(message);
  })
  .catch(e => {
    // console.log(e)
  });

//GET REPOS
app.get('/git/api/repos/', (req, res) => {
  res.json({
    repositories: repos
  })
})

// GET BRANCHES
app.get('/git/api/:repo/branches/', (req, res) => {
  const { repo } = req.params;
  Git.Repository.open(repo)
    .then((repository) => {
      return repository.getReferenceNames(3);
    }).then(names => {
      const branches = [];
      names.forEach(item => {
        if (item.indexOf('origin') < 0) {
          branches.push(item.replace('refs/heads/', ''))
        }
      })
      res.json({
        branches
      })
    })
});

// GET FILES
// WARNING! Includes files inside subdirectories
app.get('/git/api/:repo/:branch/files/:search/', (req, res) => {
  const { repo , branch, search } = req.params;
  const { sheet = 1 , page, page_size = 20 } = req.query;
  let pageNum = page || sheet
  Git.Repository.open(repo)
    .then((repository) => {
      return repository.getBranchCommit(branch)
    })
    .then(commit => {
      return commit.getTree()
    })
    .then(tree => {
      const fileList = [];
      let eventEmitter = tree.walk(true);
      eventEmitter.on('entry' , en => {
        fileList.push(en.path())
      })
      eventEmitter.on('end', (trees) => {
        if (search !== '*') {
          let findedList = fileList.filter(item => {
            return item.indexOf(search) >= 0
          })
          res.json({
            count: findedList.length,
            files: findedList.slice((pageNum * page_size) - page_size, (pageNum * page_size))
          })
        } else {
          // console.log(fileList.slice((pageNum * page_size) - page_size, (pageNum * page_size)))
          res.json({
            count: fileList.length,
            files: fileList.slice((pageNum * page_size) - page_size, (pageNum * page_size))
          })
        }
      })
      eventEmitter.start()
    })
})

app.listen(process.env.nodegit_port || 3031, () => {
  console.log(`NodeGit listening on port ${process.env.nodegit_port || 3031}.`)
})