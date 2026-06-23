import { Router } from "express";
import { getProducts } from "../services/products";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);

    const category =
      req.query.category?.toString();

    const snapshotTime =
      req.query.snapshotTime?.toString() ||
      new Date().toISOString();

    const cursorUpdatedAt =
      req.query.cursorUpdatedAt?.toString();

    const cursorId =
      req.query.cursorId?.toString();

    const result = await getProducts({
      category,
      limit,
      snapshotTime,
      cursorUpdatedAt,
      cursorId
    });

    return res.json({
      snapshotTime,
      nextCursor: result.nextCursor,
      items: result.products
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Something went wrong"
    });
  }
});

export default router;