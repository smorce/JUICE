import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import https from 'https';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// SSL/TLS証明書の読み込み
const options = {
  key: fs.readFileSync('juice/server.key'),
  cert: fs.readFileSync('juice/server.crt'),
};

// CORSミドルウェアの設定
app.use(cors({
  origin: '*', // 開発中は全てのオリジンを許可（本番環境ではより制限的に設定すべき）
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// multerの設定
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'juice/assets/') // アップロードされたファイルの保存先
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname) // ファイル名の設定
  }
});

const upload = multer({ storage: storage });

// JSONボディパーサーの設定
app.use(express.json());

// 静的ファイルの提供
app.use(express.static(__dirname));
app.use('/juice/assets', express.static('juice/assets')); // アップロードされたファイルへのアクセスを許可

// ルートへのアクセスでindex.htmlを返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ファイルアップロードのエンドポイント。音声ファイルのアップロード処理
app.post('/upload-audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('ファイルがアップロードされていません。');
  }
  
  const audioPath = `${req.protocol}://${req.get('host')}/juice/assets/${req.file.filename}`;
  res.json({ audioPath });
});

// 一時ファイルのクリーンアップ（例：1時間ごと）
setInterval(() => {
  const directory = 'juice/assets/';
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.stat(path.join(directory, file), (err, stat) => {
        if (err) throw err;

        const now = new Date().getTime();
        const endTime = new Date(stat.ctime).getTime() + 3600000; // 1時間後

        if (now > endTime) {
          fs.unlink(path.join(directory, file), err => {
            if (err) throw err;
            console.log(`Deleted ${file}`);
          });
        }
      });
    }
  });
}, 3600000); // 1時間ごとに実行

// HTTPSサーバーの作成と起動
https.createServer(options, app).listen(port, () => {
  console.log(`HTTPS Server running at https://localhost:${port}`);
});