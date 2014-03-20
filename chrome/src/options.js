/**
 * VertBalance
 *
 * Copyright 2014, Marshall Culpepper
 * Licensed under the MIT License (see LICENSE.md)
 *
 * Extension options UI
 */
$(function($) {
    function updateAddressCount(count) {
        if (count > 0) {
            $('#update-balance').removeAttr('disabled');
        } else {
            $('#update-balance').attr('disabled', 'disabled');
        }
    }

    function addAddress(addr) {
        var addrs = VertBalance.getAddresses();
        updateAddressCount(Object.keys(addrs).length);

        var addrObj = addrs[addr];
        var container = $('#address-template').clone();
        container.attr('id', addr);

        container.find('.address').text(addr).
            attr('href', 'http://explorer.vertcoin.org/address/' + addr);

        var addrLabel = container.find('.address-label');
        var notifyCheck = container.find('.address-notify');
        var notifyDelta = container.find('.address-notify-delta');

        addrLabel.attr('id', addr + '_label')
                 .keyup(function() {
                    VertBalance.updateAddress(addr, { label: $(this).val() });
                 });

        notifyCheck.attr('id', addr + '_notify').
                    click(function() {
                        VertBalance.updateAddress(addr, {
                            notify: $(this).prop('checked'),
                            notifyDelta: parseFloat(container.find('.address-notify-delta').val())
                        });
                    });

        notifyDelta.attr('id', addr + '_notifyDelta').
                    keyup(function() {
                        try {
                            VertBalance.updateAddress(addr, {
                                notifyDelta: parseFloat($(this).val())
                            });
                        } catch (e) { }
                    });

        container.find('label').attr('for', addr + '_notify');

        if (addrObj.label) {
            $(addrLabel).val(addrObj.label);
        }

        if (addrObj.notify) {
            $(notifyCheck).prop('checked', true);
            $(notifyDelta).removeAttr('disabled');
        }

        if (addrObj.notifyDelta > 0) {
            $(notifyDelta).val(sprintf('%0.2f', addrObj.notifyDelta));
        } else {
            $(notifyDelta).val('0.10');
        }

        container.find('.remove').click(function() {
            var count;
            VertBalance.updateData(function(data) {
                delete data.addresses[addr];
                count = Object.keys(data.addresses).length;
            });

            container.remove();
            updateAddressCount(count);
        });

        $('#new-address').before(container);
    }

    function fillAddresses() {
        var addrs = VertBalance.getAddresses();
        Object.keys(addrs).forEach(addAddress, this);
    }

    function addAddressClicked() {
        var addr = $('#address').val().trim();

        var data = {
            notify: $('#new-address .address-notify').prop('checked'),
        };

        var label = $('#new-address .address-label').val();
        if (label) {
            data.label = label;
        }

        try {
            data.notifyDelta = parseFloat($('#new-address .address-notify-delta').val());
        } catch (e) {
        }

        VertBalance.addAddress(addr, data);
        addAddress(addr);

        $('#address').val(null);
        $('#new-address .address-label').val(null);
        $('#new-address .address-notify').prop('checked', true);
        $('#new-address .address-notify-delta').val('0.10');
        updateMessage();
        VertBalance.updateBalances();
    }

    function updateMessage(message, valid) {
        var visible = message !== undefined ? 'visible' : 'hidden';
        $('#messages').text(message || 'x').
                   css('visibility', visible).
                   toggleClass('error', valid === false).
                   toggleClass('success', valid === true);

        $('#new-address img.addr').attr('src', 'images/icon.png');
        if (valid === true) {
            $('#add-address').removeAttr('disabled');
        } else {
            if (valid === false) {
                $('#new-address img.addr').attr('src', 'images/x.png');
            }
            $('#add-address').attr('disabled', 'disabled');
        }
    }

    $('#address').keyup(function() {
        updateMessage();

        var addr = $(this).val();
        addr = addr ? addr.trim() : null;
        if (!addr) {
            return;
        }

        if (addr in VertBalance.getAddresses()) {
            updateMessage('Already have address', false);
            return;
        }

        var result = Validator.validateAddress(addr);
        var message = result === true ? 'Valid Vertcoin address' : result;
        updateMessage(message, result === true);
    });

    $('#add-address').click(addAddressClicked);
    $('#update-balance').click(function() {
        VertBalance.updateBalances();
    });

    $('body').on('click', 'a', function(){
        var href = $(this).attr('href');
        chrome.tabs.create({url: href});
        return false;
    });

    fillAddresses();
});
