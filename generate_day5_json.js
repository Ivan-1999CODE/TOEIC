const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day5.txt');
const outputFile = path.join(__dirname, 'vocab_day5.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split('\n');
    const words = [];
    let currentWord = null;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Match "1. sophisticated*" or "40. speak*"
        const orderMatch = trimmedLine.match(/^(\d+)\.\s+(.*?)(?:\*)*$/);

        if (orderMatch) {
            if (currentWord) {
                words.push(currentWord);
            }
            currentWord = {
                order: parseInt(orderMatch[1]),
                day: 5,
                word: orderMatch[2].trim(),
                id: `day5_${orderMatch[2].trim()}`,
                chinese: '',
                fixed_collocation: '',
                common_usage: ''
            };
        } else if (currentWord) {
            if (trimmedLine.startsWith('中譯：')) {
                currentWord.chinese = trimmedLine.replace('中譯：', '').trim();
            } else if (trimmedLine.startsWith('固定搭配：')) {
                const val = trimmedLine.replace('固定搭配：', '').trim();
                if (currentWord.fixed_collocation) {
                    currentWord.fixed_collocation += '\n' + val;
                } else {
                    currentWord.fixed_collocation = val;
                }
            } else if (trimmedLine.startsWith('常見搭配：')) {
                const val = trimmedLine.replace('常見搭配：', '').trim();
                if (currentWord.common_usage) {
                    currentWord.common_usage += '\n' + val;
                } else {
                    currentWord.common_usage = val;
                }
            }
        }
    });

    if (currentWord) {
        words.push(currentWord);
    }

    // Sort by order just in case
    words.sort((a, b) => a.order - b.order);

    fs.writeFileSync(outputFile, JSON.stringify(words, null, 2), 'utf8');
    console.log(`Successfully generated ${outputFile} with ${words.length} words.`);

} catch (err) {
    console.error('Error processing file:', err);
}
