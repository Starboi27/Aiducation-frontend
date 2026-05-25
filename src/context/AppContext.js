import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getRank } from "../components/molecules/ExpCard/ExpCard";
import { authService } from "../services/authService";

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
      setSubjects([]);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "review",
      title: "복습 알림",
      message: "오답 노트에 3개의 문항이 복습을 기다리고 있습니다.",
      time: "10분 전",
      read: false,
    },
    {
      id: 2,
      type: "streak",
      title: "스트릭 보상",
      message: "5일 연속 학습 달성! +500 XP가 지급되었습니다.",
      time: "1시간 전",
      read: false,
    },
  ]);

  const [wrongAnswers, setWrongAnswers] = useState([]);

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
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const deleteSubject = (id) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const addTopicToSubject = (subjectId, topic) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
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

  const deleteTopicFromSubject = (subjectId, topicId) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) }
          : s,
      ),
    );
  };

  const getSubjectById = (id) => subjects.find((s) => s.id === id);

  // useCallback으로 참조 안정화 — 의존하는 컴포넌트(QuizPage)의 불필요한 이펙트 재실행 방지
  const setTopicQuestions = useCallback((topicId, questions) => {
    _setTopicQuestions((prev) => ({ ...prev, [topicId]: questions }));
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
      // 이미 같은 문제가 있으면 wrongCount만 증가
      const existing = prev.find((w) => w.id === q.id);
      if (existing) {
        return prev.map((w) =>
          w.id === q.id
            ? {
                ...w,
                wrongCount: (w.wrongCount || 1) + 1,
                lastAttemptAt: new Date().toISOString(),
                isMastered: false,
              }
            : w,
        );
      }
      // 새 오답 추가 - QuizReview.md 스펙 필드 포함
      return [
        ...prev,
        {
          ...q,
          wrongCount: 1,
          lastAttemptAt: new Date().toISOString(),
          wrongDate: new Date().toISOString(),
          aiExplanation: null, // aiService.analyzeWrongAnswer() 호출 후 채워짐
          isMastered: false,
        },
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
        getSubjectById,
        setTopicQuestions,
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
