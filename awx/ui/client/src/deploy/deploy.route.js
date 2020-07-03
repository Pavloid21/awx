import { templateUrl } from "../shared/template-url/template-url.factory";
import controller from "./deploy.controller";
import { N_ } from "../i18n";

export default {
  searchPrefix: "deploy",
  name: "deploy",
  route: "/deploy",
  controller: controller,
  ncyBreadcrumb: {
    label: N_("DEPLOY CONFIGURATION")
  },
  params: {
    deploy_search: {
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
    Dataset: [
      "$stateParams",
      "Wait",
      "GetBasePath",
      "QuerySet",
      ($stateParams, Wait, GetBasePath, qs) => {
        const searchParam = $stateParams.deploy_search;
        const searchPath = GetBasePath("deploy_history") || 'api/v2/deploy_history';
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
  templateUrl: templateUrl("deploy/deploy")
};
