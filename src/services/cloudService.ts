import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppData } from './storage';

const SUPABASE_URL_KEY = 'miao_supabase_url';
const SUPABASE_KEY_KEY = 'miao_supabase_key';

export class CloudService {
    private supabase: SupabaseClient | null = null;
    private url: string = '';
    private key: string = '';

    constructor() {
        this.loadCredentials();
    }

    private loadCredentials() {
        this.url = localStorage.getItem(SUPABASE_URL_KEY) || '';
        this.key = localStorage.getItem(SUPABASE_KEY_KEY) || '';
        if (this.url && this.key) {
            try {
                this.supabase = createClient(this.url, this.key);
            } catch (e) {
                console.error("Failed to init supabase", e);
                this.supabase = null;
            }
        }
    }

    public isConfigured(): boolean {
        return !!this.supabase;
    }

    public saveCredentials(url: string, key: string) {
        localStorage.setItem(SUPABASE_URL_KEY, url);
        localStorage.setItem(SUPABASE_KEY_KEY, key);
        this.loadCredentials();
    }

    public clearCredentials() {
        localStorage.removeItem(SUPABASE_URL_KEY);
        localStorage.removeItem(SUPABASE_KEY_KEY);
        this.supabase = null;
    }

    public async register(email: string, pass: string) {
        if (!this.supabase) throw new Error("Cloud not configured");
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password: pass
        });
        if (error) throw error;
        return data;
    }

    public async login(email: string, pass: string) {
        if (!this.supabase) throw new Error("Cloud not configured");
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password: pass
        });
        if (error) throw error;
        return data;
    }

    public async logout() {
        if (!this.supabase) return;
        await this.supabase.auth.signOut();
    }

    public async getUser() {
        if (!this.supabase) return null;
        const { data } = await this.supabase.auth.getUser();
        return data.user;
    }

    // Sync Methods
    // We use a simple strategy: Store the entire JSON blob in a 'user_data' table.
    // Table Schema required in Supabase:
    // create table user_data (
    //   id uuid references auth.users not null primary key,
    //   content jsonb,
    //   updated_at timestamptz default now()
    // );
    // Enable RLS for user access own rows.

    public async uploadData(data: AppData) {
        if (!this.supabase) return;
        
        const user = await this.getUser();
        if (!user) throw new Error("User not logged in");

        const { error } = await this.supabase
            .from('user_data')
            .upsert({ 
                id: user.id, 
                content: data,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }

    public async downloadData(): Promise<AppData | null> {
        if (!this.supabase) return null;

        const user = await this.getUser();
        if (!user) return null;

        const { data, error } = await this.supabase
            .from('user_data')
            .select('content')
            .eq('id', user.id)
            .single();

        if (error) {
            // Likely no data yet
            return null;
        }

        return data?.content as AppData;
    }
}

export const cloudService = new CloudService();