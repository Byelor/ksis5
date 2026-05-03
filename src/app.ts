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
app.get(/view\/files\/(.*)/, (req, res, next)=>{
    const filePath = req.params[0];
    const basePath = getBasePath(filePath) || "";
    console.log(basePath);
    const fullPath = path.join(__filesdir, basePath );
    console.log("fullPath: ", fullPath);
    if(fs.existsSync(fullPath))
    {
        const dir = (fs.readdirSync(fullPath, {recursive: true, encoding: "utf-8"}));
        let answer = "";
        for(const el of dir){

            const relativePath = path.join(basePath, el);

            if(fs.statSync(path.join(fullPath, el)).isFile())
            {
            answer += `<a href="/files/${relativePath}">${el}</a><br/>`;
            }
            else{
                answer += `<a href="/view/files/${relativePath}">${relativePath}</a><br/>`
            }
        }
        res.send(answer);
    }
    else{
        res.status(404);
        throw new Error("There is no file or directory with this path!");
    }
});
app.get(/ls\/files\/(.*)/, (req, res)=>{
    const filePath = req.params[0];
    const basePath = getBasePath(filePath) || "";
    console.log(basePath);
    
});

//обработка GET запросов: загрузка файлов из сервера
app.get(/files\/(.*)/, (req, res, next)=>{

    const filePath = req.params[0];
    const basePath = getBasePath(filePath) || "";
    console.log(basePath);
    if(fs.existsSync(path.join(__filesdir, basePath))){

        if(fs.statSync(path.join(__filesdir, basePath)).isFile()){
            res.download(path.join(__filesdir, basePath), ()=>{
                
                console.log(`file: ${path.basename(basePath)} was sent!`)
                res.end();
            });
        }
        else{
            res.json(fs.readdirSync(path.join(__filesdir, basePath)));
        }
    }
    else{
            res.status(404);
            throw new Error("There is no file or directory with this path!");
        }
});

    //обработка post: выгрузка файлов в сервер
    app.post(/files\/(.*)/, (req, res)=>{

    const basePath = getBasePath(req.params[0]) as string;
    const folder = path.join(__filesdir, path.dirname(basePath));

    fs.mkdirSync(folder, {recursive: true});

    if(basePath)
    {
    const ws = fs.createWriteStream(path.join(__filesdir, basePath));
        req.pipe(ws);
        ws.on("finish", ()=>{
            console.log("finish");
            res.send("good");
        });
        ws.on("error", (error)=>{
            res.status(500)
            throw new Error("Error on server side!");
        })
    }
    else{

        throw new Error("There is no file or directory with this path!");
    }


});
//обработка put с заголовком x-copy-from
app.put(/files\/(.*)/, async (req, res, next)=>{

    const copyFrom = req.headers["x-copy-from"];
    if(!copyFrom){
        res.status(404);
        throw new Error("Invalid copyFrom file!");
    }
    const copyTo = getBasePath(req.params[0]);
    if(!copyTo)
    {
        res.status(404);
        throw new Error("Invalid copyTo file!");
    }
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
    }
    catch(error){
        res.status(500);
        throw new Error("Error on server side!");
    }

});
import type { ErrorRequestHandler } from "express";
const errorHandler: ErrorRequestHandler = (err, req, res, next)=>{
    console.log(err);
    res.send(`error was occurred: ${err}`);
}
app.use(errorHandler);


export default app;