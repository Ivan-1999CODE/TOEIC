const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day21.txt');
const outputFile = path.join(__dirname, 'vocab_day21.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Normalize newlines
    let text = data.replace(/\r?\n/g, '');

    // Skip header if present
    const header = "編號單字 (中英文)固定用法 / 常見搭配";
    if (text.startsWith(header)) {
        text = text.substring(header.length);
    }

    const result = [];
    let indices = [];
    let searchPos = 0;

    // 1. Identify start positions of each number 1..42
    for (let i = 1; i <= 42; i++) {
        // Look for number `i` followed immediately by a letter (or maybe space + letter)
        // Regex: `i` + `[a-zA-Z]`
        // We use string concatenation for the regex pattern
        const pattern = new RegExp(i + "[a-zA-Z]");

        // Search in the substring starting from searchPos
        const substring = text.substring(searchPos);
        const match = substring.match(pattern);

        if (!match) {
            console.error(`Could not find entry for number ${i}`);
            break;
        }

        const matchIndex = searchPos + match.index;
        indices.push({
            order: i,
            startIndex: matchIndex,
            // length of the number string itself (e.g. "1" is 1, "10" is 2)
            numLen: String(i).length
        });

        searchPos = matchIndex + 1;
    }

    // 2. Extract and parse content
    for (let k = 0; k < indices.length; k++) {
        const itemStart = indices[k].startIndex;
        const numberOffset = indices[k].numLen; // length of digits

        let itemEnd;
        if (k < indices.length - 1) {
            itemEnd = indices[k + 1].startIndex;
        } else {
            itemEnd = text.length;
        }

        const rawEntry = text.substring(itemStart, itemEnd);
        // Remove the leading number
        const entryContent = rawEntry.substring(numberOffset).trim();

        // entryContent example: "announce (v.) 宣布，公告固定搭配： announce + 內容 (受詞為宣布的內容)"

        // Identify Usage Part start.
        const usageKeywords = ['固定搭配：', '常見搭配：', '固定用法：'];
        let usageStart = -1;

        for (const kw of usageKeywords) {
            const idx = entryContent.indexOf(kw);
            if (idx !== -1 && (usageStart === -1 || idx < usageStart)) {
                usageStart = idx;
            }
        }

        let wordChinese = "";
        let usagePart = "";

        if (usageStart !== -1) {
            wordChinese = entryContent.substring(0, usageStart).trim();
            usagePart = entryContent.substring(usageStart).trim();
        } else {
            wordChinese = entryContent;
            usagePart = "";
        }

        // Parse Word (Chinese)
        // "announce (v.) 宣布，公告"
        let word = "";
        let chinese = "";

        const parenIdx = wordChinese.indexOf('(');
        if (parenIdx !== -1) {
            word = wordChinese.substring(0, parenIdx).trim();
            chinese = wordChinese.substring(parenIdx).trim();
        } else {
            word = wordChinese;
            chinese = "";
        }

        // Parse Usage
        // Usage might contain: "固定搭配： A 常見搭配： B"
        let common = [];
        let fixed = [];

        if (usagePart) {
            // Split by keywords `固定搭配：`, `常見搭配：`
            // Use regex split with capture group to keep delimiters
            const tokens = usagePart.split(/(固定搭配：|常見搭配：|固定用法：)/).filter(t => t.trim() !== '');

            let currentType = "";

            for (const token of tokens) {
                if (token.includes('：')) {
                    currentType = token;
                } else {
                    // This is content
                    if (currentType.includes('固定')) {
                        fixed.push(token.trim());
                    } else if (currentType.includes('常見')) {
                        common.push(token.trim());
                    }
                }
            }
        }

        const id = `day21_${word}`;

        result.push({
            id: id,
            day: 21,
            order: indices[k].order,
            word: word,
            chinese: chinese,
            fixed_collocation: fixed.join('\n'),
            common_usage: common.join('\n')
        });
    }

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Successfully converted ${result.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
