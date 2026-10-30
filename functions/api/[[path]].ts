import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/cloudflare-pages";

type Bindings = {
  DB: D1Database;
  ASSETS?: Fetcher;
  ENVIRONMENT?: string;
  MERCADO_PAGO_ACCESS_TOKEN?: string;
  MELHOR_ENVIO_TOKEN?: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

app.use("*", cors());

// Tables whitelist to prevent SQL injection on table names
const ALLOWED_TABLES = new Set([
  "users",
  "user_roles",
  "products",
  "product_images",
  "categories",
  "campaigns",
  "testimonials",
  "site_media",
  "site_settings",
  "secure_settings",
  "page_sections",
  "gallery_filters",
  "gallery_photos",
  "coupons",
  "message_templates",
  "orders",
  "customer_orders",
  "customer_order_items",
  "clients",
  "client_purchases",
  "client_messages",
  "client_match_suggestions",
  "agenda_events",
  "shopping_list",
  "activity_logs",
  "wishlist",
  "contact_messages",
  "newsletter_subscribers",
  "email_send_log",
  "email_send_state",
  "email_unsubscribe_tokens",
  "suppressed_emails",
  "storage_objects",
  "os_public",
]);

const BOOLEAN_COLS = new Set([
  "active",
  "featured",
  "allow_direct_purchase",
  "is_vip",
  "done",
  "lida",
]);

const JSON_COLS = new Set([
  "meta",
  "content",
  "metadata",
  "shipping_address",
  "status_history",
]);

const PRIMARY_KEY_BY_TABLE: Record<string, string> = {
  site_media: "key",
};

function sanitizeIdent(ident: string): string {
  return ident.replace(/[^a-zA-Z0-9_]/g, "");
}

function normalizeRowFromSqlite(row: Record<string, any> | null): Record<string, any> | null {
  if (!row) return null;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (BOOLEAN_COLS.has(k) && (v === 0 || v === 1)) {
      out[k] = v === 1;
    } else if (JSON_COLS.has(k) && typeof v === "string") {
      try {
        out[k] = JSON.parse(v);
      } catch {
        out[k] = v;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

function serializeValueForSqlite(col: string, val: any): any {
  if (val === undefined || val === null) return null;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (JSON_COLS.has(col) || typeof val === "object") {
    return typeof val === "string" ? val : JSON.stringify(val);
  }
  return val;
}

interface QueryFilter {
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike" | "like" | "is" | "in" | "contains" | "not" | "or";
  col: string;
  val: any;
  subOp?: string;
}

interface QueryOrder {
  col: string;
  ascending?: boolean;
}

interface QueryPayload {
  table: string;
  action: "select" | "insert" | "update" | "upsert" | "delete";
  columns?: string;
  values?: any;
  onConflict?: string;
  filters?: QueryFilter[];
  orders?: QueryOrder[];
  limit?: number;
  offset?: number;
  single?: boolean;
  maybeSingle?: boolean;
  head?: boolean;
  count?: "exact" | null;
}

function buildWhereClause(filters: QueryFilter[] = []): { sql: string; params: any[] } {
  if (!filters.length) return { sql: "", params: [] };
  const parts: string[] = [];
  const params: any[] = [];

  for (const f of filters) {
    if (f.op === "or") {
      const clauses = String(f.val || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const orParts: string[] = [];
      for (const cl of clauses) {
        const d1 = cl.indexOf(".");
        const d2 = d1 > 0 ? cl.indexOf(".", d1 + 1) : -1;
        if (d1 <= 0 || d2 <= d1) continue;
        const cCol = sanitizeIdent(cl.slice(0, d1));
        const cOp = cl.slice(d1 + 1, d2);
        const cVal = cl.slice(d2 + 1);
        if (!cCol) continue;
        if (cOp === "ilike") {
          orParts.push(`LOWER(${cCol}) LIKE LOWER(?)`);
          params.push(cVal);
        } else if (cOp === "like") {
          orParts.push(`${cCol} LIKE ?`);
          params.push(cVal);
        } else if (cOp === "eq") {
          orParts.push(`${cCol} = ?`);
          params.push(cVal);
        } else if (cOp === "neq") {
          orParts.push(`${cCol} != ?`);
          params.push(cVal);
        }
      }
      if (orParts.length > 0) {
        parts.push(`(${orParts.join(" OR ")})`);
      }
      continue;
    }

    const col = sanitizeIdent(f.col);
    if (!col) continue;
    const v = serializeValueForSqlite(col, f.val);
    switch (f.op) {
      case "eq":
        if (v === null) {
          parts.push(`${col} IS NULL`);
        } else {
          parts.push(`${col} = ?`);
          params.push(v);
        }
        break;
      case "neq":
        if (v === null) {
          parts.push(`${col} IS NOT NULL`);
        } else {
          parts.push(`${col} != ?`);
          params.push(v);
        }
        break;
      case "gt":
        parts.push(`${col} > ?`);
        params.push(v);
        break;
      case "gte":
        parts.push(`${col} >= ?`);
        params.push(v);
        break;
      case "lt":
        parts.push(`${col} < ?`);
        params.push(v);
        break;
      case "lte":
        parts.push(`${col} <= ?`);
        params.push(v);
        break;
      case "ilike":
        parts.push(`LOWER(${col}) LIKE LOWER(?)`);
        params.push(String(v ?? ""));
        break;
      case "like":
        parts.push(`${col} LIKE ?`);
        params.push(String(v ?? ""));
        break;
      case "is":
        if (v === null) parts.push(`${col} IS NULL`);
        else if (v === 1 || v === true) parts.push(`${col} = 1`);
        else if (v === 0 || v === false) parts.push(`${col} = 0`);
        break;
      case "in": {
        const arr = Array.isArray(f.val) ? f.val : [];
        if (arr.length === 0) {
          parts.push("1 = 0");
        } else {
          const placeholders = arr.map(() => "?").join(", ");
          parts.push(`${col} IN (${placeholders})`);
          for (const item of arr) params.push(serializeValueForSqlite(col, item));
        }
        break;
      }
      case "contains": {
        if (f.val && typeof f.val === "object" && !Array.isArray(f.val)) {
          for (const [k, subV] of Object.entries(f.val)) {
            const safeKey = sanitizeIdent(k);
            if (safeKey) {
              parts.push(`json_extract(${col}, '$.${safeKey}') = ?`);
              params.push(subV);
            }
          }
        } else {
          parts.push(`${col} LIKE ?`);
          params.push(`%${String(f.val ?? "")}%`);
        }
        break;
      }
      case "not": {
        const subOp = f.subOp || "eq";
        if (subOp === "in") {
          let arr: any[] = [];
          if (Array.isArray(f.val)) {
            arr = f.val;
          } else if (typeof f.val === "string") {
            const inner = f.val.trim().replace(/^\(/, "").replace(/\)$/, "");
            arr = inner
              .split(",")
              .map((s) => s.trim().replace(/^["']|["']$/g, ""))
              .filter(Boolean);
          }
          if (arr.length > 0) {
            const placeholders = arr.map(() => "?").join(", ");
            parts.push(`${col} NOT IN (${placeholders})`);
            for (const item of arr) params.push(serializeValueForSqlite(col, item));
          }
        } else if (subOp === "is") {
          if (v === null) parts.push(`${col} IS NOT NULL`);
          else if (v === 1 || v === true) parts.push(`${col} != 1`);
          else if (v === 0 || v === false) parts.push(`${col} != 0`);
        } else {
          parts.push(`${col} != ?`);
          params.push(v);
        }
        break;
      }
    }
  }

  return {
    sql: parts.length ? ` WHERE ${parts.join(" AND ")}` : "",
    params,
  };
}

// Healthcheck
app.get("/health", (c) => c.json({ status: "ok", provider: "cloudflare-d1" }));

// Universal D1 Query Endpoint
app.post("/query", async (c) => {
  try {
    const body = (await c.req.json()) as QueryPayload;
    const table = sanitizeIdent(body.table || "");
    if (!ALLOWED_TABLES.has(table)) {
      return c.json({ data: null, error: { message: `Tabela não permitida: ${table}` } }, 400);
    }

    const pk = PRIMARY_KEY_BY_TABLE[table] || "id";

    if (body.action === "select") {
      const { sql: whereSql, params } = buildWhereClause(body.filters);
      let orderSql = "";
      if (body.orders && body.orders.length > 0) {
        const ordParts = body.orders
          .map((o) => {
            const col = sanitizeIdent(o.col);
            return col ? `${col} ${o.ascending === false ? "DESC" : "ASC"}` : "";
          })
          .filter(Boolean);
        if (ordParts.length) orderSql = ` ORDER BY ${ordParts.join(", ")}`;
      }

      let limitSql = "";
      if (typeof body.limit === "number" && body.limit > 0) {
        limitSql = ` LIMIT ${Math.floor(body.limit)}`;
        if (typeof body.offset === "number" && body.offset >= 0) {
          limitSql += ` OFFSET ${Math.floor(body.offset)}`;
        }
      } else if (body.single || body.maybeSingle) {
        limitSql = " LIMIT 1";
      }

      let totalCount: number | null = null;
      if (body.count === "exact") {
        const countRes = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM ${table}${whereSql}`)
          .bind(...params)
          .first<{ cnt: number }>();
        totalCount = countRes?.cnt ?? 0;
        if (body.head) {
          return c.json({ data: null, count: totalCount, error: null });
        }
      }

      const stmt = c.env.DB.prepare(`SELECT * FROM ${table}${whereSql}${orderSql}${limitSql}`).bind(...params);
      const { results } = await stmt.all();
      const normalized = (results || []).map((r) => normalizeRowFromSqlite(r as Record<string, any>));

      if (body.single) {
        if (!normalized.length) {
          return c.json({ data: null, error: { message: "Registro não encontrado" } });
        }
        return c.json({ data: normalized[0], count: totalCount, error: null });
      }
      if (body.maybeSingle) {
        return c.json({ data: normalized[0] ?? null, count: totalCount, error: null });
      }
      return c.json({ data: normalized, count: totalCount, error: null });
    }

    if (body.action === "insert" || body.action === "upsert") {
      const rows = Array.isArray(body.values) ? body.values : [body.values];
      const insertedRows: any[] = [];

      for (const rawRow of rows) {
        if (!rawRow || typeof rawRow !== "object") continue;
        const row = { ...rawRow };
        if (pk === "id" && !row.id && table !== "email_send_state") {
          row.id = crypto.randomUUID();
        }
        if (table === "agenda_events" && !row.order_number) {
          const maxOrd = await c.env.DB.prepare("SELECT COALESCE(MAX(order_number), 0) + 1 as next_num FROM agenda_events").first<{ next_num: number }>();
          row.order_number = maxOrd?.next_num ?? 1;
        }

        const cols = Object.keys(row).map(sanitizeIdent).filter(Boolean);
        const vals = cols.map((col) => serializeValueForSqlite(col, row[col]));
        const placeholders = cols.map(() => "?").join(", ");

        let query = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`;
        if (body.action === "upsert") {
          const conflictCol = sanitizeIdent(body.onConflict || pk);
          const updateCols = cols.filter((col) => col !== conflictCol && col !== "id");
          if (updateCols.length > 0) {
            const updateSet = updateCols.map((col) => `${col} = excluded.${col}`).join(", ");
            query += ` ON CONFLICT(${conflictCol}) DO UPDATE SET ${updateSet}`;
          } else {
            query += ` ON CONFLICT(${conflictCol}) DO NOTHING`;
          }
        }

        await c.env.DB.prepare(query).bind(...vals).run();

        const lookupCol = body.action === "upsert" && body.onConflict ? sanitizeIdent(body.onConflict) : pk;
        const lookupVal = row[lookupCol];
        if (lookupVal !== undefined) {
          const fetched = await c.env.DB.prepare(`SELECT * FROM ${table} WHERE ${lookupCol} = ?`)
            .bind(serializeValueForSqlite(lookupCol, lookupVal))
            .first();
          insertedRows.push(normalizeRowFromSqlite((fetched as any) || row));
        } else {
          insertedRows.push(normalizeRowFromSqlite(row));
        }
      }

      if (body.single || body.maybeSingle) {
        return c.json({ data: insertedRows[0] ?? null, error: null });
      }
      return c.json({ data: insertedRows, error: null });
    }

    if (body.action === "update") {
      const updates = body.values || {};
      const cols = Object.keys(updates).map(sanitizeIdent).filter(Boolean);
      if (!cols.length) return c.json({ data: [], error: null });

      const setClause = cols.map((col) => `${col} = ?`).join(", ");
      const setParams = cols.map((col) => serializeValueForSqlite(col, updates[col]));
      const { sql: whereSql, params: whereParams } = buildWhereClause(body.filters);

      await c.env.DB.prepare(`UPDATE ${table} SET ${setClause}${whereSql}`)
        .bind(...setParams, ...whereParams)
        .run();

      const { results } = await c.env.DB.prepare(`SELECT * FROM ${table}${whereSql}`)
        .bind(...whereParams)
        .all();
      const normalized = (results || []).map((r) => normalizeRowFromSqlite(r as any));
      if (body.single || body.maybeSingle) {
        return c.json({ data: normalized[0] ?? null, error: null });
      }
      return c.json({ data: normalized, error: null });
    }

    if (body.action === "delete") {
      const { sql: whereSql, params: whereParams } = buildWhereClause(body.filters);
      await c.env.DB.prepare(`DELETE FROM ${table}${whereSql}`).bind(...whereParams).run();
      return c.json({ data: [], error: null });
    }

    return c.json({ data: null, error: { message: "Ação inválida" } }, 400);
  } catch (err: any) {
    console.error("[/api/query] error:", err);
    return c.json({ data: null, error: { message: err?.message || "Erro interno no banco D1" } }, 500);
  }
});

// RPC Endpoints (e.g. validate_coupon)
app.post("/rpc/:fn", async (c) => {
  try {
    const fn = c.req.param("fn");
    const args = await c.req.json().catch(() => ({}));

    if (fn === "validate_coupon") {
      const code = String(args._code || "").trim().toUpperCase();
      if (!code) return c.json({ data: [], error: null });
      const row = await c.env.DB.prepare(
        "SELECT * FROM coupons WHERE UPPER(code) = ? AND active = 1"
      )
        .bind(code)
        .first<any>();
      if (!row) return c.json({ data: [], error: null });
      if (row.expires_at && new Date(row.expires_at) < new Date()) {
        return c.json({ data: [], error: null });
      }
      if (row.max_uses && row.current_uses >= row.max_uses) {
        return c.json({ data: [], error: null });
      }
      return c.json({
        data: [{ code: row.code, discount_percent: row.discount_percent }],
        error: null,
      });
    }

    return c.json({ data: null, error: null });
  } catch (err: any) {
    return c.json({ data: null, error: { message: err.message } }, 500);
  }
});

// Auth Endpoints (D1 Native)
app.post("/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE LOWER(email) = ?")
      .bind(cleanEmail)
      .first<any>();

    if (!user || user.password_hash !== password) {
      return c.json({ data: null, error: { message: "Invalid login credentials" } }, 401);
    }

    const nowIso = new Date().toISOString();
    await c.env.DB.prepare("UPDATE users SET last_sign_in_at = ? WHERE id = ?")
      .bind(nowIso, user.id)
      .run();

    const roleRow = await c.env.DB.prepare("SELECT role FROM user_roles WHERE user_id = ?")
      .bind(user.id)
      .first<{ role: string }>();
    const role = roleRow?.role || user.role || "user";

    const sessionUser = {
      id: user.id,
      email: user.email,
      role: "authenticated",
      user_role: role,
      app_metadata: { provider: "email", role },
      user_metadata: { name: user.name || "Admin" },
      aud: "authenticated",
      created_at: user.created_at,
    };

    const tokenPayload = btoa(
      JSON.stringify({ sub: user.id, email: user.email, role, exp: Date.now() + 7 * 86400_000 })
    );

    return c.json({
      data: {
        user: sessionUser,
        session: {
          access_token: `d1_${tokenPayload}`,
          refresh_token: `d1_refresh_${user.id}`,
          expires_in: 604800,
          token_type: "bearer",
          user: sessionUser,
        },
      },
      error: null,
    });
  } catch (err: any) {
    return c.json({ data: null, error: { message: err.message } }, 500);
  }
});

app.post("/auth/update-user", async (c) => {
  try {
    const { userId, password, email } = await c.req.json();
    if (!userId) return c.json({ data: null, error: { message: "Não autenticado" } }, 401);
    if (password) {
      await c.env.DB.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(password, userId)
        .run();
    }
    if (email) {
      await c.env.DB.prepare("UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(email, userId)
        .run();
    }
    return c.json({ data: { user: { id: userId } }, error: null });
  } catch (err: any) {
    return c.json({ data: null, error: { message: err.message } }, 500);
  }
});

// Storage Endpoints (D1 Native)
app.post("/storage/upload", async (c) => {
  try {
    const { bucket, path, dataBase64, contentType } = await c.req.json();
    if (!bucket || !path || !dataBase64) {
      return c.json({ data: null, error: { message: "Dados de upload incompletos" } }, 400);
    }
    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO storage_objects (id, bucket, name, mime_type, data_base64, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(bucket, name) DO UPDATE SET mime_type = excluded.mime_type, data_base64 = excluded.data_base64`
    )
      .bind(id, bucket, path, contentType || "application/octet-stream", dataBase64)
      .run();

    return c.json({ data: { path }, error: null });
  } catch (err: any) {
    return c.json({ data: null, error: { message: err.message } }, 500);
  }
});

app.post("/storage/remove", async (c) => {
  try {
    const { bucket, paths } = await c.req.json();
    if (bucket && Array.isArray(paths)) {
      for (const p of paths) {
        await c.env.DB.prepare("DELETE FROM storage_objects WHERE bucket = ? AND name = ?")
          .bind(bucket, p)
          .run();
      }
    }
    return c.json({ data: [], error: null });
  } catch (err: any) {
    return c.json({ data: null, error: { message: err.message } }, 500);
  }
});

app.get("/storage/v1/object/public/:bucket/*", async (c) => {
  const bucket = c.req.param("bucket");
  const fullPath = c.req.path;
  const prefix = `/api/storage/v1/object/public/${bucket}/`;
  const name = decodeURIComponent(fullPath.startsWith(prefix) ? fullPath.slice(prefix.length) : "");

  const obj = await c.env.DB.prepare(
    "SELECT mime_type, data_base64 FROM storage_objects WHERE bucket = ? AND name = ?"
  )
    .bind(bucket, name)
    .first<{ mime_type: string; data_base64: string }>();

  if (!obj) return c.text("Not found", 404);

  const binaryStr = atob(obj.data_base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": obj.mime_type || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000",
    },
  });
});

// Helper: load Mercado Pago Token from D1 secure_settings or env
async function getMpTokenFromD1(db: D1Database, envToken?: string): Promise<string> {
  const row = await db
    .prepare("SELECT value FROM secure_settings WHERE key = 'mercadopago_access_token'")
    .first<{ value: string }>();
  const token = (row?.value || envToken || "").trim();
  if (!token) {
    throw new Error("Token do Mercado Pago não configurado (admin → Dados do Negócio → Credenciais & Tokens)");
  }
  return token;
}

async function mpApiFetch(token: string, path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Mercado Pago (${res.status}): ${txt.slice(0, 300)}`);
  }
  return res.json();
}

// Edge Functions Replacements (/api/functions/:name)
app.all("/functions/:fn", async (c) => {
  const rawFn = c.req.param("fn");
  const fn = rawFn.split("?")[0];

  try {
    // 1. manage-users
    if (fn === "manage-users") {
      const body = await c.req.json().catch(() => ({}));
      const action = body.action;

      if (action === "list") {
        const { results: users } = await c.env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all<any>();
        const { results: roles } = await c.env.DB.prepare("SELECT * FROM user_roles").all<any>();
        const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
        return c.json({
          users: (users || []).map((u: any) => ({
            id: u.id,
            email: u.email,
            role: roleMap.get(u.id) || u.role || "user",
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
          })),
        });
      }

      if (action === "create") {
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const role = body.role === "admin" ? "admin" : "user";
        if (!email || password.length < 6) {
          return c.json({ error: "E-mail e senha (mín. 6 caracteres) são obrigatórios" }, 400);
        }
        const id = crypto.randomUUID();
        await c.env.DB.prepare(
          "INSERT INTO users (id, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
        )
          .bind(id, email, password, role)
          .run();
        await c.env.DB.prepare(
          "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?) ON CONFLICT(user_id, role) DO NOTHING"
        )
          .bind(crypto.randomUUID(), id, role)
          .run();
        return c.json({ ok: true, id });
      }

      if (action === "update") {
        const { user_id, role } = body;
        await c.env.DB.prepare("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?")
          .bind(role, user_id)
          .run();
        await c.env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?").bind(user_id).run();
        if (role === "admin" || role === "user") {
          await c.env.DB.prepare("INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)")
            .bind(crypto.randomUUID(), user_id, role)
            .run();
        }
        return c.json({ ok: true });
      }

      if (action === "delete") {
        const { user_id } = body;
        await c.env.DB.prepare("DELETE FROM user_roles WHERE user_id = ?").bind(user_id).run();
        await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user_id).run();
        return c.json({ ok: true });
      }

      if (action === "reset_password") {
        const { user_id } = body;
        const u = await c.env.DB.prepare("SELECT email FROM users WHERE id = ?").bind(user_id).first<{ email: string }>();
        return c.json({ ok: true, email: u?.email || "" });
      }
    }

    // 2. calculate-shipping (Melhor Envio)
    if (fn === "calculate-shipping") {
      const body = await c.req.json();
      const cepDestino = String(body.cep || "").replace(/\D/g, "");
      const items = Array.isArray(body.items) ? body.items : [];
      if (cepDestino.length !== 8 || !items.length) {
        return c.json({ error: "CEP ou itens inválidos" }, 400);
      }

      const { results: settings } = await c.env.DB.prepare(
        "SELECT key, value FROM site_settings WHERE key IN ('melhor_envio_origin_cep', 'melhor_envio_environment')"
      ).all<{ key: string; value: string }>();
      const map = new Map((settings || []).map((s) => [s.key, s.value]));
      const cepOrigem = String(map.get("melhor_envio_origin_cep") || "").replace(/\D/g, "");
      const env = String(map.get("melhor_envio_environment") || "sandbox").toLowerCase();

      const tokenKey = env === "production" ? "melhor_envio_token_production" : "melhor_envio_token_sandbox";
      const tokenRow = await c.env.DB.prepare("SELECT value FROM secure_settings WHERE key = ?")
        .bind(tokenKey)
        .first<{ value: string }>();
      const meToken = (tokenRow?.value || c.env.MELHOR_ENVIO_TOKEN || "").trim();

      if (!meToken) {
        return c.json(
          { error: `Token Melhor Envio (${env}) não configurado. Acesse o admin → Dados do Negócio → Credenciais & Tokens.` },
          500
        );
      }
      if (cepOrigem.length !== 8) {
        return c.json({ error: "CEP de origem não configurado no admin (Dados do Negócio → Frete & Envio)." }, 400);
      }

      const ids = items.map((i: any) => i.id);
      const placeholders = ids.map(() => "?").join(", ");
      const { results: products } = await c.env.DB.prepare(
        `SELECT id, name, price, weight_grams, height_cm, width_cm, length_cm FROM products WHERE id IN (${placeholders})`
      )
        .bind(...ids)
        .all<any>();

      const prodMap = new Map((products || []).map((p: any) => [p.id, p]));
      const meProducts = items.map((it: any) => {
        const p = prodMap.get(it.id) || {};
        return {
          id: it.id,
          width: Math.max(Number(p.width_cm) || 11, 11),
          height: Math.max(Number(p.height_cm) || 2, 2),
          length: Math.max(Number(p.length_cm) || 16, 16),
          weight: Math.max((Number(p.weight_grams) || 300) / 1000, 0.1),
          insurance_value: Number(p.price) || 0,
          quantity: Number(it.quantity) || 1,
        };
      });

      const baseUrl = env === "production" ? "https://melhorenvio.com.br" : "https://sandbox.melhorenvio.com.br";
      const meRes = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${meToken}`,
          "User-Agent": "Amaryllis Produtos Naturais (contato@amaryllisnaturais.com.br)",
        },
        body: JSON.stringify({
          from: { postal_code: cepOrigem },
          to: { postal_code: cepDestino },
          products: meProducts,
          options: {
            receipt: false,
            own_hand: false,
            insurance_value: meProducts.reduce((s: number, p: any) => s + p.insurance_value * p.quantity, 0),
          },
        }),
      });

      const data = (await meRes.json().catch(() => null)) as any[];
      if (!meRes.ok || !Array.isArray(data)) {
        return c.json({ error: (data as any)?.message || `Falha no Melhor Envio (HTTP ${meRes.status})` }, 502);
      }

      const options = data
        .filter((s: any) => !s.error && (s.price || s.custom_price))
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          company: s.company?.name ?? "",
          companyLogo: s.company?.picture ?? null,
          priceCents: Math.round(parseFloat(s.custom_price ?? s.price ?? "0") * 100),
          deliveryDays: s.custom_delivery_time ?? s.delivery_time ?? null,
        }))
        .filter((o: any) => o.priceCents > 0)
        .sort((a: any, b: any) => a.priceCents - b.priceCents);

      if (!options.length) {
        return c.json({ error: "Nenhuma transportadora disponível para este CEP." }, 400);
      }
      return c.json({ options, origin: cepOrigem, destination: cepDestino, environment: env });
    }

    // 3. create-checkout (Mercado Pago)
    if (fn === "create-checkout") {
      const body = await c.req.json();
      if (!body?.items?.length) return c.json({ error: "Carrinho vazio" }, 400);

      const mpEnabled = await c.env.DB.prepare(
        "SELECT value FROM site_settings WHERE key = 'payment_mercadopago_enabled'"
      ).first<{ value: string }>();
      if ((mpEnabled?.value ?? "true") !== "true") {
        return c.json({ error: "Pagamento online temporariamente indisponível. Fale conosco pelo WhatsApp." }, 503);
      }

      const ids = body.items.map((i: any) => i.id);
      const placeholders = ids.map(() => "?").join(", ");
      const { results: dbProducts } = await c.env.DB.prepare(
        `SELECT id, name, price, image_url, allow_direct_purchase, active FROM products WHERE id IN (${placeholders})`
      )
        .bind(...ids)
        .all<any>();

      const prodMap = new Map((dbProducts || []).map((p: any) => [p.id, p]));
      for (const item of body.items) {
        const p = prodMap.get(item.id);
        if (!p || !p.active) return c.json({ error: `Produto indisponível: ${item.name}` }, 400);
        if (!p.allow_direct_purchase) {
          return c.json({ error: `"${p.name}" só é vendido sob orçamento. Use o WhatsApp.` }, 400);
        }
      }

      let coupon: { code: string; discount_percent: number } | null = null;
      if (body.couponCode) {
        const cRow = await c.env.DB.prepare(
          "SELECT * FROM coupons WHERE UPPER(code) = ? AND active = 1"
        )
          .bind(String(body.couponCode).trim().toUpperCase())
          .first<any>();
        if (cRow) {
          const expired = cRow.expires_at && new Date(cRow.expires_at) < new Date();
          const exhausted = cRow.max_uses && cRow.current_uses >= cRow.max_uses;
          if (!expired && !exhausted) {
            coupon = { code: cRow.code, discount_percent: cRow.discount_percent };
          }
        }
      }

      const discountFactor = coupon ? 1 - coupon.discount_percent / 100 : 1;
      const mpItems: any[] = body.items.map((item: any) => {
        const p = prodMap.get(item.id)!;
        const finalUnit = Math.round(Number(p.price) * discountFactor * 100) / 100;
        const notes = item.notes?.toString().trim().slice(0, 280) || null;
        return {
          id: p.id,
          title: notes ? `${p.name} — ${notes.slice(0, 60)}` : p.name,
          description: notes ?? undefined,
          picture_url: p.image_url?.startsWith("http") ? p.image_url : undefined,
          quantity: item.quantity,
          currency_id: "BRL",
          unit_price: finalUnit,
        };
      });

      const shippingReais = Math.max(0, Number(body.shippingCents) || 0) / 100;
      const cepDigits = String(body.customerCep ?? "").replace(/\D/g, "");
      if (shippingReais > 0) {
        mpItems.push({
          title: body.shippingLabel?.trim() ? `Frete — ${body.shippingLabel.trim().slice(0, 60)}` : "Frete",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Math.round(shippingReais * 100) / 100,
        });
      }

      const externalReference = crypto.randomUUID();
      const reqUrl = new URL(c.req.url);
      const notificationUrl = `${reqUrl.origin}/api/functions/mercadopago-webhook`;

      const mpToken = await getMpTokenFromD1(c.env.DB, c.env.MERCADO_PAGO_ACCESS_TOKEN);
      const preference = await mpApiFetch(mpToken, "/checkout/preferences", {
        method: "POST",
        body: JSON.stringify({
          items: mpItems,
          back_urls: {
            success: body.successUrl,
            failure: body.cancelUrl,
            pending: body.successUrl,
          },
          auto_return: "approved",
          notification_url: notificationUrl,
          external_reference: externalReference,
          statement_descriptor: "IMPERIO CONES",
          payment_methods: { installments: 12 },
          metadata: {
            coupon_code: coupon?.code ?? "",
            customer_name: body.customerName ?? "",
            customer_email: body.customerEmail ?? "",
            customer_phone: body.customerPhone ?? "",
            customer_cep: cepDigits,
            customer_street: (body.customerStreet ?? "").trim(),
            customer_number: (body.customerNumber ?? "").trim(),
            customer_neighborhood: (body.customerNeighborhood ?? "").trim(),
            customer_complement: (body.customerComplement ?? "").trim(),
            customer_city: (body.customerCity ?? "").trim(),
            customer_state: (body.customerState ?? "").trim(),
            shipping_label: (body.shippingLabel ?? "").slice(0, 80),
            shipping_cents: String(Math.round(shippingReais * 100)),
            cart_items: body.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              image: i.image ?? null,
              quantity: i.quantity,
              notes: i.notes ?? null,
              unit_price: prodMap.get(i.id) ? Number(prodMap.get(i.id)!.price) : i.priceNum,
            })),
          },
        }),
      });

      const isTest = mpToken.startsWith("TEST-");
      const url = isTest ? preference.sandbox_init_point : preference.init_point;
      return c.json({ url, preferenceId: preference.id, externalReference });
    }

    // 4. get-order-public
    if (fn === "get-order-public") {
      const url = new URL(c.req.url);
      const body = c.req.method === "POST" ? await c.req.json().catch(() => ({})) : {};
      const id = url.searchParams.get("id") || body.id;
      if (!id) return c.json({ error: "id inválido" }, 400);

      const order = await c.env.DB.prepare(
        "SELECT id, status, customer_name, customer_email, customer_phone, subtotal_cents, discount_cents, shipping_cents, total_cents, currency, coupon_code, shipping_address, created_at, updated_at FROM customer_orders WHERE id = ?"
      )
        .bind(id)
        .first<any>();

      if (!order) return c.json({ error: "Pedido não encontrado" }, 404);

      const { results: items } = await c.env.DB.prepare(
        "SELECT id, product_name, product_image, quantity, unit_price_cents FROM customer_order_items WHERE order_id = ?"
      )
        .bind(id)
        .all<any>();

      const normalizedOrder = normalizeRowFromSqlite(order)!;
      return c.json({
        ...normalizedOrder,
        items: items || [],
      });
    }

    // 5. verify-checkout & mercadopago-webhook & mercadopago-reprocess
    if (fn === "verify-checkout" || fn === "mercadopago-webhook" || fn === "mercadopago-reprocess") {
      const url = new URL(c.req.url);
      const body = c.req.method === "POST" ? await c.req.json().catch(() => ({})) : {};
      const paymentId =
        url.searchParams.get("payment_id") ||
        url.searchParams.get("collection_id") ||
        url.searchParams.get("data.id") ||
        body?.data?.id ||
        body?.payment_id ||
        body?.paymentId;
      const preferenceId = url.searchParams.get("preference_id") || body?.preference_id;

      if (!paymentId && preferenceId) {
        const existing = await c.env.DB.prepare("SELECT * FROM customer_orders WHERE mp_preference_id = ?")
          .bind(preferenceId)
          .first<any>();
        if (existing) {
          const norm = normalizeRowFromSqlite(existing)!;
          return c.json({
            status: norm.status,
            payment_status: norm.status,
            amount_subtotal: norm.subtotal_cents,
            amount_total: norm.total_cents,
            amount_discount: norm.discount_cents,
            amount_shipping: norm.shipping_cents,
            currency: norm.currency,
            customer_email: norm.customer_email,
            customer_name: norm.customer_name,
            customer_phone: norm.customer_phone,
            shipping_address: norm.shipping_address,
            coupon_code: norm.coupon_code,
            items: [],
            order_id: norm.id,
            created: Math.floor(new Date(norm.created_at).getTime() / 1000),
            order_status: norm.status,
            order_db_id: norm.id,
            order_updated_at: norm.updated_at,
          });
        }
      }

      if (!paymentId) {
        return c.json({ received: true });
      }

      const mpToken = await getMpTokenFromD1(c.env.DB, c.env.MERCADO_PAGO_ACCESS_TOKEN);
      const payment = await mpApiFetch(mpToken, `/v1/payments/${paymentId}`);
      const md = payment.metadata || {};
      const cartItems = Array.isArray(md.cart_items) ? md.cart_items : [];
      const status =
        payment.status === "approved" || payment.status === "authorized"
          ? "paid"
          : payment.status === "cancelled" || payment.status === "rejected"
          ? "canceled"
          : "pending";

      const totalCents = Math.round(Number(payment.transaction_amount || 0) * 100);
      const shippingCents = Number(md.shipping_cents || 0) || 0;
      const subtotalCents = cartItems.length
        ? cartItems.reduce((s: number, it: any) => s + Math.round(Number(it.unit_price) * 100) * Number(it.quantity), 0)
        : totalCents - shippingCents;
      const discountCents = Math.max(0, subtotalCents + shippingCents - totalCents);

      const existing = await c.env.DB.prepare("SELECT id, status, created_at FROM customer_orders WHERE mp_payment_id = ?")
        .bind(String(payment.id))
        .first<any>();

      const orderId = existing?.id || crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const shippingAddress = md.customer_city
        ? {
            line1: [md.customer_street, md.customer_number].filter(Boolean).join(", "),
            line2: [md.customer_neighborhood, md.customer_complement].filter(Boolean).join(" - ") || null,
            city: md.customer_city,
            state: md.customer_state,
            postal_code: md.customer_cep,
            country: "BR",
          }
        : null;

      if (existing) {
        await c.env.DB.prepare(
          `UPDATE customer_orders SET status = ?, total_cents = ?, subtotal_cents = ?, shipping_cents = ?, discount_cents = ?, updated_at = ? WHERE id = ?`
        )
          .bind(status, totalCents, subtotalCents, shippingCents, discountCents, nowIso, orderId)
          .run();
      } else {
        await c.env.DB.prepare(
          `INSERT INTO customer_orders (id, status, payment_provider, mp_payment_id, mp_preference_id, customer_name, customer_email, customer_phone, subtotal_cents, discount_cents, shipping_cents, total_cents, currency, coupon_code, shipping_address, metadata, created_at, updated_at)
           VALUES (?, ?, 'mercadopago', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'brl', ?, ?, ?, ?, ?)`
        )
          .bind(
            orderId,
            status,
            String(payment.id),
            payment.preference_id ?? null,
            md.customer_name || payment.payer?.first_name || null,
            md.customer_email || payment.payer?.email || null,
            md.customer_phone || null,
            subtotalCents,
            discountCents,
            shippingCents,
            totalCents,
            md.coupon_code || null,
            shippingAddress ? JSON.stringify(shippingAddress) : null,
            JSON.stringify(md),
            nowIso,
            nowIso
          )
          .run();
      }

      if (cartItems.length) {
        await c.env.DB.prepare("DELETE FROM customer_order_items WHERE order_id = ?").bind(orderId).run();
        for (const it of cartItems) {
          await c.env.DB.prepare(
            "INSERT INTO customer_order_items (id, order_id, product_id, product_name, product_image, quantity, unit_price_cents, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          )
            .bind(
              crypto.randomUUID(),
              orderId,
              it.id || null,
              it.name,
              it.image || null,
              Number(it.quantity) || 1,
              Math.round(Number(it.unit_price) * 100),
              nowIso
            )
            .run();
        }
      }

      return c.json({
        ok: true,
        status: payment.status,
        payment_status: status,
        amount_subtotal: subtotalCents,
        amount_total: totalCents,
        amount_discount: discountCents,
        amount_shipping: shippingCents,
        currency: "brl",
        customer_email: md.customer_email || payment.payer?.email || null,
        customer_name: md.customer_name || null,
        customer_phone: md.customer_phone || null,
        shipping_address: shippingAddress,
        coupon_code: md.coupon_code || null,
        items: cartItems.map((it: any) => ({
          name: it.name,
          notes: it.notes,
          quantity: it.quantity,
          unit_amount: Math.round(Number(it.unit_price) * 100),
          amount_subtotal: Math.round(Number(it.unit_price) * 100) * Number(it.quantity),
          amount_total: Math.round(Number(it.unit_price) * 100) * Number(it.quantity),
          image: it.image,
          product_id: it.id,
        })),
        order_id: orderId,
        created: Math.floor(new Date(existing?.created_at || nowIso).getTime() / 1000),
        order_status: status,
        order_db_id: orderId,
        order_updated_at: nowIso,
      });
    }

    // 6. create-agenda-payment-link
    if (fn === "create-agenda-payment-link") {
      const { eventId, frontendOrigin } = await c.req.json();
      const ev = await c.env.DB.prepare("SELECT * FROM agenda_events WHERE id = ?").bind(eventId).first<any>();
      if (!ev) return c.json({ error: "Evento não encontrado" }, 404);
      const valor = Number(ev.valor || 0);
      if (valor <= 0) return c.json({ error: "Defina um valor maior que zero antes de gerar o link." }, 400);

      const reqUrl = new URL(c.req.url);
      const origin = frontendOrigin || reqUrl.origin;
      const successUrl = `${origin}/os/${ev.id}`;
      const notificationUrl = `${reqUrl.origin}/api/functions/mercadopago-webhook`;

      const mpToken = await getMpTokenFromD1(c.env.DB, c.env.MERCADO_PAGO_ACCESS_TOKEN);
      const preference = await mpApiFetch(mpToken, "/checkout/preferences", {
        method: "POST",
        body: JSON.stringify({
          items: [
            {
              title: (ev.produto || ev.title || "Pedido").slice(0, 250),
              quantity: 1,
              currency_id: "BRL",
              unit_price: valor,
            },
          ],
          back_urls: { success: successUrl, failure: successUrl, pending: successUrl },
          auto_return: "approved",
          notification_url: notificationUrl,
          external_reference: ev.id,
          statement_descriptor: "IMPERIO CONES",
          metadata: { agenda_event_id: ev.id, source: "agenda_admin" },
        }),
      });

      const isTest = mpToken.startsWith("TEST-");
      const url = isTest ? preference.sandbox_init_point : preference.init_point;
      await c.env.DB.prepare(
        "UPDATE agenda_events SET mp_preference_id = ?, mp_init_point = ?, mp_payment_status = COALESCE(mp_payment_status, 'pending') WHERE id = ?"
      )
        .bind(preference.id, url, ev.id)
        .run();

      return c.json({ url, preferenceId: preference.id });
    }

    // 7. handle-email-unsubscribe
    if (fn === "handle-email-unsubscribe") {
      if (c.req.method === "GET") {
        const token = c.req.query("token");
        if (!token) return c.json({ valid: false, reason: "missing_token" });
        const tokRow = await c.env.DB.prepare("SELECT * FROM email_unsubscribe_tokens WHERE token = ?")
          .bind(token)
          .first<any>();
        if (!tokRow) return c.json({ valid: false, reason: "invalid_token" });
        if (tokRow.used_at) return c.json({ valid: false, reason: "already_unsubscribed" });
        return c.json({ valid: true, email: tokRow.email });
      }
      const { token } = await c.req.json();
      if (!token) return c.json({ success: false, error: "Token ausente" }, 400);
      const tokRow = await c.env.DB.prepare("SELECT * FROM email_unsubscribe_tokens WHERE token = ?")
        .bind(token)
        .first<any>();
      if (!tokRow) return c.json({ success: false, error: "Token inválido" }, 404);
      if (tokRow.used_at) return c.json({ success: false, reason: "already_unsubscribed" });
      const nowIso = new Date().toISOString();
      await c.env.DB.prepare("UPDATE email_unsubscribe_tokens SET used_at = ? WHERE id = ?")
        .bind(nowIso, tokRow.id)
        .run();
      await c.env.DB.prepare(
        "INSERT OR IGNORE INTO suppressed_emails (id, email, reason, created_at) VALUES (?, ?, 'unsubscribe', ?)"
      )
        .bind(crypto.randomUUID(), tokRow.email, nowIso)
        .run();
      await c.env.DB.prepare("UPDATE newsletter_subscribers SET active = 0 WHERE email = ?")
        .bind(tokRow.email)
        .run();
      return c.json({ success: true });
    }

    return c.json({ ok: true });
  } catch (err: any) {
    console.error(`[/api/functions/${fn}] error:`, err);
    return c.json({ error: err?.message || "Erro na função Cloudflare" }, 500);
  }
});

export const onRequest = handle(app);

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
      return app.fetch(request, env, ctx);
    }
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }
    return app.fetch(request, env, ctx);
  },
};


