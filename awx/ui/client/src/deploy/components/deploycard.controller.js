export default function($rootScope, $scope, $element, Wait, $http) {
  this.index = null;
  this.allowRun = null;
  this.allowDelete = null;
  this.step = null;
  $scope.domainsList = [];
  $scope.name = null;
  $scope.newPoint = {};
  $scope.isDisabledFields = $rootScope.fieldsDisabled;
  $rootScope.isCollapse = {
    changes: false,
    added: false,
    deleted: false
  };
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
    url: '/api/v2/inventories/?page_size=1000'
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
  $scope.watcher = $rootScope.isConfigUploaded;
  this.$onInit = function() {
      $scope.allowRun = this.allowrun;
    $scope.name = this.name;
    $scope.points = this.points;
    $scope.ispicker = this.ispicker;
    $scope.isdeployer = this.isdeployer;
    $scope.allowDelete = this.allowdelete;
    $scope.domain = this.domain;
    $scope.action = this.action ? this.action[0] : null;
    $scope.step = this.step;
    if ($rootScope.tree) {
      function dive(node, parent) {
        if (!node) {
          return;
        }
        if ($scope.step === node.node) {
          $scope.status = node.status;
          $scope.current = node
          if (!!parent) {
            if (parent.status !== 'start' && parent.status !== 'pending') {
              $scope.prevStepNotComplited = false;
            } else {
              $scope.prevStepNotComplited = true;
            }
          } else {
            if (node.status === 'failed' || node.status === 'successful' || node.status === 'skiped') {
              $scope.prevStepNotComplited = true;
            } else {
              $scope.prevStepNotComplited = false;
            }
          }
        }
        if (node.setuper) {
          $scope.deployStep = node
        }
        if (node.picker) {
          $scope.pickerStep = node
        }
        node.children.forEach(child => {
          dive(child, node)
        })
      }
      dive($rootScope.tree, null)
    }
  };

  let updateTree = () => {
    $http({
      method: 'PATCH',
      url: `/api/v2/deploy_history/${$rootScope.historyId}/`,
      data: {
        tree: JSON.stringify($rootScope.tree)
      }
    })
  }

  $scope.$on('ws-jobs', (e, data) => {
    function dive(node) {
      if (!node) {
        return;
      }
      if (data.unified_job_id === node.job) {
        node.status = data.status;
        $scope.current = node;
        node.points.forEach((point, id) => {
          if (point.type === 'Status' && point.value === data.status) {
            node.children[id].trigger = true;
          }
        })

      }
      node.children.forEach(child => {
        dive(child)
      })
    }
    if (data.status === 'successful') {
      dive($rootScope.tree);
      $rootScope.treeToTreeView($rootScope.tree);
      $rootScope.job = data.id;
      throwJobId();
      updateTree();
    } else if (data.status === 'failed') {
      $rootScope.job = data.id;
      dive($rootScope.tree);
      $rootScope.treeToTreeView($rootScope.tree);
      throwJobId();
      updateTree();
    }
  })

  $scope.skipStep = (id) => {
    function dive(node) {
      if (!node) {
        return;
      }
      if (id === node.node) {
        $scope.status = 'skiped';
        node.status = $scope.status;
      }
      node.children.forEach(child => {
        dive(child, node)
      })
    }
    dive($rootScope.tree)
    console.log('$rootScope.tree :>> ', $rootScope.tree);
    $rootScope.treeToTreeView($rootScope.tree);
    $rootScope.rerenderTree()
  }

  $scope.$watch('$root.treeView', () => {
    $rootScope.rerenderTree()
  }, true)

  $scope.editStepName = () => {
    if ($scope.allowDelete)
      $scope.isEditingName = true;
  }

  $scope.saveName = (e, id) => {
    e.stopPropagation();
    function dive(node) {
      if (!node) {
        return;
      }
      if (node.node === id) {
        node.name = $scope.name
      } else {
        node.children.forEach(child => {
          dive(child)
        })
      }
    }
    dive($rootScope.tree);
    $rootScope.rerenderTree();
    $scope.isEditingName = false;
  }

  $scope.handleViewLog = () => {
    if ($scope.ispicker) {
      $http({
        method: 'GET',
        url: `/diff/read_json/?job=${$scope.current.job}&file=forDeploy.json`
      }).then(successJsonData => {
        $rootScope.logStrings = null;
        $rootScope.commitStrings = JSON.stringify(successJsonData.data.results).split('\n');
        $rootScope.tableData = successJsonData.data.results;
        $rootScope.canNotApply = true;
        $rootScope.showLogPopup[`card_`] = true;
      })
    } else if ($scope.isdeployer) {
      $http({
        method: 'GET',
        url: `/diff/read_info/?job=${$scope.current.job}&file=json2rest.log`
      }).then(successJsonData => {
        $rootScope.commitStrings = null;
        $rootScope.logStrings = successJsonData.data.results.split('\n');
        $rootScope.tableData = successJsonData.data.results;
        $rootScope.showLogPopup[`card_`] = true;
        $rootScope.canNotApply = true;
      })
    } else {

    }
  }

  $scope.setDomain = (id) => {
    // $rootScope.isConfigUploaded[$scope.index].domain = $scope.domain;
    if (id) {
      function dive(node) {
        if (!node) {
          return;
        }
        if (node.node === id) {
          node.domain = $scope.domain
        } else {
          node.children.forEach(child => {
            dive(child)
          })
        }
      }
      dive($rootScope.tree);
    }
  };

  $scope.setAction = (id) => {
    // $rootScope.isConfigUploaded[$scope.index].action = [$scope.action];
    if (id) {
      function dive(node) {
        if (!node) {
          return;
        }
        if (node.node === id) {
          node.action = [$scope.action]
        } else {
          node.children.forEach(child => {
            dive(child)
          })
        }
      }
      dive($rootScope.tree);
    }
  };

  $scope.setPicker = (id) => {
    if (id) {
      function dive(node) {
        if (!node) {
          return;
        }
        if (node.node === id) {
          node.picker = $scope.ispicker
        } else {
          node.children.forEach(child => {
            dive(child)
          })
        }
      }
      dive($rootScope.tree);
    }
  }

  $scope.setDeployer = (id) => {
    if (id) {
      function dive(node) {
        if (!node) {
          return;
        }
        if (node.node === id) {
          node.setuper = $scope.isdeployer
        } else {
          node.children.forEach(child => {
            dive(child)
          })
        }
      }
      dive($rootScope.tree);
    }
  }

  $scope.handleDeleteCard = (id) => {
    $rootScope.isConfigUploaded.splice($scope.index, 1);
    if (id) {
      function dive(node) {
        if (!node) {
          return;
        }
        if (node.node === id) {
          node.children = [];
          node.points = [];
          node.status = null;
        } else {
          node.children.forEach(child => {
            dive(child)
          })
        }
      }
      dive($rootScope.tree);
      $rootScope.treeView = [];
      $rootScope.treeToTreeView($rootScope.tree)
      // $rootScope.rerenderTree()
    }
  }

  $scope.handleDeletePoint = (id, point) => {
    if (id) {
      function dive(node) {
        if (!node) {
          return
        }
        if (node.node === id) {
          node.points.forEach((p, index) => {
            if (index === point) {
              node.points.splice(index, 1);
              node.children.splice(index, 1)
            }
          })
        } else {
          node.children.forEach(child => {
            dive(child)
          })
        }
      }
      dive($rootScope.tree)
      $rootScope.treeView = [];
      $rootScope.treeToTreeView($rootScope.tree)
      // $rootScope.rerenderTree()
    }
  }

  $scope.openPointEditor = () => {
    $scope.pointEditor = true;
  }

  $scope.onTypeChanged = () => {
    $scope.newPoint.value = null;
  }

  $scope.handleAddPoint = (id) => {
    if (id) {
      function dive(node) {
        if (!node) {
          return;
        }
        if (node.node === id) {
          node.points.push({
            name: $scope.newPoint.name,
            type: $scope.newPoint.type,
            value: $scope.newPoint.value,
          })
        } else {
          node.children.forEach(child => {
            dive(child)
          })
        }
      }
      dive($rootScope.tree);
      $rootScope.treeView = [];
      $rootScope.treeToTreeView($rootScope.tree);
      $scope.pointEditor = false;
    }
  }

  $scope.handleAddPointCancel = () => {
    $scope.pointEditor = false;
  }

  let throwJobId = () => {
    if ($scope.ispicker) {
      let deployerStep = $scope.deployStep;
      $http({
        method: 'GET',
        url: `/api/v2/action/${deployerStep.action[0]}/`
      }).then(responseAction => {
        let extraVars = JSON.parse(responseAction.data.extra_vars.length ? 
          responseAction.data.extra_vars :
          '{}'
          );
        extraVars.deploy_vars = $scope.current.job;
        $http({
          method: 'PATCH',
          url: `/api/v2/action/${responseAction.data.id}/`,
          data: {
            description: '',
            name: responseAction.data.name,
            extra_vars: JSON.stringify(extraVars),
            job_templates: responseAction.data.job_templates
          }
        }).then(successPatch => {
          $http({
            method: 'GET',
            url: `/diff/read_json/?job=${$scope.current.job}&file=forDeploy.json`
          }).then(successJsonData => {
            console.log('sucessJsonData.status :>> ', successJsonData.status);
            $rootScope.logStrings = null;
            $rootScope.commitStrings = JSON.stringify(successJsonData.data.results).split('\n');
            $rootScope.tableData = successJsonData.data.results;
            $rootScope.showLogPopup[`card_`] = true;
            // $rootScope.closePopup();
            // $rootScope.handleViewLog()
          })
        })
      })
    } else if ($scope.isdeployer) {
      $http({
        method: 'GET',
        url: `/diff/read_info/?job=${$scope.current.job}&file=json2rest.log`
      }).then(successJsonData => {
        console.log('sucessJsonData.status :>> ', successJsonData.status);
        $rootScope.commitStrings = null;
        $rootScope.logStrings = successJsonData.data.results.split('\n');
        $rootScope.tableData = successJsonData.data.results;
        $rootScope.showLogPopup[`card_`] = true;
        // $rootScope.closePopup();
        // $rootScope.handleViewLog();
      })
    } else {
      $rootScope.closePopup();
    }
  }

  $rootScope.collapseView = function(chapter) {
    $rootScope.isCollapse[chapter] = !$rootScope.isCollapse[chapter];
  };

  $rootScope.closePopup = () => {
    $rootScope.showLogPopup[`card_`] = false;
  }

  $rootScope.applyPopup = () => {
    $rootScope.showLogPopup[`card_`] = false;
  }

  $scope.confirmChanges = () => {
    $scope.showPopup = false;
  }

  $rootScope.declaimChanges = () => {
    $rootScope.showLogPopup[`card_`] = false;
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
            if ($scope.ispicker)
              extraVars.send_mail = 'false';
            if ($scope.isdeployer)
              extraVars.deploy_vars = $scope.pickerStep.job;
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
              function dive(node) {
                if (!node) {
                  return;
                }
                if ($scope.step === node.node) {
                  node.status = 'pending';
                  node.job = launchResponse.data.job;
                }
                node.children.forEach(child => {
                  dive(child)
                })
              }
              dive($rootScope.tree);
              $rootScope.job = launchResponse.data.job;
              if ($scope.step === '00') {
                $http({
                  method: 'POST',
                  url: '/api/v2/deploy_history/',
                  data: {
                    name: $rootScope.taskDescription.split('_')[1],
                    description: $rootScope.taskDescription.split('_')[0],
                    tree: JSON.stringify($rootScope.tree)
                  }
                })
                .then(resp => {
                  $rootScope.historyId = resp.data.id;
                })                
              } else {
                $http({
                  method: 'PATCH',
                  url: `/api/v2/deploy_history/${$rootScope.historyId}/`,
                  data: {
                    tree: JSON.stringify($rootScope.tree)
                  }
                })
                .then(resp => {
                  $rootScope.historyId = resp.data.id;
                })
              }
            })
          }
        })
      })
    })
  };
}
