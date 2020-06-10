from abc import ABC, abstractmethod
from tempfile import TemporaryDirectory, NamedTemporaryFile, gettempdir
from os.path import join, getsize, basename, relpath, isdir, isfile
from os import makedirs, rename, listdir, walk
from re import compile
from filecmp import cmp
from subprocess import run, DEVNULL
from lxml import etree
from datetime import datetime
from copy import deepcopy
from base64 import b64encode


BRANCH_PREFIX = 'refs/heads/'
DIFF_BRANCH = 'diff'
CLONE_DIR_NAME = 'REPO'
LEFT_DIR_NAME = 'LEFT'
RIGHT_DIR_NAME = 'RIGHT'
COMMON_DIR_NAME = 'COMMON'

RE_COMPOSITE_FILENAME = compile(r'^(?P<name>.*?)_rev(?P<revision>.*?)_(?:.*?)\.composite\.xml$')

# TODO improve regex
RE_CONFIG_FILENAME = compile(r'^(?P<name>.*?)(?:-\d+-(?:\w+?)|)\.xml$')

COMPOSITE_DIR_NAME = 'APP_CFG'
DOMAIN_CFG_DIR_NAME = 'DOMAIN_CFG'
SOACONFIG_DIR_NAME = 'SOACONFIG'
FMW_PATCH_DIR_NAME = 'FMW_PATCH'
DATABASE_CFG_DIR_NAME = 'DATABASE_CFG'
OS_CFG_DIR_NAME = 'OS_CFG'
OS_STANDART_DIR_NAME = 'OS_STANDART'

RW_ENVIRONMENTS_FILE_NAME = 'rw_environments'

RE_SECTIONS = compile(r'\w+')

SECTIONS = {COMPOSITE_DIR_NAME, DOMAIN_CFG_DIR_NAME, SOACONFIG_DIR_NAME, FMW_PATCH_DIR_NAME, DATABASE_CFG_DIR_NAME, OS_CFG_DIR_NAME}

DIFF_SEP = '|diff|'

XMLDIFF_BIN = '/usr/local/bin/xmldiff'
GIT_BIN = '/usr/bin/git'

XMLDIFF_XPATH_ALL = "//*[@diff:status != 'below' and not(ancestor::*[@diff:status='added'] or ancestor::*[@diff:status='removed'])]"
XMLDIFF_XPATH_ADDED = "//*[@diff:status = 'added']"
XMLDIFF_XPATH_REMOVED = "//*[@diff:status = 'removed']"
XMLDIFF_XPATH_MODIFIED = "//*[@diff:status = 'modified']"

RE_NS = compile(r'^\{.*?\}')


class DiffRepositoryEntity(object):

    DEFAULT_NAME = 'Unnamed entity'
    DEFAULT_DISPLAY_NAME = None
    REPR_STRING = '{class_name}: "{name} ({id})"'

    def __init__(self, repository, id, name=None, display_name=None, **kwargs):
        self._repository = repository
        self._id = id
        self._name = name if name is not None else self.DEFAULT_NAME
        self._display_name = display_name if display_name is not None else self.DEFAULT_DISPLAY_NAME
        self._display_name = self._name if self._display_name is None else self._display_name

    def __repr__(self):
        return self.REPR_STRING.format(class_name=self.__class__.__name__, name=self._name, id=self._id)

    @property
    def repository(self):
        return self._repository

    @property
    def id(self):
        return self._id

    @property
    def name(self):
        return self._name

    @property
    def display_name(self):
        return self._display_name


class DiffEnvironment(DiffRepositoryEntity):

    DEFAULT_NAME = 'Unnamed environment'

    def __iter__(self):
        return self._repository.get_versions(self)

    # TODO rewrite with slice
    def get_version_at(self, number):
        counter = 0
        for version in self._repository.get_versions(self):
            if counter == number:
                return version
            counter += 1
        raise IndexError

    # TODO all
    def get_version_slice(self, start=None, stop=None, step=None):
        pass

    @property
    def last_version(self):
        return self.get_version_at(0)

    @property
    def versions(self):
        return self._repository.get_versions(self)


class DiffVersion(DiffRepositoryEntity):

    DEFAULT_NAME = 'Unnamed version'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        sections = kwargs.get('sections')
        self._sections = tuple(sections) if sections else ()

    def compare_to(self, other):
        return self._repository.compare(self, other)

    @property
    def sections(self):
        return self._sections

class DiffRepository(ABC):

    REPR_STRING='{class_name}: "{url}"'

    def __init__(self, url, *args, **kwargs):
        self._url = url
        self._repository = self._get_repository(self._url)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def __repr__(self):
        return self.REPR_STRING.format(class_name=self.__class__.__name__, url=self._url)

    def __iter__(self):
        return self._get_environments()

    # STUB
    @staticmethod
    def open(url, *args, **kwargs):
        return DiffRepositoryDulwich(url, *args, **kwargs)

    @property
    def url(self):
        return self._url

    @property
    def environments(self):
        return self._get_environments()

    def get_versions(self, environment):
        return self._get_versions(environment)

    def get_environment_by_id(self, id):
        return self._get_environment_by_id(id)

    def get_environment_by_name(self, name):
        return self._get_environment_by_name(name)

    def get_version_by_id(self, id):
        return self._get_version_by_id(id)

    def compare(self, left_version, right_version):
        return self._compare(left_version, right_version)

    def close(self):
        pass

    def _make_environment(self, id, name=None, display_name=None):
        return DiffEnvironment(self, id, name, display_name)

    def _make_version(self, id, name=None, display_name=None, sections=None):
        return DiffVersion(self, id, name, display_name, sections=sections)

    @abstractmethod
    def _get_environment_by_id(self, id):
        pass

    @abstractmethod
    def _get_environment_by_name(self, name):
        pass

    @abstractmethod
    def _get_version_by_id(self, id):
        pass

    @abstractmethod
    def _get_repository(self, url):
        pass

    @abstractmethod
    def _get_environments(self):
        pass

    @abstractmethod
    def _get_versions(self, environment):
        pass

    @abstractmethod
    def _compare(self, left_version, right_version):
        pass


class DiffRepositoryDulwich(DiffRepository):

    DEFAULT_SKIP_BRANCHES = ('master', DIFF_BRANCH)
    DEFAULF_TEMP_BASE_DIR = 'diff_repository'

    def __init__(self, url, *args, **kwargs):
        super().__init__(url, *args, **kwargs)
        self._skip_branches = (*kwargs.get('skip_branches', self.DEFAULT_SKIP_BRANCHES),)
        self.TEMP_BASE_DIR = kwargs.get('temp_base_dir', self.DEFAULF_TEMP_BASE_DIR)
        self.TEMP_BASE_PATH = join(gettempdir(), self.TEMP_BASE_DIR)

    def close(self):
        self._repository.close()

    @staticmethod
    def _get_branch_id(branch_name):
        return '{branch_prefix}{branch_name}'.format(branch_prefix=BRANCH_PREFIX, branch_name=branch_name)

    @staticmethod
    def _get_branch_name(branch_id):
        return branch_id.replace(BRANCH_PREFIX, '')

    @staticmethod
    def _get_commit_id(commit):
        return commit.id.decode('utf8')

    @staticmethod
    def _get_commit_name(commit):
        return datetime.utcfromtimestamp(commit.commit_time + commit.commit_timezone).strftime('%Y-%m-%d %H:%M:%S')

    @staticmethod
    def _get_repository(url):
        return Repo(url)

    def _get_environments(self):
        branch_dict = self._repository.refs.as_dict(base=BRANCH_PREFIX.encode('utf8'))
        for branch_key in branch_dict:
            branch_name = branch_key.decode('utf8')
            branch_id = self._get_branch_id(branch_name)
            if branch_name in self._skip_branches:
                continue
            yield self._make_environment(branch_id, branch_name)

    # TODO refactor
    def _get_commit_sections(self, commit):
        message = commit.message.decode('utf8')
        message_sections = set(RE_SECTIONS.findall(message))
        return message_sections & SECTIONS

    # TODO refactor
    def _get_versions(self, environment):
        branch = self._repository.refs[environment.id.encode('utf8')]
        walker = self._repository.get_walker(include=(branch,))
        for entry in walker:
            commit = entry.commit
            if not commit.parents:
                break
            yield self._make_version(self._get_commit_id(commit), self._get_commit_name(commit), sections=self._get_commit_sections(commit))

    def _get_environment_by_id(self, id):
        #branch = self._repository.refs[id.encode('utf8')]
        branch_name = self._get_branch_name(id)
        return self._make_environment(id, branch_name)

    def _get_environment_by_name(self, name):
        branch_id = self._get_branch_id(name)
        #branch = self._repository.refs[branch_id.encode('utf8')]
        return self._make_environment(branch_id, name)

    # TODO refactor
    def _get_version_by_id(self, id):
        commit = self._repository[id.encode('utf8')]
        return self._make_version(self._get_commit_id(commit), self._get_commit_name(commit), sections=self._get_commit_sections(commit))

    # TODO add "exclude" list instead of hardcoding (".git")
    def _checkout_commit(self, repository, commit, path):
        tree = repository[commit].tree
        repository.reset_index(tree)
        for item in listdir(repository.path):
            if item == '.git':
                continue
            rename(join(repository.path, item), join(path, item))

    def _checkout_versions(self, clone_path, left_version, left_path, right_version, right_path, common_path):
        with self._repository.clone(clone_path, mkdir=False, checkout=False) as repository:
            self._checkout_commit(repository, left_version.id.encode('utf8'), left_path)
            self._checkout_commit(repository, right_version.id.encode('utf8'), right_path)
            diff_branch = self._repository.refs[self._get_branch_id(DIFF_BRANCH).encode('utf8')]
            self._checkout_commit(repository, diff_branch, common_path)

    @staticmethod
    def _get_working_dirs(root):
        clone_path = join(root, CLONE_DIR_NAME)
        left_path = join(root, LEFT_DIR_NAME)
        right_path = join(root, RIGHT_DIR_NAME)
        common_path = join(root, COMMON_DIR_NAME)
        makedirs(clone_path, exist_ok=True)
        makedirs(left_path, exist_ok=True)
        makedirs(right_path, exist_ok=True)
        makedirs(common_path, exist_ok=True)
        return {'clone_path': clone_path, 'left_path': left_path, 'right_path': right_path, 'common_path': common_path}

    @staticmethod
    def _get_configs(path, re_filename):
        result = {}
        for root, dirs, files in walk(path):
            for filename in files:
                filepath = join(root, filename)
                relative_filepath = relpath(filepath, path)
                m_filename = re_filename.match(relative_filepath)
                if m_filename is None:
                    continue
                d_filename = m_filename.groupdict()
                config_name = d_filename['name']
                result[config_name] = {'filepath': filepath, 'relative_filepath': relative_filepath}
                del d_filename['name']
                for key, value in d_filename.items():
                    result[config_name][key] = value
        return result

    #@staticmethod
    #def _get_param_name(param):
        #if param['name']:
            #name = '{tag}(name={name})'.format(**param)
        #else:
            #name = param['tag']
        #return name

    # TODO use lxml.etree.QName instead of regex/format/...
    @staticmethod
    def _get_param(element):
        name_attributes = element.xpath("./@*[local-name() = '__name__']")
        if len(name_attributes) == 1:
            name_attr = name_attributes[0]
            # TODO ?
            if DIFF_SEP in name_attr:
                name_attr = None
        else:
            name_attr = None
        return {'element': RE_NS.sub('', element.tag), 'name_attribute': name_attr}

    def _get_param_path(self, element):
        current_element = element.getparent()
        path = []
        while current_element is not None:
            param = self._get_param(current_element)
            path.append(param)
            current_element = current_element.getparent()
        path.reverse()
        return path

    #def _get_param_path_str(self, path):
        #param_path_str = ' / '.join(( self._get_param_name(x) for x in path ))
        #if param_path_str:
            #return '/ {}'.format(param_path_str)
        #else:
            #return '/'

    @staticmethod
    def _new_param_dict(path, param, status):
        return {'path': path, 'param': param, 'status': status, 'properties': None}

    @staticmethod
    def _new_property_dict(name, full_name, left_value, right_value):
        return {'name': name, 'full_name': full_name, 'left_value': left_value, 'right_value': right_value}

    # TODO Also check filename and status
    @staticmethod
    def _check_app_param(path, param, attr, left_value, right_value):
        if param['element'] == 'binding.ws' and attr and attr == 'location':
            return False
        elif param['element'] == 'property' and param['name_attribute'] == 'endpointURI' and path and path[-1]['element'] == 'binding.ws':
            return False
        else:
            return True

    # TODO Also check filename and status
    @staticmethod
    def _check_domain_param(path, param, attr, left_value, right_value):
        if param['element'] == 'password-encrypted':
            return False
        if param['element'] == 'target' and path[-1]['element'] in ('app-deployment', 'library'):
            return False
        full_path = path + [param]
        for element in full_path:
            if element['element'] == 'app-deployment':
                if element['name_attribute'] is not None:
                    if 'EAR' not in element['name_attribute'] and 'MDB' not in element['name_attribute']:
                        return False
        return True

    @staticmethod
    def _get_xml_namespaces(tree):
        nsmap = {}
        for ns in tree.xpath('//namespace::*'):
            if ns[0]:
                nsmap[ns[0]] = ns[1]
            else:
                nsmap['__default__'] = ns[1]
        return nsmap

    # TODO don't replace original files (?)
    @staticmethod
    def _prepare_xml(filepath):
        with open(filepath, 'rb') as xmlfile:
            xml = etree.parse(xmlfile)
        changed = False
        for e in xml.xpath("//*[@*[local-name() = 'name'] or (count(*[local-name()='name'])=1 and *[local-name()='name']/text())]"):
            name_attributes = e.xpath("./@*[local-name() = 'name']")
            if len(name_attributes) == 1:
                name = name_attributes[0]
            else:
                name = e.xpath("./*[local-name()='name']/text()")[0]
            changed = True
            e.attrib['__name__'] = name
            if e.getparent() is not None:
                e.attrib['__id__'] = name
        if changed:
            standalone = xml.docinfo.standalone or None
            xml.write(filepath, xml_declaration=True, encoding=xml.docinfo.encoding, standalone=standalone)

    # TODO refactor
    # TODO use lxml.etree.QName instead of regex/format/...
    # TODO group elements by path
    def _compare_xmls(self, left, right, check_method):
        if getsize(left['filepath']) == getsize(right['filepath']):
            if cmp(left['filepath'], right['filepath'], False):
                return []
        self._prepare_xml(left['filepath'])
        self._prepare_xml(right['filepath'])
        with NamedTemporaryFile(dir=self.TEMP_BASE_PATH) as diff_file:
            process = run([XMLDIFF_BIN, 'diff', '--ids', '@__id__', '--sep', DIFF_SEP, '--verbose', '0', left['filepath'], right['filepath'], diff_file.name], stdout=DEVNULL, stderr=DEVNULL)
            # TODO process exitcocdes more accurate
            if process.returncode < 0 or process.returncode > 127:
                return None
            try:
                x = etree.parse(diff_file)
            # Process error more accurate
            except etree.XMLSyntaxError as e:
                return None
            nsmap = self._get_xml_namespaces(x)
            xps = x.xpath(XMLDIFF_XPATH_ALL, namespaces=nsmap)
            left_x = deepcopy(x)
            right_x = deepcopy(x)
            for e in left_x.xpath(XMLDIFF_XPATH_ADDED, namespaces=nsmap):
                e.getparent().remove(e)
            for e in right_x.xpath(XMLDIFF_XPATH_REMOVED, namespaces=nsmap):
                e.getparent().remove(e)
            left_xps = left_x.xpath(XMLDIFF_XPATH_MODIFIED, namespaces=nsmap)
            right_xps = right_x.xpath(XMLDIFF_XPATH_MODIFIED, namespaces=nsmap)
            result = []
            modified_index = 0
            for xp in xps:
                param = self._get_param(xp)
                param_path = self._get_param_path(xp)
                #param_path_str = self._get_param_path_str(param_path)
                #param_name = self._get_param_name(param)
                diff_status = xp.get('{{{}}}status'.format(nsmap['diff']))
                param_diff = self._new_param_dict(param_path, param, diff_status)
                property_diffs = []
                param_name = param['name_attribute'] if param['name_attribute'] is not None else 'undefined'
                if diff_status in ('added', 'removed'):
                    result.append(param_diff)
                    continue
                elif diff_status == 'modified':
                    left_xpath = left_x.getpath(left_xps[modified_index])
                    right_xpath = right_x.getpath(right_xps[modified_index])
                    param_diff['left_xpath'] = left_xpath
                    param_diff['right_xpath'] = right_xpath
                    modified_index += 1
                    for attr_full_name, attr_value in xp.items():
                        attr_name = RE_NS.sub('', attr_full_name)
                        if attr_name == '__name__':
                            continue
                        if DIFF_SEP in attr_value:
                            if check_method(param_path, param, attr_name, *attr_value.split(DIFF_SEP)):
                                property_diff = self._new_property_dict(attr_name, attr_full_name, *attr_value.split(DIFF_SEP))
                                property_diffs.append(property_diff)
                    if xp.text and DIFF_SEP in xp.text:
                        if check_method(param_path, param, 'inner_text', *xp.text.split(DIFF_SEP)):
                            property_diff = self._new_property_dict('inner_text', 'inner_text', *xp.text.split(DIFF_SEP))
                            property_diffs.append(property_diff)
                else:
                    # TODO add error message
                    raise RuntimeError
                if property_diffs:
                    param_diff['properties'] = property_diffs
                    result.append(param_diff)
            return result

    # TODO refactor
    def _compare_config_dirs(self, left_path, right_path, config_dir_name, re_filename, check_method=lambda *x: True):
        result = {'left_exists': False, 'right_exists': False, 'data': []}
        left_dir_path = join(left_path, config_dir_name)
        right_dir_path = join(right_path, config_dir_name)
        if isdir(left_dir_path):
            result['left_exists'] = True
        if isdir(right_dir_path):
            result['right_exists'] = True
        if not (result['left_exists'] and result['right_exists']):
            return result
        diffs = result['data']
        left_configs = self._get_configs(left_dir_path, re_filename)
        right_configs = self._get_configs(right_dir_path, re_filename)
        union_keys = left_configs.keys() | right_configs.keys()
        for key in sorted(union_keys):
            diff = {'config': key, 'left_filepath': None, 'right_filepath': None, 'diff': None}
            left_config = left_configs.get(key)
            right_config = right_configs.get(key)
            versioned = False
            if (left_config and 'revision' in left_config) or (right_config and 'revision' in right_config):
                versioned = True
                diff['left_revision'] = diff['right_revision'] = None
            if left_config:
                diff['left_filepath'] = left_config['relative_filepath']
                if versioned:
                    diff['left_revision'] = left_config.get('revision')
            if right_config:
                diff['right_filepath'] = right_config['relative_filepath']
                if versioned:
                    diff['right_revision'] = right_config.get('revision')
            if left_config and right_config:
                if versioned and diff['left_revision'] != diff['right_revision']:
                    diffs.append(diff)
                    continue
                diff_result = self._compare_xmls(left_config, right_config, check_method)
                if diff_result is not None:
                    if len(diff_result) > 0:
                        diff['diff'] = diff_result
                    else:
                        continue
                else:
                    diff['diff'] = 'incompatible'
            diffs.append(diff)
        return result

    def _compare_text_dirs(self, left_path, right_path):
        result = {'left_exists': False, 'right_exists': False, 'data': []}
        if isdir(left_path):
            result['left_exists'] = True
        if isdir(right_path):
            result['right_exists'] = True
        if not (result['left_exists'] and result['right_exists']):
            return result
        diffs = result['data']
        left_files = listdir(left_path)
        right_files = listdir(right_path)
        union_keys = set(left_files) | set(right_files)
        for key in sorted(union_keys):
            left_file_path = join(left_path, key)
            right_file_path = join(right_path, key)
            if key in left_files:
                left_content = b64encode(open(left_file_path, 'rb').read()).decode('ascii')
            else:
                left_content = None
            if key in right_files:
                right_content = b64encode(open(right_file_path, 'rb').read()).decode('ascii')
            else:
                right_content = None
            if left_content != right_content:
                diffs.append({'file': key, 'left_content': left_content, 'right_content': right_content})
            else:
                diffs.append({'file': key, 'left_content': None, 'right_content': None})
        return result

    def _compare_app_dirs(self, left_path, right_path):
        return {COMPOSITE_DIR_NAME: self._compare_config_dirs(left_path, right_path, COMPOSITE_DIR_NAME, RE_COMPOSITE_FILENAME)}

    def _compare_domain_dirs(self, left_path, right_path):
        return {DOMAIN_CFG_DIR_NAME: self._compare_config_dirs(left_path, right_path, DOMAIN_CFG_DIR_NAME, RE_CONFIG_FILENAME, self._check_domain_param)}

    def _compare_soa_dirs(self, left_path, right_path):
        return {SOACONFIG_DIR_NAME: self._compare_config_dirs(left_path, right_path, SOACONFIG_DIR_NAME, RE_CONFIG_FILENAME)}

    def _compare_patch_dirs(self, left_path, right_path):
        return {FMW_PATCH_DIR_NAME: self._compare_text_dirs(join(left_path, FMW_PATCH_DIR_NAME), join(right_path, FMW_PATCH_DIR_NAME))}

    def _compare_db_dirs(self, left_path, right_path):
        return {DATABASE_CFG_DIR_NAME: self._compare_text_dirs(join(left_path, DATABASE_CFG_DIR_NAME), join(right_path, DATABASE_CFG_DIR_NAME))}

    def _compare_os_dirs(self, left_path, right_path, common_path):
        result = {OS_CFG_DIR_NAME: {'left': [], 'right': []}}
        diffs = result[OS_CFG_DIR_NAME]
        if not isdir(join(left_path, OS_CFG_DIR_NAME)):
            diffs['left'] = None
        if not isdir(join(right_path, OS_CFG_DIR_NAME)):
            diffs['right'] = None
        os_standart_path = join(common_path, OS_STANDART_DIR_NAME)
        diffs = result[OS_CFG_DIR_NAME]
        for side in ((left_path, diffs['left']), (right_path, diffs['right'])):
            side_path, side_diffs = side
            if side_diffs is None:
                continue
            hosts = listdir(join(side_path, OS_CFG_DIR_NAME))
            for host in hosts:
                host_path = join(side_path, OS_CFG_DIR_NAME, host)
                if not isdir(host_path):
                    continue
                side_diffs.append({'host': host, 'diff': self._compare_text_dirs(os_standart_path, host_path)})
        return result
            

    def _compare(self, left_version, right_version):
        makedirs(self.TEMP_BASE_PATH, exist_ok=True)
        with TemporaryDirectory(None, None, self.TEMP_BASE_PATH) as diff_directory:
            dirs = self._get_working_dirs(diff_directory)
            self._checkout_versions(dirs['clone_path'], left_version, dirs['left_path'], right_version, dirs['right_path'], dirs['common_path'])
            rw_environments = set()
            rw_environments_file_path = join(dirs['common_path'], RW_ENVIRONMENTS_FILE_NAME)
            if isfile(rw_environments_file_path):
                with open(rw_environments_file_path) as rw_environments_file:
                    s = rw_environments_file.read()
                    rw_environments = set(RE_SECTIONS.findall(s))
            app_cfg_diff = self._compare_app_dirs(dirs['left_path'], dirs['right_path'])
            domain_cfg_diff = self._compare_domain_dirs(dirs['left_path'], dirs['right_path'])
            soa_cfg_diff = self._compare_soa_dirs(dirs['left_path'], dirs['right_path'])
            patch_diff = self._compare_patch_dirs(dirs['left_path'], dirs['right_path'])
            db_diff = self._compare_db_dirs(dirs['left_path'], dirs['right_path'])
            os_diff = self._compare_os_dirs(dirs['left_path'], dirs['right_path'], dirs['common_path'])
            return {'rw_environments': list(rw_environments), **app_cfg_diff, **domain_cfg_diff, **soa_cfg_diff, **patch_diff, **db_diff, **os_diff}

