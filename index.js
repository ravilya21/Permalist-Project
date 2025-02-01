import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "YOUR_PASSWORD",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let items = [
  //{ id: 1, title: "Buy milk" },
  //{ id: 2, title: "Finish homework" },
];

async function getItemsfromTable(){
   const result = await db.query("SELECT * FROM items");
   

   items = result.rows.map((row) => ({
    id: row.id,
    title: row.title,
  }));
  return items; 
};

app.get("/", async (req, res) => {
  const items = await getItemsfromTable();
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
  console.log(items);
}); 

app.post("/add", async (req, res) => {
  try {
    const item = req.body.newItem;
    
    // Ожидаем завершения запроса к базе данных
    const result = await db.query("INSERT INTO items (title) VALUES ($1) RETURNING *;", [item]);

    // Проверяем, есть ли данные
    if (result.rows.length > 0) {
      items = result.rows.map((row) => ({
        id: row.id,
        title: row.title,
      }));
    } else {
      items = [];
    }

    console.log(items);
    res.redirect("/");
  } catch (error) {
    console.error("Ошибка при добавлении элемента в БД:", error);
    res.status(500).send("Ошибка сервера");
  }
});

app.post("/edit", async (req, res) => {
  try {
    const newTitle = req.body.updatedItemTitle;
    const itemId = req.body.updatedItemId;

    await db.query("UPDATE items SET title = $1 WHERE id = $2;", [newTitle, itemId]);

    res.redirect("/");
  } catch (error) {
    console.error("Ошибка при обновлении:", error);
    res.status(500).send("Ошибка сервера");
  }
});

app.post("/delete", async (req, res) => {
  try {
    const deleteItem = req.body.deleteItemId;
    
    await db.query("DELETE FROM items WHERE id = $1;", [deleteItem]);

    res.redirect("/");
  } catch (error) {
    console.error("Ошибка при удалении:", error);
    res.status(500).send("Ошибка сервера");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
