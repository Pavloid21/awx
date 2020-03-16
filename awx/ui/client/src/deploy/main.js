/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

import controller from "./deploy.controller";
import route from "./deploy.route";

export default angular
  .module("deploy", [])
  .controller("deploy", controller)
  .run([
    "$stateExtender",
    function($stateExtender) {
      $stateExtender.addState(route);
    }
  ]);
