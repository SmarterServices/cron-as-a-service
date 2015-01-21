config = {};

config.mongodb = {
	server:   'c612.candidate.15.mongolayer.com:10612,c633.candidate.21.mongolayer.com:10633/cron?replicaSet=set-54bfc958b1289c45eb010917',
	  database: 'cron',
	  user:     'smarterservices',
	  password:	'Te3T1me$'
};

config.server = {port: 8200};

config.verbose = true;

config.loggly = {
	token: '75926b92-17f6-456b-bf3d-9a9ac39418ac',
    subdomain: 'logs-01',
    auth: {
      username: 'jason',
      password: 'decade'
    }
}

 


module.exports = config;