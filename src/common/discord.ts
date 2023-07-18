import * as Discord from "discord.js";
import fetch from "node-fetch";
import { IDiscordUser } from "../models/types.js";
import { Response } from "express";
import { genericServerError } from "./generic.js";
import { BuildResponse, HttpStatus } from "./responseHelper.js";
import { ChannelType, GatewayIntentBits } from "discord.js";

export let bot: Discord.Client;
export const uwpCommunityGuildId: string = process.env.guildId || "667491687639023636";

export let InitBot = function () {
    bot = new Discord.Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.DirectMessages,
        ],
    });

    if (!process.env.discord_botToken) {
        console.log(`\x1b[33m${`Missing "discord_botToken" environment variable. You will not be able to interact with the Discord bot without this`}\x1b[0m`);
        return;
    }

    bot.once('ready', () => {
        InitBot = () => { }; // Prevents init from being called again
    });

    bot.login(process.env.discord_botToken);
};


export function GetGuild(): Promise<Discord.Guild | undefined> {
    return bot.guilds.fetch(uwpCommunityGuildId);
}

export async function GetGuildMembers(): Promise<Discord.GuildMember[] | undefined> {
    const server = await GetGuild();
    if (!server) return;

    var members = await server.members.fetch();

    return [...members.values()];
}

export async function GetGuildUser(discordId: string): Promise<Discord.GuildMember | undefined> {
    const server = await GetGuild();
    if (!server) return;

    return (server.members.cache.filter(member => member.id == discordId)).first();
}

export function GetUser(discordId: string) {
    return bot.users.fetch(discordId)
}

export async function GetRoles() {
    const server = await GetGuild();
    if (!server) return;

    return [...(await server.roles.fetch()).values()];
}

export async function GetGuildChannels(): Promise<Discord.GuildBasedChannel[] | undefined> {
    const server = await GetGuild();

    if (server == undefined)
        return undefined;

    return [...server!.channels.cache.values()];
}

export async function GetChannelByName(channelName: string): Promise<Discord.GuildBasedChannel | undefined> {
    const channels = await GetGuildChannels();
    if (!channels)
        return;

    let requestedChannel = channels.find(i => i.name == channelName);
    if (!requestedChannel) {
        requestedChannel = channels.find(i => i.name == "mod-chat");
        (requestedChannel as Discord.TextChannel).send(`Bot tried to find channel ${channelName} but failed.`);
    }

    return requestedChannel;
}

export async function EditMultiMessages(content: string, ...params: Discord.Message[]): Promise<void> {
    for (const message of params) {
        await message.edit(content);
    }
}

export async function SendMultiMessages(content: string, ...params: (Discord.GuildChannel | Discord.TextChannel | Discord.DMChannel)[]): Promise<Discord.Message[]> {
    const results: Discord.Message[] = [];

    for (const channel of params) {
        if (channel.type === ChannelType.GuildText) {
            const sentMessage = await (channel as Discord.TextChannel).send(content);
            results.push(sentMessage as Discord.Message);
        }
    }

    return results;
}

export async function GetDiscordUser(accessToken: string): Promise<IDiscordUser | undefined> {
    const Req = await fetch("https://discordapp.com/api/v6/users/@me", {
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    });
    if (!Req || Req.status != 200) return;

    return (await Req.json()) as IDiscordUser | undefined;
}

export async function GetDiscordIdFromToken(accessToken: string, res: Response, emitResponseOnFailure?: boolean): Promise<string | undefined> {
    const user = await GetDiscordUser(accessToken).catch((err) => genericServerError(err, res));
    if (!user) {
        if (emitResponseOnFailure !== false) BuildResponse(res, HttpStatus.Unauthorized, "Invalid accessToken");
        return;
    }
    return (user as IDiscordUser).id;
}