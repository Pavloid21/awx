let Base;

function DeployTemplateModel (method, resource, config) {
    Base.call(this, 'deploy_template');

    this.Constructor = DeployTemplateModel;

    return this.create(method, resource, config);
}

function DeployTemplateModelLoader (BaseModel) {
    Base = BaseModel;

    return DeployTemplateModel;
}

DeployTemplateModelLoader.$inject = [
    'BaseModel'
];

export default DeployTemplateModelLoader;
