/*
 * Copyright IBM Corporation 2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Tests the microservice generator
 */
'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var config = require('../../generators/lib/config');
var common = require('../lib/commontest');

const ARTIFACTID = 'artifact.0.1';
const GROUPID = 'test.group';
const VERSION = '1.0.0';
const APPNAME = 'testApp';

function Options(buildType) {
  this.headless = "true";
  this.debug = "true";
  this.buildType = buildType;
  this.createType = 'microservice';
  this.version = VERSION;
  this.appName = APPNAME;
  this.groupId = GROUPID;
  this.assert = function(appName, ymlName, cloudant, objectStorage) {
    common.assertCommonFiles();
    common.assertCLI(appName);
    common.assertBluemixSrc(cloudant || objectStorage);
    common.assertCloudant(ymlName, cloudant);
    common.assertObjectStorage(ymlName, objectStorage);
    common.assertK8s(appName);
    common.assertFiles('', true, 'README.md');
    common.assertFiles('src', true, 'main/java/application/rest/HealthEndpoint.java',
                                    'test/java/it/HealthEndpointTest.java',
                                    'main/webapp/WEB-INF/ibm-web-ext.xml')
  }
}

beforeEach(function() {
  //make sure we start with a valid config object
  config.reset();
});

describe('java generator : microservice integration test', function () {

  describe('Generates a basic microservices project (no bluemix)', function () {

    it('should create a basic microservice, gradle build system', function (done) {
      var options = new Options('gradle');
      helpers.run(path.join( __dirname, '../../generators/app'))
        .withOptions(options)
        .withPrompts({})
      .toPromise().then(function() {
        options.assert(APPNAME, APPNAME, false, false)
        common.assertGradleFiles(APPNAME);

        assert.fileContent('src/main/java/application/rest/v1/Example.java','list.add("Some data");'); //check no bx services present
        assert.fileContent('README.md', 'gradle');
        assert.noFileContent('README.md', 'maven');
        done();
      }, function(err) {
        assert.fail(false, "Test failure ", err);
      });                        // Get a Promise back when the generator finishes
    });

    it('should create a basic microservice, maven build system', function (done) {
      var options = new Options('maven');
      helpers.run(path.join( __dirname, '../../generators/app'))
        .withOptions(options)
        .withPrompts({})
      .toPromise().then(function() {
        options.assert(APPNAME, APPNAME, false, false)
        common.assertMavenFiles(APPNAME);

        assert.fileContent('src/main/java/application/rest/v1/Example.java','list.add("Some data");'); //check no bx services present
        assert.fileContent('README.md', 'maven');
        assert.noFileContent('README.md', 'gradle');
        done();
      }, function(err) {
        assert.fail(false, "Test failure ", err);
      });                        // Get a Promise back when the generator finishes
    });

  });

  describe('Generates a basic microservices project (bluemix)', function () {

    it('no services', function (done) {
      var options = new Options('gradle');
      options.bluemix = '{"name" : "bxName"}';
      helpers.run(path.join( __dirname, '../../generators/app'))
        .withOptions(options)
        .withPrompts({})
      .toPromise().then(function() {
        options.assert('bxName', 'bxName', false, false)
        common.assertGradleFiles('bxName');

        assert.fileContent('src/main/webapp/WEB-INF/ibm-web-ext.xml','uri="/bxName"');
        assert.noFileContent('src/main/java/application/rest/v1/Example.java', 'Cloudant');

        assert.fileContent('manifest.yml', 'name: bxName', 'random-route: true') //Not using prompt so we get app name and random route
        assert.noFileContent('README.md', 'cloudant');
        done();
      }, function(err) {
        assert.fail(false, "Test failure ", err);
      });                        // Get a Promise back when the generator finishes
    });

    it('with cloudant', function (done) {
      var options = new Options('maven');
      options.bluemix = '{"name" : "bxName", "server" : {"services" : ["cloudant"]}, "cloudant" : {"password" : "pass", "url" : "https://account.cloudant.com", "username" : "user"}}';
      helpers.run(path.join( __dirname, '../../generators/app'))
        .withOptions(options)
        .withPrompts({})
      .toPromise().then(function() {
        options.assert('bxName', 'bxName', true, false)
        common.assertMavenFiles('bxName');

        assert.fileContent('src/main/webapp/WEB-INF/ibm-web-ext.xml','uri="/bxName"');
        assert.fileContent('src/main/java/application/rest/v1/Example.java','Cloudant'); //check Cloudant service present

        assert.fileContent('README.md', 'cloudant');
        done();
      }, function(err) {
        assert.fail(false, "Test failure ", err);
      });                        // Get a Promise back when the generator finishes
    });

    it('with object storage', function (done) {
      var options = new Options('maven');
      options.bluemix = '{"name" : "bxName", "server" : {"services" : ["objectStorage"]}, "objectStorage" : {"project": "objectStorage-project", "userId": "objectStorage-userId", "password": "objectStorage-password","auth_url": "objectStorage-url","domainName": "objectStorage-domainName"}}';
      helpers.run(path.join( __dirname, '../../generators/app'))
        .withOptions(options)
        .withPrompts({})
      .toPromise().then(function() {
        options.assert('bxName', 'bxName', false, true)
        common.assertMavenFiles('bxName');

        assert.fileContent('src/main/webapp/WEB-INF/ibm-web-ext.xml','uri="/bxName"');
        assert.fileContent('src/main/java/application/rest/v1/Example.java','OSClient'); //check Cloudant service present

        assert.fileContent('README.md', 'Object Storage service');
        done();
      }, function(err) {
        assert.fail(false, "Test failure ", err);
      });                        // Get a Promise back when the generator finishes
    });

  });
});
