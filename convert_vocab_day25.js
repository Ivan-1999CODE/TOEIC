const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day25.txt');
const outputFile = path.join(__dirname, 'vocab_day25.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/);

    const result = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) continue;

        const newEntryMatch = line.match(/^(\d+)\s+(.+)/);

        if (newEntryMatch) {
            // New Entry
            if (currentItem) {
                result.push(currentItem);
            }

            const order = parseInt(newEntryMatch[1], 10);
            let content = newEntryMatch[2];

            // Format: "detailed (adj.) 詳細的\t常見搭配：..."
            let usagePart = "";
            let wordChinese = content;

            // Check for tab first
            if (line.includes('\t')) {
                // If tab separated
                const lineParts = line.split('\t');
                // lineParts[0] might contain number? No, `line` has number.
                // Re-split `line` by Tab?
                const parts = line.split('\t');
                // Usually "1\tWord\tUsage" or "1 Word\tUsage"
                // The match above removed "1 ". So `content` is "Word\tUsage"

                const contentParts = content.split('\t');
                wordChinese = contentParts[0].trim();
                if (contentParts.length > 1) {
                    usagePart = contentParts.slice(1).join('\t').trim();
                }
            } else {
                // Space separated usage?
                // "1 congestion ... 常見搭配：..."
                const usageKeywords = ['常見搭配', '固定用法', '固定搭配', '(無標示'];
                let splitIdx = -1;
                for (const kw of usageKeywords) {
                    const idx = content.indexOf(kw);
                    if (idx !== -1 && (splitIdx === -1 || idx < splitIdx)) {
                        splitIdx = idx;
                    }
                }

                if (splitIdx !== -1) {
                    wordChinese = content.substring(0, splitIdx).trim();
                    usagePart = content.substring(splitIdx).trim();
                }
            }

            // Parse Word/Chinese
            let word = "";
            let chinese = "";

            // "congestion (n.) (交通) 堵塞，擁擠"
            // "permit (v.) 許可 / (n.) 許可證"
            // "detailed (adj.) 詳細的"

            // Usually word ends before first `(`
            const parenIdx = wordChinese.indexOf('(');
            if (parenIdx !== -1) {
                word = wordChinese.substring(0, parenIdx).trim();
                chinese = wordChinese.substring(parenIdx).trim();
            } else {
                word = wordChinese;
            }

            currentItem = {
                day: 25,
                order: order,
                word: word,
                chinese: chinese,
                fixed_collocation_list: [],
                common_usage_list: []
            };

            if (usagePart) {
                parseUsageLine(usagePart, currentItem);
            }

        } else {
            // Continuation Line (Usage)
            if (currentItem) {
                parseUsageLine(line, currentItem);
            }
        }
    }

    if (currentItem) {
        result.push(currentItem);
    }

    function parseUsageLine(text, item) {
        // "常見搭配： traffic congestion ..."
        // "固定用法： in detail ..."

        if (text.includes('(無標示') || text.includes('無標示特定搭配')) return;

        // Strip bullet if any (though not seen in prompt sample, standardizing)
        let cleanText = text.replace(/●/g, '').trim();

        // Remove keyword prefix for storage? Or keep?
        // Usually we define lists.
        const isFixed = cleanText.includes('固定用法') || cleanText.includes('固定搭配');
        const isCommon = cleanText.includes('常見搭配');

        // Remove the label
        cleanText = cleanText.replace(/^(固定用法|固定搭配|常見搭配)[：:]?\s*/, '').trim();

        if (isFixed) {
            item.fixed_collocation_list.push(cleanText);
        } else if (isCommon) {
            item.common_usage_list.push(cleanText);
        } else {
            // If just continuation text?
            // "detailed information (詳細資訊)"
            // Assuming it belongs to the LAST used category if possible, or common?
            // But this script processes line by line independently.
            // If the line has no keyword, we might not know where to put it.
            // But we can check if we already have items in lists.

            // For now, if it's non-empty and not just a label, add to common?
            if (cleanText) {
                // Maybe append to the last common usage list item?
                // Or add as new item?
                if (item.common_usage_list.length > 0) {
                    // Heuristic: treat as new item in common list
                    item.common_usage_list.push(cleanText);
                } else if (item.fixed_collocation_list.length > 0) {
                    item.fixed_collocation_list.push(cleanText);
                } else {
                    // Default to common
                    item.common_usage_list.push(cleanText);
                }
            }
        }
    }

    const finalResult = result.map(item => {
        const id = `day25_${item.word}`;

        return {
            id: id,
            day: 25,
            order: item.order,
            word: item.word,
            chinese: item.chinese,
            fixed_collocation: item.fixed_collocation_list.join('\n'),
            common_usage: item.common_usage_list.join('\n')
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf8');
    console.log(`Successfully converted ${finalResult.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
