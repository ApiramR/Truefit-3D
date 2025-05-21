import axios from 'axios';

//const API_BASE_URL = 'http://localhost:8000';
//const API_BASE_URL = 'https://truefit-3d-production.up.railway.app/';
const API_BASE_URL = 'https://truefit-3d-production-eab1.up.railway.app/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Always set the Authorization header
    config.headers.Authorization = `Bearer ${token}`;
    
    // For multipart/form-data requests, let axios set the Content-Type header
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      path: window.location.pathname
    });
    
    if (error.response?.status === 401) {
      // Only redirect if not already on login page and not uploading profile image
      if (!window.location.pathname.includes('/login') && 
          !error.config.url?.includes('/upload-profile-image')) {
        console.log('Redirecting to login due to 401');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  gender: 'male' | 'female' | 'other';
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  password: string;
  OTP: string;
}

export interface ClothData {
  typ: string;
  name: string;
  description?: string;
  price?: string;
  size: number;
  color?: string;
  material?: string;
  brand?: string;
  size_metrics: string;
  neckType?: string;
  sleeveType?: string;
  fitType?: string;
  skirtType?: string;
  imgUrl: string;
}

export interface OAuth2ProfileData {
  username: string;
  gender: 'male' | 'female' | 'other';
  email: string;
}

export interface UserProfile {
  username: string;
  email: string;
  gender: string;
  role: string;
  createdAt: string;
  profileImageUrl?: string;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  website?: string;
}

const authApi = {
  login: async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/login', credentials);
      const token = response.data;
      if (typeof token === 'string') {
        localStorage.setItem('token', token);
        localStorage.setItem('username', credentials.username);
      }
      return token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Login failed');
      }
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      const response = await api.post('/register', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Registration failed');
      }
      throw error;
    }
  },

  forgotPassword: async (data: ForgotPasswordData) => {
    try {
      const response = await api.post('/forgot-password', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to process forgot password request');
      }
      throw error;
    }
  },

  verifyOTP: async (data: { email: string; OTP: string }) => {
    try {
      const response = await api.post('/forgot-password-verify', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Invalid OTP');
      }
      throw error;
    }
  },

  resetPassword: async (data: ResetPasswordData) => {
    try {
      const response = await api.post('/reset-password', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to reset password');
      }
      throw error;
    }
  },

  async handleOAuth2Callback(code: string) {
    try {
      const response = await api.get(`/login/oauth2/code/google?code=${code}`);
      const data = response.data;
      console.log('OAuth2 callback API response:', data);
      
      if (data.token && data.username) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
      }
      
      return data;
    } catch (error) {
      console.error('OAuth2 callback API error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to complete Google sign-in');
      }
      throw error;
    }
  },

  async completeOAuth2Profile(data: OAuth2ProfileData) {
    try {
      console.log('Sending profile completion data:', data);
      const response = await api.post('/complete-oauth2-profile', {
        email: data.email,
        username: data.username,
        gender: data.gender
      });
      console.log('Profile completion response:', response.data);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', data.username);
      }
      return response.data;
    } catch (error) {
      console.error('Profile completion error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to complete profile');
      }
      throw error;
    }
  },

  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to fetch profile');
      }
      throw error;
    }
  },

  updateProfile: async (data: { name: string; gender: string }): Promise<{ message: string; token?: string }> => {
    try {
      const response = await api.post('/update-profile', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update profile');
      }
      throw error;
    }
  },

  uploadProfileImage: async (file: File): Promise<{ message: string; imageUrl: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to upload profile image');
      }
      throw error;
    }
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    try {
      await api.post('/change-password', data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to change password');
      }
      throw error;
    }
  },

  updateProfileImage: async (imageUrl: string): Promise<{ message: string; imageUrl: string }> => {
    try {
      const response = await api.post('/update-profile-image', { imageUrl });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to update profile image');
      }
      throw error;
    }
  },
};

const clothApi = {
  uploadCloth: async (file: File, data: ClothData): Promise<any> => {
    try {
      // Validate required fields
      if (!data.typ || !data.size || !data.size_metrics) {
        throw new Error('Type, size, and size metrics are required');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('data', JSON.stringify(data));

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to upload cloth';
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  getOutfits: async () => {
    try {
      const response = await api.get('/outfits');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw error;
        }
        throw new Error(error.response?.data || 'Failed to fetch outfits');
      }
      throw error;
    }
  },

  getSharedWardrobeItems: async (ownerUsername: string) => {
    try {
      const response = await api.get(`/shared-wardrobe-items?ownerUsername=${ownerUsername}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to fetch shared wardrobe items');
      }
      throw error;
    }
  },

  favoriteCloth: async (clothId: string): Promise<{ message: string; token?: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending favorite request with clothId:', clothId);
      const response = await api.post('/favorite-cloth', { clothId }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Favorite response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Favorite error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
        throw new Error(error.response?.data || 'Failed to favorite clothing item');
      }
      throw error;
    }
  },
  unfavoriteCloth: async (clothId: string): Promise<{ message: string; token?: string }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending unfavorite request with clothId:', clothId);
      const response = await api.post('/unfavorite-cloth', { clothId });
      console.log('unFavorite response:', response.data);
      return response.data;
    } catch (error) {
      console.error('unFavorite error:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          window.location.href = '/login';
        }
        throw new Error(error.response?.data || 'Failed to unfavorite clothing item');
      }
      throw error;
    }
  },
  likeCombination: async (combinationId: string): Promise<string> => {
    try {
      const response = await api.post('/like-combination', { code: combinationId.toString() });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to like combination');
      }
      throw error;
    }
  },

  dislikeCombination: async (combinationId: string): Promise<string> => {
    try {
      const response = await api.post('/dislike-combination', { code: combinationId.toString() });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to dislike combination');
      }
      throw error;
    }
  },

  shareWardrobe: async (username: string): Promise<string> => {
    try {
      const response = await api.post('/share-wardrobe', { username });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to share wardrobe');
      }
      throw error;
    }
  },

  unshareWardrobe: async (username: string): Promise<string> => {
    try {
      const response = await api.post('/unshare-wardrobe', { username });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to unshare wardrobe');
      }
      throw error;
    }
  },

  getSharedWardrobes: async () => {
    try {
      const response = await api.get('/shared-wardrobes');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to fetch shared wardrobes');
      }
      throw error;
    }
  },

  getWardrobesSharedByMe: async () => {
    try {
      const response = await api.get('/wardrobes-shared-by-me');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to fetch wardrobes shared by you');
      }
      throw error;
    }
  },

  likeCloth: async (clothId: string): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    try {
      console.log('Sending like request with token:', token);
      const response = await api.post('/like-cloth', { clothId }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Like error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
      throw error;
    }
  },
  dislikeCloth: async (clothId: string): Promise<{ message: string }> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    try {
      console.log('Sending dislike request with token:', token);
      const response = await api.post('/dislike-cloth', { clothId }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Dislike error:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
      throw error;
    }
  },
  addCloth: async (data: ClothData) => {
    try {
      const response = await api.post('/clothes', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to add clothing item');
      }
      throw error;
    }
  },
  tryOn: async (clothId: string): Promise<{ message: string; resultImageUrl: string }> => {
    try {
      const response = await api.post('/try-on', { clothId });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to try on clothing item');
      }
      throw error;
    }
  },
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Admin methods
  createAdmin: async (formData: {
    username: string;
    email: string;
    password: string;
    gender: string;
  }) => {
    const response = await api.post('/admin/create-admin', formData);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // Brand management
  getAllBrands: async (): Promise<Brand[]> => {
    try {
      const response = await api.get('/admin/brands');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to fetch brands');
      }
      throw error;
    }
  },

  createBrand: async (data: { name: string; description?: string }): Promise<Brand> => {
    try {
      const response = await api.post('/admin/brands', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to create brand');
      }
      throw error;
    }
  },

  updateBrand: async (id: number, data: { name: string; description?: string }): Promise<Brand> => {
    try {
      const response = await api.put(`/admin/brands/${id}`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to update brand');
      }
      throw error;
    }
  },

  deleteBrand: async (id: number): Promise<void> => {
    try {
      await api.delete(`/admin/brands/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to delete brand');
      }
      throw error;
    }
  },

  // Company management
  getAllCompanies: async (): Promise<Company[]> => {
    try {
      const response = await api.get('/admin/companies');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to fetch companies');
      }
      throw error;
    }
  },

  createCompany: async (data: { name: string; description?: string; website?: string }): Promise<Company> => {
    try {
      const response = await api.post('/admin/companies', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to create company');
      }
      throw error;
    }
  },

  updateCompany: async (id: number, data: { name: string; description?: string; website?: string }): Promise<Company> => {
    try {
      const response = await api.put(`/admin/companies/${id}`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to update company');
      }
      throw error;
    }
  },

  deleteCompany: async (id: number): Promise<void> => {
    try {
      await api.delete(`/admin/companies/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data || 'Failed to delete company');
      }
      throw error;
    }
  },
};

export { authApi, clothApi }; 