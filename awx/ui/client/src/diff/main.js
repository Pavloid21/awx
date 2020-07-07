/*************************************************
 * Copyright (c) 2016 Ansible, Inc.
 *
 * All Rights Reserved
 *************************************************/

import controller from "./diff.controller";
import route from "./diff.route";
import ProjectsStrings from './../../features/projects/projects.strings';

export default angular
  .module("diff", [])
  .controller("diff", controller)
  .service('ProjectsStrings', ProjectsStrings)
  .run([
    "$stateExtender",
    function($stateExtender) {
      $stateExtender.addState(route);
    }
  ]);
