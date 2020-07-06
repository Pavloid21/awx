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
    $rootScope.treeView = [[]]
    
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

  // Observe DOM changes
  const config = {
    attributes: true,
    subtree: true
  }; 
  const callback = function(mutationsList, observer) {
    $scope.some()
  };
  const observer = new MutationObserver(callback);
  observer.observe(document, config);

  $rootScope.tree = {
    description: "1",
    status: "start",
    points: [
      {
        key: 'success',
        value: true
      }
    ]
  }

  $scope.$on('$destroy', () => {
    observer.disconnect();
  })

  function treeToTreeView (tree) {
    Wait('start')
    let treeView = [[]]
    let deep = (node, column = 0, parent = null) => {
      if (!treeView[column]) {
        treeView.push([])
      }
      if (!treeView[column + 1]) {
        treeView.push([])
      }
      if (node.points) {
        if (!node.children) {
          node.children = [];
          node.points.forEach(point => {
            node.children.push(
              {
                children: [],
                parent_node: parent ? parent.node : null,
                node: `${column}${treeView[column].length}`
              }
            )
          })
        } else {
          node.points.forEach((point, index) => {
            if (index >= node.children.length) {
              node.children.push(
                {
                  children: [],
                  parent_node: parent ? parent.node : null,
                  node: `${column}${treeView[column].length}`
                }
              )
            }
          })
        }
        
      }
      if (node == null || node === undefined) {
        let obj = {
          children: [],
          parent_node: parent ? parent.node : null,
          node: `${column}${treeView[column].length}`
        }
        node = obj;
        treeView[column].push(obj);
        return
      };
      node.parent_node = parent ? parent.node : null;
      node.node = `${column}${treeView[column].length}`
      treeView[column].push(node);
      node.children.forEach((child, k) => {
        deep(child, column + 1, node)
      })
    }
    deep(tree)
    $rootScope.treeView = treeView;
    console.log('$rootScope.treeView :>> ', $rootScope.treeView);
    Wait('stop')
  }

  $rootScope.treeToTreeView = treeToTreeView;
  treeToTreeView($rootScope.tree);
  

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

  $scope.$watch('$root.treeView', () => {
    $scope.some()
  }, true)

  $scope.$watch('$root.tree', () => {
    $scope.some()
  }, true)

  // PANZOOM ENABLING
  $scope.$watch('$root.treeView', (val) => {
    let elem = $scope.displayView === 'pipeline' ? 'tree_run_container' : 'pipeline_container'
    let pipelineContainer = document.getElementById(elem);
    if (pipelineContainer) {
      panzoom(pipelineContainer, {
        autocenter: true, 
        bounds: true,
        onTouch: function(e) {
          return false; // tells the library to not preventDefault.
        }
      })
    }
  }, true)
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

    $scope.enablePanzoom = () => {
      let treeRunContainer = document.getElementById('tree_run_container');
      if (treeRunContainer) {
        panzoom(treeRunContainer, {
          autocenter: true, 
          bounds: true,
          onTouch: function(e) {
            return false; // tells the library to not preventDefault.
          }
        })
      }
    }

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
      $rootScope.tree = null;
      $rootScope.fieldsDisabled = false;
      $scope.isEditing = false;
    };
    $scope.actionsClick = () => {
      $scope.displayView = "actions";
      $scope.isAllowRun = false;
      $scope.isAllowDelete = true;
      $rootScope.tree = null;
    };
    $scope.pipelineClick = () => {
      $scope.displayView = "pipeline";
      $scope.isAllowRun = true;
      $scope.isAllowDelete = false;
      $scope.fromHistory = false;
      $rootScope.tree = null;
      $rootScope.treeView = null;
      $rootScope.fieldsDisabled = true;
      $scope.selected.item = null;
      $rootScope.showLogPopup = {};
    };
    $scope.historyClick = () => {
      $scope.displayView = "history";
      $rootScope.showLogPopup = {};
      $scope.isAllowDelete = false;
      $rootScope.tree = null;
    };

    $scope.setTaskDescription = () => {
      $rootScope.taskDescription = `${$scope.selected.item.name}_${$scope.selected.taskDescription}`;
    }

    $scope.isEmptyCell = (key, l) => {
      return $rootScope.treeView[key][l] && !$rootScope.treeView[key][l].status
    }

    $scope.storedTemplates = Dataset.data.results;
    $scope.deployHistoryRows = History.data.results;
    $scope.storedActions = Action.data.results;
    $rootScope.isConfigUploaded = [];
    $scope.cards = [];

    function findNode(id) {
      let findedNode = null;
      $rootScope.treeView.forEach(column => {
        column.forEach(cell => {
          if (cell.node === id) {
            findedNode = cell;
          }
        })
      })
      return findedNode;
    }

    $rootScope.findNode = findNode;

    $scope.some = () => {
      let elem = $scope.displayView === 'pipeline' ? 'tree_run_container' : 'pipeline_container'
      let pipelineContainer = document.getElementById(elem);
      if (pipelineContainer) {
        document.querySelectorAll('.svg_container').forEach(e => e.remove())
        $rootScope.treeView.forEach((column, cid) => {
          column.forEach((cell, id) => {
            if (cid !== $rootScope.treeView.length - 1) {
              let cardElement = pipelineContainer.querySelector(`#card_${cid}${id}`);
              let childrenElements = $rootScope.treeView[cid + 1].map((child, c) => {
                if (child && child.parent_node === cell.node) {
                  return pipelineContainer.querySelector(`#card_${cid + 1}${c}`)
                }
              })
              let coords = [];
              if (childrenElements.length) {
                childrenElements.forEach(ce => {
                  if (ce) {
                    coords.push({
                      x: ce.offsetLeft,
                      y: ce.offsetTop + ce.offsetHeight / 2
                    })
                  }
                })
                if (cardElement) {
                  let x = cardElement.offsetWidth + cardElement.offsetLeft;
                  let y = cardElement.offsetTop;
                  let center = cardElement.offsetTop + cardElement.offsetHeight / 2;
                  if (x !== 0 && y !== 0 && !cardElement.classList.contains('add_card')) {
                    // draw dots and path
                    let svgContainer = document.createElement('div');
                    svgContainer.setAttribute('class', 'svg_container');
                    let circle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    let checkPoints = coords.map(coord => coord.y).concat(center)
                    let height = _.max(checkPoints) - _.min(checkPoints) >= 12 ? _.max(checkPoints) - _.min(checkPoints) : 12
                    circle.setAttribute('width', 80);
                    circle.setAttribute('height', height);
                    circle.setAttribute('viewBox', `0 0 80 ${height}`);
                    circle.setAttribute('version', '1.1');
                    circle.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    let sourcePositionY = null;
                    if (Math.abs(_.min(checkPoints) - center) === height) {
                      sourcePositionY = height - 6
                    } else if(Math.abs(_.min(checkPoints) - center) < 6) {
                      sourcePositionY = 6;
                    } else {
                      sourcePositionY = Math.abs(_.min(checkPoints) - center)
                    }
                    let lines = coords.map(coord => {
                      return `<line x1="6" y1=${sourcePositionY} x2=80 y2=${Math.abs(coord.y - _.min(checkPoints))} stroke="#C4C4C4"/>`
                    })
                    circle.innerHTML = `
                      ${lines.join('\n')}
                      <circle cx="6" cy=${sourcePositionY} r="4" fill="#C4C4C4"/>
                    `;
                    svgContainer.style.top = _.min(checkPoints) + 'px';
                    svgContainer.style.left = x + 'px';
                    svgContainer.appendChild(circle);
                    pipelineContainer.appendChild(svgContainer);
                  }
                }
              }
            }
          })
        })
      }
    }
    
    $scope.handleAddStep = (column, id) => {
      function dive(node) {
        if (!node) {
          return
        }
        if (node.node === `${column}${id}`) {
          node.status = 'start';
          node.points = [];
        }
        node.children.forEach(child => {
          dive(child)
        })
      }
      dive($rootScope.tree)
      $rootScope.treeView = [];
      $rootScope.treeToTreeView($rootScope.tree)
      $scope.some();
    }

    $rootScope.rerenderTree = $scope.some;

    $scope.$on('$viewContentLoaded', () => {
      console.log('LOADED :>> ', $rootScope.tree);
    })

    $scope.handleAddTemplate = () => {
      $scope.isAdding = true;
      $scope.isEditing = false;
      $scope.isAllowDelete = true;
      $rootScope.tree = {
        description: "1",
        status: "start",
        points: [
          {
            key: 'success',
            value: true
          }
        ]
      }
      treeToTreeView($rootScope.tree);
      $scope.some();
    };

    $scope.handleAddAction = () => {
      $scope.actionName = null;
      $scope.selected.action = null;
      editor.set(initialJson);
      $scope.isAddingAction = true;
    }

    $scope.editTemplate = (id) => {
      $scope.currentEditTemplate = $scope.storedTemplates.filter(template => template.id === id)[0];
      $rootScope.tree = JSON.parse($scope.currentEditTemplate.tree)
      treeToTreeView($rootScope.tree);
      $scope.some();
      $scope.isAdding = true;
      $scope.isEditing = true;
      $scope.templateName = $scope.currentEditTemplate.name;
      $scope.selected.item = $scope.currentEditTemplate;
    }

    $scope.handleEditTemplate = () => {
      Wait('start');
      $http({
        method: 'PATCH',
        url: `/api/v2/deploy_template/${$scope.selected.item.id}/`,
        data: {
          name: $scope.templateName,
          tree: JSON.stringify($rootScope.tree)
        }
      }).then(() => {
        $scope.isAdding = false;
        $scope.isEditing = false;
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
      })
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

    $scope.deleteHistoryRow = (event, item) => {
      event.stopPropagation()
      console.log('item :>> ', event);
      $http({
        method: 'DELETE',
        url: `/api/v2/deploy_history/${item.id}/`
      }).then(() => {
        let url = $scope.history.previous || $scope.history.next;
        let urlParams = new URLSearchParams(url);
        let page = +urlParams.get('page');
        let pageRequest = 0;
        if ($scope.deployHistoryRows.length > 1) {
          pageRequest = $scope.history.previous ? page + 1 : page - 1 < 0 ? 1 : page - 1
        } else {
          pageRequest = page
        }
        $http({
          method: 'GET',
          url: `/api/v2/deploy_history/?order_by=-created&page_size=10&page=${pageRequest}`
        }).then(response => {
          $scope.history = response.data;
          $scope.deployHistoryRows = response.data.results;
        })
      })
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
    };


    $scope.handleSave = () => {
      if (!$scope.templateName || $scope.templateName === "") {
        $scope.errors = {
          details: "Template name not specified.",
        };
        return;
      } else {
        let notValidCard = [];
        function dive(node) {
          if (!node) {
            return;
          }
          if (
            (!node.domain ||
            !node.action) && node.status
          ) {
            notValidCard.push(node)
          }
          node.children.forEach(child => {
            dive(child)
          })
        }
        dive($rootScope.tree)
        if (notValidCard.length) {
          $scope.errors = {
            details: `Required fields is empty in ${
              notValidCard[0].name || notValidCard[0].node
            }`,
          };
        } else {
          $scope.errors = null;
          Wait('start')
          $http({
            method: 'POST',
            url: '/api/v2/deploy_template/',
            data: {
              name: $scope.templateName,
              tree: JSON.stringify($rootScope.tree)
            }
          }).then(() => {
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
          })
        }
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
      $rootScope.tree = JSON.parse($scope.selected.item.tree);
      treeToTreeView($rootScope.tree);
      $scope.some('tree_run_container');
    }

    $rootScope.getSteps = $scope.getSteps;

    $scope.historyRowClick = (item) => {
      $scope.displayView = 'pipeline';
      let changed = false;
      $scope.fromHistory = true;
      $rootScope.historyId = item.id;
      $rootScope.tree = JSON.parse(item.tree);
      function dive(node) {
        if (!node) {
          return;
        }
        if (node.status === 'pending' || node.status === 'running') {
          changed = true;
          Wait('start')
          $http({
            method: 'GET',
            url: `/api/v2/jobs/${node.job}/`
          }).then((jobResponse) => {
            node.status = jobResponse.data.status;
            dive($rootScope.tree)
            $http({
              method: 'PATCH',
              url: `/api/v2/deploy_history/${item.id}/`,
              data: {
                tree: JSON.stringify($rootScope.tree)
              }
            }).then((response) => {
              $rootScope.tree = JSON.parse(response.data.tree);
              treeToTreeView($rootScope.tree);
              $scope.some();  
            })
            Wait('stop')
          }, () => {
            Wait('stop')
          })
        } else {
          node.children.forEach(child => {
            dive(child)
          })
        }
      }
      dive($rootScope.tree)
      console.log('$rootScope.tree :>> ', $rootScope.tree);
      treeToTreeView($rootScope.tree)
      $rootScope.fieldsDisabled = true;
      $scope.isAllowRun = true;
      $scope.some()
    }

    $scope.closePopup = () => {
      $scope.fileText = "";
      $scope.lineNumbers.length = 0;
      $scope.showPopup = false;
    };
  },
];
