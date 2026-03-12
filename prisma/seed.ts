import { PrismaClient, UserRole, StockLocation, ListingStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ── Admin user ────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@galerie-antiquites.fr" },
    update: {},
    create: {
      email: "admin@galerie-antiquites.fr",
      name: "Administrateur",
      role: UserRole.ADMIN,
      password: await bcrypt.hash("admin123!", 12),
      emailVerified: new Date(),
    },
  });
  console.log("✅ Admin created:", admin.email);

  // ── Vendor user ───────────────────────────────────────────
  const vendor = await prisma.user.upsert({
    where: { email: "vendeur@galerie-antiquites.fr" },
    update: {},
    create: {
      email: "vendeur@galerie-antiquites.fr",
      name: "Maison Dupont Antiquités",
      role: UserRole.VENDOR,
      password: await bcrypt.hash("vendeur123!", 12),
      emailVerified: new Date(),
      vendorProfile: {
        create: {
          businessName: "Maison Dupont Antiquités",
          description:
            "Spécialiste en mobilier et objets d'art du XVIIIe et XIXe siècle.",
          city: "Paris",
          country: "France",
          isVerified: true,
          verifiedAt: new Date(),
        },
      },
    },
  });
  console.log("✅ Vendor created:", vendor.email);

  // ── Buyer user ────────────────────────────────────────────
  const buyer = await prisma.user.upsert({
    where: { email: "acheteur@test.fr" },
    update: {},
    create: {
      email: "acheteur@test.fr",
      name: "Sophie Martin",
      role: UserRole.BUYER,
      password: await bcrypt.hash("acheteur123!", 12),
      emailVerified: new Date(),
    },
  });
  console.log("✅ Buyer created:", buyer.email);

  // ── Categories ────────────────────────────────────────────
  const categories = [
    {
      name: "Mobilier",
      nameEn: "Furniture",
      slug: "mobilier",
      order: 1,
    },
    {
      name: "Tableaux & Peintures",
      nameEn: "Paintings",
      slug: "tableaux-peintures",
      order: 2,
    },
    {
      name: "Sculptures & Bronzes",
      nameEn: "Sculptures",
      slug: "sculptures-bronzes",
      order: 3,
    },
    {
      name: "Arts Décoratifs",
      nameEn: "Decorative Arts",
      slug: "arts-decoratifs",
      order: 4,
    },
    {
      name: "Céramique & Porcelaine",
      nameEn: "Ceramics & Porcelain",
      slug: "ceramique-porcelaine",
      order: 5,
    },
    {
      name: "Argenterie & Orfèvrerie",
      nameEn: "Silver & Goldsmithing",
      slug: "argenterie-orfevrerie",
      order: 6,
    },
    {
      name: "Livres & Manuscrits",
      nameEn: "Books & Manuscripts",
      slug: "livres-manuscrits",
      order: 7,
    },
    {
      name: "Bijoux & Montres",
      nameEn: "Jewelry & Watches",
      slug: "bijoux-montres",
      order: 8,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log("✅ Categories created:", categories.length);

  // ── Sample listings ───────────────────────────────────────
  const mobilier = await prisma.category.findUnique({
    where: { slug: "mobilier" },
  });
  const tableaux = await prisma.category.findUnique({
    where: { slug: "tableaux-peintures" },
  });
  const sculptures = await prisma.category.findUnique({
    where: { slug: "sculptures-bronzes" },
  });

  const sampleListings = [
    {
      title: "Commode Louis XV en marqueterie",
      slug: "commode-louis-xv-marqueterie-001",
      description: `Magnifique commode d'époque Louis XV en bois de violette et bois de rose en marqueterie de fleurs.

Deux tiroirs sans traverse. Plateau de marbre brèche d'Alep d'origine. Entrées de serrures et sabots en bronze doré finement ciselés.

Restaurations anciennes d'usage. Estampille illisible.

France, vers 1755-1760.`,
      provenance:
        "Collection particulière parisienne. Transmis dans la même famille depuis le XIXe siècle.",
      period: "XVIIIe siècle",
      origin: "France",
      dimensions: "H: 87 cm, L: 122 cm, P: 58 cm",
      weight: "45 kg",
      condition: "Très bon état général, restaurations d'ancienneté",
      materials: "Bois de violette, bois de rose, bronze doré, marbre",
      price: 12500,
      stockLocation: StockLocation.AT_VENDOR,
      status: ListingStatus.LIVE,
      categoryId: mobilier?.id,
      publishedAt: new Date(),
      shippingAvailable: true,
      shippingCost: 250,
    },
    {
      title: "Portrait de gentilhomme, huile sur toile",
      slug: "portrait-gentilhomme-huile-toile-002",
      description: `Portrait d'un gentilhomme en habit sombre, tenant une lettre cachetée.

Huile sur toile, travail flamand du XVIIe siècle dans le goût de l'école d'Anvers.
Fond sombre caractéristique de la période. Belle qualité de rendu psychologique du sujet.

Ancien cadre doré à l'or fin, époque.`,
      provenance:
        "Acquis lors d'une vente aux enchères à Bruxelles en 1987. Collection privée belge.",
      period: "XVIIe siècle",
      origin: "Flandres",
      dimensions: "H: 92 cm, L: 74 cm (avec cadre: H: 110 cm, L: 92 cm)",
      condition: "Bon état, légère restauration au niveau du cou",
      materials: "Huile sur toile, cadre bois doré",
      price: 8900,
      stockLocation: StockLocation.AT_RESIDENCE,
      status: ListingStatus.LIVE,
      categoryId: tableaux?.id,
      publishedAt: new Date(),
      shippingAvailable: true,
      shippingCost: 180,
    },
    {
      title: "Pendule Empire en bronze doré et marbre",
      slug: "pendule-empire-bronze-dore-marbre-003",
      description: `Pendule de cheminée d'époque Empire représentant Minerve assise sur un socle de colonnes doriques.

Mouvement à sonnerie sur timbre, signé "Breguet à Paris".
Boîtier en bronze finement ciselé et doré au feu. Socle en marbre vert de mer.

Parfait état de marche, révisé récemment par un horloger spécialisé.`,
      provenance: "Château du Périgord, vente notariale 2018.",
      period: "XIXe siècle - Empire",
      origin: "France",
      dimensions: "H: 48 cm, L: 35 cm, P: 15 cm",
      weight: "8.5 kg",
      condition: "Excellent état, fonctionne parfaitement",
      materials: "Bronze doré au feu, marbre vert de mer, émail",
      price: 4200,
      stockLocation: StockLocation.AT_VENDOR,
      status: ListingStatus.LIVE,
      categoryId: sculptures?.id,
      publishedAt: new Date(),
      shippingAvailable: true,
      shippingCost: 95,
    },
    {
      title: "Bureau plat Louis XVI en acajou",
      slug: "bureau-plat-louis-xvi-acajou-004",
      description: `Bureau plat de style Louis XVI en acajou massif et placage.

Trois tiroirs en ceinture, quincaillerie en bronze doré ciselé à motifs de feuilles d'acanthe.
Dessus de cuir vert d'origine, légèrement usé mais complet.

Pieds fuselés cannelés en gaine, sabots en bronze.

Attribution probable à l'ébéniste parisien Jean-Henri Riesener (cercle de).`,
      provenance:
        "Succession familiale lyonnaise. Dans la même famille depuis 1890.",
      period: "XVIIIe siècle - Louis XVI",
      origin: "Paris, France",
      dimensions: "H: 76 cm, L: 180 cm, P: 90 cm",
      weight: "85 kg",
      condition: "Très bon état, cuir d'origine légèrement patine",
      materials: "Acajou, bronze doré, cuir",
      price: 18500,
      stockLocation: StockLocation.AT_RESIDENCE,
      status: ListingStatus.PENDING_REVIEW,
      categoryId: mobilier?.id,
      shippingAvailable: true,
      shippingCost: 350,
    },
  ];

  for (const listingData of sampleListings) {
    const { categoryId, ...data } = listingData;
    await prisma.listing.upsert({
      where: { slug: data.slug },
      update: {},
      create: {
        ...data,
        price: data.price,
        shippingCost: data.shippingCost,
        vendorId: vendor.id,
        ...(categoryId ? { categoryId } : {}),
        images: {
          create: [
            {
              url: `https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80`,
              publicId: `seed_${data.slug}_1`,
              isPrimary: true,
              order: 0,
              uploadedBy: vendor.id,
            },
            {
              url: `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80`,
              publicId: `seed_${data.slug}_2`,
              isPrimary: false,
              order: 1,
              uploadedBy: vendor.id,
            },
          ],
        },
      },
    });
  }
  console.log("✅ Sample listings created:", sampleListings.length);

  console.log("\n🎉 Seed complete!\n");
  console.log("Credentials:");
  console.log("  Admin:  admin@galerie-antiquites.fr / admin123!");
  console.log("  Vendor: vendeur@galerie-antiquites.fr / vendeur123!");
  console.log("  Buyer:  acheteur@test.fr / acheteur123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
