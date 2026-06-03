import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getRank } from "../components/molecules/ExpCard/ExpCard";
import { authService } from "../services/authService";
import { aiService } from "../services/aiService";
import { subjectService } from "../services/subjectService";
import { userService } from "../services/userService";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // null: 비인증 상태 (토큰 검증 전까지 로그인 간주 안 함)
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // 자동 로그인 검사 진행 중 여부

  // ── 로그인 / 로그아웃 액션 ──────────────────────────────────────
  const login = (token, userObj) => {
    localStorage.setItem("accessToken", token);
    setUser(userObj);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("subjects");
      setSubjects([]);
      setUser(null);
    }
  };

  // (자동 로그인) 앱 시작 시 토큰 검증:
  //   1. OAuth 콜백 URL(?token=<JWT>)에서 토큰 추출
  //   2. localStorage 토큰으로 유저 정보 조회
  useEffect(() => {
    // OAuth 콜백 처리: Spring이 /oauth/callback?token=<JWT> 로 리다이렉트한 경우
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get("token");
    if (oauthToken) {
      localStorage.setItem("accessToken", oauthToken);
      // URL에서 token 파라미터 제거 (보안)
      window.history.replaceState({}, "", window.location.pathname);
    }

    const token = localStorage.getItem("accessToken");
    if (token) {
      authService
        .getMe(token)
        .then((u) => {
          setUser(u);
          setIsInitializing(false);
        })
        .catch(() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user_info");
          setIsInitializing(false);
        });
    } else {
      setIsInitializing(false);
    }
  }, []);

  // apiClient가 401 재발급 실패 시 dispatch하는 이벤트 수신 →
  // window.location.href 강제 이동 없이 React 상태만 초기화 (Router가 /login으로 이동)
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("subjects");
      setSubjects([]);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const [notifications, setNotifications] = useState([]);

  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [isWrongAnswersLoading, setIsWrongAnswersLoading] = useState(false);

  useEffect(() => {
    if (isInitializing) return;

    if (user) {
      setIsWrongAnswersLoading(true);
      aiService.getIncorrects()
        .then((list) => setWrongAnswers(list))
        .catch((err) => console.error("오답 노트를 불러오는 데 실패했습니다:", err))
        .finally(() => setIsWrongAnswersLoading(false));

      subjectService.getSubjects()
        .then((list) => {
          setSubjects(prev => {
            const deletedIds = (() => {
              try { return new Set(JSON.parse(localStorage.getItem('deleted_subjects') ?? '[]')); }
              catch { return new Set(); }
            })();
            const prevMap = Object.fromEntries(prev.map(s => [String(s.id), s]));
            return list.filter(s => !deletedIds.has(String(s.id))).map(s => {
              const prevSubj = prevMap[String(s.id)];
              return {
                ...s,
                fileId: s.fileId ?? prevSubj?.fileId ?? null,
                topics: s.topics.map(t => {
                  const prevTopic = prevSubj?.topics?.find(pt => String(pt.id) === String(t.id));
                  return {
                    ...t,
                    quizCount: t.quizCount > 0 ? t.quizCount : (prevTopic?.quizCount ?? t.quizCount ?? 0)
                  };
                })
              };
            });
          });
        })
        .catch((err) => console.error("과목 목록을 불러오는 데 실패했습니다:", err));

      userService.getDashboard()
        .then((data) => {
          // 대시보드의 growthIndicator로 totalExp/level을 실제 서버 값과 동기화
          const gi = data?.growthIndicator;
          if (gi?.totalExp !== undefined) {
            setUser(prev => {
              if (!prev) return prev;
              const updated = { ...prev, totalExp: gi.totalExp, level: gi.level ?? prev.level };
              try { localStorage.setItem('user_info', JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
          if (data?.recentNotifications) {
            const mapped = data.recentNotifications.map((n, idx) => ({
              id: n.id ?? `notif_${idx}_${new Date(n.createdAt).getTime()}`,
              type: n.type?.toLowerCase() ?? 'info',
              title: n.type === 'REVIEW' ? '복습 알림' : n.type === 'CONCEPT' ? '과목 알림' : '알림',
              message: n.message,
              time: n.createdAt ? new Date(n.createdAt).toLocaleString('ko-KR') : '방금 전',
              read: n.read ?? false,
            }));
            setNotifications(mapped);
          }
        })
        .catch((err) => console.error("대시보드 알림 조회를 실패했습니다:", err));
    } else {
      setWrongAnswers([]);
      setIsWrongAnswersLoading(false);
      setSubjects([]);
      setNotifications([]);
    }
  }, [user?.id, isInitializing]);

  // ── Subjects (과목) 상태 ──────────────────────────────────────
  // subject: { id, name, source: 'manual'|'auto', createdAt, topics: [{id, name, quizCount, color}] }
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem("subjects");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 각 토픽별로 캐시된 퀴즈 문항을 저장: { [topicId]: Question[] }
  const [topicQuestions, _setTopicQuestions] = useState({});

  // ── Daily Goal (오늘의 목표) ──────────────────────────────────
  const DEFAULT_DAILY_GOAL = { studyTime: 60, quizCount: 15, reviewCount: 5 };
  const [dailyGoal, setDailyGoal] = useState(() => {
    try {
      const saved = localStorage.getItem("daily_goal");
      return saved
        ? { ...DEFAULT_DAILY_GOAL, ...JSON.parse(saved) }
        : DEFAULT_DAILY_GOAL;
    } catch {
      return DEFAULT_DAILY_GOAL;
    }
  });

  const updateDailyGoal = (updates) => {
    setDailyGoal((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("daily_goal", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem("subjects", JSON.stringify(subjects));
  }, [subjects]);

  // ── Subject Actions ──────────────────────────────────────────
  const addSubject = (subject) => {
    const newSubject = {
      id: `subj_${Date.now()}`,
      createdAt: new Date().toISOString(),
      topics: [],
      ...subject,
      name: subject.name ?? subject.subjectName,
    };
    setSubjects((prev) => [newSubject, ...prev]);
    return newSubject;
  };

  const updateSubject = (id, updates) => {
    setSubjects((prev) =>
      prev.map((s) => (String(s.id) === String(id) ? { ...s, ...updates } : s)),
    );
  };

  const deleteSubject = (id) => {
    try {
      const deleted = new Set(JSON.parse(localStorage.getItem('deleted_subjects') ?? '[]'));
      deleted.add(String(id));
      localStorage.setItem('deleted_subjects', JSON.stringify([...deleted]));
    } catch {}
    setSubjects((prev) => prev.filter((s) => String(s.id) !== String(id)));
  };

  const addTopicToSubject = (subjectId, topic) => {
    setSubjects((prev) =>
      prev.map((s) =>
        String(s.id) === String(subjectId)
          ? {
              ...s,
              topics: [
                ...s.topics,
                {
                  id: `topic_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                  ...topic,
                },
              ],
            }
          : s,
      ),
    );
  };

  const mergeTopicsInSubject = (subjectId, sourceTopicId, targetTopicId, newQuizCount) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (String(s.id) !== String(subjectId)) return s;
        return {
          ...s,
          topics: s.topics
            .filter((t) => String(t.id) !== String(sourceTopicId))
            .map((t) =>
              String(t.id) === String(targetTopicId)
                ? { ...t, quizCount: newQuizCount }
                : t
            ),
        };
      })
    );
  };

  const loadWrongAnswers = useCallback(async () => {
    try {
      const list = await aiService.getIncorrects();
      setWrongAnswers(list);
    } catch (err) {
      console.error('오답 목록 갱신 실패:', err);
    }
  }, []);

  const deleteTopicFromSubject = (subjectId, topicId) => {
    setSubjects((prev) =>
      prev.map((s) =>
        String(s.id) === String(subjectId)
          ? { ...s, topics: s.topics.filter((t) => String(t.id) !== String(topicId)) }
          : s,
      ),
    );
  };

  const getSubjectById = (id) => subjects.find((s) => String(s.id) === String(id));

  // useCallback으로 참조 안정화 — 의존하는 컴포넌트(QuizPage)의 불필요한 이펙트 재실행 방지
  const setTopicQuestions = useCallback((topicId, questions) => {
    _setTopicQuestions((prev) => ({ ...prev, [topicId]: questions }));
    setSubjects((prevSubjects) =>
      prevSubjects.map((s) => ({
        ...s,
        topics: s.topics.map((t) =>
          String(t.id) === String(topicId)
            ? { ...t, quizCount: questions.length }
            : t
        ),
      }))
    );
  }, []);

  // ── EXP Actions ──────────────────────────────────────────────
  const addExp = (exp) => {
    setUser((prev) => {
      const newExp = prev.totalExp + exp;
      const prevRank = getRank(prev.totalExp);
      const newRank = getRank(newExp);

      let newLevel = prev.level;
      if (newRank.name !== prevRank.name) {
        newLevel += 1;
        addNotification({
          type: "rank",
          title: "등급 상승!",
          message: `축하합니다! ${newRank.name} 등급으로 승급했습니다! 🎉`,
        });
      }

      return { ...prev, totalExp: newExp, level: newLevel };
    });
  };

  /**
   * ── AI 기반 최근 실력 가중 정답률 (EMA) 업데이트 로직 ──
   * 퀴즈가 끝난 뒤 호출됩니다. 다른 플랫폼들처럼 과거의 누적 데이터보다
   * "최근 푼 퀴즈(현재 실력)"의 정답률 비율을 30~50% 비중으로 계산해 정밀한 현재 폼을 보여줍니다.
   */
  const submitQuizResult = (correctCount, totalQuizCount) => {
    setUser((prev) => {
      if (!prev) return prev;

      const newTotalSolved = (prev.totalSolved || 0) + totalQuizCount;
      const newCorrectCount = (prev.correctCount || 0) + correctCount;

      // 이번 퀴즈만의 정답률 (0 ~ 100)
      const currentSessionAccuracy = Math.round(
        (correctCount / totalQuizCount) * 100,
      );

      let newAccuracy = prev.accuracy;
      if (prev.totalSolved === 0 || !prev.accuracy) {
        // 첫 번째 퀴즈를 푼 경우 그대로 100% 반영
        newAccuracy = currentSessionAccuracy;
      } else {
        // AI 학습 플랫폼 트렌드: (기존 정답률 * 70%) + (이번 정답률 * 30%) 비중으로 혼합
        newAccuracy = Math.round(
          prev.accuracy * 0.7 + currentSessionAccuracy * 0.3,
        );
      }

      // 맞힌 개수만큼 XP 보상 즉시 추가 (1문제당 +25 XP라고 가정)
      const expEarned = correctCount * 25;

      // 기존 addExp 로직 복제 적용 (렌더링 트리거 최적화 위함)
      const newExp = prev.totalExp + expEarned;
      const prevRank = getRank(prev.totalExp);
      const newRank = getRank(newExp);
      let newLevel = prev.level;

      if (newRank.name !== prevRank.name) {
        newLevel += 1;
        addNotification({
          type: "rank",
          title: "등급 상승!",
          message: `축하합니다! ${newRank.name} 등급으로 승급하셨습니다! 🚀`,
        });
      }

      return {
        ...prev,
        totalSolved: newTotalSolved,
        correctCount: newCorrectCount,
        accuracy: newAccuracy,
        totalExp: newExp,
        level: newLevel,
      };
    });
  };

  const addWrongAnswer = (q) => {
    setWrongAnswers((prev) => {
      // 이미 같은 문제가 있으면 wrongCount만 증가하고 맨 앞으로 이동
      const existing = prev.find((w) => w.id === q.id);
      if (existing) {
        const updated = {
          ...existing,
          wrongCount: (existing.wrongCount || 1) + 1,
          lastAttemptAt: new Date().toISOString(),
          isMastered: false,
        };
        return [updated, ...prev.filter((w) => w.id !== q.id)];
      }
      // 새 오답 추가 - 맨 앞으로 추가 (최신순)
      return [
        {
          ...q,
          wrongCount: 1,
          lastAttemptAt: new Date().toISOString(),
          wrongDate: new Date().toISOString(),
          aiExplanation: null, // aiService.analyzeWrongAnswer() 호출 후 채워짐
          isMastered: false,
        },
        ...prev,
      ];
    });
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, wrongCount: prev.wrongCount + 1 };
    });
  };

  const removeWrongAnswer = (id) => {
    setWrongAnswers((prev) => prev.filter((q) => q.id !== id));
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, wrongCount: Math.max(0, prev.wrongCount - 1) };
    });
  };

  // 오답 마스터 처리: isMastered = true + EXP 보상
  const masterWrongAnswer = (id) => {
    setWrongAnswers((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, isMastered: true, lastAttemptAt: new Date().toISOString() }
          : q,
      ),
    );
    // 오답 정복 보상: +50 XP
    setUser((prev) => {
      const newExp = prev.totalExp + 50;
      const prevRank = getRank(prev.totalExp);
      const newRank = getRank(newExp);
      let newLevel = prev.level;
      if (newRank.name !== prevRank.name) newLevel += 1;
      return {
        ...prev,
        totalExp: newExp,
        level: newLevel,
        wrongCount: Math.max(0, prev.wrongCount - 1),
      };
    });
    addNotification({
      type: "review",
      title: "오답 정복! 🎉",
      message: "틀렸던 문제를 다시 풀어 마스터했습니다! +50 XP 획득",
    });
  };

  // AI 해설 업데이트
  const updateWrongAnswerExplanation = (id, aiExplanation) => {
    setWrongAnswers((prev) =>
      prev.map((q) => (q.id === id ? { ...q, aiExplanation } : q)),
    );
  };

  // submitAll 응답에서 받은 정답 인덱스(0-based) 업데이트
  const updateWrongAnswerCorrectIndex = (id, correctIndex) => {
    setWrongAnswers((prev) =>
      prev.map((q) => (String(q.id) === String(id) ? { ...q, correctIndex } : q)),
    );
  };

  const addNotification = (notif) => {
    setNotifications((prev) => [
      { ...notif, id: Date.now(), time: "방금", read: false },
      ...prev,
    ]);
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, unreadNotifications: prev.unreadNotifications + 1 };
    });
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - 1) };
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isInitializing, // 로딩 상태 외부로 노출
        notifications,
        wrongAnswers,
        isWrongAnswersLoading,
        subjects,
        topicQuestions,
        dailyGoal,
        updateDailyGoal,
        addExp,
        submitQuizResult, // <== 외부에서 퀴즈 끝날 때 이거 하나만 부르면 알아서 척척 업데이트 됩니다.
        addWrongAnswer,
        removeWrongAnswer,
        addNotification,
        markNotificationRead,
        addSubject,
        updateSubject,
        deleteSubject,
        addTopicToSubject,
        deleteTopicFromSubject,
        mergeTopicsInSubject,
        getSubjectById,
        setTopicQuestions,
        loadWrongAnswers,
        masterWrongAnswer,
        updateWrongAnswerExplanation,
        updateWrongAnswerCorrectIndex,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
