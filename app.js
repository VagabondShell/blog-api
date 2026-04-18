import express from "express";
import "dotenv/config";
import indexRouter from "./routes/indexRouter.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(indexRouter);

// 6. Server Initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
