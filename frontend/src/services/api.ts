/**
 * API Service Layer
 * 
 * Handles communication with the CV-Craft backend API
 */

import axios from 'axios'
import type { CVInstance, Template, Asset, Export, TemplateSettings, TemplateConfig, SavedTheme } from '../../../shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4201/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    throw error
  }
)

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  limit: number
  offset: number
}

// CV API
export const cvApi = {
  async list(params?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<CVInstance>> {
    const response = await api.get('/cvs', { params })
    return response.data
  },

  async get(id: string): Promise<ApiResponse<CVInstance>> {
    const response = await api.get(`/cvs/${id}`)
    return response.data
  },

  async create(data: {
    name: string
    content: string
    template_id: string
  }): Promise<ApiResponse<CVInstance>> {
    const response = await api.post('/cvs', data)
    return response.data
  },

  async update(id: string, data: Partial<CVInstance>): Promise<ApiResponse<CVInstance>> {
    const response = await api.put(`/cvs/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/cvs/${id}`)
  },

  async duplicate(id: string, name: string): Promise<ApiResponse<CVInstance>> {
    const response = await api.post(`/cvs/${id}/duplicate`, { name })
    return response.data
  },

  async archive(id: string): Promise<ApiResponse<CVInstance>> {
    const response = await api.put(`/cvs/${id}/archive`)
    return response.data
  },

  async restore(id: string): Promise<ApiResponse<CVInstance>> {
    const response = await api.put(`/cvs/${id}/restore`)
    return response.data
  },

  /**
   * Get PDF preview for display in iframe
   * Returns a blob URL that can be used as iframe src
   */
  async getPreviewPdf(cvId: string, config?: TemplateConfig): Promise<string> {
    const response = await api.post(`/cvs/${cvId}/preview-pdf`, { config }, {
      responseType: 'blob'
    })
    return URL.createObjectURL(response.data)
  }
}

// Template API
export const templateApi = {
  async list(params?: {
    active_only?: boolean
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<Template>> {
    const response = await api.get('/templates', { params })
    return response.data
  },

  async get(id: string): Promise<ApiResponse<Template>> {
    const response = await api.get(`/templates/${id}`)
    return response.data
  },

  async create(data: Omit<Template, 'id' | 'created_at'>): Promise<ApiResponse<Template>> {
    const response = await api.post('/templates', data)
    return response.data
  },

  async update(id: string, data: Partial<Template>): Promise<ApiResponse<Template>> {
    const response = await api.put(`/templates/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/templates/${id}`)
  },

  async activate(id: string): Promise<ApiResponse<Template>> {
    const response = await api.put(`/templates/${id}/activate`)
    return response.data
  },

  async deactivate(id: string): Promise<ApiResponse<Template>> {
    const response = await api.put(`/templates/${id}/deactivate`)
    return response.data
  }
}

// Asset API
export const assetApi = {
  async list(params?: {
    cv_id?: string
    file_type?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<Asset>> {
    const response = await api.get('/assets', { params })
    return response.data
  },

  async get(id: string): Promise<ApiResponse<Asset>> {
    const response = await api.get(`/assets/${id}`)
    return response.data
  },

  async upload(file: File, cvId: string, options?: {
    usage_context?: string
    generate_thumbnails?: boolean
  }): Promise<ApiResponse<Asset>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('cv_id', cvId)
    if (options?.usage_context) {
      formData.append('usage_context', options.usage_context)
    }
    if (options?.generate_thumbnails) {
      formData.append('generate_thumbnails', 'true')
    }

    const response = await api.post('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async uploadImage(file: File, cvId: string): Promise<ApiResponse<Asset>> {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('cv_id', cvId)

    const response = await api.post('/assets/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async update(id: string, data: {
    filename?: string
    usage_context?: string
    metadata?: Record<string, any>
  }): Promise<ApiResponse<Asset>> {
    const response = await api.put(`/assets/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/assets/${id}`)
  },

  async getByCV(cvId: string): Promise<ApiResponse<Asset[]>> {
    const response = await api.get(`/assets/cv/${cvId}`)
    return response.data
  },

  getFileUrl(asset: Asset): string {
    return `${API_BASE_URL}/assets/${asset.id}/file`
  },

  getPublicUrl(asset: Asset): string {
    return `${API_BASE_URL.replace('/api', '')}/assets/${asset.storage_path}`
  }
}

// Export API
export const exportApi = {
  async list(params?: {
    cv_id?: string
    export_type?: string
    limit?: number
    offset?: number
  }): Promise<PaginatedResponse<Export>> {
    const response = await api.get('/exports', { params })
    return response.data
  },

  async create(data: {
    cv_id: string
    export_type: 'pdf' | 'web_package'
    settings?: Partial<TemplateSettings>
    expires_in_hours?: number
  }): Promise<ApiResponse<Export>> {
    const response = await api.post(`/cvs/${data.cv_id}/export`, { 
      type: data.export_type,
      settings: data.settings,
      expires_in_hours: data.expires_in_hours 
    })
    return response.data
  },

  async get(id: string): Promise<ApiResponse<Export>> {
    const response = await api.get(`/exports/${id}`)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/exports/${id}`)
  },

  async getByCV(cvId: string): Promise<ApiResponse<Export[]>> {
    const response = await api.get(`/exports/cv/${cvId}`)
    return response.data
  },

  getDownloadUrl(exportRecord: any): string {
    // The backend returns the file_path directly, so we can construct a download URL
    return `${API_BASE_URL.replace('/api', '')}/${exportRecord.file_path}`
  }
}

// Saved Theme API
export const savedThemeApi = {
  async list(): Promise<ApiResponse<SavedTheme[]>> {
    const response = await api.get('/saved-themes')
    return response.data
  },

  async create(data: { name: string; config: TemplateConfig; template_id: string }): Promise<ApiResponse<SavedTheme>> {
    const response = await api.post('/saved-themes', data)
    return response.data
  },

  async update(id: string, data: { name?: string; config?: TemplateConfig }): Promise<ApiResponse<SavedTheme>> {
    const response = await api.put(`/saved-themes/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/saved-themes/${id}`)
  }
}

// Utility functions
export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string }> {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`)
    return response.data
  }
}

export default api