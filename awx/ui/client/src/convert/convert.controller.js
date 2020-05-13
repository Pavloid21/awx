export default [
    "$rootScope",
    "$scope",
    "$location",
    "ConfigService",
    "Dataset",
    "Uploadfile",
    "lastPath",
    "$http",
    "Wait",
    ($rootScope, $scope, $location, ConfigService, Dataset, Uploadfile, lastPath, $http, Wait) => {
        $scope.displayView = 'sql2excel'
        $scope.searchString = ''
        $scope.directory = ''
        $scope.breadCrumbs = ['root']
        $scope.selectedFiles = [];
        $scope.types = [];
        $scope.allowGetDSL = false;
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
        Wait('start');
        $http({
          method: 'GET',
          url: '/git/api/clone/'
        }).then(function success(response) {
          Wait('stop');
        })
        $scope.$on("updateDataset", (e, dataset, queryset) => {
            $scope.dataset = dataset;
            $scope.files = dataset.files
          });

        $scope.switchView = (view) => {
            $scope.displayView = view;
        }

        $scope.getDataEnv = () => {
          console.log($scope.env)
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
              $http({
                method: 'POST',
                url: `git/api/${$scope.env}/${$scope.branch}/files/${$scope.types[typeIndex].searchString || '*'}/?page_size=10&page=${$scope.types[typeIndex].currentPage}`,
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
              $http({
                  method: 'GET',
                  url: `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/${$scope.directory || '*'}/pagi/?page_size=10`
              }).then(function success(response) {
                  $scope.dataset = response.data;
                  $scope.url = `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/${$scope.directory || '*'}/pagi/`
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
          console.log(typeIndex !== undefined)
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
            $scope.selectedFiles.push({
              file,
              type: $scope.directory
            })
          }
        }

        $scope.setAttachment = (files, e, typeIndex, attachIndex) => {
          $scope.fileObj = files[0];
          Wait("start");
          let r = Uploadfile.load(`/deploy/uphash/?hash=${$scope.typesHash}`, $scope.fileObj);
          r.then(
            function (r) {
              $rootScope.configFileName = JSON.parse(r.response);
              if (e) {
                $scope.types[typeIndex].attachments[attachIndex].attachment = $rootScope.configFileName.url;
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
          $http({
            method: 'POST',
            url: `/deploy/saveconvert/?hash=${hash}`,
            data: { dsl: data }
          }).then(function success(response) {
            Wait('stop');
            $http({
              method: 'POST',
              url: '/deploy/convertdiff/',
              data: {
                reponame: $scope.env,
                branch: $scope.branch,
                hash: $scope.hash
              }
            }).then(function success(response) {
              Wait('stop');
              $scope.job = response.data;
              // $scope.job.id = 1405;
              let requestJob = () => {
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
                      $scope.final = $scope.compareData.event_data.res.stdout_lines;
                      console.log($scope.final)
                      Wait("stop");
                      $scope.showPopup = true;
                    });
                  }
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
            let url = `diff/convert/?repo=${$scope.env.replace('.git', '')}&branch=${$scope.branch}&file=${$scope.selectedFile}`;
            Wait('start')
            $http({
                method: 'GET',
                url: url,
                timeout: 30 * 1000
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
                              url: `/diff/cnvfinal/?job=${$scope.job}&status=successful`
                            }).then(function success(response) {
                              $scope.convertData = response.data.compare.results.find(
                                res => {
                                  if (res && res.event_data && res.event_data.res && res.event_data.res.stdout_lines) {
                                    $scope.final = res.event_data.res.stdout_lines[0];
                                  }
                                }
                              );
                              console.log($scope.final)
                              $http({
                                method: 'GET',
                                url: `/diff/download/?file=${$scope.final}`
                              }).then(function success(response) {
                                console.log(response)
                                var link = document.createElement("a");
                                link.download = name;
                                link.href = `/diff/download/?file=${$scope.final}`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              })
                              Wait("stop");
                            });
                          }
                        });
                      };
                      requestJob();
                }
            })            
        }

        $scope.handleSearch = () => {
            $http({
                method: 'GET',
                url: `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/${$scope.directory || '*'}/pagi/?page_size=10`
            }).then(function success(response) {
                $scope.files = response.data.files;
                $scope.url = `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/${$scope.directory || '*'}/pagi/`;
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
          $http({
            method: 'POST',
            url: `git/api/${$scope.env}/${$scope.branch}/files/${$scope.types[typeIndex].searchString || '*'}/?page_size=10`,
            data: {
              path
            }
        }).then(function success(response) {
          $scope.types[typeIndex].files = response.data.files;
          $scope.types[typeIndex].directories = response.data.directories;
        })
        }

        $scope.addType = () => {
          if (!$scope.types.length) {
            $scope.typesHash = makeid(10);
          }
          $scope.getDataBranch()
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
            targets: [],
            deploy_targets: [''],
            currentPage: 1
          })
        }

        $scope.setAttachmentOn = (typeIndex, attachIndex, file) => {
          $scope.types[typeIndex].attachments[attachIndex].file = file;
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

        $scope.getDifference = () => {
          Wait('start');
          let data = {
            name: $scope.dslName,
            appName: $scope.dslAppName,
            appVersion: $scope.dslAppVersion,
            techPlatform: $scope.dslTechPlatform,
            techPlatformVersion: $scope.dslTechPlatformVersion,
            version: $scope.dslVersion,
            items: []
          };
          $scope.types.forEach(type => {
            data.type_specific_parameters = {
              [type.breadCrumbs[type.breadCrumbs.length - 2]]: {
                database: type.targets,
                artefactVersion: type.artefact_version
              }
            }
            type.attachments.forEach(item => {
              data.items.push({
                file: item.file,
                source: item.attachment,
                type: type.breadCrumbs[type.breadCrumbs.length - 2]
              })
            })
          })
          $scope.handleConvertExcel(data, $scope.hash);
          console.log(data)
        }

        $scope.confirmChanges = () => {
          $scope.allowGetDSL = true;
          $scope.closePopup();
        }

        $scope.getChangedDSL = () => {

        }
    }
]