/* globals describe, beforeEach, afterEach, $fixture, qq, assert, it, qqtest, helpme, purl */
describe("upload-data.js", function () {
    "use strict";

    it("allows overriden uuids", function() {
        var uploadData = helpme.createUploadData();

        uploadData.addFile("0_uuid", "name", -1);
        assert.equal(uploadData.retrieve({id: 0}).uuid, "0_uuid", "checking initial uuid");

        uploadData.uuidChanged(0, "foobar");
        assert.equal(uploadData.retrieve({id: 0}).uuid, "foobar", "checking new uuid");
    });

    it("allows override name", function() {
        var uploadData = helpme.createUploadData(),
            id = uploadData.addFile("0_uuid", "0_name", -1);

        assert.equal(uploadData.retrieve({id: id}).name, "0_name", "checking initial name");

        uploadData.updateName(id, "foobar");
        assert.equal(uploadData.retrieve({id: id}).name, "foobar", "checking new name");
        assert.equal(uploadData.retrieve({id: id}).originalName, "0_name", "checking original name");
    });

    it("resets properly", function() {
        var uploadData = helpme.createUploadData();

        uploadData.addFile(0);
        uploadData.reset();
        assert.equal(uploadData.retrieve().length, 0, "ensuring upload data has been cleared");
    });

    it("retrieves by id and ids", function() {
        var uploadData = helpme.createUploadData(),
            id1 = uploadData.addFile("0_uuid", "0_name", 1980),
            uploadDataItem = uploadData.retrieve({id: id1}),
            uploadDataItems, id2;

        assert.equal(uploadDataItem.id, id1);
        assert.equal(uploadDataItem.uuid, "0_uuid");
        assert.equal(uploadDataItem.name, "0_name");
        assert.equal(uploadDataItem.size, 1980);

        assert.equal(uploadData.retrieve({id: 999}), undefined);

        id2 = uploadData.addFile("1_uuid", "1_name", -1);
        uploadDataItems = uploadData.retrieve({id: [id1, id2]});
        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, id1);
        assert.equal(uploadDataItems[1].id, id2);
        assert.equal(uploadDataItems[0].name, "0_name");
        assert.equal(uploadDataItems[1].name, "1_name");
    });

    it("test retrieve by uuid and uuids", function() {
        var uploadData = helpme.createUploadData(),
            id1 = uploadData.addFile("0_uuid", "0_name", 1980),
            id2, uploadDataItems;

        var uploadDataItem = uploadData.retrieve({uuid: "0_uuid"});
        assert.equal(uploadDataItem.id, id1);
        assert.equal(uploadDataItem.uuid, "0_uuid");
        assert.equal(uploadDataItem.name, "0_name");
        assert.equal(uploadDataItem.size, 1980);

        assert.equal(uploadData.retrieve({uuid: "foobar"}), undefined);

        id2 = uploadData.addFile("1_uuid", "1_name", -1);
        uploadDataItems = uploadData.retrieve({uuid: ["0_uuid", "1_uuid"]});
        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, id1);
        assert.equal(uploadDataItems[1].id, id2);
        assert.equal(uploadDataItems[0].name, "0_name");
        assert.equal(uploadDataItems[1].name, "1_name");
    });

    it("retrieves by status and statuses", function() {
        var uploadData = helpme.createUploadData(),
            id1 = uploadData.addFile("0_uuid", "0_name", 1980),
            uploadDataItems = uploadData.retrieve({status: qq.status.SUBMITTING}),
            id2;

        id2 = uploadData.addFile("1_uuid", "1_name", -1);
        uploadData.setStatus(id2, qq.status.CANCELED);

        assert.equal(uploadDataItems.length, 1);
        assert.equal(uploadDataItems[0].id, id1);
        assert.equal(uploadDataItems[0].uuid, "0_uuid");
        assert.equal(uploadDataItems[0].name, "0_name");
        assert.equal(uploadDataItems[0].size, 1980);

        assert.equal(uploadData.retrieve({status: "foobar"}).length, 0);


        uploadDataItems = uploadData.retrieve({status: [qq.status.SUBMITTING, qq.status.CANCELED]});
        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, id1);
        assert.equal(uploadDataItems[1].id, id2);
        assert.equal(uploadDataItems[0].name, "0_name");
        assert.equal(uploadDataItems[1].name, "1_name");
    });

    it("retrieves without filter", function() {
        var uploadData = helpme.createUploadData(),
            id1 = uploadData.addFile("uuid", "name", -1),
            id2 = uploadData.addFile("uuid2", "name2", -1),
            uploadDataItems = uploadData.retrieve();

        assert.equal(uploadDataItems.length, 2);
        assert.equal(uploadDataItems[0].id, id1);
        assert.equal(uploadDataItems[1].id, id2);
    });

    it("Uses passed status if available on addFile", function() {
        var uploadData = helpme.createUploadData(),
            id = uploadData.addFile("uuid", "name", -1, null, null, qq.status.UPLOAD_SUCCESSFUL),
            uploadDataItems = uploadData.retrieve();

        assert.equal(uploadDataItems[0].status, qq.status.UPLOAD_SUCCESSFUL);

        uploadDataItems = uploadData.retrieve({status: qq.status.UPLOAD_SUCCESSFUL});
        assert.equal(uploadDataItems[0].id, id);
    });

    it("Tracks proxy group files correctly", function() {
        var uploadData = helpme.createUploadData(),
            groupId1 = "a",
            groupId2 = "b",
            actualGroup1 = [],
            expectedGroup1 = [0, 2],
            actualGroup2 = [],
            expectedGroup2 = [1, 3];

        actualGroup1.push(uploadData.addFile("uuid0", "name0", -1, null, groupId1));
        actualGroup2.push(uploadData.addFile("uuid1", "name1", -1, null, groupId2));
        actualGroup1.push(uploadData.addFile("uuid2", "name2", -1, null, groupId1));
        actualGroup2.push(uploadData.addFile("uuid3", "name3", -1, null, groupId2));

        qq.each(expectedGroup1, function(idx, id) {
            assert.deepEqual(uploadData.getIdsInProxyGroup(id), expectedGroup1);
        });

        qq.each(expectedGroup2, function(idx, id) {
            assert.deepEqual(uploadData.getIdsInProxyGroup(id), expectedGroup2);
        });
    });

    it("Tracks batched files correctly", function() {
        var uploadData = helpme.createUploadData(),
            batchId1 = "a",
            batchId2 = "b",
            actualBatch1 = [],
            expectedBatch1 = [0, 2],
            actualBatch2 = [],
            expectedBatch2 = [1, 3];

        actualBatch1.push(uploadData.addFile("uuid0", "name0", -1, batchId1));
        actualBatch2.push(uploadData.addFile("uuid1", "name1", -1, batchId2));
        actualBatch1.push(uploadData.addFile("uuid2", "name2", -1, batchId1));
        actualBatch2.push(uploadData.addFile("uuid3", "name3", -1, batchId2));

        qq.each(expectedBatch1, function(idx, id) {
            assert.deepEqual(uploadData.getIdsInBatch(id), expectedBatch1);
        });

        qq.each(expectedBatch2, function(idx, id) {
            assert.deepEqual(uploadData.getIdsInBatch(id), expectedBatch2);
        });
    });
});

