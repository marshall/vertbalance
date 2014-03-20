/**
 * VertBalance
 *
 * Copyright 2014, Marshall Culpepper
 * Licensed under the MIT License (see LICENSE.md)
 *
 * Core VertBalance logic
 */
var VertBalance = {
    _extId: null,
    _notifications: [],
    _version: 0,

    init: function() {
        this._extId = chrome.i18n.getMessage('@@extension_id');
        if (localStorage.vertData) {
            this.updateTotalBadge();
        }

        var self = this;
        chrome.management.get(this._extId, function(extInfo) {
            self._version = extInfo.version;
            $('#vertbalance-version').text(extInfo.version);

            self.checkOptions();
        });
    },

    checkOptions: function() {
        if (Object.keys(this.getAddresses()).length != 0 || localStorage.installTime) {
            return;
        }

        localStorage.installTime = String(Date.now());
        chrome.tabs.create({ url: 'options.html' });
    },

    updateData: function(updater) {
        var data = this.getData();
        updater(data);
        localStorage.vertData = JSON.stringify(data);
    },

    updateAddress: function(address, updater) {
        var data = this.getData();
        if (typeof(updater) === 'function') {
            updater(data.addresses[address]);
        } else if (typeof(updater) === 'object') {
            data.addresses[address] = $.extend(data.addresses[address], updater);
        }

        localStorage.vertData = JSON.stringify(data);
    },

    extendAddress: function(address, obj) {

    },

    save: function() {
        localStorage.vertData = JSON.stringify(this.getData());
    },

    getData: function() {
        if (!localStorage.vertData) {
            localStorage.vertData = JSON.stringify({
                addresses: {},
                popupSort: { column: 'balance', direction: 'descending' }
            });
        }

        return JSON.parse(localStorage.vertData);
    },

    getAddresses: function() {
        return this.getData().addresses;
    },

    addAddress: function(addr, addrData) {
        addrData = $.extend({ balance: 0, notify: true, notifyDelta: 0.10 }, addrData);
        this.updateData(function(data) {
            data.addresses[addr] = addrData;
        });
    },

    getTotal: function() {
        var total = 0;
        var addrs = this.getAddresses();
        Object.keys(addrs).forEach(function(address) {
            total += addrs[address].balance;
        }, this);
        return total;
    },

    getPopupSort: function() {
        return this.getData().popupSort;
    },

    setPopupSort: function(sort) {
        this.updateData(function(data) {
            data.popupSort = sort;
        });
    },

    updateBalances: function(callback) {
        var addresses = Object.keys(this.getAddresses());
        var complete = 0;
        addresses.forEach(function(address) {
            //http://explorer.vertcoin.org/chain/Vertcoin/q/addressbalance/ADDRESS
            var request = new XMLHttpRequest();
            request.responseType = 'json';
            var self = this;
            request.onload = function() {
                if (this.response) {
                    self.updateBalance(address, this.response);
                }
                complete++;
                if (complete == addresses.length - 1 && callback) {
                    callback();
                }
            };
            request.onerror = function() {
                console.log('error!');
            };
            request.open('GET', 'http://explorer.vertcoin.org/chain/Vertcoin/q/addressbalance/' + address, true);
            request.send();
        }, this);
    },

    updateBalance: function(address, balance) {
        var self = this;
        this.updateAddress(address, function(addr) {
            if (addr.notify && addr.notifyDelta > 0) {
                var delta = balance - addr.balance;
                if (Math.abs(delta) >= addr.notifyDelta) {
                    self.notifyBalance(address, delta);
                }
            }

            addr.balance = balance;
        });

        this.updateTotalBadge();
    },

    updateTotalBadge: function(balance) {
        chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0x66, 0, 230] });

        var total = this.getTotal();
        var label;
        if (total >= 10000) {
            label = sprintf('%dK', Math.floor(total / 1000));
        } else if (total >= 1000) {
            label = sprintf('%0.1fK', total / 1000.0);
        } else if (total >= 100) {
            label = '' + Math.floor(total);
        } else if (total >= 10) {
            label = sprintf('%0.1f', total);
        } else {
            label = sprintf('%0.2f', total);
        }

        chrome.browserAction.setBadgeText({ text: label });
    },

    notifyBalance: function(address, delta) {
        this._notifications.push({ address: address, delta: delta });
    },

    drawNotification: function() {
        var options = {
            title: 'Vertcoin balance changed',
            iconUrl: 'images/icon.png'
        };

        var addresses = this.getAddresses();
        function getMessage(notification) {
            var balance = addresses[notification.address].balance;
            return sprintf('[%+0.4f] => %0.4f', notification.delta, balance);
        }

        function getShortAddress(addr) {
            return addr.substring(0, 24) + '...';
        }

        var n0 = this._notifications[0];
        options.type = this._notifications.length == 1 ? 'basic' : 'list';
        if (this._notifications.length == 1) {
            options.message = getShortAddress(n0.address) + '\n' + getMessage(n0);
        } else {
            options.items = [];
            this._notifications.forEach(function(n) {
                options.items.push({ title: getShortAddress(n.address), message: getMessage(n) });
            }, this);
        }

        var self = this;
        var id = chrome.notifications.create('', options, function() {
            self._notifications = [];
        });
    }
};

$(function($) {
    VertBalance.init();
});
