const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day12.txt');
const outputFile = path.join(__dirname, 'vocab_day12.json');

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

        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) continue;

        const orderStr = line.substring(0, firstCommaIndex);
        const rest = line.substring(firstCommaIndex + 1);

        // Find the separator between Word column and Usage column
        // The word column ends with ')' and is followed by a comma
        const separatorIndex = rest.indexOf('),');

        if (separatorIndex === -1) {
            console.warn(`Skipping malformed line (no separator found): ${line}`);
            continue;
        }

        const wordPart = rest.substring(0, separatorIndex + 1).trim(); // "word (chinese)"
        let usagePart = rest.substring(separatorIndex + 2).trim();   // "usage..."

        // Parse Word Part
        const openParenIndex = wordPart.indexOf('(');
        if (openParenIndex === -1) {
            console.warn(`Skipping malformed word part: ${wordPart}`);
            continue;
        }

        const word = wordPart.substring(0, openParenIndex).trim();
        const chinese = wordPart.substring(openParenIndex + 1, wordPart.length - 1).trim();

        // Parse Usage Part
        let common_usage = "";
        let fixed_collocation = "";

        // Remove placeholder
        if (usagePart.includes('(圖片未標註特定用法)') || usagePart.includes('(無特殊標註搭配)')) {
            usagePart = "";
        }

        if (usagePart) {
            // Updated parsing logic using regex for robustness
            // Match "常見搭配" followed by optional colon
            // Match "固定搭配" or "固定用法" followed by optional colon

            // We want to find the starting index of these sections.
            const commonMatch = usagePart.match(/(常見搭配)[:：]?/);
            const fixedMatch = usagePart.match(/(固定搭配|固定用法)[:：]?/);

            const commonIdx = commonMatch ? commonMatch.index : -1;
            const fixedIdx = fixedMatch ? fixedMatch.index : -1;
            const commonLen = commonMatch ? commonMatch[0].length : 0;
            const fixedLen = fixedMatch ? fixedMatch[0].length : 0;

            if (commonIdx !== -1 && fixedIdx !== -1) {
                // Both exist
                if (commonIdx < fixedIdx) {
                    // Common first
                    common_usage = usagePart.substring(commonIdx + commonLen, fixedIdx).trim();
                    fixed_collocation = usagePart.substring(fixedIdx + fixedLen).trim();
                } else {
                    // Fixed first
                    fixed_collocation = usagePart.substring(fixedIdx + fixedLen, commonIdx).trim();
                    common_usage = usagePart.substring(commonIdx + commonLen).trim();
                }
            } else if (commonIdx !== -1) {
                // Only common
                common_usage = usagePart.substring(commonIdx + commonLen).trim();
            } else if (fixedIdx !== -1) {
                // Only fixed
                fixed_collocation = usagePart.substring(fixedIdx + fixedLen).trim();
            } else {
                // No keywords, put entire usage in common_usage as fallback, or log warning?
                // Based on previous files, if "usage" is just text like "safety precautions", maybe it belongs to common?
                // But typically the file has explicit updated format.
                // Let's check if usagePart is empty or just punctuation.
                if (usagePart.length > 2) {
                    common_usage = usagePart;
                }
            }
        }

        const id = `day12_${word}`;

        result.push({
            id: id,
            day: 12,
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
