// src/lib/database/models/User.ts
import { query } from '../connection'
import { UserRole } from '@/lib/auth/config'

export interface User {
  id: string
  email: string
  name?: string | null
  phone?: string | null
  role: UserRole
  institution?: string | null
  password?: string | null
  image?: string | null
  email_verified?: Date | null
  created_at: Date
  updated_at: Date
}

export class UserModel {
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error finding user by email:', error)
      throw error
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<User | null> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error finding user by ID:', error)
      throw error
    }
  }

  /**
   * Create new user
   */
  static async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    try {
      const result = await query(
        `INSERT INTO users (name, email, phone, role, institution, password, image, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          userData.name,
          userData.email?.toLowerCase(),
          userData.phone,
          userData.role,
          userData.institution,
          userData.password,
          userData.image,
          userData.email_verified
        ]
      )
      return result.rows[0]
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  /**
   * Update user
   */
  static async update(id: string, updateData: Partial<User>): Promise<User | null> {
    try {
      const setClause = []
      const values = []
      let paramCount = 1

      Object.entries(updateData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && value !== undefined) {
          setClause.push(`${key} = $${paramCount}`)
          values.push(value)
          paramCount++
        }
      })

      if (setClause.length === 0) {
        throw new Error('No valid fields to update')
      }

      setClause.push(`updated_at = NOW()`)
      values.push(id)

      const result = await query(
        `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      )

      return result.rows[0] || null
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  /**
   * Delete user
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query(
        'DELETE FROM users WHERE id = $1',
        [id]
      )
      return (result.rowCount ?? 0) > 0
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  /**
   * Get users by role
   */
  static async findByRole(role: UserRole): Promise<User[]> {
    try {
      const result = await query(
        'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC',
        [role]
      )
      return result.rows
    } catch (error) {
      console.error('Error finding users by role:', error)
      throw error
    }
  }

  /**
   * Count total users
   */
  static async count(): Promise<number> {
    try {
      const result = await query('SELECT COUNT(*) as total FROM users')
      return parseInt(result.rows[0].total)
    } catch (error) {
      console.error('Error counting users:', error)
      throw error
    }
  }

  /**
   * Search users
   */
  static async search(searchTerm: string): Promise<User[]> {
    try {
      const result = await query(
        `SELECT * FROM users 
         WHERE name ILIKE $1 OR email ILIKE $1 OR institution ILIKE $1
         ORDER BY name`,
        [`%${searchTerm}%`]
      )
      return result.rows
    } catch (error) {
      console.error('Error searching users:', error)
      throw error
    }
  }
}