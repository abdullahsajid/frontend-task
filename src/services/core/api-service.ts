import axios from "axios";

namespace APIService {
  export const post = async (url: string, body: object) => {
    try {
      const response = await axios.post(url, body);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const put = async (url: string, body: object) => {
    try {
      const response = await axios.put(url, body);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const del = async (url: string) => {
    try {
      const response = await axios.delete(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  export const get = async (url: string) => {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  };
}

export default APIService;
