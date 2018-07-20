import * as express from 'express';
import { NextFunction, Request, Response } from 'express';
import * as httpContext from 'express-http-context';
import { config } from './config';
import { MicrosoftAPI } from './microsoft';
import { SplitwiseAPI } from './splitwise';

const app = express();
app.use(httpContext.middleware);

app.use((req: Request, res: Response, next: NextFunction) => {
  let msToken = req.header('Authorization').substring('Bearer '.length);
  console.log('msToken', msToken);
  httpContext.set('microsoftAPI', new MicrosoftAPI(msToken));
  next();
});

app.post('/announcement', async(req: Request, res: Response) => {
  try {
    let microsoftAPI = httpContext.get('microsoftAPI');
    const me = await microsoftAPI.getMe();
    await MicrosoftAPI.sendTeamsMessage(config.webhookURL, 'Onigiri time!', `
     Dzisiaj zamawia ${me.displayName}, czas ${req.query.time} minut. 
     [Formularz](https://forms.office.com/Pages/ResponsePage.aspx?id=z_8gVdb4k02uxczBG_brzdjafJ9WrS9MpK-D3qAuILZUNVMzV0xHTUc2ODY4VVBJTDhJNEgxR1M2Sy4u)
    `);
    res.json(true);
  } catch (e) {
    res.json({ error: e });
  }
});

app.get('/summary', async(req: Request, res: Response) => {
  let microsoftAPI = httpContext.get('microsoftAPI');
  let summary = await getSummary(microsoftAPI);
  res.json({
    summary
  });
});

app.get('/splitwise', async(req: Request, res: Response) => {
  let microsoftAPI = httpContext.get('microsoftAPI');
  let splitwiseAPI = new SplitwiseAPI(config.splitwiseToken);
  await addToSplitwise(microsoftAPI, splitwiseAPI);
  res.json(true);
});

app.listen(process.env.PORT || 8080, () => {
  console.log('started');

  console.log('config', config);
});

async function addToSplitwise(microsoftAPI: MicrosoftAPI, splitwiseAPI: SplitwiseAPI) {
  const payer = await microsoftAPI.getMe();
  let splitwiseMap = await microsoftAPI.getTable('/splitwiseMap.xlsx', 'splitwise');
  const orders = await getOrders(microsoftAPI);
  let sum = orders.map(o => o.sum).reduce((a, b) => a + b);
  const users = [];
  for (let order of orders) {
    const firstName = order['Nazwa'].split(' ')[0];
    const lastName = order['Nazwa'].split(' ')[1];
    const syncronMail = order['Adres e-mail'];
    const mapRecord = splitwiseMap.find(r => r['syncron mail'] === syncronMail);
    const splitwiseMail = mapRecord ? mapRecord['splitwise mail'] : syncronMail;
    await splitwiseAPI.addUserToGroup(config.splitwiseGroup, firstName, lastName, splitwiseMail);
    users.push({
      email: splitwiseMail,
      paid_share: payer.mail === syncronMail ? sum : 0,
      owed_share: order.sum,
    });
  }
  await splitwiseAPI.createExpense(sum, 'onigiri', config.splitwiseGroup, users);
}

async function getSummary(microsoftAPI: MicrosoftAPI) {
  const orders = await getOrders(microsoftAPI);
  console.info('orders', orders);
  let summary = orders.map(o => o.summary).join('\n');
  let sum = orders.map(o => o.sum).reduce((a, b) => a + b);
  summary += `\n\n\tSUMA: ${sum}`;
  await MicrosoftAPI.sendTeamsMessage(config.webhookURL, 'Podsumowanie', summary);
  return summary;
}

async function getOrders(microsoftAPI: MicrosoftAPI) {
  let orders = await microsoftAPI.getTable(config.workbook, '_56F9DC9755BA473782653E2940F99386');
  for (let order of orders) {
    order['Godzina ukończenia'] = getJsDateFromExcel(order['Godzina ukończenia']);
  }
  orders = orders.filter(order => today(order['Godzina ukończenia']));
  const types = Object.keys(config.prices);
  for (let order of orders) {
    order.sum = 0;
    const summaries = [];
    for (let type of types) {
      if (order[type]) {
        order.sum += order[type] * config.prices[type];
        summaries.push(`\t\t${type} x ${order[type]}`);
      }
    }
    if (order['Uwagi do zamówienia']) {
      summaries.push(`\t\tUwagi: ${order['Uwagi do zamówienia']}`);
    }
    const name = getShortName(order['Nazwa']);
    order.summary = `\t${name} (${order.sum})\n${summaries.join('\n')}`;
  }
  return orders;
}

function getShortName(fullName: string) {
  const parts = fullName.split(' ');
  return `${parts[0]} ${parts[1][0]}.`;
}

function today(td: Date) {
  const d = new Date();
  return td.getDate() === d.getDate() && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
}

function getJsDateFromExcel(excelDate: number) {
  return new Date(Math.round((excelDate - (25567 + 2)) * 86400 * 1000));
}
