﻿"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const REMEMBER_FLAG_KEY = "auth:remember-me";
const REMEMBER_EMAIL_KEY = "auth:remember-email";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

type Tab = "login" | "signup";

type LoginForm = {
  email: string;
  password: string;
  remember: boolean;
};

type SignupForm = {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
};

type LoginErrors = {
  email?: string;
  password?: string;
};

type SignupErrors = {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  name?: string;
};

type ApiError = {
  code?: string;
  message?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError | null;
};

type UserPayload = {
  login_id: string;
  name: string;
  created_dt?: string;
  updated_dt?: string;
};

const getPasswordStrength = (password: string) => {
  if (!password) return { level: "", text: "비밀번호 강도: 입력 대기중" };

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 2) return { level: "weak", text: "비밀번호 강도: 약함" };
  if (strength <= 4) return { level: "medium", text: "비밀번호 강도: 보통" };
  return { level: "strong", text: "비밀번호 강도: 강함" };
};

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [loginForm, setLoginForm] = useState<LoginForm>(() => {
    if (typeof window === "undefined") {
      return { email: "", password: "", remember: false };
    }

    const remembered = window.localStorage.getItem(REMEMBER_FLAG_KEY) === "true";
    const rememberedEmail = remembered
      ? window.localStorage.getItem(REMEMBER_EMAIL_KEY) ?? ""
      : "";

    return { email: rememberedEmail, password: "", remember: remembered };
  });
  const [signupForm, setSignupForm] = useState<SignupForm>({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
  });
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [loginServerError, setLoginServerError] = useState<string | null>(null);
  const [signupServerError, setSignupServerError] = useState<string | null>(null);

  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current = [];
  }, []);
  useEffect(() => {
    setLoginSuccess(false);
    setSignupSuccess(false);
    setLoginServerError(null);
    setSignupServerError(null);
  }, [activeTab]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (loginForm.remember) {
      window.localStorage.setItem(REMEMBER_FLAG_KEY, "true");
      if (loginForm.email) {
        window.localStorage.setItem(REMEMBER_EMAIL_KEY, loginForm.email);
      }
    } else {
      window.localStorage.removeItem(REMEMBER_FLAG_KEY);
      window.localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }
  }, [loginForm.remember, loginForm.email]);

  const passwordStrength = useMemo(
    () => getPasswordStrength(signupForm.password),
    [signupForm.password]
  );
  const passwordMismatch =
    signupForm.passwordConfirm.length > 0 &&
    signupForm.password !== signupForm.passwordConfirm;

  const apiUrl = (path: string) => (API_BASE ? `${API_BASE}${path}` : path);

  const fetchCsrfToken = async () => {
    const response = await fetch(apiUrl("/auth/xsrf-token"), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token (${response.status})`);
    }

    const data = (await response.json()) as Record<string, string | undefined>;
    const token = data["X-XSRF-TOKEN"];
    if (!token) {
      throw new Error("CSRF token is missing in response");
    }

    return token;
  };

  const handleTabChange = (tab: Tab) => setActiveTab(tab);

  const resetLoginForm = (preserveRemember = false) => {
    setLoginForm((prev) => ({
      email: preserveRemember && prev.remember ? prev.email : "",
      password: "",
      remember: preserveRemember ? prev.remember : false,
    }));
    setLoginErrors({});
  };
  const resetSignupForm = () => {
    setSignupForm({ email: "", password: "", passwordConfirm: "", name: "" });
    setSignupErrors({});
  };

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: LoginErrors = {};
    if (!loginForm.email.includes("@")) errors.email = "올바른 이메일 형식을 입력해주세요";
    if (!loginForm.password) errors.password = "비밀번호를 입력해주세요";
    setLoginErrors(errors);
    setLoginServerError(null);
    if (Object.keys(errors).length) return;

    setLoginLoading(true);
    setLoginSuccess(false);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          login_id: loginForm.email,
          password: loginForm.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ApiResponse<UserPayload>;
      if (!payload.success) {
        setLoginServerError(
          payload.error?.message ?? "로그인에 실패했어요. 입력한 정보를 다시 확인해주세요."
        );
        return;
      }

      setLoginSuccess(true);
      resetLoginForm(true);
    } catch (error) {
      console.error("Login request failed", error);
      setLoginServerError("로그인 요청 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: SignupErrors = {};
    if (!signupForm.email.includes("@")) errors.email = "올바른 이메일 형식을 입력해주세요";
    if (signupForm.password.length < 8) errors.password = "비밀번호는 8자 이상이어야 합니다";
    if (signupForm.password !== signupForm.passwordConfirm)
      errors.passwordConfirm = "비밀번호가 일치하지 않습니다";
    if (!signupForm.name.trim()) errors.name = "이름을 입력해주세요";
    setSignupErrors(errors);
    setSignupServerError(null);
    if (Object.keys(errors).length) return;

    setSignupLoading(true);
    setSignupSuccess(false);

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(apiUrl("/auth/join"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-XSRF-TOKEN": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({
          login_id: signupForm.email,
          password: signupForm.password,
          name: signupForm.name,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ApiResponse<UserPayload>;
      if (!payload.success) {
        const message =
          payload.error?.message ?? "회원가입에 실패했어요. 입력 내용을 다시 확인해주세요.";
        if (payload.error?.code === "AUTH.ALREADY_EXSIST_ID") {
          if (message.includes("이름")) {
            setSignupErrors((prev) => ({ ...prev, name: message }));
          } else {
            setSignupErrors((prev) => ({ ...prev, email: message }));
          }
        } else {
          setSignupServerError(message);
        }
        return;
      }

      setSignupSuccess(true);
      resetSignupForm();
      const timer = setTimeout(() => setActiveTab("login"), 2000);
      timers.current.push(timer);
    } catch (error) {
      console.error("Signup request failed", error);
      setSignupServerError("회원가입 요청 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[linear-gradient(135deg,#FFF5F5_0%,#FFE8E0_100%)] flex items-center justify-center py-10 px-5">
      <div className="w-full max-w-[1200px] bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] overflow-hidden min-h-[700px] flex flex-col md:flex-row">
        {/* Left/Brand Panel */}
        <aside className="relative flex-1 bg-[linear-gradient(135deg,#FF6B35_0%,#FF8C42_100%)] text-white p-10 md:p-16 flex items-center justify-center left-panel-deco">
          <div className="relative z-[1] text-center">
            <div className="w-[120px] h-[120px] mx-auto mb-8 rounded-[30px] bg-white/20 backdrop-blur flex items-center justify-center text-[60px]">
              🍳
            </div>
            <h1 className="text-4xl font-bold mb-5">냉장고요리</h1>
            <p className="text-lg opacity-90 leading-relaxed">
              냉장고 속 재료로 만드는
              <br />맛있는 요리 레시피
            </p>

            <ul className="mt-12 space-y-5 text-left">
              <li className="flex items-center gap-4 text-base">
                <span className="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center">📱</span>
                재료 기반 레시피 추천
              </li>
              <li className="flex items-center gap-4 text-base">
                <span className="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center">⭐</span>
                인기 레시피 TOP 10
              </li>
              <li className="flex items-center gap-4 text-base">
                <span className="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center">🎯</span>
                맞춤형 요리 제안
              </li>
            </ul>
          </div>
        </aside>

        {/* Right/Form Panel */}
        <section className="flex-1 max-w-full md:max-w-[600px] p-8 md:p-[60px_80px] flex flex-col justify-center">
          {/* Tabs */}
          <div className="flex gap-5 mb-10 border-b-2 border-gray-100">
            <button
              type="button"
              onClick={() => handleTabChange("login")}
              className={`py-4 px-6 text-lg font-semibold text-gray-400 hover:text-gray-700 ${activeTab === "login" ? "tab-active text-[#FF6B35]" : ""}`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("signup")}
              className={`py-4 px-6 text-lg font-semibold text-gray-400 hover:text-gray-700 ${activeTab === "signup" ? "tab-active text-[#FF6B35]" : ""}`}
            >
              회원가입
            </button>
          </div>

          {/* Login */}
          <div className={`${activeTab === "login" ? "block animate-fade-in" : "hidden"}`}>
            <header className="mb-10">
              <h2 className="text-[28px] text-gray-800 mb-2">다시 만나서 반가워요!</h2>
              <p className="text-sm text-gray-400">계정에 로그인하여 서비스를 이용하세요</p>
            </header>

            {loginSuccess && (
              <div className="bg-[linear-gradient(135deg,#E8F5E9,#F1F8E9)] text-[#2E7D32] p-4 rounded-xl text-[15px] mb-6 border-l-4 border-[#4CAF50] animate-slide-down">
                로그인 성공! 잠시 후 메인 페이지로 이동합니다.
              </div>
            )}

            {loginServerError && (
              <div className="bg-[linear-gradient(135deg,#FDECEA,#FFF5F5)] text-[#C62828] p-4 rounded-xl text-[15px] mb-6 border-l-4 border-[#EF5350] animate-slide-down">
                {loginServerError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} noValidate>
              {/* email */}
              <div className="mb-6">
                <label htmlFor="loginEmail" className="block mb-2 text-[15px] text-gray-600 font-medium">
                  이메일
                </label>
                <input
                  id="loginEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={loginForm.email}
                  onChange={(e) => {
                    setLoginForm((p) => ({ ...p, email: e.target.value }));
                    if (loginErrors.email) setLoginErrors((p) => ({ ...p, email: undefined }));
                  }}
                  required
                  className={`w-full py-[15px] px-[18px] rounded-xl text-base transition border-2 bg-[#fafafa] placeholder:text-gray-400
                    focus:outline-none focus:border-[#FF6B35] focus:bg-white focus:ring-4 focus:ring-[rgba(255,107,53,0.1)]
                    ${loginErrors.email ? "border-red-500 bg-[#fff5f5]" : "border-gray-100"}`}
                />
                {loginErrors.email && <p className="mt-2 text-[13px] text-red-500">{loginErrors.email}</p>}
              </div>

              {/* password */}
              <div className="mb-6">
                <label htmlFor="loginPassword" className="block mb-2 text-[15px] text-gray-600 font-medium">
                  비밀번호
                </label>
                <input
                  id="loginPassword"
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm((p) => ({ ...p, password: e.target.value }));
                    if (loginErrors.password) setLoginErrors((p) => ({ ...p, password: undefined }));
                  }}
                  required
                  className={`w-full py-[15px] px-[18px] rounded-xl text-base transition border-2 bg-[#fafafa]
                    focus:outline-none focus:border-[#FF6B35] focus:bg-white focus:ring-4 focus:ring-[rgba(255,107,53,0.1)]
                    ${loginErrors.password ? "border-red-500 bg-[#fff5f5]" : "border-gray-100"}`}
                />
                {loginErrors.password && <p className="mt-2 text-[13px] text-red-500">{loginErrors.password}</p>}
              </div>

              {/* remember */}
              <label htmlFor="rememberMe" className="flex items-center gap-2 my-6 cursor-pointer">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={loginForm.remember}
                  onChange={(e) => setLoginForm((p) => ({ ...p, remember: e.target.checked }))}
                  className="w-[22px] h-[22px] accent-[#FF6B35] cursor-pointer"
                />
                <span className="text-[15px] text-gray-600">로그인 상태 유지</span>
              </label>

              {/* submit */}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-[18px] mt-9 rounded-xl text-white text-[17px] font-semibold transition
                           bg-[linear-gradient(135deg,#FF6B35,#FF8C42)]
                           hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(255,107,53,0.3)]
                           active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {!loginLoading ? (
                    "로그인"
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 animate-spin">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-30 fill-none" />
                      <path d="M12 2a10 10 0 0 1 10 10" className="fill-none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  )}
                </span>
              </button>
            </form>

            <div className="text-center mt-8 pt-5 border-t border-gray-100">
              <button type="button" onClick={() => handleTabChange("signup")} className="text-[#FF6B35] text-[15px] hover:opacity-80 hover:underline">
                아직 계정이 없으신가요? 회원가입하기
              </button>
            </div>
          </div>

        {/* Signup */}
          <div className={`${activeTab === "signup" ? "block animate-fade-in" : "hidden"}`}>
            <header className="mb-10">
              <h2 className="text-[28px] text-gray-800 mb-2">환영합니다!</h2>
              <p className="text-sm text-gray-400">새로운 계정을 만들어 서비스를 시작하세요</p>
            </header>

            {signupSuccess && (
              <div className="bg-[linear-gradient(135deg,#E8F5E9,#F1F8E9)] text-[#2E7D32] p-4 rounded-xl text-[15px] mb-6 border-l-4 border-[#4CAF50] animate-slide-down">
                회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.
              </div>
            )}

            {signupServerError && (
              <div className="bg-[linear-gradient(135deg,#FDECEA,#FFF5F5)] text-[#C62828] p-4 rounded-xl text-[15px] mb-6 border-l-4 border-[#EF5350] animate-slide-down">
                {signupServerError}
              </div>
            )}

            <form onSubmit={handleSignupSubmit} noValidate>
              {/* email */}
              <div className="mb-6">
                <label htmlFor="signupEmail" className="block mb-2 text-[15px] text-gray-600 font-medium">
                  이메일 (아이디)
                </label>
                <input
                  id="signupEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="example@email.com"
                  value={signupForm.email}
                  onChange={(e) => {
                    setSignupForm((p) => ({ ...p, email: e.target.value }));
                    if (signupErrors.email) setSignupErrors((p) => ({ ...p, email: undefined }));
                  }}
                  required
                  className={`w-full py-[15px] px-[18px] rounded-xl text-base transition border-2 bg-[#fafafa]
                    focus:outline-none focus:border-[#FF6B35] focus:bg-white focus:ring-4 focus:ring-[rgba(255,107,53,0.1)]
                    ${signupErrors.email ? "border-red-500 bg-[#fff5f5]" : "border-gray-100"}`}
                />
                {signupErrors.email && <p className="mt-2 text-[13px] text-red-500">{signupErrors.email}</p>}
              </div>

              {/* password */}
              <div className="mb-6">
                <label htmlFor="signupPassword" className="block mb-2 text-[15px] text-gray-600 font-medium">
                  비밀번호
                </label>
                <input
                  id="signupPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="8자 이상, 영문/숫자/특수문자 포함"
                  value={signupForm.password}
                  onChange={(e) => {
                    setSignupForm((p) => ({ ...p, password: e.target.value }));
                    if (signupErrors.password) setSignupErrors((p) => ({ ...p, password: undefined }));
                  }}
                  required
                  className={`w-full py-[15px] px-[18px] rounded-xl text-base transition border-2 bg-[#fafafa]
                    focus:outline-none focus:border-[#FF6B35] focus:bg-white focus:ring-4 focus:ring-[rgba(255,107,53,0.1)]
                    ${signupErrors.password ? "border-red-500 bg-[#fff5f5]" : "border-gray-100"}`}
                />

                {/* strength */}
                <div className="mt-2">
                  <div className="h-[6px] bg-gray-100 rounded mb-2 overflow-hidden">
                    <div
                      className={`h-full rounded transition-all ${
                        passwordStrength.level === "weak"
                          ? "w-1/3 bg-red-500"
                          : passwordStrength.level === "medium"
                          ? "w-2/3 bg-orange-500"
                          : passwordStrength.level === "strong"
                          ? "w-full bg-green-600"
                          : "w-0"
                      }`}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{passwordStrength.text}</span>
                </div>

                {signupErrors.password && <p className="mt-2 text-[13px] text-red-500">{signupErrors.password}</p>}
              </div>

              {/* password confirm */}
              <div className="mb-6">
                <label htmlFor="signupPasswordConfirm" className="block mb-2 text-[15px] text-gray-600 font-medium">
                  비밀번호 확인
                </label>
                <input
                  id="signupPasswordConfirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={signupForm.passwordConfirm}
                  onChange={(e) => {
                    setSignupForm((p) => ({ ...p, passwordConfirm: e.target.value }));
                    if (signupErrors.passwordConfirm) setSignupErrors((p) => ({ ...p, passwordConfirm: undefined }));
                  }}
                  required
                  className={`w-full py-[15px] px-[18px] rounded-xl text-base transition border-2 bg-[#fafafa]
                    focus:outline-none focus:border-[#FF6B35] focus:bg-white focus:ring-4 focus:ring-[rgba(255,107,53,0.1)]
                    ${(signupErrors.passwordConfirm || passwordMismatch) ? "border-red-500 bg-[#fff5f5]" : "border-gray-100"}`}
                />
                {(signupErrors.passwordConfirm || passwordMismatch) && (
                  <p className="mt-2 text-[13px] text-red-500">
                    {signupErrors.passwordConfirm || "비밀번호가 일치하지 않습니다"}
                  </p>
                )}
              </div>

              {/* name */}
              <div className="mb-6">
                <label htmlFor="signupName" className="block mb-2 text-[15px] text-gray-600 font-medium">
                  이름
                </label>
                <input
                  id="signupName"
                  type="text"
                  autoComplete="name"
                  placeholder="이름을 입력하세요"
                  value={signupForm.name}
                  onChange={(e) => {
                    setSignupForm((p) => ({ ...p, name: e.target.value }));
                    if (signupErrors.name) setSignupErrors((p) => ({ ...p, name: undefined }));
                  }}
                  required
                  className={`w-full py-[15px] px-[18px] rounded-xl text-base transition border-2 bg-[#fafafa]
                    focus:outline-none focus:border-[#FF6B35] focus:bg-white focus:ring-4 focus:ring-[rgba(255,107,53,0.1)]
                    ${signupErrors.name ? "border-red-500 bg-[#fff5f5]" : "border-gray-100"}`}
                />
                {signupErrors.name && <p className="mt-2 text-[13px] text-red-500">{signupErrors.name}</p>}
              </div>

              {/* submit */}
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full py-[18px] mt-9 rounded-xl text-white text-[17px] font-semibold transition
                           bg-[linear-gradient(135deg,#FF6B35,#FF8C42)]
                           hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(255,107,53,0.3)]
                           active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {!signupLoading ? (
                    "회원가입"
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 animate-spin">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-30 fill-none" />
                      <path d="M12 2a10 10 0 0 1 10 10" className="fill-none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  )}
                </span>
              </button>
            </form>

            <div className="text-center mt-8 pt-5 border-t border-gray-100">
              <button type="button" onClick={() => handleTabChange("login")} className="text-[#FF6B35] text-[15px] hover:opacity-80 hover:underline">
                이미 계정이 있으신가요? 로그인하기
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
