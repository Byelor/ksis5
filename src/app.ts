import express from "express";
import path from "path";
import fs from "fs";
import {pipeline} from "stream";
const app = express();
const __dirname = import.meta.dirname;
const __filesdir = path.join(__dirname, "files");

// создана ли папка с файлами
if(!fs.existsSync(__filesdir))
{
    fs.mkdirSync(__filesdir);
}
const checkPath = (req: express.Request, res: express.Response, next: express.NextFunction)=>{
    const filePath = req.params[0] || "";
    console.log(filePath);
    const fullPath = path.resolve(__filesdir, filePath);
    console.log(fullPath);
    if(!fullPath.startsWith(__filesdir)){
        res.status(403);
        return next(new Error("Forbidden: invalid path"));
    }
    next();
};

app.use(checkPath);

const checkDir = (req: express.Request, res: express.Response, next: express.NextFunction)=>{
    const filePath = req.params[0] || "";
    const fullPath = path.join(__filesdir, filePath);

    if(!fs.existsSync(fullPath))
    {
        res.status(404);
        return next(new Error("There is no file or directory with this path!"));
    }
    next();
}
// обработка head
app.head(/files\/(.*)/, checkDir, async(req,res,next)=>{
    const filePath = req.params[0] || "";
    const fullPath = path.join(__filesdir, filePath);
    const stats = fs.statSync(fullPath);
    res.set(
        {
        "x-file-size": stats.size,
        "x-is-directory": stats.isDirectory(),
        "x-creation-date": stats.birthtime.toISOString(),
        "x-last-modified": stats.mtime.toUTCString()
        }
    );
    res.end();
    
});

app.get("/", (req, res)=>{
    res.redirect("view/files/");
});
//get с отображением
app.get(/view\/files\/(.*)/, checkDir, (req, res, next)=>{
    const filePath = req.params[0] || "";
    const fullPath = path.join(__filesdir, filePath );
        const dir = (fs.readdirSync(fullPath, {encoding: "utf-8"}));
        let answer = "";
        for(const el of dir){

            const relativePath = path.join(filePath, el);

            if(fs.statSync(path.join(fullPath, el)).isFile())
            {
            answer += `<a href="/files/${relativePath}">${el}</a><br/>`;
            }
            else{
                answer += `<a href="/view/files/${relativePath}">${relativePath}</a><br/>`
            }
        }
        res.send(answer);
});

//обработка GET запросов
app.get(/files\/(.*)/, checkDir, (req, res, next)=>{

    const filePath = req.params[0] || "";

        if(fs.statSync(path.join(__filesdir, filePath)).isFile()){
            res.download(path.join(__filesdir, filePath), ()=>{
                
                console.log(`file: ${path.basename(filePath)} was sent!`)
                res.end();
            });
        }
        else{
            res.json(fs.readdirSync(path.join(__filesdir, filePath)));
        }
});

   
//обработка put с заголовком x-copy-from
app.put(/files\/(.*)/, async (req, res, next)=>{

    const copyFrom = req.headers["x-copy-from"];
    if(!copyFrom){
        return next();
    }
    const copyTo = req.params[0] || "";
    if(!copyTo)
    {
        res.status(404);
        return next(new Error("Invalid copyTo file!"));
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
        return next(new Error("Error on server side!"));
    }

});

 //обработка put
    app.put(/files\/(.*)/, (req, res, next)=>{

    const filePath = req.params[0] || "";
    const folder = path.join(__filesdir, path.dirname(filePath));

    fs.mkdirSync(folder, {recursive: true});

    if(filePath)
    {
        const ws = fs.createWriteStream(path.join(__filesdir, filePath));

    //     pipeline(req, ws, (err) =>{
    //         if(err)
    //         {
    //             res.status(500);
    //             next(err);
    //         }
    //     });

        req.pipe(ws);
        ws.on("finish", ()=>{
            if(!res.headersSent)
            {
            res.status(201).send("good");
            }
        });
        ws.on("error", (error)=>{
            if(res.headersSent)
            {
                return;
            }
            res.status(500);
            return next(error);
        })
    }
    else{
        res.status(400);
        return next(new Error("choose file to save!"));
    }
});



app.delete(/files\/(.*)/, checkDir, async(req, res, next)=>{
    const filePath = req.params[0] || "";
    const fullPath = path.join(__filesdir, filePath );

    fs.rmSync(fullPath, {recursive: true});
    res.send(`file/dir ${filePath} was deleted!`);
});



import type { ErrorRequestHandler } from "express";
const errorHandler: ErrorRequestHandler = (err, req, res, next)=>{
    console.log(`error was occured: ${err}`);
    res.send(`${res.statusCode} error was occurred: ${err}`);
}


app.use(errorHandler);


export default app;