/**
 * CSV 읽기 (RFC 4180). 엑셀·구글 시트의 'CSV(UTF-8)' 내보내기를 읽는다.
 * 따옴표 안의 쉼표·줄바꿈·이중 따옴표("")를 처리하고, 맨 앞 BOM과 CRLF를 다룬다.
 */
export function parseCsv(text: string): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (inQuotes) throw new Error('CSV 형식 오류: 닫히지 않은 따옴표가 있어요.');
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // 완전히 빈 줄은 버린다.
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}
