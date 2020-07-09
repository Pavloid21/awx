let Base;

function ActionModel (method, resource, config) {
    Base.call(this, 'action');

    this.Constructor = ActionModel;

    return this.create(method, resource, config);
}

function ActionModelLoader (BaseModel) {
    Base = BaseModel;

    return ActionModel;
}

ActionModelLoader.$inject = [
    'BaseModel'
];

export default ActionModelLoader;
