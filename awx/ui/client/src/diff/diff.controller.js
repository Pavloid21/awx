export default [
  "$rootScope",
  "$scope",
  "$location",
  "ConfigService",
  "lastPath",
  "$http",
  "Wait",
  ($rootScope, $scope, $location, ConfigService, lastPath, $http, Wait) => {
    Wait("start");

    $("#diffCompareButton").css("cursor", "not-allowed");

    $scope.diffView = "APP_CFG";

    //$http({method: 'GET', url: '/environments.j
    $http({ method: "GET", url: "/diff/environments/" }).then(
      function success(response) {
        $scope.URL = "/diff/environments/";
        $scope.diffEnvironments = {
          model: null,
          versions: response.data.versions.map(version => {
            return { id: version.id, name: version.name };
          })
        };
        $scope.diffErrorMessage = null;
        Wait("stop");
      },
      function error(response) {
        $scope.diffErrorMessage = "Error at "
          .concat("url")
          .concat(" : ")
          .concat(response.statusText);
        $("html, body").animate({ scrollTop: 0 }, "slow");
        Wait("stop");
      }
    );

    $scope.env1Versions = null;
    $scope.env2Versions = null;

    $scope.getDataEnv1 = function() {
      if ($scope.env1 !== null) {
        Wait("start");
        var url = `/diff/environments/${$scope.env1}/`;
        $http({ method: "GET", url: url }).then(
          function success(response) {
            $scope.env1Versions = response.data.versions;
            $scope.env1Version = null;
            $scope.diffErrorMessage = null;
            $scope.compareData = null;
            Wait("stop");
          },
          function error(response) {
            $scope.diffErrorMessage = "Error at "
              .concat(url)
              .concat(" : ")
              .concat(response.statusText);
            $scope.env1Versions = null;
            $scope.env1Version = null;
            $scope.compareData = null;
            $("html, body").animate({ scrollTop: 0 }, "slow");
            Wait("stop");
          }
        );
      }
    };
    $scope.getDataEnv2 = function() {
      if ($scope.env2 !== null) {
        Wait("start");
        // var url = '/'.concat($scope.env2).concat('.js');
        var url = `/diff/environments/${$scope.env2}/`;
        $http({ method: "GET", url: url }).then(
          function success(response) {
            $scope.env2Versions = response.data.versions;
            $scope.env2Version = null;
            $scope.diffErrorMessage = null;
            $scope.compareData = null;
            Wait("stop");
          },
          function error(response) {
            $scope.diffErrorMessage = "Error at "
              .concat(url)
              .concat(" : ")
              .concat(response.statusText);
            $scope.env2Versions = null;
            $scope.env2Version = null;
            $scope.compareData = null;
            $("html, body").animate({ scrollTop: 0 }, "slow");
            Wait("stop");
          }
        );
        // if ($scope.isDisabledEnvironment($scope.env2)) {
        //   $("#diffApplyButtonAPP").css("cursor", "not-allowed");
        //   $("#diffApplyButtonDOMAIN").css("cursor", "not-allowed");
        //   $("#diffApplyButtonSOA").css("cursor", "not-allowed");
        // } else {
        //   $("#diffApplyButtonAPP").css("cursor", "pointer");
        //   $("#diffApplyButtonDOMAIN").css("cursor", "pointer");
        //   $("#diffApplyButtonSOA").css("cursor", "pointer");
        // }
      }
    };

    $scope.setVersionEnv1 = function() {
      $scope.compareData = null;
      $scope.env1Versions.forEach(element => {
        if (element.name === $scope.env1VersionChoosen) {
          $scope.env1Version = element;
        }
      });
      if ($scope.env1Version !== null && $scope.env2Version !== null) {
        $("#diffCompareButton").css("cursor", "pointer");
      } else {
        $("#diffCompareButton").css("cursor", "not-allowed");
      }
    };

    $scope.setVersionEnv2 = function() {
      $scope.compareData = null;
      $scope.env2Versions.forEach(element => {
        if (element.name === $scope.env2VersionChoosen) {
          $scope.env2Version = element;
        }
      });
      if ($scope.env1Version !== null && $scope.env2Version !== null) {
        $("#diffCompareButton").css("cursor", "pointer");
      } else {
        $("#diffCompareButton").css("cursor", "not-allowed");
      }
    };

    $scope.compare = function() {
      $scope.compareData = null;
      $scope.diffErrorMessage = null;
      if ($scope.env1Version !== null) {
        if ($scope.env2Version !== null) {
          Wait("start");
          let env1 = $scope.diffEnvironments.versions.filter(version => {
            if (version.id === $scope.env1) return version;
          });
          $scope.uiEnv1 = env1[0].name;
          let env2 = $scope.diffEnvironments.versions.filter(version => {
            if (version.id === $scope.env2) return version;
          });
          $scope.uiEnv2 = env2[0].name;
          var url = `/diff/compare/${$scope.env1Version.target}/${$scope.env2Version.target}/?env1=${env1[0].name}&env2=${env2[0].name}&v1=${$scope.env1Version.name}&v2=${$scope.env2Version.name}&isnode=undefined`;
          //  url = 'compare.js';
          $http({ method: "GET", url: url }).then(
            function success(response) {
              $scope.compareData = {};
              $scope.compareData = response.data.compare.results.find(res => {
                if (
                  res.task === "compare v_one and v_two" &&
                  res.event_data.res
                )
                  return JSON.parse(res.event_data.res.stdout);
              });
              $scope.final = JSON.parse(
                $scope.compareData.event_data.res.stdout
              );

              // $scope.diffErrorMessage = null;
              // $scope.disabledEnvironments = $scope.compareData.rw_environments;
              // $scope.compareData.APP_CFG.data.forEach(element => {

              // if (element.diff != null && element.diff != 'incompatible') {
              // element.diff.forEach(element2 => {
              // element2.pathText = "";
              // element2.path.forEach(element3 => {
              // element2.pathText = element2.pathText.concat(element3.element)
              // .concat("(").concat(element3.name_attribute).concat(")> ")
              // })
              // element2.pathText = element2.pathText.concat(element2.param.element)
              // .concat("(").concat(element2.param.name_attribute).concat(")> ");
              // });
              // // console.log(element);
              // }
              // });
              // $scope.compareData.DOMAIN_CFG.data.forEach(element => {

              // if (element.diff != null && element.diff != 'incompatible') {
              // element.diff.forEach(element2 => {
              // element2.pathText = "";
              // element2.path.forEach(element3 => {
              // element2.pathText = element2.pathText.concat(element3.element)
              // .concat("(").concat(element3.name_attribute).concat(")> ")
              // })
              // element2.pathText = element2.pathText.concat(element2.param.element)
              // .concat("(").concat(element2.param.name_attribute).concat(")> ");
              // });
              // // console.log(element);
              // }
              // });
              // $scope.compareData.SOACONFIG.data.forEach(element => {

              // if (element.diff != null && element.diff != 'incompatible') {
              // element.diff.forEach(element2 => {
              // element2.pathText = "";
              // element2.path.forEach(element3 => {
              // element2.pathText = element2.pathText.concat(element3.element)
              // .concat("(").concat(element3.name_attribute).concat(")> ")
              // })
              // element2.pathText = element2.pathText.concat(element2.param.element)
              // .concat("(").concat(element2.param.name_attribute).concat(")> ");
              // });
              // // console.log(element);
              // }
              // });
              // $scope.compareData.FMW_PATCH.data.forEach(element => {
              // element.left_content_decoded = $scope.diffBase64Decode(element.left_content);
              // element.right_content_decoded = $scope.diffBase64Decode(element.right_content);
              // element.diff_lines = $scope.JsDiff.diffLines(element.left_content_decoded, element.right_content_decoded);
              // });
              // $scope.compareData.DATABASE_CFG.data.forEach(element => {
              // element.left_content_decoded = $scope.diffBase64Decode(element.left_content);
              // element.right_content_decoded = $scope.diffBase64Decode(element.right_content);
              // element.diff_lines = $scope.JsDiff.diffLines(element.left_content_decoded, element.right_content_decoded);
              // });

              // if ($scope.compareData.OS_CFG.left != null) {
              // $scope.compareData.OS_CFG.left.forEach(element => {
              // element.diff.data.forEach(element2 => {
              // element2.left_content_decoded = $scope.diffBase64Decode(element2.left_content);
              // element2.right_content_decoded = $scope.diffBase64Decode(element2.right_content);
              // element2.diff_lines = $scope.JsDiff.diffLines(element2.left_content_decoded, element2.right_content_decoded);
              // })
              // });
              // }
              // if ($scope.compareData.OS_CFG.right != null) {
              // $scope.compareData.OS_CFG.right.forEach(element => {
              // element.diff.data.forEach(element2 => {
              // element2.left_content_decoded = $scope.diffBase64Decode(element2.left_content);
              // element2.right_content_decoded = $scope.diffBase64Decode(element2.right_content);
              // element2.diff_lines = $scope.JsDiff.diffLines(element2.left_content_decoded, element2.right_content_decoded);
              // })
              // });
              // }

              Wait("stop");
            },
            function error(response) {
              $scope.diffErrorMessage = "Error at "
                .concat(url)
                .concat(" : ")
                .concat(response.statusText);
              $scope.compareData = null;
              $("html, body").animate({ scrollTop: 0 }, "slow");
              Wait("stop");
            }
          );
        } else {
          $scope.diffErrorMessage = "Please choose target environment";
          $("html, body").animate({ scrollTop: 0 }, "slow");
        }
      } else {
        $scope.diffErrorMessage = "Please choose source environment";
        $("html, body").animate({ scrollTop: 0 }, "slow");
      }
    };

    $scope.diffSwitchView = function(view) {
      $scope.diffView = view;
      if (view === "APP_CFG") {
        document.getElementById("diffAppButton").className =
          "btn btn-xs btn-primary";
      } else {
        document.getElementById("diffAppButton").className =
          "btn btn-xs Button-primary--hollow";
      }
      if (view === "DOMAIN_CFG") {
        document.getElementById("diffDomainButton").className =
          "btn btn-xs btn-primary";
      } else {
        document.getElementById("diffDomainButton").className =
          "btn btn-xs Button-primary--hollow";
      }
      if (view === "SOACONFIG") {
        document.getElementById("diffSoaConfigButton").className =
          "btn btn-xs btn-primary";
      } else {
        document.getElementById("diffSoaConfigButton").className =
          "btn btn-xs Button-primary--hollow";
      }
      if (view === "FMW_PATCH") {
        document.getElementById("diffFmwButton").className =
          "btn btn-xs btn-primary";
      } else {
        document.getElementById("diffFmwButton").className =
          "btn btn-xs Button-primary--hollow";
      }
      if (view === "DATABASE_CFG") {
        document.getElementById("diffDatabaseButton").className =
          "btn btn-xs btn-primary";
      } else {
        document.getElementById("diffDatabaseButton").className =
          "btn btn-xs Button-primary--hollow";
      }
      if (view === "OS_CFG") {
        document.getElementById("diffOSButton").className =
          "btn btn-xs btn-primary";
      } else {
        document.getElementById("diffOSButton").className =
          "btn btn-xs Button-primary--hollow";
      }
    };

    $scope.diffBase64Decode = function(input) {
      return atob(input);
    };

    $scope.formatProperty = function(propname, itemstatus) {
      if (propname === "inner_text" && itemstatus === "MODIFIED") {
        return "";
      }
      if (propname === null) {
        return "";
      }
      if (propname === "location" && itemstatus === "MODIFIED") {
        return "location";
      }
      return propname
        .concat("(")
        .concat(itemstatus)
        .concat(")");
    };

    $scope.formatStatus = function(itemstatus) {
      if (itemstatus === "REMOVED") {
        return "Missing in Target Environment ("
          .concat($scope.env2)
          .concat(")");
      }
      if (itemstatus === "ADDED") {
        return "Missing in Source Environment ("
          .concat($scope.env1)
          .concat(")");
      }
    };

    $scope.formatSourceValue = function(value) {
      if (value.indexOf("${") === 0) {
        return "Параметр не задан в конфиг-плане";
      } else {
        return value;
      }
    };

    $scope.formatOldValue = function(value) {
      return $scope.formatSourceValue(value);
    };

    $scope.formatTargetValue = function(value) {
      return $scope.formatSourceValue(value);
    };

    $scope.formatNewValue = function(value) {
      return $scope.formatSourceValue(value);
    };

    $scope.formatVersionValue = function(value) {
      if (value === null) {
        return "отсутствует";
      } else {
        return value;
      }
    };

    $scope.diffApply = function() {
      Wait("start");
      if (!$scope.isDisabledEnvironment($scope.env2)) {
        var inventoriesUrl = "/api/v2/inventories/"
          .concat("?search=")
          .concat($scope.env2);
        var jobTemplatesUrl = "/api/v2/job_templates/?search=Update+configs";
        var jobName = "Update configs";
        $http({ method: "GET", url: inventoriesUrl }).then(
          function success(response) {
            var inventoryID;
            var jobID;
            var inventoryIDFound = false;
            response.data.results.forEach(invElement => {
              if (invElement.name === $scope.env2) {
                inventoryIDFound = true;
                inventoryID = invElement.id;

                var msgToSend = {};
                msgToSend.env = $scope.env2;
                msgToSend.inventory = inventoryID;
                msgToSend.extra_vars = {};
                msgToSend.extra_vars.revision = $scope.env2Version;
                msgToSend.extra_vars.changes = [];

                $scope.compareData.APP_CFG.data.forEach(element => {
                  var DataToApply = {};
                  DataToApply.changes = [];
                  DataToApply.filepath = element.right_filepath;
                  DataToApply.path = "APP_CFG";

                  if (
                    element.diff !== null &&
                    element.diff !== "incompatible"
                  ) {
                    element.diff.forEach(element2 => {
                      if (element2.properties !== null) {
                        var Data = {};
                        Data.attrs = [];
                        element2.properties.forEach(element3 => {
                          if (element3 !== null && element3.checked) {
                            var propsdata = {};
                            propsdata.name = element3.full_name;
                            propsdata.value = element3.left_value;
                            Data.attrs.push(propsdata);
                          }
                        });
                        if (Data.attrs.length > 0) {
                          Data.xpath = element2.right_xpath;
                          DataToApply.changes.push(Data);
                        }
                      }
                    });
                  }
                  if (DataToApply.changes.length > 0) {
                    msgToSend.extra_vars.changes.push(DataToApply);
                  }
                });

                $scope.compareData.SOACONFIG.data.forEach(element => {
                  var DataToApply = {};
                  DataToApply.changes = [];
                  DataToApply.filepath = element.right_filepath;
                  DataToApply.path = "SOACONFIG";

                  if (
                    element.diff !== null &&
                    element.diff !== "incompatible"
                  ) {
                    element.diff.forEach(element2 => {
                      if (element2.properties !== null) {
                        var Data = {};
                        Data.attrs = [];
                        element2.properties.forEach(element3 => {
                          if (element3 !== null && element3.checked) {
                            var propsdata = {};
                            propsdata.name = element3.full_name;
                            propsdata.value = element3.left_value;
                            Data.attrs.push(propsdata);
                          }
                        });
                        if (Data.attrs.length > 0) {
                          Data.xpath = element2.right_xpath;
                          DataToApply.changes.push(Data);
                        }
                      }
                    });
                  }
                  if (DataToApply.changes.length > 0) {
                    msgToSend.extra_vars.changes.push(DataToApply);
                  }
                });

                console.log(msgToSend);

                $http({ method: "GET", url: jobTemplatesUrl }).then(
                  function success(responseJobs) {
                    responseJobs.data.results.forEach(jobElement => {
                      if (jobElement.name === jobName) {
                        jobID = jobElement.id;
                        var sendURL = "/api/v2/job_templates/"
                          .concat(jobID)
                          .concat("/launch/");
                        $http({
                          method: "POST",
                          url: sendURL,
                          data: msgToSend
                        }).then(
                          function success(responseSend) {
                            $scope.diffErrorMessage = null;
                            $scope.diffSuccessMessage = "SUCCESS at "
                              .concat(sendURL)
                              .concat(" : ")
                              .concat(responseSend.statusText);
                            $("html, body").animate({ scrollTop: 0 }, "slow");
                          },
                          function error(response) {
                            $scope.diffErrorMessage = "Error at "
                              .concat(sendURL)
                              .concat(" : ")
                              .concat(response.statusText);
                            $("html, body").animate({ scrollTop: 0 }, "slow");
                          }
                        );
                      }
                    });
                  },
                  function error(responseJobs) {
                    $scope.diffErrorMessage = "Error at "
                      .concat(jobTemplatesUrl)
                      .concat(" : ")
                      .concat(responseJobs.statusText);
                    $("html, body").animate({ scrollTop: 0 }, "slow");
                  }
                );
              }
            });

            if (!inventoryIDFound) {
              $scope.diffErrorMessage = "Error at "
                .concat(inventoriesUrl)
                .concat(" : ")
                .concat("inventory ")
                .concat($scope.env2)
                .concat(" not found");
              $("html, body").animate({ scrollTop: 0 }, "slow");
            }

            Wait("stop");
          },
          function error(response) {
            $scope.diffErrorMessage = "Error at "
              .concat(inventoriesUrl)
              .concat(" : ")
              .concat(response.statusText);
            $("html, body").animate({ scrollTop: 0 }, "slow");
            Wait("stop");
          }
        );
      } else {
        $scope.diffErrorMessage = "Error : "
          .concat($scope.env2)
          .concat(" environment is read-only!");
        $("#diffApplyButtonAPP").css("cursor", "not-allowed");
        $("#diffApplyButtonDOMAIN").css("cursor", "not-allowed");
        $("#diffApplyButtonSOA").css("cursor", "not-allowed");
        $("html, body").animate({ scrollTop: 0 }, "slow");
      }
    };

    // $scope.isDisabledEnvironment = function(env) {
    //   var disabledEnvironments = $scope.disabledEnvironments;
    //   var testDisabledEnv2 = false;
    //   disabledEnvironments.forEach(element => {
    //     if (env === element) {
    //       testDisabledEnv2 = true;
    //     }
    //   });
    //   return testDisabledEnv2;
    // };

    //     var msgToSend = {};
    //     msgToSend.commit_id = $scope.env2Version;
    //     msgToSend.env = $scope.env2;
    //     msgToSend.extravars = [];

    //     console.log(msgToSend);
    //     $scope.compareData.APP_CFG.forEach(element => {

    //         var DataToApply = {};
    //         DataToApply.filepath = element.right_filepath;
    //         DataToApply.path = 'APP_CFG';
    //         DataToApply.changes = [];
    //         if (element.diff != null && element.diff != 'incompatible') {
    //             console.log('ELEMENT1: '.concat(element));
    //             element.diff.forEach(element2 => {
    //                 console.log('ELEMENT2: '.concat(element2));
    //                 if (element2.properties != null) {
    //                     var Data = {};
    //                     Data.attrs = [];
    //                     element2.properties.forEach(element3 => {
    //                         console.log('ELEMENT3: '.concat(element3));
    //                         if (element3 != null && element3.checked) {
    //                             var propsdata = {};
    //                             propsdata.name = element3.full_name;
    //                             propsdata.value = element3.left_value;
    //                             Data.attrs.push(propsdata);
    //                             console.log('IN!');
    //                         }
    //                     })
    //                     if (Data.attrs.length > 0) {
    //                         Data.xpath = element2.right_xpath;
    //                         // Data.param = element2.param;
    //                         DataToApply.changes.push(Data);
    //                         console.log(Data);
    //                     }
    //                 }
    //             });

    //         }
    //         if (DataToApply.changes.length > 0) {
    //             msgToSend.extravars.push(DataToApply);
    //         }
    //     });
    // }

    $scope.generatePDF = function() {
      if ($scope.compareData !== null) {
        var env1 = $scope.env1.toUpperCase();
        var env2 = $scope.env2.toUpperCase();
        var pdfTitle = "ОТЧЕТ ПО ИТОГАМ СРАВНЕНИЯ КОНТУРОВ "
          .concat(env1)
          .concat(" И ")
          .concat(env2);
        var pdfTableAPPDifferenced = [["Композит", env1, env2]];
        var pdfTableAPPAbsent = [["Композит", env1, env2]];
        var pdfTableParametersDifferenced = [["", env1, env2]];
        var pdfTableSOADifferenced = [["", env1, env2]];
        var pdfTableDOMAINDifferenced = [["", env1, env2]];
        var pdfTableFMWDifferenced = [["Файл", env1, env2]];
        var pdfTableDATABASEDifferenced = [["Файл", env1, env2]];
        var pdfTableOSLeftDifferenced = [["Хост", "Файл", env1, env2]];
        var pdfTableOSRightDifferenced = [["Хост", "Файл", env1, env2]];
        $scope.compareData.APP_CFG.data.forEach(element => {
          if (element.diff !== "incompatible") {
            if (
              element.left_revision !== null &&
              element.right_revision !== null &&
              element.left_revision !== element.right_revision
            ) {
              pdfTableAPPDifferenced.push([
                element.config,
                element.left_revision,
                element.right_revision
              ]);
            }
            if (
              element.left_revision !== null &&
              element.right_revision === null
            ) {
              pdfTableAPPAbsent.push([
                element.config,
                element.left_revision,
                "-"
              ]);
            }
            if (
              element.left_revision === null &&
              element.right_revision !== null
            ) {
              pdfTableAPPAbsent.push([
                element.config,
                "-",
                element.right_revision
              ]);
            }
          }
        });
        $scope.compareData.APP_CFG.data.forEach(element => {
          var oldApp;
          if (element.diff !== null && element.diff !== "incompatible") {
            element.diff.forEach(element2 => {
              if (element2.properties !== null) {
                element2.properties.forEach(element3 => {
                  if (element.config !== oldApp) {
                    pdfTableParametersDifferenced.push([
                      { text: element.config, colSpan: 3, alignment: "center" },
                      {},
                      {}
                    ]);
                  }
                  pdfTableParametersDifferenced.push([
                    element2.pathText
                      .concat(" ")
                      .concat(
                        $scope.formatProperty(
                          element3.name,
                          element2.status.toUpperCase()
                        )
                      ),
                    $scope.formatSourceValue(element3.left_value),
                    $scope.formatSourceValue(element3.right_value)
                  ]);
                  oldApp = element.config;
                });
              }
            });
            // console.log(element);
          }
        });
        $scope.compareData.SOACONFIG.data.forEach(element => {
          if (element.diff !== null && element.diff !== "incompatible") {
            element.diff.forEach(element2 => {
              if (element2.properties !== null) {
                element2.properties.forEach(element3 => {
                  pdfTableSOADifferenced.push([
                    element.config
                      .concat("> ")
                      .concat(
                        element2.pathText
                          .concat(" ")
                          .concat(
                            $scope.formatProperty(
                              element3.name,
                              element2.status.toUpperCase()
                            )
                          )
                      ),
                    $scope.formatSourceValue(element3.left_value),
                    $scope.formatSourceValue(element3.right_value)
                  ]);
                });
              }
            });
            console.log(element);
          }
        });
        $scope.compareData.DOMAIN_CFG.data.forEach(element => {
          if (element.diff !== null && element.diff !== "incompatible") {
            element.diff.forEach(element2 => {
              if (element2.properties !== null) {
                element2.properties.forEach(element3 => {
                  pdfTableDOMAINDifferenced.push([
                    element.config
                      .concat("> ")
                      .concat(
                        element2.pathText
                          .concat(" ")
                          .concat(
                            $scope.formatProperty(
                              element3.name,
                              element2.status.toUpperCase()
                            )
                          )
                      ),
                    $scope.formatSourceValue(element3.left_value),
                    $scope.formatSourceValue(element3.right_value)
                  ]);
                });
              }
            });
            console.log(element);
          }
        });
        $scope.compareData.FMW_PATCH.data.forEach(element => {
          if (element.left_content !== null && element.right_content !== null) {
            pdfTableFMWDifferenced.push([
              element.file,
              element.left_content_decoded,
              element.right_content_decoded
            ]);
            console.log(element.diff_lines);
          } else {
            pdfTableFMWDifferenced.push([
              element.file,
              "Различий нет",
              "Различий нет"
            ]);
            console.log(element.diff_lines);
          }
        });
        $scope.compareData.DATABASE_CFG.data.forEach(element => {
          if (element.left_content !== null && element.right_content !== null) {
            pdfTableDATABASEDifferenced.push([
              element.file,
              element.left_content_decoded,
              element.right_content_decoded
            ]);
            console.log(element.diff_lines);
          } else {
            pdfTableDATABASEDifferenced.push([
              element.file,
              "Различий нет",
              "Различий нет"
            ]);
            console.log(element.diff_lines);
          }
        });
        $scope.compareData.OS_CFG.left.forEach(element => {
          element.diff.data.forEach(element2 => {
            if (
              element2.left_content !== null &&
              element2.right_content !== null
            ) {
              pdfTableOSLeftDifferenced.push([
                element.host,
                element2.file,
                element2.left_content_decoded,
                element2.right_content_decoded
              ]);
            } else {
              pdfTableOSLeftDifferenced.push([
                element.host,
                element2.file,
                "Различий нет",
                "Различий нет"
              ]);
            }
          });
        });
        $scope.compareData.OS_CFG.right.forEach(element => {
          element.diff.data.forEach(element2 => {
            if (
              element2.left_content !== null &&
              element2.right_content !== null
            ) {
              pdfTableOSRightDifferenced.push([
                element.host,
                element2.file,
                element2.left_content_decoded,
                element2.right_content_decoded
              ]);
            } else {
              pdfTableOSRightDifferenced.push([
                element.host,
                element2.file,
                "Различий нет",
                "Различий нет"
              ]);
            }
          });
        });

        console.log(pdfTableSOADifferenced);

        var myDocInfo = {
          pageSize: "A4",
          pageOrientation: "portrait", //'portrait'
          pageMargins: [30, 30, 30, 30],
          content: [
            {
              text: pdfTitle,
              fontSize: 20,
              margin: [150, 80, 30, 0],
              pageBreak: "after"
            },
            {
              text: "1	РАЗЛИЧИЕ ПО ВЕРСИЯМ КОМПОЗИТОВ",
              fontSize: 10,
              margin: [10, 10, 10, 0]
            },
            {
              text: "2	РАЗЛИЧИЕ ПО СОСТАВУ КОМПОЗИТОВ",
              fontSize: 10,
              margin: [10, 10, 10, 0]
            },
            {
              text: "3	ОТЛИЧИЯ ПО СВОЙСТВАМ КОМПОЗИТОВ",
              fontSize: 10,
              margin: [10, 10, 10, 0]
            },
            {
              text: "4	ОТЛИЧИЯ ПО СВОЙСТВАМ SOA",
              fontSize: 10,
              margin: [10, 10, 10, 0]
            },
            {
              text: "5	ОТЛИЧИЯ ПО СВОЙСТВАМ DOMAIN",
              fontSize: 10,
              margin: [10, 10, 10, 0]
            },
            {
              text: "6	ОТЛИЧИЯ ПО FUSION MIDDLEWARE",
              fontSize: 10,
              margin: [10, 10, 10, 0]
            },
            {
              text: "7	ОТЛИЧИЯ ПО DATABASE",
              fontSize: 10,
              margin: [10, 10, 10, 0]
            },
            {
              text: "8	ОТЛИЧИЯ ПО OS",
              fontSize: 10,
              margin: [10, 10, 10, 0],
              pageBreak: "after"
            },

            {
              text: "1	РАЗЛИЧИЕ ПО ВЕРСИЯМ КОМПОЗИТОВ",
              fontSize: 20,
              margin: [10, 80, 30, 0]
            },
            {
              table: {
                widths: [350, "auto", "auto"],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableAPPDifferenced
              }
            },
            {
              text: "2	РАЗЛИЧИЕ ПО СОСТАВУ КОМПОЗИТОВ",
              fontSize: 20,
              margin: [10, 80, 30, 0]
            },
            {
              table: {
                widths: [350, "auto", "auto"],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableAPPAbsent
              }
            },
            {
              text: "3	ОТЛИЧИЯ ПО СВОЙСТВАМ КОМПОЗИТОВ",
              fontSize: 20,
              margin: [10, 80, 30, 0]
            },
            {
              table: {
                widths: [180, 170, 170],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableParametersDifferenced
              }
            },
            {
              text: "4	ОТЛИЧИЯ ПО СВОЙСТВАМ SOA",
              fontSize: 20,
              margin: [10, 80, 30, 0]
            },
            {
              table: {
                widths: [180, 170, 170],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableSOADifferenced
              }
            },
            {
              text: "5	ОТЛИЧИЯ ПО СВОЙСТВАМ DOMAIN",
              fontSize: 20,
              margin: [10, 80, 30, 0]
            },
            {
              table: {
                widths: [180, 170, 170],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableDOMAINDifferenced
              }
            },
            {
              text: "6	ОТЛИЧИЯ ПО FUSION MIDDLEWARE",
              fontSize: 20,
              margin: [10, 80, 30, 0]
            },
            {
              table: {
                widths: [180, 170, 170],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableFMWDifferenced
              }
            },
            {
              text: "7	ОТЛИЧИЯ ПО DATABASE",
              fontSize: 20,
              margin: [10, 80, 30, 0]
            },
            {
              table: {
                widths: [180, 170, 170],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableDATABASEDifferenced
              }
            },
            {
              text: "8	ОТЛИЧИЯ ПО OS",
              fontSize: 20,
              margin: [10, 80, 30, 0]
            },
            {
              text: "Стенд ".concat($scope.env1),
              fontSize: 20,
              margin: [10, 30, 30, 0]
            },
            {
              table: {
                widths: [120, 120, 120, 120],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableOSLeftDifferenced
              }
            },
            {
              text: "Стенд ".concat($scope.env2),
              fontSize: 20,
              margin: [10, 30, 30, 0]
            },
            {
              table: {
                widths: [120, 120, 120, 120],
                headerRows: 1,
                // keepWithHeaderRows: 1,
                body: pdfTableOSRightDifferenced
              }
            }
          ]
        };

        pdfMake.createPdf(myDocInfo).download("report.pdf");
      }
    };

    $scope.JsDiff = (function() {
      /*jshint maxparams: 5*/
      function clonePath(path) {
        return {
          newPos: path.newPos,
          components: path.components.slice(0)
        };
      }

      function removeEmpty(array) {
        var ret = [];
        for (var i = 0; i < array.length; i++) {
          if (array[i]) {
            ret.push(array[i]);
          }
        }
        return ret;
      }

      function escapeHTML(s) {
        var n = s;
        n = n.replace(/&/g, "&amp;");
        n = n.replace(/</g, "&lt;");
        n = n.replace(/>/g, "&gt;");
        n = n.replace(/"/g, "&quot;");

        return n;
      }

      var Diff = function(ignoreWhitespace) {
        this.ignoreWhitespace = ignoreWhitespace;
      };
      Diff.prototype = {
        diff: function(oldString, newString) {
          // Handle the identity case (this is due to unrolling editLength == 0
          if (newString === oldString) {
            return [
              {
                value: newString
              }
            ];
          }
          if (!newString) {
            return [
              {
                value: oldString,
                removed: true
              }
            ];
          }
          if (!oldString) {
            return [
              {
                value: newString,
                added: true
              }
            ];
          }

          newString = this.tokenize(newString);
          oldString = this.tokenize(oldString);

          var newLen = newString.length,
            oldLen = oldString.length;
          var maxEditLength = newLen + oldLen;
          var bestPath = [
            {
              newPos: -1,
              components: []
            }
          ];

          // Seed editLength = 0
          var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
          if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
            return bestPath[0].components;
          }

          for (var editLength = 1; editLength <= maxEditLength; editLength++) {
            for (
              var diagonalPath = -1 * editLength;
              diagonalPath <= editLength;
              diagonalPath += 2
            ) {
              var basePath;
              var addPath = bestPath[diagonalPath - 1],
                removePath = bestPath[diagonalPath + 1];
              oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
              if (addPath) {
                // No one else is going to attempt to use this value, clear it
                bestPath[diagonalPath - 1] = undefined;
              }

              var canAdd = addPath && addPath.newPos + 1 < newLen;
              var canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
              if (!canAdd && !canRemove) {
                bestPath[diagonalPath] = undefined;
                continue;
              }

              // Select the diagonal that we want to branch from. We select the prior
              // path whose position in the new string is the farthest from the origin
              // and does not pass the bounds of the diff graph
              if (
                !canAdd ||
                (canRemove && addPath.newPos < removePath.newPos)
              ) {
                basePath = clonePath(removePath);
                this.pushComponent(
                  basePath.components,
                  oldString[oldPos],
                  undefined,
                  true
                );
              } else {
                basePath = clonePath(addPath);
                basePath.newPos++;
                this.pushComponent(
                  basePath.components,
                  newString[basePath.newPos],
                  true,
                  undefined
                );
              }

              var oldPos = this.extractCommon(
                basePath,
                newString,
                oldString,
                diagonalPath
              );

              if (basePath.newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
                return basePath.components;
              } else {
                bestPath[diagonalPath] = basePath;
              }
            }
          }
        },

        pushComponent: function(components, value, added, removed) {
          var last = components[components.length - 1];
          if (last && last.added === added && last.removed === removed) {
            // We need to clone here as the component clone operation is just
            // as shallow array clone
            components[components.length - 1] = {
              value: this.join(last.value, value),
              added: added,
              removed: removed
            };
          } else {
            components.push({
              value: value,
              added: added,
              removed: removed
            });
          }
        },
        extractCommon: function(basePath, newString, oldString, diagonalPath) {
          var newLen = newString.length,
            oldLen = oldString.length,
            newPos = basePath.newPos,
            oldPos = newPos - diagonalPath;
          while (
            newPos + 1 < newLen &&
            oldPos + 1 < oldLen &&
            this.equals(newString[newPos + 1], oldString[oldPos + 1])
          ) {
            newPos++;
            oldPos++;

            this.pushComponent(
              basePath.components,
              newString[newPos],
              undefined,
              undefined
            );
          }
          basePath.newPos = newPos;
          return oldPos;
        },

        equals: function(left, right) {
          var reWhitespace = /\S/;
          if (
            this.ignoreWhitespace &&
            !reWhitespace.test(left) &&
            !reWhitespace.test(right)
          ) {
            return true;
          } else {
            return left === right;
          }
        },
        join: function(left, right) {
          return left + right;
        },
        tokenize: function(value) {
          return value;
        }
      };

      var CharDiff = new Diff();

      var WordDiff = new Diff(true);
      WordDiff.tokenize = function(value) {
        return removeEmpty(value.split(/(\s+|\b)/));
      };

      var CssDiff = new Diff(true);
      CssDiff.tokenize = function(value) {
        return removeEmpty(value.split(/([{}:;,]|\s+)/));
      };

      var LineDiff = new Diff();
      LineDiff.tokenize = function(value) {
        return value.split(/^/m);
      };

      return {
        Diff: Diff,

        diffChars: function(oldStr, newStr) {
          return CharDiff.diff(oldStr, newStr);
        },
        diffWords: function(oldStr, newStr) {
          return WordDiff.diff(oldStr, newStr);
        },
        diffLines: function(oldStr, newStr) {
          return LineDiff.diff(oldStr, newStr);
        },

        diffCss: function(oldStr, newStr) {
          return CssDiff.diff(oldStr, newStr);
        },

        createPatch: function(fileName, oldStr, newStr, oldHeader, newHeader) {
          var ret = [];

          ret.push("Index: " + fileName);
          ret.push(
            "==================================================================="
          );
          ret.push(
            "--- " +
              fileName +
              (typeof oldHeader === "undefined" ? "" : "\t" + oldHeader)
          );
          ret.push(
            "+++ " +
              fileName +
              (typeof newHeader === "undefined" ? "" : "\t" + newHeader)
          );

          var diff = LineDiff.diff(oldStr, newStr);
          if (!diff[diff.length - 1].value) {
            diff.pop(); // Remove trailing newline add
          }
          diff.push({
            value: "",
            lines: []
          }); // Append an empty value to make cleanup easier

          function contextLines(lines) {
            return lines.map(function(entry) {
              return " " + entry;
            });
          }

          function eofNL(curRange, i, current) {
            var last = diff[diff.length - 2],
              isLast = i === diff.length - 2,
              isLastOfType =
                i === diff.length - 3 &&
                (current.added !== last.added ||
                  current.removed !== last.removed);

            // Figure out if this is the last line for the given file and missing NL
            if (!/\n$/.test(current.value) && (isLast || isLastOfType)) {
              curRange.push("\\ No newline at end of file");
            }
          }

          var oldRangeStart = 0,
            newRangeStart = 0,
            curRange = [],
            oldLine = 1,
            newLine = 1;
          for (var i = 0; i < diff.length; i++) {
            var current = diff[i],
              lines =
                current.lines || current.value.replace(/\n$/, "").split("\n");
            current.lines = lines;

            if (current.added || current.removed) {
              if (!oldRangeStart) {
                var prev = diff[i - 1];
                oldRangeStart = oldLine;
                newRangeStart = newLine;

                if (prev) {
                  curRange = contextLines(prev.lines.slice(-4));
                  oldRangeStart -= curRange.length;
                  newRangeStart -= curRange.length;
                }
              }
              curRange.push.apply(
                curRange,
                lines.map(entry => {
                  return (current.added ? "+" : "-") + entry;
                })
              );
              eofNL(curRange, i, current);

              if (current.added) {
                newLine += lines.length;
              } else {
                oldLine += lines.length;
              }
            } else {
              if (oldRangeStart) {
                // Close out any changes that have been output (or join overlapping)
                if (lines.length <= 8 && i < diff.length - 2) {
                  // Overlapping
                  curRange.push.apply(curRange, contextLines(lines));
                } else {
                  // end the range and output
                  var contextSize = Math.min(lines.length, 4);
                  ret.push(
                    "@@ -" +
                      oldRangeStart +
                      "," +
                      (oldLine - oldRangeStart + contextSize) +
                      " +" +
                      newRangeStart +
                      "," +
                      (newLine - newRangeStart + contextSize) +
                      " @@"
                  );
                  ret.push.apply(ret, curRange);
                  ret.push.apply(
                    ret,
                    contextLines(lines.slice(0, contextSize))
                  );
                  if (lines.length <= 4) {
                    eofNL(ret, i, current);
                  }

                  oldRangeStart = 0;
                  newRangeStart = 0;
                  curRange = [];
                }
              }
              oldLine += lines.length;
              newLine += lines.length;
            }
          }

          return ret.join("\n") + "\n";
        },

        applyPatch: function(oldStr, uniDiff) {
          var diffstr = uniDiff.split("\n");
          var diff = [];
          var remEOFNL = false,
            addEOFNL = false;

          for (var i = diffstr[0][0] === "I" ? 4 : 0; i < diffstr.length; i++) {
            if (diffstr[i][0] === "@") {
              var meh = diffstr[i].split(/@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
              diff.unshift({
                start: meh[3],
                oldlength: meh[2],
                oldlines: [],
                newlength: meh[4],
                newlines: []
              });
            } else if (diffstr[i][0] === "+") {
              diff[0].newlines.push(diffstr[i].substr(1));
            } else if (diffstr[i][0] === "-") {
              diff[0].oldlines.push(diffstr[i].substr(1));
            } else if (diffstr[i][0] === " ") {
              diff[0].newlines.push(diffstr[i].substr(1));
              diff[0].oldlines.push(diffstr[i].substr(1));
            } else if (diffstr[i][0] === "\\") {
              if (diffstr[i - 1][0] === "+") {
                remEOFNL = true;
              } else if (diffstr[i - 1][0] === "-") {
                addEOFNL = true;
              }
            }
          }

          var str = oldStr.split("\n");
          for (let i = diff.length - 1; i >= 0; i--) {
            var d = diff[i];
            for (var j = 0; j < d.oldlength; j++) {
              if (str[d.start - 1 + j] !== d.oldlines[j]) {
                return false;
              }
            }
            Array.prototype.splice.apply(
              str,
              [d.start - 1, +d.oldlength].concat(d.newlines)
            );
          }

          if (remEOFNL) {
            while (!str[str.length - 1]) {
              str.pop();
            }
          } else if (addEOFNL) {
            str.push("");
          }
          return str.join("\n");
        },

        convertChangesToXML: function(changes) {
          var ret = [];
          for (var i = 0; i < changes.length; i++) {
            var change = changes[i];
            if (change.added) {
              ret.push("<ins class='diff'>");
            } else if (change.removed) {
              ret.push("<del class='diff'>");
            }

            ret.push(escapeHTML(change.value));

            if (change.added) {
              ret.push("</ins>");
            } else if (change.removed) {
              ret.push("</del>");
            }
          }
          return ret.join("");
        },

        // See: http://code.google.com/p/google-diff-match-patch/wiki/API
        convertChangesToDMP: function(changes) {
          var ret = [],
            change;
          for (var i = 0; i < changes.length; i++) {
            change = changes[i];
            ret.push([
              change.added ? 1 : change.removed ? -1 : 0,
              change.value
            ]);
          }
          return ret;
        }
      };
    })();
  }
];
