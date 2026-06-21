const fs = require('fs');
global.window = {};
global.document = {
    getElementById: (id) => ({ value:
        id === 'solarDate' ? '1998-11-19' :
        id === 'timezone' ? '7' :
        id === 'hour' ? 'Dần' :
        id === 'annualYear' ? '2026' :
        id === 'gender' ? 'male' :
        '1'
    })
};
const src = fs.readFileSync('/home/mich43l/Projects/void-occult/pages/purple-star/tu-vi-engine-nam-phai.js', 'utf8');
const utils = fs.readFileSync('/home/mich43l/Projects/void-occult/pages/purple-star/tu-vi-utils.js', 'utf8');
eval(utils);
eval(src);

const engine = window.TuViEngines['nam-phai'];
const data = engine.getData();
console.log("Tiểu hạn: " + data.palaces.find(p => p.isSmallLimitPalace).name);
data.palaces.forEach(p => {
    if(p.flowMonths && p.flowMonths.length > 0) {
        console.log(p.name + " (" + p.branch + "): " + p.flowMonths.map(m => "T" + m.month).join(", "));
    }
});
