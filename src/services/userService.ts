import API_ENDPOINTS from '../api/apiConfig';
import axios from "axios";

export async function changePassword(token: string, oldPassword: string, newPassword: string, confirmPassword: string) {
    const response = await fetch(API_ENDPOINTS.users.changePassword, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'accept': '*/*',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            old_password: oldPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
        }),
    });

    const result = await response.json();
    if (!response.ok) {
        throw {
            message: result?.message || [],
            messages: result?.messages || [],
        };
    }
    return result;
}
const getStudents = async ({ page = 0, size = 10 } = {}) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('size', String(size));
    try {
        const response = await axios.get(`${API_ENDPOINTS.users.students}?${params.toString()}`,
            {
                headers: {
                    "accept": "*/*",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        console.log("studnet: ", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};
/** ---- Lecturers ---- */
export type LecturerQuery = {
    name?: string;         // '' allowed to match your curl
    gender?: number;       // 0/1...
    role?: number;         // 1...
    status?: number;       // 1...
    page?: number;         // default 0
    size?: number;         // default 5
    sort?: string;         // e.g. 'string' (server-defined)
};

/**
 * Fetch lecturers with filters.
 * Mirrors:
 * curl -X GET '.../api/users/lecturers?name=&gender=0&role=1&status=1&page=0&size=5&sort=string'
 */
const getLecturers = async ({
    // name = "",        
    gender,
    role,
    status,
    page = 0,
    size = 5,
    sort = "string",
}: LecturerQuery = {}) => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");

    // Build params; keep empty string for 'name' if caller wants it
    const params: Record<string, string | number | undefined> = {
        //   name, 
        gender, role, status, page, size, sort,
    };

    try {
        const response = await axios.get(API_ENDPOINTS.users.lecturers, {
            headers: {
                accept: "*/*",
                Authorization: `Bearer ${token}`,
            },
            params,
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching lecturers:", error);
        throw error;
    }
};
type Role = 1 | 2 | 3;

export interface CreateUserItem {
    email: string;
    role: Role;        // 1: QL nội dung, 2: Giáo viên, 3: Học sinh
    grade?: number;    // required if role === 3
    subject?: number;  // required if role === 1 or 2
}

const clean = <T extends Record<string, any>>(obj: T): Partial<T> =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

const validateUser = (u: CreateUserItem) => {
    if (!u?.email?.trim()) {
        throw new Error("Email không hợp lệ");
    }
    if (![1, 2, 3].includes(u.role)) {
        throw new Error("Role không hợp lệ");
    }
    if (u.role === 3 && (u.grade === undefined || u.grade === null)) {
        throw new Error("Học sinh (role=3) bắt buộc có grade");
    }
    if ((u.role === 1 || u.role === 2) && (u.subject === undefined || u.subject === null)) {
        throw new Error("Vai trò 1/2 bắt buộc có subject");
    }
};

const extractErrorMessage = (error: any): string => {
    const raw = error?.response?.data?.message ?? error?.message ?? "Lỗi không xác định";
    return Array.isArray(raw) ? raw.join("\n") : String(raw);
};

/**
 * Tạo nhiều user theo API:
 * POST /api/users
 * Body: { users: [{ email, role, grade?, subject? }, ...] }
 */
export const addUsers = async (users: CreateUserItem[]) => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");

    // Validate & clean từng user
    const payload = {
        users: users.map((u) => {
            validateUser(u);
            return clean(u);
        }),
    };

    try {
        const res = await axios.post(API_ENDPOINTS.users.users, payload, {
            headers: {
                "Content-Type": "application/json",
                accept: "*/*",
                Authorization: `Bearer ${token}`,
            },
        });
        return res.data;
    } catch (error) {
        const msg = extractErrorMessage(error);
        console.error("Error adding users:", msg);
        throw new Error(msg);
    }
};

/**
 * Backward-compatible: tạo 1 user, tự wrap vào addUsers
 */
export const addUser = async (user: CreateUserItem) => {
    return addUsers([user]);
};
export const getUserById = async (id: number) => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");

    try {
        // ví dụ: API_ENDPOINTS.users.users = '/api/users'
        const url = `${API_ENDPOINTS.users.users}/${id}`;
        const response = await axios.get(url, {
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data; // { message: [...], data: {...} }
    } catch (error) {
        console.error("Error fetching user detail:", error);
        throw error;
    }
};
export type UpdateUserPayload = {
    role_id?: number;
    status?: number;
    email?: string;
    phone?: string;
    id?: number;
};

export const updateUser = async (id: number, payload: UpdateUserPayload) => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");

    // Nhiều API yêu cầu field `id` trong body: đảm bảo khớp path param
    const body = { id, ...payload };

    const url = `${API_ENDPOINTS.users.users}/${id}`;
    try {
        const response = await axios.put(url, body, {
            headers: {
                'Content-Type': 'application/json',
                'accept': '*/*',
                'Authorization': `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};
export type UserStatusStatisticsParams = {
    startDate: string | Date;
    endDate: string | Date;
};

const toYMD = (d: string | Date): string => {
    if (typeof d === 'string') return d;
    // ISO 8601 -> 'YYYY-MM-DD'
    return d.toISOString().slice(0, 10);
};
export const getUserStatusStatistics = async ({
    startDate,
    endDate,
}: UserStatusStatisticsParams) => {
    const token = localStorage.getItem('userToken');
    if (!token) throw new Error('User not authenticated. No token found.');

    const url =
        API_ENDPOINTS.users.userStatusStatistics ??
        `${API_ENDPOINTS.users.users}`;

    const params = {
        start_date: toYMD(startDate),
        end_date: toYMD(endDate),
    };

    try {
        const response = await axios.get(url, {
            headers: {
                accept: '*/*',
                Authorization: `Bearer ${token}`,
            },
            params,
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching user status statistics:', error);
        throw error;
    }
};
export const deleteUsers = async (userIds: number[]) => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");

    const url = API_ENDPOINTS.users.users; // ví dụ '/api/users'

    try {
        const response = await axios.delete(url, {
            headers: {
                "Content-Type": "application/json",
                "accept": "*/*",
                "Authorization": `Bearer ${token}`,
            },
            // axios.delete cho phép gửi body qua option `data`
            data: {
                user_ids: userIds,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting users:", error);
        throw error;
    }
};

export default { getStudents, getLecturers, addUser, getUserById, updateUser, getUserStatusStatistics, deleteUsers }