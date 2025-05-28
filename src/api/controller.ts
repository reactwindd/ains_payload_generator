// ***************************************************************
//
// Types
//

import { json } from "express";
import { OpenAI } from "openai";

// ***************************************************************
type book = {
    user: number;
    type: string;
    date: Date;
    title: string;
    bookType: string;
    category: string;
    noOfPage: number;
    isbn: string;
    author: string;
    publisher: string;
    publishedYear: string;
    language: string;
    summary: string;
    review: string;
    rating: number;
    reviewIsVideo: boolean;
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
// api/getbook
//
// ***************************************************************
export async function deepReview(
    title: string,
    publishedYear: string,
    author: string
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
Write a 30-word review of "${title}" published ${publishedYear} by ${author}. Use only:
- Letters, commas, periods, and basic punctuation
- No line breaks (\n), asterisks, or special formatting
- Exactly 30 words
- Simple English words (B1 level)`,
            },
        ],
        model: "deepseek-chat",
        response_format: {
            type: "text",
        },
    });

    let result = completion.choices[0].message.content;
    console.log(result);
    result = result.replace(/\\|\*|_/g, "");
    console.log(result);

    return result;
}

export async function getBook() {
    const word = await fetch("https://random-word-api.vercel.app/api?words=1");
    const wordDataa = await word.json();
    const wordData = wordDataa[0];
    const data = await fetch(
        `https://www.googleapis.com/books/v1/volumes/?q=${await wordData}`
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

    // **********************************************************
    //
    // Only For Debugging Purposes
    //
    // **********************************************************
    // console.log({
    //     data: {
    //         user: userData.id,
    //         type: "book",
    //         date: formatDate(Date.now()),
    //         title: book.items[0].volumeInfo.title,
    //         bookType: "physical",
    //         category: "fiction",
    //         noOfPage: book.items[0].volumeInfo.pageCount
    //             ? book.items[0].volumeInfo.pageCount
    //             : 0,
    //         isbn: book.items[0].volumeInfo.industryIdentifiers
    //             ? book.items[0].volumeInfo.industryIdentifiers[0].identifier
    //             : "-",
    //         author: book.items[0].volumeInfo.authors
    //             ? book.items[0].volumeInfo.authors[0]
    //             : "-",
    //         publisher: book.items[0].volumeInfo.publisher
    //             ? book.items[0].volumeInfo.publisher
    //             : "-",
    //         publishedYear: formatPublishedDate(
    //             book.items[0].volumeInfo.publishedDate
    //         ),
    //         language: "en",
    //         summary: book.items[0].volumeInfo.description
    //             ? book.items[0].volumeInfo.description
    //             : "No Description",
    //         review: "It's Really Good",
    //         rating: 5,
    //         reviewIsVideo: false,
    //     },
    // });
    const authorR = book.items[0].volumeInfo.authors
        ? book.items[0].volumeInfo.authors[0]
        : "-";

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
                book.items[0].volumeInfo.publishedDate
            ),
            language: "en",
            summary: book.items[0].volumeInfo.description
                ? book.items[0].volumeInfo.description
                : "No Description",
            review: await deepReview(
                book.items[0].volumeInfo.title,
                formatPublishedDate(book.items[0].volumeInfo.publishedDate),
                authorR
            ),
            rating: 5,
            reviewIsVideo: false,
        },
    };
}

// ***************************************************************
//
// api/insertRecord
//
// ***************************************************************

// export async function insertRecord(token: string): Promise<book> {
//     const user = await fetch("https://jombaca-api.jazro.com.my/api/users/me", {
//         method: "GET",
//         headers: {
//             Authorization: `Bearer ${token}`,
//             Origin: "https://ains.moe.gov.my",
//         },
//     });

// const book = await getBook(token);
// console.log(book);

// let bookData = book;
// let userData = await user.json();
// console.log(bookData);

// let body = JSON.stringify({
//     data: {
//         user: userData.id,
//         type: "book",
//         date: bookData.data.date,
//         title: bookData.data.title,
//         bookType: "physical",
//         category: "fiction",
//         noOfPage: bookData.data.noOfPage,
//         isbn: bookData.data.isbn,
//         author: bookData.data.author,
//         publisher: bookData.data.publisher,
//         publishedYear: bookData.data.publishedYear,
//         language: "en",
//         summary: bookData.data.summary,
//         review: "It's Really Good",
//         rating: 5,
//         reviewIsVideo: false,
//     },
// });

//     const data = await fetch(
//         "https://jombaca-api.jazro.com.my/api/nilam-records",
//         {
//             method: "POST",
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 Origin: "https://ains.moe.gov.my",
//                 "Content-Type": "application/json",
//                 Accept: "application/json, text/plain, */*",
//             },
//             // body: body,
//         }
//     );

//     let result = await data.json();

//     return result;
// }

// export async function findPerson(token: string) {
//     const data = await fetch(
//         "https://jombaca-api.jazro.com.my/api/nilam-records?sort[-1]=createdAt&populate=*",
//         {
//             method: "GET",
//             headers: {
//                 Authorization: `Bearer ${token}`,
//                 Origin: "https://ains.moe.gov.my",
//             },
//         }
//     );
//     const result = await data.json();
//     return result;
// }
