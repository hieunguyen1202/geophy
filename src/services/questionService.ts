import apiClient from './apiClient';
import API_ENDPOINTS from "../api/apiConfig";

const getQuestions = async ({ page = 0, size = 5, sort = 'id,asc', filters = {} } = {}) => {
    // Build query params
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('size', String(size));
    params.append('sort', sort);
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            params.append(key, String(value));
        }
    });

    try {
        const response = await apiClient.get(`${API_ENDPOINTS.contentManager.questionsList}?${params.toString()}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        // Return both list and total
        return {
            list: response.data.data.list,
            total: response.data.data.total,
        };
    } catch (error) {
        console.error("Error fetching questions:", error);
        throw error;
    }
};

const saveQuestions = async (questions: any[]) => {
    try {
        const response = await apiClient.post(
            API_ENDPOINTS.contentManager.questionsList,
            { questions },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error saving questions:", error);
        throw error;
    }
};

const deleteQuestions = async (ids: number[]) => {
    try {
        const response = await apiClient.delete(API_ENDPOINTS.contentManager.questionsList, {
            headers: {
                "Content-Type": "application/json",
            },
            data: { ids },
        });
        return response.data;
    } catch (error) {
        console.error("Error deleting questions:", error);
        throw error;
    }
};

const getQuestionById = async (id: number) => {
    try {
        const response = await apiClient.get(
            `${API_ENDPOINTS.contentManager.questionsList}/${id}`,
            {
                headers: {
                    "accept": "*/*",
                },
            }
        );
        return response.data.data;
    } catch (error) {
        console.error("Error fetching question by id:", error);
        throw error;
    }
};

const updateQuestion = async (id: number, question: any) => {
    try {
        const response = await apiClient.put(
            `${API_ENDPOINTS.contentManager.questionsList}/${id}`,
            question,
            {
                headers: {
                    "accept": "*/*",
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating question:", error);
        throw error;
    }
};

const generateAIQuestions = async (payload: any) => {
    try {
        console.log('AI Question Payload:', payload);
        const response = await apiClient.post(
            API_ENDPOINTS.contentManager.generateAIQuestions,
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        // If response.data is an array, return it. Otherwise, return empty array.
        if (Array.isArray(response.data)) {
            console.log('AI Question Response:', response.data);
            return response.data;
        } else {
            console.log('AI Question Response: not an array', response.data);
            return [];
        }
    } catch (error) {
        console.error("Error generating AI questions:", error);
        throw error;
    }
};


const getRandomQuestionsFromSource = async (requests:any) => {
    try {
        console.log('Fetching random questions with endpoint:', API_ENDPOINTS.lecturer.randomFromSource);
        const response = await apiClient.post(
            API_ENDPOINTS.lecturer.randomFromSource,
            { requests },
            {
                headers: {
                    "Accept": "*/*",
                    "Content-Type": "application/json",
                },
            }
        );
        // Assuming response.data contains the list of questions
        return response.data;
    } catch (error) {
        console.error("Error fetching random questions from source:", error);
        throw error;
    }
};

export default { getQuestions, saveQuestions, deleteQuestions, getQuestionById, updateQuestion, generateAIQuestions, getRandomQuestionsFromSource };
