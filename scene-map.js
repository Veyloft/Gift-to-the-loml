// Seconds in the supplied full MP3. Source: waveform correlation, narrow ASR,
// and forced alignment. See timing-evidence.json for measured uncertainty.
export const startPosition=28.82;
export const photoWindow={firstLineEnd:78.84,secondLineStart:81.34,secondLineEnd:83.46,photos:[79.00,79.65,80.30],envelope:83.60};
export const secondLineCues=[81.34,81.94,82.16,82.40,82.62,82.84,83.02];
const g=(id,at,action,lead=1.05,next=false)=>({id,at,action,lead,next});
export const scenes=[
{id:'blue',theme:'blue',gates:[g('blue-pull',30.96,'pull',1.7),g('blue-flip',34.50,'flip',1.05,true)],words:[]},
{id:'love',theme:'love',gates:[g('love-pull-1',38.70,'pull',1.8),g('love-pull-2',42.70,'pull',1.8),g('love-flip',46.20,'flip',1.05,true)],waves:[[34.92,36.54,37.18,37.52,37.94,38.20],[40.52,40.94,41.22,41.62,41.90,42.12]],words:[]},
{id:'moon',theme:'moon',gates:[g('moon-flip',49.95,'flip',1.05,true)],words:[['THE',46.70,8,59],['SUN',46.92,27,63],['DON’T',47.34,8,80],['SHINE',47.80,29,82],['WHEN',48.20,69,60],['I’M',48.90,82,77],['ALONE',49.38,60,84]]},
{id:'spiral',theme:'spiral',gates:[g('spiral-flip',53.70,'flip',1.05,true)],words:[['I',50.44,8,10],['LOSE',50.72,23,13],['MY',51.04,15,29],['MIND',51.40,6,43],['and',51.92,25,59],['LOSE',52.52,12,71],['CONTROL',52.90,5,84]]},
{id:'eyes',theme:'eyes',gates:[g('eyes-flip',57.40,'flip',1.05,true)],words:[['I',54.22,21,12],['SEE',54.48,8,35],['YOUR',54.80,27,35],['EYES',55.16,11,63],['LOOK',55.68,57,10],['THROUGH',56.24,58,23],['MY',56.64,72,37],['soul',56.94,69,62]]},
{id:'flowers',theme:'flowers',gates:[g('flowers-flip',61.20,'flip',1.05,true)],words:[["DON'T",57.90,6,75],['BE',58.36,17,82],['surprised',58.56,6,90],['THIS',59.82,77,75],['ALL',60.08,86,82],['I',60.46,78,84],['know',60.70,77,91]]},
{id:'balloons',theme:'balloons',gates:[g('balloons-flip',64.86,'flip',1.05,true)],words:[['I',61.70,10,13],['FELT',61.98,29,10],['THE',62.36,72,17],['HIGHS',62.68,9,39],['AND',63.12,83,44],['THEY',63.46,8,63],['FELT',63.72,74,67],['LIKE',64.06,17,84],['YOU',64.44,79,85]]},
{id:'ours',theme:'ours',gates:[g('ours-flip',68.55,'flip',1.05,true)],words:[['SEE',65.36,6,63],['a',65.64,17,72],['love',65.80,8,79],['like',66.06,29,79],['ours',66.40,30,89],['is',66.90,61,61],['too',67.12,74,67],['good',67.26,59,77],['to',67.58,78,79],['be',67.88,88,79],['true',68.16,76,90]]},
{id:'together',theme:'together',gates:[g('together-pull',71.96,'together',1.8),g('together-flip',72.62,'flip',.8,true)],words:[]},
{id:'pink',theme:'pink',gates:[g('pink-flip',76.22,'flip',1.05,true)],words:[['YOU',73.15,10,5],['REMIND',73.46,13,29],['ME',73.92,70,35],['OF',74.68,17,43],['THE',74.96,64,50],['COLOR',75.16,7,64],['PINK',75.54,32,81]]},
{id:'finale',theme:'finale',gates:[],words:[['GIRL',76.72,10,11],['I’M',77.24,27,22],['SO',77.54,12,33],['IN',77.74,31,49],['LOVE',77.98,12,63],['WITH',78.30,54,83],['YOU',78.48,76,82]]}
];
