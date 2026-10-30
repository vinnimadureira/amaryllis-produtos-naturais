// Cloudflare D1 Native Client (Drop-in replacement for @supabase/supabase-js) — Amaryllis Produtos Naturais
import type { Database } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AMARYLLIS_CATEGORIES,
  AMARYLLIS_PRODUCTS,
  AMARYLLIS_TESTIMONIALS,
  AMARYLLIS_CAMPAIGNS,
  AMARYLLIS_COMPANY,
} from "@/lib/amaryllisFallbackData";

const API_BASE = "/api";
const SESSION_KEY = "amaryllis_d1_session";

const FALLBACK_TABLES: Record<string, any[]> = {
  products: AMARYLLIS_PRODUCTS,
  categories: AMARYLLIS_CATEGORIES,
  testimonials: AMARYLLIS_TESTIMONIALS,
  campaigns: AMARYLLIS_CAMPAIGNS,
  site_settings: [
    { key: "site_name", value: AMARYLLIS_COMPANY.companyName },
    { key: "site_phone", value: AMARYLLIS_COMPANY.phone },
    { key: "site_whatsapp", value: AMARYLLIS_COMPANY.whatsapp },
    { key: "site_email", value: AMARYLLIS_COMPANY.email },
    { key: "site_address", value: AMARYLLIS_COMPANY.address },
    { key: "brand_tagline", value: "Produtos naturais, suplementos, orgânicos, sem glúten e sem lactose em Campinas" },
  ],
  product_images: [],
  gallery_photos: [],
  gallery_filters: [],
  site_media: [],
  page_sections: [],
};

type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike" | "like" | "is" | "in" | "contains" | "not" | "or";

interface QueryFilter {
  op: FilterOp;
  col: string;
  val: any;
  subOp?: string;
}

interface QueryOrder {
  col: string;
  ascending?: boolean;
}

class D1QueryBuilder implements PromiseLike<any> {
  private table: string;
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private columns = "*";
  private values: any = undefined;
  private onConflict?: string;
  private filters: QueryFilter[] = [];
  private orders: QueryOrder[] = [];
  private limitNum?: number;
  private offsetNum?: number;
  private isSingle = false;
  private isMaybeSingle = false;
  private head = false;
  private countMode: "exact" | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(columns = "*", opts?: { count?: "exact"; head?: boolean }) {
    if (this.action === "select") {
      this.columns = columns;
    }
    if (opts?.count) this.countMode = opts.count;
    if (opts?.head) this.head = opts.head;
    return this;
  }

  insert(values: any) {
    this.action = "insert";
    this.values = values;
    return this;
  }

  update(values: any) {
    this.action = "update";
    this.values = values;
    return this;
  }

  upsert(values: any, opts?: { onConflict?: string }) {
    this.action = "upsert";
    this.values = values;
    this.onConflict = opts?.onConflict;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ op: "eq", col, val });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ op: "neq", col, val });
    return this;
  }

  gt(col: string, val: any) {
    this.filters.push({ op: "gt", col, val });
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push({ op: "gte", col, val });
    return this;
  }

  lt(col: string, val: any) {
    this.filters.push({ op: "lt", col, val });
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push({ op: "lte", col, val });
    return this;
  }

  ilike(col: string, val: any) {
    this.filters.push({ op: "ilike", col, val });
    return this;
  }

  like(col: string, val: any) {
    this.filters.push({ op: "like", col, val });
    return this;
  }

  is(col: string, val: any) {
    this.filters.push({ op: "is", col, val });
    return this;
  }

  in(col: string, val: any[]) {
    this.filters.push({ op: "in", col, val });
    return this;
  }

  contains(col: string, val: any) {
    this.filters.push({ op: "contains", col, val });
    return this;
  }

  not(col: string, subOp: string, val: any) {
    this.filters.push({ op: "not", col, subOp, val });
    return this;
  }

  or(filtersStr: string) {
    this.filters.push({ op: "or", col: "", val: filtersStr });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, ascending: opts?.ascending ?? true });
    return this;
  }

  limit(n: number) {
    this.limitNum = n;
    return this;
  }

  range(from: number, to: number) {
    this.offsetNum = from;
    this.limitNum = to - from + 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private getLocalFallback(): { data: any; error: any; count?: number | null } | null {
    if (this.action !== "select" || !(this.table in FALLBACK_TABLES)) return null;
    let rows = [...(FALLBACK_TABLES[this.table] || [])];

    for (const f of this.filters) {
      if (f.op === "eq") {
        rows = rows.filter((r) => r[f.col] === f.val);
      } else if (f.op === "neq") {
        rows = rows.filter((r) => r[f.col] !== f.val);
      } else if (f.op === "in" && Array.isArray(f.val)) {
        rows = rows.filter((r) => f.val.includes(r[f.col]));
      }
    }

    if (this.limitNum !== undefined) {
      const start = this.offsetNum || 0;
      rows = rows.slice(start, start + this.limitNum);
    }

    if (this.isSingle || this.isMaybeSingle) {
      return { data: rows[0] ?? null, error: null, count: rows.length };
    }
    return { data: rows, error: null, count: rows.length };
  }

  private async execute(): Promise<{ data: any; error: any; count?: number | null }> {
    try {
      const res = await fetch(`${API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: this.table,
          action: this.action,
          columns: this.columns,
          values: this.values,
          onConflict: this.onConflict,
          filters: this.filters,
          orders: this.orders,
          limit: this.limitNum,
          offset: this.offsetNum,
          single: this.isSingle,
          maybeSingle: this.isMaybeSingle,
          head: this.head,
          count: this.countMode,
        }),
      });
      if (!res.ok) {
        const fb = this.getLocalFallback();
        if (fb) return fb;
      }
      const json = await res.json();
      if (json.error) {
        const fb = this.getLocalFallback();
        if (fb) return fb;
      }
      return {
        data: json.data ?? null,
        error: json.error ? new Error(json.error.message || String(json.error)) : null,
        count: json.count ?? null,
      };
    } catch (err: any) {
      const fb = this.getLocalFallback();
      if (fb) return fb;
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<any> {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<any> {
    return this.execute().finally(onfinally);
  }
}

class D1RpcBuilder implements PromiseLike<any> {
  private fn: string;
  private args: any;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(fn: string, args?: any) {
    this.fn = fn;
    this.args = args || {};
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  private async execute() {
    try {
      const res = await fetch(`${API_BASE}/rpc/${this.fn}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.args),
      });
      const json = await res.json();
      let data = json.data;
      if ((this.isSingle || this.isMaybeSingle) && Array.isArray(data)) {
        data = data[0] ?? null;
      }
      return {
        data,
        error: json.error ? new Error(json.error.message || String(json.error)) : null,
      };
    } catch (err: any) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

type AuthListener = (event: string, session: any) => void;
const authListeners = new Set<AuthListener>();

function getStoredSession(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStoredSession(session: any | null) {
  if (typeof window === "undefined") return;
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function notifyAuth(event: string, session: any | null) {
  for (const cb of authListeners) {
    try {
      cb(event, session);
    } catch {
      // ignore listener errors
    }
  }
}

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || "");
      const idx = res.indexOf(",");
      resolve(idx >= 0 ? res.slice(idx + 1) : res);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const d1Client = {
  from(table: string) {
    return new D1QueryBuilder(table);
  },

  rpc(fn: string, args?: any) {
    return new D1RpcBuilder(fn, args);
  },

  auth: {
    async getSession() {
      const session = getStoredSession();
      return { data: { session }, error: null };
    },

    async getUser() {
      const session = getStoredSession();
      return { data: { user: session?.user ?? null }, error: null };
    },

    onAuthStateChange(callback: AuthListener) {
      authListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          return {
            data: { user: null, session: null },
            error: new Error(json.error?.message || "Credenciais inválidas"),
          };
        }
        setStoredSession(json.data.session);
        notifyAuth("SIGNED_IN", json.data.session);
        return { data: json.data, error: null };
      } catch (err: any) {
        return {
          data: { user: null, session: null },
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    },

    async signOut() {
      setStoredSession(null);
      notifyAuth("SIGNED_OUT", null);
      return { error: null };
    },

    async updateUser(attrs: { password?: string; email?: string }) {
      const session = getStoredSession();
      const userId = session?.user?.id;
      const res = await fetch(`${API_BASE}/auth/update-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...attrs }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        return { data: { user: null }, error: new Error(json.error?.message || "Erro ao atualizar usuário") };
      }
      return { data: json.data, error: null };
    },

    async resetPasswordForEmail(_email: string, _opts?: { redirectTo?: string }) {
      return { data: {}, error: null };
    },
  },

  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File | Blob, opts?: { contentType?: string }) {
          try {
            const dataBase64 = await fileToBase64(file);
            const contentType = opts?.contentType || (file as File).type || "application/octet-stream";
            const res = await fetch(`${API_BASE}/storage/upload`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bucket, path, dataBase64, contentType }),
            });
            const json = await res.json();
            if (!res.ok || json.error) {
              return { data: null, error: new Error(json.error?.message || "Erro no upload") };
            }
            return { data: { path }, error: null };
          } catch (err: any) {
            return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
          }
        },

        getPublicUrl(path: string) {
          return {
            data: {
              publicUrl: `${API_BASE}/storage/v1/object/public/${bucket}/${path}`,
            },
          };
        },

        async remove(paths: string[]) {
          await fetch(`${API_BASE}/storage/remove`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bucket, paths }),
          });
          return { data: [], error: null };
        },
      };
    },
  },

  functions: {
    async invoke(fnName: string, opts?: { body?: any; method?: string; headers?: Record<string, string> }) {
      try {
        const method = opts?.method || "POST";
        const session = getStoredSession();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          ...(opts?.headers || {}),
        };
        const res = await fetch(`${API_BASE}/functions/${fnName}`, {
          method,
          headers,
          body: method !== "GET" && opts?.body ? JSON.stringify(opts.body) : undefined,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const err: any = new Error(data?.error || `HTTP ${res.status}`);
          err.context = {
            json: async () => data,
            text: async () => JSON.stringify(data),
          };
          return { data: null, error: err };
        }
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
      }
    },
  },

  channel(_name: string) {
    const ch = {
      on(_type: string, _filter: any, _cb: any) {
        return ch;
      },
      subscribe() {
        return ch;
      },
    };
    return ch;
  },

  removeChannel(_ch: any) {
    return Promise.resolve("ok");
  },
};

export const supabase = d1Client as unknown as SupabaseClient<Database>;
