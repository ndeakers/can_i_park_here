import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

export const analyzeImage = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/analyze', formData);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}



export default api;