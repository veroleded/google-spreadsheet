import { GoogleSpreadsheetWorksheet } from 'google-spreadsheet';

export const normalizePhoneNumber = (phoneNumber: string): string => {
  const regex = /^\+7\s\d{3}\s\d{3}-\d{2}-\d{2}$/;
  if (regex.test(phoneNumber)) {
    return phoneNumber;
  }
  return phoneNumber.split('(').join('').split(')').join('').split(' ').join('');
}

export interface userValue {
  name: string;
  city: string;
  address: string;
  index: string;
  phone: string;
}

export const getFio = (value: userValue): string => {
  const firstLine = [value.name, value.city].join(' ');
  const normPhone = normalizePhoneNumber(value.phone);
  const secondLine = value.address
  const lastLine = [value.index, normPhone].join('  ');
  return [firstLine, secondLine, lastLine].join('\n');
}

export const transliteFio = (text: string): string => {
  const translitToEng = {
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'YO', Ж: 'ZH', З: 'Z', И: 'I', Й: 'Y',
    К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F',
    Х: 'KH', Ц: 'TS', Ч: 'CH', Ш: 'SH', Щ: 'SCH', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'YU', Я: 'YA',
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return text.split('').map((symb: string): string => {
    return translitToEng[symb] ?? symb;
  }).join('');
}

export const transliteColor = (color: string): string => {
  const colors = {
    aqua: 'Аквамариновый',
    black: 'Черный',
    blue: 'Синий',
    brown: 'Коричневый',
    cyan: 'Голубой',
    gold: 'Золотой',
    gray: 'Серый',
    green: 'Зеленый',
    indigo: 'Индиго',
    lavender: 'Лавандовый',
    lime: 'Лаймовый',
    magenta: 'Пурпурный',
    maroon: 'Бордовый',
    navy: 'Темно-синий',
    olive: 'Оливковый',
    orange: 'Оранжевый',
    pink: 'Розовый',
    purple: 'Фиолетовый',
    red: 'Красный',
    silver: 'Серебряный',
    teal: 'Бирюзовый',
    violet: 'Фиолетовый',
    white: 'Белый',
    yellow: 'Желтый'
  };
  
  return colors[color.toLowerCase()] ?? color;
}

export const getDescriptionProduct = (string: string): string => {
  const regexColor = /Цвет:\s([а-я]|[А-Я]|\w)+/;
  const regexSize = /Размер:\s([а-я]|[А-Я]|\w)+/;
  const  regexCount = /[0-9]+x[0-9]+/;
  const regexType = /Тип:\s([а-я]|[А-Я]|\w)+/;
  const color = string.match(regexColor)[0];
  const count = string.match(regexCount)[0].split('x')[0]
  const normSize = string.match(regexSize)[0].split(':')[1].trim();
  const normColor = transliteColor(color.split(':')[1].trim());
  const normCount = Number(count) < 2 ? '' : `${count} шт`;
  const normType = string.match(regexType) ?? ''

  const firstLine = [normColor, normSize].join(' ');
  const secondLine = [normCount, normType[0]].join(' ');
 return [firstLine, secondLine].join('\n');
}

export const merge = async (
  sheet: GoogleSpreadsheetWorksheet,
  values: {startRowIndex: number, endRowIndex: number, startColumnIndex: number, endColumnIndex: number}[],
  ): Promise<void> => {

  await Promise.all(values.map(async (value) => {
    // @ts-ignore
    await sheet.mergeCells(value);
  }))
}
