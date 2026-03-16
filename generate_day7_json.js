const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day7.txt');
const outputFile = path.join(__dirname, 'vocab_day7.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split('\n');
    const words = [];

    // Skip header line if present (starts with "編號")
    // But index based loop or filter is safer

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('編號')) continue;

        // Simple CSV split by comma, BUT need to handle potential commas in content if quoted?
        // Looking at the data, commas seem to be delimiters.
        // "1,survey (n./v.),調查，意見調查," -> 4 parts.
        // "2,analysis (n.),分析,● 常見搭配：..." -> 4 parts.
        // Let's use a regex or just simple split limit? 
        // Actually, the Chinese part might contain commas "調查，意見調查".
        // Strategy: 
        // 1. Get first comma index -> Order
        // 2. Get second comma index -> Word part
        // 3. Get third comma index -> Chinese part
        // 4. Rest is collocation

        const parts = line.split(',');
        if (parts.length < 3) continue;

        const order = parseInt(parts[0].trim());
        const wordPart = parts[1].trim(); // "survey (n./v.)"
        const chinesePart = parts[2].trim();
        // Note: parts[2] might only be part of chinese if there was a comma in chinese.
        // Let's re-parse using indices.

        const firstComma = line.indexOf(',');
        const secondComma = line.indexOf(',', firstComma + 1);
        const thirdComma = line.indexOf(',', secondComma + 1);

        // wordPart is between first and second comma
        const wordRaw = line.substring(firstComma + 1, secondComma).trim();

        // word cleanup: "survey (n./v.)" -> "survey"
        const wordMatch = wordRaw.match(/^([a-zA-Z\s\-]+)\s*(\(.*\))?$/);
        const word = wordMatch ? wordMatch[1].trim() : wordRaw;

        // chinesePart is between second and third comma (or end if no third comma?)
        // Wait, "1,survey (n./v.),調查，意見調查," -> ends with comma.
        // "2,analysis (n.),...,..."

        // Actually, looking at line 1: "1,survey (n./v.),調查，意見調查,"
        // convert "調查，意見調查" -> this has a FULLWIDTH comma (，), not a standard comma (,).
        // So standard split(',') might actually work fine if they used fullwidth commas in text.
        // Let's check line 1 again: "1,survey (n./v.),調查，意見調查,".
        // It has a trailing comma.

        // Let's assume standard split is RISK due to user input. 
        // Let's assume the first 2 commas are structural.
        // 1. Order
        // 2. Word (POS)
        // 3. Chinese
        // 4. Collocations (everything else)

        // Let's try to reconstruct based on knowledge of columns.

        // Correct approach:
        // parts[0] is Order
        // parts[1] is Word (POS)
        // parts[2] is Chinese (might be "調查，意見調查" - wait, is that a halfwidth comma in the raw text?)
        // Let's look at raw text snippet provided: "調查，意見調查" -> Looks like fullwidth.

        let fixed_collocation = '';
        let common_usage = '';
        let collocationsRaw = '';

        if (parts.length >= 4) {
            // Join the rest back in case split broke something, but usually column 4 is the rest.
            // Actually, because of the trailing comma in line 1, parts has empty string at end.
            // "...,...,調查，意見調查," -> parts[3] is ""

            // Column 4 content starts at parts[3].
            collocationsRaw = parts.slice(3).join(',').trim();
        }

        // Extract Collocations
        // Format: "● 常見搭配：...● 固定搭配：..."
        // Split by "●"

        if (collocationsRaw) {
            const items = collocationsRaw.split('●').map(s => s.trim()).filter(s => s);
            items.forEach(item => {
                if (item.startsWith('固定搭配：')) {
                    const val = item.replace('固定搭配：', '').trim();
                    fixed_collocation = fixed_collocation ? fixed_collocation + '\n' + val : val;
                } else if (item.startsWith('常見搭配：')) {
                    const val = item.replace('常見搭配：', '').trim();
                    common_usage = common_usage ? common_usage + '\n' + val : val;
                }
            });
        }

        // Verify Chinese part didn't get split incorrectly?
        // If the user used standard comma in Chinese, parts[2] would be "調查", parts[3] "意見調查".
        // But the example shows "調查，意見調查" with fullwidth.

        // Let's handle the specific "word (pos)" format extraction carefully.

        words.push({
            order: order,
            day: 7,
            word: word,
            id: `day7_${word}`,
            chinese: chinesePart, // Assuming no half-width commas in Chinese
            fixed_collocation: fixed_collocation,
            common_usage: common_usage
        });
    }

    fs.writeFileSync(outputFile, JSON.stringify(words, null, 2), 'utf8');
    console.log(`Successfully generated ${outputFile} with ${words.length} words.`);

} catch (err) {
    console.error('Error processing file:', err);
}
