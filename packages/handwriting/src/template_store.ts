import { PointCloud, type Point2D, type RawStrokePoint } from './point_cloud';
import { CANONICAL_TEMPLATES, type CanonicalTemplate } from './canonical_templates';

export interface CustomTemplate {
  id: string;
  symbol: string;
  latex: string;
  profileId: string;
  strokeCount: number;
  points: Point2D[];
  rawStrokes?: RawStrokePoint[][];
  hasLoop: boolean;
  aspectRatio: number;
  createdAt: number;
}

export interface HandwritingProfile {
  id: string;
  name: string;
  customTemplates: CustomTemplate[];
}

const STORAGE_KEY = 'mathboard_handwriting_profiles_v2';
const ACTIVE_PROFILE_KEY = 'mathboard_handwriting_active_profile_v2';

export class TemplateStore {
  private static instance: TemplateStore;
  private profiles: HandwritingProfile[] = [];
  private activeProfileId: string = 'default';
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  static getInstance(): TemplateStore {
    if (!TemplateStore.instance) {
      TemplateStore.instance = new TemplateStore();
    }
    return TemplateStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in TemplateStore listener:', e);
      }
    }
  }

  private loadFromStorage() {
    // Default initial profiles
    const defaultProfiles: HandwritingProfile[] = [
      { id: 'default', name: 'Predeterminado', customTemplates: [] },
      { id: 'profesor', name: 'Profesor', customTemplates: [] },
      { id: 'estudiante', name: 'Estudiante', customTemplates: [] },
    ];

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.profiles = parsed;
          } else {
            this.profiles = defaultProfiles;
          }
        } else {
          this.profiles = defaultProfiles;
        }

        const activeId = window.localStorage.getItem(ACTIVE_PROFILE_KEY);
        if (activeId && this.profiles.some((p) => p.id === activeId)) {
          this.activeProfileId = activeId;
        } else {
          this.activeProfileId = this.profiles[0].id;
        }
        return;
      }
    } catch {
      // In-memory fallback
    }

    this.profiles = defaultProfiles;
    this.activeProfileId = 'default';
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profiles));
        window.localStorage.setItem(ACTIVE_PROFILE_KEY, this.activeProfileId);
      }
    } catch {
      // Ignore
    }
    this.notify();
  }

  getProfiles(): HandwritingProfile[] {
    return [...this.profiles];
  }

  getActiveProfile(): HandwritingProfile {
    const found = this.profiles.find((p) => p.id === this.activeProfileId);
    return found || this.profiles[0];
  }

  setActiveProfile(id: string) {
    if (this.profiles.some((p) => p.id === id)) {
      this.activeProfileId = id;
      this.saveToStorage();
    }
  }

  createProfile(name: string): HandwritingProfile {
    const id = 'prof_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const newProfile: HandwritingProfile = {
      id,
      name: name.trim() || 'Nuevo Perfil',
      customTemplates: [],
    };
    this.profiles.push(newProfile);
    this.activeProfileId = id;
    this.saveToStorage();
    return newProfile;
  }

  deleteProfile(id: string): boolean {
    if (id === 'default' || this.profiles.length <= 1) return false;
    this.profiles = this.profiles.filter((p) => p.id !== id);
    if (this.activeProfileId === id) {
      this.activeProfileId = this.profiles[0].id;
    }
    this.saveToStorage();
    return true;
  }

  /**
   * Adds a new trained example for a specific symbol to the active profile.
   * Can be called multiple times to register multiple variations of the same symbol.
   */
  addExample(symbol: string, latex: string, rawStrokes: RawStrokePoint[][]): CustomTemplate {
    const active = this.getActiveProfile();

    // Compute bounding box & aspect ratio
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const stroke of rawStrokes) {
      for (const p of stroke) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const aspectRatio = width / height;

    // Check loop heuristic
    let hasLoop = false;
    if (rawStrokes.length === 1 && rawStrokes[0].length > 6) {
      const s = rawStrokes[0];
      const start = s[0];
      const end = s[s.length - 1];
      const dist = Math.hypot(end.x - start.x, end.y - start.y);
      const diag = Math.hypot(width, height);
      if (dist < 0.28 * diag) hasLoop = true;
    }

    const points = PointCloud.normalizeStrokes(rawStrokes, 32);

    const template: CustomTemplate = {
      id: 'tpl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      symbol,
      latex,
      profileId: active.id,
      strokeCount: rawStrokes.length,
      points,
      rawStrokes,
      hasLoop,
      aspectRatio,
      createdAt: Date.now(),
    };

    active.customTemplates.push(template);
    this.saveToStorage();
    return template;
  }

  getExamplesForSymbol(symbol: string, profileId?: string): CustomTemplate[] {
    const pid = profileId || this.activeProfileId;
    const profile = this.profiles.find((p) => p.id === pid);
    if (!profile) return [];
    return profile.customTemplates.filter((t) => t.symbol === symbol);
  }

  removeExample(templateId: string): boolean {
    const active = this.getActiveProfile();
    const prevLen = active.customTemplates.length;
    active.customTemplates = active.customTemplates.filter((t) => t.id !== templateId);
    if (active.customTemplates.length !== prevLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  clearExamplesForSymbol(symbol: string, profileId?: string): void {
    const pid = profileId || this.activeProfileId;
    const profile = this.profiles.find((p) => p.id === pid);
    if (!profile) return;
    profile.customTemplates = profile.customTemplates.filter((t) => t.symbol !== symbol);
    this.saveToStorage();
  }

  /**
   * Returns all active matching templates: Canonical templates plus Custom templates for the active profile.
   */
  getAllActiveTemplates(): Array<CanonicalTemplate | CustomTemplate> {
    const active = this.getActiveProfile();
    return [...CANONICAL_TEMPLATES, ...active.customTemplates];
  }

  resetProfileToDefaults(profileId?: string): void {
    const pid = profileId || this.activeProfileId;
    const profile = this.profiles.find((p) => p.id === pid);
    if (profile) {
      profile.customTemplates = [];
      this.saveToStorage();
    }
  }
}
