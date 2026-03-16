const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day29.txt');
const outputFile = path.join(__dirname, 'vocab_day29.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Normalize newlines
    const lines = data.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');

    // Structure:
    // Line 1: "1" (Number)
    // Line 2: "conserve" (Word)
    // Line 3: "(v. 保存，保護)" (Chinese)
    // Line 4+: "● 常見搭配：..." (Usage)

    // Skip header
    // The raw file might have "編號\t單字..." as first line

    const result = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('編號')) continue;

        // Check if line is purely digits => New Entry
        if (/^\d+$/.test(line)) {
            if (currentItem) {
                // Validate previous item
                if (currentItem.word) {
                    result.push(currentItem);
                }
            }

            currentItem = {
                day: 29,
                order: parseInt(line, 10),
                word: "",
                chinese: "",
                fixed_collocation_list: [],
                common_usage_list: []
            };
        } else if (currentItem) {
            // Processing fields

            // Usage Lines (start with bullet or keywords)
            if (line.includes('●') || line.includes('常見搭配') || line.includes('固定搭配') || line.includes('固定用法') || line.includes('無特定搭配')) {
                parseUsageLine(line, currentItem);
            }
            // Chinese Definition (starts with parentheses or contains chinese?)
            // Usually "(v. ...)"
            else if (line.startsWith('(') || line.includes('(v.') || line.includes('(n.') || line.includes('(adj.') || line.includes('(adv.')) {
                currentItem.chinese = line;
            }
            // Word (is English)
            // "conserve"
            // "chance"
            else if (/^[a-zA-Z\s-]+$/.test(line)) {
                if (!currentItem.word) {
                    currentItem.word = line;
                }
            } else {
                // Fallback: If line contains Chinese but not Usage keywords, maybe it's Chinese definition without parens?
                // Or part of usage?
                // Assuming it's Chinese if word is set.
                if (currentItem.word && !currentItem.chinese) {
                    currentItem.chinese = line;
                }
            }
        }
    }

    if (currentItem && currentItem.word) {
        result.push(currentItem);
    }

    function parseUsageLine(text, item) {
        if (text.includes('無特定搭配') || text.includes('無標示')) return;

        let cleanText = text.replace(/●/g, '').trim();

        const isFixed = cleanText.includes('固定搭配') || cleanText.includes('固定用法');
        const isCommon = cleanText.includes('常見搭配');

        // Remove label
        cleanText = cleanText.replace(/^(固定搭配|固定用法|常見搭配)[：:]?\s*/, '').trim();
        // Remove parens if just enclosing explanation? No, usually example + explanation

        if (isFixed) {
            item.fixed_collocation_list.push(cleanText);
        } else if (isCommon) {
            item.common_usage_list.push(cleanText);
        } else {
            // Default to Common
            item.common_usage_list.push(cleanText);
        }
    }

    const finalResult = result.map(item => {
        const id = `day29_${item.word}`;

        return {
            id: id,
            day: 29,
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
