export default [
    "$rootScope",
    "$scope",
    "$location",
    "ConfigService",
    "Dataset",
    "Uploader",
    "lastPath",
    "$http",
    "Wait",
    ($rootScope, $scope, $location, ConfigService, Dataset, Uploader, lastPath, $http, Wait) => {
        $scope.displayView = 'sql2excel'
        $scope.searchString = ''
        $scope.directory = ''
        $scope.breadCrumbs = ['root']
        $scope.selectedFiles = []
        Wait('start')
        $http({
            method: 'GET',
            url: '/git/api/repos/'
        }).then(function success(response) {
            $scope.environments = response.data.repositories;
            Wait('stop')
        }).catch( reason => {
            console.log(reason)
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

        $scope.getDataBranch = () => {
            Wait('start');
            $http({
                method: 'GET',
                url: `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/${$scope.directory || '*'}/?page_size=10`
            }).then(function success(response) {
                $scope.dataset = response.data;
                $scope.url = `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/${$scope.directory || '*'}/`
                $scope.files = response.data.files
                $scope.directories = response.data.directories
                Wait('stop')
            })
        }

        $scope.handleSelectDir = (dir) => {
          console.log('DIR', dir, $scope.directory)
          if (dir.name !== 'root') {
            $scope.directory = dir.name;
          } else {
            $scope.directory = '';
          }
          $scope.breadCrumbs.push($scope.directory)
          console.log($scope.breadCrumbs)
          $scope.getDataBranch()
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

        $scope.setAttachment = (files, e) => {
          // console.log('test', e.getAttr)
          $scope.fileObj = files[0];
          Wait("start");
          let r = Uploader.upload("/deploy/uploads/", $scope.fileObj);
          r.then(
            function (r) {
              // success
              // $scope.showPopup = false;
              $rootScope.configFileName = JSON.parse(r.response);
              if (e) {
                let position = 0;
                $scope.selectedFiles.forEach((item, index) => {
                  if (item.file === e.getAttribute('name')) {
                    position = index
                  }
                })
                $scope.selectedFiles[position].source = $rootScope.configFileName.url
              }
              $scope.errors = null;
              console.log($scope.selectedFiles)
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

        $scope.handleConvertExcel = () => {
          $http({
            method: 'POST',
            url: '/deploy/saveconvert/',
            data: { items: $scope.selectedFiles }
          })
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

        $scope.handleClickCrumb = (crumb) => {
          if (crumb === 'root') {
            $scope.directory = '';
          } else {
            $scope.directory = crumb;
          }
          let newCrumbs = [];
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
                url: `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/${$scope.directory || '*'}/?page_size=10`
            }).then(function success(response) {
                $scope.files = response.data.files;
                $scope.url = `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/${$scope.directory || '*'}/`;
                $scope.dataset = response.data;
            })
        }
    }
]