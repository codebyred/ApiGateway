import express from "express";
import httpProxy from "http-proxy"
import cors from "cors"

const app = express();

const proxy = httpProxy.createProxyServer();

app.use(cors(
    {
        origin:[
            "http://localhost:5173",
            "http://localhost:5174"
        ]
    }
));

app.use((req, res, next)=>{

    if(req.url.startsWith("/api/login"))
        return proxy.web(req, res, {target:"http://localhost:3006"});

    if(req.url.startsWith("/api/worker"))
        return proxy.web(req, res, {target:"http://localhost:3007"});

    if(req.url.startsWith("/api/user"))
        return proxy.web(req, res, {target:"http://localhost:3008"});

    return next();
});

app.use("api/user", (req, res)=>{
    proxy.web(req, res, {target:""});
})


proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error');
});


app.listen(3000,()=>{
    console.log("gateway server started")
});


