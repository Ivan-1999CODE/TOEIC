const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day8.txt');
const outputFile = path.join(__dirname, 'vocab_day8.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split('\n');
    const words = [];

    // Skip header
    // Header: 編號,單字 (中/英),搭配用法標示

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('編號')) continue;

        // Split by comma. 
        // 1,advertisement [n.] 廣告,-
        // 4,influence [v./n.] 影響,固定搭配： have an influence on (對⋯有影響)

        // Find first comma -> Order
        const firstComma = line.indexOf(',');
        if (firstComma === -1) continue;

        const order = parseInt(line.substring(0, firstComma).trim());

        // Find last comma? No, column 3 might contain commas?
        // "固定搭配： advise A to do (建議 A 做⋯)常見搭配： advise A on B (給 A 關於 B 的建議)"
        // It seems column 3 is "Description".
        // Let's assume the CSV structure is strictly 3 columns.
        // But the "Word" column might have commas? "introduce [v.] 介紹，發表 (商品)" -> Yes.
        // So we can't key off the second comma easily if we search from start.
        // We can search for the start of the LAST column?
        // The last column is "搭配用法標示".
        // It starts after the last comma? 
        // Or maybe we can just verify if (comma count > 2).

        // Strategy: 
        // Col 1 is Order (digits).
        // Col 2 is "Word [pos] Chinese".
        // Col 3 is "Collocations".

        // Let's assume the LAST comma separates Col 2 and Col 3?
        // No, Col 3 text might have commas.
        // But Col 2 text "introduce [v.] 介紹，發表 (商品)" has fullwidth comma "，" or halfwidth?
        // "介紹，發表" -> The prompt text has "，" (fullwidth).
        // Let's assume standard commas "," are only used as delimiters in the CSV structure IF the content uses fullwidth.

        // Let's try splitting by ",".
        const parts = line.split(',');

        // If there are exactly 3 parts, great.
        // If > 3, we need to merge?
        // "1,advertisement [n.] 廣告,-" -> 3 parts.

        // "31,cover [v.] 包含；支付,常見搭配： 可換成 report on (報導) 或 pay (支付)" -> 3 parts.

        // Let's rely on the first comma.
        // And then we need to separate Col 2 and Col 3.
        // Col 2 usually ends with a Chinese char or )?
        // Col 3 starts with - or "固定搭配" or "常見搭配".

        // Let's find the position of the last comma? 
        // Risk: "固定搭配： ..., ..." if collocations have commas.
        // Prompt data: "常見搭配： advise A on B (給 A 關於 B 的建議)" -> No comma.
        // "常見搭配： a/the majority of... (大多數的⋯)" -> No comma.

        // Actually, let's look at the structure of text in Col 2.
        // It always contains `[...]`.

        // Let's parse with a more robust regex if possible, or just split limit.
        // But `String.split(separator, limit)` puts the rest in the last element? No, it truncates.

        // Let's try to match the 3 columns pattern.
        // ^(\d+),(.+),(.+)$
        // Note that . matches comma too.
        // We want the last column to be the collocation part.

        // Let's iterate from the back to find the last comma?
        // If Col 3 has commas, this fails.
        // Does Col 3 have commas? 
        // "常見搭配： a huge step forward (很大的進步)固定搭配： look forward to -ing (期待⋯)"
        // No obvious commas in the known usage examples.
        // However, "31,cover [v.] 包含；支付,常見搭配： 可換成 report on (報導) 或 pay (支付)"
        // No commas.

        // What if we assume Col 2 DOES NOT have standard commas?
        // "introduce [v.] 介紹，發表 (商品)" -> If "，" is fullwidth, we are safe.
        // Let's assume provided text uses fullwidth for text content.

        const safeParts = line.split(',');
        if (safeParts.length < 3) {
            console.warn(`Skipping malformed line: ${line}`);
            continue;
        }

        // If length > 3, it means we have extra commas. 
        // We know Col 1 is index 0.
        // We assume Col 3 is the LAST part? Or we merge?
        // Let's assume Col 3 is just the last part IF Col 2 had commas? 
        // OR Col 2 had commas?

        // Let's try to identify where Col 2 ends.
        // Col 3 usually starts with "固定搭配" or "常見搭配" or "-".
        // Let's join parts from index 1 to length-1... and find the split point?
        // OR just assume 3 parts because "，" != ",".

        // Case: "1,advertisement [n.] 廣告,-"
        const col1 = safeParts[0];
        const colLast = safeParts[safeParts.length - 1]; // Col 3 might be just this?
        // What if Col 3 has commas?
        // There is no guarantee. 

        // Let's look at the raw file generation. I pasted it exactly.
        // The user provided text has "，" (fullwidth) in "介紹，發表".
        // So standard split(',') should return exactly 3 parts if there are no commas in collocations.
        // If there are > 3 parts, it's ambiguous without more info.
        // But scanning the user input:
        // No standard commas visible in the "Common/Fixed Collocation" column.

        // So we will stick to: 
        // 1. Order
        // 2. Word + Chinese
        // 3. Collocations (Merged if split? No, assume unique separator).

        // To be safe, let's Join parts [1] to [length-2] as Col 2? 
        // And [length-1] as Col 3?
        // Example: "1, word, desc" -> length 3. col 2 is parts[1].
        // Example: "1, word, with, comma, desc" -> length 5. col 2 is "word, with, comma".

        const orderNum = parseInt(safeParts[0]);
        const col3Raw = safeParts[safeParts.length - 1];
        const col2Raw = safeParts.slice(1, safeParts.length - 1).join(',');

        // Parse Col 2: "advertisement [n.] 廣告"
        // We need "word" and "chinese".
        // Split by " ["? Or just "["?
        const bracketIndex = col2Raw.indexOf('[');
        let word = col2Raw;
        let chinese = '';

        if (bracketIndex !== -1) {
            word = col2Raw.substring(0, bracketIndex).trim();
            chinese = col2Raw.substring(bracketIndex).trim();
        }

        // Generate ID
        const id = `day8_${word}`;

        // Parse Col 3: "固定搭配： ... 常見搭配： ..."
        let fixed_collocation = '';
        let common_usage = '';

        if (col3Raw && col3Raw !== '-') {
            // Split by "固定搭配：" "常見搭配："
            // The text might be concatenated like: "固定搭配： xxx常見搭配： yyy" (no space?)
            // Or "固定搭配： xxx● 常見搭配： yyy" (from Day 7)? 
            // Day 8 input sample: "固定搭配： have an influence on (對⋯有影響)" (One item)
            // "常見搭配： aim to do (以做⋯為目標)常見搭配： aimed at (以⋯為目標客層的產品)" (Run together)

            // Regex to split?
            // Tokens: "固定搭配：" , "常見搭配："
            // We can iterate.

            const tags = ['固定搭配：', '常見搭配：'];
            // We need to split the string preserving the delimiters, or find indices.

            // Simplest way: Replace tags with "\nTAG" to split by newline?
            let processed = col3Raw;
            processed = processed.replace(/固定搭配：/g, '###FIXED###');
            processed = processed.replace(/常見搭配：/g, '###COMMON###');

            const segments = processed.split('###');

            segments.forEach(seg => {
                if (seg.startsWith('FIXED###')) {
                    const val = seg.replace('FIXED###', '').trim();
                    if (fixed_collocation) fixed_collocation += '\n' + val;
                    else fixed_collocation = val;
                } else if (seg.startsWith('COMMON###')) {
                    const val = seg.replace('COMMON###', '').trim();
                    if (common_usage) common_usage += '\n' + val;
                    else common_usage = val;
                }
            });
        }

        words.push({
            order: orderNum,
            day: 8,
            word: word,
            id: id,
            chinese: chinese,
            fixed_collocation: fixed_collocation,
            common_usage: common_usage
        });
    }

    fs.writeFileSync(outputFile, JSON.stringify(words, null, 2), 'utf8');
    console.log(`Successfully generated ${outputFile} with ${words.length} words.`);

} catch (err) {
    console.error('Error processing file:', err);
}
