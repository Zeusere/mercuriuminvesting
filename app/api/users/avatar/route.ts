import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener el archivo del form data
    const formData = await request.formData()
    // @ts-expect-error - FormData.get() is available but type definition may be incomplete
    const fileData = formData.get('avatar') as Blob | null
    
    if (!fileData) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const file = fileData as File

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be smaller than 5MB' }, { status: 400 })
    }

    // Crear nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Subir archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true, // Reemplazar si ya existe
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Actualizar el perfil del usuario con la nueva URL del avatar
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update profile error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      avatar_url: publicUrl 
    })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Eliminar archivo del storage
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([`${user.id}/${user.id}.jpg`, `${user.id}/${user.id}.png`, `${user.id}/${user.id}.jpeg`])

    if (deleteError) {
      console.error('Delete error:', deleteError)
    }

    // Actualizar perfil para usar avatar por defecto
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: '/default-avatar.svg' })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Update profile error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
