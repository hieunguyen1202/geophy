import axios from "axios";
import API_ENDPOINTS from "../api/apiConfig";

const login = async (credentials: { username: string; password: string }) => {
    const response = await axios.post(
        API_ENDPOINTS.auth.login,
        {
            username: credentials.username,
            password: credentials.password,
        },
        {
            headers: {
                "Content-Type": "application/json",
                // Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyIiwidHlwZSI6ImFjY2VzcyIsImV4cCI6MTc0OTc0NzU4MSwiaWF0IjoxNzQ5NzQzOTgxfQ.zDlZK0bvCP8U4mFthJ4qXCMCgrSTMKtJofmRm5mZeLU",
            },
        }
    );
    return response;
};
type RegisterPayload = {
    otc: string;
    first_name: string;
    last_name: string;
    mobile: string;
    gender: number;
    dob: string;
    role: number
};
export const register = async (userData: RegisterPayload): Promise<Tokens> => {
    // Nếu backend trả envelope: { message:[], data:{ tokenType, accessToken, refreshToken } }
    // hoặc có thể trả thẳng { accessToken, refreshToken }
    const { data } = await axios.post<ApiEnvelope<Partial<Tokens>> | Partial<Tokens>>(
        API_ENDPOINTS.auth.register,
        userData,
        { headers: { "Content-Type": "application/json" } }
    );

    // Hỗ trợ cả 2 dạng response
    const payload =
        (data as ApiEnvelope<Partial<Tokens>>)?.data ?? (data as Partial<Tokens>);

    if (!payload?.accessToken || !payload?.refreshToken) {
        throw new Error("Invalid register response shape");
    }

    return {
        tokenType: payload.tokenType ?? "Bearer",
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
    };
};
const refreshToken = async (refreshToken: string) => {
    return await axios.post(
        API_ENDPOINTS.auth.refreshToken,
        { refreshToken },
        {
            headers: {
                accept: "*/*",
                "Content-Type": "application/json",
            },
        }
    );
}
export type Tokens = {
    tokenType?: string;
    accessToken: string;
    refreshToken: string;
};

type ApiEnvelope<T> = {
    message?: string[];
    data: T;
};
const exchangeOtc = async (otc: string): Promise<Tokens> => {
    const { data } = await axios.post<ApiEnvelope<Tokens>>(
        API_ENDPOINTS.auth.exchangeOtc,
        { otc },
        { headers: { accept: "*/*", "Content-Type": "application/json" } }
    );

    const tokens = data?.data;
    if (!tokens?.accessToken || !tokens?.refreshToken) {
        throw new Error("Invalid exchange-otc response shape");
    }
    return {
        tokenType: tokens.tokenType ?? "Bearer",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    };
};
export default { login, register, refreshToken, exchangeOtc };