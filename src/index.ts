import app from "./app.js";

app.listen(process.env.PORT, ()=>{
    console.log(`server starts listening on port: ${process.env.PORT}`);
})