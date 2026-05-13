// OOREP Data Parser
// Parses OOREP SQL files and converts to JSON format

import fs from 'fs'
import path from 'path'
import { repertoryStorage, remediesStorage, chaptersStorage, rubricRemedyStorage } from './json-storage'

export interface OOREPInfo {
  abbrev: string
  title: string
  languag: string
  authorlastname?: string
  authorfirstname?: string
  yearr?: number
  publisher?: string
  license?: string
  edition?: string
  access?: string
  displaytitle?: string
}

export interface OOREPChapter {
  abbrev: string
  id: number
  textt?: string
}

export interface OOREPRubric {
  abbrev: string
  id: number
  mother?: number
  ismother?: boolean
  chapterid: number
  fullpath: string
  path?: string
  textt?: string
}

export interface OOREPRemedy {
  id: number
  nameabbrev: string
  namelong: string
  namealt?: string[]
}

export interface OOREPRubricRemedy {
  abbrev: string
  rubricid: number
  remedyid: number
  weight: number
  chapterid: number
}

export class OOREPParser {
  private oorepDir: string

  constructor() {
    this.oorepDir = path.join(process.cwd(), 'oorep-upstream')
  }

  // Parse SQL INSERT statements
  private parseInsertStatements(sqlContent: string, tableName: string): any[] {
    const results: any[] = []
    const insertRegex = new RegExp(
      `INSERT INTO ${tableName}\\s*\\(([^)]+)\\)\\s*VALUES\\s*\\(([^)]+)\\)`,
      'gi'
    )

    let match
    while ((match = insertRegex.exec(sqlContent)) !== null) {
      const columns = match[1].split(',').map((c: string) => c.trim().toLowerCase())
      const values = match[2].split(',').map((v: string) => {
        const trimmed = v.trim()
        if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
          return trimmed.slice(1, -1)
        }
        if (trimmed === 'NULL') {
          return null
        }
        if (trimmed === 'true' || trimmed === 'false') {
          return trimmed === 'true'
        }
        const num = Number(trimmed)
        return isNaN(num) ? trimmed : num
      })

      const obj: any = {}
      columns.forEach((col: string, i: number) => {
        obj[col] = values[i]
      })
      results.push(obj)
    }

    return results
  }

  // Parse array values in SQL (e.g., ARRAY['value1', 'value2'])
  private parseArrayValue(value: string): string[] {
    if (!value || value === 'NULL') return []
    const match = value.match(/ARRAY\[([^\]]+)\]/i)
    if (match) {
      return match[1].split(',').map((v: string) => v.trim().replace(/^'/, '').replace(/'$/, ''))
    }
    return []
  }

  // Load and parse OOREP data
  async loadOOREPData(): Promise<void> {
    try {
      console.log('Loading OOREP repertory data...')

      // Load SQL evolution files
      const evolutionsDir = path.join(this.oorepDir, 'backend', 'conf', 'evolutions', 'default')
      
      if (!fs.existsSync(evolutionsDir)) {
        console.log('OOREP evolutions directory not found, using embedded data')
        this.loadEmbeddedData()
        return
      }

      const sqlFiles = fs.readdirSync(evolutionsDir)
        .filter((f: string) => f.endsWith('.sql'))
        .sort()

      let remedies: OOREPRemedy[] = []
      let rubrics: OOREPRubric[] = []
      let chapters: OOREPChapter[] = []
      let rubricRemedies: OOREPRubricRemedy[] = []
      let infos: OOREPInfo[] = []

      for (const sqlFile of sqlFiles) {
        const sqlPath = path.join(evolutionsDir, sqlFile)
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8')

        // Parse each table
        remedies = [...remedies, ...this.parseInsertStatements(sqlContent, 'REMEDY')]
        rubrics = [...rubrics, ...this.parseInsertStatements(sqlContent, 'RUBRIC')]
        chapters = [...chapters, ...this.parseInsertStatements(sqlContent, 'CHAPTER')]
        rubricRemedies = [...rubricRemedies, ...this.parseInsertStatements(sqlContent, 'RUBRICREMEDY')]
        infos = [...infos, ...this.parseInsertStatements(sqlContent, 'INFO')]
      }

      // Save to JSON storage
      remediesStorage.write(remedies)
      chaptersStorage.write(chapters)
      rubricRemedyStorage.write(rubricRemedies)
      repertoryStorage.write(infos)

      console.log(`Loaded ${remedies.length} remedies`)
      console.log(`Loaded ${rubrics.length} rubrics`)
      console.log(`Loaded ${chapters.length} chapters`)
      console.log(`Loaded ${rubricRemedies.length} rubric-remedy relationships`)
      console.log(`Loaded ${infos.length} repertory info entries`)

    } catch (error) {
      console.error('Error loading OOREP data:', error)
      console.log('Falling back to embedded data')
      this.loadEmbeddedData()
    }
  }

  // Load embedded fallback data
  private loadEmbeddedData(): void {
    const remedies: OOREPRemedy[] = [
      { id: 1, nameabbrev: 'arn', namelong: 'Arnica', namealt: ['Arnica montana'] },
      { id: 2, nameabbrev: 'bell', namelong: 'Belladonna', namealt: ['Atropa belladonna'] },
      { id: 3, nameabbrev: 'nux-v', namelong: 'Nux Vomica', namealt: ['Strychnos nux-vomica'] },
      { id: 4, nameabbrev: 'puls', namelong: 'Pulsatilla', namealt: ['Pulsatilla nigricans'] },
      { id: 5, nameabbrev: 'sulph', namelong: 'Sulphur', namealt: ['Sulfur'] },
      { id: 6, nameabbrev: 'ars', namelong: 'Arsenicum Album', namealt: ['Arsenicum'] },
      { id: 7, nameabbrev: 'lyc', namelong: 'Lycopodium', namealt: ['Lycopodium clavatum'] },
      { id: 8, nameabbrev: 'rhus-t', namelong: 'Rhus Toxicodendron', namealt: ['Rhus tox'] },
      { id: 9, nameabbrev: 'sep', namelong: 'Sepia', namealt: ['Sepia officinalis'] },
      { id: 10, nameabbrev: 'calc', namelong: 'Calcarea Carbonica', namealt: ['Calc carb'] },
    ]

    const chapters: OOREPChapter[] = [
      { abbrev: 'MIND', id: 1, textt: 'Mind' },
      { abbrev: 'HEAD', id: 2, textt: 'Head' },
      { abbrev: 'EYES', id: 3, textt: 'Eyes' },
      { abbrev: 'EARS', id: 4, textt: 'Ears' },
      { abbrev: 'NOSE', id: 5, textt: 'Nose' },
      { abbrev: 'FACE', id: 6, textt: 'Face' },
      { abbrev: 'MOUTH', id: 7, textt: 'Mouth' },
      { abbrev: 'THROAT', id: 8, textt: 'Throat' },
      { abbrev: 'STOMACH', id: 9, textt: 'Stomach' },
      { abbrev: 'ABDOMEN', id: 10, textt: 'Abdomen' },
      { abbrev: 'RECTUM', id: 11, textt: 'Rectum' },
      { abbrev: 'STOOL', id: 12, textt: 'Stool' },
      { abbrev: 'URINARY', id: 13, textt: 'Urinary' },
      { abbrev: 'GENITALIA', id: 14, textt: 'Genitalia' },
      { abbrev: 'CHEST', id: 15, textt: 'Chest' },
      { abbrev: 'RESPIRATION', id: 16, textt: 'Respiration' },
      { abbrev: 'COUGH', id: 17, textt: 'Cough' },
      { abbrev: 'HEART', id: 18, textt: 'Heart' },
      { abbrev: 'BACK', id: 19, textt: 'Back' },
      { abbrev: 'EXTREMITIES', id: 20, textt: 'Extremities' },
      { abbrev: 'SKIN', id: 21, textt: 'Skin' },
      { abbrev: 'SLEEP', id: 22, textt: 'Sleep' },
      { abbrev: 'CHILL', id: 23, textt: 'Chill' },
      { abbrev: 'FEVER', id: 24, textt: 'Fever' },
      { abbrev: 'PERSPIRATION', id: 25, textt: 'Perspiration' },
    ]

    const rubrics: OOREPRubric[] = [
      { abbrev: 'KENT', id: 1, chapterid: 1, fullpath: 'MIND; ANXIETY', textt: 'Anxiety' },
      { abbrev: 'KENT', id: 2, chapterid: 1, fullpath: 'MIND; FEAR', textt: 'Fear' },
      { abbrev: 'KENT', id: 3, chapterid: 1, fullpath: 'MIND; IRRITABILITY', textt: 'Irritability' },
      { abbrev: 'KENT', id: 4, chapterid: 2, fullpath: 'HEAD; PAIN', textt: 'Headache' },
      { abbrev: 'KENT', id: 5, chapterid: 2, fullpath: 'HEAD; PAIN; throbbing', textt: 'Throbbing headache' },
      { abbrev: 'KENT', id: 6, chapterid: 9, fullpath: 'STOMACH; NAUSEA', textt: 'Nausea' },
      { abbrev: 'KENT', id: 7, chapterid: 9, fullpath: 'STOMACH; VOMITING', textt: 'Vomiting' },
      { abbrev: 'KENT', id: 8, chapterid: 15, fullpath: 'CHEST; COUGH', textt: 'Cough' },
      { abbrev: 'KENT', id: 9, chapterid: 15, fullpath: 'CHEST; COUGH; dry', textt: 'Dry cough' },
      { abbrev: 'KENT', id: 10, chapterid: 21, fullpath: 'SKIN; ERUPTIONS', textt: 'Eruptions' },
      { abbrev: 'KENT', id: 11, chapterid: 21, fullpath: 'SKIN; ERUPTIONS; itching', textt: 'Itching eruptions' },
    ]

    const rubricRemedies: OOREPRubricRemedy[] = [
      { abbrev: 'KENT', rubricid: 1, remedyid: 6, weight: 3, chapterid: 1 }, // Arsenicum for anxiety
      { abbrev: 'KENT', rubricid: 1, remedyid: 3, weight: 2, chapterid: 1 }, // Nux for anxiety
      { abbrev: 'KENT', rubricid: 2, remedyid: 6, weight: 3, chapterid: 1 }, // Arsenicum for fear
      { abbrev: 'KENT', rubricid: 2, remedyid: 4, weight: 2, chapterid: 1 }, // Pulsatilla for fear
      { abbrev: 'KENT', rubricid: 3, remedyid: 3, weight: 3, chapterid: 1 }, // Nux for irritability
      { abbrev: 'KENT', rubricid: 3, remedyid: 7, weight: 2, chapterid: 1 }, // Lycopodium for irritability
      { abbrev: 'KENT', rubricid: 4, remedyid: 2, weight: 3, chapterid: 2 }, // Belladonna for headache
      { abbrev: 'KENT', rubricid: 4, remedyid: 1, weight: 2, chapterid: 2 }, // Arnica for headache
      { abbrev: 'KENT', rubricid: 5, remedyid: 2, weight: 3, chapterid: 2 }, // Belladonna for throbbing
      { abbrev: 'KENT', rubricid: 5, remedyid: 3, weight: 2, chapterid: 2 }, // Nux for throbbing
      { abbrev: 'KENT', rubricid: 6, remedyid: 3, weight: 3, chapterid: 9 }, // Nux for nausea
      { abbrev: 'KENT', rubricid: 6, remedyid: 4, weight: 2, chapterid: 9 }, // Pulsatilla for nausea
      { abbrev: 'KENT', rubricid: 7, remedyid: 3, weight: 3, chapterid: 9 }, // Nux for vomiting
      { abbrev: 'KENT', rubricid: 8, remedyid: 3, weight: 2, chapterid: 15 }, // Nux for cough
      { abbrev: 'KENT', rubricid: 8, remedyid: 8, weight: 2, chapterid: 15 }, // Rhus tox for cough
      { abbrev: 'KENT', rubricid: 9, remedyid: 3, weight: 2, chapterid: 15 }, // Nux for dry cough
      { abbrev: 'KENT', rubricid: 10, remedyid: 5, weight: 3, chapterid: 21 }, // Sulphur for eruptions
      { abbrev: 'KENT', rubricid: 10, remedyid: 8, weight: 3, chapterid: 21 }, // Rhus tox for eruptions
      { abbrev: 'KENT', rubricid: 11, remedyid: 5, weight: 3, chapterid: 21 }, // Sulphur for itching
      { abbrev: 'KENT', rubricid: 11, remedyid: 8, weight: 2, chapterid: 21 }, // Rhus tox for itching
    ]

    const infos: OOREPInfo[] = [
      {
        abbrev: 'KENT',
        title: "Kent's Repertory",
        languag: 'en',
        authorlastname: 'Kent',
        authorfirstname: 'James Tyler',
        yearr: 1897,
        publisher: 'Homeopathic Publishing Company',
        license: 'Public Domain',
        access: 'free',
        displaytitle: "Kent's Repertory of the Homoeopathic Materia Medica"
      }
    ]

    remediesStorage.write(remedies)
    chaptersStorage.write(chapters)
    rubricRemedyStorage.write(rubricRemedies)
    repertoryStorage.write(infos)

    console.log('Loaded embedded OOREP data')
    console.log(`${remedies.length} remedies`)
    console.log(`${rubrics.length} rubrics`)
    console.log(`${chapters.length} chapters`)
    console.log(`${rubricRemedies.length} rubric-remedy relationships`)
  }

  // Get all remedies
  getRemedies(): OOREPRemedy[] {
    return remediesStorage.read()
  }

  // Get all rubrics
  getRubrics(): OOREPRubric[] {
    return rubricRemedyStorage.read()
  }

  // Get all chapters
  getChapters(): OOREPChapter[] {
    return chaptersStorage.read()
  }

  // Get repertory info
  getRepertoryInfo(): OOREPInfo[] {
    return repertoryStorage.read()
  }

  // Find remedies for rubric
  findRemediesForRubric(rubricId: number): OOREPRubricRemedy[] {
    const all = rubricRemedyStorage.read()
    return all.filter((rr: OOREPRubricRemedy) => rr.rubricid === rubricId)
  }

  // Find rubrics for remedy
  findRubricsForRemedy(remedyId: number): OOREPRubricRemedy[] {
    const all = rubricRemedyStorage.read()
    return all.filter((rr: OOREPRubricRemedy) => rr.remedyid === remedyId)
  }
}

export const oorepParser = new OOREPParser()
