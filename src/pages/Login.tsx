import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import loginImage from "../assets/images/login.png";
import { FcGoogle } from "react-icons/fc";
import authService from "../services/authService";
import { Snackbar, Alert } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { saveAuthTokensAndUserId, fetchUserRole, getRoleBasedRedirectPath } from "../utils";
import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";

const safeRedirect = (input?: string | null): string | null => {
  if (!input) return null;
  if (input.startsWith("http://") || input.startsWith("https://")) return null;
  if (!input.startsWith("/")) return null;

  // Treat root and login as non-meaningful destinations
  if (input === "/" || input === "/login") return null;

  return input;
};

const Login: React.FC = () => {
  // form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // snackbar
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] =
    useState<"success" | "error" | "info" | "warning">("info");

  // oauth otc state
  const [statusBanner, setStatusBanner] = useState<string>(""); // thông báo trên UI
  const [isExchanging, setIsExchanging] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // query params
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect");

  // fallback redirect from state
  const state = location.state as
    | { from?: { pathname: string; search?: string } }
    | null;
  const fromState =
    state?.from?.pathname ? `${state.from.pathname}${state.from.search ?? ""}` : null;

  // oauth params
  const { status, otc } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get("status");
    const o = params.get("otc");

    console.log("[Login] location.search =", location.search);
    console.log("[Login] parsed params =", { status: s, otc: o });
    return { status: s, otc: o };
  }, [location.search]);

  // username/password login
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await authService.login({ username, password });

      setSnackbarSeverity("success");
      setSnackbarMessage(response?.data?.message?.[0] || "Đăng nhập thành công!");
      setOpenSnackbar(true);

      const access = response?.data?.data?.accessToken;
      const refresh = response?.data?.data?.refreshToken;
      if (typeof access === "string" && typeof refresh === "string") {
        saveAuthTokensAndUserId(access, refresh, username);
        await fetchUserRole(access);
        axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;

        // Get user role and redirect accordingly
        const userRole = localStorage.getItem("role");
        const roleBasedPath = getRoleBasedRedirectPath(userRole || "");

        // Use role-based path if no specific redirect is requested
        const dest = safeRedirect(redirectParam) ?? safeRedirect(fromState) ?? roleBasedPath;
        setTimeout(() => navigate(dest, { replace: true }), 800);
      } else {
        console.error("Access/refresh token missing or invalid", access, refresh);
      }
    } catch (error: unknown) {
      console.error("Login failed:", error);
      setSnackbarSeverity("error");
      const detail = axios.isAxiosError(error)
        ? (error.response?.data as any)?.detailMessage || (error.response?.data as any)?.message
        : undefined;
      setSnackbarMessage(detail || "Đăng nhập thất bại. Vui lòng kiểm tra lại.");
      setOpenSnackbar(true);
    }
  };

  // Google OAuth callback
  useEffect(() => {
    let cancelled = false;

    async function run() {
      // Không có params: không làm gì
      if (!status && !otc) {
        setStatusBanner("");
        setIsExchanging(false);
        return;
      }

      if (status == "0") {
        if (otc) {
          localStorage.setItem("otc", otc);
          console.log("[Login] saved otc to localStorage:", otc);
        }
        navigate(`/register`);
        return;
      }

      if (!otc) {
        console.warn("[Login] status=0 nhưng thiếu otc");
        setIsExchanging(false);
        setStatusBanner("Thiếu mã OTC từ Google. Vui lòng thử lại.");
        setSnackbarSeverity("error");
        setSnackbarMessage("Thiếu mã OTC từ Google.");
        setOpenSnackbar(true);
        return;
      }

      try {
        setIsExchanging(true);
        setStatusBanner("Đang trao đổi mã OTC lấy token…");

        console.log("[Login] calling exchangeOtc with", otc);
        const tokens = await authService.exchangeOtc(otc);
        if (cancelled) return;

        // Lưu token
        localStorage.setItem("userToken", tokens.accessToken);
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
        axios.defaults.headers.common["Authorization"] =
          `${tokens.tokenType ?? "Bearer"} ${tokens.accessToken}`;
        const decodedToken = jwtDecode<JwtPayload>(tokens.accessToken);
        localStorage.setItem("userId", String(decodedToken.sub ?? ""));
        // Fetch user role for Google OAuth login
        await fetchUserRole(tokens.accessToken);

        setSnackbarSeverity("success");
        setSnackbarMessage("Đăng nhập Google thành công!");
        setOpenSnackbar(true);
        setStatusBanner("Đăng nhập Google thành công. Đang chuyển hướng…");

        // Get user role and redirect accordingly
        const userRole = localStorage.getItem("role");
        const roleBasedPath = getRoleBasedRedirectPath(userRole || "");

        // Use role-based path if no specific redirect is requested
        const dest = safeRedirect(redirectParam) ?? safeRedirect(fromState) ?? roleBasedPath;
        setTimeout(() => navigate(dest, { replace: true }), 800);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("[Login] exchangeOtc error:", err);
        setSnackbarSeverity("error");
        const detail = axios.isAxiosError(err)
          ? (err.response?.data as any)?.detailMessage || (err.response?.data as any)?.message
          : undefined;
        setSnackbarMessage(detail || "Không thể lấy token từ OTC.");
        setOpenSnackbar(true);
        setStatusBanner("Không thể lấy token từ OTC. Vui lòng thử lại.");
      } finally {
        setIsExchanging(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [status, otc, navigate, redirectParam, fromState]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-500">
      <div className="flex w-2/3 max-w-lg bg-white rounded-lg shadow-lg border border-gray-300 mx-5 my-6 h-[650px]">
        {/* Left - Image */}
        <div className="w-1/2 flex items-center justify-center p-5 h-full">
          <img src={loginImage} alt="login" className="w-full h-full object-cover" />
        </div>

        {/* Right - Form */}
        <div className="w-1/2 p-5">
          <h2 className="text-lg font-semibold text-center text-primary mb-2">Đăng nhập</h2>
          {/* <p className="text-center text-gray-600 mb-2">
            Chưa có tài khoản?
            <a href="/register" className="text-primary"> {" "}Đăng ký</a>
          </p> */}

          {/* Banner trạng thái OAuth */}
          {statusBanner && (
            <div className={`mb-3 text-xs p-2 rounded ${isExchanging ? "bg-yellow-50 text-yellow-800 border border-yellow-200" :
              snackbarSeverity === "success" ? "bg-green-50 text-green-800 border border-green-200" :
                "bg-red-50 text-red-800 border border-red-200"
              }`}>
              {statusBanner}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-2">
              <label htmlFor="username" className="text-primary text-xs">Tên người dùng</label>
              <input
                type="text"
                className="w-full p-2 rounded text-sm text-black"
                id="username"
                placeholder="Vui lòng nhập tên người dùng"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="mb-2">
              <label htmlFor="password" className="text-primary text-xs">Mật khẩu</label>
              <input
                type="password"
                className="w-full p-2 rounded text-sm text-black"
                id="password"
                required
                placeholder="Vui lòng nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="mb-2 flex items-center">
              <div>
                <input type="checkbox" className="form-check-input" id="remember" />
                <label className="form-check-label text-gray-600 text-xs" htmlFor="remember">
                  Nhớ mật khẩu
                </label>
              </div>
              <div className="ml-auto">
                <a href="/forgot-password" className="text-gray-600 text-xs ml-2">
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary text-white w-full mb-2 p-2 rounded text-xs hover:bg-orange-600"
              disabled={isExchanging}
            >
              Đăng nhập
            </button>

            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-2 text-center text-gray-600 text-xs">
                Hoặc đăng nhập với tài khoản Google
              </span>
              <hr className="flex-grow border-gray-300" />
            </div>

            {/* Dùng <a> để redirect OAuth */}
            <a
              href="http://localhost:8080/oauth2/authorization/google"
              className={`btn-outline-primary text-black w-full text-xs p-2 rounded flex items-center justify-center hover:bg-gray-200 ${isExchanging ? "pointer-events-none opacity-70" : ""}`}
            >
              <FcGoogle className="h-4 w-4 mr-1" /> Đăng nhập với Google
            </a>
          </form>
        </div>
      </div>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={(_e, r) => r !== "clickaway" && setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Login;
