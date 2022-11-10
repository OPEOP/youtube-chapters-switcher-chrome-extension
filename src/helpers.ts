import { Chapter } from 'get-youtube-chapters';
import { YoutubeBody, YoutubeVideoInfo } from './types';

export const getVideoData = async (id, API_KEY): Promise<YoutubeVideoInfo> => {
    let res: Response;

    try {
        res = await fetch(`https://www.googleapis.com/youtube/v3/videos/?part=snippet&key=${API_KEY}&id=${id}`);
    } catch (e) {
        throw new Error({ ...e, message: `Fetch video data error: ${e.message}` });
    }

    let data: YoutubeBody;

    try {
        data = await res.json();
    } catch (e) {
        throw new Error({ ...e, message: `Response to json error: ${e.message}` });
    }

    if (data?.error) {
        throw new Error(`Data fetch error: ${data?.error.message}`);
    }

    return data?.items[0]?.snippet;
};

export const containsTimeChapter = (chapters: Chapter[], chapter: Chapter, currentTime: number, duration: number) => {
    const index = chapters.findIndex((ch) => ch.start === chapter.start);

    return (
        (index === chapters.length - 1 && currentTime >= chapter.start) ||
        (currentTime >= chapter.start && currentTime < chapters[index + 1]?.start)
    );
};

export const sendMessageToActiveTab = (message: string, data?: any) => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab?.id, { message, data });
    });
};