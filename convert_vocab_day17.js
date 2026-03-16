const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day17.txt');
const outputFile = path.join(__dirname, 'vocab_day17.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/);

    const result = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip header or empty lines unless inside an item (continuation)
        if (!currentItem && (!line || line.startsWith('編號'))) {
            continue;
        }

        // Try to identify new entry
        // Format seems to be Tab separated again.
        // "1	fragile (adj.)	易碎的	(無標示特定搭配)"

        // Regex for starting with number followed by whitespace (tab or space)
        // Since we split by lines, check if start of line matches pattern.
        const newEntryMatch = line.match(/^(\d+)\s+(.+)/);

        if (newEntryMatch) {
            // Push previous item
            if (currentItem) {
                result.push(currentItem);
            }

            // Split line by Tabs strictly if possible
            // But line is trimmed. If original line has tabs, use it?
            // "lines[i]" contains original line including tabs.
            const originalLine = lines[i];

            // Check if tab separated
            if (originalLine.includes('\t')) {
                const parts = originalLine.split('\t').map(p => p.trim()).filter(p => p !== '');

                // parts[0] = Order
                // parts[1] = Word (POS)
                // parts[2] = Meaning
                // parts[3] = Usage (Optional)

                if (parts.length >= 2) {
                    const order = parseInt(parts[0], 10);
                    const wordPos = parts[1];
                    const meaning = parts[2] || "";
                    const usage = parts[3] || "";

                    // Parse Word (POS)
                    // "fragile (adj.)"
                    const parenIdx = wordPos.indexOf('(');
                    let word = "";
                    let pos = "";

                    if (parenIdx !== -1) {
                        word = wordPos.substring(0, parenIdx).trim();
                        pos = wordPos.substring(parenIdx).trim();
                    } else {
                        word = wordPos;
                    }

                    // Combine pos + meaning for "chinese" field?
                    // Prompt says "chinese: 中文解釋與詞性".
                    // So we combine `pos` and `meaning`.
                    const chinese = `${pos} ${meaning}`.trim();

                    currentItem = {
                        day: 17,
                        order: order,
                        word: word,
                        chinese: chinese,
                        raw_usage: usage
                    };
                }
            } else {
                // Fallback if spaces?
                // Assuming tab separated based on preview.
                console.warn(`Line ${i + 1} has no tabs, skipping heuristic parse for now.`);
            }
        } else {
            // Continuation line?
            // "● 固定用法：attach A to B (把 A 貼到 B 上)"
            // "● 常見搭配：attached + schedule/document/file"
            // These might be on separate lines following the item.
            if (currentItem && line) {
                currentItem.raw_usage += '\n' + line;
            }
        }
    }

    if (currentItem) {
        result.push(currentItem);
    }

    // Process Usage
    const finalResult = result.map(item => {
        let usage = item.raw_usage || "";
        let common_usage_list = [];
        let fixed_collocation_list = [];

        // Remove placeholder
        if (usage.includes('(無標示特定搭配)')) {
            usage = "";
        }

        if (usage) {
            // Bullet points used: `●`
            // And keywords: `常見搭配`, `固定用法`

            // We can split by `●` or newlines?
            // Regex to find keywords.
            // Keywords: `常見搭配：`, `固定用法：` (with or without `●`)

            // Let's normalize by removing `●`
            const cleanUsage = usage.replace(/●/g, '').trim();

            // Now regex search for `常見搭配：` and `固定用法：`
            const regex = /(常見搭配：|固定用法：|固定搭配：)/g;
            let parts = [];
            let m;
            while ((m = regex.exec(cleanUsage)) !== null) {
                parts.push({
                    type: m[0],
                    index: m.index,
                    len: m[0].length
                });
            }

            if (parts.length > 0) {
                parts.forEach((part, idx) => {
                    let start = part.index + part.len;
                    let end = (idx + 1 < parts.length) ? parts[idx + 1].index : cleanUsage.length;
                    let content = cleanUsage.substring(start, end).trim();

                    if (part.type.includes('常見搭配')) {
                        common_usage_list.push(content);
                    } else {
                        fixed_collocation_list.push(content);
                    }
                });
            } else {
                // If text exists but no keyword?
                if (cleanUsage.length > 0) {
                    // check if it looks like usage
                    common_usage_list.push(cleanUsage);
                }
            }
        }

        const id = `day17_${item.word}`;

        return {
            id: id,
            day: 17,
            order: item.order,
            word: item.word,
            chinese: item.chinese,
            fixed_collocation: fixed_collocation_list.join('\n'),
            common_usage: common_usage_list.join('\n')
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf8');
    console.log(`Successfully converted ${finalResult.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
