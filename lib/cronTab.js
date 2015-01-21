var cronJob = require('cron').CronJob;
var request = require('request');
var loggly = require('loggly');
var config   = require('../config');

var loggly_client = loggly.createClient({
    token: config.loggly.token,
    subdomain: config.loggly.subdomain,
    auth: {
      username: config.loggly.username,
      password: config.loggly.password
    },
    json: true,
    tags: ['task']
  });


var cronTab = function() {
  this.jobs = {};
};

cronTab.prototype.add = function(job) {
  if (this.jobs[job._id]) return false;
  var cron = new cronJob(job.expression, function() {
    // FIXME: use a different process for the jobs
    request(job.url, function(error, response, body) {
      var status = 'success';

      if (error || response.statusCode != 200) {
        //console.log('error polling ' + job.url);
        status = 'error';
      } else {
        //console.log(body);
      }

      var results = {job:job, response: response, body: body};

      var tags = [];
      tags.push(status);
      
      if(job.name){
        tags.push(job.name);
      }

      loggly_client.log(results, tags, function (err, result) {
        // Do something once you've logged
        //console.log(arguments);
        if(err){
          console.log('error logging to loggly --->', err)
        }
      });

      
    });
  }, null, false);
  cron.start();
  this.jobs[job._id] = cron;
  return true;
}

cronTab.prototype.remove = function(job) {
  if (!this.jobs[job._id]) return false;
  this.jobs[job._id].stop();
  delete this.jobs[job._id];
  return true;
}

cronTab.prototype.update = function(job) {
  return this.removeJob(job) && this.addJob(job);
}

cronTab.prototype.togglePause = function(job) {
  if (!this.jobs[job._id]) return false;
  if (this.jobs[job._id].running) {
    this.jobs[job._id].stop();
  } else {
    this.jobs[job._id].start();
  }
  return true;
}

cronTab.prototype.removeAll = function() {
  var nbJobs = 0;
  for (id in this.jobs) {
    if (!this.remove(this.jobs[id])) return false;
    nbJobs++;
  }
  return nbJobs;
}

module.exports = new cronTab();