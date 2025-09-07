import apiClient from './apiClient';
import API_ENDPOINTS from "../api/apiConfig";
import type { Chapter } from '../types';

const getChapters = async ({ page = 0, size = 5, subject, grade }: { page?: number; size?: number; sort?: string; subject?: number; grade?: number } = {}): Promise<{ list: Chapter[]; total: number }> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('size', String(size));
    if (typeof subject !== 'undefined') params.append('subject', String(subject));
    if (typeof grade !== 'undefined') params.append('grade', String(grade));
    try {
        const response = await apiClient.get(`${API_ENDPOINTS.contentManager.chapters}?${params.toString()}`,
            {
                headers: {
                    "accept": "*/*",
                },
            }
        );
        return {
            list: response.data.data.list,
            total: response.data.data.total,
        };
    } catch (error) {
        console.error("Error fetching chapters:", error);
        throw error;
    }
};

const getChapterById = async (id: number): Promise<Chapter> => {
    try {
        const response = await apiClient.get(`${API_ENDPOINTS.contentManager.chapters}/${id}`,
            {
                headers: {
                    "accept": "*/*",
                },
            }
        );
        return response.data.data;
    } catch (error) {
        console.error("Error fetching chapter by id:", error);
        throw error;
    }
};

const addChapter = async (chapter: Omit<Chapter, 'id'>): Promise<{ data: Chapter; message: string[] }> => {
    const config = {
        headers: {
            "Content-Type": "application/json",
        },
    };

    console.log("📤 Sending request to:", API_ENDPOINTS.contentManager.chapters);
    console.log("📦 Request body:", chapter);
    console.log("🧾 Request headers:", config.headers);

    try {
        const response = await apiClient.post(API_ENDPOINTS.contentManager.chapters, chapter, config);
        console.log("✅ Chapter added successfully:", response.data);
        return response.data;
    } catch (error: unknown) {
        console.error("❌ API error:", (error as any)?.response?.data || (error as Error)?.message);
        throw error;
    }
};

const updateChapter = async (id: number, chapter: Partial<Chapter>): Promise<{ data: Chapter; message: string[] }> => {
    try {
        const response = await apiClient.put(`${API_ENDPOINTS.contentManager.chapters}/${id}`, chapter, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating chapter:", error);
        throw error;
    }
};

const deleteChapter = async (id: number): Promise<{ data: boolean; message: string[] }> => {
    try {
        const response = await apiClient.delete(`${API_ENDPOINTS.contentManager.chapters}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting chapter:", error);
        throw error;
    }
};

export interface ChapterStatByGrade {
    grade: number;            // 0, 1, 2...
    total_chapters: number;
    total_lessons: number;
    total_questions: number;
}

export interface DifficultyStat {
    difficulty: 0 | 1 | 2;   // 0=Dễ, 1=Trung bình, 2=Khó
    total_questions: number;
}

export interface CurriculumStatistics {
    total_chapters: number;
    total_lessons: number;
    total_questions: number;
    chapter_statistics: ChapterStatByGrade[];
    total_has_slide_lesson: number;
    total_has_simulation_lesson: number;
    question_statistics: DifficultyStat[];
    total_has_simulation_question: number;
}

// ---------- NEW: fetch curriculum statistics ----------
const getCurriculumStatistics = async (): Promise<CurriculumStatistics> => {
    try {
        const resp = await apiClient.get(API_ENDPOINTS.contentManager.curriculumStatistics, {
            headers: { accept: "*/*" },
        });
        return resp.data.data as CurriculumStatistics;
    } catch (error) {
        console.error("Error fetching curriculum statistics:", error);
        throw error;
    }
};
export default { getChapters, getChapterById, addChapter, updateChapter, deleteChapter, getCurriculumStatistics }; 
