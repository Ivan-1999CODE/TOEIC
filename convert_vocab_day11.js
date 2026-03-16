const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day11_temp.txt');
const outputFile = path.join(__dirname, 'vocab_day11.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    const result = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV-like structure
        // Format: Number, Word (Chinese), Usage
        // Usage might contain commas, Chinese might contain commas.
        // We assume the separation between Word and Usage is ")," 

        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) continue;

        const orderStr = line.substring(0, firstCommaIndex);
        const rest = line.substring(firstCommaIndex + 1);

        // Find the separator between Word column and Usage column
        // The word column always ends with ')' and is followed by a comma
        const separatorIndex = rest.indexOf('),');

        if (separatorIndex === -1) {
            console.warn(`Skipping malformed line (no separator found): ${line}`);
            continue;
        }

        const wordPart = rest.substring(0, separatorIndex + 1).trim(); // "word (chinese)"
        const usagePart = rest.substring(separatorIndex + 2).trim();   // "usage..."

        // Parse Word Part
        const openParenIndex = wordPart.indexOf('(');
        if (openParenIndex === -1) {
            console.warn(`Skipping malformed word part: ${wordPart}`);
            continue;
        }

        const word = wordPart.substring(0, openParenIndex).trim();
        // Extract content inside parentheses for chinese
        const chinese = wordPart.substring(openParenIndex + 1, wordPart.length - 1).trim();

        // Parse Usage Part
        let common_usage = "";
        let fixed_collocation = "";

        if (usagePart.includes('(無特殊標註搭配)')) {
            // Leave empty
        } else if (usagePart.startsWith('常見搭配：')) {
            common_usage = usagePart.replace('常見搭配：', '').trim();
        } else if (usagePart.startsWith('固定搭配：')) {
            fixed_collocation = usagePart.replace('固定搭配：', '').trim();
        } else if (usagePart.startsWith('固定用法')) {
            fixed_collocation = usagePart.replace(/固定用法.*：/, '').trim();
        } else {
            // Fallback or mixed?
            // Existing data seems to only have one or the other per line, or none.
            // If there's something else, we might put it in common_usage by default or check prefix.
            // Based on prompt, we strictly look for prefixes.
            if (usagePart.includes('常見搭配')) {
                common_usage = usagePart;
            } else if (usagePart.includes('固定搭配')) {
                fixed_collocation = usagePart;
            } else {
                common_usage = usagePart; // Default bucket?
            }
        }

        const id = `day11_${word}`;

        result.push({
            id: id,
            day: 11,
            order: parseInt(orderStr, 10),
            word: word,
            chinese: chinese,
            fixed_collocation: fixed_collocation,
            common_usage: common_usage
        });
    }

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Successfully converted ${result.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
