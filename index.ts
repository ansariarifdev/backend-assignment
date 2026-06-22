import express, { type Request, type Response } from "express";
import { prisma } from "./lib/prisma";

const app = express();

app.get("/", async (req: Request, res: Response) => {
    const data = await prisma.product.findMany();
    if(data) {
        console.log(data);
    } else {
        console.log("not data");
    }

    res.status(200).json({
        message: "this is the Home page"
    })
});

app.listen(3000, () => {
    console.log('Server is listening on the PORT: 3000');
});