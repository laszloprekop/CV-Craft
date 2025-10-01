import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { cvApi, templateApi } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { 
  Sparkle, 
  Folder, 
  Copy,
  PencilSimple
} from '@phosphor-icons/react'
import type { CVInstance, Template } from '../../../shared/types'


export const CVManagerPage: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [cvs, setCvs] = useState<CVInstance[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [cvsResponse, templatesResponse] = await Promise.all([
        cvApi.list({ orderBy: 'updated_at', orderDirection: 'DESC' }),
        templateApi.list({ active_only: true })
      ])
      
      setCvs(cvsResponse.data)
      setTemplates(templatesResponse.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = () => {
    navigate('/editor')
  }

  const handleImportFile = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      const defaultTemplate = templates.find(t => t.id === 'default-modern') || templates[0]
      
      if (!defaultTemplate) {
        setError('No templates available')
        return
      }

      const response = await cvApi.create({
        name: file.name.replace('.md', ''),
        content,
        template_id: defaultTemplate.id
      })

      navigate(`/editor/${response.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file')
    }
  }

  const handleEditCV = (cvId: string) => {
    navigate(`/editor/${cvId}`)
  }

  const handleDuplicateCV = async (cv: CVInstance) => {
    try {
      const response = await cvApi.duplicate(cv.id, `${cv.name} (Copy)`)
      navigate(`/editor/${response.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate CV')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto max-w-6xl mx-auto">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to CV Generator</h1>
        <p className="text-base text-text-secondary">Create professional CVs with ease using our powerful editor.</p>
      </div>

      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      <div className="flex gap-3 justify-center mb-8 flex-wrap">
        <button 
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white border-none rounded-lg text-base font-semibold cursor-pointer hover:bg-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Sparkle size={20} />
          Create New CV
        </button>
        <button 
          onClick={handleImportFile}
          className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg text-base font-semibold cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200"
        >
          <Folder size={20} />
          Import Markdown File
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Your CVs ({cvs.length})</h2>
        {cvs.length === 0 ? (
          <p className="text-text-secondary">No CVs created yet. Click "Create New CV" to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {cvs.map((cv) => (
              <div 
                key={cv.id} 
                onClick={() => handleEditCV(cv.id)}
                className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 group"
              >
                {/* CV Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                      {cv.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Template: {templates.find(t => t.id === cv.template_id)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2"></div>
                </div>

                {/* CV Stats */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-semibold text-emerald-600">{cv.metadata?.sections_count || 0}</div>
                      <div className="text-xs text-gray-500">Sections</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-emerald-600">{cv.metadata?.word_count || 0}</div>
                      <div className="text-xs text-gray-500">Words</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-emerald-600">
                        {cv.status === 'draft' ? '📝' : cv.status === 'published' ? '✅' : '⚡'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{cv.status}</div>
                    </div>
                  </div>
                </div>

                {/* CV Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Updated {formatDate(cv.updated_at)}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEditCV(cv.id) }}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium hover:bg-emerald-200 transition-colors"
                    >
                      <PencilSimple size={12} />
                      Edit
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDuplicateCV(cv) }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Copy size={12} />
                      Duplicate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}