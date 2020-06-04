export default function($rootScope, $scope, $element, Wait, $http) {
  this.index = null;
  this.allowRun = null;
  this.allowDelete = null;
  $scope.domainsList = [];
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
    console.log($rootScope.isConfigUploaded[$scope.index].picker, $scope.ispicker)
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
    let fileName = $rootScope.configFileName ?
      $rootScope.configFileName.url.replace("/media/", "") :
      $rootScope.isConfigUploaded[this.index - 1].config;
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
            extraVars.deploy_file = fileName;
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
                  config: fileName,
                  domain: $scope.domain,
                  action: [action.id],
                  prev_step_id: $scope.parentIndex || null
                }
              })
              .then(resp => {
                let requestJob = () => {
                  $http({
                    method: "GET",
                    url: `/api/v2/jobs/${$scope.job}/`
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
                        job: $scope.job
                      };
                      $rootScope.currentStep = response.data.prevStep;
                      if ($scope.ispicker) {
                        let deployerAction = $scope.actionsList.filter((action, index) => {
                          if (action.isdeployer) {
                            return true
                          }
                        });
                        let extraVars = JSON.parse(deployerAction[0].extra_vars).awx_jobid = $scope.job.id;
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
    // Wait("start");
    // $http({
    //   method: "GET",
    //   url: `/deploy/launch/?inventory=${
    //     $scope.domain
    //   }&file=${$rootScope.configFileName ? $rootScope.configFileName.url.replace("/media/", "") : $rootScope.isConfigUploaded[this.index - 1].config}&domain=${
    //     $scope.domain
    //   }&prevstep=${$scope.parentIndex || null}&action=${$scope.action}`
    // }).then(function success(response) {
    //   if (response.data.status === "failed") {
    //     $scope.final = { status: "failed", job: response.data.job.job };
    //     $scope.recordId = response.data.prevStep;
    //   } else {
    //     $scope.job = response.data.job;
    //     $scope.recordId = response.data.prevStep;
    //     let requestJob = () => {
    //       $http({
    //         method: "GET",
    //         url: `/diff/results/?job=${$scope.job.id}`
    //       }).then(function success(response) {
    //         if (
    //           response.data.status !== "successful" &&
    //           response.data.status !== "failed"
    //         ) {
    //           $scope.status = "pending";
    //           setTimeout(() => requestJob(), 30 * 1000);
    //         } else if (response.data.status === "failed") {
    //           if (
    //             $rootScope.isConfigUploaded.length < $scope.domainsList.length
    //           ) {
    //             $rootScope.isConfigUploaded.push({
    //               description: "",
    //               status: "start",
    //               config: null,
    //               domain: null,
    //               prev_step_id: $scope.parentIndex
    //             });
    //           }
    //           $scope.status = "failed";
    //           $scope.final = {
    //             status: "failed",
    //             job: $scope.job.id
    //           };
    //           $rootScope.isConfigUploaded[$scope.index].id = $scope.recordId;
    //           Wait("stop");
    //         } else {
    //           if (
    //             $rootScope.isConfigUploaded.length < $scope.domainsList.length
    //           ) {
    //             $rootScope.isConfigUploaded.push({
    //               description: "",
    //               status: "start",
    //               config: null,
    //               domain: null,
    //               prev_step_id: $scope.parentIndex
    //             });
    //           }
    //           $scope.status = "successful";
    //           $scope.final = {
    //             status: "success",
    //             job: $scope.job.id
    //           };
    //           $rootScope.currentStep = response.data.prevStep;
    //           Wait("stop");
    //         }
    //       });
    //     };
    //     requestJob();
    //   }
    // });
  };
}
