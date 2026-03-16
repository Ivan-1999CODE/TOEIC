const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day15.txt');
const outputFile = path.join(__dirname, 'vocab_day15.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');

    // Split by lines
    const lines = data.split(/\r?\n/);

    const result = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip header or empty lines IF we are not in the middle of a multiline usage
        if (!currentItem && (!line || line.startsWith('編號'))) {
            continue;
        }

        // Try to detect if it is a new entry: Starts with number + space/tab
        // Regex: `^\d+\s`
        const newEntryMatch = line.match(/^(\d+)\s+(.+)/);

        if (newEntryMatch) {
            // If we have a previous item, push it
            if (currentItem) {
                result.push(currentItem);
            }

            // Parse new item
            // The rest of the line might be tab separated or space separated.
            // The format from prompt seems to be tab separated. Let's check.
            // "1	proposal (n.)	提案，提議	常見搭配： submit a proposal (提出提案)"
            // It has tabs.

            // We can split by tabs?
            // "1\tproposal (n.)\t提案，提議\t常見搭配..."
            // Or inconsistent spaces.

            // Let's use flexible splitting. The first part is Order.
            // `newEntryMatch[1]` is Order.
            // `newEntryMatch[2]` is the Rest.

            const orderStr = newEntryMatch[1];
            let rest = newEntryMatch[2].trim();

            // Split `rest` by whitespace is risky if meanings have spaces.
            // But usually this format is tab separated.
            // Let's try to split by tab `\t`.

            // But `line` we effectively trimmed.
            // Let's check the original line with tabs if possible.
            // Or assume spaces might be used as tabs.

            // However, "proposal (n.)" has spaces.
            // "提案，提議" doesn't.
            // "常見搭配： submit a proposal" has spaces.

            // Let's rely on column structure if tabs are used.
            // If `line` contains tabs, we use tabs.
            if (line.includes('\t')) {
                const parts = line.split('\t').map(p => p.trim()).filter(p => p !== '');
                // parts[0] is Order
                // parts[1] is Word (POS)
                // parts[2] is Meaning
                // parts[3] is Usage (optional?)

                // Sometimes order is part of first item if split by tab didn't work right?
                // But tab split should separate order if the file has tabs.
                // The regex `^(\d+)\s+` matched order.

                // Let's try splitting the WHOLE original line by tab.
                const tabParts = line.split('\t').map(p => p.trim()).filter(p => p !== '');

                // Expecting 4 parts: Order, Word(POS), Meaning, Usage
                // Or 3 parts if Usage missing.

                if (tabParts.length >= 3) {
                    const order = parseInt(tabParts[0], 10);
                    let wordPos = tabParts[1]; // "proposal (n.)"
                    let meaning = tabParts[2]; // "提案，提議"
                    let usage = tabParts[3] || ""; // "常見搭配..."

                    // Parse Word and POS
                    // "proposal (n.)" -> Word: proposal, POS: (n.)
                    // Separated by space usually.
                    // The prompt says "word: 英文單字", "chinese: 中文解釋與詞性".
                    // So result.word = "proposal"
                    // result.chinese = "(n.) 提案，提議"

                    let word = wordPos;
                    let pos = "";

                    // Try to split word and (pos)
                    // Find first `(`
                    const parenIdx = wordPos.indexOf('(');
                    if (parenIdx !== -1) {
                        word = wordPos.substring(0, parenIdx).trim();
                        pos = wordPos.substring(parenIdx).trim();
                    }

                    currentItem = {
                        day: 15,
                        order: order,
                        word: word,
                        chinese: `${pos} ${meaning}`.trim(),
                        raw_usage: usage // We will parse usage later or progressively
                    };
                } else {
                    // Fallback to space splitting? Or log error?
                    console.warn(`Line ${i + 1} does not look like tab separated 4 columns: ${line}`);
                    // Fallback logic could go here
                }

            } else {
                // Fallback if spaces used instead of tabs.
                // "1 proposal (n.) 提案，提議 常見搭配..."
                // Order is matched. Rest is `rest`.
                // Find first `(` for POS.
                // Then finding Meaning start is hard if no clear delimiter.
                // Assuming Chinese characters start Meaning?
                // But POS like `(n./v.)` might not have chinese.
                // Assuming meaning has Chinese characters.
                // `proposal (n.)` -> space -> `提案，提議`

                // Let's assume the user provided the file with tabs as generated.
                // If not, we fail or warn.
                console.warn(`Line ${i + 1} has no tabs. Trying heuristic parsing.`);
            }
        } else {
            // Not a new entry. Continuation of previous `raw_usage`?
            // Example line 16 continuation.
            if (currentItem) {
                if (line) {
                    currentItem.raw_usage += '\n' + line;
                }
            }
        }
    }

    // Push last item
    if (currentItem) {
        result.push(currentItem);
    }

    // Now post-process usages
    const finalResult = result.map(item => {
        let usage = item.raw_usage || "";
        let common_usage_list = [];
        let fixed_collocation_list = [];

        // Remove placeholder
        if (usage.includes('(無標示特定搭配)')) {
            usage = "";
        }

        if (usage) {
            // Regex to split
            const regex = /(常見搭配：|固定用法：|固定搭配：)/g;
            let parts = [];
            let m;
            while ((m = regex.exec(usage)) !== null) {
                parts.push({
                    type: m[0],
                    index: m.index,
                    len: m[0].length
                });
            }

            if (parts.length > 0) {
                parts.forEach((part, idx) => {
                    let start = part.index + part.len;
                    let end = (idx + 1 < parts.length) ? parts[idx + 1].index : usage.length;
                    let content = usage.substring(start, end).trim();

                    if (part.type.includes('常見搭配')) {
                        common_usage_list.push(content);
                    } else {
                        fixed_collocation_list.push(content);
                    }
                });
            } else {
                // If text exists but no keyword, put in common?
                if (usage.trim().length > 0) {
                    common_usage_list.push(usage.trim());
                }
            }
        }

        const id = `day15_${item.word}`;

        return {
            id: id,
            day: 15,
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
