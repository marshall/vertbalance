/**
 * VertBalance
 *
 * Copyright 2014, Marshall Culpepper
 * Licensed under the MIT License (see LICENSE.md)
 *
 * Vertcoin public address validator
 */
var Validator = (function() {
    var ADDR_SIZE = 25;
    var ADDR_VERSION = 0x47; // Vertcoin address version (the 'V' prefix)
    var BASE58_TABLE = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    var BASE58_TABLE_INTS = [];
    for (var i = 0; i < 58; i++) {
        BASE58_TABLE_INTS[BASE58_TABLE[i]] = int2bigInt(i, 8, 0);
    }

    function validateAddress(addr) {
        var decoded;
        try {
            decoded = base58Decode(addr);
        } catch (e) {
            if (typeof(e) === 'string') {
                return e;
            } else {
                throw e;
            }
        }

        if (!decoded) {
            return 'Invalid address';
        }

        if (decoded.length != ADDR_SIZE) {
            return 'Decoded address was not 25 bytes';
        }

        var version = decoded.charCodeAt(0);
        if (version !== ADDR_VERSION) {
            return 'Incorrect version ' + version + ', expected ' + ADDR_VERSION + '. Is this a Vertcoin address?';
        }

        var checksum = decoded.substr(decoded.length - 4);
        var rest = decoded.substr(0, decoded.length - 4);
        var goodChecksum = hex2a(sha256_digest(hex2a(sha256_digest(rest)))).substr(0, 4);

        if (checksum != goodChecksum) {
            return 'Invalid checksum ' + a2hex(checksum) + ', expected ' + a2hex(goodChecksum);
        }

        return true;
    }

    function base58Decode(string) {
        var l = string.length;
        var longValue = int2bigInt(0, 1, 0);
        var num58 = int2bigInt(58, 8, 0);

        var c;
        for (var i = 0; i < l; i++) {
            c = string[l - i - 1];
            if (!(c in BASE58_TABLE_INTS)) {
                throw 'Invalid character ' + c;
            }

            longValue = add(longValue, mult(BASE58_TABLE_INTS[c], pow(num58, i)));
        }

        var hex = bigInt2str(longValue, 16);
        var str = hex2a(hex);

        var nPad;
        for (nPad = 0; string[nPad] == BASE58_TABLE[0]; nPad++);

        var output = str;
        if (nPad > 0) output = repeat("\0", nPad) + str;

        return output;
    }

    function hex2a(hex) {
        var str = '';
        for (var i = 0; i < hex.length; i += 2) {
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        }
        return str;
    }

    function a2hex(str) {
        var aHex = "0123456789abcdef";
        var l = str.length;
        var nBuf;
        var strBuf;
        var strOut = "";
        for (var i = 0; i < l; i++) {
          nBuf = str.charCodeAt(i);
          strBuf = aHex[Math.floor(nBuf/16)];
          strBuf += aHex[nBuf % 16];
          strOut += strBuf;
        }
        return strOut;
    }

    function pow(big, exp) {
        if (exp == 0) return int2bigInt(1, 1, 0);
        var i;
        var newbig = big;
        for (i = 1; i < exp; i++) {
            newbig = mult(newbig, big);
        }

        return newbig;
    }

    function repeat(s, n) {
        var a = [];
        while (a.length < n) {
            a.push(s);
        }
        return a.join('');
    }

    return {
        validateAddress: validateAddress
    };
})();
