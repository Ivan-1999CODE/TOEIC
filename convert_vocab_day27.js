const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day27.txt');
const outputFile = path.join(__dirname, 'vocab_day27.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');

    const result = [];

    lines.forEach(line => {
        // Line format: Number \t Word (POS) Chinese \t Usage
        // Or spaces?
        // Let's rely on splitting by tab first.
        let parts = line.split('\t');

        // If splitting by tab results in 1 part, try matching spaces.
        if (parts.length === 1) {
            // Maybe space separated "1 investment (n.) 投資 常見搭配：..."
            // Match: Number Space Word ...
            const match = line.match(/^(\d+)\s+(.+?)(\s+(常見搭配|固定用法|固定搭配|常見用法)[：:].+)?$/);
            if (match) {
                const order = parseInt(match[1], 10);
                const wordChinese = match[2].trim();
                const usageRaw = match[3] ? match[3].trim() : "";

                parts = [match[1], wordChinese, usageRaw];
            }
        }

        if (parts.length >= 2) {
            const order = parseInt(parts[0], 10);
            const wordChinese = parts[1].trim();
            const usagePart = parts.length > 2 ? parts[2].trim() : "";

            // Parse Word / Chinese
            // "investment (n.) 投資"
            let word = "";
            let chinese = "";

            const parenIdx = wordChinese.indexOf('(');
            if (parenIdx !== -1) {
                word = wordChinese.substring(0, parenIdx).trim();
                chinese = wordChinese.substring(parenIdx).trim();
            } else {
                word = wordChinese;
            }

            // Parse Usage
            let common = [];
            let fixed = [];

            if (usagePart) {
                // "常見搭配：investment of + 金額"
                // "固定用法：in the foreseeable future"
                // Split multiple usages if any (by "；"?)

                // Identify Type
                const isFixed = usagePart.includes('固定用法') || usagePart.includes('固定搭配');
                const isCommon = usagePart.includes('常見搭配');

                // Clean content
                let content = usagePart.replace(/^(常見搭配|固定用法|固定搭配|常見用法)[：:]?\s*/, '').trim();

                // Split multi-usage by full-width semicolon
                const usages = content.split('；').map(u => u.trim());

                if (isFixed) {
                    fixed.push(...usages);
                } else if (isCommon) {
                    common.push(...usages);
                } else {
                    // Default to common if content exists
                    if (content) common.push(...usages);
                }
            }

            const id = `day27_${word}`;

            result.push({
                id: id,
                day: 27,
                order: order,
                word: word,
                chinese: chinese,
                fixed_collocation_list: fixed,
                common_usage_list: common
            });
        }
    });

    // Transform arrays to strings
    const finalResult = result.map(item => ({
        id: item.id,
        day: item.day,
        order: item.order,
        word: item.word,
        chinese: item.chinese,
        fixed_collocation: item.fixed_collocation_list.join('\n'),
        common_usage: item.common_usage_list.join('\n')
    }));

    fs.writeFileSync(outputFile, JSON.stringify(finalResult, null, 2), 'utf8');
    console.log(`Successfully converted ${finalResult.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
