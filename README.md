# Amaryllis Produtos Naturais (@amaryllisnaturais)

Plataforma oficial, catálogo digital, pedidos rápidos via WhatsApp e painel administrativo da **Amaryllis Produtos Naturais e Dietéticos e Fitoterápicos** — referência tradicional em produtos naturais, suplementação funcional, orgânicos, sem glúten e sem lactose no bairro **Jardim Guanabara, Campinas - SP**.

## Dados da Loja

- **Nome Oficial:** Amaryllis Produtos Naturais (Amaryllis Produtos Naturais e Dietéticos e Fitoterápicos)
- **Endereço:** Rua Camargo Paes, 65 — Jardim Guanabara, Campinas - SP (CEP: `13073-350`)
- **Telefone Fixo:** `(19) 3243-5982`
- **WhatsApp / Pedidos:** `(19) 99351-2766`
- **Instagram:** [@amaryllisnaturais](https://www.instagram.com/amaryllisnaturais/)
- **Facebook:** [Amaryllis Produtos Naturais](https://www.facebook.com/pages/Amaryllis-Produtos-Naturais/127817737370602)
- **Guia Gluten Free (Guindy):** [Amaryllis Produtos Naturais](https://www.guindy.com.br/place/amaryllis-produtos-naturais)
- **Parceria em Destaque:** Parceira Oficial **Essential Nutrition** em Campinas

## Identidade Visual (Botânico & Sofisticado)

- **Verde Sálvia / Botânico (`--primary`):** `#316242` (`142 33% 29%`)
- **Terracota Suave / Flor de Amarílis (`--brand-terracotta`):** `#c24f33` (`12 58% 48%`)
- **Dourado Fosco (`--brand-gold`):** `#ba8531` (`38 58% 46%`)
- **Fundo Creme / Off-White (`--background`):** `#f9f6f0` (`42 38% 97%`) com suporte completo a **Dark Mode Botânico**

## Arquitetura (React + Vite + Cloudflare)

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion.
- **Catálogo & Resiliência Local:** Dados oficiais pré-carregados em [`src/lib/amaryllisFallbackData.ts`](src/lib/amaryllisFallbackData.ts) garantindo funcionamento imediato tanto em `npm run dev` quanto integrado ao Cloudflare D1.
- **Backend / API Serverless:** **Cloudflare Pages Functions** + Hono ([`functions/api/[[path]].ts`](functions/api/[[path]].ts)).
- **Banco de Dados:** **Cloudflare D1** ([`schema.d1.sql`](schema.d1.sql)).

## Comandos Úteis

```bash
# Servidor de desenvolvimento local (http://localhost:8080)
npm run dev

# Build de produção
npm run build

# Executar testes automatizados
npm test

# Deploy para Cloudflare Pages / Worker
npx wrangler deploy
```
