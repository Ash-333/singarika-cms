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
    Sarees: ["Kanjivaram Silk", "Banarasi Silk", "Cotton Sarees", "Georgette Sarees"],
    "Lehenga Cholis": ["Bridal Lehengas", "Festive Lehengas"],
    "Kurta Sets": ["Anarkali", "Straight Kurta Sets", "Palazzo Sets"],
    "Salwar Suits": ["Unstitched Suits", "Readymade Suits"],
    Dupattas: [],
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

  for (const name of ["Styling Guides", "Fabric Care", "Lookbook", "Traditions"]) {
    await prisma.blogCategory.upsert({
      where: { slug: slug(name) },
      update: {},
      create: { name, slug: slug(name) },
    });
  }
  console.log("Blog categories seeded");

  // One demo product so the public API returns something immediately.
  const kanjivaram = await prisma.category.findUnique({ where: { slug: slug("Kanjivaram Silk") } });
  const demoSlug = "kanjivaram-silk-saree-with-zari-border";

  if (!(await prisma.product.findUnique({ where: { slug: demoSlug } }))) {
    const product = await prisma.product.create({
      data: {
        name: "Kanjivaram Silk Saree with Zari Border",
        slug: demoSlug,
        shortDescription: "Handwoven pure silk saree with a contrast zari border.",
        description:
          "A classic Kanjivaram woven in pure mulberry silk, finished with a contrast temple border in real zari. Comes with an unstitched blouse piece.",
        status: "ACTIVE",
        isFeatured: true,
        basePrice: 1249900,
        compareAtPrice: 1599900,
        fabric: "Kanjivaram Silk",
        workType: "Zari",
        occasion: "Bridal",
        color: "Red",
        pattern: "Temple Border",
        careInstructions: "Dry clean only. Store wrapped in muslin.",
        taxRatePct: 5,
        publishedAt: new Date(),
        ...(kanjivaram ? { categories: { create: { categoryId: kanjivaram.id } } } : {}),
        variants: {
          create: {
            sku: "SAR-KJV-RED-FS",
            size: "Free Size",
            color: "Red",
            stock: 6,
            lowStockAlert: 2,
            weightGram: 850,
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
