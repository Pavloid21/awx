import Base from '../Base';

class DeployTemplate extends Base {
  constructor(http) {
    super(http);
    this.baseUrl = '/api/v2/deploy_template/';
  }
}

export default DeployTemplate;
