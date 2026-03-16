const fs = require('fs');
const path = require('path');

const rawFile = path.join(__dirname, 'vocab_raw_day30.txt');
const outputFile = path.join(__dirname, 'vocab_day30.json');

try {
    const data = fs.readFileSync(rawFile, 'utf8');
    // Normalize text
    let text = data.replace(/\r?\n/g, '');

    // Header to skip
    const headerPrefix = "編號單字 (英文 / 中文)固定搭配 (Fixed Usage) / 常見搭配 (Common Collocation)";
    if (text.startsWith(headerPrefix)) {
        text = text.substring(headerPrefix.length);
    } else {
        // Just in case format differs slightly
        const match = text.match(/常見搭配 \(Common Collocation\)/);
        if (match) {
            text = text.substring(match.index + match[0].length);
        }
    }

    const result = [];
    let indices = [];
    let searchPos = 0;

    // 1. Identify start positions 1..41
    const totalItems = 41;
    for (let i = 1; i <= totalItems; i++) {
        // Regex: number + alphabetical character (no space in between based on examples like 1fatigue)
        const pattern = new RegExp(i + "[a-zA-Z]");
        // Search in remaining text
        const substring = text.substring(searchPos);
        const match = substring.match(pattern);

        if (!match) {
            console.error(`Could not find entry for number ${i}`);
            break;
        }

        const matchIndex = searchPos + match.index;
        indices.push({
            order: i,
            startIndex: matchIndex,
            numLen: String(i).length
        });

        // Move searchPos forward mostly to avoid re-matching same digit if any edge case
        // But actually `matchIndex + 1` handles it.
        searchPos = matchIndex + 1;
    }

    // 2. Extract content
    for (let k = 0; k < indices.length; k++) {
        const itemStart = indices[k].startIndex;
        const numberOffset = indices[k].numLen;

        let itemEnd;
        if (k < indices.length - 1) {
            itemEnd = indices[k + 1].startIndex;
        } else {
            itemEnd = text.length;
        }

        const rawEntry = text.substring(itemStart, itemEnd);
        const entryContent = rawEntry.substring(numberOffset).trim();

        // entryContent example: "fatigue  (n.) 疲勞(無特定用法)"
        // or "prescribe  (v.) 開 (藥方)常見搭配： prescribe medicine (開藥方)  固定搭配： fill a prescription (依處方配藥)"

        // Split Word+Chinese from Usage
        const usageKeywords = ['常見搭配：', '固定搭配：', '固定用法：', '(無特定用法)', '(無標示', '常見搭配:', '固定搭配:'];
        let splitIdx = -1;

        for (const kw of usageKeywords) {
            const idx = entryContent.indexOf(kw);
            if (idx !== -1 && (splitIdx === -1 || idx < splitIdx)) {
                splitIdx = idx;
            }
        }

        let wordChinesePart = "";
        let usagePart = "";

        if (splitIdx !== -1) {
            wordChinesePart = entryContent.substring(0, splitIdx).trim();
            usagePart = entryContent.substring(splitIdx).trim();
        } else {
            wordChinesePart = entryContent;
            usagePart = "";
        }

        // Parse Word / Chinese
        // "fatigue  (n.) 疲勞"
        // "prescribe  (v.) 開 (藥方)"
        // Usually split by ` (` (space + parens) or just `(`

        let word = "";
        let chinese = "";

        const parenIdx = wordChinesePart.indexOf('(');
        if (parenIdx !== -1) {
            word = wordChinesePart.substring(0, parenIdx).trim();
            chinese = wordChinesePart.substring(parenIdx).trim();
        } else {
            // If no parens, maybe space?
            // "1furnished配有家具的" -> "furnished配有家具的"
            // If Day 28 logic needed (ASCII check)?
            // Day 30 Prompt: "1fatigue  (n.)" -> Space exists?
            // "1fatigue (n.)" 
            // Let's assume there is a paren. If not, use regex for first non-ascii.
            if (/[^\x00-\x7F]/.test(wordChinesePart)) {
                const match = wordChinesePart.match(/[^\x00-\x7F]/);
                if (match) {
                    word = wordChinesePart.substring(0, match.index).trim();
                    chinese = wordChinesePart.substring(match.index).trim();
                }
            } else {
                word = wordChinesePart;
            }
        }

        // Parse Usage
        let common = [];
        let fixed = [];

        if (usagePart && !usagePart.includes('(無特定用法)')) {
            // Split by keywords
            // "常見搭配： A  固定搭配： B"
            // Use regex capture group split
            const tokens = usagePart.split(/(常見搭配[:：]|固定搭配[:：]|固定用法[:：])/).filter(t => t.trim() !== '');

            let currentType = "";
            for (const token of tokens) {
                if (token.includes('搭配') || token.includes('用法')) {
                    currentType = token;
                } else {
                    // Content
                    const cleanContent = token.trim();
                    // Sometimes content has multiple items separated by `  ` (double space)?
                    // "prescribe medicine (開藥方)  固定搭配：..." handled by split.
                    // But maybe items within same category?
                    // "yearly medical checkups (每年的健康檢查)" -> single item
                    // If multiple items, usually `；`?
                    // Let's split by `  ` just in case, or keep as one.

                    if (currentType.includes('固定')) {
                        fixed.push(cleanContent);
                    } else if (currentType.includes('常見')) {
                        common.push(cleanContent);
                    }
                }
            }
        }

        const id = `day30_${word}`;

        result.push({
            id: id,
            day: 30,
            order: indices[k].order,
            word: word,
            chinese: chinese,
            fixed_collocation_list: fixed,
            common_usage_list: common
        });
    }

    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Successfully converted ${result.length} items to ${outputFile}`);

} catch (err) {
    console.error('Error processing file:', err);
}
