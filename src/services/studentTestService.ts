import axios from 'axios';
import API_ENDPOINTS from '../api/apiConfig';

const studentTestService = {
  /**
   * Lấy chi tiết kết quả của student-test theo ID
   * @param studentTestId ID của student-test
   * @returns Promise<any>
   */
  async getResultDetail(studentTestId: number) {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('User not authenticated. No token found.');
    }

    try {
      const response = await axios.get(
        `${API_ENDPOINTS.STUDENT_TESTS}/${studentTestId}/result-detail`,
        {
          headers: {
            accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching result detail:', error);
      throw error;
    }
  },
};

export default studentTestService;
