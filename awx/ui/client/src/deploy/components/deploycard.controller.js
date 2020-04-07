export default function($rootScope, $scope, $element, Wait, $http) {
  this.index = null;
  this.allowRun = null;
  $scope.domainsList = ["ulbs11_sales_domain", "ulbs13_sales_domain"];
  $scope.status = "start";
  this.$onInit = function() {
    // Init from history if exists
    $scope.index = this.index;
    $scope.allowRun = this.allowrun;
    if ($rootScope.isConfigUploaded.length) {
      $scope.domain = $rootScope.isConfigUploaded[this.index].domain;
      $scope.status = $rootScope.isConfigUploaded[this.index].status;
      if (
        $rootScope.isConfigUploaded.length > $scope.domainsList.length && this.allowRun
      ) {
        $rootScope.isConfigUploaded.pop();
      }
      if (this.index > 0) {
        $scope.parentIndex = $rootScope.isConfigUploaded[this.index - 1].id;
      }
    }
  };

  $scope.setDomain = () => {
    console.log("fired", $scope.domain, $scope.index);
    $rootScope.isConfigUploaded[$scope.index].domain = $scope.domain;
  };

  $scope.handleDeleteCard = () => {
    $rootScope.isConfigUploaded.splice($scope.index, 1);
  }

  $scope.deployConfig = index => {
    $scope.final = null;
    // Wait("start");
    $http({
      method: "GET",
      url: `/deploy/launch/?inventory=${
        $scope.domain
      }&file=${$rootScope.configFileName ? $rootScope.configFileName.url.replace("/media/", "") : $rootScope.isConfigUploaded[this.index - 1].config}&domain=${
        $scope.domain
      }&prevstep=${$scope.parentIndex || null}`
    }).then(function success(response) {
      if (response.data.status === "failed") {
        $scope.final = { status: "failed", job: response.data.job.job };
        $scope.recordId = response.data.prevStep;
      } else {
        $scope.job = response.data.job;
        $scope.recordId = response.data.prevStep;
        let requestJob = () => {
          $http({
            method: "GET",
            url: `/diff/results/?job=${$scope.job.id}`
          }).then(function success(response) {
            if (
              response.data.status !== "successful" &&
              response.data.status !== "failed"
            ) {
              $scope.status = "pending";
              setTimeout(() => requestJob(), 30 * 1000);
            } else if (response.data.status === "failed") {
              if (
                $rootScope.isConfigUploaded.length < $scope.domainsList.length
              ) {
                $rootScope.isConfigUploaded.push({
                  description: "",
                  status: "start",
                  config: null,
                  domain: null,
                  prev_step_id: $scope.parentIndex
                });
              }
              $scope.status = "failed";
              $scope.final = {
                status: "failed",
                job: $scope.job.id
              };
              $rootScope.isConfigUploaded[$scope.index].id = $scope.recordId;
              Wait("stop");
            } else {
              if (
                $rootScope.isConfigUploaded.length < $scope.domainsList.length
              ) {
                $rootScope.isConfigUploaded.push({
                  description: "",
                  status: "start",
                  config: null,
                  domain: null,
                  prev_step_id: $scope.parentIndex
                });
              }
              $scope.status = "successful";
              $scope.final = {
                status: "success",
                job: $scope.job.id
              };
              $rootScope.currentStep = response.data.prevStep;
              Wait("stop");
            }
          });
        };
        requestJob();
      }
    });
  };
}
