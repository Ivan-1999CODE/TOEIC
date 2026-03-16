const fs = require('fs');
const path = require('path');

const rawData = `1	stagnant	adj.	停滯的，不景氣的	● 常見搭配：stagnant market/economy (停滯的市場/經濟)
2	dramatically	adv.	戲劇性地，急劇地	● 常見搭配：increase/grow/climb dramatically (急劇增加/成長)
3	brisk	adj.	活潑的，興旺的	● 常見搭配：a brisk market (興旺的市場)
4	unstable	adj.	不穩定的，易變的	● 常見搭配：unstable weather/prices (不穩定的天氣/價格)
5	rapidly	adv.	迅速地，很快地	● 常見搭配：expand/grow/increase rapidly (迅速擴張/成長)
6	soar	v.	急漲，高升	● 常見搭配：prices/rates soar (物價/利率急漲)
7	assert	v.	斷言，主張	● 常見搭配：assert that + 子句 (主張某事)
8	boost	v.	推動，促進	● 常見搭配：boost the economy/sales (推動經濟/增加銷售)
9	analyst	n.	分析師	● 常見搭配：financial/market analyst (財務/市場分析師)
10	potential	adj./n.	潛在的；潛力	● 常見搭配：potential earnings/customers (潛在收益/客戶)
11	pleased	adj.	滿意的，高興的	● 固定搭配：be pleased with (對...滿意)；be pleased to do (很樂意做...)
12	remain	v.	保持；仍有待...	● 常見搭配：remain steady/the same (保持穩定/相同)
13	limited	adj.	有限的	● 固定搭配：for a limited time (限時)；limited offer (限定優惠)
14	costly	adj.	昂貴的	● 常見搭配：a costly mistake (代價慘重的錯誤)
15	particular	adj.	特定的	● 固定搭配：in particular (特別，尤其)
16	drastic	adj.	激烈的，徹底的	● 常見搭配：drastic action/reform (大刀闊斧的行動/改革)
17	evenly	adv.	均勻地，平均地	● 常見搭配：evenly distributed (平均分配)
18	evidence	n.	證據	● 常見搭配：evidence that + 子句 (某事物的證據)
19	prospect	n.	展望，預期	● 常見搭配：the prospect of (對...的預期/可能性)
20	lead	v.	領導；導致	● 固定搭配：lead to + 結果 (導致...)
21	fall	v.	下降	● 常見搭配：fall steadily/sharply (穩定/大幅下降)
22	period	n.	期間	● 常見搭配：for a period of + 時間 (在一長段...期間內)
23	indicator	n.	指標	● 常見搭配：economic indicators (經濟指標)
24	industry	n.	工業，產業	● 常見搭配：service/newspaper industry (服務業/報業)
25	likely	adj.	很可能的	● 固定搭配：be likely to do (很可能做...)
26	boom	n.	繁榮，興盛	● 常見搭配：housing boom (住宅市場熱潮)
27	director	n.	主管，董事	● 常見搭配：board of directors (董事會)
28	substitute	n./v.	代替品；代替	● 固定搭配：substitute A with B / substitute B for A (用 B 代替 A)
29	consequence	n.	結果，後果	● 常見搭配：as a consequence of (作為...的結果)
30	fairly	adv.	相當，頗為	● 常見搭配：fairly widespread/common (相當普遍)
31	economical	adj.	經濟的，節約的	● 常見搭配：economical ways (經濟實惠的方法)
32	thrive	v.	繁榮，成功	● 常見搭配：a thriving industry/business (繁榮的產業)
33	implication	n.	暗示，結果	● 常見搭配：have implications for (對...造成影響)
34	wane	n.	減少，衰退	● 固定搭配：on the wane (正在減少中)
35	prosperity	n.	繁榮	● 固定搭配：in times of prosperity (在繁榮時期)
36	depression	n.	不景氣，蕭條	● 常見搭配：economic depression (經濟蕭條)
37	dwindle	v.	逐漸減少	● 常見搭配：profits dwindle (利潤縮減)
38	impede	v.	妨礙，阻礙	● 常見搭配：impede growth/progress (妨礙成長/進度)
39	promising	adj.	有前途的	● 常見搭配：promising careers/future (有前途的職業/未來)
40	adversity	n.	逆境，不幸	● 常見搭配：face adversity (面臨逆境)`;

const lines = rawData.split('\n');
const result = [];

lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    // Use tab to split fields
    // Assuming format: order \t word \t part_of_speech \t chinese \t usage
    // But verify.
    // Line 1: 1\tstagnant\tadj.\t停滯的，不景氣的\t● 常見搭配：stagnant market/economy (停滯的市場/經濟)

    const parts = line.split('\t');
    if (parts.length >= 4) {
        const order = parseInt(parts[0].trim());
        const word = parts[1].trim();
        // parts[2] is part of speech
        const chineseRaw = parts[3].trim();
        const usageRaw = parts[4] ? parts[4].trim() : '';

        // Extract chinese, sometimes part of speech might be mixed or not needed in final json according to user req
        // User said: "chinese" field.

        let chinese = chineseRaw;

        let fixed_collocation = [];
        let common_usage = [];

        if (usageRaw) {
            // Remove "● "
            let cleanUsage = usageRaw.replace(/●\s*/, '');

            if (cleanUsage.includes('固定搭配：')) {
                fixed_collocation.push(cleanUsage.replace('固定搭配：', '').trim());
            } else if (cleanUsage.includes('常見搭配：')) {
                common_usage.push(cleanUsage.replace('常見搭配：', '').trim());
            } else {
                // Fallback
                common_usage.push(cleanUsage);
            }
        }

        const item = {
            id: `day9_${word}`,
            day: 9,
            order: order,
            word: word,
            chinese: chinese,
            fixed_collocation: fixed_collocation.join('; '),
            common_usage: common_usage.join('; ')
        };
        result.push(item);
    }
});

const outputFile = path.join(__dirname, 'vocab_day9.json');
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
console.log(`Generated ${result.length} items in ${outputFile}`);
