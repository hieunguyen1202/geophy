import axios from 'axios';
import type { AxiosResponse } from 'axios'; 
import API_ENDPOINTS from '../api/apiConfig';

const API_URL = API_ENDPOINTS.testAssignments;

const getToken = (): string => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");
    return token;
};

export interface StudentAssignment {
    id: number;
    test_id: number;
    student_id: number;
    student_user_name: string;
    student_email: string;
    full_name: string;
    dob: string; // Date of birth
    grade: number;
    deadline: string; // ISO date string
    duration: number;
    status: number;
    created_at: string; // ISO date string
}

interface PaginatedResponse {
    message: string[];
    data: {
        list: StudentAssignment[];
    };
}

const getTestAssignments = async (testId: number, page: number = 0, size: number = 1000): Promise<PaginatedResponse> => {
    const token = getToken();

    try {
        const res: AxiosResponse<PaginatedResponse> = await axios.get(`${API_URL}/test/${testId}`, {
            params: {
                page,
                size
            },
            headers: {
                'Authorization': `Bearer ${token}`,
                'accept': '*/*',
            },
        });

        return res.data; // Return the complete response data
    } catch (error) {
        console.error("Error fetching test assignments:", error);
        throw error; // Re-throw the error for handling in the calling code
    }
};

export default {
    getTestAssignments
};