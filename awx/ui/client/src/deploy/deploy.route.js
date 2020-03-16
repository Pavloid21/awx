import { templateUrl } from "../shared/template-url/template-url.factory";
import controller from "./deploy.controller";
import { N_ } from "../i18n";

export default {
  name: "deploy",
  route: "/deploy",
  controller: controller,
  ncyBreadcrumb: {
    label: N_("DEPLOY CONFIGURATION")
  },
  resolve: {
    lastPath: function($location) {
      return $location.url();
    }
  },
  onExit: function() {
    // hacky way to handle user browsing away via URL bar
    $(".modal-backdrop").remove();
    $("body").removeClass("modal-open");
  },
  templateUrl: templateUrl("deploy/deploy")
};
