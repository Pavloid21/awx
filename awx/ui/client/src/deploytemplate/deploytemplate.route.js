import { templateUrl } from "../shared/template-url/template-url.factory";
import controller from "./deploytemplate.controller";
import { N_ } from "../i18n";

export default {
  searchPrefix: "deploy_history",
  name: "deptemplate",
  route: "/deptemplate",
  controller: controller,
  ncyBreadcrumb: {
    label: N_("DEPLOY TEMPLATES")
  },
  params: {
    deploy_template_search: {
      dynamic: true,
      value: {
        page_size: 10,
        order_by: '-created'
      }
    },
    deploy_history_search: {
      dynamic: true,
      value: {
        page_size: 10,
        order_by: '-created',
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
  data: {
    socket: {
        groups: {
            jobs: ["status_changed"]
        }
    }
  },
  resolve: {
    lastPath: function($location) {
      return $location.url();
    },
    Dataset: [
      "$stateParams",
      "Wait",
      "GetBasePath",
      "QuerySet",
      ($stateParams, Wait, GetBasePath, qs) => {
        const searchParam = $stateParams.deploy_template_search;
        const searchPath = GetBasePath("deploy_template");
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
        const searchParam = $stateParams.deploy_history_search;
        const searchPath = GetBasePath("deploy_history");
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
        const searchPath = GetBasePath("action");
        Wait("start");
        return qs.search(searchPath, searchParam).finally(() => Wait("stop"));
      }
    ],
    SearchBasePath: [
      'GetBasePath',
      (GetBasePath) => {
        return GetBasePath('deploy_history')
      }
    ],
    SearchBasePathTemplate: [
      'GetBasePath',
      (GetBasePath) => {
        return GetBasePath('deploy_template')
      }
    ],
    SearchBasePathAction: [
      'GetBasePath',
      (GetBasePath) => {
        return GetBasePath('action')
      }
    ],
    resolvedModels: [
      'DeployHistoryModel',
      'DeployTemplateModel',
      'ActionModel',
      (DeployHistory, DeployTemplateModel, ActionModel) => {
          const models = [
              new DeployHistory(['options']),
              new DeployTemplateModel(['options']),
              new ActionModel(['options']),
          ];
          return Promise.all(models);
      },
    ],
  },
  onExit: function() {
    // hacky way to handle user browsing away via URL bar
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");
  },
  templateUrl: templateUrl("deploytemplate/deploytemplate")
};
