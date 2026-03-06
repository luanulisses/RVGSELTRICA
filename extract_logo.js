
const fs = require('fs');
const path = require('path');

const htmlPath = 'C:\\Users\\luan.muniz\\Documents\\RVGS ELETRICA\\RVGS ELETRICA\\html\\rvgs-eletrica (4).html';
const outputPath = 'C:\\Users\\luan.muniz\\Documents\\RVGS ELETRICA\\RVGS ELETRICA\\public\\logo_transparent.png';

const content = fs.readFileSync(htmlPath, 'utf8');
const match = content.match(/src="data:image\/png;base64,([^"]+)"/);

if (match) {
    const base64Data = match[1];
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Logo saved successfully to ${outputPath}`);
} else {
    console.log("Could not find base64 logo in HTML");
}
