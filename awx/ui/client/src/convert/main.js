/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

import controller from "./convert.controller";
import route from "./convert.route";

export default angular
  .module("convert", [])
  .factory('Uploadfile', function($q, $rootScope, $cookies) {
    this.load = function(url, file) {
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
  // .directive("fileChange", function() {
  //   return {
  //     restrict: 'A',
  //     link: function(scope, element, attrs){
  //       element.bind('change', function() {
  //         scope.$apply(function() {
  //           scope[attrs['fileChange']](element[0].files, element[0], attrs);
  //         })
  //       })
  //     },
  //   }
  // })
  .controller("convert", controller)
  .run([
    "$stateExtender",
    function($stateExtender) {
      $stateExtender.addState(route);
    }
  ]);