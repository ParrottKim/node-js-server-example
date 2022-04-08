const express = require('express');
const maria = require('mysql');

require('dotenv').config();

const app = express();

app.use(express.json({
    limit: '50mb'
}));
app.use(express.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000
}));

const port = 3306;

app.get("/", (req, res) => {
    res.json({message: "Hello World!"});
});

const connection = maria.createConnection({
    host: process.env.host,
    port: process.env.port,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,

    dateStrings: "date",
    multipleStatements: true
});

connection.connect(err => {
    if (err) throw err;
    console.log('Successfully connected');
});

app.get('/acronyms', function (req, res) {
    if (req.query.value == null) {
        connection.query('select * from acronyms', function (error, results, field) {
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'Acronyms list' });
        }); 
    } else {
        connection.query(
        'select * from acronyms where en_description like ? or kr_description like ? or acronym like ?', 
        [`%${req.query.value}%`, `%${req.query.value}%`, `%${req.query.value}%`], function (error, results, field) {
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'Acronyms list' });
        });
    }
});

app.get('/airbags', function (req, res) {
    if (req.query.value == null) {
        connection.query('select * from airbags', function (error, results, field) {
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'Airbag table list' });
        });
    } else {
        connection.query(
            'select * from airbags where en_description like ? or kr_description like ? or airbag like ?', 
            [`%${req.query.value}%`, `%${req.query.value}%`, `%${req.query.value}%`], function (error, results, field) {
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'Airbag table list' });
        });
    }
});

app.get('/codes', function (req, res) {
    if (req.query.value == null) {
        connection.query('select * from codes', function (error, results, field) {
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'DTC codes list.' });
        });
    } else {
        connection.query(
            'select * from codes where en_description like ? or kr_description like ? or code like ?', 
            [`%${req.query.value}%`, `%${req.query.value}%`, `%${req.query.value}%`], function (error, results, fields) {
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'DTC codes list' });
        });
    }
});

app.get('/models', function (req, res) {
    connection.query('select * from models', function (error, results, field) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Model list' });
    });
});

app.get('/logs', function (req, res) {
    if (req.query.id == null) {
        connection.query('select * from logs left join models on logs.model_id = models.model_id left join codes on logs.code_id = codes.code_id order by date desc', function (error, results, field) {
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'Log list' });
        });
    } else {
        connection.query('select * from logs left join models on logs.model_id = models.model_id where code_id = ? order by date desc',
        [req.query.id], function (error, results, field) {
            if (error) throw error;
            return res.send({ error: false, data: results, message: 'Log list' });
        });
    }
});

app.get('/logs/number', function (req, res) {
    connection.query('select * from logs left join models on logs.model_id = models.model_id left join codes on logs.code_id = codes.code_id where model_code = ? and body_no = ?', 
    [req.query.code, req.query.number], function (error, results, field) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Log list' });
    });
});

app.get('/logs/filter', function (req, res) {
    connection.query(`select * from logs left join models on logs.model_id = models.model_id left join codes on logs.code_id = codes.code_id where ${req.query.filter} like ?`, 
    [`%${req.query.value}%`], function (error, results, field) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Log list' });
    });
});

app.get('/logs/images', function (req, res) {
    connection.query('select * from logs right join log_images on logs.log_id = log_images.log_id where logs.log_id = ?',
    [req.query.id], function (error, results, field) {
        if (error) throw error;
        return res.send({ error: false, data: results, message: 'Log images' });
    });
});

app.post('/logs/upload-log', function (req, res) {
    connection.query('insert into logs (date, code_id, model_id, body_no, writer, description) values (?, ?, ?, ?, ?, ?); select last_insert_id() as id;',
    [req.body['date'], req.body['codeId'], req.body['modelId'], req.body['bodyNumber'], req.body['writer'].toString(), req.body['description'].toString()], function (error, results, field) {
        if (error) throw error;
        return res.send({ error: false, data: req.body, result: results[1][0].id, message: 'Upload log' });
    });
});

app.post('/logs/upload-image', function (req, res) {
    console.log(req.body['id']);
    connection.query('insert into log_images (log_id, photo, photo_name) values (?, ?, ?)', 
    [req.body['id'], Buffer.from(req.body['photo']), req.body['photoName'].toString()], function (error, results, field) {
        if (error) throw error;
        return res.send({ error: false, data: req.body, message: 'Upload log image' });
    });
});

app.listen(port, function () {
    console.log(`Server listening on port ${port}`);
});