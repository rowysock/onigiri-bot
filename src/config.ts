export const config = {
  prices: {
    Bito: 7,
    Tofu: 7,
    Yasai: 7,
    Surimi: 7,
    Chicken: 8,
    Pork: 8,
    Tuna: 8,
    Ebi: 9,
    Salmon: 9
  } as { [name: string]: number },
  webhookURL: process.env.WEBHOOK_URL,
  splitwiseToken: process.env.SPLITWISE_TOKEN,
  splitwiseGroup: process.env.SPLITWISE_GROUP,
  //Name od the workbook connected to form
  workbook: process.env.WORKBOOK,
  //ID of a drive on which workbook is stored
  workbookDriveID: process.env.WORKBOOK_DRIVE_ID,
};