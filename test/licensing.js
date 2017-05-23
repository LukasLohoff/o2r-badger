'use strict';
const debug = require('debug')('badger');
const config = require('../config/config');

const fs = require('fs');
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const request = require('request');
const md5 = require('js-md5');

//const request = require('supertest');
const assert = require('chai').assert;

chai.use(chaiHttp);

let baseURL = config.net.endpoint + ':' + config.net.port;
let form;
let requestLoadingTimeout = 10000;

let md5_1 = 'c0aaab1e2b28e53746d005cdd239087d';
let md5_13 = 'ae64c5bf25cb2f69939f9635eabde1f3';

let substring_svg = 'license:</tspan><tspansodipodi:role="line"id="tspan13903"x="30.581934"y="34.958702">partially open</tspan>';

describe('License badge:', function () {

    describe('POST /api/1.0/badge/licence/o2r/extended with json including licence information', () => {
        before(function (done) {
            fs.readFile('./test/data/licence/testjson1.json', 'utf8', function (err, fileContents) {
                if (err) throw err;
                form = JSON.parse(fileContents);
                done();
            });
        });
        it('should respond with a big badge: license open', (done) => {
            request({
                uri: baseURL + '/api/1.0/badge/licence/o2r/extended',
                method: 'POST',
                form: form,
                timeout: requestLoadingTimeout
            }, (err, res, body) => {
                if (err) done(err);
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(md5(res.body), md5_1);
                done();
            });
        }).timeout(20000);
    });

    describe('POST /api/1.0/badge/licence/o2r/extended with json including licence information', () => {
        before(function (done) {
            fs.readFile('./test/data/licence/testjson13.json', 'utf8', function (err, fileContents) {
                if (err) throw err;
                form = JSON.parse(fileContents);
                done();
            });
        });
        it('should respond with a big badge: license partially open', (done) => {
            request({
                uri: baseURL + '/api/1.0/badge/licence/o2r/extended',
                method: 'POST',
                form: form,
                timeout: requestLoadingTimeout
            }, (err, res, body) => {
                if (err) done(err);
                assert.ifError(err);
                assert.equal(res.statusCode, 200);
                assert.equal(md5(res.body), md5_13);
                done();
            });
        }).timeout(20000);
    });

    describe.skip('POST /api/1.0/badge/licence/o2r/extended with json including licence information', () => {
        it('should respond with a big badge: license mostly open', (done) => {
        });
    });

    describe.skip('POST /api/1.0/badge/licence/o2r/extended with json including licence information', () => {
        it('should respond with a big badge: license closed', (done) => {
        });
    });

    describe.skip('POST /api/1.0/badge/licence/o2r/extended with json including licence information', () => {
        it('should respond with a big badge: license unknown', (done) => {
        });
    });

    describe.skip('POST /api/1.0/badge/licence/o2r/doi:', () => {
        it('should respond with a small badge: license open', (done) => {
        });
    });

    describe.skip('POST /api/1.0/badge/licence/o2r with json including licence information', () => {
        it('should respond with a small badge: license mostly open', (done) => {
        });
    });

    describe.skip('POST /api/1.0/badge/licence/o2r with json including licence information', () => {
        it('should respond with a small badge: license closed', (done) => {
        });
    });

    describe.skip('POST /api/1.0/badge/licence/o2r with json including licence information', () => {
        it('should respond with a small badge: license unknown', (done) => {
        });
    });
});

//todo test the GET controllers with a compendium with licence information (https://o2r.uni-muenster.de/api/v1/compendium/cUgvE) (> success badge)
// --> cUgvE compendium currently does not have a DOI, which means it can't be found