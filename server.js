const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Endpoint untuk menyajikan index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint untuk pengecekan beberapa kode redeem
app.post('/check-redeem', async (req, res) => {
    const { codes } = req.body;
    const client_code = 'lpkkar7590995786293497';
    const sign_key = 'f2d64df18f6a450eaf39e9ffb9a77710';

    const results = await Promise.all(codes.map(async (code) => {
        const timestamp = Math.round((new Date()).getTime() / 1000);
        const method = 'POST';
        const endpoint = '/api/v1/integration/payment/redeem-code/status';

        const data = { redeem_code: code, sequence: 1 };
        const input = client_code + timestamp + method + endpoint + JSON.stringify(data);
        const signature = crypto.HmacSHA1(input, sign_key).toString(crypto.enc.Hex);

        try {
            const response = await axios({
                method: 'post',
                url: 'https://api.prakerja.go.id' + endpoint,
                headers: {
                    'Content-Type': 'application/json',
                    'client_code': client_code,
                    'signature': signature,
                    'timestamp': timestamp
                },
                data
            });

            // Ambil message dari respons API
            const message = response.data.message || 'Kode redeem valid!';
            return {
                code,
                success: true,
                message: message, // Ambil pesan dari respons
            };
        } catch (error) {
            const errorMessage = error.response ? error.response.data.message || 'Kode redeem tidak valid!' : error.message;
            return {
                code,
                success: false,
                message: errorMessage, // Ambil pesan error dari respons
            };
        }
    }));

    res.json(results);
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
