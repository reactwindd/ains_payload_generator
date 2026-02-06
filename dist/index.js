"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const route_1 = __importDefault(require("./api/route"));
require("dotenv/config");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
    console.log("Index: http://localhost:3000/api/");
    console.log("API: http://localhost:3000/api/getBook");
});
app.use("/api", route_1.default);
app.use("*", (req, res) => {
    res.status(404).json({ error: "not found" });
});
//# sourceMappingURL=index.js.map