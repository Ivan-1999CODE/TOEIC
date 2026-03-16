const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day5.txt');
const outputFile = path.join(__dirname, 'vocab_day5.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Logic: 
    // 1. collection
    // 中文： ...
    // 常見搭配： ...

    const lines = data.split(/\r?\n/);
    const result = [];
    let currentItem = null;

    // Regex for "1. collection"
    const titleRegex = /^(\d+)\.\s+(.+)/;

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

            currentItem = {
                day: 5,
                order: order,
                word: word,
                chinese: "",
                fixed_collocation: [],
                common_usage: []
            };
        } else if (currentItem) {
            if (line.startsWith('中文：')) {
                currentItem.chinese = line.replace('中文：', '').trim();
            } else if (line.startsWith('常見搭配：')) {
                currentItem.common_usage.push(line.replace('常見搭配：', '').trim());
            } else if (line.startsWith('固定搭配：')) {
                currentItem.fixed_collocation.push(line.replace('固定搭配：', '').trim());
            }
            // Note: "辨析：", "注意：", "註：" fields are present in raw data.
            // Current requirement only asks for fixed_collocation and common_usage.
            // We can append these misc info to "chinese" or separate usage?
            // User request: "包含 ... chinese, fixed_collocation, common_usage".
            // Usually "Note" goes to usage or appended to chinese?
            // Or just ignore if not requested.
            // Given it's a "Vocabulary App", "辨析" (Usage Note) is useful.
            // I'll append it to chinese for now or common_usage? 
            // Append notes to common usage for now as they are useful info
            else if (line.startsWith('辨析：') || line.startsWith('注意：') || line.startsWith('註：')) {
                currentItem.common_usage.push(`[筆記] ${line}`);
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
