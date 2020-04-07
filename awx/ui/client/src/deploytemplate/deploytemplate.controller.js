'use strict'

export default [
    "$rootScope",
    "$scope",
    "$location",
    "ConfigService",
    "Dataset",
    "$http",
    "Wait",
    "Uploader",
    (
      $rootScope,
      $scope,
      $location,
      ConfigService,
      Dataset,
      $http,
      Wait,
      Uploader
    ) => {
      $scope.displayView = 'templates';
      $scope.isAllowRun = false;
      $scope.lineNumbers = [];
      $rootScope.isConfigUploaded = [];
      $scope.errors = null;
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
          let tArea = document.getElementById("listing_data");
          let numBlock = document.getElementById("nums_data");
          tArea.addEventListener("scroll", event => {
            numBlock.scrollTop = tArea.scrollTop;
          });
        };
  
        reader.onerror = event => {
          alert(event.target.error.name);
        };
  
        reader.readAsText(file);
      };
      $scope.templatesClick = () => {
        $scope.displayView = 'templates'
      }
      $scope.pipelineClick = () => {
        $scope.displayView = 'pipeline'
      }
      $scope.historyClick = () => {
        $scope.displayView = 'history'
      }

      $scope.storedTemplates = Dataset.data.results;
      $rootScope.isConfigUploaded = [];
      $scope.cards = [];

      $scope.handleAddTemplate = () => {
        $scope.isAdding = true;
        $rootScope.isConfigUploaded.push({
          description: "",
          status: "start",
          config: null,
          domain: null,
          name: null,
          prev_step_id: $scope.parentIndex
        })
      }

      $scope.setConfig = files => {
        $scope.fileObj = files[0];
        handleFiles(files[0]);
      }

      $scope.templateNameInputChange = () => {
        $scope.errors = null;
        console.log($scope.templateName)
      }

      $scope.handleCancel = () => {
        $scope.isAdding = false;
        $scope.cards = [];
        $rootScope.isConfigUploaded = [];
        $scope.templateName = null;
        $scope.config = null;
        $scope.errors = null;
      }

      $scope.handleAddCard = () => {
        $rootScope.isConfigUploaded.push({
          description: "",
          status: "start",
          config: null,
          name: null,
          domain: null,
          prev_step_id: $scope.parentIndex
        })
      }

      // const createDeployItem = (item) => {
      //   $http.post('/deploytemplate/', item)
      // }

      $scope.handleSave = () => {
        // console.log('file', $rootScope.configFileName)
        // console.log('name', $scope.templateName)
        console.log('root', $rootScope.isConfigUploaded)
        if (!$scope.templateName || $scope.templateName === '') {
          $scope.errors = {
            details: 'Template name not specified.'
          }
          return;
        } else if (!$rootScope.configFileName) {
          $scope.errors = {
            details: 'Configuration file not specified.'
          }
          return;
        } else if ($scope.isConfigUploaded.length > 0) {
          let notValidCard = [];
          $scope.isConfigUploaded.forEach((item, index) => {
            if (!item.domain) {
              notValidCard.push({index})
            }
          });
          if (notValidCard.length) {
            $scope.errors = {
              details: `Domain not specified on step ${notValidCard[0].index + 1}`
            }
          } else {
            Wait('start');
            let tempArr = $rootScope.isConfigUploaded.map(item => {
              item.config = $rootScope.configFileName.url.replace('/media/', '');
              item.name = Math.random().toString(36).substring(7);
              return item;
            });
            $rootScope.isConfigUploaded = tempArr;
            console.log('message', $rootScope.isConfigUploaded)
            $http({
              method: 'POST',
              url:'/deploytemplate/save/', 
              data: {
                list: $rootScope.isConfigUploaded,
                name: $scope.templateName,
                config: $rootScope.configFileName.url.replace('/media/', '')
              }
            }).then(
              function success() {
                Wait('stop')
              },
              function error() {
                alert('Somethinng went wrong.');
                Wait('stop')
              }
            )
          }
        }
      }

      $scope.uploadConfig = () => {
        Wait("start");
        let r = Uploader.upload("/deploy/uploads/", $scope.fileObj);
        r.then(
          function(r) {
            // success
            $scope.showPopup = false;
            $rootScope.configFileName = JSON.parse(r.response)
            $scope.errors = null;
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
    }
]