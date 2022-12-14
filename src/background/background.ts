import { COMMANDS, MESSAGES } from '../constants';
import { sendMessageToActiveTab } from '../helpers';
import { IdleState } from '../types';
import Storage from '../storage';

const runCommand = (step: number) => {
    sendMessageToActiveTab(MESSAGES.CHANGE_CHAPTER, { step });
};

const resetBadgeDetails = () => {
    chrome.action.setIcon({ path: 'icon_disabled.png' });
    chrome.action.setBadgeText({ text: '' });
};

chrome.commands.onCommand.addListener((command) => {
    switch (command) {
        case COMMANDS.NEXT_CHAPTER: {
            runCommand(1);
            break;
        }
        case COMMANDS.PREV_CHAPTER: {
            runCommand(-1);
            break;
        }
        default:
            return;
    }
});

chrome.runtime.onInstalled.addListener(async(details) => {
    for (const cs of chrome.runtime.getManifest().content_scripts) {
        for (const tab of await chrome.tabs.query({ url: cs.matches })) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: cs.js,
            });
        }
    }
});

chrome.tabs.onActivated.addListener(() => {
    resetBadgeDetails();

    sendMessageToActiveTab(MESSAGES.CHANGE_ACTIVE_TAB);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.active) {
        chrome.tabs.sendMessage(tabId, {
            message: MESSAGES.CHANGE_URL,
            url: changeInfo.url,
        });
    }
});

chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === IdleState.ACTIVE) {
        sendMessageToActiveTab(MESSAGES.FORCE_INIT);
    }

    if (newState === IdleState.LOCKED) {
        Storage.cleanUpStorage();
    }
});

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    switch (data.message) {
        case MESSAGES.CHANGE_ACTIVE_ICON: {
            chrome.action.setIcon({ path: data.isActive ? 'icon.png' : 'icon_disabled.png' });
            break;
        }
        case MESSAGES.CHANGE_ICON_TEXT: {
            chrome.action.setBadgeText({ text: data.count > 0 ? `${data.count}` : '' });
            break;
        }
        case MESSAGES.GET_TAB_INFO: {
            sendResponse(sender?.tab);
            break;
        }
    }
});
