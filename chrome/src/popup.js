/**
 * VertBalance
 *
 * Copyright 2014, Marshall Culpepper
 * Licensed under the MIT License (see LICENSE.md)
 *
 * Extension popup window UI
 */
$(function($) {
    $('#vertcoin-addresses').css('display', 'block');

    function buildTable() {
        $('#vertcoin-addresses tr').each(function() {
            var id = $(this).attr('id');
            if (id !== 'address-template' && id !== 'address-headers') {
                $(this).remove();
            }
        });

        var addrs = VertBalance.getAddresses();
        var addrKeys = Object.keys(addrs);

        $('#no-addresses').css('display', addrKeys.length == 0 ? 'block' : 'none');
        $('#vertcoin-addresses').css('display', addrKeys.length == 0 ? 'none' : 'block');

        function sortByMapKey(list, map, key) {
            list.sort(function(a, b) {
                var valA = map[a][key];
                var valB = map[b][key];
                if (valA !== undefined && valB === undefined) {
                    return 1;
                } else if (valA === undefined && valB !== undefined) {
                    return -1;
                } else {
                    if (valA === valB) {
                        return 0;
                    }
                    return valA > valB  ? 1 : -1;
                }
            });
        }

        var sort = VertBalance.getPopupSort();
        if (sort && sort.column && sort.direction) {
            $('.sort-label').removeClass('sort-descending sort-ascending');
            $('.sort-label[data-col=' + sort.column + ']').addClass('sort-' + sort.direction);

            if (sort.column == 'label' || sort.column == 'balance') {
                sortByMapKey(addrKeys, addrs, sort.column);
            } else if (sort.column == 'address') {
                addrKeys.sort();
            }

            if (sort.direction == 'descending') {
                addrKeys.reverse();
            }
        }

        addrKeys.forEach(function(addr) {
            var addrObj = addrs[addr];
            var row = $('#address-template').clone();
            row.attr('id', null);

            var label = addrObj.label || 'No Label';
            row.find('.address-label').text(label).toggleClass('no-label', !addrObj.label);

            var shortAddr = addr.substr(0, 10);
            row.find('.address').text(shortAddr).
                attr('href', 'http://explorer.vertcoin.org/address/' + addr);
            row.find('.balance').text(sprintf('%0.4f', addrObj.balance));
            $('#vertcoin-addresses').append(row);
        });

        var total = $('<tr>');
        total.append($('<th>').addClass('total').attr('colspan', '2').append('<b>Total</b>'));
        total.append($('<th>').addClass('balance').text(sprintf('%0.4f', VertBalance.getTotal())));
        $('#vertcoin-addresses').append(total);
    }

    $('body').on('click', 'a', function() {
        chrome.tabs.create({url: $(this).attr('href')});
        return false;
    });

    $('body').on('click', '.sort-label', function() {
        var column = $(this).data('col');
        var direction = $(this).hasClass('sort-descending') ? 'ascending' : 'descending';

        VertBalance.setPopupSort({ column: column, direction: direction });
        buildTable();
    });

    buildTable();
});
