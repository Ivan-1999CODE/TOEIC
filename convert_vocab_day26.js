const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day26.txt');
const outputFile = path.join(__dirname, 'vocab_day26.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/);

    const result = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) continue;

        // Check for new entry: Start with number
        const newEntryMatch = line.match(/^(\d+)\s+(.+)/);

        if (newEntryMatch) {
            // New Entry
            if (currentItem) {
                result.push(currentItem);
            }

            const order = parseInt(newEntryMatch[1], 10);
            let content = newEntryMatch[2];

            let usagePart = "";
            let wordChinese = content;

            // Heuristic to split Word/Chinese from Usage
            // 1. Check for tab
            if (line.includes('\t')) {
                const parts = line.split('\t');
                // parts[0] might be empty if line starts with tab? 
                // But we matched `^\d+\s+`.
                // Let's re-parse match relative to tabs.
                // Actually, if tab exists, it's safer to split by tab.
                // "1\tdelinquent ...\t常見搭配..."

                // Let's rely on keywords if tab is unreliable or mixed.
            }

            // Keyword based split
            const usageKeywords = ['常見搭配', '固定搭配', '固定用法', '(書中無特別標示用法)'];
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
            } else {
                // If checking for tab...
                const tabIndex = content.indexOf('\t');
                if (tabIndex !== -1) {
                    wordChinese = content.substring(0, tabIndex).trim();
                    usagePart = content.substring(tabIndex).trim();
                }
            }

            // Word Parsing
            let word = "";
            let chinese = "";

            // "delinquent (adj.) 拖欠的"
            const parenIdx = wordChinese.indexOf('(');
            if (parenIdx !== -1) {
                word = wordChinese.substring(0, parenIdx).trim();
                chinese = wordChinese.substring(parenIdx).trim();
            } else {
                word = wordChinese;
            }

            currentItem = {
                day: 26,
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
            // Continuation Line
            if (currentItem) {
                parseUsageLine(line, currentItem);
            }
        }
    }

    if (currentItem) {
        result.push(currentItem);
    }

    function parseUsageLine(text, item) {
        if (text.includes('無特別標示用法')) return;

        // Clean text
        let cleanText = text.trim();

        // Identify Type
        const isFixed = cleanText.includes('固定搭配') || cleanText.includes('固定用法');
        const isCommon = cleanText.includes('常見搭配');

        // Remove Label
        cleanText = cleanText.replace(/^(固定搭配|固定用法|常見搭配)[：:]?\s*/, '').trim();

        if (isFixed) {
            item.fixed_collocation_list.push(cleanText);
        } else if (isCommon) {
            item.common_usage_list.push(cleanText);
        } else {
            // Continuation of previous list?
            // "conducting an investigation..."
            if (cleanText) {
                // Determine where to add
                // If we recently added to Common, add there.
                // We don't track state here easily without context.
                // But usually the prompt has usage keyword at start of line if it switches context.
                // If no keyword, append to last non-empty list.

                if (item.common_usage_list.length > 0) {
                    // Append to the last item or new item?
                    // "conduct an investigation (進行調查)。"
                    // This looks like a full item.
                    item.common_usage_list.push(cleanText);
                } else if (item.fixed_collocation_list.length > 0) {
                    item.fixed_collocation_list.push(cleanText);
                } else {
                    // Default
                    item.common_usage_list.push(cleanText);
                }
            }
        }
    }

    const finalResult = result.map(item => {
        const id = `day26_${item.word}`;

        return {
            id: id,
            day: 26,
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
