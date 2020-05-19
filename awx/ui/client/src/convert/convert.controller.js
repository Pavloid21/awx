export default [
    "$rootScope",
    "$scope",
    "$location",
    "ConfigService",
    "Dataset",
    "SQL2EXCEL",
    "EXCEL2SQL",
    "Uploadfile",
    "lastPath",
    "$http",
    "Wait",
    ($rootScope, $scope, $location, ConfigService, Dataset, SQL2EXCEL, EXCEL2SQL, Uploadfile, lastPath, $http, Wait) => {
        $scope.displayView = 'sql2excel'
        $scope.searchString = ''
        $scope.directory = ''
        $scope.breadCrumbs = ['root']
        $scope.selectedFiles = [];
        $scope.types = [{
          path: '*',
          files: $scope.files,
          breadCrumbs: ['root'],
          directories: $scope.directories,
          attachments: [{
            attachment: null,
            file: null,
            dropdown: false
          }],
          targets: [''],
          deploy_targets: [''],
          currentPage: 1
        }];
        $scope.typesHash = makeid(10);
        $scope.allowGetDSL = false;
        $scope.applied = false;
        $scope.showCompleted = false;
        $scope.tab = 'sql2excel';
        $scope.sql2excelHistoryDataset = SQL2EXCEL.data;
        $scope.sql2excelHistory = SQL2EXCEL.data.results;
        $scope.excel2sqlHistoryDataset = EXCEL2SQL.data;
        $scope.excel2sqlHistory = EXCEL2SQL.data.results;
        $scope.$on("updateDataset", (e, dataset, queryset) => {
          if (e.targetScope.basePath.indexOf('sql2excel_history') > 0) {
            $scope.sql2excelHistoryDataset = dataset;
            $scope.sql2excelHistory = dataset.results;
            $scope.tab = 'sql2excel';
            $scope.displayView = 'history';
          } else if (e.targetScope.basePath.indexOf('excel2sql_history') > 0) {
            $scope.excel2sqlHistoryDataset = dataset;
            $scope.excel2sqlHistory = dataset.results;
            $scope.tab = 'excel2sql';
            $scope.displayView = 'history';
          } else {
            $scope.dataset = dataset;
            $scope.files = dataset.files
          }
          });
        Wait('start')
        function makeid(length) {
          var result           = '';
          var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
          var charactersLength = characters.length;
          for ( var i = 0; i < length; i++ ) {
             result += characters.charAt(Math.floor(Math.random() * charactersLength));
          }
          $scope.hash = result;
          return result;
       }
       Wait('start');
        $http({
          method: 'GET',
          url: '/git/api/clone/'
        }).then(function success(response) {
          Wait('stop');
          $http({
            method: 'GET',
            url: '/git/api/repos/'
          }).then(function success(response) {
              $scope.environments = response.data.repositories;
              Wait('stop')
          }).catch( reason => {
              Wait('stop');
              console.log(reason)
          })
        })

        $scope.switchView = (view) => {
            $scope.displayView = view;
        }

        $scope.getDataEnv = () => {
            Wait('start');
            $http({
                method: 'GET',
                url: `git/api/${$scope.env}/branches/`
            }).then(function success(response) {
                $scope.branches = response.data.branches;
                Wait('stop')
            })
        }

        $scope.getDataBranch = (typeIndex) => {
            Wait('start');
            if (typeIndex !== undefined) {
              let path = '';
              if ($scope.types[typeIndex].path.indexOf('*/') === 0) {
                path = $scope.types[typeIndex].path.replace('*/','');
              } else {
                path = $scope.types[typeIndex].path;
              }
              let branch = $scope.branch.replace('/', '.')
              $http({
                method: 'POST',
                url: `git/api/${$scope.env}/${branch}/files/${$scope.types[typeIndex].searchString || '*'}/?page_size=10&page=${$scope.types[typeIndex].currentPage}`,
                data: {
                  path
                }
              }).then(function success(response) {
                $scope.types[typeIndex].directories = response.data.directories;
                if ($scope.types[typeIndex].currentPage > 1) {
                  $scope.types[typeIndex].files = [
                    ...$scope.types[typeIndex].files,
                    ...response.data.files
                  ];
                } else {
                  $scope.types[typeIndex].files = response.data.files;
                }
                Wait('stop');
              })
            } else {
              let path = '';
              if ($scope.breadCrumbs.join('.').indexOf('root.') === 0) {
                path = $scope.breadCrumbs.join('.').replace('root.','');
              } else {
                path = '*';
              }
              let branch = $scope.branch.replace('/', '.')
              $http({
                  method: 'GET',
                  url: `git/api/${$scope.env}/${branch}/files/${$scope.searchString || '*'}/${path}/pagi/?page_size=10`,
              }).then(function success(response) {
                  $scope.dataset = response.data;
                  $scope.url = `git/api/${$scope.env}/${branch}/files/${$scope.searchString || '*'}/${path}/pagi/`
                  $scope.files = response.data.files
                  $scope.directories = response.data.directories
                  Wait('stop')
              })
            }
        }

        $scope.handleSelectDir = (dir, typeIndex) => {
          if (dir.name !== 'root') {
            typeIndex === undefined ?
              $scope.directory = dir.name :
              $scope.types[typeIndex].path = $scope.types[typeIndex].path + '/' + dir.name
          } else {
            typeIndex === undefined ?
              $scope.directory = '' :
              $scope.types[typeIndex].path = '*'
          }
          typeIndex === undefined ?
            $scope.breadCrumbs.push($scope.directory) :
            $scope.types[typeIndex].breadCrumbs.push(dir.name);
          if (typeIndex !== undefined) {
            $scope.types[typeIndex].currentPage = 1;
          }
          $scope.getDataBranch(typeIndex)
        }

        $scope.selectFile = (file) => {
            $scope.selectedFile = file;
        }

        $scope.selectFileMult = (file) => {
          if ($scope.oneOfSelected(file)) {
            let position = 0;
            $scope.selectedFiles.forEach((item, index) => {
              if (item.file === file) {
                position = index
              }
            })
            $scope.selectedFiles.splice(position, 1)
          } else {
            if ($scope.breadCrumbs.length > 1) {
              $scope.typeSelected = $scope.breadCrumbs[$scope.breadCrumbs.length - 2]
            } else {
              $scope.typeSelected = $scope.breadCrumbs[$scope.breadCrumbs.length - 1]
            }
            $scope.selectedFiles.push({
              file,
              type: $scope.typeSelected,
              source: null
            })
          }
          console.log($scope.selectedFiles)
        }

        $scope.setAttachment = (files, e, typeIndex, attachIndex) => {
          $scope.fileObj = files[0];
          Wait("start");
          let r = Uploadfile.load(`/deploy/uphash/?hash=${$scope.typesHash}`, $scope.fileObj);
          r.then(
            function (r) {
              $rootScope.configFileName = JSON.parse(r.response);
              if (e) {
                $scope.types[typeIndex].attachments[attachIndex].attachment = $rootScope.configFileName.url.replace(`/media/${$scope.typesHash}/edited_xlsx/`,'');
              }
              $scope.errors = null;
              Wait("stop");
            },
            function (r) {
              // failure
              Wait("stop");
              console.warn(r);
            }
      );
        };

        $scope.filesUploaded = () => {
          let result = false;
          $scope.selectedFiles.forEach(item => {
            if (item.source) {
              result = true;
            } else {
              result = false;
            }
          })
          return result;
        }

        $scope.handleConvertExcel = (data, hash) => {
          Wait('start')
          $http({
            method: 'POST',
            url: `/deploy/saveconvert/?hash=${hash}`,
            data: data
          }).then(function success(response) {
            let branch = $scope.branch.replace('/', '.')
            $http({
              method: 'POST',
              url: '/deploy/convertdiff/',
              data: {
                reponame: $scope.env,
                branch: branch,
                hash: $scope.typesHash
              }
            }).then(function success(response) {
              Wait('stop');
              $scope.job = response.data;
              // $scope.job.id = 1405;
              let requestJob = () => {
                Wait('start')
                $http({
                  method: "GET",
                  url: `/diff/results/?job=${$scope.job.id}`
                }).then(function success(response) {
                  if (
                    response.data.status !== "successful" &&
                    response.data.status !== "failed"
                  ) {
                    setTimeout(() => requestJob(), 30 * 1000);
                  } else if (response.data.status === "failed") {
                    $scope.final = {
                      status: "failed",
                      job: $scope.job.id
                    };
                    Wait("stop");
                  } else {
                    $http({
                      method: "GET",
                      url: `/diff/final/?job=${$scope.job.id}&status=successful&page=3`//scope.job.id
                    }).then(function success(response) {
                      $scope.compareData = response.data.compare.results.find(
                        res => {
                          if (
                            res.task.indexOf("Try compare") >=
                              0 &&
                            !!res.event_data.res
                          ) {
                            return true;
                          }
                          return false;
                        }
                      );
                      let colRowArr = $scope.compareData.event_data.res.stdout_lines.map(item => {
                        return item.split('|')
                      })
                      let maxLength = Math.max.apply(null, colRowArr.map(col => col.length))
                      let arr = colRowArr.map((col, index) => {
                        if (col.length < maxLength) {
                          let temp = col;
                          let iterations = maxLength - col.length;
                          for (let k = 0; k < iterations; k++) {
                            temp.push('')
                          }
                          return temp
                        }
                        return col
                      })
                      $scope.final = arr;
                      Wait("stop");
                      $scope.showPopup = true;
                      $scope.showCompleted = false;
                    });
                  }
                }, () => {
                  Wait('stop')
                });
              };
              requestJob();
            })
          })
        }

        $scope.closePopup = () => {
          $scope.final = null;
          $scope.showPopup = false;
        }

        $scope.artVersionChange = (file, index) => {
          $scope.selectedFiles[index].artefact_version = $scope.artefact_version[index]
        }

        $scope.deployTargetChange = (file, index) => {
          $scope.selectedFiles[index].deploy_target = $scope.deploy_target[index]
        }

        $scope.oneOfSelected = (file) => {
          let result = $scope.selectedFiles.filter(item => {
            return item.file === file
          })
          if (result.length) {
            return true
          }
          return false
        }

        $scope.handleClickCrumb = (crumb, typeIndex) => {
          if (crumb === 'root') {
            $scope.directory = '';
          } else {
            $scope.directory = crumb;
          }
          let newCrumbs = [];
          if (typeIndex === undefined) {
            $scope.searchString = '';
            try {
              $scope.breadCrumbs.forEach((item, index) => {
                if (item === crumb) {
                  newCrumbs.push(item)
                  throw {}
                } else {
                  newCrumbs.push(item)
                }
              })
            } catch(e) {
              $scope.breadCrumbs = newCrumbs;
              $scope.getDataBranch()
            }
          } else {
            $scope.types[typeIndex].currentPage = 1;
            try {
              $scope.types[typeIndex].breadCrumbs.forEach((item, index) => {
                if (item === crumb) {
                  newCrumbs.push(item)
                  throw {}
                } else {
                  newCrumbs.push(item)
                }
                let crumbsPath = newCrumbs.join('/');
                crumbsPath = crumbsPath.replace('root/', '');
                if (crumbsPath.indexOf('root') >= 0) {
                  crumbsPath = crumbsPath.replace('root', '*');
                }
                $scope.types[typeIndex].path = crumbsPath;
                $scope.getDataBranch(typeIndex);
              })
            } catch(e) {
              let crumbsPath = newCrumbs.join('/');
              crumbsPath = crumbsPath.replace('root/', '');
              if (crumbsPath.indexOf('root') >= 0) {
                crumbsPath = crumbsPath.replace('root', '*');
              }
              $scope.types[typeIndex].breadCrumbs = newCrumbs;
              $scope.types[typeIndex].path = crumbsPath;
              $scope.getDataBranch(typeIndex)
            }
          }
        }

        $scope.handleConvert = () => {
          let hash = makeid(10)
          let data = {
            dsl: {},
            items: $scope.selectedFiles
          }
            Wait('start')
            $http({
              method: 'POST',
              url: `/deploy/saveconvert/?hash=${hash}`,
              data: data
            }).then((response) => {
              let branch = $scope.branch.replace('/', '.')
              let url = `diff/convert/?repo=${$scope.env.replace('.git', '')}&branch=${branch}&hash=${hash}`;
              Wait('start')
              $http({
                  method: 'POST',
                  url: url,
              })
              .then(function success(response) {
                  if (response.data.status === 'failed') {
                      $scope.final = { status: 'failed', job: response.data.job }
                  } else {
                      $scope.job = response.data.id;
                      let requestJob = () => {
                          $http({
                            method: "GET",
                            url: `/diff/results/?job=${$scope.job}`
                          }).then(function success(response) {
                            if (
                              response.data.status !== "successful" &&
                              response.data.status !== "failed"
                            ) {
                              setTimeout(() => requestJob(), 4 * 1000);
                            } else if (response.data.status === "failed") {
                              $scope.final = {
                                status: "failed",
                                job: $scope.job
                              };
                              Wait("stop");
                            } else {
                              $http({
                                method: "GET",
                                url: `/diff/cnvfinal/?job=${$scope.job}&status=successful`
                              }).then(function success(response) {
                                $http({
                                  method: 'GET',
                                  url: `/diff/download/?hash=${hash}&file=converted_xlsx.tar.gz`
                                }).then(function success(response) {
                                  console.log(response)
                                  var link = document.createElement("a");
                                  link.download = name;
                                  link.href = `/diff/download/?hash=${hash}&file=converted_xlsx.tar.gz`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  $scope.showPopup = true;
                                  $scope.showCompleted = true;
                                })
                                Wait("stop");
                              });
                            }
                          });
                        };
                        requestJob();
                  }
              })            
            })
        }

        $scope.allowShowDifference = () => {
          let flag = [];
          $scope.types.forEach(type => {
            if (!type.targets.length || !type.artefact_version) {
              flag.push(false);
            }
            if (type.attachments.length < 1) {
              flag.push(false);
            } else {
              type.attachments.forEach(attach => {
                Object.keys(attach).forEach(key => {
                  if (!attach[key] && key !== 'dropdown') {
                    flag.push(false)
                  }
                })
              })
            }
          })
          return !flag.includes(false);
        }

        $scope.handleSearch = () => {
          let path = '';
              if ($scope.breadCrumbs.join('.').indexOf('root.') === 0) {
                path = $scope.breadCrumbs.join('.').replace('root.','');
              } else {
                path = '*';
              }
              let branch = $scope.branch.replace('/', '.')
            $http({
                method: 'GET',
                url: `git/api/${$scope.env}/${branch}/files/${$scope.searchString || '*'}/${path}/pagi/?page_size=10`,
            }).then(function success(response) {
                $scope.files = response.data.files;
                $scope.url = `git/api/${$scope.env}/${branch}/files/${$scope.searchString || '*'}/${path}/pagi/`;
                $scope.dataset = response.data;
            })
        }

        $scope.searchChange = (typeIndex) => {
          let path = '';
              if ($scope.types[typeIndex].path.indexOf('*/') === 0) {
                path = $scope.types[typeIndex].path.replace('*/','');
              } else {
                path = $scope.types[typeIndex].path;
              }
          let branch = $scope.branch.replace('/', '.')
          $http({
            method: 'POST',
            url: `git/api/${$scope.env}/${branch}/files/${$scope.types[typeIndex].searchString || '*'}/?page_size=10`,
            data: {
              path
            }
        }).then(function success(response) {
          $scope.types[typeIndex].files = response.data.files;
          $scope.types[typeIndex].directories = response.data.directories;
        })
        }

        $scope.addType = () => {
          $scope.types.push({
            path: '*',
            files: $scope.files,
            breadCrumbs: ['root'],
            directories: $scope.directories,
            attachments: [{
              attachment: null,
              file: null,
              dropdown: false
            }],
            targets: [''],
            deploy_targets: [''],
            currentPage: 1
          })
          $scope.getDataBranch($scope.types.length - 1);
        }

        $scope.setAttachmentOn = (typeIndex, attachIndex, file) => {
          $scope.types[typeIndex].attachments[attachIndex].file = file;
          $scope.openDropdown(typeIndex, attachIndex);
        }

        $scope.addAttachmentRow = (typeIndex) => {
          $scope.types[typeIndex].attachments.push({
            attachment: null,
            file: null,
            dropdown: false
          })
        }

        $scope.addDeployTargetRow = (typeIndex) => {
          $scope.types[typeIndex].targets.push('');
        }

        $scope.pushNextPageFiles = (typeIndex, attachIndex) => {
          let currentPage = $scope.types[typeIndex].currentPage;
          currentPage += 1;
          $scope.types[typeIndex].currentPage = currentPage;
          $scope.getDataBranch(typeIndex);
        }

        $scope.openDropdown = (typeIndex, attachIndex) => {
          $scope.types[typeIndex].attachments[attachIndex].dropdown = !$scope.types[typeIndex].attachments[attachIndex].dropdown;
        }

        let buildData = () => {
          let data = {
            dsl: {
              name: $scope.dslName,
              appName: $scope.dslAppName,
              appVersion: $scope.dslAppVersion,
              techPlatform: $scope.dslTechPlatform,
              techPlatformVersion: $scope.dslTechPlatformVersion,
              version: $scope.dslVersion,
            },
            items: []
          };
          $scope.types.forEach(type => {
            data.dsl.type_specific_parameters = {
              [type.breadCrumbs[type.breadCrumbs.length - 2]]: {
                database: type.targets,
                artefactVersion: type.artefact_version
              }
            }
            type.attachments.forEach(item => {
              data.items.push({
                file: item.file,
                source: item.attachment.replace(`/media/${$scope.typesHash}/edited_xlsx/`, ''),
                type: type.breadCrumbs[type.breadCrumbs.length - 2]
              })
            })
          })
          return data;
        }

        $scope.getDifference = () => {
          Wait('start');
          let data = buildData();
          $scope.handleConvertExcel(data, $scope.typesHash);
        }

        const checkMainFields = () => {
          if (
            $scope.dslName &&
            $scope.dslVersion &&
            $scope.dslName &&
            $scope.dslAppName &&
            $scope.dslAppVersion &&
            $scope.dslTechPlatform &&
            $scope.dslTechPlatformVersion &&
            $scope.applied
          ) {
            return true;
          }
          return false;
        }

        $scope.confirmChanges = () => {
          $scope.applied = true;
          $scope.allowGetDSL = checkMainFields();
          $scope.closePopup();
        }

        $scope.confirmCompleted = () => {
          window.location.reload(true);
        }

        $scope.removeType = (typeIndex) => {
          $scope.types.splice(typeIndex, 1);
        }

        $scope.removeAttach = (typeIndex, attachIndex) => {
          $scope.types[typeIndex].attachments.splice(attachIndex, 1);
        }

        $scope.removeTarget = (typeIndex, targetIndex) => {
          $scope.types[typeIndex].targets.splice(targetIndex, 1);
          
        }

        $scope.removeSelectedFile = (index) => {
          $scope.selectedFiles.splice(index, 1);
        }

        $scope.getChangedDSL = () => {
          let data = buildData();
          Wait('start')
          $http({
            method: 'POST',
            url: `deploy/savedsl/?hash=${$scope.typesHash}`,
            data: data
          }).then((response) => {
            let branch = $scope.branch.split('/').join('.')
            $http({
              method: 'POST',
              url: `deploy/getdsl/?repo=${$scope.env}&branch=${branch}&hash=${$scope.typesHash}`,
              data: {
                reponame: $scope.env,
                branch: branch,
                hash: $scope.typesHash
              }
            })
            .then(function success(response) {
              if (response.data.status === 'failed') {
                $scope.final = { status: 'failed', job: response.data.job }
              } else {
                $scope.job = response.data.id;
                console.log($scope.job)
                let requestJob = () => {
                    $http({
                      method: "GET",
                      url: `/diff/results/?job=${$scope.job}`
                    }).then(function success(response) {
                      if (
                        response.data.status !== "successful" &&
                        response.data.status !== "failed"
                      ) {
                        setTimeout(() => requestJob(), 4 * 1000);
                      } else if (response.data.status === "failed") {
                        $scope.final = {
                          status: "failed",
                          job: $scope.job
                        };
                        Wait("stop");
                      } else {
                        $http({
                          method: "GET",
                          url: `/diff/getDSLfinal/?job=${$scope.job}&status=successful`
                        }).then(function success(response) {
                          $http({
                            method: 'GET',
                            url: `/diff/download/?hash=${$scope.typesHash}&file=${data.dsl.name}_jenkins.dsl`,
                          }).then(function success(response) {
                            var link = document.createElement("a");
                            link.download = name;
                            link.href = `/diff/download/?hash=${$scope.typesHash}&file=${data.dsl.name}_jenkins.dsl`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            $scope.showPopup = true;
                            $scope.showCompleted = true;
                          })
                          Wait("stop");
                        });
                      }
                    });
                  };
                  requestJob();
              }
            })
          })
        }

        $scope.handleTabClick = (tab) => {
          $scope.tab = tab;
        }

        $scope.getJSON = (data) => {
          return JSON.parse(data)
        }

        $scope.downloadArchive = (row) => {
          Wait('start')
          let hashDir = JSON.parse(row.extra_vars).hash_dir;
          $http({
            method: 'GET',
            url: `/diff/download/?hash=${hashDir}&file=converted_xlsx.tar.gz`
          }).then(function success(response) {
            var link = document.createElement("a");
            link.download = name;
            link.href = `/diff/download/?hash=${hashDir}&file=converted_xlsx.tar.gz`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            Wait("stop");
          })
        }

        $scope.showDifferenceButton = (row) => {
          let hashDir = JSON.parse(row.extra_vars).hash_dir;
          Wait('start')
          $http({
            method: "GET",
            url: `/diff/final/?job=${row.id}&status=successful&page=3`//scope.job.id
          }).then(function success(response) {
            $scope.compareData = response.data.compare.results.find(
              res => {
                if (
                  res.task.indexOf("Try compare") >=
                    0 &&
                  !!res.event_data.res
                ) {
                  return true;
                }
                return false;
              }
            );
            let colRowArr = $scope.compareData.event_data.res.stdout_lines.map(item => {
              return item.split('|')
            })
            let maxLength = Math.max.apply(null, colRowArr.map(col => col.length))
            let arr = colRowArr.map((col, index) => {
              if (col.length < maxLength) {
                let temp = col;
                let iterations = maxLength - col.length;
                for (let k = 0; k < iterations; k++) {
                  temp.push('')
                }
                return temp
              }
              return col
            })
            $scope.final = arr;
            Wait("stop");
            $scope.showPopup = true;
            $scope.showCompleted = false;
          });
        }

        $scope.handleDownloadDSLButton = (row) => {
          let hashDir = JSON.parse(row.extra_vars).hash_dir;
          console.log(hashDir)
          Wait('start');
          $http({
            method: 'GET',
            url: `diff/downloaddslarc/?hash=${hashDir}`
          }).then(function success(response) {
            console.log(response.data);
            $http({
              method: 'GET',
              url: `/diff/download/?hash=${hashDir}&file=archive.zip`
            }).then(function success(response) {
              var link = document.createElement("a");
              link.download = name;
              link.href = `/diff/download/?hash=${hashDir}&file=archive.zip`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              Wait("stop");
            })
          })
        }
    }
]