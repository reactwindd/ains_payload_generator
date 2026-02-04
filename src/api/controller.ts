// ***************************************************************
//
// Types
//

import { json } from "express";
import { OpenAI } from "openai";
import CryptoJS from "crypto-js";

// ***************************************************************
type book = {
    user: number;
    type: string;
    date: Date;
    title: string;
    bookType?: string;
    category: string;
    noOfPage?: number;
    isbn?: string;
    author: string;
    publisher: string;
    publishedYear?: string;
    language: string;
    summary: string;
    review: string;
    rating?: number;
    reviewIsVideo?: boolean;
    provider?: string;
};

// ***************************************************************
//
// api/getid
//
// ***************************************************************

export async function getID(token: string) {
    const data = await fetch("https://jombaca-api.jazro.com.my/api/users/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            Origin: "https://ains.moe.gov.my",
        },
    });

    return (await data.json()).id;
}

// ***************************************************************
//
// api/insertRecord
//
// ***************************************************************

export async function insertRecord(
    token: string,
    cookie: string,
    userid: number,
) {
    function verifyToken(token: string, originalPayload: book) {
        try {
            const bytes = CryptoJS.AES.decrypt(token, process.env.SECRET_KEY);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            const decryptedJSON = JSON.parse(decryptedText);

            // Verification logic: Check key counts and User ID
            const isMatch =
                decryptedJSON.user === originalPayload.user &&
                decryptedJSON.title === originalPayload.title;

            if (isMatch) {
                console.log(
                    "✅ VERIFICATION SUCCESS: Provider token is valid and readable.",
                );
                return true;
            } else {
                console.error("❌ VERIFICATION FAILED: Data mismatch.");
                return false;
            }
        } catch (e) {
            console.error(
                "❌ VERIFICATION ERROR: Decryption failed. Check Secret Key.",
            );
            return false;
        }
    }

    async function forgeAndVerify() {
        try {
            const response = await fetch(
                "https://bookgenerator.vercel.app/api/getbook",
            );
            const json = await response.json();
            let book = json.data;
            book.user = userid;

            // 1. Prepare internal payload
            const internal: book = {
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
            const token = CryptoJS.AES.encrypt(
                JSON.stringify(internal),
                process.env.SECRET_KEY,
            ).toString();

            // 3. Verify BEFORE outputting
            if (verifyToken(token, internal)) {
                book.provider = token;
                return JSON.stringify({ data: book }, null, 2);
            }
        } catch (error) {
            console.error("Process failed:", error);
        }
    }

    const data = await forgeAndVerify();

    const url = "https://ains-api.moe.gov.my/api/nilam-records/submit";
    const options = {
        method: "POST",
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:147.0) Gecko/20100101 Firefox/147.0",
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
        const response = await fetch(url, options);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// ***************************************************************
//
// api/getbook
//
// ***************************************************************

export async function deepReview(
    title: string,
    publishedYear: string,
    author: string,
) {
    const openai = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: process.env.DEEPSEEK_API_KEY,
    });

    const completion = await openai.chat.completions.create({
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
}

export async function deepSummary(
    title: string,
    publishedYear: string,
    author: string,
) {
    const openai = new OpenAI({
        baseURL: "https://api.deepseek.com",
        apiKey: process.env.DEEPSEEK_API_KEY,
    });

    const completion = await openai.chat.completions.create({
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
}

export async function getBook() {
    const word = await fetch("https://random-word-api.herokuapp.com/word");
    const wordDataa = await word.json();
    const wordData = wordDataa[0];
    const data = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${await wordData}`,
    );
    // const user = await fetch("https://jombaca-api.jazro.com.my/api/users/me", {
    //     method: "GET",
    //     headers: {
    //         Authorization: `Bearer ${token}`,
    //         Origin: "https://ains.moe.gov.my",
    //     },
    // });

    let book = await data.json();
    // let userData = await user.json();

    function formatDate(date: number) {
        var d = new Date(date),
            month = "" + (d.getMonth() + 1),
            day = "" + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        return [year, month, day].join("-");
    }

    function formatPublishedDate(date: string) {
        return date.slice(0, 4);
    }

    if (!book.items[0].volumeInfo.publishedDate) {
        book.items[0].volumeInfo.publishedDate = "-";
    }

    const author = book.items[0].volumeInfo.authors
        ? book.items[0].volumeInfo.authors[0]
        : "-";

    const review = await deepReview(
        book.items[0].volumeInfo.title,
        formatPublishedDate(book.items[0].volumeInfo.publishedDate),
        author,
    );

    const summary = await deepSummary(
        book.items[0].volumeInfo.title,
        formatPublishedDate(book.items[0].volumeInfo.publishedDate),
        author,
    );

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
            publishedYear: formatPublishedDate(
                book.items[0].volumeInfo.publishedDate,
            ),
            language: "en",
            summary: summary,
            review: review,
            rating: 5,
            reviewIsVideo: false,
            provider: "a",
        },
    };
}
