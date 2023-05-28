import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from 'dotenv'
import fs from 'fs/promises';
import * as creds from '../credentials.json';
import { getFio, transliteFio, getDescriptionProduct, merge } from './utils';

dotenv.config();

export const main = async () => {
  const documentLeads = new GoogleSpreadsheet(
    process.env.SHEET_KEY_LEADS
  );
  const documentItems = new GoogleSpreadsheet(
    process.env.SHEET_KEY_ITEMS
  );
  await documentLeads.useServiceAccountAuth(creds);
  await documentItems.useServiceAccountAuth(creds);
  await documentLeads.loadInfo();
  await documentItems.loadInfo();

  const sheet1 = documentLeads.sheetsByIndex[0];
  const sheet2 = documentLeads.sheetsByIndex[1];
  const sheetItems = documentItems.sheetsByIndex[0];

  await sheet2.loadCells();
  const leads = await sheet1.getRows();
  await sheetItems.loadCells();
  const itemsRows = await sheetItems.getRows();
  const quintetyChengedRows = JSON.parse(await fs.readFile('./rows.json', 'utf-8')).quantity;

    if ( quintetyChengedRows < leads.length) {
      const newLeads = await sheet1.getRows({ offset: quintetyChengedRows})
      const normalLeads = newLeads.map((row) => {
        const fio =  getFio({
          name: row.Name,
          city: row.city,
          address: row['Адрес_доставки'],
          index: row.index,
          phone: row.Phone,
        });
        const products = row.product.split(';').map((prod) => prod.trim()).filter((prod) => prod.length > 0);
        const descriptionProducts = products.map((prod: string) => {
          const productName = prod.split('(')[0].trim();
          const itemRow = itemsRows
            .find((item) => {
              return (
                item._rawData.find((value: string) => productName.includes(value) || value.includes(productName))
                ?? item._sheet.headerValues.find((value: string) => productName.includes(value) || value.includes(productName))
              );
            });
            let link: string;
            if (itemRow) {
              const indexLine = itemRow
                ._rawData.findIndex((data: string) => productName.includes(data) || data.includes(productName));
              const headersIndex = itemRow
                ._sheet.headerValues.findIndex((value: string) => productName.includes(value) || value.includes(productName));
              const index = indexLine !== -1 ? indexLine : headersIndex;
              const data = indexLine !== -1 ? itemRow._rawData : itemRow._sheet.headerValues;
              link =  index !== -1 ? data[index - 1] : 'Failed to retrieve link';
            } else {
              link = 'Failed to retrieve link';
            }

          const description = getDescriptionProduct(prod);

          return { product: prod, description, link };
        });

      const date = new Date(row['Payment date']);
      const day = date.getDate();
      const month = date.getMonth() > 9 ? date.getMonth() : `0${date.getMonth()}`;

      return {
        products: descriptionProducts,
        fio: transliteFio(fio),
        date: `${day}.${month}`,
        email: row.Email,
        sum: row['Total amount'],
        paymentId: row.paymentid,
      }
    });

    for (let index = 0; index < normalLeads.length; index ++) {
      const lines = normalLeads[index].products.map((prod: {product: string, link: string, description: string}) => {
        const line = {
          'Название/фото': prod.product,
          'Ссылка': prod.link,
          'Цвет, размер': prod.description,
          'Данные': normalLeads[index].fio,
          'Дата': normalLeads[index].date,
          'Email': normalLeads[index].email,
          'Сумма': normalLeads[index].sum,
          'Номер заказа': normalLeads[index].paymentId
        }

        return line;
      });

      const addingRows = await sheet2.addRows(lines);

      if (lines.length > 1) {
        const startRowIndex = addingRows[0].rowIndex - 1
        const endRowIndex = addingRows[addingRows.length - 1].rowIndex;
        await merge(sheet2, [
          {
            startRowIndex,
            endRowIndex,
            startColumnIndex: 3,
            endColumnIndex: 4,
          },
          {
            startRowIndex,
            endRowIndex,
            startColumnIndex: 4,
            endColumnIndex: 5,
          },
          {
            startRowIndex,
            endRowIndex,
            startColumnIndex: 5,
            endColumnIndex: 6,
          },
          {
            startRowIndex,
            endRowIndex,
            startColumnIndex: 6,
            endColumnIndex: 7,
          },
          {
            startRowIndex,
            endRowIndex,
            startColumnIndex: 10,
            endColumnIndex: 11,
          }
        ])
      }
      await sheet2.saveUpdatedCells();
    };

  const json = JSON.stringify({ quantity: leads.length });
  await fs.writeFile('./rows.json', json);
  }
};

