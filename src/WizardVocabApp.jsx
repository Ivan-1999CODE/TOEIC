import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, BookOpen, Scroll, Wand2, Star, Ghost, Award, RotateCcw, Lock, ChevronRight, CheckCircle, Map as MapIcon, Backpack as BackpackIcon, Loader2, Heart, AlertCircle, LogOut } from 'lucide-react';
import { db, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, getDocs, addDoc, serverTimestamp, limit, doc, setDoc, getDoc, updateDoc, writeBatch, arrayUnion } from 'firebase/firestore';

// 音樂系統
import useMusicPlayer, { MUSIC_TRACKS } from './hooks/useMusicPlayer';
import MusicBar from './components/MusicBar';

// 抽離的組件與資料
import { booksData, getDayFromLevel } from './data/gameData';
import OwlIcon from './components/OwlIcon';
import MonsterBook from './components/MonsterBook';
import Backpack from './components/Backpack';
import FlashcardView from './components/FlashcardView';
import BossChallengeModal from './components/BossChallengeModal';
import TrialSelectionView from './components/TrialSelectionView';

import TrialHistoryModal from './components/TrialHistoryModal';
import SpellLibraryView from './components/SpellLibraryView';
import LootModal from './components/LootModal';
import ResultView from './components/ResultView';
import LoginView from './components/LoginView';
import DropoutModal from './components/DropoutModal';
import ArchivesModal from './components/ArchivesModal';
import TeacherView from './components/TeacherView';
import OnboardingModal from './components/OnboardingModal';
import GradingScaleModal from './components/GradingScaleModal';
import LogoutModal from './components/LogoutModal';

const WizardVocabApp = () => {
    // === 登入狀態 ===
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingDefaultName, setOnboardingDefaultName] = useState('');
    const [userGender, setUserGender] = useState('male');
    const [userName, setUserName] = useState('');

    // 監聽登入狀態
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
            if (currentUser) {
                console.log("Welcome back, wizard:", currentUser.email);
                // === 從 Firestore 讀取使用者資料 ===
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userSnap = await getDoc(userDocRef);

                    // 建立/更新基本 profile（displayName, email, enrollDate）
                    const enrollDate = currentUser.metadata?.creationTime
                        ? new Date(currentUser.metadata.creationTime).toISOString().split('T')[0]
                        : new Date().toISOString().split('T')[0];

                    // 從 email 推導 studentId（@ 前面的部分）
                    const studentId = (currentUser.email || '').split('@')[0] || '';

                    if (userSnap.exists()) {
                        const data = userSnap.data();

                        if (data.displayName) setUserName(data.displayName);

                        // 從 Firestore 讀入進度，覆蓋 localStorage 初始值
                        if (data.levelScores) {
                            setLevelScores(data.levelScores);
                            localStorage.setItem('wizardLevelScores', JSON.stringify(data.levelScores));
                        }
                        if (data.bossStages) {
                            setBossStages(data.bossStages);
                            localStorage.setItem('wizardBossStages', JSON.stringify(data.bossStages));
                        }
                        if (data.completionCounts) {
                            setCompletionCounts(data.completionCounts);
                        }
                        if (data.gender) {
                            setUserGender(data.gender);
                        }
                        if (data.unlockedSpells) {
                            setUnlockedSpells(data.unlockedSpells);
                        }
                        if (data.wrongAnswers) {
                            setWrongAnswers(data.wrongAnswers);
                        }

                        // 更新基本資料（含 studentId）但避免覆蓋原本使用者自訂的 displayName
                        await setDoc(userDocRef, {
                            email: currentUser.email || '',
                            studentId,
                            enrollDate,
                            lastUpdated: serverTimestamp()
                        }, { merge: true });
                    } else {
                        // 新使用者：彈出 Onboarding 設定窗
                        setOnboardingDefaultName(currentUser.displayName || '');
                        setShowOnboarding(true);
                        // 不在這裡建立文件，等 Onboarding 完成才 setDoc
                    }
                    setUserProfileLoaded(true);
                } catch (err) {
                    console.error('Error loading user profile:', err);
                    setUserProfileLoaded(true); // 即使失敗也標記完成，避免卡住
                }
            } else {
                setUserProfileLoaded(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // 登出函式
    const handleLogout = () => {
        signOut(auth).then(() => {
            setGameState('start');
            setShowLogoutModal(false); // 確保下次登入時視窗會關閉
            console.log("Wizard has left the castle.");
        });
    };

    // === Onboarding 完成：建立 Firestore 文件 ===
    const handleOnboardingComplete = async (name, gender) => {
        if (!auth.currentUser) return;
        try {
            const uid = auth.currentUser.uid;
            const enrollDate = new Date().toISOString().split('T')[0];
            const studentId = (auth.currentUser.email || '').split('@')[0] || '';
            await setDoc(doc(db, 'users', uid), {
                displayName: name,
                studentId,
                gender,
                email: auth.currentUser.email || '',
                enrollDate,
                levelScores: {},
                bossStages: {},
                completionCounts: {},
                unlockedSpells: [],
                wrongAnswers: [],
                lastUpdated: serverTimestamp()
            });
            setShowOnboarding(false);
            setUserGender(gender);
            setUserName(name);
            setUserProfileLoaded(true);
        } catch (err) {
            console.error('Error saving onboarding data:', err);
        }
    };

    // gameState: 'start', 'level-select', 'learning', 'playing', 'result'
    const [gameState, setGameState] = useState('start');
    const [currentLevel, setCurrentLevel] = useState(null);
    const [totalScore, setTotalScore] = useState(0); // 累積成績
    const [showBackpack, setShowBackpack] = useState(false); // 顯示背包
    const [showHistoryModal, setShowHistoryModal] = useState(false); // 顯示歷史紀錄
    const [showArchives, setShowArchives] = useState(false); // 顯示歷程記錄 Modal
    const [showTeacher, setShowTeacher] = useState(false); // 顯示教師密室
    const [showMonsterBook, setShowMonsterBook] = useState(false); // 顯示怪獸書
    const [showSpellLibrary, setShowSpellLibrary] = useState(false); // 顯示秘密圖書室
    const [showBossModal, setShowBossModal] = useState(false); // 顯示 Boss 挑戰 Modal
    const [showDropout, setShowDropout] = useState(false); // 顯示棄考確認 Modal
    const [showLootModal, setShowLootModal] = useState(false); // 顯示戰利品 Modal
    const [showGradingScale, setShowGradingScale] = useState(false); // 顯示評分標準 Modal
    const [showLogoutModal, setShowLogoutModal] = useState(false); // 顯示登出確認 Modal
    const [hasDraftedLoot, setHasDraftedLoot] = useState(false); // 是否已抽取過該次戰利品
    const lootTimeoutRef = useRef(null); // 戰利品彈窗計時器

    const [isTrialMode, setIsTrialMode] = useState(false); // 是否為試煉模式
    const [trialSelectedDays, setTrialSelectedDays] = useState([]); // 試煉模式選擇的天數 (Day IDs)
    const [userProfileLoaded, setUserProfileLoaded] = useState(false); // Firestore 資料是否已完成讀取
    const [completionCounts, setCompletionCounts] = useState({}); // { levelId: count } 每關 B 級以上的通關次數

    // 進度百分比：175 = 35 關卡 × 5 次
    const progressPercent = React.useMemo(() => {
        const total = Object.values(completionCounts).reduce((sum, c) => sum + Math.min(c, 5), 0);
        return Math.min(Math.round((total / 175) * 100), 100);
    }, [completionCounts]);

    const [unlockedSpells, setUnlockedSpells] = useState([]); // 新增：使用者的萬應室卡片 ID 陣列

    // Boss 關卡完成階段追蹤 (每個 Boss 關卡需要通過 5 次)
    const [bossStages, setBossStages] = useState(() => {
        const saved = localStorage.getItem('wizardBossStages');
        return saved ? JSON.parse(saved) : {}; // { levelId: completedCount }
    });


    // Firestore Data
    const [wordDatabase, setWordDatabase] = useState([]);
    const [loading, setLoading] = useState(true);

    // 動態天數計算 - 根據當前關卡決定要抓取哪一天的單字
    const currentDay = getDayFromLevel(currentLevel?.id || 1);

    // Boss 關卡的天數範圍配置
    const getBossDayRange = (levelId) => {
        switch (levelId) {
            case 6: return [1, 2, 3, 4, 5]; // Boss 01: Day 1-5
            case 12: return [6, 7, 8, 9, 10]; // Boss 02: Day 6-10
            case 18: return [11, 12, 13, 14, 15]; // Boss 03: Day 11-15
            case 24: return [16, 17, 18, 19, 20]; // Boss 04: Day 16-20
            case 30: return [21, 22, 23, 24, 25]; // Boss 05: Day 21-25
            case 36: return [26, 27, 28, 29, 30]; // Boss 06: Day 26-30
            default: return null;
        }
    };

    useEffect(() => {
        if (isTrialMode) return; // 試煉模式下不自動抓取

        const isBossLevel = currentLevel?.isBoss;
        const bossDayRange = isBossLevel ? getBossDayRange(currentLevel.id) : null;

        let q;
        if (isBossLevel && bossDayRange) {
            // Boss 關卡：從多天抓取單字
            q = query(
                collection(db, "toeic_words"),
                where("day", "in", bossDayRange),
                orderBy("day", "asc"),
                orderBy("order", "asc")
            );
        } else {
            // 普通關卡：只抓取當天單字
            q = query(
                collection(db, "toeic_words"),
                where("day", "==", currentDay),
                orderBy("order", "asc")
            );
        }

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const vocabList = [];
            querySnapshot.forEach((doc) => {
                vocabList.push({ id: doc.id, ...doc.data() });
            });

            // Map Firestore data to app format
            const formattedList = vocabList.map(item => {
                // Simple parsing for POS from chinese field (e.g. "n. 履歷表")
                const posMatch = item.chinese.match(/^([a-z]+\.?(\/[a-z]+\.?)*)\s/);
                const pos = posMatch ? posMatch[1] : "";

                return {
                    ...item,
                    pos: pos,
                    meaning: item.chinese,
                    sentence: item.common_usage || item.fixed_collocation || "No example available."
                };
            });

            const logMsg = isBossLevel
                ? `Fetched Boss vocabulary (Day ${bossDayRange?.join(', ')}):`
                : `Fetched Day ${currentDay} vocabulary:`;
            console.log(logMsg, formattedList);
            setWordDatabase(formattedList);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching documents: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentDay, currentLevel]); // 當 currentDay 或 currentLevel 改變時重新抓取

    const [wrongAnswers, setWrongAnswers] = useState(() => {
        const saved = localStorage.getItem('wizardWrongAnswers');
        return saved ? JSON.parse(saved) : [];
    }); // 錯題庫
    const [levelScores, setLevelScores] = useState(() => {
        const saved = localStorage.getItem('wizardLevelScores');
        return saved ? JSON.parse(saved) : {};
    }); // 各關成績記錄 { levelId: score }

    // 動態計算最大解鎖關卡
    const maxUnlockedLevel = React.useMemo(() => {
        let maxLvl = 1;
        // 總共有 36 關
        for (let i = 1; i <= 36; i++) {
            const isBoss = (i % 6 === 0);
            if (isBoss) {
                // Boss 關需要 5 次 >= 1400 才能解鎖下一關 (或可以由 bossStages 來判斷)
                if ((bossStages[i] || 0) >= 5) {
                    maxLvl = i + 1;
                } else {
                    break;
                }
            } else {
                // 普通關卡過關條件為 B 級 (score >= 1400)
                if ((levelScores[i] || 0) >= 1400) {
                    maxLvl = i + 1;
                } else {
                    break;
                }
            }
        }
        return maxLvl;
    }, [levelScores, bossStages]);

    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // HP 系統
    const [hp, setHp] = useState(5);
    const [trialHighScore, setTrialHighScore] = useState(null); // 試煉模式歷史最高分
    const [sessionWrongAnswers, setSessionWrongAnswers] = useState([]); // 本次測驗錯題

    // 計時器相關
    const [timeLeft, setTimeLeft] = useState(7);
    const [answerStartTime, setAnswerStartTime] = useState(null);
    const timerRef = useRef(null);

    // 題目列表（用於隨機抽題）
    const [questionList, setQuestionList] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const MAX_QUESTIONS = 20; // 改為最多 20 題
    const TIME_PER_QUESTION = 7; // 每題 7 秒
    const PASSING_SCORE = 1400; // 及格分數（B 級以上才過關）

    const levelSelectRef = useRef(null);
    const gameSessionRef = useRef(0); // 每次開新遊戲遞增，使舊的 setTimeout 自動失效

    // === 音樂系統 ===
    const music = useMusicPlayer();

    // 根據 gameState 自動切換背景音樂
    useEffect(() => {
        switch (gameState) {
            case 'start':
            case 'level-select':
            case 'learning':
                music.playTrack(music.homeTrackPath);
                break;
            case 'playing':
                // 守護霍格華茲（試煉）裡面不管瀏覽還是測驗都是 test.mp3
                if (isTrialMode) {
                    music.playTrack(MUSIC_TRACKS.TEST);
                } else {
                    music.playTrack(MUSIC_TRACKS.BATTLE);
                }
                break;
            case 'result':
                music.playTrack(MUSIC_TRACKS.RESULT);
                break;
            case 'trial-selection':
                music.playTrack(MUSIC_TRACKS.TEST);
                break;
            default:
                break;
        }
    }, [gameState, isTrialMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // 萬應室（SpellLibrary）開啟時切換至 Room 音樂，關閉後恢復首頁音樂
    useEffect(() => {
        if (showSpellLibrary) {
            music.playTrack(MUSIC_TRACKS.ROOM);
        } else if (
            gameState === 'start' ||
            gameState === 'level-select' ||
            gameState === 'learning'
        ) {
            music.playTrack(music.homeTrackPath);
        }
    }, [showSpellLibrary]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- 導航與狀態控制 ---

    const goToHome = () => {
        setGameState('start');
        setIsTrialMode(false);
    };

    // 發音功能
    const speakWord = (word) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    // 音效：答對
    const playCorrectSound = (word) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 上升音效
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);

        // 音效結束後唸出單字
        setTimeout(() => speakWord(word), 450);
    };

    // 音效：答錯
    const playWrongSound = (word) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 下降音效
        oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime); // F4
        oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime + 0.15); // D4

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.35);

        // 音效結束後唸出正確答案單字
        setTimeout(() => speakWord(word), 400);
    };

    const goToLevelSelect = () => {
        setGameState('level-select');
    };

    // 進入學習模式（卡牌預習）
    const startLearning = (level) => {
        if (level.id > maxUnlockedLevel) return; // 鎖定中
        setIsTrialMode(false); // 確保一般主線不會誤用試煉音樂
        setCurrentLevel(level);
        setGameState('learning');
    };

    // 從學習模式進入測驗模式
    const startQuiz = () => {
        setIsTrialMode(false); // double-safety：確保主線測驗不用試煉音樂
        const newQuestions = generateQuestionList();
        setQuestionList(newQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuestionCount(0);
        setHp(5); // 重置 HP
        setSessionWrongAnswers([]); // 重置本次錯題
        setGameState('playing');
        if (newQuestions.length > 0) {
            generateQuestion(newQuestions[0]);
        }
    };

    // 直接開始關卡（保留原有功能，用於 Boss 戰等）
    const startLevel = (level) => {
        setIsTrialMode(false);
        if (level.id > maxUnlockedLevel) return; // 鎖定中
        setCurrentLevel(level);
        const newQuestions = generateQuestionList();
        setQuestionList(newQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setQuestionCount(0);
        setHp(5); // 重置 HP
        setGameState('playing');
        if (newQuestions.length > 0) {
            generateQuestion(newQuestions[0]);
        }
    };

    // --- 遊戲邏輯 ---

    // 生成隨機題目列表
    const generateQuestionList = () => {
        if (!wordDatabase || wordDatabase.length === 0) return [];

        // 先以 word 去重，避免同一單字出現兩次
        const seen = new Set();
        const uniqueWords = wordDatabase.filter(item => {
            const w = item.word.toLowerCase();
            if (seen.has(w)) return false;
            seen.add(w);
            return true;
        });

        const shuffled = [...uniqueWords].sort(() => Math.random() - 0.5);
        return shuffled.length > 20 ? shuffled.slice(0, 20) : shuffled;
    };

    // 計算分數（前2秒不扣分，之後依時間遞減至10分）
    const calculateScore = (answerTime) => {
        if (answerTime <= 2) return 100;    // 前兩秒皆為滿分
        if (answerTime >= 7) return 10;     // 壓線答對最低得 10 分
        // 2秒到7秒之間，分數從100降到10
        // 公式：100 - ( (答題時間 - 2) * ( (100 - 10) / (7 - 2) ) )
        return Math.round(100 - (answerTime - 2) * 18);
    };

    const generateQuestion = (wordToUse = null) => {
        setSelectedOption(null);
        setFeedback(null);
        setIsAnimating(false);

        // 使用題目列表或從資料庫隨機選擇
        const correctWord = wordToUse || (questionList.length > 0
            ? questionList[currentQuestionIndex]
            : wordDatabase[Math.floor(Math.random() * wordDatabase.length)]);

        let options = [correctWord.meaning];
        while (options.length < 4) {
            const randomIdx = Math.floor(Math.random() * wordDatabase.length);
            const randomMeaning = wordDatabase[randomIdx].meaning;
            if (!options.includes(randomMeaning)) {
                options.push(randomMeaning);
            }
        }
        options = options.sort(() => Math.random() - 0.5);

        setCurrentQuestion({
            ...correctWord,
            options: options
        });

        // 重置計時器
        setTimeLeft(TIME_PER_QUESTION);
        setAnswerStartTime(Date.now());
    };

    const handleAnswer = (option) => {
        if (selectedOption || isAnimating) return;

        // 清除計時器
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        setSelectedOption(option);
        setIsAnimating(true);

        // 計算答題時間
        const answerTime = (Date.now() - answerStartTime) / 1000;
        const actualTimeLeft = TIME_PER_QUESTION - answerTime;

        // 捕捉當下的 session，防止中途離開後舊 timeout 污染新遊戲
        const sessionId = gameSessionRef.current;

        if (option === currentQuestion.meaning) {
            // 答對：根據剩餘時間計算分數
            const earnedScore = calculateScore(answerTime);
            setScore(prev => prev + earnedScore);
            setFeedback('correct');
            // 播放答對音效並唸出單字
            playCorrectSound(currentQuestion.word);
        } else {
            // 答錯：扣 HP
            setFeedback('wrong');
            // 播放答錯音效並唸出正確答案
            playWrongSound(currentQuestion.word);
            setHp(prev => {
                const newHp = prev - 1;
                if (newHp <= 0) {
                    // 死亡判定：延遲後強制結算為 E 級 (但保留分數)
                    setTimeout(() => {
                        if (gameSessionRef.current !== sessionId) return; // 舊 session，忽略
                        setGameState('result');
                    }, 1200);
                    return 0;
                }
                return newHp;
            });

            // 記錄錯題
            setWrongAnswers(prev => {
                const existIdx = prev.findIndex(w => w.word === currentQuestion.word);
                if (existIdx !== -1) {
                    const updated = [...prev];
                    updated[existIdx] = { ...updated[existIdx], errorCount: (updated[existIdx].errorCount || 1) + 1 };
                    return updated;
                }
                return [...prev, { ...currentQuestion, timestamp: Date.now(), reason: 'wrong', errorCount: 1 }];
            });
            // 記錄本次測驗錯題
            setSessionWrongAnswers(prev => [...prev, {
                word: currentQuestion.word,
                correctAnswer: currentQuestion.meaning,
                userAnswer: option,
                reason: 'wrong'
            }]);
        }

        setTimeout(() => {
            if (gameSessionRef.current !== sessionId) return; // 舊 session，忽略
            if (hp <= 1 && option !== currentQuestion.meaning) {
                // HP 歸零，已在上面處理
                return;
            }

            if (currentQuestionIndex + 1 >= questionList.length) {
                setGameState('result');
            } else {
                setQuestionCount(prev => prev + 1);
                const nextIndex = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIndex);
                generateQuestion(questionList[nextIndex]);
            }
        }, 1200);
    };

    // 超時處理
    const handleTimeout = () => {
        if (selectedOption || isAnimating) return;

        setIsAnimating(true);
        setFeedback('timeout');
        // 播放答錯音效並唸出正確答案
        playWrongSound(currentQuestion.word);

        // 捕捉當下的 session
        const sessionId = gameSessionRef.current;

        // 扣 HP
        setHp(prev => {
            const newHp = prev - 1;
            if (newHp <= 0) {
                // 死亡判定
                setTimeout(() => {
                    if (gameSessionRef.current !== sessionId) return; // 舊 session，忽略
                    setGameState('result');
                }, 1200);
                return 0;
            }
            return newHp;
        });

        // 記錄為錯題
        setWrongAnswers(prev => {
            const existIdx = prev.findIndex(w => w.word === currentQuestion.word);
            if (existIdx !== -1) {
                const updated = [...prev];
                updated[existIdx] = { ...updated[existIdx], errorCount: (updated[existIdx].errorCount || 1) + 1 };
                return updated;
            }
            return [...prev, { ...currentQuestion, timestamp: Date.now(), reason: 'timeout', errorCount: 1 }];
        });
        // 記錄本次測驗錯題
        setSessionWrongAnswers(prev => [...prev, {
            word: currentQuestion.word,
            correctAnswer: currentQuestion.meaning,
            userAnswer: '⏰ 超時',
            reason: 'timeout'
        }]);

        setTimeout(() => {
            if (gameSessionRef.current !== sessionId) return; // 舊 session，忽略
            if (hp <= 1) {
                // HP 歸零，已在上面處理
                return;
            }

            if (currentQuestionIndex + 1 >= questionList.length) {
                setGameState('result');
            } else {
                setQuestionCount(prev => prev + 1);
                const nextIndex = currentQuestionIndex + 1;
                setCurrentQuestionIndex(nextIndex);
                generateQuestion(questionList[nextIndex]);
            }
        }, 1200);
    };

    // === 儲存單次游戲歷程記錄 ===
    const saveGameRecord = async (mode, levelId, score, rank) => {
        if (!auth.currentUser) return;
        try {
            const historyRef = collection(db, 'users', auth.currentUser.uid, 'history');
            const now = new Date();
            await addDoc(historyRef, {
                mode,
                levelId,
                score,
                rank,
                timestamp: serverTimestamp(),
                dateString: `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
            });
        } catch (err) {
            console.error('Error saving game record:', err);
        }
    };

    const saveTrialRecord = async (finalScore) => {
        const rank = getGrade(finalScore, hp);
        // 1. 寫入個人 trial_records (歷史列表與高分紀錄用)
        try {
            if (!auth.currentUser) {
                return;
            }
            await addDoc(collection(db, "users", auth.currentUser.uid, "trial_records"), {
                score: finalScore,
                grade: rank,
                selectedDays: trialSelectedDays,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error saving trial record: ", error);
        }
        // 2. 寫入使用者導層 history
        const hasLostSpells = trialSelectedDays.some(d => String(d).startsWith('endgame_'));
        const mode = hasLostSpells ? 'lost_spells' : 'gate_of_truth';
        await saveGameRecord(mode, trialSelectedDays.join(','), finalScore, rank);
    };

    // 處理關卡完成
    const handleLevelComplete = () => {
        if (isTrialMode || !currentLevel) return; // 試煉模式不記錄關卡成績

        const rank = getGrade(score, hp);
        const isRankB = ['S', 'A', 'B'].includes(rank); // 等級 >= B

        // 更新該關卡最高分
        setLevelScores(prev => {
            const currentHighScore = prev[currentLevel.id] || 0;
            const newScores = score > currentHighScore
                ? { ...prev, [currentLevel.id]: score }
                : prev;

            // 同步最高分到 Firestore
            if (userProfileLoaded && auth.currentUser) {
                const userDocRef = doc(db, 'users', auth.currentUser.uid);
                updateDoc(userDocRef, {
                    [`levelScores.${currentLevel.id}`]: Math.max(score, currentHighScore),
                    lastUpdated: serverTimestamp()
                }).catch(err => console.error('Error updating levelScores:', err));
            }

            return newScores;
        });

        // 永遠寫入歷程記錄（無論等級高低）
        saveGameRecord('main_story', currentLevel.id, score, rank);

        // === 進度條：只有 rank >= B 才增加 completionCounts ===
        if (isRankB) {
            setCompletionCounts(prev => {
                const current = prev[currentLevel.id] || 0;
                if (current >= 5) return prev; // 每關最多採計 5 次
                const updated = { ...prev, [currentLevel.id]: current + 1 };
                // 同步到 Firestore
                if (userProfileLoaded && auth.currentUser) {
                    const userDocRef = doc(db, 'users', auth.currentUser.uid);
                    updateDoc(userDocRef, {
                        [`completionCounts.${currentLevel.id}`]: current + 1,
                        lastUpdated: serverTimestamp()
                    }).catch(err => console.error('Error updating completionCounts:', err));
                }
                return updated;
            });
        }

        if (score >= PASSING_SCORE) {
            setTotalScore(prev => prev + score);

            // Boss 關卡：增加完成階段數
            if (currentLevel?.isBoss) {
                setBossStages(prev => {
                    const currentStages = prev[currentLevel.id] || 0;
                    if (currentStages < 5) {
                        if (currentLevel.id === 36 && currentStages === 4) {
                            setTimeout(() => {
                                alert("【真理之門：萬應室解鎖】\n恭喜通關主線所有考驗！您現在可以在「守護霍格華茲：真理之門」中，加入測驗萬應室當中的失傳咒語了！");
                            }, 800);
                        }
                        const newStages = { ...prev, [currentLevel.id]: currentStages + 1 };
                        // 同步 Boss 階段到 Firestore
                        if (userProfileLoaded && auth.currentUser) {
                            const userDocRef = doc(db, 'users', auth.currentUser.uid);
                            updateDoc(userDocRef, {
                                [`bossStages.${currentLevel.id}`]: currentStages + 1,
                                lastUpdated: serverTimestamp()
                            }).catch(err => console.error('Error updating bossStages:', err));
                        }
                        return newStages;
                    }
                    return prev;
                });
            }
        }
    };

    // 歷史紀錄顯示用
    const [historyInfo, setHistoryInfo] = useState(null);

    // 在進入 result 狀態時檢查是否解鎖針對 Loot Drop
    useEffect(() => {
        if (gameState === 'result') {
            if (isTrialMode) {
                saveTrialRecord(score);

                // 查詢該試煉組合的歷史最高分
                const fetchTrialHighScore = async () => {
                    if (!auth.currentUser) return;
                    try {
                        const sortedDays = [...trialSelectedDays].sort((a, b) => a - b);
                        const q = query(
                            collection(db, "users", auth.currentUser.uid, "trial_records"),
                            where("selectedDays", "==", sortedDays)
                        );
                        const snapshot = await getDocs(q);
                        if (!snapshot.empty) {
                            const scores = snapshot.docs.map(d => d.data().score);
                            const highest = Math.max(...scores);
                            setTrialHighScore(highest);
                        } else {
                            setTrialHighScore(null);
                        }
                    } catch (error) {
                        console.error("Error fetching trial high score:", error);
                        setTrialHighScore(null);
                    }
                };
                fetchTrialHighScore();
            } else {
                // 一般模式：先記錄歷史狀態，再更新成績
                if (currentLevel) {
                    const prevScore = levelScores[currentLevel.id];
                    setHistoryInfo({
                        hasPlayed: prevScore !== undefined,
                        highScore: prevScore || 0,
                        grade: prevScore !== undefined ? getGrade(prevScore) : null // History doesn't track HP, assuming survived
                    });
                }

                handleLevelComplete();

                // Loot Drop Trigger: Score >= 1400 (Grade B or higher)
                // 只有在「首次通過該關卡」時才觸發 (即之前沒玩過，或之前最高分未達及格標準)
                const isFirstTimePass = score >= 1400 && (!currentLevel || levelScores[currentLevel.id] === undefined || levelScores[currentLevel.id] < 1400);

                if (isFirstTimePass) {
                    lootTimeoutRef.current = setTimeout(() => setShowLootModal(true), 1500);
                }
            }
        }

        // 進入新遊戲或結算時重置
        if (gameState === 'playing') {
            setHasDraftedLoot(false);
        }

        return () => {
            if (lootTimeoutRef.current) clearTimeout(lootTimeoutRef.current);
        };
    }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

    // 倒數滴答音效（時鐘 tick 聲）
    const playTickSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const bufferSize = audioContext.sampleRate * 0.03; // 30ms 的短促聲
            const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const data = buffer.getChannelData(0);

            // 產生短促噪音脈衝（模擬時鐘滴答）
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
            }

            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            // 用帶通濾波器塑造成清脆的 tick 聲
            const filter = audioContext.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 3000;
            filter.Q.value = 2;

            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);

            source.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(audioContext.destination);

            source.start(audioContext.currentTime);
        } catch (e) {
            // 靜默失敗
        }
    };

    // 計時器倒數
    useEffect(() => {
        if (gameState !== 'playing' || !currentQuestion || selectedOption) {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                const next = prev - 1;
                // 最後 3 秒播放倒數音效
                if (next <= 3 && next >= 1) {
                    playTickSound();
                }
                return next;
            });
        }, 1000);

        timerRef.current = timer;
        return () => clearInterval(timer);
    }, [currentQuestion, selectedOption, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

    // Persist wrong answers to Firebase
    useEffect(() => {
        localStorage.setItem('wizardWrongAnswers', JSON.stringify(wrongAnswers));
        // 同步到 Firebase
        if (user?.uid) {
            const userRef = doc(db, 'users', user.uid);
            updateDoc(userRef, { wrongAnswers }).catch(console.error);
        }
    }, [wrongAnswers]);

    useEffect(() => {
        localStorage.setItem('wizardLevelScores', JSON.stringify(levelScores));
    }, [levelScores]);

    // Persist boss stages
    useEffect(() => {
        localStorage.setItem('wizardBossStages', JSON.stringify(bossStages));
    }, [bossStages]);

    // === Auth 載入畫面 (必須放在所有 hooks 之後) ===
    if (loadingAuth) {
        return (
            <div className="min-h-screen bg-[#1a1a2e] flex flex-col items-center justify-center p-4 font-serif text-amber-100 space-y-4">
                <Loader2 size={48} className="animate-spin text-amber-500" />
                <p className="text-xl animate-pulse">Detecting wizard...</p>
            </div>
        );
    }

    // === 未登入：顯示登入畫面 ===
    if (!user) {
        return <LoginView onLoginSuccess={(u) => setUser(u)} />;
    }

    // Loading Screen
    if (loading && gameState !== 'start' && gameState !== 'level-select' && gameState !== 'trial-selection') {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-serif text-amber-100 space-y-4">
                <Loader2 size={48} className="animate-spin text-amber-500" />
                <p className="text-xl animate-pulse">魔法載入中... (Loading Magic...)</p>
            </div>
        );
    }

    // Boss 關卡點擊處理 - 顯示挑戰 Modal
    const handleBossClick = (level) => {
        if (level.id > maxUnlockedLevel) return; // 鎖定中
        setCurrentLevel(level);
        setShowBossModal(true);
    };

    // Boss 挑戰開始 - 從 Modal 進入測驗
    const startBossChallenge = () => {
        setShowBossModal(false);
        startQuiz();
    };

    // 試煉模式開始
    const handleTrialStart = async (selectedDays) => {
        // 使舊的所有 setTimeout 回調失效，防止中途離開的殘留 timeout 污染新遊戲
        gameSessionRef.current += 1;
        // 重置 UI 狀態，避免閃出舊題目
        setCurrentQuestion(null);
        setSelectedOption(null);
        setIsAnimating(false);
        setFeedback(null);

        setLoading(true);
        setIsTrialMode(true);
        const sortedDays = [...selectedDays].sort((a, b) => {
            if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
            if (typeof a === 'string') return 1;
            if (typeof b === 'string') return -1;
            return a - b;
        });
        setTrialSelectedDays(sortedDays); // 記錄選擇的天數（已排序）
        setGameState('playing');
        setCurrentLevel({ id: 'trial', title: 'Guardian of Hogwarts', week: 'Trial', desc: 'Gate of Truth' }); // Dummy level

        try {
            let allWords = [];

            // 分離正常章節與 Endgame
            const normalDays = selectedDays.filter(d => typeof d === 'number' || !String(d).startsWith('endgame_'));
            const endgameDays = selectedDays.filter(d => String(d).startsWith('endgame_'));

            // Helper to chunk array
            const chunkArray = (arr, size) => {
                const chunks = [];
                for (let i = 0; i < arr.length; i += size) {
                    chunks.push(arr.slice(i, i + size));
                }
                return chunks;
            };

            // Firestore 'in' query limit is 10 (or 30 depending on client, safe to use 10)
            const dayChunks = chunkArray(normalDays, 10);

            const promises = dayChunks.map(async (daysChunk) => {
                if (daysChunk.length === 0) return [];
                const q = query(
                    collection(db, "toeic_words"),
                    where("day", "in", daysChunk)
                );
                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            });

            const results = await Promise.all(promises);
            allWords = results.flat();

            // 如果有選取 Endgame 萬應室內容，我們拉取所有已解鎖的 collocations
            if (endgameDays.length > 0) {
                const collQ = query(
                    collection(db, "collocations"),
                    where("isUnlocked", "==", true)
                );
                const collSnap = await getDocs(collQ);
                const collocations = collSnap.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        word: data.phrase,
                        chinese: data.meaning,
                        pos: "phr.",
                        common_usage: `【萬應室失傳咒語】 稀有度: ${data.rarity}`,
                    };
                });

                // 將失傳咒語合併進去
                allWords = [...allWords, ...collocations];
            }

            // 如果什麼都沒抓到，可能會出錯，預防性檢查
            if (allWords.length === 0) {
                // 如果只選了未解鎖的 Endgame 但其實沒任何已解鎖卡片
                alert("在此測驗範圍內沒有找到足夠的單字！若是萬應室咒語，請先通關關卡獲取它們。");
                setGameState('trial-selection');
                setLoading(false);
                return;
            }

            // 格式化數據
            const formattedList = allWords.map(item => {
                const posMatch = item.chinese ? item.chinese.match(/^([a-z]+\.?(\/[a-z]+\.?)*)\s/) : null;
                const pos = posMatch ? posMatch[1] : (item.pos || "");
                return {
                    ...item,
                    pos: pos,
                    meaning: item.chinese,
                    sentence: item.common_usage || item.fixed_collocation || "No example available."
                };
            });

            setWordDatabase(formattedList);

            // 設定題目（最多 20 題，不重複）
            const shuffled = [...formattedList].sort(() => Math.random() - 0.5);
            const newQuestions = shuffled.slice(0, 20);
            setQuestionList(newQuestions);
            setCurrentQuestionIndex(0);
            setScore(0);
            setQuestionCount(0);
            setHp(5);
            setSessionWrongAnswers([]); // 重置本次錯題

            if (newQuestions.length > 0) {
                // 手動觸發第一題生成，需要微調 generateQuestion
                // 因為 generateQuestion 依賴 state 更新後的 wordDatabase
                // 這裡直接傳入第一個單字

                // Set initial question directly to avoid race condition with state update
                const firstWord = newQuestions[0];
                let options = [firstWord.meaning];
                let pool = formattedList; // use local var
                while (options.length < 4 && pool.length >= 4) {
                    const randomIdx = Math.floor(Math.random() * pool.length);
                    const randomMeaning = pool[randomIdx].meaning;
                    if (!options.includes(randomMeaning)) {
                        options.push(randomMeaning);
                    }
                }
                // padding if not enough words
                while (options.length < 4) {
                    options.push("Option " + (options.length + 1));
                }

                options = options.sort(() => Math.random() - 0.5);

                setCurrentQuestion({
                    ...firstWord,
                    options: options
                });
                setTimeLeft(TIME_PER_QUESTION);
                setAnswerStartTime(Date.now());
            }

        } catch (error) {
            console.error("Error starting trial:", error);
            // Handle error (maybe go back)
            setGameState('start');
        } finally {
            setLoading(false);
        }
    };

    const removeWrongAnswer = (wordToRemove) => {
        setWrongAnswers(prev => {
            const updated = prev.filter(item => item.word !== wordToRemove);
            return updated;
        });
    };

    const getWizardRank = () => {
        if (score === 100) return { title: "傑出 (Outstanding)", color: "text-yellow-400" };
        if (score >= 80) return { title: "超乎期待 (Exceeds Expectations)", color: "text-purple-400" };
        if (score >= 60) return { title: "合格 (Acceptable)", color: "text-green-400" };
        if (score >= 40) return { title: "不佳 (Poor)", color: "text-orange-400" };
        return { title: "飛怪 (Troll)", color: "text-red-500" };
    };

    const getGrade = (score, currentHp = 5) => { // 增加 HP 參數
        if (currentHp <= 0) return 'E'; // 如果 HP 歸零，強制 E 級 (Troll)

        if (score >= 1800) return 'S';
        if (score >= 1600) return 'A';
        if (score >= 1400) return 'B';
        if (score >= 1200) return 'C';
        if (score >= 1000) return 'D';
        return 'E';
    };

    const getGradeColor = (grade) => {
        switch (grade) {
            case 'S': return 'text-[#fbbf24] font-extrabold drop-shadow-sm font-serif'; // S 級 (Gold)
            case 'A': return 'text-[#ef4444] font-bold font-serif'; // A 級 (Red)
            case 'B': return 'text-[#3b82f6] font-bold font-serif'; // B 級 (Blue)
            case 'C': return 'text-[#10b981] font-bold font-serif'; // C 級 (Green)
            case 'D': return 'text-[#9ca3af] font-bold font-serif'; // D 級 (Gray)
            default: return 'text-[#4b5563] font-bold font-serif'; // E 級 (Dark Gray)
        }
    };

    // --- UI 元件 ---

    const getPlayerStatus = (level) => {
        if (level <= 6) return { title: "魔法學徒 (Apprentice)", message: "每一次的試煉都會化為你的力量。繼續累積吧，年輕的巫師！" };
        if (level <= 12) return { title: "見習法師 (Journeyman)", message: "你已經不再是新手了。魔杖的揮舞更加穩健，知識的光芒正在萌芽。" };
        if (level <= 18) return { title: "高階巫師 (High Wizard)", message: "高深的魔法需要強大的心智。你已經證明了自己有能力駕馭更強的力量。" };
        if (level <= 24) return { title: "三巫鬥法大賽鬥士 (Champion)", message: "榮耀屬於勇敢的靈魂。在火焰與試煉中，你鍛造出了鋼鐵般的意志。" };
        if (level <= 30) return { title: "鳳凰會成員 (Order Member)", message: "為了守護珍視之物，你挺身而出。你的智慧已成為抵抗黑暗的鋒利武器。" };
        return { title: "霍格華茲傳奇 (Legendary Wizard)", message: "你的名字將被霍格華茲永遠銘記。你是真理的追尋者，也是傳奇的締造者。" };
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-2 sm:p-4 font-serif relative overflow-hidden">
            {/* 背景動畫 */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 text-yellow-200 animate-pulse"><Star size={24} /></div>
                <div className="absolute top-40 right-20 text-yellow-100 animate-bounce"><Star size={16} /></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 opacity-90"></div>
            </div>

            {/* 主容器 */}
            {/* 主容器 - 改為 h-[90vh] 固定高度 */}
            <div className="relative w-full max-w-lg bg-[#f5e6c8] rounded-xl shadow-[0_0_50px_rgba(234,179,8,0.2)] border-4 border-double border-amber-800 flex flex-col h-[90vh] z-10 overflow-hidden">

                {/* 頂部標題列 */}
                <div className="bg-red-900 text-amber-100 p-2 sm:p-3 text-center border-b-4 border-amber-700 relative shrink-0 z-20 shadow-md flex items-center justify-center min-h-[56px] sm:min-h-[60px]">

                    {/* 左側按鈕群 */}
                    <div className="absolute left-1 sm:left-3 flex items-center gap-0.5 sm:gap-1 z-50">
                        {/* 返回首頁按鈕 (或貓頭鷹試煉入口) */}
                        {gameState !== 'start' && (
                            <button
                                onClick={() => {
                                    if (gameState === 'trial-selection') {
                                        goToHome();
                                    } else {
                                        // 如果正在遊戲中，使舊 timeout 失效
                                        if (gameState === 'playing') {
                                            gameSessionRef.current += 1;
                                            setCurrentQuestion(null);
                                            setSelectedOption(null);
                                            setIsAnimating(false);
                                            setFeedback(null);
                                        }
                                        setGameState('trial-selection');
                                    }
                                }}
                                className="p-1.5 sm:p-2 hover:bg-red-800 rounded-full text-amber-200/80 hover:text-amber-100 transition-all border border-amber-800 hover:border-amber-400"
                                title="守護霍格華茲：真理之門"
                            >
                                <OwlIcon size={20} className="sm:w-6 sm:h-6" />
                            </button>
                        )}
                        {/* 榮譽歷程 Archives 按鈕 */}
                        {gameState !== 'start' && (
                            <button
                                onClick={() => setShowArchives(true)}
                                className="p-1.5 sm:p-2 hover:bg-red-800 rounded-full text-amber-200/80 hover:text-amber-100 transition-all border border-amber-800 hover:border-amber-400"
                                title="榮譽歷程 Archives"
                            >
                                <Award size={20} className="sm:w-6 sm:h-6" />
                            </button>
                        )}
                    </div>

                    {/* 中間標題 */}
                    <div className="flex items-center justify-center gap-1 sm:gap-2 px-[72px] sm:px-[120px]">
                        <Wand2 size={16} className="text-amber-400 sm:w-5 sm:h-5 shrink-0" />
                        <span className="font-bold tracking-wider text-[15px] sm:text-lg whitespace-nowrap truncate">Hogwarts Vocab</span>
                    </div>

                    {/* 右側按鈕群 */}
                    <div className="absolute right-1 sm:right-3 flex items-center gap-0.5 sm:gap-1 z-50">
                        {/* Monster Book 按鈕 */}
                        <button
                            onClick={() => setShowMonsterBook(true)}
                            className="p-1.5 sm:p-2 hover:bg-red-800 rounded-full text-amber-200/80 hover:text-amber-100 transition-all border border-amber-800 hover:border-amber-400 group relative"
                            title="怪獸的怪獸書：錯題捕捉誌"
                        >
                            <BookOpen size={20} className="sm:w-6 sm:h-6 group-hover:animate-pulse" />
                            <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 bg-red-950 rounded-full p-[1px] sm:p-0.5">
                                <Ghost size={10} className="text-red-500 sm:w-3 sm:h-3" />
                            </div>
                        </button>
                        {/* 背包按鈕 */}
                        <button
                            onClick={() => setShowBackpack(true)}
                            className="p-1.5 sm:p-2 hover:bg-red-800 rounded-full text-amber-200/80 hover:text-amber-100 transition-all border border-amber-800 hover:border-amber-400"
                            title="查看成績背包"
                        >
                            <BackpackIcon size={20} className="sm:w-6 sm:h-6" />
                        </button>
                    </div>
                    {/* 評分標準按鈕 */}
                    {gameState === 'level-select' && (
                        <button
                            onClick={() => setShowGradingScale(true)}
                            className="absolute right-4 top-[calc(50%+40px)] p-1 hover:bg-red-800 rounded-full text-amber-200/80 hover:text-amber-100 border border-amber-800 hover:border-amber-400 transition-all z-50 shadow-md bg-red-900"
                            title="評分標準 (Grading Scale)"
                        >
                            <AlertCircle size={18} />
                        </button>
                    )}
                    {/* 登出按鈕 */}
                    {gameState === 'level-select' && (
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="absolute right-4 top-[calc(50%+80px)] p-1 hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-200 border border-stone-700 hover:border-stone-400 transition-all z-50 shadow-md bg-stone-900"
                            title="登出 (Logout)"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>

                {/* 內容卷軸區 - 根據狀態切換 overflow */}
                <div className={`flex-1 relative ${gameState === 'trial-selection' ? 'overflow-hidden' : 'overflow-y-auto p-4 sm:p-6 custom-scrollbar'}`}>

                    {/* 真理之門：改為絕對定位，填滿這個內容區塊 */}
                    {gameState === 'trial-selection' && (
                        <div className="absolute inset-0 z-50">
                            <TrialSelectionView
                                onStart={handleTrialStart}
                                onBack={goToLevelSelect}
                                maxUnlockedLevel={maxUnlockedLevel}
                            />
                        </div>
                    )}

                    {/* --- 1. 首頁 (Start Screen) --- */}
                    {gameState === 'start' && (
                        <div className="flex flex-col items-center justify-center h-[90%] text-center space-y-6 animate-fadeIn min-h-[60vh]">
                            <h1 className="text-3xl font-bold text-red-900 mb-2 font-serif tracking-tight">單字魔法試煉</h1>
                            <div className="flex justify-center my-6">
                                <div className="p-4 bg-amber-100/50 rounded-full border-2 border-amber-700/30">
                                    <BookOpen size={64} className="text-red-900" />
                                </div>
                            </div>
                            <p className="text-amber-900 text-lg italic px-4">
                                "Words are, in my not-so-humble opinion, our most inexhaustible source of magic."
                            </p>
                            <p className="text-slate-700 text-sm">
                                準備好測試你的 TOEIC 單字量了嗎？<br />答對題目為你的學院贏得積分吧！
                            </p>
                            <div className="w-full max-w-sm mt-8">
                                <button
                                    onClick={goToLevelSelect}
                                    className="w-full py-4 bg-red-800 hover:bg-red-700 text-amber-100 font-bold rounded shadow-lg border-2 border-amber-600 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                                >
                                    <Sparkles className="group-hover:animate-spin" size={20} />
                                    揮舞魔杖開始 (Start Journey)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- 2. 關卡地圖 (Level Select) --- */}
                    {gameState === 'level-select' && (
                        <div className="space-y-6 pb-4 animate-fadeIn" ref={levelSelectRef}>
                            <div className="text-center mb-4">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <h2 className="text-2xl font-serif font-bold text-[#4a3728] tracking-tight">
                                        {user?.displayName ? `${user.displayName} 的魔法入學紀錄` : '冒險篇章'}
                                    </h2>
                                </div>
                                <p className="text-[#8c7b60] font-serif italic text-sm">學籍軌跡：已抵達 Week {Math.ceil(maxUnlockedLevel / 6)} (Level {maxUnlockedLevel})</p>

                                {/* 秘密圖書室入口 (Secret Library Entrance) */}
                                <div className="max-w-xs mx-auto mt-3">
                                    <button
                                        onClick={() => setShowSpellLibrary(true)}
                                        className="w-full relative group overflow-hidden rounded-lg border-2 border-[#5d4037] shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                                    >
                                        {/* Wood texture background */}
                                        <div className="absolute inset-0 bg-[#3e2723]"
                                            style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")` }}></div>
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>

                                        <div className="relative p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-[#1a0f0a]/50 rounded-full border border-[#8d6e63]">
                                                    <Scroll size={18} className="text-[#ffcb74]" />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-[#eecfa1] font-bold text-sm font-serif tracking-wide group-hover:text-[#ffe0b2] transition-colors">
                                                        萬應室：失傳咒語
                                                    </h3>
                                                    <p className="text-[10px] text-[#bcaaa4]">The Room of Requirement</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="block text-lg font-mono font-bold text-[#ffcb74] leading-none">
                                                    {unlockedSpells.length}
                                                    <span className="text-[10px] text-[#8d6e63] ml-1">/ 120</span>
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {booksData.map((book, bIdx) => (
                                <div key={bIdx} className="bg-white/40 rounded-lg border border-amber-700/20 overflow-hidden">
                                    <div className="bg-amber-900/10 p-3 border-b border-amber-700/20 font-bold text-amber-900 flex items-center gap-2">
                                        <BookOpen size={16} />
                                        {book.title}
                                    </div>
                                    <div className="p-2 space-y-2">
                                        {book.levels.map((level) => {
                                            const isLocked = level.id > maxUnlockedLevel;
                                            const isCompleted = level.id < maxUnlockedLevel;
                                            const isBossLevel = level.isBoss;

                                            let containerClasses = "w-full text-left p-3 rounded-lg transition-all flex items-center gap-4 group relative ";

                                            if (isBossLevel) {
                                                containerClasses += "my-4 border-2 ";
                                                if (isLocked) {
                                                    containerClasses += "bg-transparent border-[#e0d6c8] cursor-not-allowed ";
                                                } else {
                                                    containerClasses += "border-amber-600 bg-gradient-to-r from-red-900/5 to-amber-900/5 shadow-md transform hover:scale-[1.01] cursor-pointer active:scale-[0.99] ";
                                                }
                                            } else {
                                                containerClasses += "border-b border-[#e0d6c8] last:border-0 ";
                                                if (isLocked) {
                                                    containerClasses += "bg-transparent cursor-not-allowed ";
                                                } else {
                                                    containerClasses += "hover:bg-amber-50 cursor-pointer active:scale-[0.99] ";
                                                }
                                            }

                                            if (currentLevel?.id === level.id) {
                                                containerClasses += isBossLevel ? 'ring-2 ring-red-500 bg-red-50 ' : 'bg-amber-100 ring-2 ring-inset ring-amber-400 ';
                                            }

                                            // Boss Progress
                                            const currentBossClears = bossStages[level.id] || 0;
                                            const bossProgressText = `[ ${currentBossClears} / 5 ]`;

                                            return (
                                                <button
                                                    key={level.id}
                                                    onClick={() => isBossLevel ? handleBossClick(level) : startLearning(level)}
                                                    disabled={isLocked}
                                                    className={containerClasses}
                                                >
                                                    {isBossLevel && !isLocked && (
                                                        <div className="absolute -top-2 -right-2 text-yellow-600 animate-bounce">
                                                            <OwlIcon size={20} className="fill-amber-400 stroke-current" />
                                                        </div>
                                                    )}

                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold border-2 
                                                        ${isLocked
                                                            ? 'bg-transparent border-[#c0b5a5] text-[#9ca3af]' // Gray circle for locked
                                                            : isBossLevel
                                                                ? 'bg-red-800 border-amber-400 text-amber-100 shadow-lg'
                                                                : 'bg-amber-700 border-amber-500 text-amber-100 shadow-sm'}
                                                    `}>
                                                        {isLocked ? <Lock size={16} className="text-[#c0b5a5]" /> : (isCompleted ? <CheckCircle size={18} /> : isBossLevel ? <OwlIcon size={18} /> : level.id)}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className={`text-xs font-bold uppercase tracking-wider ${isLocked
                                                                ? 'text-[#a39a8c]' // Gray text
                                                                : (isBossLevel ? 'text-red-800 font-extrabold' : 'text-amber-800')
                                                                }`}>
                                                                {isBossLevel ? 'BOSS BATTLE' : level.week}
                                                                {isBossLevel && !isLocked && currentBossClears < 5 && (
                                                                    <span className="ml-2 text-red-700">{bossProgressText}</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <h3 className={`font-bold leading-tight ${isLocked
                                                            ? (isBossLevel ? 'text-[#9ca3af] text-xl font-serif tracking-wide' : 'text-[#9ca3af] text-lg')
                                                            : (isBossLevel ? 'text-red-900 text-xl drop-shadow-sm font-serif tracking-wide' : 'text-slate-900 group-hover:text-red-800 transition-colors text-lg')
                                                            }`}>
                                                            {isBossLevel ? `【${level.week}】 ${level.title.split('_')[1] || level.title}` : (level.title.split('_')[1] || level.title)}
                                                        </h3>
                                                        <p className={`text-xs mt-1 line-clamp-2 ${isLocked ? 'text-[#b0a79a]' : 'text-[#8b7b6c]'} ${isBossLevel ? 'italic' : ''}`}>
                                                            {isBossLevel ? (
                                                                <>關卡挑戰：{level.bossChallenge || level.desc}</>
                                                            ) : (
                                                                level.desc
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* 成績顯示 (S, A, B...) */}
                                                    {!isLocked && levelScores[level.id] !== undefined && levelScores[level.id] > 0 && (
                                                        <span className={`mr-2 text-xl ${getGradeColor(getGrade(levelScores[level.id]))}`}>
                                                            {getGrade(levelScores[level.id])}
                                                        </span>
                                                    )}
                                                    {!isLocked && <ChevronRight size={18} className="text-amber-700/50 group-hover:translate-x-1 transition-transform" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- 3. 學習模式 (Learning - Flashcard Preview) --- */}
                    {gameState === 'learning' && (
                        <FlashcardView
                            words={wordDatabase}
                            level={currentLevel}
                            onStartQuiz={startQuiz}
                            onBack={goToLevelSelect}
                        />
                    )}



                    {/* --- 4. Boss戰卷軸介紹 (Boss Intro) --- */}
                    {gameState === 'playing' && currentLevel?.isBoss && questionCount === 0 && !currentQuestion && (
                        <div className="flex flex-col items-center justify-center h-full animate-fadeIn">
                            {/* 卷軸容器 */}
                            <div className="relative w-full max-w-md">
                                {/* 卷軸背景 */}
                                <div className="relative bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 rounded-lg border-4 border-amber-800 shadow-2xl p-8 
                                    before:absolute before:top-0 before:left-0 before:w-full before:h-2 before:bg-amber-900 before:rounded-t
                                    after:absolute after:bottom-0 after:left-0 after:w-full after:h-2 after:bg-amber-900 after:rounded-b">

                                    {/* 卷軸裝飾 - 頂部 */}
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-900 rounded-full shadow-lg"></div>
                                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-amber-900 rounded-full shadow-lg"></div>

                                    {/* Boss標題 */}
                                    <div className="text-center mb-6">
                                        <div className="inline-block px-6 py-2 bg-red-900 text-amber-400 rounded-lg shadow-lg border-2 border-amber-600 mb-3">
                                            <h2 className="text-2xl font-bold flex items-center gap-2 justify-center">
                                                <OwlIcon size={24} className="animate-pulse" />
                                                {currentLevel.week}
                                                <OwlIcon size={24} className="animate-pulse" />
                                            </h2>
                                        </div>
                                        <h3 className="text-xl font-bold text-red-900 mb-4">
                                            {currentLevel.title.split('_')[1]}
                                        </h3>
                                    </div>

                                    {/* 關卡挑戰 */}
                                    <div className="mb-6">
                                        <div className="bg-amber-900/10 rounded-lg p-4 border border-amber-700/30">
                                            <p className="text-xs font-bold text-amber-900 mb-2 uppercase tracking-wider">⚔️ 關卡挑戰</p>
                                            <p className="text-slate-800 leading-relaxed text-sm">
                                                {currentLevel.bossChallenge}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 開始戰鬥按鈕 */}
                                    <button
                                        onClick={generateQuestion}
                                        className="w-full py-4 bg-red-800 hover:bg-red-700 text-amber-100 font-bold rounded-lg shadow-lg border-2 border-amber-600 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 group"
                                    >
                                        <Wand2 className="group-hover:rotate-12 transition-transform" size={20} />
                                        接受挑戰 (Begin Battle)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- 5. 遊戲進行中 (Playing) --- */}
                    {gameState === 'playing' && currentQuestion && (
                        <div className="animate-fadeIn h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4 text-amber-900 font-bold text-xs uppercase tracking-widest border-b border-amber-700/20 pb-2">
                                {/* 棄考按鈕 */}
                                <button
                                    onClick={() => setShowDropout(true)}
                                    className="text-[10px] text-red-800/60 hover:text-red-800 font-serif italic tracking-normal normal-case transition-colors shrink-0"
                                >
                                    ＜ Drop out
                                </button>
                                <span className="text-center truncate px-2">{currentLevel?.title?.split('_')[1] || currentLevel?.title}</span>
                                <span className="text-amber-700 font-black shrink-0">Score: {score}</span>
                            </div>

                            {/* 生命值顯示 */}
                            <div className="flex justify-center gap-2 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`transition-all duration-300 ${i < hp ? 'scale-100 opacity-100' : 'scale-75 opacity-30 grayscale'}`}>
                                        <Heart
                                            size={28}
                                            className={i < hp ? 'fill-red-500 text-red-600' : 'fill-gray-300 text-gray-400'}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* 題目進度 */}
                            <div className="text-center text-sm text-slate-600 mb-2 font-semibold">
                                Question {currentQuestionIndex + 1} / {questionList.length}
                            </div>

                            {/* 計時進度條 */}
                            <div className="w-full bg-slate-200 h-3 rounded-full mb-6 overflow-hidden border border-slate-300 relative">
                                <div
                                    className={`h-full transition-all duration-1000 ${timeLeft < 2 ? 'bg-red-600 animate-pulse' : 'bg-gradient-to-r from-green-500 to-yellow-500'
                                        }`}
                                    style={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-700 drop-shadow-sm">
                                        {timeLeft}s
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-2 drop-shadow-sm tracking-wide">
                                        {currentQuestion.word}
                                    </h2>
                                    <span className="inline-block px-3 py-1 bg-slate-800 text-amber-400 rounded-full text-xs font-serif italic mb-4">
                                        {currentQuestion.pos}
                                    </span>

                                    <div className={`transition-all duration-500 overflow-hidden ${selectedOption ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <p className="text-slate-700 text-sm italic border-t border-amber-700/20 pt-2 mt-2">
                                            "{currentQuestion.sentence}"
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, idx) => {
                                        let btnClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 font-medium relative overflow-hidden text-sm sm:text-base ";

                                        if (selectedOption === option) {
                                            if (option === currentQuestion.meaning) {
                                                btnClass += "bg-green-700 text-white border-green-900 shadow-lg scale-[1.02]";
                                            } else {
                                                btnClass += "bg-red-800 text-white border-red-950 shake-animation";
                                            }
                                        } else if (selectedOption && option === currentQuestion.meaning) {
                                            btnClass += "bg-green-700/70 text-white border-green-900 opacity-60";
                                        } else {
                                            btnClass += "bg-[#fffdf5] border-amber-200 hover:border-amber-500 hover:bg-white text-slate-800 shadow-sm";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleAnswer(option)}
                                                disabled={selectedOption !== null}
                                                className={btnClass}
                                            >
                                                <div className="flex justify-between items-center z-10 relative">
                                                    <span>{option}</span>
                                                    {selectedOption === option && option === currentQuestion.meaning && <Sparkles size={18} className="animate-spin" />}
                                                    {selectedOption === option && option !== currentQuestion.meaning && <Ghost size={18} className="animate-bounce" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="h-8 mt-4 text-center font-bold text-lg shrink-0">
                                {feedback === 'correct' && <span className="text-green-700 animate-pulse drop-shadow-md">✨ Lumos! ✨</span>}
                                {feedback === 'wrong' && <span className="text-red-700 drop-shadow-md">⚡ Nox! ⚡</span>}
                                {feedback === 'timeout' && <span className="text-orange-600 animate-bounce drop-shadow-md">⏰ Time's Up! ⏰</span>}
                            </div>
                        </div>
                    )}

                    {/* 棄考確認 Modal */}
                    <DropoutModal
                        show={showDropout}
                        onStay={() => setShowDropout(false)}
                        onDropout={() => {
                            // 使所有殘留 timeout 失效
                            gameSessionRef.current += 1;
                            setCurrentQuestion(null);
                            setSelectedOption(null);
                            setIsAnimating(false);
                            setFeedback(null);
                            setShowDropout(false);
                            if (isTrialMode) {
                                setGameState('trial-selection');
                            } else {
                                setGameState('level-select');
                            }
                            setScore(0);
                            setQuestionCount(0);
                            setHp(5);
                        }}
                    />

                    {gameState === 'result' && (
                        <ResultView
                            user={user}
                            score={score}
                            totalQuestions={questionList.length}
                            hp={hp}
                            level={currentLevel}
                            historyInfo={historyInfo}
                            isTrialMode={isTrialMode}
                            trialHighScore={trialHighScore}
                            sessionWrongAnswers={sessionWrongAnswers}
                            hasDraftedLoot={hasDraftedLoot}
                            completedBossStages={currentLevel?.isBoss ? (bossStages[currentLevel.id] || 0) : 0}
                            onManualOpenLoot={() => {
                                if (lootTimeoutRef.current) clearTimeout(lootTimeoutRef.current);
                                setShowLootModal(true);
                            }}
                            onGoToLibrary={() => {
                                setGameState('start');
                                setScore(0);
                                setShowSpellLibrary(true);
                            }}
                            onRetry={() => {
                                if (isTrialMode) {
                                    setGameState('trial-selection');
                                } else {
                                    startLearning(currentLevel);
                                }
                                setScore(0);
                            }}
                            onNext={(!isTrialMode && maxUnlockedLevel > (currentLevel?.id || 0)) ? (() => {
                                const nextLevel = booksData.flatMap(b => b.levels).find(l => l.id === (currentLevel?.id || 0) + 1);
                                if (nextLevel) startLearning(nextLevel);
                                else setGameState('level-select');
                            }) : undefined}
                            onBack={() => {
                                if (isTrialMode) {
                                    setGameState('start');
                                } else {
                                    goToLevelSelect();
                                }
                                setScore(0);
                            }}
                        />
                    )}

                </div>

                {/* ===== 底部音樂控制列 ===== */}
                <MusicBar
                    currentTrackPath={music.currentTrackPath}
                    isPlaying={music.isPlaying}
                    isEnabled={music.isEnabled}
                    volume={music.volume}
                    homeTrackKey={music.homeTrackKey}
                    toggleMusic={music.toggleMusic}
                    setVolume={music.setVolume}
                    setHomeTrack={music.setHomeTrack}
                    playTrack={music.playTrack}
                    homeTrackPath={music.homeTrackPath}
                />

                {/* 底部裝飾 */}
                <div className="h-2 bg-amber-800 shrink-0"></div>

                {/* --- Modal 組件 --- */}
                <MonsterBook
                    show={showMonsterBook}
                    onClose={() => setShowMonsterBook(false)}
                    wrongAnswers={wrongAnswers}
                    onRemove={removeWrongAnswer}
                />

                <Backpack
                    show={showBackpack}
                    onClose={() => setShowBackpack(false)}
                    maxUnlockedLevel={maxUnlockedLevel}
                    user={user}
                    userName={userName}
                    gender={userGender}
                    onOpenHistory={() => {
                        setShowBackpack(false);
                        setShowHistoryModal(true);
                    }}
                    onOpenArchives={() => {
                        setShowBackpack(false);
                        setShowArchives(true);
                    }}
                    onOpenTeacher={() => {
                        setShowBackpack(false);
                        setShowTeacher(true);
                    }}
                />

                <TrialHistoryModal
                    show={showHistoryModal}
                    onClose={() => {
                        setShowHistoryModal(false);
                        setShowBackpack(true);
                    }}
                    user={user}
                />

                <ArchivesModal
                    show={showArchives}
                    onClose={() => setShowArchives(false)}
                    uid={user?.uid}
                />

                <TeacherView
                    show={showTeacher}
                    onClose={() => setShowTeacher(false)}
                />

                <OnboardingModal
                    show={showOnboarding}
                    defaultName={onboardingDefaultName}
                    onComplete={handleOnboardingComplete}
                />

                <GradingScaleModal
                    show={showGradingScale}
                    onClose={() => setShowGradingScale(false)}
                />

                <LogoutModal
                    show={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    onConfirm={handleLogout}
                />

                <SpellLibraryView
                    show={showSpellLibrary}
                    onClose={() => setShowSpellLibrary(false)}
                    unlockedLevel={maxUnlockedLevel}
                    unlockedSpells={unlockedSpells}
                    onSaveRecord={saveGameRecord}
                />

                <BossChallengeModal
                    show={showBossModal}
                    onClose={() => setShowBossModal(false)}
                    onStartChallenge={startBossChallenge}
                    level={currentLevel}
                    completedStages={currentLevel ? (bossStages[currentLevel.id] || 0) : 0}
                />

                <LootModal
                    show={showLootModal}
                    onClose={() => {
                        setShowLootModal(false);
                        setHasDraftedLoot(true);
                    }}
                    onUnlock={(newIds) => setUnlockedSpells(prev => [...new Set([...prev, ...newIds])])}
                    unlockedSpells={unlockedSpells}
                    user={user}
                />

                {/* --- 試煉選擇 (Trial Selection) - 直接覆蓋整個手機框 --- */}

            </div>



            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(120, 53, 15, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(120, 53, 15, 0.3);
          border-radius: 3px;
        }
        .shake-animation {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default WizardVocabApp;
