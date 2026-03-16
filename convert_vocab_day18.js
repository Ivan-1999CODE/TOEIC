const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day18.txt');
const outputFile = path.join(__dirname, 'vocab_day18.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Normalize newlines
    let text = data.replace(/\r?\n/g, '');

    // Skip header if present
    const header = "編號單字 (中/英)固定搭配 / 常見搭配整理";
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

        // Advance searchPos slightly to avoid matching the same spot?
        // Actually we want to search for the *next* number which should be further ahead.
        // But to be safe, move past the current number.
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

        // entryContent example: "check in (phr.) 辦理入住/報到手續【固定搭配】..."

        // Split Word vs Rest
        // usage markers: 【固定搭配】, 【常見搭配】, (無標示, 【固定用法】
        const markers = ['【固定搭配】', '【常見搭配】', '(無標示', '【固定用法】', '固定搭配', '常見搭配'];

        // Find the earliest occurrence of a usage marker
        let splitIndex = -1;
        let foundMarker = "";

        // We also need to separate Word from Chinese.
        // Usually `Word` is followed by `(pos)`.
        // So finding the first `(` is a good heuristic for "End of Word".
        // BUT `(無標示` also starts with `(`.

        // Find first `(`
        const firstParen = entryContent.indexOf('(');
        if (firstParen !== -1) {
            // Is this `(` start of usage "(無標示"?
            if (entryContent.substring(firstParen).startsWith('(無標示') ||
                entryContent.substring(firstParen).startsWith('(无标示')) {
                // Then Word is everything before. Chinese is missing??
                // Or maybe Chinese is before `(`?
                // Example: `4chef (n.) 主廚(無標示特定搭配)`
                // `(n.)` is first paren.
                // `(無標示` is second paren.
            }
        }

        // Better strategy:
        // 1. Identify Usage Part start.
        // 2. Identify Word/Chinese split in the part BEFORE Usage.

        let usageStartIndex = entryContent.length; // Default to end (no usage part)

        let bestMarkerIndex = Infinity;

        // Check for 【...】 style markers first
        const bracketIndex = entryContent.indexOf('【');
        if (bracketIndex !== -1) {
            bestMarkerIndex = bracketIndex;
        }

        // Check for `(無標示`
        const noLabelIndex = entryContent.indexOf('(無標示');
        if (noLabelIndex !== -1 && noLabelIndex < bestMarkerIndex) {
            bestMarkerIndex = noLabelIndex;
        }

        const noLabelIndexSimp = entryContent.indexOf('(无标示');
        if (noLabelIndexSimp !== -1 && noLabelIndexSimp < bestMarkerIndex) {
            bestMarkerIndex = noLabelIndexSimp;
        }

        if (bestMarkerIndex !== Infinity) {
            usageStartIndex = bestMarkerIndex;
        }

        const wordChinesePart = entryContent.substring(0, usageStartIndex).trim();
        const usagePart = entryContent.substring(usageStartIndex).trim();

        // Parse Word/Chinese
        // "check in (phr.) 辦理入住/報到手續"
        // "chef (n.) 主廚"
        // Split at first `(`.
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
        // Usage might contain: "【固定搭配】 A 【常見搭配】 B"
        // Or "(無標示特定搭配)"
        let common = [];
        let fixed = [];

        if (usagePart && !usagePart.includes('無標示') && !usagePart.includes('无标示')) {
            // Split by markers.
            // Markers look like 【...】
            // We can split by `/(【[^】]+】)/`
            const tokens = usagePart.split(/(【[^】]+】)/).filter(t => t.trim().length > 0);

            let currentTag = "";
            for (const token of tokens) {
                if (token.startsWith('【') && token.endsWith('】')) {
                    currentTag = token;
                } else {
                    if (currentTag.includes('固定')) {
                        fixed.push(token.trim());
                    } else if (currentTag.includes('常見') || currentTag.includes('常用')) {
                        common.push(token.trim());
                    } else {
                        // Default to one or the other? Or just ignore/append?
                        // If we have content but no tag yet (unlikely), ignore?
                    }
                }
            }
        }

        const id = `day18_${word}`;

        result.push({
            id: id,
            day: 18,
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
