const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day3.txt');
const outputFile = path.join(__dirname, 'vocab_day3.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Split by lines
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    const result = [];
    let currentItem = null;

    // Regex for Day 3 format: "01. accustomed (adj.) 習慣的"
    const entryRegex = /^(\d+)\.\s+([a-zA-Z]+)\s+(\(.+)/;

    lines.forEach(line => {
        const match = line.match(entryRegex);
        if (match) {
            if (currentItem) {
                result.push(currentItem);
            }

            const order = parseInt(match[1], 10);
            const word = match[2].trim();
            const chinese = match[3].trim();

            currentItem = {
                day: 3,
                order: order,
                word: word,
                chinese: chinese,
                fixed_collocation: [],
                common_usage: []
            };
        } else if (currentItem) {
            // Usage lines with braces like 【固定搭配】 or 【常見搭配】
            if (line.includes('【固定搭配】')) {
                const content = line.replace('【固定搭配】', '').trim();
                currentItem.fixed_collocation.push(content);
            } else if (line.includes('【常見搭配】')) {
                const content = line.replace('【常見搭配】', '').trim();
                currentItem.common_usage.push(content);
            }
        }
    });

    // Push the last item
    if (currentItem) {
        result.push(currentItem);
    }

    // Post-process to join arrays into strings
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
