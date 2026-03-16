const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day10.txt');
const outputFile = path.join(__dirname, 'vocab_day10.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split('\n');
    const words = [];
    let currentWord = null;

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Match "1. word (pos. chinese)"
        const orderMatch = trimmedLine.match(/^(\d+)\.\s+([a-zA-Z\s]+)\s+\((.+)\)$/);

        if (orderMatch) {
            if (currentWord) {
                words.push(currentWord);
            }
            const order = parseInt(orderMatch[1]);
            const wordText = orderMatch[2].trim();
            const chinese = orderMatch[3].trim();

            // Note: chinese part includes POS like "v. 購買；n. 購買（的東西）"
            // We keep it as provided.

            currentWord = {
                order: order,
                day: 10,
                word: wordText,
                id: `day10_${wordText}`,
                chinese: chinese,
                fixed_collocation: '',
                common_usage: ''
            };
        } else if (currentWord) {
            // Processing collocations
            if (trimmedLine.startsWith('固定搭配：')) {
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

    fs.writeFileSync(outputFile, JSON.stringify(words, null, 2), 'utf8');
    console.log(`Successfully generated ${outputFile} with ${words.length} words.`);

} catch (err) {
    console.error('Error processing file:', err);
}
