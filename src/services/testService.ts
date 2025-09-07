/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import API_ENDPOINTS from '../api/apiConfig';

const API_URL = API_ENDPOINTS.lecturer.tests;

const getTests = async ({ page = 0, size = 5, created_by = '', start_date = '', end_date = '', subject = '', grade = '', title = '', student_id = '' } = {}) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }

    // Build query params
    const params = new URLSearchParams();
    if (page !== null && page !== undefined) params.append('page', String(page));
    if (size !== null && size !== undefined) params.append('size', String(size));
    if (created_by) params.append('created_by', created_by);
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (subject) params.append('subject', subject);
    if (grade) params.append('grade', grade);
    if (title) params.append('title', title);
    if (student_id) params.append('student_id', student_id);

    try {
        console.log("param: " + params.toString());
        const response = await axios.get(`${API_URL}?${params.toString()}`,
            {
                headers: {
                    "accept": "*/*",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        console.log("API response:", response);
        return {
            list: Array.isArray(response.data.data?.list) ? response.data.data.list : [],
            total: typeof response.data.data?.total === 'number' ? response.data.data.total : 0,
        };
    } catch (error) {
        console.error("Error fetching tests:", error);
        throw error;
    }
};

const getTestDetail = async (testId: number) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }

    try {
        const response = await axios.get(`${API_URL}/${testId}`,
            {
                headers: {
                    "accept": "*/*",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        console.log("API get detail test response:", response);
        return response;
    } catch (error) {
        console.error("Error fetching test detail:", error);
        throw error;
    }
};

const createTest = async (testData: any) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }
    try {
        console.log("testData: ", testData)
        const response = await axios.post(
            API_ENDPOINTS.lecturer.tests,
            testData,
            {
                headers: {
                    "accept": "*/*",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error creating test:", error);
        throw error;
    }
};

const updateTest = async (testId: number, testData: any) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }
    try {
        console.log("Updating test ID:", testId, "with data:", testData);
        const response = await axios.put(
            `${API_ENDPOINTS.lecturer.tests}/${testId}`,
            testData,
            {
                headers: {
                    "accept": "*/*",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating test:", error);
        throw error;
    }
};

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

const assignTestToStudents = async (testId: number, assignmentList: Array<{ student_id: number; deadline: string; duration: number }>) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }
    try {
        const response = await axios.post(
            API_ENDPOINTS.lecturer.tests + `/${testId}/students`,
            { assignment_list: assignmentList },
            {
                headers: {
                    "accept": "*/*",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error assigning test to students:", error);
        throw error;
    }
};

// New function to get assigned students details for a test
const getAssignedStudents = async (testId: number) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }
    try {
        const response = await axios.get(
            `${API_ENDPOINTS.lecturer.tests}/${testId}/students`,
            {
                headers: {
                    "accept": "*/*",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        console.log("Assigned students data:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching assigned students:", error);
        throw error;
    }
};

const doTest = async (testId: number, mode: number = 1) => {
    const token = localStorage.getItem("userToken");
    console.log("Token for doTest:", token);
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }

    try {
        const response = await axios.post(
            `${API_URL}/${testId}/do-test?mode=${mode}`,
            {}, // Empty body for POST request
            {
                headers: {
                    "accept": "*/*",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        console.log("API response for doTest:", response);
        return response.data;
    } catch (error) {
        console.error("Error submitting test answers:", error);
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || "An error occurred while submitting the test.");
        }
        throw new Error("An unexpected error occurred.");
    }
};

const submitTest = async (testId: number, testSubmissionData: any) => {
    const token = localStorage.getItem("userToken");
    if (!token) {
        throw new Error("User not authenticated. No token found.");
    }
    try {
        const response = await axios.post(
            `${API_URL}/${testId}/submit-test`,
            testSubmissionData,
            {
                headers: {
                    "accept": "*/*",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error submitting test answers:", error);
        throw error;
    }
};

const autoSaveTest = async (testId: number, autoSaveData: any) => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");

    // (tuỳ chọn) loại bỏ phần tử null trong choice_id để tránh backend reject
    if (Array.isArray(autoSaveData?.student_test_answers)) {
        autoSaveData.student_test_answers = autoSaveData.student_test_answers.map((a: any) => ({
            ...a,
            choice_id: Array.isArray(a.choice_id)
                ? a.choice_id.filter((v: number | null) => v !== null)
                : a.choice_id
        }));
    }

    try {
        const response = await axios.patch(
            `${API_URL}/${testId}/auto-save`,
            autoSaveData,
            {
                headers: {
                    "accept": "*/*",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error auto-saving test:", error);
        throw error;
    }
};
export interface TestHistoryItem {
    test_id: number;
    student_test_id: number;
    attempt: number;
    title: string;
    subject: number;
    grade: number;
    submitted_at: string; // ISO string
    score: number;
    test_type: number;
    test_duration: number;
  }
  const getTestHistory = async ({
    page,
    size,
    subject,
    grade,
    start_date,
    end_date,
    test_type,
    title,
  }: {
    page?: number;
    size?: number;
    subject?: string | number;
    grade?: string | number;
    start_date?: string; // 'yyyy-MM-dd' hoặc ISO tuỳ BE
    end_date?: string;
    test_type?: string | number;
    title?: string;
  } = {}): Promise<{ list: TestHistoryItem[]; total: number }> => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      throw new Error("User not authenticated. No token found.");
    }
  
    // build query
    const params = new URLSearchParams();
    if (typeof page === 'number') params.append('page', String(page));
    if (typeof size === 'number') params.append('size', String(size));
    if (subject !== undefined && subject !== '') params.append('subject', String(subject));
    if (grade !== undefined && grade !== '') params.append('grade', String(grade));
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);
    if (test_type !== undefined && test_type !== '') params.append('test_type', String(test_type));
    if (title) params.append('title', title);
  
    const url = params.toString() ? `${API_URL}/history?${params.toString()}` : API_URL;
  
    try {
      const res = await axios.get(url, {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Hỗ trợ 2 dạng: { data: { list, total } } hoặc { list, total }
      const payload = (res?.data?.data ?? res?.data) ?? {};
  
      const list: TestHistoryItem[] = Array.isArray(payload.list) ? payload.list : [];
      const total: number =
        typeof payload.total === 'number'
          ? payload.total
          : Array.isArray(payload.list)
          ? payload.list.length
          : 0;
  
      return { list, total };
    } catch (err) {
      console.error("Error fetching test history:", err);
      throw err;
    }
  };
  
  export const personalizeTest = async (subjectId: number, chapterIds: number[]) => {
      const token = localStorage.getItem("userToken");
      if (!token) {
          throw new Error("User not authenticated. No token found.");
      }
  
      try {
          const response = await axios.post(
              `${API_URL}/personalize`,
              { 
                  subject_id: subjectId,
                  chapter_ids: chapterIds 
              },
              {
                  headers: {
                      "accept": "*/*",
                      "Content-Type": "application/json",
                      "Authorization": `Bearer ${token}`,
                  },
              }
          );
          console.log("API response for personalize test:", response);
          return response.data;
      } catch (error) {
          console.error("Error personalizing test:", error);
          if (axios.isAxiosError(error)) {
              throw new Error(error.response?.data?.message || "An error occurred while personalizing the test.");
          }
          throw new Error("An unexpected error occurred.");
      }
  };

export default { getTests, getTestDetail, createTest, updateTest, getStudents, assignTestToStudents, getAssignedStudents, 
    doTest, submitTest, autoSaveTest , getTestHistory, personalizeTest};
