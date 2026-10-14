import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { readDb, writeDb } from "./storage";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  planId: "free" | "creator";
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  token: string;
  userId: string;
  expiresAt: number;
}

export class AuthService {
  private supabase: SupabaseClient | null = null;
  private isSupabaseConfigured: boolean = false;

  constructor() {
    this.initSupabase();
  }

  private initSupabase() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.isSupabaseConfigured = true;
      } catch (err) {
        console.warn("Supabase client initialization warning:", err);
        this.supabase = null;
        this.isSupabaseConfigured = false;
      }
    } else {
      this.supabase = null;
      this.isSupabaseConfigured = false;
    }
  }

  public isSupabaseReady(): boolean {
    return this.isSupabaseConfigured && this.supabase !== null;
  }

  public hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  }

  /**
   * Register a new user
   */
  async signUp(email: string, password: string, name?: string): Promise<{ user: UserProfile; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("A valid email address is required.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    const displayName = name?.trim() || cleanEmail.split("@")[0] || "Creator";

    // If Supabase is connected, register with Supabase Auth
    if (this.isSupabaseReady() && this.supabase) {
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: cleanEmail,
        password,
        user_metadata: { name: displayName },
        email_confirm: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      const userId = data.user.id;
      const userProfile: UserProfile = {
        id: userId,
        email: cleanEmail,
        name: displayName,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        planId: "free",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const token = this.createSession(userId);
      this.syncLocalUserProfile(userProfile, password);
      return { user: userProfile, token };
    }

    // Local / Self-contained database registration
    const db = readDb();
    if (!db.users) db.users = [];

    const existing = db.users.find((u: any) => u.email === cleanEmail);
    if (existing) {
      throw new Error("An account with this email already exists. Please log in.");
    }

    const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = this.hashPassword(password, salt);

    const newUser = {
      id: userId,
      email: cleanEmail,
      name: displayName,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      salt,
      passwordHash,
      planId: "free" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDb(db);

    const token = this.createSession(userId);
    const { salt: _, passwordHash: __, ...userProfile } = newUser;
    return { user: userProfile, token };
  }

  /**
   * Authenticate existing user
   */
  async login(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error("Email and password are required.");
    }

    // If Supabase is connected
    if (this.isSupabaseReady() && this.supabase) {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      const userId = data.user.id;
      const token = this.createSession(userId);

      const db = readDb();
      let user = db.users?.find((u: any) => u.id === userId || u.email === cleanEmail);
      if (!user) {
        user = {
          id: userId,
          email: cleanEmail,
          name: data.user.user_metadata?.name || cleanEmail.split("@")[0],
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
          planId: "free",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (!db.users) db.users = [];
        db.users.push(user);
        writeDb(db);
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          planId: user.planId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      };
    }

    // Local / Self-contained database verification
    const db = readDb();
    if (!db.users) db.users = [];

    const user = db.users.find((u: any) => u.email === cleanEmail);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const calculatedHash = this.hashPassword(password, user.salt);
    if (calculatedHash !== user.passwordHash) {
      throw new Error("Invalid email or password.");
    }

    const token = this.createSession(user.id);
    const { salt: _, passwordHash: __, ...userProfile } = user;
    return { user: userProfile, token };
  }

  /**
   * Invalidate session token
   */
  async logout(token: string): Promise<void> {
    const db = readDb();
    if (db.sessions) {
      db.sessions = db.sessions.filter((s: UserSession) => s.token !== token);
      writeDb(db);
    }
  }

  /**
   * Validate token and return authenticated user profile
   */
  async getUserByToken(token: string): Promise<UserProfile | null> {
    if (!token) return null;

    const db = readDb();
    if (!db.sessions) return null;

    const session = db.sessions.find((s: UserSession) => s.token === token);
    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = db.users?.find((u: any) => u.id === session.userId);
    if (!user) return null;

    const { salt: _, passwordHash: __, ...userProfile } = user;
    return userProfile;
  }

  private createSession(userId: string): string {
    const token = `cfs_${crypto.randomBytes(24).toString("hex")}`;
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days

    const db = readDb();
    if (!db.sessions) db.sessions = [];
    db.sessions.push({ token, userId, expiresAt });
    writeDb(db);

    return token;
  }

  private syncLocalUserProfile(user: UserProfile, password?: string) {
    const db = readDb();
    if (!db.users) db.users = [];
    const idx = db.users.findIndex((u: any) => u.id === user.id);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...user };
    } else {
      const salt = crypto.randomBytes(16).toString("hex");
      const passwordHash = password ? this.hashPassword(password, salt) : "";
      db.users.push({ ...user, salt, passwordHash });
    }
    writeDb(db);
  }
}

export const authService = new AuthService();
