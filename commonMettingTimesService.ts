import {formatBlock} from "./util";
import {DateTime} from "luxon";

interface Event {
    id: number;
    title: string;
    start: string;
    end: string;
}

interface WorkingHours {
    start: string;
    end: string;
    time_zone: string;
}

interface User {
    user_id: number;
    working_hours: WorkingHours;
    events: Event[];
}

function commonMeetingTimesWithoutWorkingHours(users: User[], startTime: string, endTime: string): string[] {
    let start = DateTime.fromISO(startTime, {zone: 'utc'})
    let end = DateTime.fromISO(endTime, {zone: 'utc'})
    let blockStart = null;
    let blockEnd = null;
    const timeBlock = []
    const userEvents = users.flatMap(user => user.events)
    while (start <= end) {
        const commonTime = userEvents.every(event => {
            const eventStart = DateTime.fromISO(event.start, {zone: 'utc'});
            const eventEnd = DateTime.fromISO(event.end, {zone: 'utc'});
            return !(start >= eventStart && start < eventEnd);
        })
        if (commonTime && blockStart == null) {
            blockStart = start;
        } else if (!commonTime && blockStart !== null) {
            blockEnd = start;
            timeBlock.push(formatBlock(blockStart, blockEnd))
            blockStart = null;
            blockEnd = null;
        }
        if (start.equals(end) && blockStart !== null && blockEnd === null) {
            blockEnd = start;
            timeBlock.push(formatBlock(blockStart, blockEnd))
        }
        start = start.plus({minute: 1})
    }

    return timeBlock;
}

function findCommonMeetingTimesWithinWorkingHours(users: User[], startTime: string, endTime: string): string[] {
    const start = DateTime.fromISO(startTime, { zone: 'utc' });
    const end = DateTime.fromISO(endTime, { zone: 'utc' });
    let blockStart: DateTime | null = null;
    let blockEnd: DateTime | null = null;
    const timeBlocks: string[] = [];

    let currentTime = start;
    while (currentTime <= end) {
        const commonTime = users.every((user: User) => {
            const workingHoursStart = start
                .set({ hour: parseInt(user.working_hours.start), minute: 0, second: 0 })
                .setZone("UTC");
            const workingHoursEnd = end
                .set({ hour: parseInt(user.working_hours.end), minute: 0, second: 0 })
                .setZone("UTC");

            if (currentTime < workingHoursStart || currentTime >= workingHoursEnd) {
                return false;
            }

            return user.events.every((event: Event) => {
                const eventStart = DateTime.fromISO(event.start, { zone: 'utc' });
                const eventEnd = DateTime.fromISO(event.end, { zone: 'utc' });
                return !(currentTime >= eventStart && currentTime < eventEnd);
            });
        });

        if (commonTime && blockStart === null) {
            blockStart = currentTime;
        } else if (!commonTime && blockStart !== null) {
            blockEnd = currentTime;
            timeBlocks.push(formatBlock(blockStart, blockEnd));
            blockStart = null;
            blockEnd = null;
        }

        if (currentTime.equals(end) && blockStart !== null && blockEnd === null) {
            blockEnd = currentTime;
            timeBlocks.push(formatBlock(blockStart, blockEnd));
        }

        currentTime = currentTime.plus({ minute: 1 });
    }

    return timeBlocks;
}


function findMeetingBlocksByUserAvailability(
    users: User[],
    startTime: string,
    endTime: string,
    interval: number,
): any[] {
    const timeBlocks: { block: string; user_ids: number[] }[] = [];
    const start = DateTime.fromISO(startTime, { zone: 'utc' });
    const end = DateTime.fromISO(endTime, { zone: 'utc' });

    let currentTime = start;
    while (currentTime <= end) {
        const blockStart = currentTime;
        const blockEnd = currentTime.plus({ minutes: interval });

        let availableUserIds: number[] = [];
        for (const user of users) {
                const { working_hours, events } = user;
                const workingHoursStart = start
                    .set({ hour: parseInt(working_hours.start), minute: 0, second: 0 })
                    .setZone('utc');
                const workingHoursEnd = end
                    .set({ hour: parseInt(working_hours.end), minute: 0, second: 0 })
                    .setZone('utc');

                if (currentTime >= workingHoursStart && currentTime < workingHoursEnd) {
                    const userAvailable = events.every((event: Event) => {
                        const eventStart = DateTime.fromISO(event.start, { zone: working_hours.time_zone });
                        const eventEnd = DateTime.fromISO(event.end, { zone: working_hours.time_zone });
                        return !(currentTime >= eventStart && currentTime < eventEnd);
                    });

                    if (userAvailable) {
                        availableUserIds.push(user.user_id);
                    }
                }
        }

        if (availableUserIds.length > 0) {
            timeBlocks.push({
                block: formatBlock(blockStart, blockEnd),
                user_ids: availableUserIds,
            });
        }

        currentTime = blockEnd;
    }

    return timeBlocks;
}

export {
    commonMeetingTimesWithoutWorkingHours,
    findCommonMeetingTimesWithinWorkingHours,
    findMeetingBlocksByUserAvailability
};