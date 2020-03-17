export default [
    "$rootScope",
    "$scope",
    "$location",
    "ConfigService",
    "lastPath",
    "$http",
    "Wait",
    "Uploader",
    ($rootScope, $scope, $location, ConfigService, lastPath, $http, Wait, Uploader) => {

        $scope.setDomain = () => {
            console.log('fired', $scope.domain);
        }

        $scope.setConfig = (files) => {
            console.log(files[0])
            var r = Uploader.upload('/deploy/uploads/', files[0]);
            r.then(
                function(r) {
                // success
                $scope.showPopup = true;
                },
                function(r) {
                // failure
                console.warn(r)
                });
        }

        $scope.closePopup = () => {
            $scope.showPopup = false;
        }
    }
];