'use strict';
//Require and configure dotenv to use environment variables
require('dotenv').config();
//Import Mongoose and connect to MongoDB with URI store in secret
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

//Create Schema and Model
const projectSchema = new mongoose.Schema({
  projectname: String,
  issues: [
    {
      issue_title: String,
      issue_text: String,
      created_on: Date,
      updated_on: Date,
      created_by: String,
      assigned_to: String,
      open: Boolean,
      status_text: String
    }
  ]
});
const Project = mongoose.model('Project', projectSchema);

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      Project.findOne({projectname: req.params.project}, (err, project) => {
        if (err) return console.log(err);
        if (project == null) {
          res.json({error: `Project ${req.params.project} does not exist`})
        }
        else {
          let issues = project.issues;
          //If provide a _id, then only get issues with that _id
          if (req.query._id) {
            issues = issues.filter(issue => issue._id == req.query._id);
          }
          //If provide a title, get issues with that title only
          if (req.query.issue_title) {
            issues = issues.filter(issue => issue.issue_title == req.query.issue_title);
          }
          //If provide person who created the issue
          if (req.query.created_by) {
            issues = issues.filter(issue => issue.created_by == req.query.created_by);
          }
          //If provide the person in charge
          if (req.query.assigned_to) {
            issues = issues.filter(issue => issue.assigned_to == req.query.assigned_to);
          }
          //If provide issue open status (true or false)
          if (req.query.open) {
            issues = issues.filter(issue => issue.open == req.query.open);
          }
          res.json(issues);
        }
      });
    })
    
    .post(function (req, res){
      if (!req.body.issue_title || !req.body.issue_text || !req.body.created_by) {
        res.json({error: 'required field(s) missing'});
      }
      else {
        let newIssue = {
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_on: new Date(),
          updated_on: new Date(),
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to || '',
          open: true,
          status_text: req.body.status_text || ''
        };
        Project.findOneAndUpdate(
          {projectname: req.params.project},
          {$push: {issues: newIssue}},
          {upsert: true, new: true},
          (err, project) => {
            if (err) return console.log(err);
            res.json(project.issues[project.issues.length - 1]);
          }
        );
      }
    })
    
    .put(function (req, res){
      if (!req.body._id) {
        res.json({error: 'missing _id'});
      }
      else if (!req.body.issue_title && !req.body.issue_text && !req.body.created_by && !req.body.assigned_to && !req.body.status_text && !req.body.open) {
        res.json({error: 'no update field(s) sent', '_id': req.body._id});
      }
      else {
        Project.findOne({projectname: req.params.project}, (err, project) => {
          if (err) return console.log(err);
          //Get the issue that needs update
          let target = project.issues.filter(issue => issue._id == req.body._id)[0];
          //Filter out the update issue from issues array
          project.issues = project.issues.filter(issue => issue._id != req.body._id);
          //If no issue has the _id like req.body._id
          if (target == undefined) {
            res.json({error: 'could not update', '_id': req.body._id});
          }
          else {
            target.updated_on = new Date();
            if (req.body.issue_title) {
              target.issue_title = req.body.issue_title;
            }
            if (req.body.issue_text) {
              target.issue_text = req.body.issue_text;
            }
            if (req.body.created_by) {
              target.created_by = req.body.created_by;
            }
            if (req.body.assigned_to) {
              target.assigned_to = req.body.assigned_to;
            }
            if (req.body.status_text) {
              target.status_text = req.body.status_text;
            }
            if (req.body.open) {
              target.open = req.body.open;
            }
            //Get back the issue after updated
            project.issues.push(target);
            project.save((err, newProject) => {
              if (err) return console.log(err);
              res.json({result: 'successfully updated', '_id': req.body._id});    
            });
          }
        });
      }
    })
    
    .delete(function (req, res){
      if (!req.body._id) {
        res.json({error: 'missing _id'});
      }
      else {
        Project.findOne({projectname: req.params.project}, (err, project) => {
          if (err) return console.log(err);
          //Get the issue that needs delete
          let target = project.issues.filter(issue => issue._id == req.body._id)[0];
          //Filter out the delete issue from issues array
          project.issues = project.issues.filter(issue => issue._id != req.body._id);
          //If the issue _id not exist
          if (target == undefined) {
            res.json({error: 'could not delete', '_id': req.body._id});
          }
          //else save the updated project
          else {
            project.save((err, newProject) => {
              if (err) return console.log(err);
              res.json({result: 'successfully deleted', '_id': req.body._id});
            });
          }
        });
      }
    });
    
};
