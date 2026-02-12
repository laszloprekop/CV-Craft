import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { cvApi, templateApi } from '../services/api'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import {
  Sparkle,
  Folder,
  Copy,
  PencilSimple,
  CursorText,
  Check,
  X,
  CaretUp,
  CaretDown
} from '@phosphor-icons/react'
import type { CVInstance, Template } from '../../../shared/types'

type SortKey = 'name' | 'updated_at' | 'created_at' | 'sections_count' | 'word_count' | 'status'
type SortDir = 'asc' | 'desc'

export const CVManagerPage: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  const [cvs, setCvs] = useState<CVInstance[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (retries = 5) => {
    try {
      setLoading(true)
      setError(null)

      const [cvsResponse, templatesResponse] = await Promise.all([
        cvApi.list(),
        templateApi.list({ active_only: true })
      ])

      setCvs(cvsResponse.data)
      setTemplates(templatesResponse.data)
      setLoading(false)
    } catch (err) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return loadData(retries - 1)
      }
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setLoading(false)
    }
  }

  const sortedCvs = useMemo(() => {
    const sorted = [...cvs].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'updated_at':
          cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          break
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'sections_count':
          cmp = (a.metadata?.sections_count || 0) - (b.metadata?.sections_count || 0)
          break
        case 'word_count':
          cmp = (a.metadata?.word_count || 0) - (b.metadata?.word_count || 0)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [cvs, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
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

  const generateDuplicateName = (baseName: string): string => {
    const rootName = baseName.replace(/\s*\(\d+\)$/, '')
    const existingNames = new Set(cvs.map(c => c.name))

    for (let i = 2; i <= 100; i++) {
      const candidate = `${rootName} (${i})`
      if (!existingNames.has(candidate)) return candidate
    }
    return `${rootName} (${Date.now()})`
  }

  const handleDuplicateCV = async (e: React.MouseEvent, cv: CVInstance) => {
    e.stopPropagation()
    try {
      const response = await cvApi.duplicate(cv.id, generateDuplicateName(cv.name))
      navigate(`/editor/${response.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate CV')
    }
  }

  const handleStartRename = (e: React.MouseEvent, cv: CVInstance) => {
    e.stopPropagation()
    setRenamingId(cv.id)
    setRenameValue(cv.name)
  }

  const handleRenameSubmit = async () => {
    const name = renameValue.trim()
    if (!name || !renamingId) return
    try {
      await cvApi.update(renamingId, { name } as any)
      setCvs(prev => prev.map(cv => cv.id === renamingId ? { ...cv, name } : cv))
      setRenamingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename CV')
    }
  }

  const handleRenameCancel = () => {
    setRenamingId(null)
  }

  useEffect(() => {
    if (renamingId && renameInputRef.current) renameInputRef.current.focus()
  }, [renamingId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const SortIndicator: React.FC<{ column: SortKey }> = ({ column }) => {
    if (sortKey !== column) return <span className="ml-1 text-gray-300 inline-flex"><CaretDown size={12} /></span>
    return sortDir === 'asc'
      ? <span className="ml-1 text-emerald-600 inline-flex"><CaretUp size={12} weight="bold" /></span>
      : <span className="ml-1 text-emerald-600 inline-flex"><CaretDown size={12} weight="bold" /></span>
  }

  const thClass = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors whitespace-nowrap"
  const thClassRight = "px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 transition-colors whitespace-nowrap"

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
        <ErrorMessage title="Error" message={error} onRetry={() => setError(null)} />
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
          <p className="text-text-secondary">No CVs created yet. Click &ldquo;Create New CV&rdquo; to get started!</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className={thClass} onClick={() => handleSort('name')}>
                    <span className="inline-flex items-center">Name<SortIndicator column="name" /></span>
                  </th>
                  <th className={thClassRight} onClick={() => handleSort('sections_count')}>
                    <span className="inline-flex items-center justify-end">Sections<SortIndicator column="sections_count" /></span>
                  </th>
                  <th className={thClassRight} onClick={() => handleSort('word_count')}>
                    <span className="inline-flex items-center justify-end">Words<SortIndicator column="word_count" /></span>
                  </th>
                  <th className={thClass} onClick={() => handleSort('status')}>
                    <span className="inline-flex items-center">Status<SortIndicator column="status" /></span>
                  </th>
                  <th className={thClass} onClick={() => handleSort('updated_at')}>
                    <span className="inline-flex items-center">Last Modified<SortIndicator column="updated_at" /></span>
                  </th>
                  <th className="px-4 py-3 w-40"></th>
                </tr>
              </thead>
              <tbody>
                {sortedCvs.map((cv) => (
                  <tr
                    key={cv.id}
                    onClick={() => handleEditCV(cv.id)}
                    className="border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-emerald-50 transition-colors group"
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      {renamingId === cv.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSubmit()
                              if (e.key === 'Escape') handleRenameCancel()
                            }}
                            className="flex-1 min-w-0 px-2 py-1 text-sm font-medium border border-emerald-500 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            maxLength={100}
                          />
                          <button
                            onClick={handleRenameSubmit}
                            className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"
                            title="Confirm"
                          >
                            <Check size={14} weight="bold" />
                          </button>
                          <button
                            onClick={handleRenameCancel}
                            className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            title="Cancel"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                          {cv.name}
                        </span>
                      )}
                    </td>
                    {/* Sections */}
                    <td className="px-4 py-3 text-sm text-gray-500 text-right tabular-nums">
                      {cv.metadata?.sections_count || 0}
                    </td>
                    {/* Words */}
                    <td className="px-4 py-3 text-sm text-gray-500 text-right tabular-nums">
                      {cv.metadata?.word_count || 0}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        cv.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : cv.status === 'archived'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cv.status}
                      </span>
                    </td>
                    {/* Last Modified */}
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(cv.updated_at)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditCV(cv.id) }}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                          title="Edit"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          onClick={(e) => handleStartRename(e, cv)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Rename"
                        >
                          <CursorText size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDuplicateCV(e, cv)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          title="Duplicate"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
