const debug = require('debug')('badger');
const config = require('../../config/config');
var request = require('request');
var scaling = require('../scaling/scaling');
var path = require('path');

exports.getBadgeFromData = (req, res) => {

    let passon = {
        status : this.req.query.status,
        extended: this.req.query.extended,
        req: this.req,
        res: this.res
    };

    return sendResponse(passon)
        .then((passon) => {
            debug('Completed generating badge');
            //done(passon.id, null);
        })
        .catch(err => {
            debug('Badge information not found: %s',
                JSON.stringify(err));

            if (err.badgeNA === true) { // Send "N/A" badge
                if (passon.extended === 'extended') {
                    passon.req.filePath = path.join(__dirname, 'badges/Executable_noInfo.svg');
                    scaling.resizeAndSend(passon.req, passon.res);
                } else if (passon.extended === undefined) {
                    res.redirect("https://img.shields.io/badge/executable-n%2Fa-9f9f9f.svg");
                } else {
                    res.status(404).send('not allowed');
                }
            } else { // Send error response
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
            //done(null, err);
        });
}

exports.getBadgeFromReference = (req, res) => {
    //read the params from the URL
    var id = req.params.id;
    var jobID;
    var compendiumID;

    var extended;

    var width = req.query.width;
    var format = req.query.format;

    debug('Handling %s badge generation for id %s', req.params.type, req.params.id);

    //extract doi from the id parameter (e.g. doi:11.999/asdf.jkl)
    if(id.substring(0, 4) === "doi:") {
        id = id.substring(4);
    } else {
        debug('doi is invalid');
        res.redirect("https://img.shields.io/badge/executable-n%2Fa-9f9f9f.svg");
        return;
    }

    if (typeof req.query.extended !== 'undefined') {
        extended = req.query.extended;
    }

    let passon = {
        id: id,
        extended: extended,
        req: this.req,
        res: this.res
    };

    return getCompendiumID(passon)
        .then(getJobID)
        .then(getJobStatus)
        .then(sendResponse)
        .then((passon) => {
            debug('Completed generating badge for %s', passon.id);
            //done(passon.id, null);
        })
        .catch(err => {
            debug('Badge information not found: %s',
                JSON.stringify(err));
            
            if (err.badgeNA === true) { // Send "N/A" badge
                if (passon.extended === 'extended') {
                    passon.req.filePath = path.join(__dirname, 'badges/Executable_noInfo.svg');
                    scaling.resizeAndSend(passon.req, passon.res);
                } else if (passon.extended === undefined) {
                    res.redirect("https://img.shields.io/badge/executable-n%2Fa-9f9f9f.svg");
                } else {
                    res.status(404).send('not allowed');
                }
            } else { // Send error response
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
            //done(null, err);
        });
}


function getCompendiumID(passon) {
    return new Promise((fulfill, reject) => {
        debug('Fetching compendium ID from %s for DOI %s', config.ext.o2r, passon.id);

        request(config.ext.o2r + '/api/v1/compendium?doi=' + passon.id, function(error, response, body) {

            // no job for the given id available
            if(error) {
                debug(error);
                reject(error);
                return;
            }
            // status responses
            if(response.statusCode === 404 || !body.results || response.status === 500) {
                let error = new Error();
                error.msg = 'no compendium found';
                error.status = 404;
                error.badgeNA = true;
                reject(error);
            }
            else if(response.statusCode === 500 || response.status === 500) {
                let error = new Error();
                error.msg = 'Unable to find data on server';
                error.status = 500;
                reject(error);
            }

            var data = JSON.parse(body);

            // If exactly one compendium was found, contiune. Otherwise, redirect to the "N/A badge"
            if (data.results && data.results.length === 1) {
                passon.compendiumID = data.results[0];
                fulfill(passon);
            } else {
                debug('Found more than one compendium for DOI %s', passon.id);
                let error = new Error();
                error.msg = 'no compendium found';
                error.status = 404;
                error.badgeNA = true;
                reject(error);
            }

        });

    });
}

function getJobID(passon) {
    return new Promise((fulfill, reject) => {
        debug('Fetching job ID for compendium %s from %s', passon.compendiumID, config.ext.o2r);

        request(config.ext.o2r + '/api/v1/job?compendium_id=' + passon.compendiumID, function(error, response, body) {

            // no job for the given id available
            if(error) {
                debug(error);
                reject(error);
                return;
            }
            // status responses
            if(response.status === 404 || !body.results) {
                let error = new Error();
                error.msg = 'no job found';
                error.status = 404;
                error.badgeNA = true;
                reject(error);
            }
            else if(response.status === 500) {
                let error = new Error();
                error.msg = 'Unable to find data on server';
                error.status = 500;
                reject(error);
            }

            // Continue with jobID
            var data = JSON.parse(body);
            passon.jobID = data.results[0];
            fulfill(passon);
        });
    });
}

function getJobStatus(passon) {
    return new Promise((fulfill, reject) => {
        debug('Fetching job status for job %s from %s', passon.jobID, config.ext.o2r);

        request(config.ext.o2r + '/api/v1/job/' + passon.jobID, function(error, response, body) {

            // no job for the given id available
            if(error) {
                debug(error);
                reject(error);
                return;
            }
            // status responses
            if(response.status === 404 || !body.results) {
                let error = new Error();
                error.msg = 'no job data found';
                error.status = 404;
                error.badgeNA = true;
                reject(error);
            }
            else if(response.status === 500) {
                let error = new Error();
                error.msg = 'Unable to find data on server';
                error.status = 500;
                reject(error);
            }

            // Continue with jobID
            var data = JSON.parse(body);
            passon.jobStatus = data.status;
            fulfill(passon);
        });
    });
}

function sendResponse(passon) {
    return new Promise((fulfill, reject) => {
        debug('Sending response for status', passon.jobStatus, config.ext.o2r);

        if(passon.extended === "extended") {
            //if the status is "success" the green badge is sent to the client
            if (data.status === "success") {
                passon.req.filePath = path.join(__dirname, 'badges/Executable_Green.svg');
            }
            // for a "fail" the red badge is sent
            else if (data.status === "failure") {
                passon.req.filePath = path.join(__dirname, 'badges/Executable_Red.svg');
            }
            // and for the running status the yellow badge is sent to the client
            else if (data.status === "running") {
                passon.req.filePath = path.join(__dirname, 'badges/Executable_Running.svg');
            }
            else {
                passon.req.filePath = path.join(__dirname, 'badges/Executable_noInfo.svg');
            }

            // Send the request
            scaling.resizeAndSend(passon.req, passon.res);
            fulfill(passon);

        } else if (passon.extended === undefined) {
            //if the status is "success" the green badge is sent to the client
            if (data.status === "success") {
                // send the reponse from our server
                passon.res.redirect('https://img.shields.io/badge/executable-yes-44cc11.svg');
                fulfill(passon);
            }
            // for a "fail" the red badge is sent
            else if (data.status === "failure") {
                passon.res.redirect('https://img.shields.io/badge/executable-no-ff0000.svg');
                fulfill(passon);
            }
            // and for the running status the yellow badge is sent to the client
            else if (data.status === "running") {
                passon.res.redirect('https://img.shields.io/badge/executable-running-yellow.svg');
                fulfill(passon);
            }
            else {
                passon.res.redirect('https://img.shields.io/badge/executable-n%2Fa-9f9f9f.svg');
                fulfill(passon);
            }
        } else {
            let error = new Error();
            error.msg = 'value for parameter extended not allowed';
            error.status = 404;
            reject(error);
        }
    });
}
