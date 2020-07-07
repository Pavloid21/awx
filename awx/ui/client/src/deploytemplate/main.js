/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

import controller from "./deploytemplate.controller";
import route from "./deploytemplate.route";

export default angular
  .module("deploytemplate", [])
  .controller("deploytemplate", controller)
  .directive('elemReady', function( $parse ) {
    return {
        restrict: 'A',
        link: function( $scope, elem, attrs ) {  
           elem.resize(function(){
            $scope.$apply(function(){
                var func = $parse(attrs.elemReady);
                func($scope);
            })
          })
        }
     }
 })
  .run([
    "$stateExtender",
    function($stateExtender) {
      $stateExtender.addState(route);
    }
  ]);
