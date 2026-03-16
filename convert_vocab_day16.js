const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day16.txt');
const outputFile = path.join(__dirname, 'vocab_day16.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/);

    const result = [];
    let currentItem = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip header or empty lines if we are not in an item
        if (!currentItem && (!line || line.startsWith('編號'))) {
            continue;
        }

        // Check if new item
        const newEntryMatch = line.match(/^(\d+)\t/);

        if (newEntryMatch) {
            // Push previous
            if (currentItem) {
                result.push(currentItem);
            }

            // Parse columns
            // Expecting tab separation
            const parts = line.split('\t');
            // parts[0] = Number
            // parts[1] = Word (POS) Chinese
            // parts[2] = Fixed Collocation
            // parts[3] = Common Usage

            const order = parseInt(parts[0], 10);
            const wordPos = parts[1] ? parts[1].trim() : "";
            let fixed = parts[2] ? parts[2].trim() : "";
            let common = parts[3] ? parts[3].trim() : "";

            // If parts[2] is empty, it might mean the line ends there, or usage is in next lines

            // Parse Word and POS/Chinese
            // "completely (adv.) 完整地"
            let word = "";
            let chinese = "";
            const parenIdx = wordPos.indexOf('(');
            if (parenIdx !== -1) {
                word = wordPos.substring(0, parenIdx).trim();
                chinese = wordPos.substring(parenIdx).trim();
            } else {
                word = wordPos;
                chinese = "";
            }

            currentItem = {
                day: 16,
                order: order,
                word: word,
                chinese: chinese,
                fixed_collocation_list: fixed ? [fixed] : [],
                common_usage_list: common ? [common] : []
            };
        } else {
            // Continuation line
            if (currentItem && line) {
                // Determine where to append
                // For this file, continuation lines seem to generally be Fixed Collocations (e.g. provide A with B)
                // or just extra info from column 3.
                // We will append to fixed_collocation_list.
                currentItem.fixed_collocation_list.push(line);
            }
        }
    }

    if (currentItem) {
        result.push(currentItem);
    }

    const finalResult = result.map(item => {
        const id = `day16_${item.word}`;

        // Join lists
        let fixed = item.fixed_collocation_list.join('\n');
        let common = item.common_usage_list.join('\n');

        return {
            id: id,
            day: 16,
            order: item.order,
            word: item.word,
            chinese: item.chinese,
            fixed_collocation: fixed,
            common_usage: common
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf8');
    console.log(`Successfully converted ${finalResult.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
