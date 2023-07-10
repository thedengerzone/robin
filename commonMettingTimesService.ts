import {formatBlock} from "./util";
import {DateTime} from "luxon";

interface Event {
    id?: number;
    title?: string;
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


function commonMeetingTimesWithoutWorkingHours(users: User[], startTime: string, endTime: string): Event[] {
    const userEvents = users.flatMap(user => user.events.sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime()));
    const mergedTimeSlots = []
    const freeTimeSlots: Event[] = []

    mergedTimeSlots.push(userEvents[0])

    for (let i = 1; i < userEvents.length; i++) {
        let top: Event = mergedTimeSlots[mergedTimeSlots.length - 1];
        if (Date.parse(top.end) < Date.parse(userEvents[i].start)) {
            mergedTimeSlots.push(userEvents[i])
        } else if (Date.parse(top.end) < Date.parse(userEvents[i].end)) {
            top.end = userEvents[i].end;
            mergedTimeSlots.pop();
            mergedTimeSlots.push(top)
        }
    }

    for (let i = 0; i < mergedTimeSlots.length; i++) {

        if (Date.parse(startTime) < Date.parse(mergedTimeSlots[i].start)) {
            freeTimeSlots.push({start: startTime, end: mergedTimeSlots[i].start})
            startTime = mergedTimeSlots[i].end;
        }

    }

    if (Date.parse(startTime) < Date.parse(endTime)) {
        freeTimeSlots.push({start: startTime, end: endTime});
    }

    return freeTimeSlots;
}

function findCommonMeetingTimesWithinWorkingHours(users: User[], startTime: string, endTime: string): Event[] {
    const userEvents = users.flatMap(user => user.events.sort((a, b) => new Date(a.end).getTime() - new Date(b.end).getTime()));
    const userWorkingHours = [];
    const mergedTimeSlots = []
    const freeTimeSlots: Event[] = []

    userWorkingHours.push(users[0])
    for (let i = 1; i < users.length; i++) {
        let top: any = userWorkingHours[userWorkingHours.length - 1];
        if (Number.parseInt(top.working_hours.start) < Number.parseInt(users[i].working_hours.start)) {
            top.working_hours.start = users[i].working_hours.start;
            userWorkingHours.pop();
            userWorkingHours.push(top)
        }
        if (Number.parseInt(top.working_hours.end) > Number.parseInt(users[i].working_hours.end)) {
            top.working_hours.end = users[i].working_hours.end;
            userWorkingHours.pop();
            userWorkingHours.push(top)
        }
    }


    for (let i = 1; i < userEvents.length; i++) {
        mergedTimeSlots.push(userEvents[0])
        let top: Event = mergedTimeSlots[mergedTimeSlots.length - 1];
        if (Date.parse(top.end) < Date.parse(userEvents[i].start)) {
            mergedTimeSlots.push(userEvents[i])
        } else if (Date.parse(top.end) < Date.parse(userEvents[i].end)) {
            top.end = userEvents[i].end;
            mergedTimeSlots.pop();
            mergedTimeSlots.push(top)
        }
    }


    const a = DateTime.fromISO(startTime, {zone: 'utc'})
    if (a <= a.set({hour: Number.parseInt(userWorkingHours[0].working_hours.start), minute: 0})) {
        let newStartTime = a.set({hour: Number.parseInt(userWorkingHours[0].working_hours.start), minute: 0}).toISO();
        if (newStartTime)
            startTime = newStartTime

        const b = DateTime.fromISO(endTime, {zone: 'utc'})
        if (b > a.set({hour: Number.parseInt(userWorkingHours[0].working_hours.end), minute: 0})) {
            let newEndTime = b.set({hour: Number.parseInt(userWorkingHours[0].working_hours.end), minute: 0}).toISO()
            if (newEndTime)
                endTime = newEndTime
        }
        for (let i = 0; i < mergedTimeSlots.length; i++) {
            if (Date.parse(startTime) < Date.parse(mergedTimeSlots[i].start)) {
                freeTimeSlots.push({start: startTime, end: mergedTimeSlots[i].start})
                startTime = mergedTimeSlots[i].end;
            }else if (Date.parse(startTime) < Date.parse(mergedTimeSlots[i].end)){
                startTime = mergedTimeSlots[i].end

            }

        }

    }
    if (Date.parse(startTime) < Date.parse(endTime)) {
        freeTimeSlots.push({start: startTime, end: endTime});
    }

    return freeTimeSlots;
}


function findMeetingBlocksByUserAvailability(
    users: User[],
    startTime: string,
    endTime: string,
    interval: number,
): any[] {
    const timeBlocks: { block: string; user_ids: number[] }[] = [];
    const start = DateTime.fromISO(startTime, {zone: 'utc'});
    const end = DateTime.fromISO(endTime, {zone: 'utc'});

    let currentTime = start;
    while (currentTime <= end) {
        const blockStart = currentTime;
        const blockEnd = currentTime.plus({minutes: interval});

        let availableUserIds: number[] = [];
        for (const user of users) {
            const {working_hours, events} = user;
            const workingHoursStart = start
                .set({hour: parseInt(working_hours.start), minute: 0, second: 0})
                .setZone('utc');
            const workingHoursEnd = end
                .set({hour: parseInt(working_hours.end), minute: 0, second: 0})
                .setZone('utc');

            if (currentTime >= workingHoursStart && currentTime < workingHoursEnd) {
                const userAvailable = events.every((event: Event) => {
                    const eventStart = DateTime.fromISO(event.start, {zone: working_hours.time_zone});
                    const eventEnd = DateTime.fromISO(event.end, {zone: working_hours.time_zone});
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
}