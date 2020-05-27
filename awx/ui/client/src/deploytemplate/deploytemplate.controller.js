"use strict";
import JSONEditor from 'jsoneditor';

export default [
  "$rootScope",
  "$scope",
  "$location",
  "ConfigService",
  "Dataset",
  "History",
  "Actions",
  "$http",
  "Wait",
  "Uploader",
  (
    $rootScope,
    $scope,
    $location,
    ConfigService,
    Dataset,
    History,
    Action,
    $http,
    Wait,
    Uploader
  ) => {
    $scope.displayView = "templates";
    $scope.isAllowRun = false;
    $scope.isAllowDelete = true;
    $scope.lineNumbers = [];
    $rootScope.isConfigUploaded = [];
    $scope.dataset = Dataset.data;
    $scope.history = History.data;
    $scope.actionsDataset = Action.data;
    $scope.errors = null;
    $scope.selected = {};
    $scope.$on("updateDataset", (e, dataset, queryset) => {
      if(e.targetScope.basePath.indexOf('deploy_template') > 0) {
        $scope.dataset = dataset;
        $scope.storedTemplates = dataset.results;
      } else if (e.targetScope.basePath.indexOf('deploy_history') > 0) {
        $scope.history = dataset;
        $scope.deployHistoryRows = dataset.results;
      } else {
        $scope.actions = dataset;
        $scope.deployActionRows = dataset.results;
      }
    });

    // JSON EDITOR INIT https://github.com/josdejong/jsoneditor
    const container = document.getElementById("jsoneditor")
    const options = {
      search: false,
      mode: 'code',
      onChangeText: (jsonString) => {
        $scope.actionExtraVars = jsonString;
        // console.log(JSON.parse(jsonString))
      }
    }
    const editor = new JSONEditor(container, options)

    // set json
    const initialJson = {
    }
    editor.set(initialJson)

    // get json
    const updatedJson = editor.get()

    let handleFilesConfig = (file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        $scope.fileText = '';
        $scope.lineNumbers.length = [];
        const file = event.target.result;
        const allLines = file.split(/\r\n|\n/);
        allLines.forEach((line, index) => {
          $scope.fileText += `${line}\n`;
          $scope.lineNumbers.push(index + 1);
        });
        $scope.showPopup = true;
        let tArea = document.getElementById("listing-data");
        let numBlock = document.getElementById("nums-data");
        tArea.addEventListener("scroll", (event) => {
          numBlock.scrollTop = tArea.scrollTop;
        });
      };

      reader.onerror = (event) => {
        alert(event.target.error.name);
      };

      reader.readAsText(file);
    };
    Wait('start')
    $http({
      method: 'GET',
      url: 'api/v2/job_templates/'
    }).then(function success(result) {
      $scope.storedJobTemplates = result.data.results;
      Wait('stop')
    })
    $scope.templatesClick = () => {
      $scope.displayView = "templates";
      $scope.isAllowRun = false;
      $scope.isAllowDelete = true;
    };
    $scope.actionsClick = () => {
      $scope.displayView = "actions";
      $scope.isAllowRun = false;
      $scope.isAllowDelete = true;
    };
    $scope.pipelineClick = () => {
      $scope.displayView = "pipeline";
      $scope.isAllowRun = true;
      $scope.isAllowDelete = false;
    };
    $scope.historyClick = () => {
      $scope.displayView = "history";
      $scope.isAllowRun = false;
      $scope.isAllowDelete = false;
    };

    $scope.storedTemplates = Dataset.data.results;
    $scope.deployHistoryRows = History.data.results;
    $scope.storedActions = Action.data.results;
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
        prev_step_id: $scope.parentIndex,
      });
    };

    $scope.handleAddAction = () => {
      $scope.isAddingAction = true;
    }

    $scope.deleteTemplate = (id) => {
      Wait('start')
      $http({
        method: 'GET',
        url: `/deptemplate/delete/?id=${id}`
      }).then(
        function success() {
          $http({
            method: "GET",
            url: "/deptemplate/rows/",
          }).then(
            function success(response) {
              $scope.storedTemplates = response.data.results;
              $scope.dataset = response.data;
              Wait("stop");
            },
            function error() {
              alert("Somethinng went wrong.");
              Wait("stop");
            }
          );
        },
        function error() {
          Wait('stop')
        }
      )
    }

    $scope.deleteAction = (id) => {
      Wait('start')
      $http({
        method: 'GET',
        url: `/deptemplate/deleteaction/?id=${id}`
      }).then(
        function success() {
          $http({
            method: "GET",
            url: "/deptemplate/actions/",
          }).then(
            function success(response) {
              $scope.storedActions = response.data.results;
              $scope.actionsDataset = response.data;
              Wait("stop");
            },
            function error() {
              alert("Somethinng went wrong.");
              Wait("stop");
            }
          );
        },
        function error() {
          Wait('stop')
        }
      )
    }

    $scope.setConfigFile = (files) => {
      $scope.fileObj = files[0];
      handleFilesConfig(files[0]);
    };

    $scope.templateNameInputChange = () => {
      $scope.errors = null;
    };

    $scope.actionNameInputChange = () => {
      $scope.errors = null;
    };

    $scope.handleCancel = () => {
      $scope.isAdding = false;
      $scope.isAddingAction = false;
      $scope.cards = [];
      $rootScope.isConfigUploaded = [];
      $scope.templateName = null;
      $scope.config = null;
      $scope.errors = null;
    };

    $scope.handleAddCard = () => {
      $rootScope.isConfigUploaded.push({
        description: "",
        status: "start",
        config: null,
        name: null,
        domain: null,
        action: [],
        prev_step_id: $scope.parentIndex,
      });
    };


    $scope.handleSave = () => {
      console.log($scope.isConfigUploaded)
      if (!$scope.templateName || $scope.templateName === "") {
        $scope.errors = {
          details: "Template name not specified.",
        };
        return;
      } else if ($scope.isConfigUploaded.length > 0) {
        let notValidCard = [];
        $scope.isConfigUploaded.forEach((item, index) => {
          if (!item.domain) {
            notValidCard.push({ index });
          }
        });
        if (notValidCard.length) {
          $scope.errors = {
            details: `Domain not specified on step ${
              notValidCard[0].index + 1
            }`,
          };
        } else {
          Wait("start");
          let tempArr = $rootScope.isConfigUploaded.map((item) => {
            item.name = Math.random().toString(36).substring(7);
            return item;
          });
          $rootScope.isConfigUploaded = tempArr;
          $http({
            method: "POST",
            url: "/deptemplate/save/",
            data: {
              list: $rootScope.isConfigUploaded,
              name: $scope.templateName,
            },
          }).then(
            function success() {
              $scope.isAdding = false;
              $http({
                method: "GET",
                url: "/api/v2/deploy_template/?order=-created",
              }).then(
                function success(response) {
                  $scope.storedTemplates = response.data.results;
                  $scope.dataset = response.data;
                  Wait("stop");
                },
                function error() {
                  alert("Somethinng went wrong.");
                  Wait("stop");
                }
              );
            },
            function error() {
              alert("Somethinng went wrong.");
              Wait("stop");
            }
          );
        }
      }
    };

    $scope.handleSaveAction = () => {
      Wait('start');
      $http({
        method: 'POST',
        url: '/api/v2/action/',
        data: {
          extra_vars: $scope.actionExtraVars,
          name: $scope.actionName,
          job_templates: [$scope.selected.action.id]
        }
      }).then(function success(){
        $scope.isAddingAction = false;
        $http({
          method: 'GET',
          url: '/api/v2/action/?order_by=-created'
        }).then(function success(result) {
          $scope.storedActions = result.data.results;
          Wait('stop')
        })
      })
    }

    $scope.uploadConfig = () => {
      Wait("start");
      let r = Uploader.upload("/deploy/uploads/", $scope.fileObj);
      r.then(
        function (r) {
          // success
          $scope.showPopup = false;
          $rootScope.configFileName = JSON.parse(r.response);
          $scope.errors = null;
          Wait("stop");
        },
        function (r) {
          // failure
          Wait("stop");
          console.warn(r);
        }
      );
    };

    $scope.getSteps = () => {
      let cardList = [];
      Wait('start');
      for (let item in $scope.selected.item.deployHistoryIds) {
        let card = $http({
          method: 'GET',
          url: `/api/v2/deploy_history/${$scope.selected.item.deployHistoryIds[item]}/`
        }).then(
          function success(response) {
            cardList.push(response.data)
            Wait('stop');
          },
          function error(e) {
            alert(e);
            Wait('stop');
          }
        )
      }
      $rootScope.isConfigUploaded = cardList;
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

    $scope.closePopup = () => {
      $scope.fileText = "";
      $scope.lineNumbers.length = 0;
      $scope.showPopup = false;
    };
  },
];
