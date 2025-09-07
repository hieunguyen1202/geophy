import axios from 'axios';
import API_ENDPOINTS from '../api/apiConfig';
const API_URL = API_ENDPOINTS.classes;


const getToken = () => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");
    return token;
};

interface GetClassesParams {
    page?: number;
    size?: number;
    name?: string;
    grade?: string;
    lecturer_name?: string;
    lecturer_id?: string;
}


const getClasses = async ({
    page = 0,
    size = 10,
    name = '',
    grade = '',
    lecturer_name,
    lecturer_id
}: GetClassesParams) => {
    const token = getToken();

    const params: any = {
        page,
        size,
    };

    if (name) params.name = name;
    if (grade) params.grade = grade;
    if (lecturer_name) params.lecturer_name = lecturer_name;
    if (lecturer_id !== undefined && lecturer_id !== null && lecturer_id !== '') {
        params.lecturer_id = lecturer_id;
    }

    const res = await axios.get(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*',
        },
        params,
    });

    return res.data.data;
};


export async function addClass(data: { name: string; description: string; grade: number; require_approval: boolean }) {
    const token = getToken();
    const res = await axios.post(API_URL, data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*',
        },
    });
    return res.data;
}

export const joinClass = async (code: string) => {
    const token = getToken();

    try {
        const response = await axios.post(`${API_URL}/join?code=${code}`, {}, {
            headers: {
                'Accept': '*/*',
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error joining class:', error);
        throw error;
    }
};
const updateClass = async (id: number, data: { name: string; description: string; grade: number }) => {
    const token = getToken();
    const res = await axios.put(`${API_URL}/${id}`, data, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*',
        },
    });
    return res.data;
};


const deleteClass = async (ids: number[]) => {
    if (!Array.isArray(ids)) {
        ids = [ids];
    }
    const token = getToken();
    const res = await axios.delete(API_URL, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*',
            'Content-Type': 'application/json',
        },
        data: { ids },
    });
    return res.data;
};
interface GetClassStudentsParams {
    classId: number;
    page?: number;
    size?: number;
}
export const getClassStudents = async ({
    classId,
    page = 0,
    size = 10,
}: GetClassStudentsParams) => {
    const token = getToken();

    const res = await axios.get(`${API_URL}/${classId}/students`, {
        headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
        },
        params: {
            page,
            size,
        },
    });

    return res.data;
};

interface GetClassStudentsParams {
    classId: number;
    page?: number;
    size?: number;
}
export const getStudentsRequests = async ({
    classId,
    page = 0,
    size = 10,
}: GetClassStudentsParams) => {
    const token = getToken();

    const res = await axios.get(`${API_URL}/${classId}/requests`, {
        headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
        },
        params: {
            page,
            size,
        },
    });

    return res.data;
};
type DecisionItem = { student_id: number; decision: boolean };

export const decideClassRequests = async (classId: number, decisions: DecisionItem[]) => {
    const token = getToken();

    const res = await axios.post(
        `${API_URL}/${classId}/decide`,
        { decisions },
        {
            headers: {
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};
export const approveStudents = async (classId: number, studentIds: number[]) => {
    const decisions: DecisionItem[] = studentIds.map((id) => ({ student_id: id, decision: true }));
    return decideClassRequests(classId, decisions);
};

export const rejectStudents = async (classId: number, studentIds: number[]) => {
    const decisions: DecisionItem[] = studentIds.map((id) => ({ student_id: id, decision: false }));
    return decideClassRequests(classId, decisions);
};
// Lấy danh sách messages trong lớp
export const getClassMessages = async (classId: number, page = 0, size = 20) => {
    const token = getToken();
    const res = await axios.get(`${API_URL}/${classId}/messages`, {
        headers: {
            accept: "*/*",
            Authorization: `Bearer ${token}`,
        },
        params: { page, size },
    });
    return res.data;
};

// Gửi message vào lớp
export const sendClassMessage = async (classId: number, content: string) => {
    const token = getToken();
    const res = await axios.post(
        `${API_URL}/${classId}/messages`,
        { content },
        {
            headers: {
                accept: "*/*",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
};
/** Lấy chi tiết 1 lớp học */
export const getClassDetail = async (id: number) => {
    const token = getToken();
  
    const res = await axios.get(`${API_URL}/${id}`, {
      headers: {
        accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
    });
  
    return res.data;
  };
  export const addMessageComment = async (
    classId: number,
    messageId: number,
    content: string
  ) => {
    const token = getToken();
    const res = await axios.post(
      `${API_URL}/${classId}/messages/${messageId}/comments`,
      { content },
      {
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data; 
  };
  // Cập nhật message trong lớp
  export const updateClassMessage = async (
    classId: number,
    messageId: number,
    content: string
  ) => {
    const token = getToken();
    const res = await axios.put(
      `${API_URL}/${classId}/messages/${messageId}`,
      { messageId, content },
      {
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  };
  // Xoá message trong lớp
  export const deleteClassMessage = async (
    classId: number,
    messageId: number
  ) => {
    const token = getToken();
    const res = await axios.delete(`${API_URL}/${classId}/messages/${messageId}`, {
      headers: {
        accept: "*/*",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  };
  export const updateMessageComment = async (
    classId: number,
    messageId: number,
    commentId: number,
    content: string
  ) => {
    const token = getToken();
    const res = await axios.put(
      `${API_URL}/${classId}/messages/${messageId}/comments/${commentId}`,
      { id: commentId, content },
      {
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data; 
  };
  
  // DELETE /api/classes/:classId/messages/:messageId/comments/:commentId
  export const deleteMessageComment = async (
    classId: number,
    messageId: number,
    commentId: number
  ) => {
    const token = getToken();
    const res = await axios.delete(
      `${API_URL}/${classId}/messages/${messageId}/comments/${commentId}`,
      {
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data; 
  };
const classService = {
    getClasses, addClass, joinClass, updateClass, deleteClass, getClassStudents
    , getStudentsRequests, decideClassRequests, approveStudents, rejectStudents, getClassMessages,
    sendClassMessage,getClassDetail,  addMessageComment,   updateClassMessage,  
    deleteClassMessage,updateMessageComment,  
    deleteMessageComment,  
};
export default classService;
