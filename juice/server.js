import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// 静的ファイルの提供
app.use(express.static(__dirname));

// ルートへのアクセスでindex.htmlを返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// サーバーの起動
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});