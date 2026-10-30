/**
 * PWA somente para admin autenticado.
 *
 * Regras:
 * - Site público NUNCA registra service worker nem expõe manifest.
 * - Apenas dentro de /admin, e apenas quando o usuário é admin autenticado,
 *   injetamos <link rel="manifest"> e registramos o SW.
 * - Em iframe, nada é registrado — evita poluição de cache.
 * - Em logout/saída do /admin, removemos manifest e desregistramos o SW.
 */

const MANIFEST_ID = "admin-pwa-manifest";
const MANIFEST_HREF = "/admin-manifest.webmanifest";

const isPreviewOrIframe = (): boolean => {
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  return false;
};

const ensureManifestLink = () => {
  if (document.getElementById(MANIFEST_ID)) return;
  const link = document.createElement("link");
  link.id = MANIFEST_ID;
  link.rel = "manifest";
  link.href = MANIFEST_HREF;
  document.head.appendChild(link);
};

const removeManifestLink = () => {
  document.getElementById(MANIFEST_ID)?.remove();
};

let registered = false;

export const enableAdminPWA = async () => {
  if (typeof window === "undefined") return;
  if (isPreviewOrIframe()) return;
  if (!("serviceWorker" in navigator)) return;

  ensureManifestLink();

  if (registered) return;
  try {
    // O SW é gerado pelo vite-plugin-pwa em /sw.js no build.
    await navigator.serviceWorker.register("/sw.js", { scope: "/admin" });
    registered = true;
  } catch {
    // Silencioso — instalação PWA é opcional.
  }
};

export const disableAdminPWA = async () => {
  if (typeof window === "undefined") return;
  removeManifestLink();
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
  registered = false;
};

/**
 * Em qualquer contexto público (fora de /admin ou usuário não-admin),
 * garantir que NENHUM service worker antigo continue ativo.
 */
export const ensurePublicHasNoPWA = async () => {
  if (typeof window === "undefined") return;
  removeManifestLink();
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((r) => r.unregister()));
};
