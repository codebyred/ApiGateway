import express from "express";
import cors from "cors"
import {readFile, writeFile} from "fs/promises"
import { v4 as uuidv4 } from "uuid";



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



app.post("/api/booking/success/:bookingId", async (req, res)=>{
    try{
        const serviceRegistryFile = await readFile("./serviceRegistry.json","utf8");
        const serviceRegistry = JSON.parse(serviceRegistryFile);
        const services = serviceRegistry.services; 
        await fetch(`${services["booking"].url}/api/booking/success/${req.params.bookingId}`,
        {
            method:"POST",
            headers:{
                "Content-type":"application/json"
            },
            body: JSON.stringify(req.body)
        });

        return res.redirect("http://localhost:3000/payment/success");
    }catch(e){
        console.log(e);
        return res.redirect("http://localhost:3000");
    }
    
})

app.post("/api/booking/fail", async (req, res)=>{
    try{
        const serviceRegistryFile = await readFile("./serviceRegistry.json","utf8");
        const serviceRegistry = JSON.parse(serviceRegistryFile);
        const services = serviceRegistry.services; 
        await fetch(`${services["booking"].url}/api/booking/fail`,
        {
            method:"POST",
            headers:{
                "Content-type":"application/json"
            },
            body: JSON.stringify(req.body)
        });

        return res.redirect("http://localhost:3000/payment/fail");
    }catch(e){
        console.log(e);
        return res.redirect("http://localhost:3000");
    }
    
    
})

app.all("/api/:service/:endpoint1/:endpoint2/:param", async(req, res)=>{

    const service = req.params.service;
    const endpoint1 = req.params["endpoint1"];
    const endpoint2 = req.params["endpoint2"];
    const param = req.params["param"]

    try{
        const serviceRegistryFile = await readFile("./serviceRegistry.json","utf8");
        const serviceRegistry = JSON.parse(serviceRegistryFile);
        const services = serviceRegistry.services;  

        if(!services[service])
            throw new Error("service does not exist");
        

        let serviceEndpoint;

        if(!endpoint1 && !endpoint2)
            serviceEndpoint = `${services[service].url}/api/${services[service].service}`;

        if(endpoint1) 
            serviceEndpoint =  `${services[service].url}/api/${services[service].service}/${endpoint1}`;
        
        if(endpoint2)
            serviceEndpoint = `${serviceEndpoint}/${endpoint2}`
        
        if(param)
            serviceEndpoint = `${serviceEndpoint}/${param}`

        if(req.query?.clientId){
            serviceEndpoint = `${serviceEndpoint}?clientId=${req.query?.clientId}`
        }
            
        
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
        console.log(serviceEndpoint)
        const  serviceResponse = await fetch(serviceEndpoint, fetchOptions);
        const serviceData = await serviceResponse.json();   

        console.log(serviceResponse)
    
        return res.status(200).json(serviceData);

    }catch(e){

        return res.status(500).json({msg:"gateway server error"});

    }
});

app.all("/api/:service/:endpoint?", async(req, res)=>{

    const service = req.params.service;
    const endpoint = req.params["endpoint"];

    try{
        const serviceRegistryFile = await readFile("./serviceRegistry.json","utf8");
        const serviceRegistry = JSON.parse(serviceRegistryFile);
        const services = serviceRegistry.services;  

        if(!services[service])
            throw new Error("service does not exist");
        

        let serviceEndpoint;

        if(endpoint) 
            serviceEndpoint =  `${services[service].url}/api/${services[service].service}/${endpoint}`;
        else
            serviceEndpoint = `${services[service].url}/api/${services[service].service}`;

        if(req.query?.clientId){
            serviceEndpoint = `${serviceEndpoint}?clientId=${req.query?.clientId}`
        }
            
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

        return res.status(500).json({msg:"gateway server error"});

    }
});



app.listen(3020,()=>{
    console.log("gateway server started")
});