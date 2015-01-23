/**
 * Module dependencies.
 */
var express    = require('express');
var cron_parser = require('cron-parser');
var moment = require('moment');
var app = module.exports = express.createServer();
var Job = require('../../models/job');
var CronTab = require('../../lib/cronTab');

// middleware

app.configure(function(){
  app.use(app.router);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.post('/check-expression', function(req, res, next) {
  if (!req.body.expression) return next(new Error('You must provide an expression as POST parameters'), 403);
  
  var results = [];

  var interval = cron_parser.parseExpression(req.body.expression);

  for(var l = 0; l < 5; l++){
    var next = interval.next();
    results.push({iso: next, unix: moment(next).unix()});
  }

  res.json(results);

});

app.get('/jobs', function(req, res, next) {
  Job.find(function(err, jobs) {
    if (err) return next(err);
    res.json(jobs);
  });
});

app.post('/jobs', function(req, res, next) {
  if (!req.body.expression || !req.body.url || !req.body.name) return next(new Error('You must provide an expression, url, and name as POST parameters'), 403);
  var job = new Job();
  job.expression = req.body.expression;
  job.url = req.body.url;
  job.name = (req.body.name) ? req.body.name : null;
  job.details = (req.body.details) ? req.body.details : null;
  job.service_name = (req.body.service_name) ? req.body.service_name : null;
  job.customer_id = (req.body.customer_id) ? req.body.customer_id : null;

  job.save(function(err) {
    if (err) return next(err);
    if (CronTab.add(job)) {
      res.redirect('jobs/' + job._id);
    } else {
      return next(new Error('Error adding Job'));
    }
  });
});

app.get('/jobs/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    var interval = cron_parser.parseExpression(job.expression);
    // add the next run to the output...
    
    var upcoming_runs = [];

    for(var l = 0; l < 5; l++){
      var next = interval.next();
      upcoming_runs.push({iso: next, unix: moment(next).unix()});
    }

    job.setValue('upcoming_runs', upcoming_runs);

    res.json(job);
  });
});

app.put('/jobs/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    if (!job) return next(new Error('Trying to update non-existing job'), 403);
    
    if(req.body.expression)
      job.expression = req.body.expression;
    if(req.body.url)
      job.url = req.body.url;
    if(req.body.name)
      job.name = req.body.name;
    if(req.body.details)
      job.details =  req.body.details;
    if(req.body.service_name)
      job.service_name = req.body.service_name;
    if(req.body.customer_id)
      job.customer_id = req.body.customer_id;

    job.save(function(err2) {
      if (err2) return next(err2);
      if (CronTab.update(job)) {
        
         var interval = cron_parser.parseExpression(job.expression);
        // add the next run to the output...
          var upcoming_runs = [];

          for(var l = 0; l < 5; l++){
            upcoming_runs.push(interval.next());
          }

          job.setValue('upcoming_runs', upcoming_runs);


        res.json(job);

        
      } else {
        return next(new Error('Error updating Job'));
      }
    });
  });
});

app.delete('/jobs/:id', function(req, res, next) {
  Job.findOne({ _id: req.params.id }, function(err, job) {
    if (err) return next(err);
    if (!job) return next(new Error('Trying to remove non-existing job'), 403);
    job.remove(function(err2) {
      if (err2) return next(err2);
      if (CronTab.remove(job)) {
        res.redirect('jobs');
      } else {
        return next(new Error('Error removing job'));
      }
    });
  });
});

// route list
app.get('/', function(req, res) {
  var routes = [];
  app.routes.all().forEach(function(route) {
    routes.push({ method: route.method.toUpperCase() , path: app.route + route.path });
  });
  res.json(routes);
});

if (!module.parent) {
  app.listen(3000);
  console.log('Express started on port 3000');
}