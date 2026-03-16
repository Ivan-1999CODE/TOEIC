const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day22.txt');
const outputFile = path.join(__dirname, 'vocab_day22.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/);

    // States not needed. Can iterate line by line
    // Structure:
    // 1 agenda (n.) 議程
    // ● 常見搭配： ...
    // ...

    // Each entry starts with `^\d+ `. 

    const result = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip header or empty
        if (!currentItem && (!line || line.startsWith('編號'))) {
            continue;
        }

        const newEntryMatch = line.match(/^(\d+)\s+/);

        if (newEntryMatch) {
            if (currentItem) {
                result.push(currentItem);
            }

            // Parse order, word, chinese
            // "1 agenda (n.) 議程" (tab or space separated)
            // If tab?
            let order, rest;
            if (line.includes('\t')) {
                const parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
                order = parseInt(parts[0], 10);
                // parts[1] is Word+Chinese
                // parts[2] is Usage (optional)
                rest = parts.length > 1 ? parts[1] : "";
                if (parts.length > 2) {
                    // If there's a 3rd column usage on the same line
                    // "● 常見搭配： ..." might be here or on next line.
                    // The sample shows usage starts on next line often?
                    // Or "2 convene ... (無標示)"
                    // If parts[2] exists, treat as usage.
                    // Append content to rest? Or handle separately.
                    const usage = parts[2];

                    // We will parse usage later.
                    // Just mark if we have usage initially
                }
            } else {
                // Space separated
                order = parseInt(newEntryMatch[1], 10);
                rest = line.substring(newEntryMatch[0].length).trim();
            }

            // "agenda (n.) 議程"
            // Split Word and Chinese
            let word = "";
            let chinese = "";
            let initialUsage = "";

            // If line contains usage markers directly?
            // "2 convene (v.) 召開會議 (無標示)"
            // "(無標示)" is a marker.

            const usageIndex = rest.indexOf('(無標示');
            if (usageIndex !== -1) {
                word = rest.substring(0, usageIndex).trim();
                // rest is Chinese + Word. Usage is empty.
                // Actually `word` variable here contains "word (pos) chinese".
            } else {
                // Check for "●"
                const bulletIndex = rest.indexOf('●');
                if (bulletIndex !== -1) {
                    word = rest.substring(0, bulletIndex).trim();
                    initialUsage = rest.substring(bulletIndex).trim();
                } else {
                    word = rest;
                }
            }

            // "agenda (n.) 議程" -> Word: agenda, Chinese: (n.) 議程
            const parenIdx = word.indexOf('(');
            let realWord = "";

            if (parenIdx !== -1) {
                realWord = word.substring(0, parenIdx).trim();
                chinese = word.substring(parenIdx).trim();
            } else {
                realWord = word;
            }

            currentItem = {
                day: 22,
                order: order,
                word: realWord,
                chinese: chinese,
                fixed_collocation_list: [],
                common_usage_list: []
            };

            // If we extracted usage from the same line
            if (initialUsage) {
                parseUsageLine(initialUsage, currentItem);
            }
            // If tab split had usage in parts[2]? 
            // The logic above assumes `line` holds content. If tab separated, `line` has tabs.
            // If tab split, `parts[2]` might be usage.
            if (line.includes('\t')) {
                const parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
                if (parts.length > 2) {
                    parseUsageLine(parts[2], currentItem);
                }
            }

        } else {
            // Continuation Line (Usage)
            if (currentItem && line) {
                parseUsageLine(line, currentItem);
            }
        }
    }

    if (currentItem) {
        result.push(currentItem);
    }

    function parseUsageLine(text, item) {
        // Remove `●`
        const cleanText = text.replace(/●/g, '').trim();
        if (!cleanText) return;

        if (cleanText.includes('(無標示') || cleanText === '(無標示)') return;

        // Check types
        const isFixed = cleanText.includes('固定搭配') || cleanText.includes('固定用法');
        const isCommon = cleanText.includes('常見搭配');

        // Remove keyword prefix
        const content = cleanText.replace(/^(固定搭配[：:]?|常見搭配[：:]?|固定用法[：:]?)\s*/, '').trim();

        if (isFixed) {
            item.fixed_collocation_list.push(content);
        } else if (isCommon) {
            item.common_usage_list.push(content);
        } else {
            // Unspecified? Usually belongs to previous or is generic usage?
            // If we have content but no keyword, maybe generic usage?
            // Prompt says: "● 常見搭配：..."
            // If line is just text without keyword, ignore or append?
            // "printed agenda (印出來的議程表)"
            // Assuming default to common if not specified? 
            // Or maybe appending to last usage item?
            // Simple approach: if text exists, add to common if not empty.
            // But be careful.
        }
    }

    const finalResult = result.map(item => {
        const id = `day22_${item.word}`;

        return {
            id: id,
            day: 22,
            order: item.order,
            word: item.word,
            chinese: item.chinese,
            fixed_collocation: item.fixed_collocation_list.join('\n'),
            common_usage: item.common_usage_list.join('\n')
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf8');
    console.log(`Successfully converted ${finalResult.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
