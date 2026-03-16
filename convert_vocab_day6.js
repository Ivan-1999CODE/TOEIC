const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day6.txt');
const outputFile = path.join(__dirname, 'vocab_day6.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Format:
    // 1. sophisticated*
    // 中譯：adj. ...
    // 常見搭配：...

    const lines = data.split(/\r?\n/);
    const result = [];
    let currentItem = null;

    // Regex for "1. sophisticated*" or "4. promptly**"
    // Needs to handle *, **, or none
    // Also "23. expertise*"
    // Word can contain spaces? "fund-raising"
    // Regex: Number dot space (Word) (Asterisks?)
    // ([a-zA-Z\s-]+) to capture words and hyphens and spaces
    const titleRegex = /^(\d+)\.\s+([a-zA-Z\s-]+)(\**)$/;

    lines.forEach(line => {
        line = line.trim();
        if (!line) return;

        const titleMatch = line.match(titleRegex);
        if (titleMatch) {
            if (currentItem) {
                result.push(currentItem);
            }

            const order = parseInt(titleMatch[1], 10);
            const word = titleMatch[2].trim();
            // titleMatch[3] are the asterisks, ignored for now unless we want to store importance

            currentItem = {
                day: 6, // Treating as Day 6
                order: order,
                word: word,
                chinese: "",
                fixed_collocation: [],
                common_usage: []
            };
        } else if (currentItem) {
            // Logic for "中譯：", "常見搭配：" etc.
            if (line.startsWith('中譯：')) {
                currentItem.chinese = line.replace('中譯：', '').trim();
            } else if (line.startsWith('常見搭配：')) {
                currentItem.common_usage.push(line.replace('常見搭配：', '').trim());
            } else if (line.startsWith('固定搭配：')) {
                currentItem.fixed_collocation.push(line.replace('固定搭配：', '').trim());
            }
        }
    });

    if (currentItem) {
        result.push(currentItem);
    }

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
