import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "library",
  password: "password",
  port: 5432,
});

db.connect();

async function getBooks() {
  let books = [];
  let result = await db.query(
    `SELECT * FROM book JOIN book_information ON book.isbn = book_information.isbn`
  );
  // Push information into an array to be iterated through on the client side.
  result.rows.forEach((book) => {
    books.push(book);
  });
  return books;
}

async function getSortedBooks(option) {
  let books = [];
  let result = await db.query(
    `SELECT * FROM book JOIN book_information ON book.isbn = book_information.isbn ${option}`
  );
  // Push information into an array to be iterated through on the client side.
  result.rows.forEach((book) => {
    books.push(book);
  });
  return books;
}

app.get("/", async (req, res) => {
  const result = await getBooks();
  console.log(result);
  res.render("index.ejs", { book: result });
});

app.post("/sort", async (req, res) => {
  // This is a POST method because information is being requested.
  const sort = req.body.sortBy;
  const result = await getSortedBooks(sort);
  res.render("index.ejs", { book: result });
});

app.post("/detail", async (req, res) => {
  // This method grabs the ISBN from the request and makes a database request to grab the information for that specific entry.
  // It then passes the information to another screen that renders the entry details in full.
  const isbn = req.body.isbnValue;
  console.log(isbn);
  const result = await db.query(
    `SELECT * FROM book JOIN book_information ON book.isbn = book_information.isbn WHERE book_information.isbn = $1`,
    [isbn]
  );
  console.log(result.rows);
  res.render("detail.ejs", { isbn: isbn, book: result.rows });
});

app.post("/add", async (req, res) => {
  // Grab the information from the client side and insert the new values.
  console.log(req.body.startNew);
  if (req.body.startNew == "Add book") {
    const error = "";
    res.render("add.ejs", { error });
  } else {
    const title = req.body.title;
    console.log(title);
    const isbn = req.body.isbn;
    console.log(isbn);
    const date_completed = req.body.date_completed;
    console.log(date_completed);
    const rating = req.body.rating;
    console.log(rating);
    const genre = req.body.genre;
    console.log(genre);
    let review = req.body.review;
    if (review == "") {
      review = "Still mulling over my thoughts...";
    }
    console.log(review);
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;

    //Try and catch error handling. Need an ISBN and Title - No blanks
    try {
      await db.query(
        `INSERT INTO book (isbn, title) VALUES (${isbn}, '${title}')`
      );
      try {
        await db.query(
          "INSERT INTO book_information (isbn, date_completed, rating, genre, review, url) VALUES ($1, ($2), $3, ($4), ($5), ($6))",
          [isbn, date_completed, rating, genre, review, url]
        );
        res.redirect("/");
      } catch (err) {
        console.log("Fields cannot be blank.");
        const error = "Fields cannot be blank.";
        res.render("add.ejs", { error });
      }
    } catch (err) {
      console.log("Fields cannot be blank or duplicate ISBN.");
      const error = "Fields cannot be blank or duplicate ISBN.";
      res.render("add.ejs", { error });
    }
  }
});

app.post("/edit", async (req, res) => {
  // Pulling the new review and rating from the client side and updating the table using the ISBN.
  const newReview = req.body.updatedReview;
  const newRating = req.body.updatedRating;
  console.log(newReview);
  console.log(newRating);
  const isbn = req.body.isbnValue;
  db.query("UPDATE book_information SET review = ($1) WHERE isbn = $2", [
    newReview,
    isbn,
  ]);
  db.query("UPDATE book_information SET rating = $1 WHERE isbn = $2", [
    newRating,
    isbn,
  ]);

  // Reload the same page again. This is the same as "/detail".
  const result = await db.query(
    `SELECT * FROM book JOIN book_information ON book.isbn = book_information.isbn WHERE book_information.isbn = $1`,
    [isbn]
  );
  res.render("detail.ejs", { isbn: isbn, book: result.rows });
});

app.post("/delete", (req, res) => {
  // Grabbing the ISBN of the book
  const isbn = req.body.isbnValue;
  // Deleting the row with the id grabbed from above. First from the child (FK) and then from the parent (PK)
  db.query(`DELETE FROM book_information WHERE isbn = ${isbn}`);
  db.query(`DELETE FROM book WHERE isbn = ${isbn}`);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});

//Below is code to redo the ISBN (the primary key)
//
//ALTER TABLE book_information DISABLE TRIGGER ALL;
//ALTER TABLE book DISABLE TRIGGER ALL;
//UPDATE book SET isbn = 1338878921 WHERE isbn = 9780590353427;
//UPDATE book_information SET isbn = 1338878921 WHERE isbn = 9780590353427;
//ALTER TABLE book_information ENABLE TRIGGER ALL;
//ALTER TABLE book ENABLE TRIGGER ALL;
