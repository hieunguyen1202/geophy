import { jwtDecode } from "jwt-decode";
import type { JwtPayload } from "jwt-decode";
import { getProfile } from '../services/profileService';
import { MathJax } from 'better-react-mathjax';
import React from 'react';
import he from 'he';
import { getProfileGetRole } from '../services/profileService';

export const decodeToken = (token: string): JwtPayload => {
    if (!token) {
        throw new Error("Invalid token");
    }

    try {
        return jwtDecode<JwtPayload>(token);
    } catch {
        throw new Error("Error decoding token");
    }
};

export const getTokenFromLocalStorage = (): string | null => {
    try {
        const token = localStorage.getItem("userToken");
        if (token === null) {
            throw new Error("Token not found in localStorage");
        }
        return token;
    } catch {
        return null;
    }
};

export const isLoggedIn = (): boolean => {
    const storedToken = localStorage.getItem("userToken");

    if (!storedToken) {
        return false;
    }

    try {
        const decodedToken = decodeToken(storedToken);

        // Check if the token has expired
        const currentTimestamp = Date.now() / 1000; // Convert milliseconds to seconds
        if (decodedToken.exp && decodedToken.exp < currentTimestamp) {
            return false; // Token has expired
        }

        return true; // Token is valid and not expired
    } catch {
        return false; // Token decoding failed
    }
};

export const clearTokens = (): void => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("lecturerName");
};

export const logout = (): void => {
    clearTokens();
};

export const saveAuthTokensAndUserId = async (accessToken: string, refreshToken: string, username: string): Promise<void> => {
    try {
        localStorage.setItem("userToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        const decodedToken = jwtDecode<JwtPayload>(accessToken);
        localStorage.setItem("userId", String(decodedToken.sub ?? ""));
        localStorage.setItem("username", username);
        const profile = await getProfile(accessToken);
        if (profile && profile.roleName) {
            localStorage.setItem("role", profile.roleName);
        }
        localStorage.setItem("subject", profile.subject ?? '0');
        localStorage.setItem("grade", profile.grade ?? '0');
    } catch (error) {
        console.error("Error saving authentication tokens or decoding token:", error);
    }
};
/**
 * Store auth info after your login API succeeds.
 * Call this in LoginPage when you receive the token.
 */
export function persistAuth(token: string, extras?: { role?: string; userId?: string | number }) {
    localStorage.setItem("userToken", token);
    if (extras?.role) localStorage.setItem("role", String(extras.role));
    if (extras?.userId !== undefined) localStorage.setItem("userId", String(extras.userId));
}

/**
 * Safety guard for the redirect param to avoid open-redirects.
 * Only allows internal paths like "/join?code=123".
 */
export function safeRedirect(input?: string | null): string | null {
    if (!input) return null;
    if (input.startsWith("http://") || input.startsWith("https://")) return null;
    return input.startsWith("/") ? input : null;
}
function opToTeX(op: string) {
    switch (op) {
      case "≤":
      case "<=": return "\\le";
      case "≥":
      case ">=": return "\\ge";
      case "≠":
      case "!=": return "\\ne";
      case "≈": return "\\approx";
      case "~": return "\\sim";
      case "∝": return "\\propto";
      case "±": return "\\pm";
      case "×": return "\\times";
      case "÷": return "\\div";
      case "∙": return "\\cdot";
      case "<": return "<";
      case ">": return ">";
      case "=":
      default:   return "=";
    }
  }
// Chuyển √... và A/B về LaTeX an toàn
function normalizeMath(expr: string) {
    let s = expr;
  
    // √( ... ) -> \sqrt{...}
    s = s.replace(/√\s*\(([^)]+)\)/g, (_, inner) => `\\sqrt{${inner.trim()}}`);
    // √token -> \sqrt{token}
    s = s.replace(/√\s*([A-Za-zÀ-ỹ0-9]+(?:[A-Za-zÀ-ỹ0-9^_().]*)?)/g, (_, t) => `\\sqrt{${t}}`);
  
    // \sqrt{...} / denom -> \frac{\sqrt{...}}{denom}
    s = s.replace(/\\sqrt\{([^}]+)\}\s*\/\s*([A-Za-zÀ-ỹ0-9().^_+\-]+)/g,
      (_, num, den) => `\\frac{\\sqrt{${num}}}{${den}}`
    );
  
    // Tránh URL (http://, https://) và tạm tránh pattern ngày dd/mm/yyyy
    // Dùng placeholder “bọc” URL/ngày trước khi đổi A/B
    const placeholders: string[] = [];
    s = s.replace(/\bhttps?:\/\/[^\s)]+/g, (m) => {
      placeholders.push(m);
      return `__URL_PLACEHOLDER_${placeholders.length - 1}__`;
    });
    s = s.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, (m) => {
      placeholders.push(m);
      return `__DATE_PLACEHOLDER_${placeholders.length - 1}__`;
    });
  
    // A/B -> \frac{A}{B} (không áp dụng nếu ngay sau vẫn còn '/')
    s = s.replace(
      /\b([A-Za-zÀ-ỹ0-9().^_+-]+)\s*\/\s*([A-Za-zÀ-ỹ0-9().^_+-]+)\b(?!\s*\/)/g,
      (_, A, B) => `\\frac{${A}}{${B}}`
    );
  
    // Khôi phục URL/ngày
    s = s.replace(/__URL_PLACEHOLDER_(\d+)__/g, (_, i) => placeholders[+i]);
    s = s.replace(/__DATE_PLACEHOLDER_(\d+)__/g, (_, i) => placeholders[+i]);
  
    return s;
  }
  
  export function renderMathWithText(content?: string): React.ReactNode {
    const safe = content ?? "";
    const decoded = he.decode(safe);
    if (!decoded.trim()) return [];
  
    const normalized = decoded
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "\n")
      .replace(/<br\s*\/?>(?![^]*<\/pre>)/g, "\n");
  
    // Tách các đoạn đã có $...$ hoặc $$...$$
    const delim = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;
    const parts = normalized.split(delim);
  
    return parts.map((part, idx) => {
      if (!part.trim()) return null;
  
      // $$...$$ (block)
      if (part.startsWith("$$") && part.endsWith("$$")) {
        const f = part.slice(2, -2).trim();
        return (
          <div key={idx}>
            <MathJax inline={false}>{`\\[${f}\\]`}</MathJax>
          </div>
        );
      }
  
      // $...$ (inline)
      if (part.startsWith("$") && part.endsWith("$")) {
        const f = part.slice(1, -1).trim();
        return <MathJax key={idx} inline>{`\\(${f}\\)`}</MathJax>;
      }
  
      // ===== Auto-math cho text thường =====
      // 1) Bắt vế trái + toán tử + vế phải (<=, ≥, =, ≠, <, >, ≈, ~)
      // 2) Bắt các phân số/căn đứng độc lập (vd: 1/2, √21a/6, √x, ...)
      const tokens: React.ReactNode[] = [];
      let last = 0;
  
      // Union-regex: so sánh hoặc biểu thức nhỏ (frac/sqrt)
      const autoRegex = new RegExp(
        [
          // LHS  OP  RHS
          "([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ0-9]*(?:_[A-Za-z0-9]+)?)\\s*(<=|>=|≤|≥|=|≠|!=|<|>|≈|~)\\s*([A-Za-zÀ-ỹ0-9()._^+\\-*/√]+)",
          // hoặc: \b(√.../den|A/B|√token|√(expr))\b
          "(?:\\b(?:√\\s*\\([^)]*\\)|√\\s*[A-Za-zÀ-ỹ0-9]+|[A-Za-zÀ-ỹ0-9().^_+-]+\\s*/\\s*[A-Za-zÀ-ỹ0-9().^_+-]+)\\b)"
        ].join("|"),
        "g"
      );
  
      let m: RegExpExecArray | null;
      while ((m = autoRegex.exec(part)) !== null) {
        // text trước match
        if (m.index > last) tokens.push(part.slice(last, m.index));
  
        if (m[1]) {
          // Case so sánh: m[1]=lhs, m[2]=op, m[3]=rhs
          const lhs = m[1], op = m[2], rhsRaw = m[3];
          const rhs = normalizeMath(rhsRaw);
          const texOp = opToTeX(op);
          tokens.push(
            <MathJax key={`${idx}-${m.index}-cmp`} inline>
              {`\\(${lhs.trim()} ${texOp} ${rhs.trim()}\\)`}
            </MathJax>
          );
        } else {
          // Case biểu thức nhỏ: nguyên match là m[0]
          const tex = normalizeMath(m[0]);
          tokens.push(
            <MathJax key={`${idx}-${m.index}-expr`} inline>
              {`\\(${tex}\\)`}
            </MathJax>
          );
        }
  
        last = m.index + m[0].length;
      }
  
      if (last < part.length) tokens.push(part.slice(last));
  
      // Tôn trọng xuống dòng trong text
      return tokens.flatMap((el, i) => {
        if (typeof el === "string") {
          const segs = el.split("\n");
          return segs.map((line, j) => (
            <React.Fragment key={`${idx}-${i}-${j}`}>
              {line}
              {j < segs.length - 1 && <br />}
            </React.Fragment>
          ));
        }
        return el;
      });
    });
  }
export enum TestStatus {
    DA_NG_MO = 0,      // Đang mở
    DANG_DIEN_RA = 1,  // Đang diễn ra
    DA_NOP = 2,        // Đã nộp
    DA_CHAM = 3,       // Đã chấm
    HET_THOI_GIAN = 4, // Hết thời gian
    DA_DONG = 5,       // Đã đóng
    DA_HUY = 6,       // Đã đóng
}

export const getStatusText = (status: TestStatus): string => {
    switch (status) {
        case TestStatus.DA_NG_MO: return 'Đang mở';
        case TestStatus.DANG_DIEN_RA: return 'Đang diễn ra';
        case TestStatus.DA_NOP: return 'Đã nộp';
        case TestStatus.DA_CHAM: return 'Đã chấm';
        case TestStatus.HET_THOI_GIAN: return 'Hết thời gian';
        case TestStatus.DA_DONG: return 'Đã đóng';
        case TestStatus.DA_HUY: return 'Đã huỷ';
        default: return 'Không xác định';
    }
};
export const getStatusColor = (status: TestStatus): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
        case TestStatus.DA_NG_MO: return 'success';  // Open
        case TestStatus.DANG_DIEN_RA: return 'warning';  // Ongoing
        case TestStatus.DA_NOP: return 'success';  // Submitted
        case TestStatus.DA_CHAM: return 'success';  // Graded
        case TestStatus.HET_THOI_GIAN: return 'error';    // Time's up
        case TestStatus.DA_DONG: return 'default';   // Closed
        default: return 'default';   // Unknown
    }
};
export async function fetchUserRole(token: string): Promise<void> {
  try {
      const profileData = await getProfileGetRole(token);
      console.log("Profile data:", profileData);

      // Extract the role name and convert it to 'content manager'
      const roleName = profileData.role_name.replace(/^ROLE_/, '').toLowerCase().replace(/_/g, ' ');
      console.log(`User role: ${roleName}`);

      // Save the cleaned role name to localStorage
      localStorage.setItem("role", roleName);

      const profileDataName = await getProfile(token);
      const lecturerName = `${profileDataName.first_name} ${profileDataName.last_name}`;
      localStorage.setItem("lecturerName", lecturerName);
  } catch (error) {
      console.error(error);
  }
}


/**
 * Get the appropriate redirect path based on user role
 * @param role - The user's role from localStorage
 * @returns The redirect path for the user's role
 */
export const getRoleBasedRedirectPath = (role: string): string => {
    if (!role) return "/";

    // Normalize; also handle arrays or comma-separated strings stored in localStorage
    const normalized = Array.isArray(role)
        ? role.map(r => String(r).toLowerCase())
        : String(role).toLowerCase();

    const roles = Array.isArray(normalized)
        ? normalized
        : normalized.split(/[,\s]+/); // split "role_lecturer,role_user" etc.

    const has = (needle: string) => roles.some(r =>
        r.replace(/^role[_-]?/, "").includes(needle)
    );

    if (has("admin")) return "/admin/dashboard";
    if (has("content manager") ||has("CONTENT_MANAGER")
      ||has("content_manager") || has("content") && has("manager")) return "/content-manager/dashboard";
    if (has("lecturer")) return "/lecturer/test";
    if (has("student")) return "/";

    return "/";
};

export const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};