/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

import controller from "./deploytemplate.controller";
import route from "./deploytemplate.route";

export default angular
  .module("deploytemplate", [])
  .factory('Uploader', function($q, $rootScope, $cookies) {
    this.upload = function(url, file) {
      var deferred = $q.defer(),
          formdata = new FormData(),
          xhr = new XMLHttpRequest();
      formdata.append('file', file);

      xhr.onreadystatechange = function(r) {
        if (4 === this.readyState) {
          if (xhr.status == 200) {
            $rootScope.$apply(function() {
              deferred.resolve(xhr);  
            });
          } else {
            $rootScope.$apply(function() {
              deferred.reject(xhr);  
            });
          }
        }
      }
      xhr.open("POST", url, true);
      xhr.setRequestHeader('X-CSRFToken', $cookies.get('csrftoken'))
      xhr.setRequestHeader('Content-Disposition', 'form-data')
      xhr.send(formdata);
      return deferred.promise;
    };
    return this;
  })
  .controller("deploytemplate", controller)
  .directive( 'elemReady', function( $parse ) {
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
