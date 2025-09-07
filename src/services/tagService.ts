import axios from 'axios';
import type { Tag } from '../types';
import API_ENDPOINTS from '../api/apiConfig';

const API_URL = API_ENDPOINTS.contentManager.tags;

const getToken = () => {
    const token = localStorage.getItem("userToken");
    if (!token) throw new Error("User not authenticated. No token found.");
    return token;
};

const getTags = async ({ page = 0, size = 10, sort = 'string' }: { page?: number; size?: number; sort?: string; }) => {
    const token = getToken();
    const res = await axios.get(`${API_URL}?page=${page}&size=${size}&sort=${sort}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*',
        },
    });
    return res.data.data;
};

const addTag = async (tag: Omit<Tag, 'tag_id'>) => {
    const token = getToken();
    const res = await axios.post(API_URL, tag, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'accept': '*/*',
        },
    });
    return res.data;
};

const updateTag = async (tag_id: number, tag: Omit<Tag, 'tag_id'>) => {
    const token = getToken();
    console.log("id:", tag_id);
    console.log("tag:", tag.tag_description, "-", tag.tag_name);
  
    try {
      const payload = {
        tag_id : tag_id,
        tag_description: tag.tag_description,
        ...(tag.tag_name && { tag_name: tag.tag_name }), 
      };
      console.log("payload: " + payload.tag_description);
      const res = await axios.put(`${API_URL}/${tag_id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: '*/*',
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    } catch (error: any) {
      console.error('Update tag failed:', error.response?.data || error.message);
      throw error;
    }
  };

const deleteTag = async (tag_ids: number[]) => {
    if (!Array.isArray(tag_ids)) {
      tag_ids = [tag_ids];
    }
    
    const token = getToken();
    const res = await axios.delete(API_URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*',
        'Content-Type': 'application/json',
      },
      data: { tag_ids }, 
    });
    return res.data;
  };

const tagService = { getTags, addTag, updateTag, deleteTag };
export default tagService; 