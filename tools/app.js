const express = require('express');
var app = express();
var Git = require("nodegit");
var pathListToTree = require("path-list-to-tree");
const bodyParser = require('body-parser');
const rimraf = require('rimraf');
const cp = require('child_process');
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
    repo: str.substring((str.lastIndexOf('/') + 1)).replace('.git', '')
  }
});

// let clone = (rep) => {
//   Git.Clone(rep.ssh, rep.repo, cloneOptions).then(function(repository) {
//     console.log(`Repo ${rep.repo} clonning done.`);
//   }).catch(e => {
//     rimraf(rep.repo, () => {
//       console.log(`Done ${rep.repo} remove.`);
//       console.log(rep)
//       console.log(e)
//       clone(rep)
//     })
//   });
// }

let clone = (rep) => {
  cp.exec(`git clone ${rep.ssh}`, (error, stdout, stderr) => {
    if (error) {
      rimraf(rep.repo, () => {
        console.log(`Done ${rep.repo} remove.`);
        console.log(rep)
        console.log(error)
        clone(rep)
      })
    }
    console.log(`Repo ${rep.repo} clonning done.`);
  });
}

repos.forEach(rep => {
  clone(rep);
})

let walkTree = (dir, fileList) => {
  let resultList = fileList;
  if (dir !== '*') {
    let list = [];
    fileList.forEach(item => {
      let re = `^(.*?)${dir}/`
      let regexp = new RegExp(re, 'is')
      if (item.indexOf(dir) >= 0) {
        list.push(item.replace(regexp,''))
      }
    })
    resultList = list.map(item => {
      return item.replace((dir + '/'), '')
    })
  }
  let RepoTree = pathListToTree.default(resultList)
  let filesArr = [];
  let directories = [];
  RepoTree.forEach(item => {
    if (item.children.length === 0) {
      filesArr.push(item.name)
    } else {
      directories.push(item)
    }
  })
  return {
    count: filesArr.length,
    directories,
    files: filesArr
  }
}

app.use(bodyParser.urlencoded());

app.use(bodyParser.json());

//CLONE REPOS FROM SYS ENV
app.get('/git/api/clone/', (req, res) => {
  repos.forEach(rep => {
    clone(rep);
  });
  res.json({
    status: 'success'
  })
});

app.get('/git/api/env/', (req, res) => {
  res.json(process.env)
})

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
        if (item.indexOf('origin') >= 0) {
          if (branches.indexOf(item.replace('refs/remotes/origin/', '')) === -1) {
            branches.push(item.replace('refs/remotes/origin/', ''))
          }
        }
      })
      res.json({
        branches
      })
    })
});

//GET COMMITS
app.get('/git/api/:repo/commits/', (req, res) => {
  const { repo } = req.params;
  let globalCommits = [];
  try {
    Git.Repository.open(repo)
      .then((repository) => {
        let walker = Git.Revwalk.create(repository);
        walker.pushGlob('refs/heads/*');
        walker.getCommits(1000)
          .then(commits => {
            commits.forEach(x => {
              globalCommits.push({
                hash:  x.sha(),
                message: x.message().split('\n')[0],
                date: x.date(),
                author: x.author().name(),
                email: x.author().email(),
                repo: repo
              });
            });
            res.json({
              coommits: globalCommits
            })
          });
        });
  } catch (e) {
    console.log(e)
  }
})

//GET TAGS
app.get('/git/api/:repo/tags/', (req, res) => {
  const { repo } = req.params;
  let tags = [];
  let REPO = null;
  Git.Repository.open(repo).then(repository => {
    return repository.getReferenceNames(3);
  })
  .then(renames => {
    console.log('RENAMES: ', renames);
    let arr = renames.map(name => {
      return Git.Repository.open(repo).then(repository => {
        REPO = repository;
        return repository.getReference(name)
      });
    })
    Promise.all(arr).then(referencies => {
      tags = referencies.filter(ref => {
        if (ref.isTag()) {
          return true;
        }
        return false
      })
      let commitsPromises = tags.map(reference => {
        return reference.peel(Git.Object.TYPE.COMMIT)
      });
      Promise.all(commitsPromises).then(commits => {
        let resultList = commits.map(commit => {
          return Git.Commit.lookup(REPO, commit.id())
        })
        Promise.all(resultList).then(comm => {
          let commitsData = comm.map((commit, idx) => ({
            tag: tags[idx].name(),
            hash: commit.sha(),
            date: commit.date(),
            message: commit.message(),
            author: commit.author().name(),
            email: commit.author().email()
          }));
          res.json({tags: commitsData})
        })
        .catch(e => {
          console.log(e)
        })
      })
      .catch(e => {
        console.log(e)
      })
      // console.log(commits)
    })
    
  })
})

// GET FILES
app.get('/git/api/:repo/:branch/files/:search/:path/:nopaginate/', (req, res) => {
  const { repo , branch, search, nopaginate = 'nopagi', path } = req.params;
  const { sheet = 1 , page, page_size = 20 } = req.query;
  let pageNum = page || sheet;
  let paginationFlag = nopaginate === 'nopagi';
  let basePathArr = path.split('.');
  let basePath = basePathArr.join('/');
  let br = branch.replace('.', '/');
  Git.Repository.open(repo)
    .then((repository) => {
      return repository.getBranchCommit('refs/remotes/origin/' + br)
    })
    .then(commit => {
      return commit.getTree()
    })
    .then(tree => {
      let fileList = [];
      let eventEmitter = tree.walk();
      eventEmitter.on('entry' , en => {
        fileList.push(en.path())
      })
      eventEmitter.on('end', (trees) => {
        let whichRoot = fileList.filter(item => {
          return item.indexOf('EDM/VTB24/SQLDVM') >= 0
        })
        if (whichRoot.length > 0 && basePath !== '*') {
          basePath = 'EDM/VTB24/SQLDVM/' + basePath.replace('*', '')
        } else {
          basePath = 'EDM/VTB24/SQLDVM'
        }
        if (search !== '*') {
          let findedList = fileList.filter(item => {
            return item.indexOf(search) >= 0 && item.indexOf(basePath) >= 0 && item.replace(basePath, '').indexOf('/') < 0
          })
          res.json({
            count: findedList.length,
            files: paginationFlag ?
              findedList :
              findedList.map(item => {
                return item.replace(basePath + '/', '')
              }).slice((pageNum * page_size) - page_size, (pageNum * page_size))
          })
        } else {
          res.json({
            ...walkTree(basePath, fileList),
            files: paginationFlag ?
              walkTree(basePath, fileList).files:
              walkTree(basePath, fileList).files.slice((pageNum * page_size) - page_size, (pageNum * page_size)),
          })
        }
      })
      eventEmitter.start()
    })
})


// POST FILES LIST
app.post('/git/api/:repo/:branch/files/:search/', (req, res) => {
  const { path } = req.body;
  const { repo, branch, search } = req.params;
  const { sheet = 1 , page, page_size = 20 } = req.query;
  let pageNum = page || sheet;
  let br = branch.replace('.', '/');
  let basePath = path;
  Git.Repository.open(repo)
    .then((repository) => {
      return repository.getBranchCommit('refs/remotes/origin/' + br)
    })
    .then(commit => {
      return commit.getTree()
    })
    .then(tree => {
      let fileList = [];
      let eventEmitter = tree.walk();
      eventEmitter.on('entry' , en => {
        fileList.push(en.path())
      })
      eventEmitter.on('end', (trees) => {
        let whichRoot = fileList.filter(item => {
          return item.indexOf('EDM/VTB24/SQLDVM') >= 0
        })
        if (whichRoot.length > 0 && path !== '*') {
          basePath = 'EDM/VTB24/SQLDVM' + '/' + path.replace('*', '')
        } else {
          basePath = 'EDM/VTB24/SQLDVM'
        }
        if (search !== '*') {
          let findedList = fileList.filter(item => {
            return item.indexOf(search) >= 0 && item.indexOf(basePath) >= 0 && item.replace(basePath + '/', '').indexOf('/') < 0
          })
          res.json({
            count: findedList.length,
            files: findedList.map(item => {
              return item.replace(basePath + '/', '')
            })
          })
        } else {
          res.json({
            ...walkTree(basePath, fileList),
            files: walkTree(basePath, fileList).files.slice((pageNum * page_size) - page_size, (pageNum * page_size))
          })
        }
      })
      eventEmitter.start()
    })
})

app.listen(process.env.nodegit_port || 3031, () => {
  console.log(`NodeGit listening on port ${process.env.nodegit_port || 3031}.`)
})