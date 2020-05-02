export default [
    "$rootScope",
    "$scope",
    "$location",
    "ConfigService",
    "Dataset",
    "lastPath",
    "$http",
    "Wait",
    ($rootScope, $scope, $location, ConfigService, Dataset, lastPath, $http, Wait) => {
        $scope.displayView = 'sql2excel'
        $scope.searchString = ''
        const re = /(?:\.([^.]+))?$/;
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
            $scope.getDataBranch();
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

        $scope.getDataBranch = () => {
            Wait('start');
            $http({
                method: 'GET',
                url: `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/`
            }).then(function success(response) {
                $scope.dataset = response.data;
                $scope.url = `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/`
                $scope.files = response.data.files
                Wait('stop')
            })
        }

        $scope.selectFile = (file) => {
            $scope.selectedFile = file;
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
                url: `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/`
            }).then(function success(response) {
                $scope.files = response.data.files;
                $scope.url = `git/api/${$scope.env}/${$scope.branch}/files/${$scope.searchString || '*'}/`;
                $scope.dataset = response.data;
            })
        }
    }
]