const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day24.txt');
const outputFile = path.join(__dirname, 'vocab_day24.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    let text = data.replace(/\r?\n/g, '');

    const header = "編號單字 (English / Chinese)用法整理 (固定用法 / 常見搭配)";
    if (text.startsWith(header)) {
        text = text.substring(header.length);
    }

    const result = [];
    let indices = [];
    let searchPos = 0;

    // 1. Identify start positions of each number 1..41
    for (let i = 1; i <= 41; i++) {
        const pattern = new RegExp(i + "[a-zA-Z]");
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
            numLen: String(i).length
        });

        searchPos = matchIndex + 1;
    }

    // 2. Extract and parse content
    for (let k = 0; k < indices.length; k++) {
        const itemStart = indices[k].startIndex;
        const numberOffset = indices[k].numLen;

        let itemEnd;
        if (k < indices.length - 1) {
            itemEnd = indices[k + 1].startIndex;
        } else {
            itemEnd = text.length;
        }

        const rawEntry = text.substring(itemStart, itemEnd);
        const entryContent = rawEntry.substring(numberOffset).trim();

        // entryContent example: "appoint  (v.) 任命，指派固定搭配： appoint A as B (任命 A 為 B)"

        // Find split point between Word/Chinese and Usage
        // Usage starts with "固定搭配：" or "常見搭配：" or "固定用法："

        const usageKeywords = ['固定搭配：', '常見搭配：', '固定用法：'];
        let usageStart = -1;

        for (const kw of usageKeywords) {
            const idx = entryContent.indexOf(kw);
            if (idx !== -1 && (usageStart === -1 || idx < usageStart)) {
                usageStart = idx;
            }
        }

        let wordChinesePart = "";
        let usagePart = "";

        if (usageStart !== -1) {
            wordChinesePart = entryContent.substring(0, usageStart).trim();
            usagePart = entryContent.substring(usageStart).trim();
        } else {
            wordChinesePart = entryContent;
            usagePart = "";
        }

        // Parse Word/Chinese
        // "appoint  (v.) 任命，指派"
        let word = "";
        let chinese = "";

        const parenIdx = wordChinesePart.indexOf('(');
        if (parenIdx !== -1) {
            word = wordChinesePart.substring(0, parenIdx).trim();
            chinese = wordChinesePart.substring(parenIdx).trim();
        } else {
            word = wordChinesePart;
            chinese = "";
        }

        let common = [];
        let fixed = [];

        if (usagePart) {
            // Split by keywords
            // "固定搭配： A  常見搭配： B"
            // Note: sometimes there are multiple spaces.

            const tokens = usagePart.split(/(固定搭配：|常見搭配：|固定用法：)/).filter(t => t.trim() !== '');

            let currentType = "";
            for (const token of tokens) {
                if (token.includes('：')) {
                    currentType = token;
                } else {
                    // Content
                    if (currentType.includes('固定')) {
                        fixed.push(token.trim());
                    } else if (currentType.includes('常見')) {
                        common.push(token.trim());
                    }
                }
            }
        }

        const id = `day24_${word}`;

        result.push({
            id: id,
            day: 24,
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
