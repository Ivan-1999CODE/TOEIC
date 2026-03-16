const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day4.txt');
const outputFile = path.join(__dirname, 'vocab_day4.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    const result = [];
    let currentItem = null;
    let orderCounter = 1;

    // Regex explanations:
    // 1. Word start: "lax (adj.) 鬆懈的、散漫的"
    //    Matches start of line, word, space, (pos.), space, chinese
    //    Note: some words might be phrases "according to"
    //    Regex: ^([a-zA-Z\s-]+)\s+(\([a-z./]+\).*)$
    const entryRegex = /^([a-zA-Z\s-]+)\s+(\([a-z./]+\).*)$/;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        // Skip section headers like "11 - 20 ..." or just numbers
        if (/^\d+(\s*-\s*\d+)?/.test(line)) {
            return;
        }

        const match = line.match(entryRegex);

        // Check if it's a usage line
        const isUsage = line.includes('固定搭配：') || line.includes('常見搭配：');

        if (match && !isUsage) {
            if (currentItem) {
                result.push(currentItem);
            }

            const word = match[1].trim();
            const chinese = match[2].trim();

            currentItem = {
                day: 4,
                order: orderCounter++,
                word: word,
                chinese: chinese,
                fixed_collocation: [],
                common_usage: []
            };
        } else if (currentItem) {
            // It is a usage line (or continuation)
            // Use global regex to extract usages
            const regex = /(固定搭配|常見搭配)：(.*?)(?=(固定搭配|常見搭配)：|$)/g;
            let usageMatch;
            let foundusage = false;
            while ((usageMatch = regex.exec(line)) !== null) {
                foundusage = true;
                const type = usageMatch[1];
                const content = usageMatch[2].trim();
                if (type === '固定搭配') {
                    currentItem.fixed_collocation.push(content);
                } else if (type === '常見搭配') {
                    currentItem.common_usage.push(content);
                }
            }

            // If line has content but didn't match usage regex strict (maybe "固定搭配：..." without the colon correctly or something?)
            // Day 4 raw data seems consistent: "常見搭配：..."
            // But let's look at raw data:
            // "common_usage: adjust A to B (使 A 適應 B)" -> No, it's "常見搭配：adjust A to B (使 A 適應 B)"
        }
    });
    // Push the last item
    if (currentItem) {
        result.push(currentItem);
    }

    // Post-process arrays to strings
    const finalResult = result.map(item => ({
        ...item,
        fixed_collocation: item.fixed_collocation.join('\n'),
        common_usage: item.common_usage.join('\n')
    }));

    fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf8');
    console.log(`Successfully converted ${finalResult.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
