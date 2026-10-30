/**
 * Structured data builders for Amaryllis Produtos Naturais (Campinas - SP).
 */
const SITE_NAME = "Amaryllis Produtos Naturais";

export const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthFoodStore",
  name: SITE_NAME,
  alternateName: "Amaryllis Produtos Naturais e Dietéticos e Fitoterápicos",
  description:
    "Loja tradicional no bairro Jardim Guanabara em Campinas especializada em produtos naturais, dietéticos, orgânicos, integrais, fitoterápicos, sem glúten (Gluten Free Friendly) e sem lactose. Parceira oficial Essential Nutrition.",
  url: "/",
  telephone: "+55-19-3243-5982",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Camargo Paes, 65",
    addressLocality: "Campinas",
    addressRegion: "SP",
    postalCode: "13073-350",
    addressCountry: "BR",
  },
  sameAs: [
    "https://www.instagram.com/amaryllisnaturais/",
    "https://www.facebook.com/pages/Amaryllis-Produtos-Naturais/127817737370602",
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: "/",
  description:
    "Amaryllis Produtos Naturais em Campinas: suplementos Essential Nutrition, produtos sem glúten, sem lactose, orgânicos, integrais e fitoterápicos.",
  inLanguage: "pt-BR",
  potentialAction: {
    "@type": "SearchAction",
    target: "/catalogo?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export function breadcrumbJsonLd(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url || undefined,
    })),
  };
}

export function productJsonLd(product: {
  name: string;
  description: string;
  price: string;
  image: string;
  id: string;
}) {
  const numericPrice = product.price.replace(/[^\d,]/g, "").replace(",", ".");
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    url: `/produto/${product.id}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: numericPrice || "0",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `/produto/${product.id}`,
      seller: { "@type": "Organization", name: SITE_NAME },
    },
  };
}

export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function itemListJsonLd(
  name: string,
  items: { name: string; url: string; image?: string; position: number }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      url: item.url,
      name: item.name,
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}
