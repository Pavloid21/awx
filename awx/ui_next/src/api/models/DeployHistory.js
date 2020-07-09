import Base from '../Base';

class DeployHistory extends Base {
  constructor(http) {
    super(http);
    this.baseUrl = '/api/v2/deploy_history/';
  }
}

export default DeployHistory;
