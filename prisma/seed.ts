import {prisma} from "../lib/prisma.ts";

async function main() {
  console.log("Seeding...");

  const categoryNames = [
    "Electronics",
    "Books",
    "Fashion",
    "Sports",
    "Furniture",
    "Gaming",
    "Mobile",
    "Beauty",
    "Food",
    "Automotive"
  ];

  const categories = [];

  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: {
        name
      }
    });

    categories.push(category);
  }

  const BATCH_SIZE = 5000;
  const TOTAL_PRODUCTS = 200000;

  for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
    const products = [];

    for (let j = 0; j < BATCH_SIZE; j++) {
      const category =
        categories[Math.floor(Math.random() * categories.length)];

      products.push({
        name: `Product-${i + j}`,
        price: Number((Math.random() * 1000).toFixed(2)),
        categoryId: category!.id
      });
    }

    await prisma.product.createMany({
      data: products
    });

    console.log(`Inserted ${i + BATCH_SIZE}`);
  }

  console.log("Done");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });