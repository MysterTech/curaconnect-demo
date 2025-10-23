import { MedicalSpecialty } from '../models/templates';

export interface UserSettings {
  specialty: MedicalSpecialty;
  defaultTemplate: string | null;
  name: string;
  credentials: string;
  clinicName: string;
}

const SETTINGS_KEY = 'medscribe_user_settings';

export class UserSettingsService {
  private static instance: UserSettingsService;

  private constructor() {}

  static getInstance(): UserSettingsService {
    if (!UserSettingsService.instance) {
      UserSettingsService.instance = new UserSettingsService();
    }
    return UserSettingsService.instance;
  }

  getSettings(): UserSettings {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('Failed to parse user settings:', error);
      }
    }
    
    // Default settings
    return {
      specialty: 'general-practitioner',
      defaultTemplate: null,
      name: '',
      credentials: '',
      clinicName: '',
    };
  }

  saveSettings(settings: Partial<UserSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }

  getSpecialty(): MedicalSpecialty {
    return this.getSettings().specialty;
  }

  setSpecialty(specialty: MedicalSpecialty): void {
    this.saveSettings({ specialty });
  }

  getDefaultTemplate(): string | null {
    return this.getSettings().defaultTemplate;
  }

  setDefaultTemplate(templateId: string | null): void {
    this.saveSettings({ defaultTemplate: templateId });
  }
}

export const userSettingsService = UserSettingsService.getInstance();
