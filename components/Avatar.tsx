'use client'

import { useState } from 'react'
import { Camera, Upload } from 'lucide-react'

interface AvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  editable?: boolean
  onUpload?: (file: File) => void
  loading?: boolean
}

export default function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  editable = false, 
  onUpload,
  loading = false 
}: AvatarProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onUpload) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setIsUploading(true)
    try {
      await onUpload(file)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error uploading image. Please try again.')
    } finally {
      setIsUploading(false)
      // Limpiar el input
      event.target.value = ''
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const defaultAvatar = '/default-avatar.svg'
  const avatarSrc = src || defaultAvatar

  return (
    <div className="relative group">
      <div 
        className={`${sizeClasses[size]} rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 ${
          editable ? 'cursor-pointer hover:border-purple-500' : ''
        } ${loading || isUploading ? 'opacity-50' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {avatarSrc === defaultAvatar ? (
          <img 
            src={defaultAvatar} 
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : avatarSrc ? (
          <img 
            src={avatarSrc} 
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback a avatar por defecto si falla la carga
              e.currentTarget.src = defaultAvatar
            }}
          />
        ) : (
          <span className="text-gray-600 dark:text-gray-300 font-semibold">
            {getInitials(alt)}
          </span>
        )}
      </div>

      {/* Overlay de edición */}
      {editable && (
        <>
          <div 
            className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Camera size={iconSizes[size]} className="text-white" />
          </div>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={loading || isUploading}
          />

          {/* Indicador de carga */}
          {(loading || isUploading) && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
