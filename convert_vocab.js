const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw.txt');
const outputFile = path.join(__dirname, 'vocab_day1.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('編號'));

    const result = lines.map(line => {
        // Basic CSV splitting, assuming 4 columns: ID, Word, Chinese, Usage
        // We limit split to 4 parts to keep the Usage column intact even if it has commas (though logic below handles simple split)
        // Actually, simply splitting by comma might be risky if chinese has commas.
        // Looking at data: "n. 空缺、職缺；開張". No commas.
        // Usage: "submit / fax / send a résumé (提交/傳真/寄送履歷)". No commas.
        // Safe to split by comma for the first 3 commas.

        const parts = line.split(',');

        // Safety check
        if (parts.length < 4) {
            console.warn('Skipping malformed line:', line);
            return null;
        }

        const id = parts[0].trim();
        const word = parts[1].trim();
        const chinese = parts[2].trim();
        // The rest is usage. Join back in case there were extra commas in the usage part
        const usageRaw = parts.slice(3).join(',').trim();

        let fixed_collocation = [];
        let common_usage = [];

        // Regex to find "Type：Content" blocks
        // We look for (固定搭配|常見搭配)： followed by any text until the next tag or end of string
        // Using a loop to find all matches
        const regex = /(固定搭配|常見搭配)：(.*?)(?=(固定搭配|常見搭配)：|$)/g;
        let match;

        while ((match = regex.exec(usageRaw)) !== null) {
            const type = match[1];
            const content = match[2].trim();

            if (type === '固定搭配') {
                fixed_collocation.push(content);
            } else if (type === '常見搭配') {
                common_usage.push(content);
            }
        }

        return {
            day: 1,
            order: parseInt(id, 10), // Add order field
            word: word,
            chinese: chinese,
            fixed_collocation: fixed_collocation.join('\n'), // Join with newline if multiple
            common_usage: common_usage.join('\n')            // Join with newline if multiple
        };
    }).filter(item => item !== null);

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Successfully converted ${result.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
