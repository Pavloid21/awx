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
        const re = /(?:\.([^.]+))?$/;
        Wait('start')
        $http({
            method: 'GET',
            url: 'diff/environments/'
        }).then(function success(response) {
            $scope.environments = response.data.versions;
            Wait('stop')
        })

        $scope.switchView = (view) => {
            $scope.displayView = view;
            $scope.getDataBranch();
        }

        $scope.getDataEnv = () => {
            Wait('start');
            $http({
                method: 'GET',
                url: `diff/branches/?env=${$scope.env}`
            }).then(function success(response) {
                $scope.branches = response.data.branches;
                Wait('stop')
            })
        }

        $scope.getDataBranch = () => {
            Wait('start');
            $http({
                method: 'GET',
                url: `diff/files/?env=${$scope.env}&ref=${$scope.branch}`
            }).then(function success(response) {
                $scope.files = response.data.files.filter(item => {
                    if (item.type === 'blob') {
                        if (re.exec(item.name)[1] === 'sql' && $scope.displayView === 'sql2excel') {
                            return true
                        } else if (re.exec(item.name)[1] === 'xls' || re.exec(item.name)[1] === 'xlsx' && $scope.displayView === 'excel2sql') {
                            return true
                        }
                    }
                });
                Wait('stop')
            })
        }

        $scope.selectFile = (file) => {
            $scope.selectedFile = file;
        }

        $scope.handleConvert = () => {
            alert($scope.selectedFile.name);
        }
    }
]