import test from 'node:test';
import assert from 'node:assert/strict';
import { getQuestionTimerSnapshot } from './questionTimer.js';

test('以截止時間而非 callback 次數計算剩餘時間', () => {
    const snapshot = getQuestionTimerSnapshot(7_000, 2_350, false);

    assert.deepEqual(snapshot, {
        seconds: 4.7,
        shouldTimeout: false,
        finalTenthShown: false
    });
});

test('背景暫停超過截止時間後，恢復時先顯示 0.1 秒', () => {
    const snapshot = getQuestionTimerSnapshot(7_000, 30_000, false);

    assert.deepEqual(snapshot, {
        seconds: 0.1,
        shouldTimeout: false,
        finalTenthShown: true
    });
});

test('0.1 秒已顯示後，下一次更新才觸發逾時', () => {
    const snapshot = getQuestionTimerSnapshot(7_000, 30_100, true);

    assert.deepEqual(snapshot, {
        seconds: 0,
        shouldTimeout: true,
        finalTenthShown: true
    });
});
