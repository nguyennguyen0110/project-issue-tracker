const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  this.timeout(5000);
  let issueID = '';

  test('POST: Create an issue with every field', done => {
    let testData = {
      issue_title: 'Test post issue with all fields',
      issue_text: 'Test post issue with all fields',
      created_by: 'N',
      assigned_to: 'N',
      status_text: 'In progress'
    };
    chai.request(server)
      .post('/api/issues/mytestproject')
      .send(testData)
      .end(function (err, res) {
        assert.include(res.body, testData);
        assert.property(res.body, 'created_on');
        assert.isNumber(Date.parse(res.body.created_on));
        assert.property(res.body, 'updated_on');
        assert.isNumber(Date.parse(res.body.updated_on));
        assert.property(res.body, 'open');
        assert.isTrue(res.body.open);
        assert.property(res.body, '_id');
        done();
      });
  });

  test('POST: Create an issue with only required fields', done => {
    let testData = {
      issue_title: 'Test post issue with only required fields',
      issue_text: 'Test post issue with only required fields',
      created_by: 'N'
    };
    chai.request(server)
      .post('/api/issues/mytestproject')
      .send(testData)
      .end(function (err, res) {
        issueID = res.body._id;
        assert.include(res.body, testData);
        assert.property(res.body, 'created_on');
        assert.isNumber(Date.parse(res.body.created_on));
        assert.property(res.body, 'updated_on');
        assert.isNumber(Date.parse(res.body.updated_on));
        assert.property(res.body, 'open');
        assert.isTrue(res.body.open);
        assert.property(res.body, '_id');
        assert.property(res.body, 'assigned_to');
        assert.property(res.body, 'status_text');
        assert.isEmpty(res.body.status_text);
        done();
      });
  });

  test('POST: Create an issue with missing required fields', done => {
    let testData = {
      created_by: 'N'
    };
    chai.request(server)
      .post('/api/issues/mytestproject')
      .send(testData)
      .end(function (err, res) {
        assert.property(res.body, 'error');
        assert.equal(res.body.error, 'required field(s) missing');
        done();
      });
  });

  test('GET: View issues on a project', done => {
    chai.request(server)
      .get('/api/issues/mytestproject?')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.property(issue, 'issue_title');
          assert.property(issue, 'issue_text');
          assert.property(issue, 'created_by');
          assert.property(issue, 'assigned_to');
          assert.property(issue, 'status_text');
          assert.property(issue, 'open');
          assert.property(issue, 'created_on');
          assert.property(issue, 'updated_on');
          assert.property(issue, '_id');
        });
        done();
      });
  });

  test('GET: View issues on a project with one filter', done => {
    chai.request(server)
      .get('/api/issues/mytestproject?created_by=N')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.equal(issue.created_by, 'N');
        });
        done();
      });
  });

  test('GET: View issues on a project with multiple filters', done => {
    chai.request(server)
      .get('/api/issues/mytestproject?created_by=N&assigned_to=N')
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.equal(issue.created_by, 'N');
          assert.equal(issue.assigned_to, 'N');
        });
        done();
      });
  });

  test('PUT: Update one field on an issue', done => {
    chai.request(server)
      .put('/api/issues/mytestproject')
      .send({
        _id: issueID,
        issue_text: 'Updated issue_text in Update one field on an issue Test'
      })
      .end(function (err, res) {
        assert.deepEqual(res.body, {result: 'successfully updated', _id: issueID});
        done();
      });
  });

  test('PUT: Update multiple fields on an issue', done => {
    chai.request(server)
      .put('/api/issues/mytestproject')
      .send({
        _id: issueID,
        issue_text: 'Updated issue_text in Update multiple field on an issue Test',
        assigned_to: 'N'
      })
      .end(function (err, res) {
        assert.deepEqual(res.body, {result: 'successfully updated', _id: issueID});
        done();
      });
  });

  test('PUT: Update an issue with missing _id', done => {
    chai.request(server)
      .put('/api/issues/mytestproject')
      .send({assigned_to: 'N'})
      .end(function (err, res) {
        assert.deepEqual(res.body, {error: 'missing _id'});
        done();
      });
  });

  test('PUT: Update an issue with no fields to update', done => {
    chai.request(server)
      .put('/api/issues/mytestproject')
      .send({_id: issueID})
      .end(function (err, res) {
        assert.deepEqual(res.body, {error: 'no update field(s) sent', _id: issueID});
        done();
      });
  });

  test('PUT: Update an issue with an invalid _id', done => {
    chai.request(server)
      .put('/api/issues/mytestproject')
      .send({_id: 'updatedID', assigned_to: 'N'})
      .end(function (err, res) {
        assert.deepEqual(res.body, {error: 'could not update', _id: 'updatedID'});
        done();
      });
  });

  test('DELETE: Delete an issue', done => {
    chai.request(server)
      .delete('/api/issues/mytestproject')
      .send({_id: issueID})
      .end(function (err, res) {
        assert.deepEqual(res.body, {result: 'successfully deleted', _id: issueID});
        done();
      });
  });

  test('DELETE: Delete an issue with an invalid _id', done => {
    chai.request(server)
      .delete('/api/issues/mytestproject')
      .send({_id: 'updatedID'})
      .end(function (err, res) {
        assert.deepEqual(res.body, {error: 'could not delete', _id: 'updatedID'});
        done();
      });
  });

  test('DELETE: Delete an issue with missing _id', done => {
    chai.request(server)
      .delete('/api/issues/mytestproject')
      .send({})
      .end(function (err, res) {
        assert.deepEqual(res.body, {error: 'missing _id'});
        done();
      });
  });

});
