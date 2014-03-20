/**
 * VertBalance
 *
 * Copyright 2014, Marshall Culpepper
 * Licensed under the MIT License (see LICENSE.md)
 *
 * Extension background page
 */
chrome.alarms.create("vertbalance", { periodInMinutes: 1 });
chrome.alarms.create("vertnotifier", { periodInMinutes: 2 });

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name == 'vertbalance') {
        VertBalance.updateBalances();
    } else if (alarm.name == 'vertnotifier') {
        VertBalance.drawNotification();
    }
});

VertBalance.updateBalances(function() {
    VertBalance.drawNotification();
});
