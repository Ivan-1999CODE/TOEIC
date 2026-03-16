const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day23.txt');
const outputFile = path.join(__dirname, 'vocab_day23.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Normalize newlines and whitespace
    let text = data.replace(/\r?\n/g, '');

    // Skip header if present
    const header = "編號單字 (中/英)固定搭配 / 常見搭配";
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

        // entryContent example: "host (v. 主辦；n. 主人)[常見搭配] host + a display..."
        // or "purpose (n. 目的)(圖片無標示特定搭配)"

        // Identify Split Point between Word/Chinese and Usage
        // Usage starts with `[` or `(圖片` or `(圖`

        let splitIndex = entryContent.length;

        const bracketIndex = entryContent.indexOf('[');
        const noLabelIndex = entryContent.indexOf('(圖片');
        const noLabelIndexShort = entryContent.indexOf('(圖'); // just in case

        // Find the FIRST occurrence of any of these
        const potentialIndices = [bracketIndex, noLabelIndex].filter(idx => idx !== -1);
        if (potentialIndices.length > 0) {
            splitIndex = Math.min(...potentialIndices);
        } else if (noLabelIndexShort !== -1) {
            splitIndex = noLabelIndexShort;
        }

        const wordChinesePart = entryContent.substring(0, splitIndex).trim();
        const usagePart = entryContent.substring(splitIndex).trim();

        // Parse Word/Chinese
        // "host (v. 主辦；n. 主人)"
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

        // Parse Usage
        // Usage starts with `[常見搭配] ...` or `[固定搭配] ...` or `(圖片...`
        let common = [];
        let fixed = [];

        if (usagePart && !usagePart.includes('(圖片') && !usagePart.includes('(圖')) {
            // Split by `[`
            // "[常見搭配] content [固定搭配] content"
            // Split regex: `(\[[^\]]+\])`
            const tokens = usagePart.split(/(\[[^\]]+\])/).filter(t => t.trim() !== '');

            let currentType = "";
            for (const token of tokens) {
                if (token.startsWith('[') && token.endsWith(']')) {
                    currentType = token;
                } else {
                    // Content
                    // Sometimes content contains multiple items separated by `；`?
                    // "annual growth rate ... (年成長率)；annual conference..."
                    // We can keep them as one string or split.
                    // The prompt usually expects raw string but maybe cleaner to start new lines?
                    // The UI handles newlines.
                    // Let's create new lines for `；`.
                    // But maybe only if they look like separate items.

                    const content = token.trim(); // .replace(/；/g, '\n'); 
                    // Let's replace full-width semicolon with newline for better readability
                    // Only if it separates distinct phrases.

                    const formattedContent = content.split('；').map(c => c.trim()).join('\n');

                    if (currentType.includes('固定')) {
                        fixed.push(formattedContent);
                    } else if (currentType.includes('常見')) {
                        common.push(formattedContent);
                    }
                }
            }
        }

        const id = `day23_${word}`;

        result.push({
            id: id,
            day: 23,
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
