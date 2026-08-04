import { create } from "zustand";
import type { DeerState, ReminderCheck } from "../types/deer";

interface DeerStore {
  // 状态
  deerState: DeerState | null;
  loading: boolean;
  error: string | null;

  // 提醒
  reminder: ReminderCheck | null;
  showReminder: boolean;

  // 粒子
  particles: Particle[];

  // 设置 & 成就
  showSettings: boolean;
  showAchievements: boolean;
  showCredits: boolean;

  // 动作
  fetchState: () => Promise<void>;
  pet: () => Promise<"ok" | "leveled_up" | "cooldown">;
  endPet: () => Promise<void>;
  checkReminder: () => Promise<void>;
  dismissReminder: () => void;
  toggleSettings: () => void;
  toggleAchievements: () => void;
  toggleCredits: () => void;
  setReminderInterval: (seconds: number) => Promise<void>;
  skipDay: () => Promise<void>;
  spawnParticle: (x: number, y: number, emoji: string) => void;
  clearParticles: () => void;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

let particleId = 0;

export const useDeerStore = create<DeerStore>((set) => ({
  deerState: null,
  loading: true,
  error: null,
  reminder: null,
  showReminder: false,
  particles: [],
  showSettings: false,
  showAchievements: false,
  showCredits: false,

  fetchState: async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const state = await invoke<DeerState>("get_deer_state");
      set({ deerState: state, loading: false, error: null });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  pet: async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<{ result: string; state: DeerState }>("pet_deer");
      set({ deerState: result.state, reminder: null, showReminder: false });
      return result.result as "ok" | "leveled_up" | "cooldown";
    } catch (e) {
      set({ error: String(e) });
      return "cooldown";
    }
  },

  endPet: async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const state = await invoke<DeerState>("end_pet_deer");
      set({ deerState: state });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  checkReminder: async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<ReminderCheck>("check_reminder");
      set({
        reminder: result,
        showReminder: result.should_remind,
      });
    } catch { /* silent */ }
  },

  dismissReminder: () => {
    set({ showReminder: false });
    import("@tauri-apps/api/core").then(({ invoke }) =>
      invoke("ack_reminder").catch(() => {})
    );
  },

  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings, showAchievements: false })),
  toggleAchievements: () => set((s) => ({ showAchievements: !s.showAchievements, showSettings: false, showCredits: false })),
  toggleCredits: () => set((s) => ({ showCredits: !s.showCredits, showSettings: false, showAchievements: false })),

  setReminderInterval: async (seconds: number) => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const state = await invoke<DeerState>("set_reminder_interval", { seconds });
      set({ deerState: state });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  spawnParticle: (x, y, emoji) => {
    const id = ++particleId;
    set((s) => ({ particles: [...s.particles, { id, x, y, emoji }] }));
    setTimeout(() => {
      set((s) => ({ particles: s.particles.filter((p) => p.id !== id) }));
    }, 1500);
  },

  clearParticles: () => set({ particles: [] }),

  skipDay: async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const state = await invoke<DeerState>("skip_day");
      set({ deerState: state });
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
