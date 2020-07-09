let Base;

function DeployHistoryModel (method, resource, config) {
    Base.call(this, 'deploy_history');

    this.Constructor = DeployHistoryModel;

    return this.create(method, resource, config);
}

function DeployHistoryModelLoader (BaseModel) {
    Base = BaseModel;

    return DeployHistoryModel;
}

DeployHistoryModelLoader.$inject = [
    'BaseModel'
];

export default DeployHistoryModelLoader;
