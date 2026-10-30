import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  keywords?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = "Amaryllis Produtos Naturais";
const DEFAULT_DESCRIPTION =
  "Amaryllis Produtos Naturais no Jardim Guanabara, Campinas - SP (Rua Camargo Paes, 65). Produtos naturais, dietéticos, orgânicos, integrais, fitoterápicos, sem glúten e sem lactose. Parceira oficial Essential Nutrition.";
const DEFAULT_KEYWORDS =
  "amaryllis produtos naturais, produtos naturais campinas, jardim guanabara campinas, essential nutrition campinas, sem gluten campinas, sem lactose campinas, fitoterapicos campinas, suplementos campinas";

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  url,
  type = "website",
  noIndex = false,
  keywords = DEFAULT_KEYWORDS,
  jsonLd,
}: SEOProps) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Suplementos, Sem Glúten, Orgânicos e Fitoterápicos em Campinas`;
  const currentUrl =
    url ||
    (typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "/");
  const ogImage = image || undefined;

  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      <meta
        name="robots"
        content={
          noIndex
            ? "noindex, nofollow"
            : "index, follow, max-image-preview:large, max-snippet:-1"
        }
      />
      <meta
        name="googlebot"
        content={noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}
      />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogImage && <meta property="og:image:width" content="1200" />}
      {ogImage && <meta property="og:image:height" content="630" />}
      {ogImage && <meta property="og:image:alt" content={fullTitle} />}
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {ogImage && <meta name="twitter:image:alt" content={fullTitle} />}

      {/* JSON-LD */}
      {jsonLdArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
