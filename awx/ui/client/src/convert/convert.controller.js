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
            alert($scope.selectedFile);
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