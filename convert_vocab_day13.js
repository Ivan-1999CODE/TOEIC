const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day13.txt');
const outputFile = path.join(__dirname, 'vocab_day13.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    const result = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split by the FIRST comma
        const firstCommaIndex = line.indexOf(',');
        if (firstCommaIndex === -1) continue;

        const orderStr = line.substring(0, firstCommaIndex);
        const rest = line.substring(firstCommaIndex + 1);

        // Split by the LAST comma to separate Word Part and Usage Part?
        // No, some Usage lines have multiple commas.
        // Some Word lines have commas inside? 
        // "complaint (n.) 抱怨" -> no comma.
        // "deal (v./n.) 處理；交易" -> no comma.
        // But "Usage" always starts with "常見搭配：" or "固定用法：" or "(無標示...)" in this set?
        // Wait, line 3: "3,argumentative (adj.) 爭辯的,(無標示特定搭配...)" -> comma before usage.
        // Line 1: "...抱怨,常見搭配..." -> comma before usage.

        // BUT, what if the Chinese meaning has a comma? "Research (n.) 研究，調查" -> yes comma.
        // If we split by comma, we might split the Chinese meaning.

        // Let's look for the START of the usage section.
        // Usage section starts with `(無標示` OR `常見搭配：` OR `固定用法：` OR `固定搭配：`.
        // We can search for the INDEX of `,常見搭配：` or `,固定用法：` or `,(無標示` or `,固定搭配：`. 
        // Or simply the last comma if we assume Chinese part doesn't have commas that look like separators?
        // Actually, "1,complaint (n.) 抱怨,常見搭配..." -> The separator is clearly a comma.
        // "1,research (n. 研究，調查),常見搭配..." -> Separator is comma.

        // But "research (n. 研究，調查)" contains a comma!
        // So splitting by comma is dangerous if we just split all.

        // However, the usage part *usually* starts with specific keywords.
        // Let's try to find the last comma? No, usage can have commas inside parens.
        // Let's rely on the structure `Order,WordPart,UsagePart`.
        // If Order is number, we consumed it. `rest` is `WordPart,UsagePart`.

        // We need to find the split between WordPart and UsagePart.
        // Strategy: Look for `,常見搭配` or `,固定用法` or `,固定搭配` or `,(無標示`.
        // If found, split there.

        let splitIndex = -1;
        const keywords = [',常見搭配', ',固定用法', ',固定搭配', ',(無標示'];

        // Find the first occurrence of ANY keyword.
        let minIndex = -1;

        keywords.forEach(kw => {
            const idx = rest.indexOf(kw);
            if (idx !== -1) {
                if (minIndex === -1 || idx < minIndex) {
                    minIndex = idx;
                }
            }
        });

        if (minIndex !== -1) {
            splitIndex = minIndex;
        } else {
            // Fallback: If no keyword found, maybe it's just `WordPart`?
            // Or maybe the usage starts with something else?
            // Prompt says: "固定用法與常見搭配". 
            // Let's assume there's always a usage part, even if empty?
            // Maybe split by Last Comma if no keyword?
            // But "research (n. 研究，調查)" -> split by last comma -> `調查)`? No.
            // If no keyword is found, let's treat it all as WordPart and warn?
            // Or maybe the user didn't provide usage for some lines?
            // The file has usage for all lines (even if empty placeholder).

            // Wait, line 5: "5,respond (v.) 答覆,固定用法：..." -> Keywords work.
            // Line 3: "...,(無標示..." -> Keywords work.
            // What if usage doesn't start with keyword?
            // "1,equipment...,常見搭配..." -> works.
        }

        let wordPart, usagePart;

        if (splitIndex !== -1) {
            wordPart = rest.substring(0, splitIndex).trim();
            usagePart = rest.substring(splitIndex + 1).trim();
        } else {
            // Try to be smart. Word part usually has parens `(...)`.
            // Usage part might not. 
            // If we can't find separator, maybe take the whole thing as word if it looks like a word definition?
            wordPart = rest.trim();
            usagePart = "";
        }

        // Parse Word Part
        const openParenIndex = wordPart.indexOf('(');
        let word = "";
        let chinese = "";

        if (openParenIndex !== -1) {
            word = wordPart.substring(0, openParenIndex).trim();
            chinese = wordPart.substring(openParenIndex).trim();

            // Removing parens from Chinese?
            // "資料處理：請自動解析單字清單中的括號內容作為 chinese 欄位。"
            // Example data: "complaint (n.) 抱怨"
            // If I take `(n.) 抱怨`, it is technically "括號內容 + 後面".
            // If strictly "括號內容", it would be `n.`.
            // But prompt says `chinese: 中文解釋與詞性`. `n.` is POS, `抱怨` is Chinese.
            // So I must include `抱怨`.
            // So `(n.) 抱怨` is the best representation of "中文解釋與詞性".

            // Refinement: if chinese starts with `(`, nice.
        } else {
            word = wordPart;
            chinese = "";
        }

        // Parse Usage Part for lists
        let common_usage_list = [];
        let fixed_collocation_list = [];

        if (usagePart && !usagePart.includes('無標示')) {
            // Updated regex logic to properly split multiple occurrences
            // We want to split string by `常見搭配：` or `固定用法：` but keep the key to know which is which.

            // Regex to match the delimiters
            const regex = /(常見搭配：|固定用法：|固定搭配：)/g;
            let match;
            let lastIndex = 0;
            let currentType = null;

            // We need to find the START of the first match
            // But strict regex loop is better.

            let parts = [];
            while ((match = regex.exec(usagePart)) !== null) {
                if (lastIndex < match.index) {
                    // logic for previous part? No, the string starts with a delimiter usually.
                    // But if it doesn't? e.g. "some text 常見搭配：..."
                }

                parts.push({
                    type: match[0],
                    index: match.index
                });
            }

            parts.forEach((part, idx) => {
                let start = part.index + part.type.length;
                let end = (idx + 1 < parts.length) ? parts[idx + 1].index : usagePart.length;
                let content = usagePart.substring(start, end).trim();

                if (part.type.includes('常見搭配')) {
                    common_usage_list.push(content);
                } else {
                    fixed_collocation_list.push(content);
                }
            });

            // If regex found nothing but usagePart exists?
            if (parts.length === 0 && usagePart.length > 0) {
                // Fallback
                console.warn(`Usage present but no keywords found for ${word}, putting in common.`);
                common_usage_list.push(usagePart);
            }
        }

        let common_usage = common_usage_list.join('\n'); // Start with newline if multiple?
        // "常見搭配：...常見搭配：..." -> we extracted two items.
        // User output expectation: "fixed_collocation", "common_usage".
        // Joining with newline is standard for this user.

        let fixed_collocation = fixed_collocation_list.join('\n');

        const id = `day13_${word}`;

        result.push({
            id: id,
            day: 13,
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
