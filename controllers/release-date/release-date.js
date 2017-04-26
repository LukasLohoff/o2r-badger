const debug = require('debug')('badger');
var crossref = "http://api.crossref.org/works/";

/**
 * Include services used for the application
 */
var request = require('request');

exports.getReleaseDateBadge = (req, res) => {

    var doi = req.params.doi;
    doi = doi.split(":");
    doi = doi[1];
    var extended = req.params.extended;
    var badge;

    // Request to crossref to get information for the paper with the given doi
    request(
        {
        url: crossref + doi,
        proxy: "http://wwwproxy.uni-muenster.de:80"
        },
        function (error, response, body) {

        // error handling of request to crossref
        if (error) {
            debug(error);
        }
        if (!response || response.status == 404 || response.statusCode == 404) {
            res.status(404).send('not available');
            return;
        } else if (response.status == 500 || response.statusCode == 500 || error) {
            res.status(500).send('Unable to find data on server: %s', error);
            return;
        }

        // get the created date (if available)
        if(response.body != undefined){
            // parse the response to json
            var jsonResponse = JSON.parse(response.body);
            if(jsonResponse.message.issued != undefined){
                // get the issued parameter
                var issued = jsonResponse.message.issued;
                if(issued["date-parts"] != undefined || issued["date-parts"] != ""){
                    // get the date part (containing the release date)
                    var date = issued["date-parts"][0];
                    debug(date);
                } else {
                    sendUndefined();
                    return;
                }
            } else {
                sendUndefined();
                return;
            }
        } else {
            sendUndefined();
            return;
        }

        // send the no information badge
        function sendUndefined() {
            if(extended == 'extended'){
                badge = 'badges/released_no_information.svg';
                res.sendFile(badge, { root : __dirname}, function (err) {
                    if (err) {
                        debug(err);
                        res.status(err.status).end();
                    }
                    else debug('Sent file: ', badge);
                });
            } else {
                res.redirect('https://img.shields.io/badge/release%20time-n%2Fa-lightgrey.svg');
            }
        }

        /*************** send big badges *************/
        // todo take leapyears into account
        if (extended == 'extended') {

            // check if day and month are given
            // if not, set them to 0
            var releaseDay = 0;
            if(date[2] != undefined)
                releaseDay = date[2];
            var releaseMonth = 0;
            if(date[1] != undefined)
                releaseMonth = date[1];

            var currentDate = new Date().getTime();
            var releaseDate = new Date(date[0], releaseMonth, releaseDay, 0, 0, 0, 0).getTime();


            if (releaseDate > currentDate-31536000000) {
                badge = 'badges/released_year.svg';
                res.sendFile(badge, { root : __dirname}, function (err) {
                    if (err) {
                        debug(err);
                        res.status(err.status).end();
                    }
                    else debug('Sent file: ', badge);
                });
            }
            else if (releaseDate > currentDate-157680000000) {
                badge = 'badges/released_5_year.svg';
                res.sendFile(badge, { root : __dirname}, function (err) {
                    if (err) {
                        debug(err);
                        res.status(err.status).end();
                    }
                    else debug('Sent file: ', badge);
                });
            }
            else if (releaseDate > currentDate-315360000000) {
                badge = 'badges/released_10_years.svg';
                res.sendFile(badge, { root : __dirname}, function (err) {
                    if (err) {
                        debug(err);
                        res.status(err.status).end();
                    }
                    else debug('Sent file: ', badge);
                });
            }
            else if (releaseDate > currentDate-630720000000) {
                badge = 'badges/released_20_years.svg';
                res.sendFile(badge, { root : __dirname}, function (err) {
                    if (err) {
                        debug(err);
                        res.status(err.status).end();
                    }
                    else debug('Sent file: ', badge);
                });
            }
            else if (releaseDate > currentDate-946080000000) {
                badge = 'badges/released_30_years.svg';
                res.sendFile(badge, { root : __dirname}, function (err) {
                    if (err) {
                        debug(err);
                        res.status(err.status).end();
                    }
                    else debug('Sent file: ', badge);
                });
            }
            else if (releaseDate > currentDate-1261440000000) {
                badge = 'badges/released_40_years.svg';
                res.sendFile(badge, { root : __dirname}, function (err) {
                    if (err) {
                        debug(err);
                        res.status(err.status).end();
                    }
                    else debug('Sent file: ', badge);
                });
            }
            else if (releaseDate < currentDate-1261440000000) {
                // todo insert new badge
                badge = 'badges/released_over_50_years.svg';
                res.sendFile(badge, { root : __dirname}, function (err) {
                    if (err) {
                        debug(err);
                        res.status(err.status).end();
                    }
                    else debug('Sent file: ', badge);
                });
            }
        }

        /************* send small badges ********************/
        else {
            var releaseYear = date[0];
            // send a badge showing the created date
            res.redirect('https://img.shields.io/badge/release%20time-' + releaseYear + '-blue.svg');
        }

    });
}