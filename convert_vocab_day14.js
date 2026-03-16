const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day14.txt');
const outputFile = path.join(__dirname, 'vocab_day14.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');

    // The data might be one big string or separated by newlines.
    // Let's normalize by removing newlines and treating it as one big string.
    const content = data.replace(/\r?\n/g, '');

    const result = [];

    // Remove header if present
    let text = content;
    const header = "編號單字 (中英)固定用法 / 常見搭配";
    if (text.startsWith(header)) {
        text = text.substring(header.length);
    }

    // We expect 41 items.
    // We can loop through numbers 1 to 41.
    // Strategy: Find the start index of "1<word>", "2<word>", ... "41<word>".
    // Since words follow immediately, we search for regex `/\d+[a-zA-Z]/`.
    // But specific numbers.

    // Let's first identify the starting positions of each number.
    // We loop i from 1 to 41.
    // But be careful: searching for "1" might find "11" or "41".
    // So we search for `${i}` followed by `[a-zA-Z]`. 
    // AND to avoid finding "1" inside "11", we can verify the sequence.

    // Actually, we can just regex execute iteratively?
    // /CurrentNumber([a-zA-Z].*?)NextNumber([a-zA-Z])/

    // Better strategy: Find all matches of `/\d+[a-zA-Z]/g` ?
    // "1international", "2attraction" ... "10locate" ... "33fill" ...
    // Note: "33fill out/in" starts with "33fill".

    // However, finding indexes in a large string.
    let indices = [];

    // To be robust, let's find the index of each number 1..41
    let searchPos = 0;
    for (let i = 1; i <= 41; i++) {
        // Construct regex to find `i` followed by a letter.
        // And we expect it to be after the previous one.
        // We know the number `i` is at the start of the token.
        // Since we removed header, `1` should be at index 0.
        // But let's search.

        // Regex: `i` followed by `[a-zA-Z]`.
        // We must ensure we don't match `1` in `11`.
        // If we search sequentially from `searchPos`, `1` will match `1international`.
        // Then `2` will match `2attraction` (after `1`'s end).
        // Then `11` will match `11approx`.

        // So for single digits, we just match `d`. For double digits `dd`.
        // The numbers are sequential.

        // Exception: `fill out/in` starts with `f`.

        // Let's try to match `${i}` followed by `[a-zA-Z]`.
        // But wait, what if word starts with non-letter? Unlikely here.

        const pattern = new RegExp(`${i}[a-zA-Z]`);
        // We need to find the match in `text.substring(searchPos)`.

        const match = text.substring(searchPos).match(pattern);

        if (!match) {
            console.error(`Could not find entry for number ${i}`);
            break;
        }

        // The actual index in `text`
        const matchIndex = searchPos + match.index;

        indices.push({
            order: i,
            startIndex: matchIndex,
            // The length of the number string
            numLen: String(i).length
        });

        // Update searchPos to be after this match so we find the next one.
        // But we want the full content.
        // We can just bump searchPos slightly.
        searchPos = matchIndex + 1;
    }

    // Now we have the start positions.
    // The content of item `i` goes from `indices[i].startIndex` to `indices[i+1].startIndex`.

    for (let k = 0; k < indices.length; k++) {
        const itemStart = indices[k].startIndex;
        const numberOffset = indices[k].numLen;

        let itemEnd;
        if (k < indices.length - 1) {
            itemEnd = indices[k + 1].startIndex;
        } else {
            itemEnd = text.length;
        }

        // The raw string for this entry, e.g. "1international (adj.) ... "
        const rawEntry = text.substring(itemStart, itemEnd);

        // Remove the number from the start
        // "1international..." -> "international..."
        const entryContent = rawEntry.substring(numberOffset).trim();

        // Now parse `entryContent`.
        // Format: `Word (Chinese) Usage`
        // Example: `international (adj.) 國際的常見搭配： international flights (國際航班)`

        // Identify where Usage starts.
        // Usage starts with `常見搭配` or `固定用法` or `固定搭配`.
        // Or sometimes `(無標示...)` ? Not in day 14 sample. Day 14 sample seems to always have keywords.
        // Except maybe `fill out/in`?
        // `33fill out/in (phr.) 填寫 (表格)固定用法：...`

        // Regex to split Word part and Usage part.
        const usageRegex = /(常見搭配|固定用法|固定搭配|無標示)/; // "不標示" or "無特殊" not seen in prompt sample, prompt uses `固定用法`, `常見搭配`.

        const matchUsage = entryContent.match(usageRegex);

        let wordPart, usagePart;

        if (matchUsage) {
            const splitIdx = matchUsage.index;
            wordPart = entryContent.substring(0, splitIdx).trim();
            usagePart = entryContent.substring(splitIdx).trim();
        } else {
            // No usage keyword found?
            // Maybe it is just Word part?
            wordPart = entryContent;
            usagePart = "";
            console.warn(`No usage keyword found for order ${indices[k].order}: ${entryContent}`);
        }

        // content inside wordPart: `Word (Chinese)`
        // `international (adj.) 國際的`
        // `fill out/in (phr.) 填寫 (表格)`

        // Find first `(`.
        const openParen = wordPart.indexOf('(');

        let word = "";
        let chinese = "";

        if (openParen !== -1) {
            word = wordPart.substring(0, openParen).trim();
            chinese = wordPart.substring(openParen).trim();
        } else {
            // fallback
            word = wordPart;
        }

        // Parse usagePart
        // It might look like: `常見搭配： A... 固定用法： B...`
        let common_usage_list = [];
        let fixed_collocation_list = [];

        if (usagePart) {
            const regex = /(常見搭配：?|固定用法：?|固定搭配：?)/g;
            // Colon might be missing or there? Prompt samples have colon `：`.

            let parts = [];
            let m;
            while ((m = regex.exec(usagePart)) !== null) {
                parts.push({
                    type: m[0],
                    index: m.index,
                    len: m[0].length
                });
            }

            parts.forEach((part, idx) => {
                let start = part.index + part.len;
                let end = (idx + 1 < parts.length) ? parts[idx + 1].index : usagePart.length;
                let content = usagePart.substring(start, end).trim();

                if (part.type.includes('常見搭配')) {
                    common_usage_list.push(content);
                } else {
                    fixed_collocation_list.push(content);
                }
            });
        }

        let common_usage = common_usage_list.join('\n');
        let fixed_collocation = fixed_collocation_list.join('\n');

        const id = `day14_${word.replace(/\//g, '_')}`;

        result.push({
            id: id,
            day: 14,
            order: indices[k].order,
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
