const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day20.txt');
const outputFile = path.join(__dirname, 'vocab_day20.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/);

    const result = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip header or empty lines if not in an item (continuation)
        if (!currentItem && (!line || line.startsWith('編號'))) {
            continue;
        }

        // New Item Detection usually tab separated: `Order\tWord (Chinese)\tUsage`
        // Or sometimes space.
        // Check for Number at start
        const newEntryMatch = line.match(/^(\d+)\s+/);

        if (newEntryMatch) {
            if (currentItem) {
                result.push(currentItem);
            }

            // Split
            // If tab exists, use tab
            let parts = [];
            if (line.includes('\t')) {
                parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
            } else {
                // If not tab separated, maybe just spaces?
                // `1 audit (n. 審計，查帳) 常見搭配...`
                // 1st part: Order
                // 2nd part: Word + Chinese
                // 3rd part: Usage
                // Word+Chinese ends with `)` usually?
                // Or Usage starts with `常見搭配` or `固定用法`.

                const order = newEntryMatch[1];
                const rest = line.substring(newEntryMatch[0].length).trim();

                // Find start of Usage
                const usageKeywords = ['常見搭配', '固定用法', '固定搭配'];
                let usageStart = -1;
                for (const kw of usageKeywords) {
                    const idx = rest.indexOf(kw);
                    if (idx !== -1 && (usageStart === -1 || idx < usageStart)) {
                        usageStart = idx;
                    }
                }

                let wordChinese = "";
                let usage = "";

                if (usageStart !== -1) {
                    wordChinese = rest.substring(0, usageStart).trim();
                    usage = rest.substring(usageStart).trim();
                } else {
                    wordChinese = rest;
                    usage = "";
                }

                parts = [order, wordChinese, usage];
            }

            // parts[0] is Order
            // parts[1] is Word (Chinese)
            // parts[2] is Usage (optional)

            const order = parseInt(parts[0], 10);

            // Parse Word (Chinese)
            // "audit (n. 審計，查帳)"
            let word = "";
            let chinese = "";
            let wordChinese = parts[1] || "";

            const parenIdx = wordChinese.indexOf('(');
            if (parenIdx !== -1) {
                word = wordChinese.substring(0, parenIdx).trim();
                chinese = wordChinese.substring(parenIdx).trim();
            } else {
                word = wordChinese;
            }

            let fixed = [];
            let common = [];

            if (parts[2]) {
                const usageLine = parts[2];
                if (usageLine.includes('固定用法') || usageLine.includes('固定搭配')) {
                    fixed.push(usageLine);
                } else if (usageLine.includes('常見搭配')) {
                    common.push(usageLine);
                }
            }

            currentItem = {
                day: 20,
                order: order,
                word: word,
                chinese: chinese,
                fixed_collocation_list: fixed,
                common_usage_list: common
            };

        } else {
            // Continuation Line
            // Usually Usage
            if (currentItem && line) {
                if (line.includes('固定用法') || line.includes('固定搭配')) {
                    currentItem.fixed_collocation_list.push(line);
                } else if (line.includes('常見搭配')) {
                    currentItem.common_usage_list.push(line);
                } else {
                    // Probably continuation of previous line's usage?
                    // Or separate?
                    // Let's default to common if not specified, 
                    // or append to last added list?

                    // If we have neither list non-empty?
                    if (currentItem.fixed_collocation_list.length > 0) {
                        // Allow appending to last item? Or new item?
                        // For now, treat as new item in common if unclear, or append.
                        // But wait, user input has usage lines starting with keyword usually.
                        // Except multiline usage?
                        // "常見搭配： worth + 費用 (值多少費用)"
                        // "常見搭配： worth -ing (值得做...)"
                        // These are new lines with keywords.

                        // If line doesn't have keyword, maybe part of explanation.
                    } else {
                        // No usage yet.
                    }
                }
            }
        }
    }

    if (currentItem) {
        result.push(currentItem);
    }

    const finalResult = result.map(item => {
        const id = `day20_${item.word}`;

        // Clean prefixes from usage lines?
        // "常見搭配： internal audit" -> "internal audit"
        // User might prefer keeping "常見搭配：" prefix inside text or remove?
        // Previous logic usually removed it or structured it.
        // Prompt says: `common_usage: 對應清單中的『常見搭配』`
        // Should we strip "常見搭配：" ?
        // Usually, yes.

        const cleanContent = (list) => {
            return list.map(u => {
                // Remove prefixes
                return u.replace(/^(常見搭配|固定用法|固定搭配)[：:]?\s*/, '').trim();
            }).join('\n');
        };

        return {
            id: id,
            day: 20,
            order: item.order,
            word: item.word,
            chinese: item.chinese,
            fixed_collocation: cleanContent(item.fixed_collocation_list),
            common_usage: cleanContent(item.common_usage_list)
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf8');
    console.log(`Successfully converted ${finalResult.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
