import { templateUrl } from "../shared/template-url/template-url.factory";
import controller from "./convert.controller";
import { N_ } from "../i18n";

export default {
  name: "convert",
  route: "/convert",
  controller: controller,
  ncyBreadcrumb: {
    label: N_("CONVERT FILES")
  },
  params: {
    diff_search: {
      dynamic: true,
      value: {
        page_size: 20,
        order_by: '-finished',
        search: 'Compare'
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
        const searchParam = $stateParams.diff_search;
        const searchPath = 'diff/jobs/';
        Wait("start");
        return qs.search(searchPath, searchParam).finally(() => Wait("stop"));
      }
    ],
  },
  onExit: function() {
    // hacky way to handle user browsing away via URL bar
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");
  },
  templateUrl: templateUrl("convert/convert")
};
