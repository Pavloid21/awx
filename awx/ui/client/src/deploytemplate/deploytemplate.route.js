import { templateUrl } from "../shared/template-url/template-url.factory";
import controller from "./deploytemplate.controller";
import { N_ } from "../i18n";

export default {
  searchPrefix: "deptemplate",
  name: "deptemplate",
  route: "/deptemplate",
  controller: controller,
  ncyBreadcrumb: {
    label: N_("DEPLOY TEMPLATES")
  },
  params: {
    deploytemplate_search: {
      dynamic: true,
      value: {
        page_size: 10,
        order_by: '-created'
      }
    },
    deploy_search: {
      dynamic: true,
      value: {
        page_size: 10,
        order_by: '-created',
        not__status: 'start',
        prev_step_id__isnull: 1
      }
    },
    action_search: {
      dynamic: true,
      value: {
        page_size: 10,
        order_by: '-created',
      }
    }
  },
  resolve: {
    Dataset: [
      "$stateParams",
      "Wait",
      "GetBasePath",
      "QuerySet",
      ($stateParams, Wait, GetBasePath, qs) => {
        const searchParam = $stateParams.deploytemplate_search;
        const searchPath = GetBasePath("deploy_template") || 'api/v2/deploy_template/';
        Wait("start");
        return qs.search(searchPath, searchParam).finally(() => Wait("stop"));
      }
    ],
    History: [
      "$stateParams",
      "Wait",
      "GetBasePath",
      "QuerySet",
      ($stateParams, Wait, GetBasePath, qs) => {
        const searchParam = $stateParams.deploy_search;
        const searchPath = GetBasePath("deploy_history") || 'api/v2/deploy_history/';
        Wait("start");
        return qs.search(searchPath, searchParam).finally(() => Wait("stop"));
      }
    ],
    Actions: [
      "$stateParams",
      "Wait",
      "GetBasePath",
      "QuerySet",
      ($stateParams, Wait, GetBasePath, qs) => {
        const searchParam = $stateParams.action_search;
        const searchPath = GetBasePath("deploy_history") || 'api/v2/action/';
        Wait("start");
        return qs.search(searchPath, searchParam).finally(() => Wait("stop"));
      }
    ]
  },
  onExit: function() {
    // hacky way to handle user browsing away via URL bar
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");
  },
  templateUrl: templateUrl("deploytemplate/deploytemplate")
};
