const fs = require('fs');

function replace(file, pairs) {
  let content = fs.readFileSync(file, 'utf8');
  for (const [from, to] of pairs) {
    const count = content.split(from).length - 1;
    if (count > 0) {
      content = content.split(from).join(to);
      console.log(`  [${count}x] ${from.slice(0, 60)}`);
    }
  }
  fs.writeFileSync(file, content);
}

const BASE = '/Users/kevin/Documents/projects/soci-front/src/components';

// ─── SurveyForm ───────────────────────────────────────────────
console.log('\n== SurveyForm ==');
replace(`${BASE}/SurveyForm.tsx`, [
  ["import '../styles/SurveyForm.scss'", "import { Button } from '@/components/ui/button'"],
  ['className="survey-form"', 'className="w-full"'],
  ['className="survey-form__container"', 'className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6"'],
  ['className="survey-form__video-section"', 'className="rounded-lg overflow-hidden"'],
  ['className="survey-form__video"', 'className="w-full"'],
  ['className="survey-form__header"', 'className="flex flex-col gap-1"'],
  ['className="survey-form__title"', 'className="text-xl font-bold"'],
  ['className="survey-form__subtitle"', 'className="text-sm text-muted-foreground"'],
  ['className="error-message"', 'className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"'],
  ['className="survey-form__form"', 'className="flex flex-col gap-5"'],
  ['className="form-section"', 'className="flex flex-col gap-4"'],
  ['className="form-section__title"', 'className="text-base font-semibold border-b pb-2"'],
  ['className="form-group"', 'className="flex flex-col gap-1.5"'],
  ['className="form-group__label"', 'className="text-sm font-medium"'],
  ['className="radio-group"', 'className="flex flex-wrap gap-4"'],
  ['className="radio-option"', 'className="flex items-center gap-2 cursor-pointer text-sm"'],
  ['className="form-group__error"', 'className="text-sm text-destructive"'],
  ['className="survey-form__row"', 'className="grid grid-cols-1 sm:grid-cols-2 gap-4"'],
  ['className="survey-form__col"', 'className="flex flex-col gap-1.5"'],
  ['className="form-group__checkbox-wrapper"', 'className="flex items-center gap-2"'],
  ['className="form-group__checkbox"', 'className="w-4 h-4 rounded"'],
  ['className="form-group__checkbox-label"', 'className="text-sm cursor-pointer"'],
]);

// patch inline-style grid row
let sf = fs.readFileSync(`${BASE}/SurveyForm.tsx`, 'utf8');
sf = sf.replace(
  /className="grid grid-cols-1 sm:grid-cols-2 gap-4" style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1\.5rem' \}\}/,
  'className="grid grid-cols-2 gap-4"'
);
fs.writeFileSync(`${BASE}/SurveyForm.tsx`, sf);

// ─── SocializerForm ───────────────────────────────────────────
console.log('\n== SocializerForm ==');
replace(`${BASE}/SocializerForm.tsx`, [
  ["import '../styles/SurveyForm.scss'", "import { Button } from '@/components/ui/button'"],
  ['className="survey-form"', 'className="w-full"'],
  ['className="survey-form__container"', 'className="max-w-2xl mx-auto px-4 py-4 flex flex-col gap-6"'],
  ['className="survey-form__header"', 'className="flex flex-col gap-1"'],
  ['className="survey-form__title"', 'className="text-xl font-bold"'],
  ['className="survey-form__form"', 'className="flex flex-col gap-5"'],
  ['className="form-group form-group--actions"', 'className="flex gap-3"'],
  ['className="form-group__hint"', 'className="text-xs text-muted-foreground"'],
  ['className="survey-form__submit-error"', 'className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"'],
]);

let soc = fs.readFileSync(`${BASE}/SocializerForm.tsx`, 'utf8');
soc = soc.replace(
  "style={{ padding: '2rem', textAlign: 'center', color: '#666' }}",
  'className="py-8 text-center text-sm text-muted-foreground"'
);
fs.writeFileSync(`${BASE}/SocializerForm.tsx`, soc);

// ─── ReportFilterPanel ────────────────────────────────────────
console.log('\n== ReportFilterPanel ==');
replace(`${BASE}/ReportFilterPanel.tsx`, [
  ['className="rg-panel-overlay"', 'className="fixed inset-0 z-40 bg-black/40"'],
  ['className="rg-panel__header"', 'className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"'],
  ['className="rg-panel__header-left"', 'className="flex items-center gap-2"'],
  ['className="rg-panel__title"', 'className="font-semibold text-sm"'],
  ['className="rg-panel__body"', 'className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"'],
  ['className="rg-panel__section"', 'className="flex flex-col gap-3"'],
  ['className="rg-panel__section-title"', 'className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"'],
  ['className="rg-panel__required"', 'className="text-destructive"'],
  ['className="rg-panel__field"', 'className=""'],
  ['className="rg-panel__section rg-panel__section--collapsible"', 'className="flex flex-col gap-2 border-t pt-3"'],
  ['className="rg-panel__collapse-left"', 'className="flex items-center gap-2"'],
  ['className="rg-panel__advanced-body"', 'className="flex flex-col gap-4 mt-2"'],
  ['className="rg-panel__subsection"', 'className="flex flex-col gap-3"'],
  ['className="rg-panel__subsection-title"', 'className="text-xs font-medium text-muted-foreground"'],
  ['className="rg-panel__footer"', 'className="flex flex-col gap-2 p-4 border-t flex-shrink-0"'],
  ['className="rg-panel__footer-row"', 'className="flex gap-2"'],
]);

console.log('\nDone!');
