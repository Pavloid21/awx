import { templateUrl } from "../shared/template-url/template-url.factory";
import controller from "./diff.controller";
import { N_ } from "../i18n";

export default {
  name: "diff",
  route: "/diff",
  controller: controller,
  ncyBreadcrumb: {
    label: N_("COMPARE CONFIGURATIONS")
  },
  params: {
    diff_search: {
      dynamic: true,
      value: {
        page_size: 10,
        order_by: '-finished',
        search: 'Compare'
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
      "GetBasePath",
      "QuerySet",
      ($stateParams, GetBasePath, qs) => {
        const searchParam = $stateParams.diff_search;
        const searchPath = GetBasePath('jobs');
        return qs.search(searchPath, searchParam);
      }
    ],
  },
  onExit: function() {
    // hacky way to handle user browsing away via URL bar
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");
  },
  templateUrl: templateUrl("diff/diff")
};
