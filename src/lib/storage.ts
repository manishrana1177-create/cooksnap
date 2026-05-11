/**
 * Storage utility for Supabase Storage
 * Handles uploading and deleting files (scanned images, recipe images)
 *
 * Set these environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for server-side operations
 *
 * If Supabase is not configured, falls back to local filesystem (for development)
 */

import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// Supabase Storage configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET_NAME = 'cooksnap-images'

// Check if Supabase Storage is configured
const isSupabaseConfigured = SUPABASE_URL && SUPABASE_SERVICE_KEY

/**
 * Upload a file to Supabase Storage (or local filesystem as fallback)
 */
export async function uploadFile(buffer: Buffer, path: string, contentType: string = 'image/png'): Promise<string> {
  if (isSupabaseConfigured) {
    return uploadToSupabase(buffer, path, contentType)
  }
  return uploadToLocal(buffer, path)
}

/**
 * Delete a file from Supabase Storage (or local filesystem as fallback)
 */
export async function deleteFile(path: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    return deleteFromSupabase(path)
  }
  return deleteFromLocal(path)
}

/**
 * Get the public URL for a file
 */
export function getFileUrl(path: string): string {
  if (isSupabaseConfigured) {
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${path}`
  }
  // Local fallback — serves from /public directory
  return `/${path}`
}

// --- Supabase Storage implementations ---

async function uploadToSupabase(buffer: Buffer, path: string, contentType: string): Promise<string> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${path}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: buffer,
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Supabase upload error:', error)
      // Fallback to local
      return uploadToLocal(buffer, path)
    }

    return getFileUrl(path)
  } catch (error) {
    console.error('Supabase upload failed, falling back to local:', error)
    return uploadToLocal(buffer, path)
  }
}

async function deleteFromSupabase(path: string): Promise<boolean> {
  try {
    // Extract just the filename/path without the full URL
    const filePath = path.includes('/storage/v1/object/public/') 
      ? path.split('/storage/v1/object/public/')[1]?.replace(`${BUCKET_NAME}/`, '') || path
      : path

    const response = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    return response.ok
  } catch (error) {
    console.error('Supabase delete failed:', error)
    return false
  }
}

// --- Local filesystem implementations (fallback for development) ---

function uploadToLocal(buffer: Buffer, path: string): string {
  const fullPath = join(process.cwd(), 'public', path)
  const dir = join(fullPath, '..')
  
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  
  writeFileSync(fullPath, buffer)
  return `/${path}`
}

function deleteFromLocal(path: string): boolean {
  try {
    const fullPath = join(process.cwd(), 'public', path)
    if (existsSync(fullPath)) {
      unlinkSync(fullPath)
      return true
    }
    return false
  } catch {
    return false
  }
}
