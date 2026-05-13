// JSON File-Based Storage System
// Replaces MongoDB with local JSON file storage

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export interface StorageConfig {
  fileName: string
  subDir?: string
}

export class JSONStorage<T> {
  private filePath: string

  constructor(config: StorageConfig) {
    const dir = config.subDir ? path.join(DATA_DIR, config.subDir) : DATA_DIR
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    this.filePath = path.join(dir, config.fileName)
  }

  // Read data from JSON file
  read(): T[] {
    try {
      if (!fs.existsSync(this.filePath)) {
        return []
      }
      const data = fs.readFileSync(this.filePath, 'utf-8')
      return JSON.parse(data)
    } catch (error) {
      console.error(`Error reading ${this.filePath}:`, error)
      return []
    }
  }

  // Write data to JSON file
  write(data: T[]): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.error(`Error writing ${this.filePath}:`, error)
      throw error
    }
  }

  // Append single item
  append(item: T): void {
    const data = this.read()
    data.push(item)
    this.write(data)
  }

  // Update item by ID
  update(id: string | number, updates: Partial<T>): void {
    const data = this.read()
    const index = data.findIndex((item: any) => item.id === id)
    if (index !== -1) {
      data[index] = { ...data[index], ...updates }
      this.write(data)
    }
  }

  // Delete item by ID
  delete(id: string | number): void {
    const data = this.read()
    const filtered = data.filter((item: any) => item.id !== id)
    this.write(filtered)
  }

  // Find item by ID
  findById(id: string | number): T | undefined {
    const data = this.read()
    return data.find((item: any) => item.id === id)
  }

  // Find items by query
  find(query: Partial<T>): T[] {
    const data = this.read()
    return data.filter((item: any) => {
      return Object.keys(query).every(key => (item as any)[key] === (query as any)[key])
    })
  }

  // Clear all data
  clear(): void {
    this.write([])
  }

  // Get file path
  getPath(): string {
    return this.filePath
  }
}

// Pre-configured storage instances
export const doctorsStorage = new JSONStorage<any>({ fileName: 'doctors.json' })
export const patientsStorage = new JSONStorage<any>({ fileName: 'patients.json' })
export const appointmentsStorage = new JSONStorage<any>({ fileName: 'appointments.json' })
export const repertoryStorage = new JSONStorage<any>({ fileName: 'repertory.json', subDir: 'homeopathy' })
export const remediesStorage = new JSONStorage<any>({ fileName: 'remedies.json', subDir: 'homeopathy' })
export const chaptersStorage = new JSONStorage<any>({ fileName: 'chapters.json', subDir: 'homeopathy' })
export const rubricRemedyStorage = new JSONStorage<any>({ fileName: 'rubric-remedy.json', subDir: 'homeopathy' })
