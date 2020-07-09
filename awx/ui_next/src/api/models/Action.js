import Base from '../Base';

class Action extends Base {
  constructor(http) {
    super(http);
    this.baseUrl = '/api/v2/action/';
  }
}

export default Action;
