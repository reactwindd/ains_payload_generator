import express, { Request, Response } from "express";
import { getID, getBook, insertRecord } from "./controller";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
router.use(express.json());

router.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        message: "Hello World!",
    });
});

router.get("/getid", async (req: Request, res: Response) => {
    let token = req.get("Authorization");
    if (!token) {
        res.status(401).json({
            error: "Unauthorized",
        });
    }
    token = token.substring(7, token.length);
    const data = await getID(token);
    res.json(data);
});

router.get("/getBook", async (req: Request, res: Response) => {
    // let token = req.get("Authorization");
    // if (!token) {
    //     res.status(401).json({
    //         error: "Unauthorized",
    //     });
    // }
    // token = token.substring(7, token.length);
    const data = await getBook();
    res.json(data);
});

router.get("/insertRecord", async (req: Request, res: Response) => {
    let token = req.get("Authorization");
    let cookie = req.get("Cookie");
    let userid = req.body.get("userid");
    if (!token) {
        res.status(401).json({
            error: "Unauthorized: Invalid Token",
        });
    }
    if (!token) {
        res.status(401).json({
            error: "Unauthorized: Invalid Cookies",
        });
    }
    token = token.substring(7, token.length);
    const data = await insertRecord(token, cookie, userid);
    res.json(data);
});

// router.get("/findPerson", async (req: Request, res: Response) => {
//     let token = req.get("Authorization");
//     if (!token) {
//         res.status(401).json({
//             error: "Unauthorized",
//         });
//     }
//     token = token.substring(7, token.length);
//     const data = await findPerson(token);
//     res.json(data);
// });

export default router;
