const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day2.txt');
const outputFile = path.join(__dirname, 'vocab_day2.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Split by lines
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    const result = [];
    let currentItem = null;

    // Regex to match the start of a word entry: "01. attire (n.) 服裝，衣著"
    // Group 1: Order (01)
    // Group 2: Word (attire)
    // Group 3: Content (the rest)
    const entryRegex = /^(\d+)\.\s+([a-zA-Z\s]+?)\s+(\(.+)/;

    lines.forEach(line => {
        const match = line.match(entryRegex);
        if (match) {
            if (currentItem) {
                result.push(currentItem);
            }

            const order = parseInt(match[1], 10);
            const word = match[2].trim();
            const chinese = match[3].trim(); // Includes pos like (n.) ...

            currentItem = {
                day: 2,
                order: order,
                word: word,
                chinese: chinese,
                fixed_collocation: [],
                common_usage: []
            };
        } else if (currentItem) {
            // It's a usage line
            // Use a global regex on the line to find all occurrences
            const regex = /(固定搭配|常見搭配)：(.*?)(?=(固定搭配|常見搭配)：|$)/g;
            let usageMatch;
            while ((usageMatch = regex.exec(line)) !== null) {
                const type = usageMatch[1];
                const content = usageMatch[2].trim();
                if (type === '固定搭配') {
                    currentItem.fixed_collocation.push(content);
                } else if (type === '常見搭配') {
                    currentItem.common_usage.push(content);
                }
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
