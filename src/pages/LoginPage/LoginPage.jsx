import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
  MessageCircle,
  Globe,
  ArrowLeft,
  Search,
} from "lucide-react";
import {
  authService,
  tokenStorage,
  AUTH_CONFIG,
} from "../../services/authService";
import { useApp } from "../../context/AppContext";
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser } = useApp();

  // 'login' | 'signup' | 'findEmail' | 'findPassword'
  const [mode, setMode] = useState("login");
  // 'request' | 'verify' | 'reset'
  // 'email' | 'code' | 'password'
  const [findPasswordStep, setFindPasswordStep] = useState("email");

  const [form, setForm] = useState({
    name: "",
    userId: "",
    email: "",
    password: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // 이메일 찾기: 'input'(이름 입력) | 'list'(이메일 선택) | 'complete'(완료)
  const [findEmailStep, setFindEmailStep] = useState("input");
  const [foundEmails, setFoundEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccessMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // 유효성 검사
    if (mode === "findEmail") {
      if (!form.name.trim()) {
        setError("이름을 입력해주세요.");
        return;
      }
    } else if (mode === "findPassword") {
      if (findPasswordStep === "email") {
        if (!form.userId.trim()) {
          setError("아이디를 입력해주세요.");
          return;
        }
        if (!form.email) {
          setError("이메일을 입력해주세요.");
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          setError("올바른 이메일 형식을 입력해주세요.");
          return;
        }
      }
      if (findPasswordStep === "code") {
        if (!form.code.trim()) {
          setError("인증 코드를 입력해주세요.");
          return;
        }
        if (!/^[a-zA-Z0-9]{6}$/.test(form.code.trim())) {
          setError("6자리 영숫자 코드를 입력해주세요.");
          return;
        }
      }
      if (findPasswordStep === "password") {
        if (!form.newPassword) {
          setError("새 비밀번호를 입력해주세요.");
          return;
        }
        if (form.newPassword.length < 4) {
          setError("비밀번호는 4자 이상이어야 합니다.");
          return;
        }
        if (form.newPassword !== form.confirmPassword) {
          setError("비밀번호가 일치하지 않습니다.");
          return;
        }
      }
    } else {
      if (!form.email || !form.password) {
        setError("이메일과 비밀번호를 입력해주세요.");
        return;
      }
      if (mode === "signup" && !form.name.trim()) {
        setError("이름을 입력해주세요.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "findEmail") {
        const result = await authService.findEmail(form.name);
        setFoundEmails(result.results ?? []);
        setFindEmailStep("list");
      } else if (mode === "findPassword") {
        if (findPasswordStep === "email") {
          const result = await authService.requestReset(
            form.userId.trim(),
            form.email,
          );
          setSuccessMsg(result.message);
          setFindPasswordStep("code");
        } else if (findPasswordStep === "code") {
          await authService.verifyCode(form.email, form.code.trim());
          setSuccessMsg("인증되었습니다. 새 비밀번호를 입력해주세요.");
          setFindPasswordStep("password");
        } else if (findPasswordStep === "password") {
          await authService.completeReset(
            form.email,
            form.code.trim(),
            form.newPassword,
          );
          setSuccessMsg("비밀번호가 변경되었습니다. 로그인해주세요.");
          setMode("login");
          setFindPasswordStep("email");
          setForm({
            name: "",
            userId: "",
            email: "",
            password: "",
            code: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      } else {
        if (mode === "login") {
          const result = await authService.login(form.email, form.password);
          tokenStorage.set(result.token);
          setUser(result.user);
          navigate("/");
        } else {
          await authService.signup(form.email, form.password, form.name);
          setSuccessMsg("회원가입이 완료되었습니다. 로그인해주세요.");
          setMode("login");
          setForm({
            name: "",
            userId: "",
            email: "",
            password: "",
            code: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider) => {
    setError("");

    if (AUTH_CONFIG.useMock) {
      // Mock 모드: Promise 반환 → 즉시 로그인 처리
      try {
        setLoading(true);
        const result = await authService.socialLogin(provider);
        tokenStorage.set(result.token);
        setUser(result.user);
        navigate("/");
      } catch (err) {
        setError(
          err.message || "소셜 계정 연동에 실패했습니다. 다시 시도해주세요.",
        );
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      authService.socialLogin(provider);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError("");
    setSuccessMsg("");
    setForm({
      name: "",
      userId: "",
      email: "",
      password: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const goToFind = (findMode) => {
    setMode(findMode);
    setError("");
    setSuccessMsg("");
    setFindEmailStep("input");
    setFoundEmails([]);
    setSelectedEmail("");
    setForm({
      name: "",
      userId: "",
      email: "",
      password: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const backToLogin = () => {
    setMode("login");
    setFindPasswordStep("email");
    setFindEmailStep("input");
    setFoundEmails([]);
    setSelectedEmail("");
    setError("");
    setSuccessMsg("");
    setForm({
      name: "",
      userId: "",
      email: "",
      password: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleSelectEmail = async (email) => {
    setError("");
    setLoading(true);
    try {
      const result = await authService.sendFindId(email);
      setSelectedEmail(email);
      setSuccessMsg(result?.message ?? "이메일 정보가 확인되었습니다.");
      setFindEmailStep("complete");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 배경 파티클 */}
      <div className="login-page__bg">
        <div className="login-page__orb login-page__orb--1" />
        <div className="login-page__orb login-page__orb--2" />
        <div className="login-page__orb login-page__orb--3" />
      </div>

      <div className="login-page__card glass-card animate-fade-in">
        {/* 로고 */}
        <div className="login-page__logo">
          <div className="login-page__logo-icon">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="login-page__logo-title gradient-text">AIDucation</h1>
            <p className="login-page__logo-sub">AI 기반 맞춤 학습 플랫폼</p>
          </div>
        </div>

        {/* 탭 / 헤더 */}
        {mode === "login" || mode === "signup" ? (
          <div className="login-page__tabs">
            <button
              id="tab-login"
              className={`login-page__tab ${mode === "login" ? "login-page__tab--active" : ""}`}
              onClick={() => switchMode()}
              disabled={mode === "login"}
            >
              로그인
            </button>
            <button
              id="tab-signup"
              className={`login-page__tab ${mode === "signup" ? "login-page__tab--active" : ""}`}
              onClick={() => switchMode()}
              disabled={mode === "signup"}
            >
              회원가입
            </button>
          </div>
        ) : (
          <div className="login-page__find-header animate-fade-in">
            <button
              type="button"
              className="login-page__back-btn"
              onClick={backToLogin}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="login-page__find-title">
              <Search size={18} />
              {mode === "findEmail" ? "아이디(이메일) 찾기" : "비밀번호 찾기"}
            </h2>
          </div>
        )}

        {/* 비밀번호 찾기 스텝 인디케이터 */}
        {mode === "findPassword" && (
          <div className="login-page__steps animate-fade-in">
            {[
              { key: "email", label: "이메일 인증" },
              { key: "code", label: "코드 확인" },
              { key: "password", label: "비밀번호 변경" },
            ].map((step, idx) => {
              const stepOrder = { email: 0, code: 1, password: 2 };
              const currentIdx = stepOrder[findPasswordStep];
              const isDone = stepOrder[step.key] < currentIdx;
              const isActive = step.key === findPasswordStep;
              return (
                <React.Fragment key={step.key}>
                  <div
                    className={`login-page__step ${isActive ? "login-page__step--active" : ""} ${isDone ? "login-page__step--done" : ""}`}
                  >
                    <div className="login-page__step-circle">
                      {isDone ? "✓" : idx + 1}
                    </div>
                    <span className="login-page__step-label">{step.label}</span>
                  </div>
                  {idx < 2 && (
                    <div
                      className={`login-page__step-line ${isDone ? "login-page__step-line--done" : ""}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* 폼 */}
        <form className="login-page__form" onSubmit={handleSubmit} noValidate>
          {/* 이름 (회원가입 / 이메일 찾기 input 단계만) */}
          {(mode === "signup" || (mode === "findEmail" && findEmailStep === "input")) && (
            <div className="login-page__field animate-fade-in">
              <label htmlFor="input-name" className="login-page__label">
                이름
              </label>
              <div className="login-page__input-wrap">
                <User size={16} className="login-page__input-icon" />
                <input
                  id="input-name"
                  name="name"
                  type="text"
                  className="login-page__input"
                  placeholder="홍길동"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
              {mode === "findEmail" && (
                <p className="login-page__field-hint">
                  가입 시 사용한 이름을 입력해주세요.
                </p>
              )}
            </div>
          )}

          {/* 비밀번호 찾기 Step 1 — 아이디 입력 */}
          {mode === "findPassword" && findPasswordStep === "email" && (
            <div className="login-page__field animate-fade-in">
              <label htmlFor="input-userId" className="login-page__label">
                아이디
              </label>
              <div className="login-page__input-wrap">
                <User size={16} className="login-page__input-icon" />
                <input
                  id="input-userId"
                  name="userId"
                  type="text"
                  className="login-page__input"
                  placeholder="가입 시 사용한 아이디"
                  value={form.userId}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
            </div>
          )}

          {/* 이메일 (로그인 / 회원가입 / 비밀번호 찾기 Step 1) */}
          {mode !== "findEmail" &&
            !(mode === "findPassword" && findPasswordStep !== "email") && (
              <div className="login-page__field">
                <label htmlFor="input-email" className="login-page__label">
                  이메일
                </label>
                <div className="login-page__input-wrap">
                  <Mail size={16} className="login-page__input-icon" />
                  <input
                    id="input-email"
                    name="email"
                    type="email"
                    className="login-page__input"
                    placeholder="test@test.com"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                {mode === "findPassword" && findPasswordStep === "email" && (
                  <p className="login-page__field-hint">
                    아이디와 이메일이 일치하면 인증 코드를 발송합니다.
                  </p>
                )}
              </div>
            )}

          {/* 인증 코드 (비밀번호 찾기 Step 2) */}
          {mode === "findPassword" && findPasswordStep === "code" && (
            <div className="login-page__field animate-fade-in">
              <label htmlFor="input-code" className="login-page__label">
                인증 코드
              </label>
              <div className="login-page__input-wrap">
                <Lock size={16} className="login-page__input-icon" />
                <input
                  id="input-code"
                  name="code"
                  type="text"
                  className="login-page__input"
                  placeholder="인증 코드 입력"
                  value={form.code}
                  onChange={handleChange}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
              </div>
              <p className="login-page__field-hint">
                {form.email}로 발송된 6자리 코드를 입력해주세요.
              </p>
              {AUTH_CONFIG.useMockReset && (
                <div className="login-page__hint">
                  <Sparkles size={12} />
                  테스트 코드: ab1234
                </div>
              )}
            </div>
          )}

          {/* 새 비밀번호 (비밀번호 찾기 Step 3) */}
          {mode === "findPassword" && findPasswordStep === "password" && (
            <>
              <div className="login-page__field animate-fade-in">
                <label
                  htmlFor="input-new-password"
                  className="login-page__label"
                >
                  새 비밀번호
                </label>
                <div className="login-page__input-wrap">
                  <Lock size={16} className="login-page__input-icon" />
                  <input
                    id="input-new-password"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    className="login-page__input login-page__input--has-suffix"
                    placeholder="새 비밀번호 입력"
                    value={form.newPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="login-page__pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="login-page__field animate-fade-in">
                <label
                  htmlFor="input-confirm-password"
                  className="login-page__label"
                >
                  비밀번호 확인
                </label>
                <div className="login-page__input-wrap">
                  <Lock size={16} className="login-page__input-icon" />
                  <input
                    id="input-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    className="login-page__input"
                    placeholder="비밀번호 재입력"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </>
          )}

          {/* 비밀번호 (로그인 / 회원가입만) */}
          {(mode === "login" || mode === "signup") && (
            <div className="login-page__field">
              <label htmlFor="input-password" className="login-page__label">
                비밀번호
              </label>
              <div className="login-page__input-wrap">
                <Lock size={16} className="login-page__input-icon" />
                <input
                  id="input-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="login-page__input login-page__input--has-suffix"
                  placeholder="비밀번호 입력"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
                <button
                  type="button"
                  className="login-page__pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="login-page__error animate-fade-in" role="alert">
              {error}
            </div>
          )}

          {/* 성공 메시지 (complete 단계는 별도 UI로 표시) */}
          {successMsg && !(mode === "findEmail" && findEmailStep === "complete") && (
            <div className="login-page__success animate-fade-in" role="status">
              {successMsg}
            </div>
          )}

          {/* Mock 힌트 (개발용) */}
          {mode === "login" && (
            <div className="login-page__hint">
              <Sparkles size={12} />
              테스트 계정: test@test.com / 1234
            </div>
          )}

          {/* [이메일 찾기 - list] 이메일 선택 화면 */}
          {mode === "findEmail" && findEmailStep === "list" && (
            <div className="login-page__email-result animate-fade-in">
              {foundEmails.length > 0 ? (
                <>
                  <p className="login-page__result-title">
                    본인의 이메일을 선택해주세요.
                  </p>
                  <ul className="login-page__email-list">
                    {foundEmails.map((item, idx) => (
                      <li key={idx}>
                        <button
                          type="button"
                          className="login-page__email-btn"
                          onClick={() => handleSelectEmail(item.fullEmail ?? item.email)}
                          disabled={loading}
                        >
                          <Mail size={14} />
                          <span>{item.email}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="login-page__result-empty">
                  해당 정보로 등록된 계정이 없습니다.
                </p>
              )}
            </div>
          )}

          {/* [이메일 찾기 - complete] 완료 화면 */}
          {mode === "findEmail" && findEmailStep === "complete" && (
            <div className="login-page__email-result animate-fade-in">
              <p className="login-page__result-title">
                {successMsg || "이메일 정보가 확인되었습니다."}
              </p>
              <button
                type="button"
                className="login-page__submit"
                onClick={backToLogin}
              >
                로그인으로 이동
              </button>
            </div>
          )}

          {/* 제출 버튼 (input 단계에서만 표시) */}
          {!(mode === "findEmail" && findEmailStep !== "input") && (
            <button
              id="btn-submit"
              type="submit"
              className="login-page__submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-page__spinner" />
              ) : mode === "findPassword" ? (
                {
                  email: "코드 발송",
                  code: "인증하기",
                  password: "비밀번호 변경",
                }[findPasswordStep]
              ) : (
                { login: "로그인", signup: "회원가입", findEmail: "이메일 찾기" }[
                  mode
                ]
              )}
            </button>
          )}
        </form>

        {/* 아이디/비밀번호 찾기 링크 (로그인 모드에서만) */}
        {mode === "login" && (
          <div className="login-page__find-links">
            <button
              type="button"
              className="login-page__find-btn"
              onClick={() => goToFind("findEmail")}
            >
              아이디 찾기
            </button>
            <span className="login-page__find-divider">|</span>
            <button
              type="button"
              className="login-page__find-btn"
              onClick={() => goToFind("findPassword")}
            >
              비밀번호 찾기
            </button>
          </div>
        )}

        {/* ── 소셜 로그인 구분선 (로그인/회원가입만) ── */}
        {(mode === "login" || mode === "signup") && (
          <>
            <div className="login-page__divider">
              <span>또는 3초 만에 시작하기</span>
            </div>

            <div className="login-page__social">
              <button
                type="button"
                className="login-page__social-btn btn-kakao"
                onClick={() => handleSocialLogin("kakao")}
                disabled={loading}
              >
                <MessageCircle size={18} fill="currentColor" stroke="none" />
                카카오로 {mode === "login" ? "시작하기" : "회원가입"}
              </button>

              <button
                type="button"
                className="login-page__social-btn btn-google"
                onClick={() => handleSocialLogin("google")}
                disabled={loading}
              >
                <Globe size={18} strokeWidth={2.5} />
                구글로 {mode === "login" ? "시작하기" : "회원가입"}
              </button>
            </div>
          </>
        )}

        {/* 모드 전환 */}
        {mode === "login" || mode === "signup" ? (
          <p className="login-page__switch">
            {mode === "login"
              ? "계정이 없으신가요?"
              : "이미 계정이 있으신가요?"}{" "}
            <button
              id="btn-switch-mode"
              type="button"
              className="login-page__switch-btn"
              onClick={switchMode}
            >
              {mode === "login" ? "회원가입" : "로그인"}
            </button>
          </p>
        ) : (
          <p className="login-page__switch">
            <button
              type="button"
              className="login-page__switch-btn"
              onClick={backToLogin}
            >
              로그인으로 돌아가기
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
