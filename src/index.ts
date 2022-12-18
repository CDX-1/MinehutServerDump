import chalk from 'chalk';
import axios from 'axios';
import fs from 'fs';
import rl from 'readline';
import path from 'path';

const minehutServerApiEndpoint = "https://api.minehut.com/server/";

const prompt = async () => {
    rl.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    }).question(chalk.cyanBright("Enter the name of a Minehut server ") + chalk.blue("> "), (res: string) => {

        fs.access("./dumps/", (err: any) => {
            if (err) {
                fs.mkdirSync("./dumps/");
            }
        });

        axios.get(minehutServerApiEndpoint + res + "?byName=true")
        .then((r) => {

            const data: any = r.data.server;
            const maxProgress: number = 4;
            const progress = (progress: number, progressMax: number, text: string) => {
                console.log(chalk.green(`${progress}/${progressMax} `) + chalk.white(text));
            }
            
            progress(1, maxProgress, "Creating server dump folder");
            fs.access("./dumps/" + data.name, (err: any) => {
                if (!err) {
                    fs.rmSync("./dumps/" + data.name, { recursive: true });
                    fs.mkdirSync("./dumps/" + data.name);
                } else {
                    fs.mkdirSync("./dumps/" + data.name);
                }
            });

            setTimeout(() => {
                progress(2, maxProgress, "Creating raw data file");
                fs.writeFileSync("./dumps/" + data.name + "/raw_data.json", JSON.stringify(data, null, 4));

                const dumpText = formatDumpText(data, fs.readFileSync("./dump_template.txt").toString());

                progress(3, maxProgress, "Creating clean data file");
                fs.writeFileSync("./dumps/" + data.name + "/data.txt", dumpText);
                
                progress(4, maxProgress, "Dumped server data to dumps/" + data.name);

                prompt();
            }, 1000);
        }).catch((err) => {
            console.log(chalk.red("! failed to fetch data for server ") + chalk.white(res));
            console.error(err);
            prompt();
        });
    });
}

const formatDumpText = (data: any, text: string): string => {
    return text
        .replaceAll(placeholder("name_clean"), data.name)
        .replaceAll(placeholder("id"), data._id)
        .replaceAll(placeholder("online"), data.online)
        .replaceAll(placeholder("icon_id"), data.active_icon)
        .replaceAll(placeholder("icon_name"), data.icon)
        .replaceAll(placeholder("categories_clean"), data.categories.join(", "))
        .replaceAll(placeholder("icons_clean"), data.purchased_icons.join(", "))
        .replaceAll(placeholder("motd_raw"), data.motd)
        .replaceAll(placeholder("players"), data.playerCount)
        .replaceAll(placeholder("visibility"), data.visibility)
        .replaceAll(placeholder("proxy"), data.proxy)
        .replaceAll(placeholder("suspended"), data.suspended)
        .replaceAll(placeholder("plan"), data.activeServerPlan)
        .replaceAll(placeholder("raw_plan"), data.rawPlan)
        .replaceAll(placeholder("max_players"), data.maxPlayers)
        .replaceAll(placeholder("daily_cost"), data.credits_per_day)
        .replaceAll(placeholder("created_timestamp"), data.creation)
        .replaceAll(placeholder("created_date"), new Date(data.creation).toUTCString())
        .replaceAll(placeholder("lastonline_timestamp"), data.last_online)
        .replaceAll(placeholder("lastonline_date"), new Date(data.last_online).toUTCString());
}

const placeholder = (placeholder: string): string => {
    return `{${placeholder}}`;
}

prompt();