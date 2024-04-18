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
            "http://localhost:3000",
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

        services[registryInfo.service] = {...registryInfo};
        await writeFile("./serviceRegistry.json", JSON.stringify(serviceRegistry));
        res.json({msg:"registered"});

    }catch(e){
        res.status(500).json({msg:"internal server error"});
    }
});

app.all("/api/:service/:endpoint?", async(req, res)=>{

    const service = req.params.service;
    const endpoint = req.params["endpoint"];

    try{
        const serviceRegistryFile = await readFile("./serviceRegistry.json","utf8");
        const serviceRegistry = JSON.parse(serviceRegistryFile);
        const services = serviceRegistry.services;  

        if(!services[service]){
            return res.send("service does not exist");
        }

        let serviceEndpoint;

        if(endpoint) 
            serviceEndpoint =  `${services[service].url}/api/${services[service].service}/${endpoint}`;
        else
            serviceEndpoint = `${services[service].url}/api/${services[service].service}`;

        const fetchOptions = {
            method: req.method,
            mode: "cors",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
        }

        if(Object.keys(req.body).length > 0){
            fetchOptions.body = JSON.stringify(req.body);
        }

        const  serviceResponse = await fetch(serviceEndpoint, fetchOptions);
        const serviceData = await serviceResponse.json();
    
        return res.status(200).json(serviceData);

    }catch(e){

        return res.status(500).json({msg:"internal server error"});

    }
});



app.listen(3020,()=>{
    console.log("gateway server started")
});