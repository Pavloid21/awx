export default [
  "$rootScope",
  "$scope",
  "$location",
  "ConfigService",
  "lastPath",
  "$http",
  "Wait",
  "Uploader",
  (
    $rootScope,
    $scope,
    $location,
    ConfigService,
    lastPath,
    $http,
    Wait,
    Uploader
  ) => {
    $scope.fileText = "";
    $scope.lineNumbers = [];
    $rootScope.isConfigUploaded = [];
    $scope.displayView = 'history';
    $scope.deployHistoryRows = [];

    let handleFiles = file => {
      const reader = new FileReader();
      reader.onload = event => {
        const file = event.target.result;
        const allLines = file.split(/\r\n|\n/);
        allLines.forEach((line, index) => {
          $scope.fileText += `${line}\n`;
          $scope.lineNumbers.push(index + 1);
        });
        $scope.showPopup = true;
        let tArea = document.getElementById("listing");
        let numBlock = document.getElementById("nums");
        tArea.addEventListener("scroll", event => {
          numBlock.scrollTop = tArea.scrollTop;
        });
      };

      reader.onerror = event => {
        alert(event.target.error.name);
      };

      reader.readAsText(file);
    };
    Wait('start')
    let getDeployHistory = () => {
      $http({
        method: 'GET',
        url: '/deploy/rows/'
      }).then(
        function success(response) {
          $scope.deployHistoryRows = response.data.results.filter((value, index, array) => {
            if (!value.prev_step_id) {
              return value
            }
          });
          Wait('stop');
        },

        function error(response) {
          console.warn(response)
          Wait('stop')
        }
      )
    }
    getDeployHistory();

    $scope.setConfig = files => {
      $scope.fileObj = files[0];
      handleFiles(files[0]);
    };

    $scope.uploadConfig = () => {
      Wait("start");
      let r = Uploader.upload("/deploy/uploads/", $scope.fileObj);
      r.then(
        function(r) {
          // success
          $scope.showPopup = false;
          $rootScope.isConfigUploaded.push({
              description: "",
              status: "start",
              config: null,
              domain: null,
              prev_step_id: null
          });
          $rootScope.configFileName = JSON.parse(r.response)
          Wait("stop");
        },
        function(r) {
          // failure
          Wait("stop");
          console.warn(r);
        }
      );
    };

    $scope.closePopup = () => {
      $scope.fileText = "";
      $scope.lineNumbers.length = 0;
      $scope.showPopup = false;
    };

    $scope.historyClick = () => {
      $scope.displayView = 'history';
      getDeployHistory();
    }

    $scope.pipelineClick = () => {
      $scope.displayView = 'pipeline';
      $rootScope.isConfigUploaded = [];
    }

    $scope.historyRowClick = (item) => {
      $scope.displayView = 'pipeline';
      $rootScope.isConfigUploaded = [];
      $rootScope.isConfigUploaded.push(item);
      console.log(item)
      let getNextStep = (prevStepId) => {
        $http({
          method: 'GET',
          url: `/deploy/next_step/?id=${prevStepId}`
        }).then(
          function success(response) {
            if (response.data.results.length) {
              $rootScope.isConfigUploaded.push(response.data.results[0]);
              getNextStep(response.data.results[0].id);
            }
            Wait('stop');
          },
  
          function error(response) {
            console.warn(response)
            Wait('stop')
          }
        )
      }
      getNextStep(item.id)
    }
  }
];
