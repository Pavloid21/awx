export default function($rootScope, $scope, $element, Wait, $http) {
  this.index = null;
  this.allowRun = null;
  this.allowDelete = null;
  $scope.domainsList = [];
  $scope.isDisabledFields = $rootScope.fieldsDisabled;
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
  Wait('start')
  $http({
    method: 'GET',
    url: '/api/v2/inventories/'
  }).then(invResponse => {
    $scope.inventories = invResponse.data.results;
    $http({
      method: 'GET',
      url: '/git/api/repos/'
    }).then((response) => {
      $scope.domainsList = [];
      $scope.inventories.forEach(inv => {
        if (inv.description) {
          $scope.domainsList.push(inv.name)
        }
      });
    })
  })
  $http({
    method: 'GET',
    url: '/api/v2/action/?order_by=-created'
  }).then(function success(response) {
    $scope.actionsList = response.data.results
    Wait('stop')
  })
  $scope.status = "start";
  this.$onInit = function() {
    // Init from history if exists
    if (this.index > 0) {
      if ($rootScope.isConfigUploaded[this.index - 1].status !== 'start' &&
          $rootScope.isConfigUploaded[this.index - 1].status !== 'pending') {
            $scope.prevStepNotComplited = false;
          } else {
            $scope.prevStepNotComplited = true;
          }
    } else {
      $scope.prevStepNotComplited = false;
    }
    $scope.index = this.index;
    $scope.allowRun = this.allowrun;
    $scope.allowDelete = this.allowdelete;
    $scope.isDisabledFields = $rootScope.fieldsDisabled;
    if ($rootScope.isConfigUploaded.length) {
      $scope.domain = $rootScope.isConfigUploaded[this.index].domain;
      $scope.action = $rootScope.isConfigUploaded[this.index].action[0];
      $scope.status = $rootScope.isConfigUploaded[this.index].status;
      $scope.ispicker = $rootScope.isConfigUploaded[this.index].picker;
      $scope.isdeployer = $rootScope.isConfigUploaded[this.index].setuper;
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
    $rootScope.isConfigUploaded[$scope.index].domain = $scope.domain;
  };

  $scope.setAction = () => {
    $rootScope.isConfigUploaded[$scope.index].action = [$scope.action];
  };

  $scope.setPicker = () => {
    $rootScope.isConfigUploaded[$scope.index].picker = $scope.ispicker;
  }

  $scope.setDeployer = () => {
    $rootScope.isConfigUploaded[$scope.index].setuper = $scope.isdeployer;
  }

  $scope.handleDeleteCard = () => {
    $rootScope.isConfigUploaded.splice($scope.index, 1);
  }

  $scope.deployConfig = index => {
    $scope.final = null;
    let action = null;
    $http({
      method: 'GET',
      url: '/api/v2/inventories/'
    }).then(response => {
      let inventories = response.data;
      $http({
        method: 'GET',
        url: `/api/v2/action/${$scope.action}/`
      }).then(response => {
        inventories.results.forEach(inventory => {
          if (inventory.name === $scope.domain) {
            action = response.data;
            let extraVars = JSON.parse(action.extra_vars);
            $http({
              method: 'POST',
              url: `/api/v2/job_templates/${action.job_templates[0]}/launch/`,
              data: {
                extra_vars: extraVars,
                inventory: inventory.id
              }
            })
            .then(launchResponse => {
              $scope.job = launchResponse.data.job;
              $http({
                method: 'POST',
                url: '/api/v2/deploy_history/',
                data: {
                  status: 'pending',
                  name: makeid(10),
                  description: '',
                  domain: $scope.domain,
                  action: [action.id],
                  prev_step_id: $scope.parentIndex || null
                }
              })
              .then(resp => {
                $scope.recordId = resp.data.id;
                let requestJob = () => {
                  $http({
                    method: "GET",
                    url: `/api/v2/jobs/${$scope.job}/`
                  }).then((response) => {
                    if (
                      response.data.status !== "successful" &&
                      response.data.status !== "failed"
                    ) {
                      $scope.status = "pending";
                      setTimeout(() => requestJob(), 10 * 1000);
                    } else if (response.data.status === "failed") {
                      $scope.status = "failed";
                      $scope.final = {
                        status: "failed",
                        job: $scope.job.id
                      };
                      $rootScope.isConfigUploaded[$scope.index].status = "failed";
                      delete $rootScope.isConfigUploaded[$scope.index].name;
                      $http({
                        method: 'PATCH',
                        url: `/api/v2/deploy_history/${$scope.recordId}/`,
                        data: $rootScope.isConfigUploaded[$scope.index]
                      })
                      Wait("stop");
                    } else {
                      $scope.status = "successful";
                      $rootScope.isConfigUploaded[$scope.index].status = "successful";
                      $scope.final = {
                        status: "success",
                        job: $scope.job
                      };
                      $rootScope.currentStep = response.data.prevStep;
                      if ($scope.ispicker) {
                        let deployerAction = $scope.actionsList.filter((action, index) => {
                          if (action.isdeployer) {
                            return true
                          }
                        });
                        let extraVars = JSON.parse(deployerAction[0].extra_vars).deploy_file = `${$scope.job.id}.dp`;
                        $http({
                          method: 'PATCH',
                          url: `/api/v2/action/${deployerAction[0].id}/`,
                          data: {
                            description: '',
                            name: deployerAction[0].name,
                            extra_vars: JSON.stringify(extraVars),
                            job_templates: deployerAction[0].job_templates
                          }
                        })
                      } else if ($scope.isdeployer) {

                      }
                      Wait("stop");
                    }
                  });
                };
                requestJob();
              })

            })
          }
        })
      })
    })
  };
}
