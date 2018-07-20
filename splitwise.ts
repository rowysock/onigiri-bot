import * as rp from 'request-promise';

export class SplitwiseAPI {
  private static baseURL = 'https://secure.splitwise.com/api/v3.0/';

  constructor(private token) {
  }

  async createExpense(cost, description, groupId, users) {
    return this.request('create_expense', 'POST', {
      payment: false,
      cost,
      description,
      group_id: groupId,
      currency_code: 'PLN',
      category_id: 13,
      users
    });
  }

  async addUserToGroup(groupId, firstName, lastName, email) {
    return this.request('add_user_to_group', 'POST', {
      group_id: groupId,
      first_name: firstName,
      last_name: lastName,
      email
    });
  }

  async request(path, method = 'GET', payload = {}) {
    const options = {
      method,
      qs: this._objectToQuery(payload),
      uri: `${SplitwiseAPI.baseURL}${path}`,
      headers: {
        'Authorization': 'Bearer ' + this.token,
      },
      json: true
    };

    return rp(options);
  }

  _objectToQuery(o) {
    const result = {};

    function convert(nested, prefix = '') {
      for (let key of Object.keys(nested)) {
        const value = nested[key];
        if (value instanceof Array) {
          for (let i = 0; i < value.length; i++) {
            convert(value[i], `${prefix}${key}__${i}__`);
          }
        } else {
          result[prefix + key] = value;
        }
      }
    }

    convert(o);
    return result;
  }
}
