import { createHash } from 'node:crypto';
import {
    mkdir,
    readFile,
    rename,
    stat,
    writeFile,
} from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = 'gpt-4o-mini-tts';
const DEFAULT_DAYS = [1, 2, 3, 4, 5];
const MIN_AUDIO_BYTES = 500;
const SPOKEN_TEXT_OVERRIDES = new Map([
    // marin repeatedly returned a structurally valid but silent MP3 for bare "quote".
    ['quote', 'Quote.'],
]);

const VOICES = {
    male: {
        voice: 'cedar',
        label: '男聲',
        instruction:
            'Speak in clear, natural General American English with an adult masculine presentation. ' +
            'Use a calm vocabulary-teaching pace, slightly slower than normal conversation. ' +
            'Pronounce only the provided English word or phrase, with no explanation.',
    },
    female: {
        voice: 'marin',
        label: '女聲',
        instruction:
            'Speak in clear, natural General American English with an adult feminine presentation. ' +
            'Use a calm vocabulary-teaching pace, slightly slower than normal conversation. ' +
            'Pronounce only the provided English word or phrase, with no explanation.',
    },
};

function parseArgs(argv) {
    const options = {
        days: DEFAULT_DAYS,
        concurrency: 4,
        dryRun: false,
        limit: null,
    };

    for (const arg of argv) {
        if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg.startsWith('--days=')) {
            const value = arg.slice('--days='.length);
            const rangeMatch = value.match(/^(\d+)-(\d+)$/);
            if (rangeMatch) {
                const start = Number(rangeMatch[1]);
                const end = Number(rangeMatch[2]);
                options.days = Array.from(
                    { length: end - start + 1 },
                    (_, index) => start + index,
                );
            } else {
                options.days = value.split(',').map(Number);
            }
        } else if (arg.startsWith('--concurrency=')) {
            options.concurrency = Math.min(
                8,
                Math.max(1, Number(arg.slice('--concurrency='.length))),
            );
        } else if (arg.startsWith('--limit=')) {
            options.limit = Math.max(1, Number(arg.slice('--limit='.length)));
        }
    }

    if (
        options.days.length === 0 ||
        options.days.some((day) => !Number.isInteger(day) || day < 1 || day > 30)
    ) {
        throw new Error('Invalid --days value. Use a range such as --days=1-5.');
    }

    return options;
}

function parseEnvFile(source) {
    const values = {};

    for (const rawLine of source.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;

        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) continue;

        let value = match[2].trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        values[match[1]] = value;
    }

    return values;
}

async function getApiKey() {
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;

    const envPath = path.join(ROOT_DIR, '.env');
    const envValues = parseEnvFile(await readFile(envPath, 'utf8'));
    if (!envValues.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is missing from the environment and .env.');
    }
    return envValues.OPENAI_API_KEY;
}

function normalizeText(value) {
    return String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ');
}

function createSlug(value) {
    const slug = normalizeText(value)
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);

    return slug || 'vocabulary';
}

function createSpecId(item, spokenText) {
    return createHash('sha256')
        .update(`${normalizeText(spokenText)}\n${normalizeText(item.chinese)}`)
        .digest('hex')
        .slice(0, 16);
}

async function buildInventory(days) {
    const inventory = [];

    for (const day of days) {
        const filePath = path.join(ROOT_DIR, `vocab_day${day}.json`);
        const items = JSON.parse(await readFile(filePath, 'utf8'));

        for (const item of items) {
            const word = normalizeText(item.word);
            if (!word) continue;

            const spokenText =
                SPOKEN_TEXT_OVERRIDES.get(word.toLowerCase()) || word;
            const specId = createSpecId(item, spokenText);
            const fileName = `${createSlug(word)}-${specId}.mp3`;

            inventory.push({
                day: Number(item.day ?? day),
                order: Number(item.order),
                word,
                spokenText,
                chinese: normalizeText(item.chinese),
                specId,
                fileName,
                audio: {
                    male: `/audio/tts/male/${fileName}`,
                    female: `/audio/tts/female/${fileName}`,
                },
            });
        }
    }

    return inventory;
}

async function fileIsUsable(filePath) {
    try {
        return (await stat(filePath)).size > MIN_AUDIO_BYTES;
    } catch {
        return false;
    }
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateSpeech({ apiKey, item, voiceKey }) {
    const voice = VOICES[voiceKey];
    const outputDir = path.join(ROOT_DIR, 'public', 'audio', 'tts', voiceKey);
    const outputPath = path.join(outputDir, item.fileName);

    if (await fileIsUsable(outputPath)) {
        return { status: 'skipped', outputPath };
    }

    await mkdir(outputDir, { recursive: true });

    let lastError;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
        try {
            const response = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: MODEL,
                    voice: voice.voice,
                    input: item.spokenText,
                    instructions: voice.instruction,
                    response_format: 'mp3',
                }),
            });

            if (!response.ok) {
                const errorText = (await response.text()).slice(0, 300);
                const error = new Error(
                    `OpenAI API ${response.status}: ${errorText || response.statusText}`,
                );
                error.retryable = response.status === 429 || response.status >= 500;
                throw error;
            }

            const contentType = response.headers.get('content-type') || '';
            if (!contentType.toLowerCase().startsWith('audio/')) {
                throw new Error(`Unexpected content type: ${contentType || 'missing'}`);
            }

            const audioBuffer = Buffer.from(await response.arrayBuffer());
            if (audioBuffer.length <= MIN_AUDIO_BYTES) {
                throw new Error(`Audio response is too small: ${audioBuffer.length} bytes`);
            }

            const tempPath = `${outputPath}.tmp`;
            await writeFile(tempPath, audioBuffer);
            await rename(tempPath, outputPath);
            return { status: 'generated', outputPath, bytes: audioBuffer.length };
        } catch (error) {
            lastError = error;
            if (attempt === 5 || error.retryable === false) break;
            await delay(Math.min(15000, 500 * 2 ** (attempt - 1)));
        }
    }

    throw new Error(
        `Failed ${voiceKey} speech for Day ${item.day} #${item.order} "${item.word}": ${lastError?.message}`,
    );
}

async function runWithConcurrency(tasks, concurrency) {
    let nextIndex = 0;
    let completed = 0;
    const totals = { generated: 0, skipped: 0 };

    async function worker() {
        while (nextIndex < tasks.length) {
            const index = nextIndex;
            nextIndex += 1;
            const result = await tasks[index]();
            totals[result.status] += 1;
            completed += 1;

            if (completed % 10 === 0 || completed === tasks.length) {
                console.log(`TTS progress: ${completed}/${tasks.length}`);
            }
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
    );
    return totals;
}

async function writeRuntimeIndex(inventory) {
    const entries = Object.fromEntries(
        inventory.map((item) => [
            `${item.day}:${item.order}`,
            {
                word: item.word,
                male: item.audio.male,
                female: item.audio.female,
            },
        ]),
    );

    const source =
        '// This file is generated by scripts/generate_tts.mjs. Do not edit manually.\n' +
        `export const TTS_AUDIO_DATA = ${JSON.stringify(entries, null, 4)};\n`;

    const outputPath = path.join(ROOT_DIR, 'src', 'constants', 'ttsAudioData.js');
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, source, 'utf8');
}

async function writeManifest(inventory, days) {
    const outputPath = path.join(ROOT_DIR, 'public', 'audio', 'tts', 'manifest.json');
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(
        outputPath,
        JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                model: MODEL,
                days,
                voices: VOICES,
                entries: inventory,
            },
            null,
            2,
        ),
        'utf8',
    );
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    let inventory = await buildInventory(options.days);
    if (options.limit) inventory = inventory.slice(0, options.limit);

    const tasks = inventory.flatMap((item) =>
        Object.keys(VOICES).map((voiceKey) => ({ item, voiceKey })),
    );

    console.log(
        `TTS inventory: ${inventory.length} vocabulary items, ${tasks.length} audio files, Day ${options.days.join(', ')}`,
    );

    if (options.dryRun) {
        console.log('Dry run complete. No API calls or files were written.');
        return;
    }

    const apiKey = await getApiKey();
    const taskFunctions = tasks.map(({ item, voiceKey }) => () =>
        generateSpeech({ apiKey, item, voiceKey }),
    );
    const totals = await runWithConcurrency(taskFunctions, options.concurrency);

    await writeRuntimeIndex(inventory);
    await writeManifest(inventory, options.days);
    console.log(
        `TTS complete: ${totals.generated} generated, ${totals.skipped} existing files reused.`,
    );
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
