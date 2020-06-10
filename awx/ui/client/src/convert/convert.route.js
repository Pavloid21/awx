import { templateUrl } from "../shared/template-url/template-url.factory";
import controller from "./convert.controller";
import { N_ } from "../i18n";

let env = null;

let xhr = new XMLHttpRequest();
xhr.open('GET', '/git/api/env/', false);

try {
  xhr.send();
  if (xhr.status !== 200) {
    console.log('error')
  } else {
    env = JSON.parse(xhr.response)
  }
} catch (e) {
  console.log(e)
}

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
        page_size: 10,
      }
    },
    sql2excel_search: {
      dynamic: true,
      value: {
        page_size: 10,
        order_by: '-created',
      }
    },
    excel2sql_search: {
      dynamic: true,
      value: {
        page_size: 10,
        order_by: '-created'
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
        console.log(env)
        const searchParam = $stateParams.diff_search;
        const searchPath = `'diff/jobs/'`;
        Wait("start");
        return [];
      }
    ],
    SQL2EXCEL: [
      "$stateParams",
      "Wait",
      "GetBasePath",
      "QuerySet",
      ($stateParams, Wait, GetBasePath, qs) => {
        const searchParam = $stateParams.sql2excel_search;
        const searchPath = `/api/v2/jobs?unified_job_template=${env['CONVERT_XLSX_JOB_ID']}&status=successful&order_by=-created`;
        Wait("start");
        return qs.search(searchPath, searchParam).finally(() => Wait("stop"));
      }
    ],
    EXCEL2SQL: [
      "$stateParams",
      "Wait",
      "GetBasePath",
      "QuerySet",
      ($stateParams, Wait, GetBasePath, qs) => {
        const searchParam = $stateParams.excel2sql_search;
        const searchPath = `/api/v2/jobs?unified_job_template=${env['CONVERT_DICT_JOB_ID']}&status=successful&order_by=-created`;
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
