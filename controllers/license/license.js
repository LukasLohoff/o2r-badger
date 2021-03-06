/**
 * Include services used for the application
 */
const debug = require('debug')('badger');
const express = require('express');
const request = require('request');
const fs = require('fs');
const path = require('path');

const config = require('../../config/config');
const base = require('../base/base');
const steps = require('../base/commonSteps');

let badgeNASmall = config.licence.badgeNASmall;
let badgeNABig = config.licence.badgeNABig;

// read json file osi.json and od.json to compare whether the licence of the compendia is in the list of licences
const osi = JSON.parse(fs.readFileSync('./controllers/license/osi.json'));
const od = JSON.parse(fs.readFileSync('./controllers/license/od.json'));

exports.getBadgeFromData = (req, res) => {

    let passon = {
        body: req.body,
        extended: req.params.extended,
        req: req,
        res: res
    };

    // save tracking info
    passon.res.tracking = {
        type: req.params.type,
        doi: passon.id,
        extended: (passon.extended === 'extended'),
        size: req.query.width,
        format: (req.query.format === undefined) ? 'svg' : req.query.format
    };

    // check if there is a service for "licence"
    if (base.hasSupportedService(config.licence) === false) {
        debug('No service for badge %s found', passon.id);
        res.status(404).send('{"error":"no service for this type found"}');
        return;
    }

    return getLicenseFromCompendium(passon)
        .then(sendResponse)
        .then((passon) => {
            debug('Completed generating badge');
        })
        .catch(err => {
            if (err.badgeNA === true) { // Send 'N/A' badge
                debug("No badge information found: %s", err.msg);
                if (passon.extended === 'extended') {
                    passon.res.na = true;
                    passon.res.service = passon.service;
                    passon.req.filePath = path.join(__dirname, badgeNABig);
                    base.resizeAndSend(passon.req, passon.res);
                } else if (passon.extended === undefined) {
                    res.na = true;
                    res.tracking.service = passon.service;
                    res.redirect(badgeNASmall);
                } else {
                    res.status(404).send('not allowed');
                }
            } else { // Send error response
                debug('Error generating badge: "%s" Original request: "%s"', err, passon.req.url);
                let status = 500;
                if (err.status) {
                    status = err.status;
                }
                let msg = 'Internal error';
                if (err.msg) {
                    msg = err.msg;
                }
                res.status(status).send(JSON.stringify({ error: msg }));
            }
        });
};

exports.getBadgeFromReference = (req, res) => {

    let id = req.params.id;
    let extended;

    debug('Handling badge generation for id %s', req.params.id);

    if (typeof req.params.extended !== 'undefined') {
        extended = req.params.extended;
    }

    let passon = {
        id: id,
        extended: extended,
        req: req,
        res: res
    };

    // save tracking info
    passon.res.tracking = {
        type: req.params.type,
        doi: passon.id,
        extended: (passon.extended === 'extended'),
        size: req.query.width,
        format: (req.query.format === undefined) ? 'svg' : req.query.format
    };

    // check if there is a service for "licence"
    if (base.hasSupportedService(config.licence) === false) {
        debug('No service for badge %s found', passon.id);
        res.status(404).send('{"error":"no service for this type found"}');
        return;
    }

    return steps.getCompendiumID(passon)
        .then(steps.getCompendium)
        .then(getLicenseFromCompendium)
        .then(sendResponse)
        .then((passon) => {
            debug('Completed generating licence badge for %s', passon.id);
            //done(passon.id, null);
        })
        .catch(err => {
            if (err.badgeNA === true) { // Send "N/A" badge
                debug("No badge information found: %s", err.msg);
                if (passon.extended === 'extended') {
                    passon.res.na = true;
                    passon.res.service = passon.service;
                    passon.req.filePath = path.join(__dirname, badgeNABig);
                    base.resizeAndSend(passon.req, passon.res);
                } else if (passon.extended === undefined) {
                    res.na = true;
                    res.tracking.service = passon.service;
                    res.redirect(badgeNASmall);
                } else {
                    res.status(404).send('not allowed');
                }
            } else { // Send error response
                debug('Error generating badge: "%s" Original request: "%s"', err, passon.req.url);
                let status = 500;
                if (err.status) {
                    status = err.status;
                }
                let msg = 'Internal error';
                if (err.msg) {
                    msg = err.msg;
                }
                res.status(status).send(JSON.stringify({ error: msg }));
            }
        });
};

function getLicenseFromCompendium(passon) {
    return new Promise((fulfill, reject) => {
        let compendiumJSON = passon.body;
        let osicode;
        let oddata;
        let odtext;
        let datalicence;
        let textlicence;
        let codelicence;

        // those values are in the json then
        //json validation
        if(compendiumJSON.hasOwnProperty('metadata') && compendiumJSON.metadata.hasOwnProperty('o2r') && compendiumJSON.metadata.o2r.hasOwnProperty('license')) {
            if(compendiumJSON.metadata.o2r.license.hasOwnProperty('data')) {
                datalicence = compendiumJSON.metadata.o2r.license.data;
            }
            else datalicence = 'unknown';
            if(compendiumJSON.metadata.o2r.license.hasOwnProperty('text')) {
                textlicence = compendiumJSON.metadata.o2r.license.text;
            }
            else textlicence = 'unknown';
            if(compendiumJSON.metadata.o2r.license.hasOwnProperty('code')) {
                codelicence = compendiumJSON.metadata.o2r.license.code;
            }
            else codelicence = 'unknown';

            //check for all licences if they are included in our list of compatible compendia
            if(datalicence === 'unknown') {
                oddata = 'unknown';
            }
            else {
                oddata = od.hasOwnProperty(datalicence);
            }

            if(textlicence === 'unknown') {
                odtext = 'unknown';
            }
            else {
                odtext = od.hasOwnProperty(textlicence);
            }

            if(codelicence === 'unknown') {
                osicode = 'unknown';
            }
            else {
                osicode = osi.hasOwnProperty(codelicence);
            }
            passon.service = 'o2r';
        } else {
            osicode = 'unknown';
            oddata = 'unknown';
            odtext = 'unknown';
        }
        passon.osiCode = osicode;
        passon.odData = oddata;
        passon.odText = odtext;
        fulfill(passon);
    });
}

function getLicenseFromDOAJ(passon) {
    return new Promise((fulfill, reject) => {
        let osicode;
        let oddata;
        let odtext;

        //todo: replace "if" with "multiple services" implementation
        if (passon.osiCode === 'unknown' && passon.odData === 'unknown' && passon.odText === 'unknown') {
            let requestURL = config.ext.doajArticles + encodeURIComponent('doi:' + passon.id);
            debug('Fetching licence from %s with URL', config.ext.doajArticles, requestURL);

            //request DOIJ API to get license
            //e.g. https://doaj.org/api/v1/search/articles/doi%3A10.3390%2Frs2081892
            request({
                url: requestURL,
                timeout: config.timeout.doaj,
                proxy: config.net.proxy
            }, function(error, response, body) {
                if (error) {
                    error.msg = 'error accessing doaj';
                    error.status = 404;
                    reject(error);
                    return;
                }

                try {
                    let data = JSON.parse(body);
                    passon.odText = data.results[0].bibjson.journal.license[0].open_access;
                } catch (err) {
                    err.msg = 'error getting license from doaj';
                    err.badgeNA = true;
                    reject(err);
                    return;
                }
                passon.service = 'doaj';
                fulfill(passon); 
            });
        } else {
            fulfill(passon);
        }
    });
}

function sendResponse(passon) {
    return new Promise((fulfill, reject) => {
        debug('Sending badge for licence code %s, data %s, text %s', passon.osiCode, passon.odData, passon.odText);

        if (typeof passon.osiCode === 'undefined' ||
            typeof passon.odData === 'undefined' ||
            typeof passon.odText === 'undefined') {
            let error = new Error();
            error.msg = 'no license provided';
            error.status = 404;
            error.badgeNA = true;
            reject(error);
            return;
        }

        if (passon.osiCode === 'unknown' &&
            passon.odData === 'unknown' &&
            passon.odText === 'unknown') {
            let error = new Error();
            error.msg = 'license is unknown';
            error.status = 404;
            error.badgeNA = true;
            reject(error);
            return;
        }

        let localPath;
        let badgeString;
        let osicode = passon.osiCode;
        let oddata = passon.odData;
        let odtext = passon.odText;

        // compare the boolean values of the code / data / text licences to determine the badge to send it to the client
        if(passon.extended === 'extended') {
            if(osicode===true && oddata===true && odtext===true){
                localPath ='badges/license_open.svg';
            }

            else if(osicode===false && oddata===true && odtext===true){
                localPath = 'badges/license_data_noCode_text.svg';
            }

            else if(osicode===true && oddata===false && odtext===true){
                localPath = 'badges/license_noData_code_text.svg';
            }

            else if(osicode===true && oddata===true && odtext===false){
                localPath = 'badges/license_data_code_noText.svg';
            }

            else if(osicode===false && oddata===false && odtext===true){
                localPath = 'badges/license_noData_noCode_text.svg';
            }

            else if(osicode===false && oddata===true && odtext===false){
                localPath = 'badges/license_data_noCode_noText.svg';
            }

            else if(osicode===true && oddata===false && odtext===false){
                localPath = 'badges/license_noData_code_noText.svg';
            }

            else if(osicode===false && oddata===false && odtext===false){
                localPath = 'badges/license_closed.svg';
            }
            //cases for unknown licences for one tag
            else if(osicode === 'unknown') {
                if(oddata === true && odtext === true) {
                    localPath = 'badges/license_data_text.svg';
                }
                else if(oddata === true && odtext === false) {
                    localPath = 'badges/license_data_noText.svg';
                }
                else if(oddata === false && odtext === true) {
                    localPath = 'badges/license_noData_text.svg';
                }
                else if(oddata === false && odtext === false) {
                    localPath = 'badges/license_noData_noText.svg';
                }
                else if(oddata === 'unknown' && odtext === false) {
                    localPath = 'badges/license_noText.svg';
                }
                else if(oddata === 'unknown' && odtext === true) {
                    localPath = 'badges/license_text.svg';
                }
                else if(oddata === false && odtext === 'unknown') {
                    localPath = 'badges/license_noData.svg';
                }
                else if(oddata === true && odtext === 'unknown') {
                    localPath = 'badges/license_data.svg';
                }
            }
            else if(oddata === 'unknown') {
                if(osicode === true && odtext === true) {
                    localPath = 'badges/license_code_text.svg';
                }
                else if(osicode === true && odtext === false) {
                    localPath = 'badges/license_code_noText.svg';
                }
                else if(osicode === false && odtext === true) {
                    localPath = 'badges/license_noCode_text.svg';
                }
                else if(osicode === false && odtext === false) {
                    localPath = 'badges/license_noCode_noText.svg';

                }
                else if(osicode === false && odtext === 'unknown') {
                    localPath = 'badges/license_noCode.svg';
                }
                else if(osicode === true && odtext === 'unknown') {
                    localPath = 'badges/license_code.svg';
                }
            }
            else if(odtext === 'unknown') {
                if(osicode === true && oddata === true) {
                    localPath = 'badges/license_data_code.svg';
                }
                else if(osicode === true && oddata === false) {
                    localPath = 'badges/license_noData_code.svg';
                }
                else if(osicode === false && oddata === true) {
                    localPath = 'badges/license_data_noCode.svg';
                }
                else if(osicode === false && oddata === false) {
                    localPath = 'badges/license_noData_noCode.svg';
                }
            }

            if (passon.service === undefined) {
                passon.service = 'unknown';
            }

            // request options
            let options = {
                dotfiles: 'deny',
                headers: {
                    'x-timestamp': Date.now(),
                    'x-sent': true,
                }
            };

            // Send the request (+ scaling)
            passon.req.filePath = path.join(__dirname, localPath);
            passon.res.tracking.service = passon.service;
            passon.req.options = options;
            debug('Sending SVG %s to scaling service', passon.req.filePath);
            base.resizeAndSend(passon.req, passon.res);
            fulfill(passon);
        }
        else {
            if(osicode===true && oddata===true && odtext===true){
                badgeString = 'licence-open-44cc11.svg';
            }
            else if(osicode===false && oddata===true && odtext===true || osicode===true && oddata===false && odtext===true || osicode===true && oddata===true && odtext===false){
                badgeString = 'licence-mostly%20open-yellow.svg';
            }
            else if(osicode===false && oddata===false && odtext===true || osicode===false && oddata===true && odtext===false || osicode===true && oddata===false && odtext===false){
                badgeString = 'licence-partially%20open-fe7d00.svg';
            }
            else if(osicode===false && oddata===false && odtext===false){
                badgeString = 'licence-closed-ff0000.svg';
            }
            //cases for unknown licences for one tag
            else if(osicode === 'unknown') {
                if(oddata === true && odtext === true) {
                    badgeString = 'licence-mostly%20open-yellow.svg';
                }
                else if(oddata === true && odtext === false) {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
                else if(oddata === false && odtext === true) {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
                else if(oddata === false && odtext === false) {
                    badgeString = 'licence-closed-ff0000.svg';
                }
                else if(oddata === 'unknown' && odtext === false) {
                    badgeString = 'licence-closed-ff0000.svg';
                }
                else if(oddata === 'unknown' && odtext === true) {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
                else if(oddata === false && odtext === 'unknown') {
                    badgeString = 'licence-closed-ff0000.svg';
                }
                else if(oddata === true && odtext === 'unknown') {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
            }
            else if(oddata === 'unknown') {
                if(osicode === true && odtext === true) {
                    badgeString = 'licence-mostly%20open-yellow.svg';
                }
                else if(osicode === true && odtext === false) {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
                else if(osicode === false && odtext === true) {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
                else if(osicode === false && odtext === false) {
                    badgeString = 'licence-closed-ff0000.svg';
                }
                else if(osicode === false && odtext === 'unknown') {
                    badgeString = 'licence-closed-ff0000.svg';
                }
                else if(osicode === true && odtext === 'unknown') {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
            }
            else if(odtext === 'unknown') {
                if(osicode === true && oddata === true) {
                    badgeString = 'licence-mostly%20open-yellow.svg';
                }
                else if(osicode === true && oddata === false) {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
                else if(osicode === false && oddata === true) {
                    badgeString = 'licence-partially%20open-fe7d00.svg';
                }
                else if(osicode === false && oddata === false) {
                    badgeString = 'licence-closed-ff0000.svg';
                }
            }

            passon.res.tracking.service = passon.service;
            let redirectURL = config.badge.baseURL + badgeString + config.badge.options;
            passon.res.redirect(redirectURL);
            fulfill(passon);
        }
    });
}