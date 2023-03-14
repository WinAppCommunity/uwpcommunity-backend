import { Request, Response } from "express";
import { DEVENV } from "../../../common/helpers/generic"
import { BuildResponse, HttpStatus } from "../../../common/helpers/responseHelper";

const request = require("request");

function log(...args: any[]) {
    console.log(`GET /signin/redirect: \x1b[33m${Array.from(arguments)}\x1b[0m`);
}

if (process.env.discord_client === undefined || process.env.discord_secret === undefined) {
    log(`Missing discord_client or discord_secret env variables. Requests will most likely fail`);
}

/***
 * @summary Exchange the code for an access token
 * @see https://discordapp.com/developers/docs/topics/oauth2#authorization-code-grant-redirect-url-example
 */
module.exports = (req: Request, res: Response) => {
    let code = req.query.code;

    if (!code) {        
        BuildResponse(res, HttpStatus.MalformedRequest, "Missing code query"); 
        return;
    }

    request.post({
        url: 'https://discordapp.com/api/oauth2/token',
        form: {
            client_id: process.env.discord_client,
            client_secret: process.env.discord_secret,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: DEVENV ? "http://localhost:5000/signin/redirect" : "http://uwpcommunity-site-backend.herokuapp.com/signin/redirect",
            scope: "identify guilds"
        }
    }, (err: Error, httpResponse: any, body: string) => {
        // This is an IDiscordAuthResponse, convert it to base64 to use in a URL
        let authResponse: string = Buffer.from(body).toString('base64');

        res.redirect(`http://${DEVENV ? "localhost:3000" : "uwpcommunity.com"}/signin?authResponse=${authResponse}`);
    });
};
