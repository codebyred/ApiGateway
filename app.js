import express from "express";
import cors from "cors"
import {readFile, writeFile} from "fs/promises";
import { write } from "fs";

const app = express();

app.use(cors(
    {
        origin:[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:3008",
        ]
    }
));

app.use(express.json());

app.post("/register", async(req, res)=>{
    const registryInfo = req.body;
    try{
        const serviceRegistryFile = await readFile("./serviceRegistry.json","utf8");
        const serviceRegistry = JSON.parse(serviceRegistryFile);
        const services = serviceRegistry.services;  

        services[registryInfo.api] = {...registryInfo};
        await writeFile("./serviceRegistry.json", JSON.stringify(serviceRegistry));
        res.json({msg:"registered"});

    }catch(e){
        res.status(500).json({msg:"internal server error"});
    }
});

app.all("/:api/:path", async(req, res)=>{

    const api = req.params.api;
    const path = req.params.path;

    try{
        const serviceRegistryFile = await readFile("./serviceRegistry.json","utf8");
        const serviceRegistry = JSON.parse(serviceRegistryFile);
        const services = serviceRegistry.services;  

        if(!services[api]){
            return res.send("api does not exist");
        }

        const apiUrl = services[api].url + "/" + api + "/" + path;

        const fetchOptions = {
            method: req.method,
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
        }

        if(req.body){
            fetchOptions.data = JSON.stringify(req.body);
        }

        const  apiResponse = await fetch(apiUrl, fetchOptions);

        const apiData = await apiResponse.json();
    
        return res.json(apiData);

    }catch(e){

        return res.status(500).send("internal server error");

    }
});



app.listen(3000,()=>{
    console.log("gateway server started")
});