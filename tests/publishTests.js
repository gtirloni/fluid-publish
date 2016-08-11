/*
Copyright 2015 OCAD University

Licensed under the New BSD license. You may not use this file except in
compliance with this License.

You may obtain a copy of the License at
https://github.com/fluid-project/first-discovery-server/raw/master/LICENSE.txt
*/

"use strict";

var path = require("path");
var publish = require("../publish.js");
var assert = require("assert");
var sinon = require("sinon");

var createStubs = function (obj, methods) {
    var stubs = {};
    methods.forEach(function (method) {
        stubs[method] = sinon.stub(obj, method);
    });
    return stubs;
};

var resetStubs = function (obj, methods) {
    methods.forEach(function (method) {
        obj[method].reset();
    });
};

var removeStubs = function (obj, methods) {
    methods.forEach(function (method) {
        obj[method].restore();
    });
};

/******************
 * publish.getPkg *
 ******************/
console.log("\n*** publish.getPkg ***");

var getPkgFixture = [{
    moduleRoot: __dirname,
    expected: {
        name: "fluid-publish-test",
        version: "0.0.0"
    }
}];

getPkgFixture.forEach(function (fixture) {
    console.log("getPkg test - moduleRoot: " + fixture.moduleRoot);

    var result = publish.getPkg(fixture.moduleRoot);

    assert.deepEqual(result, fixture.expected, "Expected pkg: " + JSON.stringify(fixture.expected) + " actual: " + JSON.stringify(result));
});

/********************
 * publish.padZeros *
 ********************/
console.log("\n*** publish.padZeros ***");

var padZerosFixture = {
    nums: [0, 1, 10, "1"],
    widths: [1, 2],
    expected: [
        ["0", "00"], // num === 0
        ["1", "01"], // num === 1
        ["10", "10"], // num === 10
        ["1", "01"] // num === "1"
    ]
};

padZerosFixture.nums.forEach(function (num, numIdx) {
    padZerosFixture.widths.forEach(function (width, widthIdx) {
        console.log("padZeros test - num: " + num + " width: " + width);

        var result = publish.padZeros(num, width);
        var expected = padZerosFixture.expected[numIdx][widthIdx];

        assert.strictEqual(result, expected, "Expected string representation with required left padding: " + expected + " actual: " + result);
    });
});

/*************************
 * publish.fromTimestamp *
 *************************/
console.log("\n*** publish.fromTimestamp ***");

var fromTimestampFixture = [{
    timestamp: 1444914743,
    expected: {
        year: 2015,
        month: 10,
        day: 15,
        hours: 13,
        minutes: 12,
        seconds: 23
    }
}];

fromTimestampFixture.forEach(function (fixture) {
    console.log("fromTimestamp test - timestamp: " + fixture.timestamp);

    var result = publish.fromTimestamp(fixture.timestamp);
    assert.deepEqual(result, fixture.expected, "Expected adjusted date object: " + JSON.stringify(fixture.expected) + " actual: " + JSON.stringify(result));
});

/****************************
 * publish.convertToISO8601 *
 ****************************/
console.log("\n*** publish.convertToISO8601 ***");

var convertToISO6801Fixture = [{
    timestamp: 1444914743,
    expected: "20151015T131223Z"
}];

convertToISO6801Fixture.forEach(function (fixture) {
    console.log("convertToISO8601 test - timestamp: " + fixture.timestamp);

    var result = publish.convertToISO8601(fixture.timestamp);
    assert.equal(result, fixture.expected, "Expected ISO8601 timestamp: " + fixture.expected + " actual: " + result);
});

/********************************
 * publish.execSyncFromTemplate *
 ********************************/
console.log("\n*** publish.execSyncFromTemplate ***");

var execSyncFromTemplateFixture = [{
    template: "${value1}",
    values: {
        value1: "value one"
    },
    hint: "hint for single token template",
    expectedHint: "Hint: hint for single token template",
    expected: "value one",
    expectedLog: "Executing Command: value one\n"
}, {
    template: "${value1} and ${value2}",
    values: {
        value1: "value one",
        value2: "value two"
    },
    hint: "hint for multi-token template",
    expectedHint: "Hint: hint for multi-token template",
    expected: "value one and value two",
    expectedLog: "Executing Command: value one and value two\n"
}, {
    template: "${value1} to ${value2} and back to ${value1}",
    values: {
        value1: "value one",
        value2: "value two"
    },
    hint: "hint for reused token template",
    expectedHint: "Hint: hint for reused token template",
    expected: "value one to value two and back to value one",
    expectedLog: "Executing Command: value one to value two and back to value one\n"
}, {
    template: "no value",
    values: {
        value1: "value one",
        value2: "value two"
    },
    hint: "hint for no value test",
    expectedHint: "Hint: hint for no value test",
    expected: "no value",
    expectedLog: "Executing Command: no value\n"
}, {
    template: "$ {noToken}",
    values: {
        noToken: "no token"
    },
    hint: "hint for no token test",
    expectedHint: "Hint: hint for no token test",
    expected: "$ {noToken}",
    expectedLog: "Executing Command: $ {noToken}\n"
}];

execSyncFromTemplateFixture.forEach(function (fixture) {
    var toStub = ["execSync", "log"];
    var stub = createStubs(publish, toStub);


    console.log("execSyncFromTemplate test - template: " + fixture.template + " values: " + JSON.stringify(fixture.values) + " isTest: " + false);

    publish.execSyncFromTemplate(fixture.template, fixture.values, fixture.hint);
    assert(stub.execSync.called, "execSync should have been called");
    assert(stub.execSync.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);
    assert(stub.log.calledOnce, "log should have been called only once");
    assert.equal(stub.log.args[0][0], fixture.expectedLog, "log should have been called with: " + fixture.expectedLog);
    resetStubs(publish, toStub);

    console.log("execSyncFromTemplate test with exception - template: " + fixture.template + " values: " + JSON.stringify(fixture.values) + " isTest: " + false);

    stub.execSync.throws("Error message");
    assert.throws(function () {publish.execSyncFromTemplate(fixture.template, fixture.values, fixture.hint);}, Error);
    assert(stub.execSync.called, "execSync should have been called");
    assert(stub.execSync.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);
    assert(stub.log.calledTwice, "log should have been called twice");
    assert.equal(stub.log.args[0][0], fixture.expectedLog, "log should have been called with: " + fixture.expectedLog);
    assert.equal(stub.log.args[1][0], fixture.expectedHint, "log should have been called with: " + fixture.expectedHint);
    resetStubs(publish, toStub);

    console.log("execSyncFromTemplate test - template: " + fixture.template + " values: " + JSON.stringify(fixture.values) + " isTest: " + true);

    publish.execSyncFromTemplate(fixture.template, fixture.values, fixture.hint, true);
    assert(stub.log.calledOnce, "log should have been called twice");
    assert.equal(stub.log.args[0][0], fixture.expectedLog, "log should have been called with: " + fixture.expectedLog);
    assert.equal(stub.execSync.callCount, 0, "execSync should not have been called");

    // removes stubs
    removeStubs(publish, toStub);
});

/************************
 * publish.checkChanges *
 ************************/
console.log("\n*** publish.checkChanges ***");

var checkChangesFixture = [{
    cmdStr: "test command string",
    cmdReturn: ""
}, {
    cmdStr: "test command string",
    cmdReturn: "some changes",
    errorMsg: "You have uncommitted changes\nsome changes",
    hint: "hint"
}];

checkChangesFixture.forEach(function (fixture) {
    console.log("checkChanges test - changes: " + fixture.cmdReturn);

    var toStub = ["execSync", "log"];
    var stub = createStubs(publish, toStub);
    stub.execSync.returns(fixture.cmdReturn);

    try {
        publish.checkChanges({changesCmd: fixture.cmdStr, changesHint: fixture.hint});
        assert(stub.execSync.called, "execSync should have been called");
        assert(stub.execSync.calledWith(fixture.cmdStr), "execSync should have been called with: " + fixture.cmdStr);

    } catch (e) {
        var expectedHint = "Hint: " + fixture.hint;
        assert(stub.log.calledWith(expectedHint), "log should have been called with: " + expectedHint);
        assert.equal(e.message, fixture.errorMsg, "The errorMsg should have been called correctly. expected: " + fixture.errorMsg + " actual: " + e.message);
    }

    removeStubs(publish, toStub);
});


/**********************
 * publish.setVersion *
 **********************/
console.log("\n*** publish.setVersion ***");

var setVersionFixture = [{
    version: "1.0.0",
    versionCmd: "set version: ${version}",
    expected: "set version: 1.0.0"
}];

setVersionFixture.forEach(function (fixture) {
    console.log("setVersion test - version: " + fixture.version + " versionCmd: " + fixture.versionCmd);

    var exec = sinon.stub(publish, "execSync");

    publish.setVersion(fixture.version, fixture);
    assert(exec.called, "execSync should have been called");
    assert(exec.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);

    // remove execSync stub
    publish.execSync.restore();
});

/*************************
 * publish.getDevVersion *
 *************************/
console.log("\n*** publish.getDevVersion ***");

var getDevVersionFixture = [{
    rawTimestampCmd: "get raw timestamp",
    revisionCmd: "get revision",
    devVersion: "${version}-${preRelease}.${timestamp}.${revision}",
    devTag: "test",
    moduleVersion: "1.2.3",
    expectedVersion: "1.2.3-test.20151015T131223Z.039d221",
    returnedTimestamp: 1444914743,
    returnedRevision: "039d221"
}];

getDevVersionFixture.forEach(function (fixture) {
    console.log("getDevVersion test - rawTimestampCmd: " + fixture.rawTimestampCmd + " revisionCmd: " + fixture.revisionCmd + " devVersion: " + fixture.devVersion);

    var exec = sinon.stub(publish, "execSync");
    exec.onFirstCall().returns(fixture.returnedTimestamp);
    exec.onSecondCall().returns(fixture.returnedRevision);

    var result = publish.getDevVersion(fixture.moduleVersion, fixture);

    assert(exec.calledTwice, "execSync should have been called twice");
    assert(exec.calledWith(fixture.rawTimestampCmd), "first execSync should have been called with: " + fixture.rawTimestampCmd);
    assert(exec.calledWith(fixture.revisionCmd), "second execSync should have been called with: " + fixture.revisionCmd);
    assert.equal(result, fixture.expectedVersion, "Expected version: " + fixture.expectedVersion + " actual: " + result);

    // remove execSync stub
    publish.execSync.restore();
});

/*******************
 * publish.pubImpl *
 *******************/
console.log("\n*** publish.pubImpl ***");

var pubImplFixture = [{
    isTest: true,
    packCmd: "pack",
    publishCmd: "shouldn't publish"
}, {
    isTest: false,
    packCmd: "shouldn't pack",
    publishCmd: "publish"
}, {
    packCmd: "shouldn't pack",
    publishCmd: "publish"
}];

pubImplFixture.forEach(function (fixture) {
    console.log("pubImpl test - isTest: " + fixture.isTest + " packCmd: " + fixture.packCmd + " publishCmd: " + fixture.publishCmd);

    var exec = sinon.stub(publish, "execSync");
    var expected = fixture[fixture.isTest ? "packCmd" : "publishCmd"];

    publish.pubImpl(fixture.isTest, fixture);
    assert(exec.calledOnce, "execSync should have been called");
    assert(exec.calledWith(expected), "execSync should have been called with: " + expected);

    // remove execSync stub
    publish.execSync.restore();
});

/***************
 * publish.tag *
 ***************/
console.log("\n*** publish.tag ***");

var tagFixture = [{
    isTest: true,
    packageName: "test1",
    version: "1.0.0",
    tag: "tag",
    distTagCmd: "add tag ${tag} to ${packageName} at ${version}",
    expected: "add tag tag to test1 at 1.0.0"
}, {
    isTest: false,
    packageName: "test2",
    version: "2.0.0",
    tag: "tag2",
    distTagCmd: "add tag ${tag} to ${packageName} at ${version}",
    expected: "add tag tag2 to test2 at 2.0.0"
}, {
    version: "3.0.0",
    packageName: "test3",
    tag: "tag3",
    distTagCmd: "add tag ${tag} to ${packageName} at ${version}",
    expected: "add tag tag3 to test3 at 3.0.0"
}];

tagFixture.forEach(function (fixture) {
    console.log("tag test - isTest: " + fixture.isTest + " packageName: " + fixture.packageName + " version: " + fixture.version + " tag: " + fixture.tag + " distTagCmd: " + fixture.distTagCmd);

    var toStub = ["execSync", "log"];
    var stub = createStubs(publish, toStub);
    var expectedLog = "Executing Command: " + fixture.expected + "\n";

    publish.tag(fixture.isTest, fixture.packageName, fixture.version, fixture.tag, fixture);

    assert(stub.log.calledOnce, "console.log should have been called");
    assert(stub.log.calledWith(expectedLog), "console.log should have been called with: " + expectedLog);

    if (fixture.isTest) {
        assert(!stub.execSync.called, "execSync should not have been called");
    } else {
        assert(stub.execSync.calledOnce, "execSync should have been called");
        assert(stub.execSync.calledWith(fixture.expected), "execSync should have been called with: " + fixture.expected);
    }

    // remove stubs
    removeStubs(publish, toStub);
});

/*****************
 * publish.clean *
 *****************/
console.log("\n*** publish.clean ***");

var cleanFixture = [{
    moduleRoot: "./",
    cleanCmd: "clean"
}];

cleanFixture.forEach(function (fixture) {
    console.log("clean test - cleanCmd: " + fixture.cleanCmd);

    var exec = sinon.stub(publish, "execSync");

    publish.clean(fixture.moduleRoot, fixture);

    assert(exec.calledOnce, "execSync should have been called");
    assert(exec.calledWith(fixture.cleanCmd), "execSync should have been called with: " + fixture.expected);

    // remove execSync stub
    publish.execSync.restore();
});

/*****************
 * publish tests *
 *****************/

var publishFixture = [{
    isTest: true,
    options: {
        "changesCmd": "dry run get changes",
        "checkRemoteCmd": "dry run check remote",
        "rawTimestampCmd": "dry run get rawTimestamp",
        "revisionCmd": "dry run get revision",
        "packCmd": "dry run pack",
        "publishCmd": "dry run publish",
        "versionCmd": "dry run version",
        "distTagCmd": "dry run set tag",
        "cleanCmd": "dry run clean",
        "vcTagCmd": "dry run vc tag",
        "pushVCTagCmd": "dry run push vc tag",
        "devVersion": "dry run ${version}-${preRelease}.${timestamp}.${revision}",
        "devTag": "dry run dev",
        "remoteName": "dry run remote",
        "moduleRoot": __dirname,
        "changesHint": "dry run changes hint\n",
        "checkRemoteHint": "dry run check remote hint\n",
        "publishHint": "dry run publish hint\n",
        "distTagHint": "dry run dist tag hint\n",
        "vcTagHint": "dry run vc tag hint\n",
        "pushVCTagHint": "dry run push vc tag hint\n"
    }
}, {
    isTest: false,
    options: {
        "changesCmd": "get changes",
        "checkRemoteCmd": "check remote",
        "rawTimestampCmd": "get rawTimestamp",
        "revisionCmd": "get revision",
        "packCmd": "pack",
        "publishCmd": "publish",
        "versionCmd": "version",
        "distTagCmd": "set tag",
        "cleanCmd": "clean",
        "vcTagCmd": "vc tag",
        "pushVCTagCmd": "push vc tag",
        "devVersion": "${version}-${preRelease}.${timestamp}.${revision}",
        "devTag": "dev",
        "remoteName": "remote",
        "moduleRoot": __dirname,
        "changesHint": "changes hint\n",
        "checkRemoteHint": "check remote hint\n",
        "publishHint": "publish hint\n",
        "distTagHint": "dist tag hint\n",
        "vcTagHint": "vc tag hint\n",
        "pushVCTagHint": "push vc tag hint\n"
    }
}];

/***************
 * publish.dev *
 ***************/
console.log("\n*** publish.dev ***");

publishFixture.forEach(function (fixture) {
    var modulePackagePath = path.join(fixture.options.moduleRoot, "package.json");
    var modulePackage = require(modulePackagePath);
    var optsString = JSON.stringify(fixture.options || {});
    console.log("dev test - isTest: " + fixture.isTest, " options: " + optsString + "\n");

    var toStub = ["checkChanges", "getDevVersion", "setVersion", "pubImpl", "tag", "clean"];
    var stub = createStubs(publish, toStub);
    var moduleVersion = modulePackage.version;
    var devVersion = moduleVersion + "-testVersion";

    stub.getDevVersion.returns(devVersion);

    publish.dev(fixture.isTest, fixture.options);

    assert(stub.checkChanges.calledOnce, "checkChanges should have been called");
    assert(stub.getDevVersion.calledOnce, "getDevVersion should have been called");
    assert(stub.getDevVersion.calledWith(moduleVersion, fixture.options), "getDevVersion should have been called with:" + moduleVersion + ", " + optsString);
    assert(stub.setVersion.calledOnce, "setVersion should have been called");
    assert(stub.setVersion.calledWith(devVersion, fixture.options), "setVersion should have been called with: " + devVersion + ", " + optsString);
    assert(stub.pubImpl.calledOnce, "pubImpl should have been called");
    assert(stub.pubImpl.calledWith(fixture.isTest, fixture.options), modulePackage);
    assert(stub.tag.calledOnce, "tag should have been called");
    assert(stub.tag.calledWith(fixture.isTest, modulePackage.name, devVersion, fixture.options.devTag, fixture.options), "tag should have been called with: " + fixture.isTest + ", " + modulePackage.name + ", " + devVersion + ", " + fixture.options.devTag + ", " + optsString);
    assert(stub.clean.calledOnce, "clean should have been called");
    assert(stub.clean.calledWith(fixture.options.moduleRoot, fixture.options), "clean should have been called with: " + fixture.options.moduleRoot + ", " + optsString);

    removeStubs(publish, toStub);
});

/********************
 * publish.standard *
 ********************/
console.log("\n*** publish.standard ***");

publishFixture.forEach(function (fixture) {
    var modulePackagePath = path.join(fixture.options.moduleRoot, "package.json");
    var modulePackage = require(modulePackagePath);
    var optsString = JSON.stringify(fixture.options || {});
    console.log("release test - isTest: " + fixture.isTest, " options: " + optsString + "\n");

    var toStub = ["checkChanges", "checkRemote", "tagVC", "pubImpl"];
    var stub = createStubs(publish, toStub);

    publish.standard(fixture.isTest, fixture.options);

    assert(stub.checkChanges.calledOnce, "checkChanges should have been called");
    assert(stub.checkRemote.calledOnce, "checkRemote should have been called");
    assert(stub.checkRemote.calledWith(fixture.options), "checkRemote should have been called with: " + optsString);
    assert(stub.tagVC.calledOnce, "tagVC should have been called");
    assert(stub.tagVC.calledWith(fixture.isTest, modulePackage.version, fixture.options), "tagVC should have been called with: " + fixture.isTest + " ," + modulePackage.version + " ," + optsString);
    assert(stub.pubImpl.calledOnce, "pubImpl should have been called");
    assert(stub.pubImpl.calledWith(fixture.isTest, fixture.options), "pubImpl should have been called with: " + fixture.isTest + ", " + optsString);

    removeStubs(publish, toStub);
});
