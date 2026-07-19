/* Seeds the catalog (Category, Supplier, Product) with the sample data from the
 * design prototype's data.js — an admin-seeded stopgap until Phase "Seller Dashboard"
 * lets suppliers manage their own listings. Safe to re-run (upserts by slug). */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  { slug: "steel", name: "Steel & Metals", icon: "box", tag: "TMT · Sheets · Pipes" },
  { slug: "textiles", name: "Textiles & Fabrics", icon: "tag", tag: "Cotton · Denim · Yarn" },
  { slug: "packaging", name: "Packaging", icon: "box", tag: "Boxes · Films · Tapes" },
  { slug: "machinery", name: "Industrial Machinery", icon: "sliders", tag: "Pumps · CNC · Motors" },
  { slug: "electronics", name: "Electronics", icon: "spark", tag: "PCB · Cables · LEDs" },
  { slug: "chemicals", name: "Chemicals", icon: "shield", tag: "Dyes · Solvents · Resins" },
  { slug: "building", name: "Building Materials", icon: "building", tag: "Cement · Tiles · Glass" },
  { slug: "agri", name: "Agriculture", icon: "tag", tag: "Grains · Spices · Seeds" },
];

const SUPPLIERS = [
  {
    slug: "balaji",
    name: "Shree Balaji Steel Industries",
    city: "Ahmedabad, Gujarat",
    verified: true,
    trustScore: 4.7,
    reviewsCount: 1284,
    years: 14,
    responseTime: "~12 min",
    deliveryPercent: 98,
    gstNumber: "24AABCS1429N1Z5",
    phone: "+919825010001",
    tags: ["Manufacturer", "GST Verified", "TrustSEAL"],
    blurb:
      "ISO 9001 certified manufacturer of TMT bars, MS angles & structural steel. Serving infra & construction since 2011.",
    imageUrl: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&q=80",
  },
  {
    slug: "surat",
    name: "Surat Textile Mills Pvt Ltd",
    city: "Surat, Gujarat",
    verified: true,
    trustScore: 4.6,
    reviewsCount: 942,
    years: 21,
    responseTime: "~25 min",
    deliveryPercent: 96,
    gstNumber: "24AAFCS8821K1ZP",
    phone: "+919825010002",
    tags: ["Manufacturer", "GST Verified", "Export House"],
    blurb: "Greige & dyed cotton fabric mill. 40,000 m/day capacity, exporting to 14 countries.",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
  {
    slug: "rajdhani",
    name: "Rajdhani Packaging Solutions",
    city: "Faridabad, Haryana",
    verified: true,
    trustScore: 4.4,
    reviewsCount: 511,
    years: 9,
    responseTime: "~40 min",
    deliveryPercent: 94,
    gstNumber: "06AAGCR2210M1Z2",
    phone: "+919825010003",
    tags: ["Manufacturer", "GST Verified"],
    blurb: "Corrugated boxes, mono cartons & protective packaging. FSC-certified board.",
    imageUrl: "https://images.unsplash.com/photo-1607166452427-7e4477079cb9?w=800&q=80",
  },
  {
    slug: "vega",
    name: "Vega Metalworks",
    city: "Bhavnagar, Gujarat",
    verified: true,
    trustScore: 4.5,
    reviewsCount: 388,
    years: 7,
    responseTime: "~18 min",
    deliveryPercent: 95,
    gstNumber: "24AACCV9001Q1Z8",
    phone: "+919825010004",
    tags: ["Manufacturer", "GST Verified"],
    blurb: "Re-rolling mill specialising in Fe-500D & Fe-550D TMT bars and MS structurals.",
    imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
  },
  {
    slug: "deccan",
    name: "Deccan Steel Traders",
    city: "Hyderabad, Telangana",
    verified: false,
    trustScore: 4.1,
    reviewsCount: 156,
    years: 5,
    responseTime: "~1 hr",
    deliveryPercent: 91,
    gstNumber: "36AAHCD3320L1Z9",
    phone: "+919825010005",
    tags: ["Trader", "GST Verified"],
    blurb: "Authorised distributor for leading TMT & structural steel brands across South India.",
    imageUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
  },
];

const PRODUCTS = [
  {
    slug: "tmt-12mm",
    title: "TMT Steel Bars Fe-500D — 12 mm",
    supplierSlug: "balaji",
    categorySlug: "steel",
    unit: "ton",
    price: 54200,
    moq: 5,
    moqUnit: "tons",
    rating: 4.7,
    ordersLabel: "2.1k",
    verifiedProduct: true,
    specs: [
      ["Grade", "Fe-500D (IS 1786)"],
      ["Diameter", "12 mm"],
      ["Length", "12 m / custom"],
      ["Brand", "Balaji TMT"],
      ["Finish", "Ribbed / High-bond"],
    ],
    tiers: [
      ["5 – 24 tons", "₹54,200 /ton"],
      ["25 – 99 tons", "₹52,900 /ton"],
      ["100+ tons", "₹51,400 /ton"],
    ],
    description:
      "High-strength earthquake-resistant TMT rebars. Uniform ribbing for superior bonding with concrete. Mill test certificate provided with every dispatch.",
    imageUrl: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=800&q=80",
  },
  {
    slug: "tmt-16mm",
    title: "TMT Steel Bars Fe-500D — 16 mm",
    supplierSlug: "vega",
    categorySlug: "steel",
    unit: "ton",
    price: 53800,
    moq: 10,
    moqUnit: "tons",
    rating: 4.5,
    ordersLabel: "1.4k",
    verifiedProduct: true,
    specs: [
      ["Grade", "Fe-500D (IS 1786)"],
      ["Diameter", "16 mm"],
      ["Length", "12 m / custom"],
      ["Brand", "Vega Metalworks"],
      ["Finish", "Ribbed / High-bond"],
    ],
    tiers: [
      ["10 – 49 tons", "₹53,800 /ton"],
      ["50 – 199 tons", "₹52,600 /ton"],
      ["200+ tons", "₹51,200 /ton"],
    ],
    description: "Re-rolled Fe-500D TMT bars ex-works Bhavnagar, suited for RCC framed structures.",
    imageUrl: "https://images.unsplash.com/photo-1610478920392-95888b4b1a9b?w=800&q=80",
  },
  {
    slug: "tmt-8mm",
    title: "TMT Steel Bars Fe-550D — 8 mm",
    supplierSlug: "deccan",
    categorySlug: "steel",
    unit: "ton",
    price: 55600,
    moq: 20,
    moqUnit: "tons",
    rating: 4.1,
    ordersLabel: "620",
    verifiedProduct: false,
    specs: [
      ["Grade", "Fe-550D (IS 1786)"],
      ["Diameter", "8 mm"],
      ["Length", "12 m / custom"],
      ["Brand", "Branded stock"],
      ["Finish", "Ribbed / High-bond"],
    ],
    tiers: [
      ["20 – 49 tons", "₹55,600 /ton"],
      ["50+ tons", "₹54,300 /ton"],
    ],
    description: "Branded Fe-550D TMT bars, limited sizes, distributed across South India.",
    imageUrl: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80",
  },
  {
    slug: "tmt-20mm",
    title: "TMT Steel Bars Fe-500D — 20 mm",
    supplierSlug: "balaji",
    categorySlug: "steel",
    unit: "ton",
    price: 53100,
    moq: 5,
    moqUnit: "tons",
    rating: 4.7,
    ordersLabel: "980",
    verifiedProduct: true,
    specs: [
      ["Grade", "Fe-500D (IS 1786)"],
      ["Diameter", "20 mm"],
      ["Length", "12 m / custom"],
      ["Brand", "Balaji TMT"],
      ["Finish", "Ribbed / High-bond"],
    ],
    tiers: [
      ["5 – 24 tons", "₹53,100 /ton"],
      ["25 – 99 tons", "₹51,900 /ton"],
      ["100+ tons", "₹50,600 /ton"],
    ],
    description: "Heavier-gauge Fe-500D TMT bars for columns & heavy structural members.",
    imageUrl: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80",
  },
  {
    slug: "cotton-greige-40x40",
    title: "Cotton Greige Fabric — 40s × 40s",
    supplierSlug: "surat",
    categorySlug: "textiles",
    unit: "meter",
    price: 78,
    moq: 5000,
    moqUnit: "meters",
    rating: 4.6,
    ordersLabel: "5.4k",
    verifiedProduct: true,
    specs: [
      ["Count", "40s × 40s"],
      ["Width", "44 inch"],
      ["GSM", "120"],
      ["Weave", "Plain"],
      ["Use", "Shirting / Lining"],
    ],
    tiers: [
      ["5,000 – 19,999 m", "₹78 /m"],
      ["20,000 – 49,999 m", "₹74 /m"],
      ["50,000+ m", "₹71 /m"],
    ],
    description:
      "Loom-state greige cotton fabric, ready for dyeing & finishing. Consistent count and shrinkage, suitable for shirting and home textiles.",
    imageUrl: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800&q=80",
  },
  {
    slug: "corrugated-boxes-5ply",
    title: "Corrugated Shipping Boxes — 5 Ply",
    supplierSlug: "rajdhani",
    categorySlug: "packaging",
    unit: "piece",
    price: 34,
    moq: 2000,
    moqUnit: "pieces",
    rating: 4.4,
    ordersLabel: "8.9k",
    verifiedProduct: true,
    specs: [
      ["Ply", "5 Ply"],
      ["Size", "18 × 12 × 10 in"],
      ["Bursting", "8 kg/cm²"],
      ["Print", "1-colour included"],
      ["Board", "FSC kraft"],
    ],
    tiers: [
      ["2,000 – 9,999 pcs", "₹34 /pc"],
      ["10,000 – 49,999 pcs", "₹31 /pc"],
      ["50,000+ pcs", "₹28 /pc"],
    ],
    description:
      "Heavy-duty 5-ply corrugated boxes for e-commerce and industrial shipping. Edge-crush tested, customisable dimensions and branding.",
    imageUrl: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=800&q=80",
  },
];

async function main() {
  const categoryIds = new Map<string, string>();
  for (const c of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, tag: c.tag },
      create: c,
    });
    categoryIds.set(c.slug, row.id);
  }

  const supplierIds = new Map<string, string>();
  for (const s of SUPPLIERS) {
    const row = await prisma.supplier.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
    supplierIds.set(s.slug, row.id);
  }

  for (const p of PRODUCTS) {
    const { supplierSlug, categorySlug, ...rest } = p;
    const supplierId = supplierIds.get(supplierSlug)!;
    const categoryId = categoryIds.get(categorySlug)!;
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: { ...rest, supplierId, categoryId },
      create: { ...rest, supplierId, categoryId },
    });
  }

  console.log(`Seeded ${CATEGORIES.length} categories, ${SUPPLIERS.length} suppliers, ${PRODUCTS.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
