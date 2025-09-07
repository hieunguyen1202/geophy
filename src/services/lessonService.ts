import apiClient from './apiClient';
import API_ENDPOINTS from '../api/apiConfig';

const getLessonsByChapter = async (chapterId: number) => {
  const res = await apiClient.get(API_ENDPOINTS.lessonsByChapter(chapterId), {
    headers: {
      'accept': '*/*',
    },
  });
  console.log('Lesson API response:', res.data.data.list);
  const data = res.data?.data?.list;
  return Array.isArray(data) ? data : [];
};
// lessonService.ts
export type LessonUpdatePayload = {
  name: string;
  description?: string | null;
  content?: string | null;
  lesson_number: number;
  // ...các field khác nếu có (simulation_data, v.v.)
};

export const updateLesson = async (
  id: number,
  lesson: LessonUpdatePayload,
  file?: File | Blob | null
): Promise<any> => {
  // Loại bỏ key undefined để tránh gửi rác
  const clean = Object.fromEntries(
    Object.entries(lesson).filter(([, v]) => v !== undefined)
  ) as LessonUpdatePayload;

  const form = new FormData();

  // >>> payload: application/json (đồng bộ với BE @RequestPart("payload"))
  const payloadPart = new File([JSON.stringify(clean)], 'payload.json', {
    type: 'application/json',
  });
  form.append('payload', payloadPart);

  // >>> file: để browser tự set content-type
  if (file) {
    const filePart =
      file instanceof File
        ? file
        : new File([file], 'upload', {
            // giữ nguyên type nếu có, không ép application/octet-stream trừ khi không có
            type: (file as any).type || undefined,
          });
    form.append('file', filePart);
  }

  const res = await apiClient.put(`${API_ENDPOINTS.lessons}/${id}`, form, {
    headers: {
      accept: 'application/json',
      // KHÔNG set 'Content-Type' để browser tự gắn boundary
    },
    transformRequest: (data) => data,
  });

  return res.data;
};


export type LessonPayload = {
  name: string;
  description: string;
  content: string;
  chapter_id: number;
  lesson_number: number;
  simulation_data?: string;
};
const addLesson = async (
  lesson: LessonPayload,
  file?: File | Blob | null
): Promise<LessonPayload> => {
  // Clean undefined to avoid sending null/undefined keys
  const clean = Object.fromEntries(
    Object.entries(lesson).filter(([, v]) => v !== undefined)
  ) as LessonPayload;

  const form = new FormData();

  // >>> payload part: application/json (filename helps some servers keep the part MIME)
  const payloadPart = new File([JSON.stringify(clean)], 'payload.json', {
    type: 'application/json',
  });
  form.append('payload', payloadPart);

  // >>> file part: let browser set content-type automatically
  if (file) {
    const filePart =
      file instanceof File
        ? file
        : new File([file], 'upload', { type: (file as any).type || 'application/octet-stream' });
    form.append('file', filePart);
  }

  const res = await apiClient.post(API_ENDPOINTS.lessons, form, {
    // CRITICAL: let the browser set multipart boundary; don’t override Content-Type
    headers: {
      accept: 'application/json',
      'Content-Type': undefined as any, // clears any axios defaults that would force JSON
    },
    // Prevent axios from converting FormData to JSON
    transformRequest: [(data) => data],
  });

  return res.data as LessonPayload;
};
const getLessons = async ({
  subject,
  grade,
  chapter_id,
  page = 0,
  size = 10,
  sort = 'id,asc'
}: {
  subject: number,
  grade: number,
  chapter_id: number,
  page?: number,
  size?: number,
  sort?: string
}) => {
  const res = await apiClient.get(
    API_ENDPOINTS.lessons,
    {
      headers: {
        'accept': '*/*',
      },
      params: { subject, grade, chapter_id, page, size, sort }
    }
  );
  console.log("get les: " , res)
  return res.data?.data || { list: [], total: 0 };
};

const getLessonById = async (id: number) => {
  const res = await apiClient.get(`${API_ENDPOINTS.lessons}/${id}`, {
    headers: {
      'accept': '*/*',
    },
  });
  return res.data?.data;
};

const lessonService = { getLessonsByChapter, updateLesson, addLesson, getLessons, getLessonById };
export default lessonService; 