import { prisma } from "../lib/prisma";

type ProductParams = {
  category?: string;

  limit: number;

  snapshotTime: string;

  cursorUpdatedAt?: string;

  cursorId?: string;
};

export async function getProducts({
  category,
  limit,
  snapshotTime,
  cursorUpdatedAt,
  cursorId
}: ProductParams) {
  const snapshotDate = new Date(snapshotTime);

  const where: any = {
    updatedAt: {
      lte: snapshotDate
    }
  };

  if (category) {
    where.category = category;
  }

  if (cursorUpdatedAt && cursorId) {
    where.OR = [
      {
        updatedAt: {
          lt: new Date(cursorUpdatedAt)
        }
      },
      {
        updatedAt: new Date(cursorUpdatedAt),
        id: {
          lt: cursorId
        }
      }
    ];
  }

  const products = await prisma.product.findMany({
    where,

    orderBy: [
      {
        updatedAt: "desc"
      },
      {
        id: "desc"
      }
    ],

    take: limit + 1
  });

  let nextCursor = null;

  if (products.length > limit) {
    const last = products[limit - 1];

    nextCursor = {
      updatedAt: last!.updatedAt.toISOString(),
      id: last!.id
    };

    products.pop();
  }

  return {
    products,
    nextCursor
  };
}