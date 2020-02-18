import {templateUrl} from '../shared/template-url/template-url.factory';
import controller from './diff.controller';
import { N_ } from '../i18n';

export default {
    name: 'diff',
    route: '/diff',
    controller: controller,
    ncyBreadcrumb: {
        label: N_("DIFF")
    },
    resolve: {
        lastPath: function($location) {
            return $location.url();
        }
    },
    onExit: function(){
        // hacky way to handle user browsing away via URL bar
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open');
    },
    templateUrl: templateUrl('diff/diff')
};

