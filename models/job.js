var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// main model
var Job = new Schema({
  expression : String,
  url :        String,
  name : String,
  details : String,
  service_name: String,
  customer_id: String
});

module.exports = mongoose.model('Job', Job);