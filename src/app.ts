import express from "express";
import path from "path";
import fs from "fs";
const app = express();
const __dirname = import.meta.dirname;
const __filesdir = path.join(__dirname, "files");

console.log(__filesdir);

function getBasePath(filePath: any){
    if(filePath === undefined || filePath.length === 0)
    {
        return undefined;
    }
    const basePath = path.normalize(filePath);
    if(basePath)
    {
        return basePath;
    }
    return undefined;
}

app.use("/", (req, res, next)=>{
          console.log(req.headers);
        console.log(req.body);
    next();
})
app.get(/files\/(.*)/, (req, res)=>{
    const filePath = req.params[0];
    console.log(filePath);
    const basePath = getBasePath(filePath);
    console.log(basePath);
    if(basePath && fs.existsSync(path.join(__filesdir, basePath))){
    res.download(path.join(__filesdir, basePath), ()=>{
        
        console.log(`file: ${filePath} was sent!`)
        res.end();
    });
    }
    else{
    console.log("There is no file with this path!");
    res.send("There is no file with this path!");
    }
});


    app.post(/files\/(.*)/, (req, res)=>{

    console.log("put method starts");
    const basePath = getBasePath(req.params[0]);
    console.log(basePath);
    try{
    if(basePath)
    {
    const ws = fs.createWriteStream(path.join(__filesdir, basePath));
        req.pipe(ws);
        ws.on("finish", ()=>{
            console.log("finish");
            res.send("good");
        });
        ws.on("error", (error)=>{
            console.log(`error ocurred: ${error}`);
            res.send("baaad");
        })
    }
    else{
        res.send("error");
    }
}
    catch(error){
        console.log(`error ocurred ${error}`);
    }

});



export default app;