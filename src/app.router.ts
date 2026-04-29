import {Router} from "express";

class FilesRouter{
    public router: Router = Router();

    constructor()
    {
        this.initialRoutes();
    }
    initialRoutes(){

    }
}

export default new FilesRouter().router;