import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const slug = (s: string) => slugify(s, { lower: true, strict: true });

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@singarika.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: process.env.SEED_ADMIN_NAME ?? "Store Admin",
      passwordHash: await bcrypt.hash(password, 12),
      role: "ADMIN",
    },
  });
  console.log(`Admin ready: ${admin.email}`);

  // Catalogue tree
  const tree: Record<string, string[]> = {
    "Kurtha Suruwal": ["Dhaka Kurtha Suruwal", "Cotton Kurtha Suruwal", "Party Wear"],
    Sari: ["Dhaka Sari", "Cotton Sari", "Silk Sari"],
    "Daura Suruwal": ["Daura Suruwal Sets", "Dhaka Topi"],
    "Gunyu Cholo": [],
    "Haku Patasi": [],
    "Pashmina & Shawls": ["Pashmina Shawls", "Yak Wool Shawls"],
  };

  let position = 0;
  for (const [parentName, children] of Object.entries(tree)) {
    const parent = await prisma.category.upsert({
      where: { slug: slug(parentName) },
      update: {},
      create: { name: parentName, slug: slug(parentName), position: position++ },
    });
    for (const [i, child] of children.entries()) {
      await prisma.category.upsert({
        where: { slug: slug(child) },
        update: {},
        create: { name: child, slug: slug(child), parentId: parent.id, position: i },
      });
    }
  }
  console.log("Categories seeded");

  for (const name of ["Festival Styling", "Fabric Care", "Lookbook", "Nepali Traditions"]) {
    await prisma.blogCategory.upsert({
      where: { slug: slug(name) },
      update: {},
      create: { name, slug: slug(name) },
    });
  }
  console.log("Blog categories seeded");

  // One demo product so the public API returns something immediately.
  const dhakaKurtha = await prisma.category.findUnique({
    where: { slug: slug("Dhaka Kurtha Suruwal") },
  });
  const demoSlug = "dhaka-kurtha-suruwal-with-patuka";

  if (!(await prisma.product.findUnique({ where: { slug: demoSlug } }))) {
    const product = await prisma.product.create({
      data: {
        name: "Dhaka Kurtha Suruwal with Patuka",
        slug: demoSlug,
        shortDescription: "Handwoven Dhaka cotton, stitched in Kathmandu.",
        description:
          "A kurtha suruwal cut from handwoven Dhaka cloth, woven on a pit loom in Palpa and stitched in Kathmandu. Comes with a matching patuka and shawl.",
        status: "ACTIVE",
        isFeatured: true,
        basePrice: 749900,
        compareAtPrice: 899900,
        fabric: "Dhaka",
        workType: "Dhaka weave",
        occasion: "Dashain",
        color: "Rato",
        pattern: "Dhaka geometric",
        careInstructions: "Hand wash cold, separately. Dry in shade.",
        taxRatePct: 13,
        publishedAt: new Date(),
        ...(dhakaKurtha ? { categories: { create: { categoryId: dhakaKurtha.id } } } : {}),
        variants: {
          create: {
            sku: "DHK-KUR-RED-M",
            size: "M",
            color: "Rato",
            stock: 6,
            lowStockAlert: 2,
            weightGram: 620,
          },
        },
      },
      include: { variants: true },
    });

    await prisma.stockMovement.create({
      data: {
        variantId: product.variants[0].id,
        reason: "PURCHASE",
        quantity: 6,
        stockAfter: 6,
        note: "Opening stock",
        userId: admin.id,
      },
    });
    console.log("Demo product seeded");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
