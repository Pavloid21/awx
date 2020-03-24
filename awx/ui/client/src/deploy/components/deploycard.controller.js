export default ($rootScope, $scope, $element, Wait, $http) => {
  $scope.domainsList = ["ulbs11_sales_domain", "ulbs13_sales_domain"];
  console.log($scope.step)
  $scope.stepNumber = $element.attr('step')

  $scope.setDomain = () => {
    console.log("fired", $scope.domain);
  };

  $scope.deployConfig = () => {
    $scope.final = null;
    Wait("start");
    $http({
      method: "GET",
      url: `/deploy/launch/?inventory=${
        $scope.domain
      }&file=${$rootScope.configFileName.url.replace("/media/", "")}`
    }).then(function success(response) {
      if (response.data.status === "failed") {
        $scope.final = { status: "failed", job: response.data.job };
      } else {
        $scope.job = response.data;
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
              if ($rootScope.isConfigUploaded.length < $scope.domainsList.length) {
                $rootScope.isConfigUploaded.push(1)
              }
              $scope.final = {
                status: "failed",
                job: $scope.job.id
              };
              Wait("stop");
            } else {
              if ($rootScope.isConfigUploaded.length < $scope.domainsList.length) {
                $rootScope.isConfigUploaded.push(1)
              }
              $scope.final = {
                status: "success",
                job: $scope.job.id
              };
              Wait("stop");
            }
          });
        };
        requestJob();
      }
    });
  };
};
