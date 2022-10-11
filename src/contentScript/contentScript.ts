import getYoutubeVideoId from 'get-youtube-id';
import getChapters, { Chapter } from 'get-youtube-chapters';
import throttle from 'lodash.throttle';

import { MESSAGES } from '../constants';
import { getVideoData } from '../helpers';
import Storage from '../storage';
import { Player } from '../player';

const player = new Player();

const getVideoChapters = async (videoUrl: string) => {
    const videoId = getYoutubeVideoId(videoUrl);

    const videoData = await getVideoData(videoId, 'AIzaSyAw1ZgOioRtzReuUZ_wLPS5OHTVVn0YBhA');
    const chapters = getChapters(videoData.description);

    return chapters;
};

const handleCurrentTimeChange = throttle((e) => {
    Storage.setCurrentTime(e.target.currentTime);
}, 1000);

const initializeData = (chapters: Chapter[]) => {
    if (chapters.length > 0) {
        Storage.setChapters(chapters);

        player.init(handleCurrentTimeChange);

        Storage.setDuration(player.duration);
    }
};

window.addEventListener('load', async (event) => {
    const chapters = await getVideoChapters(window.location.href);

    initializeData(chapters);
});

chrome.runtime.onMessage.addListener(async (request) => {
    console.log('==>request', request);

    if (request.message === MESSAGES.CHANGE_URL) {
        const chapters = await getVideoChapters(request.url);

        initializeData(chapters);
    }

    if (request.message === MESSAGES.CHANGE_CHAPTER) {
        Storage.getChapters().then((chs) => {
            const currentTime = player.currentTime;
            const duration = player.duration;
            let currentIndex: number;

            chs.forEach((ch, index) => {
                if (
                    (index === chs.length - 1 && currentTime >= ch.start && currentTime <= duration) ||
                    (currentTime >= ch.start && currentTime < chs[index + 1]?.start)
                ) {
                    currentIndex = index;
                }
            });

            if (currentTime === duration && request.step === 1) {
                return;
            }

            if (currentIndex === chs.length - 1 && request.step === 1) {
                console.log('==>duration', duration);
                player.currentTime = duration;
                return;
            }

            if (currentIndex === 0 && request.step === -1) {
                player.currentTime = chs[currentIndex].start;
                return;
            }

            player.currentTime = chs[currentIndex + request.step].start;
        });
    }
});
