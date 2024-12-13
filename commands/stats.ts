import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import osu from 'node-os-utils';
import axios from 'axios';
import config from '../../config.json';

const mem = osu.mem;
const drive = osu.drive;
const cpu = osu.cpu;
const os = osu.os;

interface RamInfo {
    usedMemMb: number;
    totalMemMb: number;
}

interface DiskInfo {
    usedGb: number;
    totalGb: number;
}

interface IpInfo {
    city: string;
    region: string;
    country: string;
    ip: string;
    org: string;
}

export default {
    data: new SlashCommandBuilder()
        .setName(config.node.command)
        .setDescription('Node statistics for ' + config.node.name),

    async execute(interaction: any): Promise<void> {
        try {
            const Ram: RamInfo = await mem.info();
            const Disk: DiskInfo = await drive.info();
            const Cpu: number = await cpu.usage();
            const ipInfoResponse = await axios.get<IpInfo>('https://ipinfo.io/json');
            const ipLocation: string = `${ipInfoResponse.data.city}, ${ipInfoResponse.data.region}, ${ipInfoResponse.data.country}`;
            const ipAddress: string = ipInfoResponse.data.ip;
            const ipProvider: string = ipInfoResponse.data.org;
            const usedMemoryPercent: string = ((Ram.usedMemMb / Ram.totalMemMb) * 100).toFixed(2);
            const usedDiskPercent: string = ((Disk.usedGb / Disk.totalGb) * 100).toFixed(2);

            let time: number = os.uptime();
            let hours: string = secondsToHms(time);

            let status: string = ":green_circle: Operational";

            if (Cpu > 90) {
                status = ':warning: CPU is overloaded';
            }

            if (parseFloat(usedMemoryPercent) > 80) {
                status = ':warning: RAM is overloaded';
            }

            const statsEmbed: EmbedBuilder = new EmbedBuilder()
                .setColor(config.embed.color)
                .setTitle(config.embed.title)
                .setThumbnail(config.embed.logo)
                .addFields(
                    { name: 'Status', value: status },
                    { name: 'Provider', value: ipProvider },
                    { name: 'IPv4 Address', value: ipAddress },
                    { name: 'Hostname', value: config.node.hostname },
                    { name: 'Location', value: ipLocation },
                    { name: 'RAM Usage', value: `${(Ram.usedMemMb / 1000).toFixed(2)} GiB of ${(Ram.totalMemMb / 1000).toFixed(2)} GiB (${usedMemoryPercent}%)` },
                    { name: 'CPU Usage', value: `${Cpu}%` },
                    { name: 'CPU Model', value: `${cpu.model()}` },
                    { name: 'CPU Information', value: `${cpu.count() / 2} cores, ${cpu.count()} threads` },
                    { name: 'Disk Usage', value: `${Disk.usedGb} GiB of ${Disk.totalGb} GiB (${usedDiskPercent}%)` },
                    { name: 'Uptime', value: `${hours}` }
                );

            await interaction.reply({ embeds: [statsEmbed] });
        } catch (error: any) {
            await interaction.reply(`Error: ${error.message}`);
        }
    },
};

function secondsToHms(seconds: number): string {
    if (!seconds) return '';
    let duration: number = seconds;
    let hours: number = duration / 3600;
    duration = duration % 3600;

    let min: number = Math.floor(duration / 60);
    duration = duration % 60;
    let sec: number = Math.floor(duration);

    if (sec < 10) {
        sec = parseInt(`0${sec}`);
    }
    if (min < 10) {
        min = parseInt(`0${min}`);
    }
    if (parseInt(hours.toString(), 10) > 0) {
        return `${parseInt(hours.toString(), 10)}h ${min}m ${sec}s`;
    } else if (min === 0) {
        return `${sec}s`;
    } else {
        return `${min}m ${sec}s`;
    }
}
