import {
  FaLaptopCode,
  FaHeartPulse,
  FaPalette,
  FaBriefcase,
  FaMicroscope,
  FaBuildingColumns,
  FaBookOpen,
  FaDumbbell,
  FaSeedling,
  FaWrench,
  FaPlaneDeparture,
  FaRocket,
} from "react-icons/fa6";
import { CAREER_DOMAIN_CATALOG } from "../../../shared/careerDomainCatalog.js";
import { CAREER_CATALOG } from "../../../shared/careerCatalog.js";

const DOMAIN_ICONS = Object.freeze({
  "tech-eng": FaLaptopCode,
  "med-health": FaHeartPulse,
  "arts-media": FaPalette,
  "business-ent": FaBriefcase,
  "science-res": FaMicroscope,
  "government-careers": FaBuildingColumns,
  "edu-psych": FaBookOpen,
  "sports-fit": FaDumbbell,
  "agri-env": FaSeedling,
  "trades-voc": FaWrench,
  "aviation-def": FaPlaneDeparture,
  "emerging-unconv": FaRocket,
});

export const WHEEL_DOMAIN_COLORS = Object.freeze(
  Object.fromEntries(CAREER_DOMAIN_CATALOG.map((domain) => [domain.slug, domain.color]))
);

const domainMetadataBySlug = new Map(CAREER_DOMAIN_CATALOG.map((domain) => [domain.slug, domain]));

export const CAREER_DOMAINS = CAREER_CATALOG.map((domain) => {
  const metadata = domainMetadataBySlug.get(domain.domainSlug);
  return {
    ...domain,
    id: domain.domainSlug,
    slug: domain.domainSlug,
    icon: DOMAIN_ICONS[domain.domainSlug],
    title: metadata.name,
    description: metadata.description,
    color: metadata.color,
    careers: domain.careers.map(({ name, desc }) => ({ name, desc })),
  };
});
