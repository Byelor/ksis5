import express from "express";
import path from "path";
import fs from "fs";
const app = express();
const __dirname = import.meta.dirname;
const __filesdir = path.join(__dirname, "files");


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
    next();
})
app.get(/files\/(.*)/, (req, res)=>{

    const filePath = req.params[0];
    const basePath = getBasePath(filePath);

    if(basePath && fs.existsSync(path.join(__filesdir, basePath))){
    res.download(path.join(__filesdir, basePath), ()=>{
        
        console.log(`file: ${path.basename(basePath)} was sent!`)
        res.end();
    });
    }
    else{
    res.send("There is no file with this path!");
    }
});


    app.post(/files\/(.*)/, (req, res)=>{

    const basePath = getBasePath(req.params[0]);
      
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

app.put(/files\/(.*)/, async (req, res)=>{
    const copyTo = getBasePath(req.params[0]) as string;
    console.log("CopyTo: ", copyTo);
    const copyFrom = req.headers["x-copy-from"];
    console.log("CopyFrom: ", copyFrom);
    const folder = path.join(__filesdir, path.dirname(copyTo));
    try{
    await fs.mkdir(folder, {recursive: true}, ()=>{
        console.log(`${path.dirname(copyTo)} folder was created!`);
    });
    const fromStream = fs.createReadStream(path.join(__filesdir, copyFrom as string));
    const toStream = fs.createWriteStream(path.join(__filesdir, copyTo as string));
    fromStream.pipe(toStream);
    toStream.on("finish", ()=>{
        console.log("succesful!");
        res.send("succesful!");
    });
    toStream.on("error", (error)=>{
        console.log("error: ", error);
    })
    }
    catch(error){
        console.log("error");
    }

});


export default app;