import {DateTime} from "luxon";

export function formatBlock(startBlock: DateTime, endBlock: DateTime): string {
    return `${startBlock.toISO()} - ${endBlock.toISO()}`;
}
