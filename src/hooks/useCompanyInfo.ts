import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";

const KEYS = [
  "site_name",
  "site_cnpj",
  "site_phone",
  "site_whatsapp",
  "site_email",
  "site_address",
] as const;

export interface CompanyInfo {
  companyName: string;
  cnpj: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
}

const DEFAULTS: CompanyInfo = {
  companyName: AMARYLLIS_COMPANY.companyName,
  cnpj: "",
  phone: AMARYLLIS_COMPANY.phone,
  whatsapp: AMARYLLIS_COMPANY.whatsapp,
  email: AMARYLLIS_COMPANY.email,
  address: AMARYLLIS_COMPANY.address,
};

const isLegacyValue = (val?: string) => {
  if (!val) return true;
  const lower = val.toLowerCase();
  return (
    lower.includes("mr. cone") ||
    lower.includes("império cones") ||
    lower.includes("imperio cones") ||
    lower.includes("992794237") ||
    lower.includes("9.9279-4237") ||
    lower.includes("978245024")
  );
};

export const useCompanyInfo = () => {
  const { data } = useQuery({
    queryKey: ["company-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key,value")
        .in("key", KEYS as unknown as string[]);
      if (error) return DEFAULTS;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => {
        if (r.value) map[r.key] = r.value;
      });
      const info: CompanyInfo = {
        companyName: !isLegacyValue(map.site_name) ? map.site_name : DEFAULTS.companyName,
        cnpj: map.site_cnpj || DEFAULTS.cnpj,
        phone: !isLegacyValue(map.site_phone) ? map.site_phone : DEFAULTS.phone,
        whatsapp: !isLegacyValue(map.site_whatsapp) ? map.site_whatsapp : DEFAULTS.whatsapp,
        email: !isLegacyValue(map.site_email) ? map.site_email : DEFAULTS.email,
        address: !isLegacyValue(map.site_address) ? map.site_address : DEFAULTS.address,
      };
      return info;
    },
    staleTime: 5 * 60 * 1000,
  });

  return data || DEFAULTS;
};
