import express, { type Request, type Response } from "express";
import productRoutes from "./routes/products";

const app = express();

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "this is the Home page. For products, go to /products endpoint"
    });
});

app.use("/products", productRoutes);

app.listen(3000, () => {
  console.log(
    "Server running on port 3000"
  );
});