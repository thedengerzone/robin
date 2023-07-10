import http from 'http';
import { parse } from 'url';
import {
    commonMeetingTimesWithoutWorkingHours,
    findCommonMeetingTimesWithinWorkingHours,
    findMeetingBlocksByUserAvailability
} from './commonMettingTimesService';

const server = http.createServer((req : any, res : any) => {
    const { pathname } = parse(req.url as string, true);
    let body = '';

    req.on('data', (chunk: string) :void => {
        body += chunk;
    });

    req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        let response;

        try {
            const requestBody = JSON.parse(body);
            const { users, startTime, endTime, interval } = requestBody;

            if (pathname === '/common-meeting-times') {
                const timeBlocks = commonMeetingTimesWithoutWorkingHours(users, startTime, endTime);
                response = { timeBlocks };
            } else if (pathname === '/common-meeting-times-within-working-hours') {
                const commonTimes = findCommonMeetingTimesWithinWorkingHours(users, startTime, endTime);
                response = { commonTimes };
            } else if (pathname === '/meeting-blocks-by-user-availability') {
                const meetingBlocks = findMeetingBlocksByUserAvailability(users, startTime, endTime, interval);
                response = { meetingBlocks };
            } else {
                response = { error: 'Invalid endpoint' };
            }
        } catch (error) {
            response = { error: 'Invalid request body' };
        }

        res.end(JSON.stringify(response));
    });

});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
