/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

import controller from "./deploy.controller";
import route from "./deploy.route";

export default angular
  .module("deploy", [])
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
  .directive("fileChange", function() {
    return {
      restrict: 'A',
      link: function(scope, element, attrs){
        element.bind('change', function() {
          scope.$apply(function() {
            scope[attrs['fileChange']](element[0].files);
          })
        })
      },
    }
  })
  .controller("deploy", controller)
  .run([
    "$stateExtender",
    function($stateExtender) {
      $stateExtender.addState(route);
    }
  ]);
