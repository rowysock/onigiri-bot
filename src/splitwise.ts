import * as rp from 'request-promise';

export interface ExpenseUser {
  email: string,
  paid_share: number,
  owed_share: number,
}

export class SplitwiseAPI {
  private static baseURL = 'https://secure.splitwise.com/api/v3.0/';

  constructor(private token: string) {
  }

  async createExpense(cost: number, description: string, groupId: string, users: ExpenseUser[]) {
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

  async addUserToGroup(groupId: string, firstName: string, lastName: string, email: string) {
    return this.request('add_user_to_group', 'POST', {
      group_id: groupId,
      first_name: firstName,
      last_name: lastName,
      email
    });
  }

  async request(path: string, method = 'GET', payload = {}) {
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

  _objectToQuery(o: any) {
    const result = {} as { [key: string]: string };

    function convert(nested: any, prefix = '') {
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
