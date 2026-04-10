const fs = require('fs');
const file = '/Users/kevin/Documents/projects/soci-front/src/components/SurveyDetailModal.tsx';
let content = fs.readFileSync(file, 'utf8');
const replacements = [
  ['className="audio-player__btn audio-player__btn--stop"', 'className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground transition disabled:opacity-50"'],
  ['className="audio-player__progress-thumb"', 'className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary -translate-x-1/2"'],
  ['className="detail-grid"', 'className="grid grid-cols-1 sm:grid-cols-2 gap-3"'],
  ['className="detail-item detail-item--full detail-item--map"', 'className="flex flex-col gap-0.5 sm:col-span-2"'],
  ['className="detail-item detail-item--full"', 'className="flex flex-col gap-0.5 sm:col-span-2"'],
  ['className="detail-item"', 'className="flex flex-col gap-0.5"'],
  ['className="detail-item__label"', 'className="text-xs text-muted-foreground"'],
  ['className="detail-item__value detail-item__value--highlight"', 'className="text-sm font-bold text-destructive"'],
  ['className="detail-item__value"', 'className="text-sm font-medium"'],
  ['className="map-container"', 'className="rounded-lg overflow-hidden"'],
  ['className="audio-player__controls"', 'className="flex gap-2"'],
  ['className="audio-player__track"', 'className="flex-1 flex flex-col gap-1"'],
  ['className="audio-player__progress-bar"', 'className="relative h-2 rounded-full bg-muted cursor-pointer overflow-hidden"'],
  ['className="audio-player__progress-fill"', 'className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"'],
  ['className="audio-player__time"', 'className="flex justify-between text-xs text-muted-foreground"'],
  ['className="audio-player__visualizer"', 'className="flex items-center gap-0.5"'],
  ['className="audio-player__error"', 'className="text-xs text-destructive"'],
  ['className="audio-player"', 'className="rounded-lg bg-muted/40 p-3 flex flex-col gap-2"'],
];
for (const [from, to] of replacements) {
  const count = content.split(from).length - 1;
  content = content.split(from).join(to);
  if (count > 0) console.log(`Replaced ${count}x: "${from.slice(0, 40)}..."`);
}
fs.writeFileSync(file, content);
console.log('done');
