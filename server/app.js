const http = require( "http" );
var express = require( "express" )
var bodyParser = require( "body-parser" )
var app = express()
app.use( bodyParser.json() )

const hostname = '127.0.0.1';
const port = 3000;

var repos = [{url: "github.com", name: "Bubble API"}, {url: "github.com", name: "Bubble Student App"}, {url: "github.com", name: "Bubble Blog"}];

// Add headers
app.use(function (req, res, next) {
    
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    // Pass to next layer of middleware
    next();
});

app.get("/repos", function(reqt, resp) {
    resp.json( repos )
})

//Respond to unknown pages with 404 header.
app.use(function(req, res){
    res.status(404);
    res.type('txt').send('Page not found\n');
});


app.listen( port, function () {
      console.log( "listening on port" , port )
})