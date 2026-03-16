const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day28.txt');
const outputFile = path.join(__dirname, 'vocab_day28.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Normalize newlines and spaces
    let text = data.replace(/\r?\n/g, '');

    // Skip header if present
    const header = "編號單字 (English)中文 (Chinese)固定用法 / 常見搭配";
    if (text.startsWith(header)) {
        text = text.substring(header.length);
    }

    const result = [];
    let indices = [];
    let searchPos = 0;

    // 1. Identify start positions of each number 1..40
    for (let i = 1; i <= 40; i++) {
        // Look for number `i` followed immediately by a letter (or maybe space + letter)
        // Regex: `i` + `[a-zA-Z]`
        // Since there is no separator, we rely on number + English word
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

        // entryContent example: "furnished配有家具的"
        // or "residence住處，住宅常見搭配： an official residence (官邸)"

        // 1. Check for Usage Start
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

        // 2. Separate Word and Chinese
        // Word is English. Chinese starts with non-ascii usually.
        // Or simpler: find first character that is NOT [a-zA-Z\s-]
        // But Chinese definitions might start with punctuation like `(` (e.g., `(n.)`)?
        // Wait, the prompt provided Chinese directly: `配有家具的`. No POS tag like `(n.)` mentioned in example `1furnished配有家具的`.
        // But previous days had POS tags.
        // Let's assume standard ASCII vs non-ASCII split.

        // Find index of first non-ASCII character
        // Regex specific for typical english word characters vs chinese
        // Note: Word might contain hyphen.

        // Let's iterate.
        let splitIndex = -1;
        for (let j = 0; j < wordChinesePart.length; j++) {
            const charCode = wordChinesePart.charCodeAt(j);
            // ASCII printable range: 32-126
            // But we specifically look for non-English letters.
            // Chinese chars are typically > 255
            if (charCode > 255) {
                splitIndex = j;
                break;
            }
        }

        let word = "";
        let chinese = "";

        if (splitIndex !== -1) {
            word = wordChinesePart.substring(0, splitIndex).trim();
            chinese = wordChinesePart.substring(splitIndex).trim();
        } else {
            // All ASCII?
            word = wordChinesePart;
            chinese = "";
        }

        // Parse Usage
        // "常見搭配： an official residence (官邸)"
        // "固定搭配： drape A with B (用 B 裝飾 A)"

        let common = [];
        let fixed = [];

        if (usagePart) {
            // Split by keywords
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

        const id = `day28_${word}`;

        result.push({
            id: id,
            day: 28,
            order: indices[k].order,
            word: word,
            chinese: chinese,
            fixed_collocation_list: fixed,
            common_usage_list: common
        });
    }

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Successfully converted ${result.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
