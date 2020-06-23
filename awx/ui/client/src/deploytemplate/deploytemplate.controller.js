"use strict";
import JSONEditor from 'jsoneditor';
import panzoom from 'panzoom';
import _ from 'lodash';

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
    const vm = this || {};
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
    $rootScope.fieldsDisabled = false;
    $scope.treeView = [[]]
    

    function checkCICDManAccess () {
      console.log('vm :>> ', vm);
      const CICDaccess = `api/v2/users/${vm.currentUserId}/teams/?name=CI/CD management`;
      $http.get(CICDaccess)
          .then(({ data }) => {
              if (data.count > 0) {
                  vm.isCICDManMember = true;
                  $scope.isCICDManMember = true;
              } else {
                  vm.isCICDManMember = false;
                  $scope.isCICDManMember = false;
                  $scope.displayView = 'pipeline';
              }
          })
          .catch(({ data, status }) => {
              ProcessErrors(null, data, status, null, {
                  hdr: strings.get('error.HEADER'),
                  msg: strings.get('error.CALL', { path: CICDaccess, action: 'GET', status })
              });
          });
  }

  function checkCICDaccess () {
    const CICDaccess = `api/v2/users/${vm.currentUserId}/teams/?name=CI/CD`;
    $http.get(CICDaccess)
        .then(({ data }) => {
            if (data.count > 0) {
                vm.isCICDMmember = true;
                $scope.isCICDmember = true;
                $scope.pipelineClick();
            } else {
                vm.isCICDMmember = false;
                $scope.isCICDmember = false;
            }
        })
        .catch(({ data, status }) => {
            ProcessErrors(null, data, status, null, {
                hdr: strings.get('error.HEADER'),
                msg: strings.get('error.CALL', { path: CICDaccess, action: 'GET', status })
            });
        });
  }

  function treeToTreeView (tree) {
    Wait('start')
    let deep = (node, column = 0) => {
      if (!$scope.treeView[column]) {
        $scope.treeView.push([])
      }
      if (!$scope.treeView[column + 1]) {
        $scope.treeView.push([])
      }
      if (node == null || node === undefined) {
        $scope.treeView[column].push({});
        $scope.treeView[column + 1].push(null, null);
        return
      };
      $scope.treeView[column].push(node);
      deep(node.on_success, column + 1)
      deep(node.on_failed, column + 1)
    }
    deep(tree)
    console.log('$scope.treeView :>> ', $scope.treeView);
    Wait('stop')
  }

  // treeToTreeView(
  //   {
  //     description: "1",
  //     status: "start",
  //     on_success: {
  //       description: "2",
  //       status: "start",
  //       on_success: {
  //         description: "18",
  //         status: "start",
  //         on_success: null,
  //         on_failed: {
  //           description: "18",
  //           status: "start",
  //           on_success: null,
  //           on_failed: null
  //         }
  //       },
  //       on_failed: null
  //     },
  //     on_failed: {
  //       description: "3",
  //       status: "start",
  //       on_success: null,
  //       on_failed: {
  //         description: "11",
  //         status: "start",
  //         on_success: null,
  //         on_failed: null
  //       }
  //     }
  //   })
  

  $scope.$watch('$root.current_user', (val) => {
    vm.isLoggedIn = val && val.username;
    if (!_.isEmpty(val)) {
        vm.isSuperUser = $scope.$root.user_is_superuser || $scope.$root.user_is_system_auditor;
        $scope.isSuperUser = $scope.$root.user_is_superuser || $scope.$root.user_is_system_auditor;
        vm.currentUsername = val.username;
        vm.currentUserId = val.id;

        if (!vm.isSuperUser) {
            checkCICDManAccess();
            checkCICDaccess();
        }
    }
  });

  // PANZOOM ENABLING
  // $scope.$watch('$root.isConfigUploaded', (val) => {
  //   let pipelineContainer = document.getElementById('pipeline_container');
  //   panzoom(pipelineContainer).zoomAbs(
  //     100, 100, .8
  //   );
  // })
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
      $rootScope.isConfigUploaded = [];
      $rootScope.fieldsDisabled = false;
    };
    $scope.actionsClick = () => {
      $scope.displayView = "actions";
      $scope.isAllowRun = false;
      $scope.isAllowDelete = true;
      $rootScope.isConfigUploaded = [];
    };
    $scope.pipelineClick = () => {
      $scope.displayView = "pipeline";
      $scope.isAllowRun = true;
      $scope.isAllowDelete = false;
      $rootScope.isConfigUploaded = [];
      $rootScope.fieldsDisabled = true;
      $scope.selected.item = null;
    };
    $scope.historyClick = () => {
      $scope.displayView = "history";
      // $scope.isAllowRun = false;
      $scope.isAllowDelete = false;
      $rootScope.isConfigUploaded = [];
    };
    $scope.notEmptyCell = (key, l) => {
      return $scope.treeView[key][l] && Object.keys($scope.treeView[key][l]).length > 1
    }

    $scope.isEmptyCell = (key, l) => {
      return $scope.treeView[key][l] && Object.keys($scope.treeView[key][l]).length <= 1
    }

    $scope.storedTemplates = Dataset.data.results;
    $scope.deployHistoryRows = History.data.results;
    $scope.storedActions = Action.data.results;
    $rootScope.isConfigUploaded = [];
    $scope.cards = [];

    $scope.some = () => {
      console.log('EXECUTED ONLOAD :>> ');
      let pipelineContainer = document.getElementById('pipeline_container');
      $scope.treeView.forEach((column, cid) => {
        column.forEach((cell, id) => {
          if (cid !== $scope.treeView.length - 1) {
            let cardElement = document.querySelector(`#card_${column.length + id}`);
            let successChild = document.querySelector(`#card_${(column.length + id) * 2}`);
            let failedChild = document.querySelector(`#card_${(column.length + id) * 2 + 1}`);
            if (successChild && failedChild) {
              let firstChildCoords = {
                x: successChild.offsetLeft,
                y: successChild.offsetTop + successChild.offsetHeight / 2
              }
  
              let secondChildCoords = {
                x: failedChild.offsetLeft,
                y: failedChild.offsetTop + failedChild.offsetHeight / 2
              }
              let x = cardElement.offsetWidth + cardElement.offsetLeft;
              let y = cardElement.offsetTop;
              let center = cardElement.offsetTop + cardElement.offsetHeight / 2;
              if (x !== 0 && y !== 0 && !cardElement.classList.contains('prev_failed') && !cardElement.classList.contains('prev_success')) {
                console.log('cardElement :>> ', cardElement.id);
                // draw dots and path
                let svgContainer = document.createElement('div');
                svgContainer.setAttribute('class', 'svg_container');
                let circle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                let checkPoints = [firstChildCoords.y, secondChildCoords.y, center]
                let height = _.max(checkPoints) - _.min(checkPoints)
                circle.setAttribute('width', 80);
                circle.setAttribute('height', height);
                circle.setAttribute('viewBox', `0 0 80 ${height}`);
                circle.setAttribute('version', '1.1');
                circle.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                console.log('x, y :>> ', x, y);
                circle.innerHTML = `
                  <line x1="6" y1=${Math.abs(firstChildCoords.y - center)} x2=80 y2=${Math.abs(firstChildCoords.y - _.min(checkPoints))} stroke="green"/>
                  <line x1="6" y1=${Math.abs(firstChildCoords.y - center)} x2=80 y2=${height - Math.abs(_.max(checkPoints) - secondChildCoords.y)} stroke="red"/>
                  <circle cx="6" cy=${Math.abs(firstChildCoords.y - center)} r="4" fill="#767676"/>
                `;
                svgContainer.style.top = _.min(checkPoints) + 'px';
                svgContainer.style.left = x + 'px';
                svgContainer.appendChild(circle);
                pipelineContainer.appendChild(svgContainer);
              }
            }
          }
        })
      })
    }

    $scope.$on('$viewContentLoaded', () => {
      console.log('LOADED :>> ');
    })

    $scope.handleAddTemplate = () => {
      $scope.isAdding = true;
      $scope.isEditing = false;
      $rootScope.isConfigUploaded.push({
        description: "",
        status: "start",
        config: null,
        domain: null,
        name: null,
        picker: false,
        setuper: false,
        action:[],
        prev_step_id: $scope.parentIndex,
        on_success: null,
        on_failed: null
      });
    };

    $scope.handleAddAction = () => {
      $scope.actionName = null;
      $scope.selected.action = null;
      editor.set(initialJson);
      $scope.isAddingAction = true;
    }

    $scope.editTemplate = (id) => {
      $scope.currentEditTemplate = $scope.storedTemplates.filter(template => template.id === id)[0];
      $scope.isAdding = true;
      $scope.isEditing = true;
      $scope.templateName = $scope.currentEditTemplate.name;
      $scope.selected.item = $scope.currentEditTemplate;
      $scope.getSteps();
    }

    $scope.handleEditTemplate = () => {
      $scope.deleteTemplate($scope.currentEditTemplate.id, true)
    }

    $scope.deleteTemplate = (id, isUpdate) => {
      Wait('start')
      $http({
        method: 'DELETE',
        url: `/api/v2/deploy_template/${id}/`
      }).then(
        function success() {
          $http({
            method: "GET",
            url: "/api/v2/deploy_template/?order=-created",
          }).then(
            function success(response) {
              $scope.storedTemplates = response.data.results;
              $scope.dataset = response.data;
              Wait("stop");
              if (isUpdate) {
                $scope.handleSave();
              }
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
        method: 'DELETE',
        url: `/api/v2/action/${id}/`
      }).then(
        function success() {
          $http({
            method: "GET",
            url: "/api/v2/action/?order_by=-created",
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

    $scope.editAction = (id) => {
      $scope.currentEditAction = $scope.storedActions.filter(action => action.id === id)[0];
      $scope.isAddingAction = true;
      $scope.isAdding = true;
      $scope.isEditing = true;
      $scope.actionName = $scope.currentEditAction.name;
      $scope.selected.action = $scope.storedJobTemplates.filter(template => template.id === $scope.currentEditAction.job_templates[0])[0];
      editor.set(JSON.parse($scope.currentEditAction.extra_vars || '{}'))
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
      $scope.isEditing = false;
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
        picker: false,
        setuper: false,
        action: [],
        prev_step_id: $scope.parentIndex,
        on_success: null,
        on_failed: null
      });
      console.log('$rootScope.isConfigUploaded :>> ', $rootScope.isConfigUploaded);
    };


    $scope.handleSave = () => {
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
            item.job = null;
            return item;
          });
          $rootScope.isConfigUploaded = tempArr;
          let prevStepId = null;
          let ids = [];
          (function loop(i) {
            if (i < tempArr.length) {
              tempArr[i].prev_step_id = prevStepId;
              $http({
                method: 'POST',
                url: '/api/v2/deploy_history/',
                data: tempArr[i]
              }).then((successResponse) => {
                ids.push(successResponse.data.id)
                prevStepId = successResponse.data.id;
                if (i === tempArr.length - 1) {
                  $http({
                    method: 'POST',
                    url: '/api/v2/deploy_template/',
                    data: {
                      name: $scope.templateName,
                      deployHistoryIds: ids
                    }
                  }).then(function success() {
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
                loop.call(null, i+1)
              })
            }
          })(0)
    };
  }
}
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
        $scope.isAdding = false;
        $http({
          method: 'GET',
          url: '/api/v2/action/?order_by=-created'
        }).then(function success(result) {
          $scope.storedActions = result.data.results;
          Wait('stop')
        })
      })
    }

    $scope.handleEditAction = () => {
      Wait('start');
      $http({
        method: 'PATCH',
        url: `/api/v2/action/${$scope.currentEditAction.id}/`,
        data: {
          extra_vars: $scope.actionExtraVars,
          name: $scope.actionName,
          job_templates: [$scope.selected.action.id]
        }
      }).then(function success(){
        $scope.isAddingAction = false;
        $scope.isAdding = false;
        $scope.isEditing = false;
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

    $scope.getSteps = (idx, spentItem, nextItem) => {
      let cardList = [];
      let skip = null;
      Wait('start');
      try {
        (function cards(id) {
          if (id < $scope.selected.item.deployHistoryIds.length) {
            $http({
              method: 'GET',
              url: `/api/v2/deploy_history/${$scope.selected.item.deployHistoryIds[id]}/`
            }).then(
              function success(response) {
                if (idx !== undefined && spentItem && nextItem && idx === id) {
                  cardList[idx] = spentItem;
                  cardList[idx + 1] = nextItem;
                  skip = idx + 1;
                } else if (id !== skip) {
                  cardList.push(response.data)
                }
                Wait('stop');
                cards.call(null, id + 1);
              },
              function error(e) {
                alert(e);
                Wait('stop');
              }
            )
          }
        })(0)
        $rootScope.isConfigUploaded = cardList;
      } catch (e) {
        Wait('stop')
      }
    }

    $rootScope.getSteps = $scope.getSteps;

    $scope.historyRowClick = (item) => {
      $scope.displayView = 'pipeline';
      $rootScope.isConfigUploaded = [];
      $rootScope.isConfigUploaded.push(item);
      $rootScope.fieldsDisabled = true;
      $scope.isAllowRun = true;
      let getNextStep = (prevStepId) => {
        $http({
          method: 'GET',
          url: `/api/v2/deploy_history/?prev_step_id=${prevStepId}`
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
