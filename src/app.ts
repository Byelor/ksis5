import express from "express";
import path from "path";
import fs from "fs";
const app = express();
const __dirname = import.meta.dirname;
const __filesdir = path.join(__dirname, "files");

// создана ли папка с файлами
if(!fs.existsSync(__filesdir))
{
    fs.mkdirSync(__filesdir);
}

//функция, возвращающая нормализованную строку
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

//обработка GET запросов: загрузка файлов из сервера
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

    //обработка post: выгрузка файлов в сервер
    app.post(/files\/(.*)/, (req, res)=>{

    const basePath = getBasePath(req.params[0]) as string;
    const folder = path.join(__filesdir, path.dirname(basePath));

    fs.mkdirSync(folder, {recursive: true});

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
            console.log(`ws error ocurred: ${error}`);
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
//обработка put с заголовком x-copy-from
app.put(/files\/(.*)/, async (req, res, next)=>{

    const copyFrom = req.headers["x-copy-from"];
    if(!copyFrom){
        next();
        return;
    }
    const copyTo = getBasePath(req.params[0]) as string;
    const folder = path.join(__filesdir, path.dirname(copyTo));
    try{
    fs.mkdirSync(folder, {recursive: true});
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