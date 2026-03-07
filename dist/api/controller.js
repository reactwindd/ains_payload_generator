"use strict";
// ***************************************************************
//
// Types
//
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBook = exports.deepSummary = exports.deepReview = exports.insertRecord = exports.getID = void 0;
const openai_1 = require("openai");
const crypto_js_1 = __importDefault(require("crypto-js"));
// ***************************************************************
//
// api/getid
//
// ***************************************************************
function getID(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fetch("https://jombaca-api.jazro.com.my/api/users/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Origin: "https://ains.moe.gov.my",
            },
        });
        return (yield data.json()).id;
    });
}
exports.getID = getID;
// ***************************************************************
//
// api/insertRecord
//
// ***************************************************************
function insertRecord(token, cookie, userid) {
    return __awaiter(this, void 0, void 0, function* () {
        function verifyToken(token, originalPayload) {
            try {
                const bytes = crypto_js_1.default.AES.decrypt(token, process.env.SECRET_KEY);
                const decryptedText = bytes.toString(crypto_js_1.default.enc.Utf8);
                const decryptedJSON = JSON.parse(decryptedText);
                // Verification logic: Check key counts and User ID
                const isMatch = decryptedJSON.user === originalPayload.user &&
                    decryptedJSON.title === originalPayload.title;
                if (isMatch) {
                    console.log("✅ VERIFICATION SUCCESS: Provider token is valid and readable.");
                    return true;
                }
                else {
                    console.error("❌ VERIFICATION FAILED: Data mismatch.");
                    return false;
                }
            }
            catch (e) {
                console.error("❌ VERIFICATION ERROR: Decryption failed. Check Secret Key.");
                return false;
            }
        }
        function forgeAndVerify() {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield fetch("https://bookgenerator.vercel.app/api/getbook");
                    const json = yield response.json();
                    let book = json.data;
                    book.user = userid;
                    // 1. Prepare internal payload
                    const internal = {
                        user: book.user,
                        type: book.type,
                        date: book.date,
                        title: book.title,
                        category: book.category,
                        author: book.author,
                        publisher: book.publisher,
                        language: book.language,
                        summary: book.summary,
                        review: book.review,
                    };
                    // 2. Generate Token
                    const token = crypto_js_1.default.AES.encrypt(JSON.stringify(internal), process.env.SECRET_KEY).toString();
                    // 3. Verify BEFORE outputting
                    if (verifyToken(token, internal)) {
                        book.provider = token;
                        return JSON.stringify({ data: book }, null, 2);
                    }
                }
                catch (error) {
                    console.error("Process failed:", error);
                }
            });
        }
        const data = yield forgeAndVerify();
        const url = "https://ains-api.moe.gov.my/api/nilam-records/submit";
        const options = {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0",
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br, zstd",
                Authorization: "Bearer TOKEN",
                Origin: "https://ains.moe.gov.my",
                Referer: "https://ains.moe.gov.my/",
                Cookie: "koa.sess...",
                "Content-Type": "application/json",
            },
            body: data,
        };
        try {
            const response = yield fetch(url, options);
            const data = yield response.json();
            console.log(data);
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.insertRecord = insertRecord;
// ***************************************************************
//
// api/getbook
//
// ***************************************************************
function deepReview(title, publishedYear, author) {
    return __awaiter(this, void 0, void 0, function* () {
        const openai = new openai_1.OpenAI({
            baseURL: "https://api.deepseek.com",
            apiKey: process.env.DEEPSEEK_API_KEY,
        });
        const completion = yield openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `
Write a 15-word review of ${title} published ${publishedYear} by ${author} in perspective of a primary school learner non native speaker tone. Use only:
- Letters, commas, periods, and basic punctuation
- No line breaks (\n), asterisks, or special formatting
- Exactly 25 words
- Simple English words (A0 level)`,
                },
            ],
            model: "deepseek-chat",
            response_format: {
                type: "text",
            },
        });
        let result = completion.choices[0].message.content;
        result = result.replace(/\\|\*|_/g, "");
        return result;
    });
}
exports.deepReview = deepReview;
function deepSummary(title, publishedYear, author) {
    return __awaiter(this, void 0, void 0, function* () {
        const openai = new openai_1.OpenAI({
            baseURL: "https://api.deepseek.com",
            apiKey: process.env.DEEPSEEK_API_KEY,
        });
        const completion = yield openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `
Write a 15-word summary of ${title} published ${publishedYear} by ${author} in perspective of a primary school learner non native speaker tone. Use only:
- Letters, commas, periods, and basic punctuation
- No line breaks (\n), asterisks, or special formatting
- Exactly 15 words
- Simple English words (A0 level)`,
                },
            ],
            model: "deepseek-chat",
            response_format: {
                type: "text",
            },
        });
        let result = completion.choices[0].message.content;
        result = result.replace(/\\|\*|_/g, "");
        return result;
    });
}
exports.deepSummary = deepSummary;
function getBook() {
    return __awaiter(this, void 0, void 0, function* () {
        const word = yield fetch("https://pineappleacorn.vercel.app/word", {
            method: "GET",
        });
        const wordDataa = yield word.json();
        const wordData = wordDataa.word;
        const data = yield fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${yield wordData}&key=${process.env.GOOGLE_BOOK_API}`);
        let book = yield data.json();
        function formatDate(date) {
            var d = new Date(date), month = "" + (d.getMonth() + 1), day = "" + d.getDate(), year = d.getFullYear();
            if (month.length < 2)
                month = "0" + month;
            if (day.length < 2)
                day = "0" + day;
            return [year, month, day].join("-");
        }
        function formatPublishedDate(date) {
            return date.slice(0, 4);
        }
        if (!book.items[0].volumeInfo.publishedDate) {
            book.items[0].volumeInfo.publishedDate = "-";
        }
        const author = book.items[0].volumeInfo.authors
            ? book.items[0].volumeInfo.authors[0]
            : "-";
        const review = yield deepReview(book.items[0].volumeInfo.title, formatPublishedDate(book.items[0].volumeInfo.publishedDate), author);
        const summary = yield deepSummary(book.items[0].volumeInfo.title, formatPublishedDate(book.items[0].volumeInfo.publishedDate), author);
        return {
            data: {
                user: "NaN",
                type: "book",
                date: formatDate(Date.now()),
                title: book.items[0].volumeInfo.title,
                bookType: "physical",
                category: "fiction",
                noOfPage: book.items[0].volumeInfo.pageCount
                    ? book.items[0].volumeInfo.pageCount
                    : 0,
                isbn: book.items[0].volumeInfo.industryIdentifiers
                    ? book.items[0].volumeInfo.industryIdentifiers[0].identifier
                    : "-",
                author: book.items[0].volumeInfo.authors
                    ? book.items[0].volumeInfo.authors[0]
                    : "-",
                publisher: book.items[0].volumeInfo.publisher
                    ? book.items[0].volumeInfo.publisher
                    : "-",
                publishedYear: formatPublishedDate(book.items[0].volumeInfo.publishedDate),
                language: "en",
                summary: summary,
                review: review,
                rating: 5,
                reviewIsVideo: false,
                provider: "a",
            },
        };
    });
}
exports.getBook = getBook;
//# sourceMappingURL=controller.js.map