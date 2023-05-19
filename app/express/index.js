const express = require("express");

const http = require("http");

const path = require('path');

const { engine } = require('hbs');

const app = express();

const server = http.createServer(app);

app.set("view engine", "hbs");
app.set('views', path.join(__dirname, 'views'));
app.set('view options', { layout: 'layouts/main' });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
    res.render('index.hbs');
});

app.get('/rooms/:roomName', function (req, res) {
    res.render('room.hbs');
});

app.get('/rooms/:roomName/view/:fileName', function (req, res) {
    res.render('view.hbs',{
        roomName: req.params.roomName,
        fileName: req.params.fileName
    });
});

app.get('/download/:roomName/:fileName', function (req, res) {
    const filePath = path.join(__dirname, "../../uploadsFiles", req.params.roomName,  req.params.fileName);
    res.header("Access-Control-Allow-Origin", "*");
    res.sendFile(filePath);
});


server.listen(8000, () => console.log('server is running on port 8000'));

module.exports = {
    server: server,
    express: express
}