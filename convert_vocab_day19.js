const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day19.txt');
const outputFile = path.join(__dirname, 'vocab_day19.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/);

    // States
    const STATE_IDLE = 0;
    const STATE_WORD = 1;
    const STATE_CHINESE = 2;
    const STATE_USAGE = 3;

    let state = STATE_IDLE;
    let currentItem = null;
    let result = [];
    let currentUsageType = null; // 'fixed' or 'common'

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines if IDLE, but inside an entry empty lines might separate sections
        // We will handle empty lines within states

        // Check for New Entry Start (Number)
        // Usually matches ^\d+$ or maybe ^\d+\s*$
        if (/^\d+$/.test(line)) {
            // New Entry
            if (currentItem) {
                result.push(currentItem);
            }

            currentItem = {
                day: 19,
                order: parseInt(line, 10),
                word: "",
                chinese: "",
                fixed_collocation_list: [],
                common_usage_list: []
            };
            state = STATE_WORD;
            currentUsageType = null;
            continue;
        }

        // State Machine
        if (state === STATE_WORD) {
            if (line === "") continue;
            // The word is the first non-empty line
            currentItem.word = line;
            state = STATE_CHINESE;
        } else if (state === STATE_CHINESE) {
            if (line === "") continue;

            // Check if we hit usage keywords
            if (line.includes('固定搭配：') || line.includes('固定搭配:')) {
                state = STATE_USAGE;
                currentUsageType = 'fixed';
            } else if (line.includes('常見搭配：') || line.includes('常見搭配:')) {
                state = STATE_USAGE;
                currentUsageType = 'common';
            } else if (line.includes('(無特定標註用法)') || line.includes('(无特定標註用法)')) {
                // End of this entry effectively, wait for next number
                state = STATE_IDLE;
            } else if (line.startsWith('(注意：')) {
                // Note: treat as fixed collocation or append to chinese?
                // Let's treat as fixed collocation as it's a rule.
                currentItem.fixed_collocation_list.push(line);
                state = STATE_IDLE; // Assume it's the last thing?
                // Or stay in CHINESE?
                // Usually (Note...) is at the end.
            } else {
                // It is part of Definition
                // Append with space or newline?
                if (currentItem.chinese.length > 0) {
                    currentItem.chinese += '\n' + line;
                } else {
                    currentItem.chinese = line;
                }
            }
        } else if (state === STATE_USAGE) {
            if (line === "") continue;

            // detecting shift in usage type
            if (line.includes('固定搭配：') || line.includes('固定搭配:')) {
                currentUsageType = 'fixed';
                continue;
            } else if (line.includes('常見搭配：') || line.includes('常見搭配:')) {
                currentUsageType = 'common';
                continue;
            } else if (line.includes('(無特定標註用法)')) {
                state = STATE_IDLE;
                continue;
            }

            // It's usage content
            // Format: `* content`
            // Strip `* `
            let content = line;
            if (content.startsWith('*')) {
                content = content.substring(1).trim();
            }

            if (currentUsageType === 'fixed') {
                currentItem.fixed_collocation_list.push(content);
            } else {
                currentItem.common_usage_list.push(content);
            }
        } else if (state === STATE_IDLE) {
            // Waiting for next number.
            // If we see something else, maybe ignore?
        }
    }

    if (currentItem) {
        result.push(currentItem);
    }

    const finalResult = result.map(item => {
        const id = `day19_${item.word}`;

        return {
            id: id,
            day: 19,
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
