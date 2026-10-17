/**
 * 작가 입력 시트 → src/content/freeStage.ts 변환.
 *
 * 1. 엑셀·구글 시트에서 '파일 → 다운로드/다른 이름으로 저장 → CSV(UTF-8)'로 내보낸다.
 * 2. 검사만 (파일을 쓰지 않음):
 *      npx --yes tsx scripts/convert-content.ts <시트.csv>
 * 3. 오류가 없으면 덮어쓰기:
 *      npx --yes tsx scripts/convert-content.ts <시트.csv> --out src/content/freeStage.ts
 *
 * 머리글은 '키', '제목', '해석', '키워드'(쉼표로 구분, 또는 키워드1~3), '코멘트', '출처'를 찾는다(영문도 가능).
 * 오류(error)가 있으면 파일을 쓰지 않고 종료 코드 1로 끝난다. 경고(warning)는 알려만 준다.
 * 규칙: src/lib/content/rules.ts, 변환·검사: src/lib/content/convertContent.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { convertContentTable, renderFreeStageModule } from '@/lib/content/convertContent';
import { parseCsv } from '@/lib/content/csv';

const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const outPath = outFlag >= 0 ? args[outFlag + 1] : undefined;
// --out 바로 뒤 값(출력 경로)은 입력 파일로 보지 않는다.
const inputPath = args.find((arg, index) => !arg.startsWith('--') && (outFlag < 0 || index !== outFlag + 1));

if (!inputPath || (outFlag >= 0 && !outPath)) {
  console.error('사용법: tsx scripts/convert-content.ts <시트.csv> [--out src/content/freeStage.ts]');
  process.exit(1);
}

const result = convertContentTable(parseCsv(readFileSync(inputPath, 'utf8')));
const errors = result.issues.filter((issue) => issue.level === 'error');
const warnings = result.issues.filter((issue) => issue.level === 'warning');

for (const issue of result.issues) {
  console.log(`${issue.level === 'error' ? '✖ 오류' : '△ 경고'}  ${issue.key.padEnd(24)} ${issue.message}`);
}
console.log(`\n오류 ${errors.length}건, 경고 ${warnings.length}건`);

if (!result.content) {
  console.error('오류가 있어 파일을 만들지 않았어요.');
  process.exit(1);
}
if (!outPath) {
  console.log('검사만 했어요. 파일로 쓰려면 --out src/content/freeStage.ts 를 붙이세요.');
  process.exit(0);
}

writeFileSync(outPath, renderFreeStageModule(result.content, path.basename(inputPath)));
console.log(`${outPath}에 썼어요 (origin: writer). npm test로 확인하세요.`);
