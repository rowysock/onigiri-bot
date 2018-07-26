import * as rp from 'request-promise';
import { config } from './config';

export class MicrosoftAPI {
  private static baseURL = 'https://graph.microsoft.com/v1.0/';

  constructor(private accessToken: string) {
  }

  static async sendTeamsMessage(webhookURL: string, title: string, summary: string) {
    const webhookPayload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      'summary': title,
      'themeColor': '0078D7',
      'title': title,
      'text': summary
    };
    const options = {
      method: 'POST',
      uri: webhookURL,
      body: webhookPayload,
      json: true
    };
    let resp = await rp(options);
    console.log('webhook response', resp);
  }

  async getMe() {
    return this.request('me');
  }

  async getTable(workbookPath: string, table: string) {
    const workbookId = await this.getFileId(workbookPath);
    console.log(`Fetching table ${table} from workbook ${workbookId}`);
    const resp = await this.request(`drives/${config.workbookDriveID}/items/${workbookId}/workbook/tables/${table}/columns`);
    const numberOfRows = resp.value[0].values.length - 1;
    const result = Array(numberOfRows);
    for (let index = 0; index < numberOfRows; index++) {
      result[index] = {};
    }
    for (let column of resp.value) {
      const columnName = column.name;
      for (let index = 0; index < numberOfRows; index++) {
        result[index][columnName] = column.values[index + 1][0];
      }
    }
    return result;
  }

  async getFileId(filePath: string) {
    console.log('Looking for id of', filePath);
    const response = await this.request(`drives/${config.workbookDriveID}/root:${filePath}`);
    return response.id;
  }

  async request(path: string, method = 'GET') {
    const options = {
      method,
      uri: encodeURI(MicrosoftAPI.baseURL + path),
      headers: {
        'Authorization': 'Bearer ' + this.accessToken,
      },
      json: true
    };
    return rp(options);
  }
}